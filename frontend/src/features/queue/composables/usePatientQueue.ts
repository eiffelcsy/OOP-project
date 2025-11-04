import { ref, computed } from 'vue'
import { patientsApi } from '@/services/patientsApi'
import type { QueueTicketResponse } from '@/services/patientsApi'

export function usePatientQueue() {
    const currentTicket = ref<QueueTicketResponse[]>([])
    const queueTickets = ref<QueueTicketResponse[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Computed helpers to match dashboard needs
    const myTicket = computed(() => currentTicket.value?.[0] || null)
    const currentServing = computed(() => 
        queueTickets.value.filter(t => t.ticket_status === 'Called')
    )
    const waiting = computed(() => 
        queueTickets.value.filter(t => t.ticket_status === 'Checked In')
    )

    async function fetchPatientQueueInfo(patientId: number) {
        console.log('[PatientQueue] Fetching for patient:', patientId)
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

    return {
        // State
        currentTicket,
        queueTickets,
        isLoading,
        error,
        
        // Computed
        myTicket,
        currentServing,
        waiting,
        
        // Actions
        fetchPatientQueueInfo
    }
}