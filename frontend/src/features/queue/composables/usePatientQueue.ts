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
 */
const createPatientQueue = () => {
    // ==================== STATE ====================
    
    // Queue data
    const currentTicket = ref<QueueTicketResponse[]>([])
    const queueTickets = ref<QueueTicketResponse[]>([])
    const isLoadingQueue = ref(false)
    const queueError = ref<string | null>(null)
    
    // Doctor and clinic information
    const doctorDetails = ref(new Map<number, DoctorAndClinicDetails>())
    const isLoadingDoctors = ref(false)
    const doctorsError = ref<string | null>(null)
    
    const isLoading = computed(() => isLoadingQueue.value || isLoadingDoctors.value)
    const error = computed(() => queueError.value || doctorsError.value)
    
    // Real-time subscription management
    let ticketChannel: RealtimeChannel | null = null
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5
    let isReconnecting = false
    let reconnectTimeout: number | null = null
    let isIntentionalUnsubscribe = false // Prevents reconnection during manual unsubscribe
    let currentPatientId: number | null = null
    const activeQueueIds = ref<Set<number>>(new Set()) // Track which queues to monitor
    
    // Debounce to prevent duplicate API calls from rapid real-time updates
    let refreshTimeout: number | null = null
    let isFetchingQueue = false

    // Visibility change handler - refresh when tab becomes visible
    let visibilityHandler: (() => void) | null = null

    // ==================== COMPUTED ====================

    const currentServing = computed(() => 
        queueTickets.value.filter(t => t.ticket_status === 'Called')
    )

    /**
     * Calculate position in queue considering priority tickets
     * Priority tickets are served first, then normal tickets by ticket number
     */
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
        return Math.min(Math.max(progress, 5), 100) // Clamp between 5-100%
    }

    // ==================== DATA FETCHING ====================

    /**
     * Fetch doctor and clinic details for all current tickets
     * Resolves appointment -> doctor -> clinic information
     */
    async function fetchDoctorDetails() {
        console.log('[PatientQueue] Fetching doctor details for tickets:', currentTicket.value)
        
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
                    
                    const appointments = await appointmentsApi.getPatientAppointments()
                    const appointment = appointments.find(a => a.id === ticket.appointment_id)
                    
                    if (appointment?.doctor_id) {
                        // Fetch doctor details
                        const doctor = await patientDoctorsApi.getDoctorById(appointment.doctor_id)
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

    /**
     * Debounced refresh - batches rapid real-time updates into single API call
     * Retries if a fetch is already in progress
     */
    const debouncedRefresh = (patientId: number) => {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout)
        }
        
        refreshTimeout = window.setTimeout(async () => {
            if (isFetchingQueue) {
                console.log('[PatientQueue] Fetch in progress, will retry after delay')
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
     * Main data fetching function
     * Gets patient's queue tickets and sets up real-time subscription
     */
    async function fetchPatientQueueInfo(patientId: number) {
        console.log('[PatientQueue] Fetching queue info for patient:', patientId)
        if (!patientId) return
        
        if (isFetchingQueue) {
            console.log('[PatientQueue] Already fetching, skipping duplicate call')
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
                await unsubscribeFromQueueTickets()
                return
            }

            console.log('[PatientQueue] Queue data received:', response)
            
            currentTicket.value = response.current_ticket || []
            queueTickets.value = response.queue_tickets || []
            
            if (currentTicket.value.length > 0) {
                await fetchDoctorDetails()
                await subscribeToQueueTickets(patientId)
            } else {
                console.log('[PatientQueue] No active tickets, unsubscribing')
                doctorDetails.value.clear()
                await unsubscribeFromQueueTickets()
            }
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
     * Exponential backoff reconnection strategy
     * Delays: 1s, 2s, 4s, 8s, 16s, max 30s
     */
    const handleReconnection = (patientId: number) => {
        if (isReconnecting) {
            console.log('[PatientQueue] Already reconnecting, skipping')
            return
        }
        
        reconnectAttempts++
        
        if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            console.error('[PatientQueue] Max reconnection attempts reached')
            queueError.value = 'Connection lost. Please refresh the page.'
            isReconnecting = false
            return
        }
        
        isReconnecting = true
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
        
        console.log(`[PatientQueue] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
        
        reconnectTimeout = window.setTimeout(async () => {
            try {
                await unsubscribeFromQueueTickets()
                await fetchPatientQueueInfo(patientId)
                isReconnecting = false
                reconnectAttempts = 0
            } catch (e) {
                console.error('[PatientQueue] Reconnection failed:', e)
                isReconnecting = false
                handleReconnection(patientId)
            }
        }, delay)
    }

    /**
     * Subscribe to all queue_tickets changes, filter client-side
     * Monitors: 1) Patient's own tickets, 2) All tickets in patient's queue(s)
     */
    const subscribeToQueueTickets = async (patientId: number) => {
        if (ticketChannel && currentPatientId === patientId) {
            console.log('[PatientQueue] Already subscribed for this patient')
            return
        }
        
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
        }
        
        await unsubscribeFromQueueTickets()
        
        console.log('[PatientQueue] Subscribing to queue tickets for patient:', patientId)
    
        const queueIds = currentTicket.value
            .map(t => t.queue_id)
            .filter(id => id != null) as number[]

        activeQueueIds.value = new Set(queueIds)
        
        ticketChannel = supabase
            .channel(`queue_tickets_patient_${patientId}`, {
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
                    table: 'queue_tickets'
                    // No server filter - listen to ALL tickets, filter client-side for reliability
                },
                (payload: any) => {
                    try {
                        // Check if update affects this patient's tickets
                        const newTicket = payload.new
                        const oldTicket = payload.old
                        
                        // Check if update affects queues this patient is in
                        const isPatientTicket = 
                            newTicket?.patient_id === patientId || 
                            oldTicket?.patient_id === patientId
                        
                        // For queue updates - check if it's in our monitored queues
                        const affectedQueueId = newTicket?.queue_id || oldTicket?.queue_id
                        const isInOurQueue = affectedQueueId && activeQueueIds.value.has(affectedQueueId)
                        
                        if (isPatientTicket || isInOurQueue) {
                            console.log('[PatientQueue] Ticket update:', payload.eventType, 
                                'ticket:', newTicket?.ticket_number || oldTicket?.ticket_number,
                                'queue_id:', affectedQueueId,
                                'patient_id:', newTicket?.patient_id || oldTicket?.patient_id
                            )
                            debouncedRefresh(patientId)
                        }
                    } catch (err) {
                        console.error('[PatientQueue] Error processing realtime update:', err)
                        debouncedRefresh(patientId) // Refresh on error to be safe
                    }
                }
            )
            .subscribe((status, err) => {
                handleSubscriptionStatus(status, err, patientId, 'ticket')
            })
    }

    const handleSubscriptionStatus = (status: string, err: any, patientId: number, type: 'ticket') => {
        console.log(`[PatientQueue] ${type} subscription status:`, status)
        
        if (status === 'SUBSCRIBED') {
            reconnectAttempts = 0
            isReconnecting = false
        }
        
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !isReconnecting) {
            console.error(`[PatientQueue] ${type} channel error:`, err || status)
            handleReconnection(patientId)
        }
        
        if (status === 'CLOSED' && !isReconnecting && !isIntentionalUnsubscribe) {
            console.warn(`[PatientQueue] ${type} channel closed unexpectedly`)
            if (currentTicket.value.length > 0) {
                handleReconnection(patientId)
            }
        }
    }

    const unsubscribeFromQueueTickets = async () => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
        }
        
        if (refreshTimeout) {
            clearTimeout(refreshTimeout)
            refreshTimeout = null
        }
        
        isReconnecting = false
        reconnectAttempts = 0
        isIntentionalUnsubscribe = true
        
        if (ticketChannel) {
            console.log('[PatientQueue] Unsubscribing from ticket channel')
            await supabase.removeChannel(ticketChannel).catch(e => 
                console.error('[PatientQueue] Error removing ticket channel:', e)
            )
            ticketChannel = null
        }
        
        // Reset flag after delay to ensure cleanup completes
        setTimeout(() => {
            isIntentionalUnsubscribe = false
        }, 200)
    }

    // ==================== GETTERS ====================

    const getDoctorName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.name ?? 'Not available'
    )

    const getClinicName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.clinicName ?? 'Clinic info unavailable'
    )

    const cleanup = async () => {
        console.log('[PatientQueue] Manual cleanup called')
        await unsubscribeFromQueueTickets()
        currentPatientId = null

        // Remove visibility listener
        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler)
            visibilityHandler = null
        }
    }

    // Set up visibility change listener
    visibilityHandler = () => {
        if (!document.hidden && currentPatientId && currentTicket.value.length > 0) {
            console.log('[PatientQueue] Tab became visible, refreshing data')
            fetchPatientQueueInfo(currentPatientId)
        }
    }

    // Add listener when composable is created
    document.addEventListener('visibilitychange', visibilityHandler)
    
    return {
        // State
        currentTicket,
        queueTickets,
        isLoading,
        error,
        
        // Doctor/clinic details
        doctorDetails,
        getDoctorName,
        getClinicName,
        
        // Queue computations
        currentServing,
        calculatePosition,
        calculateProgress,
        
        // Methods
        fetchPatientQueueInfo,
        cleanup
    }
}

// ==================== SINGLETON EXPORT ====================

let patientQueueInstance: ReturnType<typeof createPatientQueue> | null = null

/**
 * Singleton composable for patient queue management
 * Maintains state across component remounts to preserve real-time subscriptions
 */

export function usePatientQueue() {
    if (!patientQueueInstance) {
        console.log('[usePatientQueue] Creating new singleton instance')
        patientQueueInstance = createPatientQueue()
    } else {
        console.log('[usePatientQueue] Reusing existing singleton instance')
    }
    return patientQueueInstance
}