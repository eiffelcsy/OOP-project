import { ref, onUnmounted, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { patientsApi } from '@/services/patientsApi'
import type { QueueTicketResponse } from '@/services/patientsApi'

// Type for realtime payload
interface RealtimePayload {
    new: QueueTicketResponse
    old: QueueTicketResponse
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

// Create singleton instance to persist state across component remounts
const createPatientQueue = () => {
    const currentTicket = ref<QueueTicketResponse[]>([])
    const queueTickets = ref<QueueTicketResponse[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    
    // Subscription management
    let ticketChannel: any | null = null
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5
    let isReconnecting = false
    let reconnectTimeout: number | null = null
    let isIntentionalUnsubscribe = false
    let currentPatientId: number | null = null

    // Fetch queue info
    async function fetchPatientQueueInfo(patientId: number) {
        console.log('[PatientQueue] Fetching for patient:', patientId)
        if (!patientId) return

        isLoading.value = true
        error.value = null
        currentPatientId = patientId
        
        try {
            const response = await patientsApi.getPatientQueueInfo(patientId)
            
            if ('message' in response) {
                console.log('[PatientQueue] No active queue:', response.message)
                currentTicket.value = []
                queueTickets.value = []
                // Unsubscribe if no active queue
                unsubscribeFromQueueTickets()
                return
            }

            console.log('[PatientQueue] Queue data received:', response)
            
            // Always update the state, even if empty arrays
            currentTicket.value = response.current_ticket || []
            queueTickets.value = response.queue_tickets || []
            
            // Subscribe to realtime updates AFTER loading initial data
            // Only subscribe if we have active tickets
            if (response.current_ticket.length > 0) {
                subscribeToQueueTickets(patientId)
            } else {
                // If no active tickets, unsubscribe to clean up
                console.log('[PatientQueue] No active tickets, unsubscribing')
                unsubscribeFromQueueTickets()
            }
        } catch (e) {
            console.error('[PatientQueue] Error:', e)
            error.value = 'Failed to fetch queue information'
            // Clear state on error
            currentTicket.value = []
            queueTickets.value = []
        } finally {
            isLoading.value = false
        }
    }

    // Set up realtime subscription with proper filtering
    const subscribeToQueueTickets = (patientId: number) => {
        // Clear any pending reconnection attempts
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
        }
        
        // Mark as intentional unsubscribe before cleaning up
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
                    filter: `patient_id=eq.${patientId}` // Filter by patient_id
                },
                async (payload: any) => {
                    console.log('[PatientQueue] Realtime update received:', payload)
                    
                    try {
                        // Refresh the entire queue info for simplicity
                        // This ensures consistency with backend state
                        await fetchPatientQueueInfo(patientId)
                    } catch (e) {
                        console.error('[PatientQueue] Error handling realtime update:', e)
                        error.value = 'Failed to process queue update'
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
                    // Only reconnect if we still have tickets
                    if (currentTicket.value.length > 0) {
                        handleReconnection(patientId)
                    }
                }
            })
    }

    // Handle reconnection with exponential backoff
    const handleReconnection = (patientId: number) => {
        if (isReconnecting) {
            return
        }
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[PatientQueue] Max reconnection attempts reached')
            error.value = 'Connection lost. Please refresh the page.'
            isReconnecting = false
            return
        }
        
        isReconnecting = true
        reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
        
        console.log(`[PatientQueue] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
        
        reconnectTimeout = window.setTimeout(() => {
            // Only reconnect if we still have tickets
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

    // Handle visibility changes - resubscribe when tab becomes visible
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

    // Set up visibility change listener
    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    // Cleanup on unmount
    onUnmounted(() => {
        console.log('[PatientQueue] Cleaning up')
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        unsubscribeFromQueueTickets()
    })

    return {
        currentTicket,
        queueTickets,
        isLoading,
        error,
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