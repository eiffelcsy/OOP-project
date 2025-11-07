import { ref, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { patientsApi } from '@/services/patientsApi'
import type { QueueTicketResponse } from '@/services/patientsApi'

export function usePatientQueue() {
    const currentTicket = ref<QueueTicketResponse[]>([])
    const queueTickets = ref<QueueTicketResponse[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Type for realtime payload
    interface RealtimePayload {
        new: QueueTicketResponse
        old: QueueTicketResponse
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    }

    // Add function to check if update affects current queue
    const shouldRefreshQueue = (payload: RealtimePayload) => {
        const currentTickets = currentTicket.value
        if (!currentTickets.length) return false

        const updatedTicket = payload.new
        
        // Also check for deletion case
        if (payload.eventType === 'DELETE') {
            return currentTickets.some(ticket => 
                ticket.queue_id === payload.old.queue_id
            )
        }

        return currentTickets.some(ticket => 
            ticket.queue_id === updatedTicket.queue_id
        )
    }

    // Fetch queue info
    async function fetchPatientQueueInfo(patientId: number) {
        console.log('[PatientQueue] Fetching for patient:', patientId)
        if (!patientId) return

        isLoading.value = true
        error.value = null
        
        try {
            const response = await patientsApi.getPatientQueueInfo(patientId)
            
            if ('message' in response) {
                console.log('[PatientQueue] No active queue:', response.message)
                currentTicket.value = []
                queueTickets.value = []
                return
            }

            console.log('[PatientQueue] Queue data received:', response)
            currentTicket.value = response.current_ticket
            queueTickets.value = response.queue_tickets
        } catch (e) {
            console.error('[PatientQueue] Error:', e)
            error.value = 'Failed to fetch queue information'
        } finally {
            isLoading.value = false
        }
    }

    // Set up realtime subscription
    const subscription = supabase
        .channel('queue_tickets_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'queue_tickets'
            },
            async (payload: RealtimePayload) => {
                console.log('[PatientQueue] Realtime update received:', payload)
                
                try {
                    if (shouldRefreshQueue(payload)) {
                        console.log('[PatientQueue] Refreshing queue data...')
                        const patientId = currentTicket.value[0]?.patient_id
                        if (patientId) {
                            await fetchPatientQueueInfo(patientId)
                        }
                    }
                } catch (e) {
                    console.error('[PatientQueue] Error handling realtime update:', e)
                    error.value = 'Failed to process queue update'
                }
            }
        )
        .subscribe((status) => {
            console.log('[PatientQueue] Subscription status:', status)
        })

    // Cleanup subscription
    onUnmounted(() => {
        console.log('[PatientQueue] Cleaning up realtime subscription')
        subscription.unsubscribe()
    })

    return {
        currentTicket,
        queueTickets,
        isLoading,
        error,
        fetchPatientQueueInfo
    }
}