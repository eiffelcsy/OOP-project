import { ref, computed, onUnmounted, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { patientsApi } from '@/services/patientsApi'
import { appointmentsApi } from '@/services/appointmentsApi'
import { doctorsApi } from '@/services/doctorsApi'
import type { QueueTicketResponse } from '@/services/patientsApi'

interface DoctorAndClinicDetails {
    id: number
    name: string
    clinicId: number | null
    clinicName: string | null
}

// Create singleton instance to persist state across component remounts
const createPatientQueue = () => {
    // Queue ticket state
    const currentTicket = ref<QueueTicketResponse[]>([])
    const queueTickets = ref<QueueTicketResponse[]>([])
    const isLoadingQueue = ref(false)
    const queueError = ref<string | null>(null)
    
    // Doctor details state
    const doctorDetails = ref(new Map<number, DoctorAndClinicDetails>())
    const isLoadingDoctors = ref(false)
    const doctorsError = ref<string | null>(null)
    
    // Combined loading state
    const isLoading = computed(() => isLoadingQueue.value || isLoadingDoctors.value)
    const error = computed(() => queueError.value || doctorsError.value)
    
    // Subscription management
    let ticketChannel: any | null = null
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5
    let isReconnecting = false
    let reconnectTimeout: number | null = null
    let isIntentionalUnsubscribe = false
    let currentPatientId: number | null = null

    // Fetch doctor details for current tickets
    async function fetchDoctorDetails() {
        console.log('[PatientQueue] Fetching doctor details for tickets:', currentTicket.value)
        
        // Clear and return early if no tickets
        if (!currentTicket.value || currentTicket.value.length === 0) {
            console.log('[PatientQueue] No tickets, clearing doctor details')
            doctorDetails.value.clear()
            return
        }

        isLoadingDoctors.value = true
        doctorsError.value = null
        doctorDetails.value.clear()

        try {
            for (const ticket of currentTicket.value) {
                try {
                    console.log('[PatientQueue] Processing ticket for doctor details:', ticket.id)
                    
                    // Get appointment to find doctor_id and clinic info
                    const appointments = await appointmentsApi.getPatientAppointments()
                    const appointment = appointments.find(a => a.id === ticket.appointment_id)
                    
                    if (appointment?.doctor_id) {
                        // Fetch doctor details
                        const doctor = await doctorsApi.getDoctorById(appointment.doctor_id)
                        doctorDetails.value.set(ticket.id, {
                            id: doctor.id,
                            name: doctor.name,
                            clinicId: appointment.clinic_id || null,
                            clinicName: appointment.clinic_name ?? 'Main Clinic'
                        })
                        console.log('[PatientQueue] Added doctor details:', {
                            ticketId: ticket.id,
                            doctorName: doctor.name,
                            clinicName: appointment.clinic_name
                        })
                    } else {
                        console.warn('[PatientQueue] No doctor_id for appointment:', ticket.appointment_id)
                    }
                } catch (e) {
                    console.error('[PatientQueue] Error fetching details for ticket:', ticket.id, e)
                    doctorsError.value = 'Failed to fetch some doctor details'
                }
            }
            console.log('[PatientQueue] Doctor details fetch complete')
        } catch (e) {
            console.error('[PatientQueue] Fatal error fetching doctor details:', e)
            doctorsError.value = 'Failed to fetch doctor information'
        } finally {
            isLoadingDoctors.value = false
        }
    }

    // Fetch queue info and doctor details
    async function fetchPatientQueueInfo(patientId: number) {
        console.log('[PatientQueue] Fetching queue info for patient:', patientId)
        if (!patientId) return

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
                unsubscribeFromQueueTickets()
                return
            }

            console.log('[PatientQueue] Queue data received:', response)
            
            // Update queue state
            currentTicket.value = response.current_ticket || []
            queueTickets.value = response.queue_tickets || []
            
            // Fetch doctor details for the tickets
            if (currentTicket.value.length > 0) {
                await fetchDoctorDetails()
                subscribeToQueueTickets(patientId)
            } else {
                console.log('[PatientQueue] No active tickets, unsubscribing')
                doctorDetails.value.clear()
                unsubscribeFromQueueTickets()
            }
        } catch (e) {
            console.error('[PatientQueue] Error:', e)
            queueError.value = 'Failed to fetch queue information'
            currentTicket.value = []
            queueTickets.value = []
            doctorDetails.value.clear()
        } finally {
            isLoadingQueue.value = false
        }
    }

    // Set up realtime subscription
    const subscribeToQueueTickets = (patientId: number) => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
        }
        
        isIntentionalUnsubscribe = true
        unsubscribeFromQueueTickets()
        isIntentionalUnsubscribe = false
        
        console.log('[PatientQueue] Subscribing to queue tickets for patient:', patientId)
        
        ticketChannel = supabase
            .channel(`patient_queue_${patientId}`, {
                config: {
                    broadcast: { self: false },
                    presence: { key: '' }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queue_tickets',
                    filter: `patient_id=eq.${patientId}`
                },
                async (payload: any) => {
                    console.log('[PatientQueue] Realtime update received:', payload)
                    
                    try {
                        await fetchPatientQueueInfo(patientId)
                    } catch (e) {
                        console.error('[PatientQueue] Error handling realtime update:', e)
                        queueError.value = 'Failed to process queue update'
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('[PatientQueue] Subscription status:', status)
                
                if (status === 'SUBSCRIBED') {
                    reconnectAttempts = 0
                    isReconnecting = false
                }
                
                if (status === 'CHANNEL_ERROR' && !isReconnecting) {
                    console.error('[PatientQueue] Channel error:', err)
                    handleReconnection(patientId)
                }
                
                if (status === 'TIMED_OUT' && !isReconnecting) {
                    console.error('[PatientQueue] Channel timed out')
                    handleReconnection(patientId)
                }
                
                if (status === 'CLOSED' && !isReconnecting && !isIntentionalUnsubscribe) {
                    console.warn('[PatientQueue] Channel closed unexpectedly')
                    if (currentTicket.value.length > 0) {
                        handleReconnection(patientId)
                    }
                }
            })
    }

    // Handle reconnection with exponential backoff
    const handleReconnection = (patientId: number) => {
        if (isReconnecting) return
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[PatientQueue] Max reconnection attempts reached')
            queueError.value = 'Connection lost. Please refresh the page.'
            isReconnecting = false
            return
        }
        
        isReconnecting = true
        reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
        
        console.log(`[PatientQueue] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
        
        reconnectTimeout = window.setTimeout(() => {
            if (currentTicket.value.length > 0) {
                subscribeToQueueTickets(patientId)
            } else {
                console.log('[PatientQueue] No active tickets, cancelling reconnection')
                isReconnecting = false
            }
        }, delay)
    }

    // Cleanup subscription
    const unsubscribeFromQueueTickets = () => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
        }
        
        isReconnecting = false
        reconnectAttempts = 0
        
        if (ticketChannel) {
            try {
                console.log('[PatientQueue] Unsubscribing from realtime channel')
                if (!isIntentionalUnsubscribe) {
                    isIntentionalUnsubscribe = true
                }
                ticketChannel.unsubscribe()
                setTimeout(() => {
                    isIntentionalUnsubscribe = false
                }, 100)
            } catch (e) {
                console.error('[PatientQueue] Error unsubscribing:', e)
                isIntentionalUnsubscribe = false
            }
            ticketChannel = null
        }
    }

    // Handle visibility changes
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && currentPatientId) {
            console.log('[PatientQueue] Tab visible, refreshing data')
            try {
                await fetchPatientQueueInfo(currentPatientId)
            } catch (e) {
                console.warn('[PatientQueue] Failed to refresh on visibility change', e)
            }
        }
    }

    // Computed getters for doctor details
    const getDoctorName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.name ?? 'Not available'
    )

    const getClinicName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.clinicName ?? 'Clinic info unavailable'
    )

    // Lifecycle hooks
    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    onUnmounted(() => {
        console.log('[PatientQueue] Cleaning up')
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        unsubscribeFromQueueTickets()
    })

    return {
        // Queue state
        currentTicket,
        queueTickets,
        isLoading,
        error,
        
        // Doctor details
        doctorDetails,
        getDoctorName,
        getClinicName,
        
        // Methods
        fetchPatientQueueInfo
    }
}

// Singleton instance
let patientQueueInstance: ReturnType<typeof createPatientQueue> | null = null

export function usePatientQueue() {
    if (!patientQueueInstance) {
        console.log('[usePatientQueue] Creating new singleton instance')
        patientQueueInstance = createPatientQueue()
    } else {
        console.log('[usePatientQueue] Reusing existing singleton instance')
    }
    return patientQueueInstance
}