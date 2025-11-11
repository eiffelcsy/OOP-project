import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { patientsApi } from '@/services/patientsApi'
import { appointmentsApi } from '@/services/appointmentsApi'
import { patientDoctorsApi } from '@/services/patientDoctorsApi'
import type { QueueTicketResponse } from '@/services/patientsApi'

interface DoctorAndClinicDetails {
    id: number
    name: string
    clinicId: number | null
    clinicName: string | null
}

/**
 * Patient Queue Management Composable
 * Singleton pattern - maintains state across component remounts for consistent real-time updates
 * 
 * Simple logic: Any update to patient's tickets → Refresh data
 */
const createPatientQueue = () => {
    // ==================== STATE ====================
    
    const currentTicket = ref<QueueTicketResponse[]>([])
    const queueTickets = ref<QueueTicketResponse[]>([])
    const isLoadingQueue = ref(false)
    const queueError = ref<string | null>(null)
    
    const doctorDetails = ref(new Map<number, DoctorAndClinicDetails>())
    const isLoadingDoctors = ref(false)
    const doctorsError = ref<string | null>(null)
    
    const isLoading = computed(() => isLoadingQueue.value || isLoadingDoctors.value)
    const error = computed(() => queueError.value || doctorsError.value)
    
    // Subscription management
    let ticketChannel: RealtimeChannel | null = null
    let currentPatientId: number | null = null
    
    // Debounce to prevent rapid duplicate calls
    let refreshTimeout: number | null = null
    let isFetchingQueue = false
    
    // Visibility change handler
    let visibilityHandler: (() => void) | null = null

    // ==================== COMPUTED ====================

    const currentServing = computed(() => 
        queueTickets.value.filter(t => t.ticket_status === 'Called')
    )

    const calculatePosition = (ticket: QueueTicketResponse) => {
        const allTickets = [...currentTicket.value, ...queueTickets.value]
        const waitingTickets = allTickets.filter(t => t.ticket_status === 'Checked In')
        
        const priorityTickets = waitingTickets
            .filter(t => t.priority === 1)
            .sort((a, b) => a.ticket_number - b.ticket_number)
        
        const normalTickets = waitingTickets
            .filter(t => t.priority !== 1 && t.priority !== true)
            .sort((a, b) => a.ticket_number - b.ticket_number)
        
        const combinedQueue = [...priorityTickets, ...normalTickets]
        const currentPosition = combinedQueue.findIndex(t => t.id === ticket.id)
        
        return currentPosition >= 0 ? currentPosition : 0
    }

    const calculateProgress = (ticket: QueueTicketResponse) => {
        const allTickets = [...currentTicket.value, ...queueTickets.value]
        const totalWaiting = allTickets.filter(t => t.ticket_status === 'Checked In').length
        
        if (totalWaiting === 0) return 100
        
        const position = calculatePosition(ticket)
        const progress = ((totalWaiting - position) / totalWaiting) * 100
        return Math.min(Math.max(progress, 5), 100)
    }

    // ==================== DATA FETCHING ====================

    async function fetchDoctorDetails() {
        if (!currentTicket.value || currentTicket.value.length === 0) {
            doctorDetails.value.clear()
            return
        }

        isLoadingDoctors.value = true
        doctorsError.value = null
        doctorDetails.value.clear()

        try {
            for (const ticket of currentTicket.value) {
                try {
                    const appointments = await appointmentsApi.getPatientAppointments()
                    const appointment = appointments.find(a => a.id === ticket.appointment_id)
                    
                    if (appointment?.doctor_id) {
                        const doctor = await patientDoctorsApi.getDoctorById(appointment.doctor_id)
                        doctorDetails.value.set(ticket.id, {
                            id: doctor.id,
                            name: doctor.name,
                            clinicId: appointment.clinic_id || null,
                            clinicName: appointment.clinic_name ?? 'Main Clinic'
                        })
                    }
                } catch (e) {
                    console.error('[PatientQueue] Error fetching doctor details:', e)
                }
            }
        } catch (e) {
            console.error('[PatientQueue] Fatal error fetching doctor details:', e)
            doctorsError.value = 'Failed to fetch doctor information'
        } finally {
            isLoadingDoctors.value = false
        }
    }

    /**
     * Debounced refresh - prevents duplicate calls from rapid updates
     */
    const debouncedRefresh = (patientId: number) => {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout)
        }
        
        refreshTimeout = window.setTimeout(async () => {
            if (isFetchingQueue) {
                console.log('[PatientQueue] Fetch in progress, will retry')
                debouncedRefresh(patientId)
                return
            }
            
            try {
                await fetchPatientQueueInfo(patientId)
            } finally {
                refreshTimeout = null
            }
        }, 500)
    }

    /**
     * Main fetch function - gets patient queue data
     */
    async function fetchPatientQueueInfo(patientId: number) {
        console.log('[PatientQueue] Fetching queue info for patient:', patientId)
        if (!patientId) return
        
        if (isFetchingQueue) {
            console.log('[PatientQueue] Already fetching, skipping')
            return
        }

        isFetchingQueue = true
        isLoadingQueue.value = true
        queueError.value = null
        currentPatientId = patientId
        
        try {
            const response = await patientsApi.getPatientQueueInfo(patientId)
            
            if ('message' in response) {
                console.log('[PatientQueue] No active queue:', response.message)
                currentTicket.value = []
                queueTickets.value = []
                doctorDetails.value.clear()
            } else {
                console.log('[PatientQueue] Queue data received:', response)
                currentTicket.value = response.current_ticket || []
                queueTickets.value = response.queue_tickets || []
                
                if (currentTicket.value.length > 0) {
                    await fetchDoctorDetails()
                } else {
                    doctorDetails.value.clear()
                }
            }

            // Always ensure subscription is active
            await subscribeToQueueTickets(patientId)

        } catch (e) {
            console.error('[PatientQueue] Error:', e)
            queueError.value = 'Failed to fetch queue information'
            currentTicket.value = []
            queueTickets.value = []
            doctorDetails.value.clear()
        } finally {
            isLoadingQueue.value = false
            isFetchingQueue = false
        }
    }

    // ==================== REAL-TIME SUBSCRIPTION ====================

    /**
     * Subscribe to queue_tickets table
     * Simple rule: If ticket belongs to this patient → Refresh
     */
    const subscribeToQueueTickets = async (patientId: number) => {
        // Already subscribed for this patient? Skip
        if (ticketChannel && currentPatientId === patientId) {
            console.log('[PatientQueue] Already subscribed')
            return
        }
        
        // Clean up old subscription
        await unsubscribeFromQueueTickets()
        
        console.log('[PatientQueue] Setting up subscription for patient:', patientId)
        
        ticketChannel = supabase
            .channel(`queue_tickets_patient_${patientId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queue_tickets'
                },
                (payload: any) => {
                    console.log('[PatientQueue] ===== REALTIME EVENT =====')
                    console.log('[PatientQueue] Event type:', payload.eventType)
                    console.log('[PatientQueue] Any queue_tickets change detected - Refreshing')
                    console.log('[PatientQueue] ============================')
                    
                    // Refresh on ANY change to queue_tickets table
                    debouncedRefresh(patientId)
                }
            )
            .subscribe((status) => {
                console.log('[PatientQueue] Subscription status:', status)
            })
    }

    const unsubscribeFromQueueTickets = async () => {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout)
            refreshTimeout = null
        }
        
        if (ticketChannel) {
            console.log('[PatientQueue] Unsubscribing')
            await supabase.removeChannel(ticketChannel).catch(console.error)
            ticketChannel = null
        }
    }

    // ==================== GETTERS ====================

    const getDoctorName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.name ?? 'Not available'
    )

    const getClinicName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.clinicName ?? 'Clinic info unavailable'
    )

    // ==================== CLEANUP ====================

    const cleanup = async () => {
        console.log('[PatientQueue] Cleanup')
        await unsubscribeFromQueueTickets()
        currentPatientId = null

        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler)
            visibilityHandler = null
        }
    }

    // ==================== VISIBILITY HANDLER ====================

    visibilityHandler = () => {
        if (!document.hidden && currentPatientId) {
            console.log('[PatientQueue] Tab visible, refreshing')
            fetchPatientQueueInfo(currentPatientId)
        }
    }

    document.addEventListener('visibilitychange', visibilityHandler)
    
    // ==================== RETURN ====================
    
    return {
        currentTicket,
        queueTickets,
        isLoading,
        error,
        doctorDetails,
        getDoctorName,
        getClinicName,
        currentServing,
        calculatePosition,
        calculateProgress,
        fetchPatientQueueInfo,
        cleanup
    }
}

// ==================== SINGLETON ====================

let patientQueueInstance: ReturnType<typeof createPatientQueue> | null = null

export function usePatientQueue() {
    if (!patientQueueInstance) {
        console.log('[usePatientQueue] Creating singleton instance')
        patientQueueInstance = createPatientQueue()
    }
    return patientQueueInstance
}