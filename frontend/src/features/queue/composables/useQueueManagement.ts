import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import type { Tables } from '@/types/supabase'
import { queueApi, type QueueResponse, type CreateQueueRequest } from '@/services/queueApi'
import { queueTicketsApi, type QueueTicketResponse } from '@/services/queueTicketsApi'
import { useAuth } from '@/features/auth/composables/useAuth'
import { supabase } from '@/lib/supabase'

// Type aliases from database
type QueueTicket = Tables<'queue_tickets'>
type Patient = Tables<'patients'>
type QueuePriority = 'normal' | 'fast-track'
// Canonical display statuses per requirement
type QueueTicketStatus = 'Checked In' | 'Called' | 'Completed' | 'No Show'

// Queue state interface
interface QueueState {
  isActive: boolean
  isPaused: boolean
  currentNumber: number
  totalServed: number
  averageWaitTime: number
  queueId: number | null
  startedAt: Date | null
  endedAt: Date | null
}

// Extended interface for queue management UI
export interface QueuePatient {
  id: number
  queueNumber: number
  name: string
  appointmentTime: string
  status: QueueTicketStatus
  priority: QueuePriority
  estimatedTime?: string
  checkInTime?: string
  calledTime?: string
  // Additional fields from database
  patient_id?: number
  appointment_id?: number
  queue_id: number
  ticket_id: number
}

export function useQueueManagement() {
  // Get auth state for accessing current user's clinic
  const { currentUser, initializeAuth, refreshUser } = useAuth()

  // Queue state
  const queueState = reactive<QueueState>({
    isActive: false,
    isPaused: false,
    currentNumber: 0,
    totalServed: 0,
    averageWaitTime: 15,
    queueId: null,
    startedAt: null,
    endedAt: null
  })

  const patients = ref<QueuePatient[]>([])

  // Map DB priority (0/1) to UI categories
  const mapPriority = (p?: number | null): QueuePriority => (p === 1 ? 'fast-track' : 'normal')

  // Map DB ticket_status to UI status used in this page
  const mapStatus = (s?: string | null): QueueTicketStatus => {
    const raw = (s || 'Checked In').toLowerCase().replace(/[_-]/g, ' ')
    if (raw === 'waiting' || raw === 'checked in') return 'Checked In'
    if (raw === 'called') return 'Called'
    if (raw === 'completed') return 'Completed'
    if (raw === 'no show') return 'No Show'
    return 'Checked In'
  }

  // Load queue tickets and hydrate basic patient info
  const loadQueueTickets = async (queueId: number) => {
    const tickets: QueueTicketResponse[] = await queueTicketsApi.listByQueueId(queueId)

    const patientIds = Array.from(new Set(tickets.map(t => t.patient_id).filter((v): v is number => !!v)))
    const patientMap = new Map<number, { user_id: string | null; phone: string | null }>()
    const nameByUserId = new Map<string, string>()

    if (patientIds.length > 0) {
      const { data: patientsRows } = await supabase
        .from('patients')
        .select('id, user_id, phone')
        .in('id', patientIds)
      if (patientsRows) {
        patientsRows.forEach(r => patientMap.set(r.id, { user_id: r.user_id, phone: r.phone }))
        const userIds = Array.from(new Set(patientsRows.map(r => r.user_id).filter((u): u is string => !!u)))
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds)
          if (profiles) profiles.forEach(p => nameByUserId.set(p.user_id, p.full_name || ''))
        }
      }
    }

    const transformed: QueuePatient[] = tickets.map(t => {
      const patInfo = t.patient_id ? patientMap.get(t.patient_id) : undefined
      const fullName = patInfo?.user_id ? (nameByUserId.get(patInfo.user_id) || undefined) : undefined
      const status = mapStatus(t.ticket_status)
      const calledTimeStr = t.called_at ? new Date(t.called_at).toLocaleTimeString() : undefined
      const updatedTimeStr = t.updated_at ? new Date(t.updated_at).toLocaleTimeString() : undefined
      return {
        id: t.id,
        ticket_id: t.id,
        queue_id: t.queue_id,
        patient_id: t.patient_id ?? undefined,
        appointment_id: t.appointment_id ?? undefined,
        queueNumber: t.ticket_number,
        name: fullName || (t.patient_id ? `Patient #${t.patient_id}` : 'Walk-in'),
        // Display time: if Called -> called_at; if Checked In -> updated_at; otherwise '-'
        appointmentTime: status === 'Called' ? (calledTimeStr || '-') : (updatedTimeStr || '-'),
        status,
        priority: mapPriority(t.priority || 0),
        estimatedTime: undefined,
        checkInTime: t.created_at ? new Date(t.created_at).toLocaleTimeString() : undefined,
        calledTime: calledTimeStr,
      }
    })

    patients.value = transformed
  }

  // Computed properties
  const waitingPatients = computed(() => 
    patients.value.filter(p => p.status === 'Checked In')
  )

  const priorityPatients = computed(() => 
    waitingPatients.value.filter(p => p.priority === 'fast-track')
  )

  const normalPatients = computed(() => 
    waitingPatients.value.filter(p => p.priority === 'normal')
  )

  const currentPatient = computed(() => 
    patients.value.find(p => p.status === 'Called') || null
  )

  const hasCalledTicket = computed(() => patients.value.some(p => p.status === 'Called'))

  const completedToday = computed(() => 
    patients.value.filter(p => p.status === 'Completed').length
  )

  const noShowToday = computed(() => 
    patients.value.filter(p => p.status === 'No Show').length
  )

  // Helper function to get current user's clinic ID
  const getClinicId = (): number => {
    const clinicId = currentUser.value?.staff?.clinic_id
    if (!clinicId) {
      throw new Error('User is not associated with any clinic. Please contact your administrator.')
    }
    return clinicId
  }

  // Queue management actions
  /**
   * Initialize queue state by checking for existing active/paused queue
   * Called when the component mounts
   */
  const initializeQueueState = async () => {
    try {
      // Ensure auth/user is loaded before accessing clinic
      await initializeAuth()
      console.log('Initializing queue state...')
      const clinicId = getClinicId()
      console.log('Clinic ID:', clinicId)
      
      // Query for active or paused queues for this clinic
      const result = await queueApi.listQueues({
        clinicId: clinicId,
        statuses: ['ACTIVE', 'PAUSED'],
        size: 1,
        sortBy: 'created_at',
        sortDir: 'DESC'
      })

      console.log('List queues result:', result)

      if (result.data && result.data.length > 0) {
        const existingQueue = result.data[0]
        
  console.log('DEBUG: queue_status value:', existingQueue.queue_status)
  console.log('DEBUG: queue_status type:', typeof existingQueue.queue_status)
  console.log('DEBUG: Comparison result:', existingQueue.queue_status === 'PAUSED')
        
        // Update local state to reflect existing queue
        queueState.isActive = true
  queueState.isPaused = existingQueue.queue_status === 'PAUSED'
        queueState.queueId = existingQueue.id
  queueState.startedAt = new Date(existingQueue.created_at * 1000) // Convert Unix timestamp to Date
        queueState.endedAt = null

        console.log('Loaded existing queue:', existingQueue)
        console.log('Queue state updated:', {
          isActive: queueState.isActive,
          isPaused: queueState.isPaused,
          queueId: queueState.queueId
        })
  // Load tickets for this queue and subscribe to realtime updates
  await loadQueueTickets(existingQueue.id)
  subscribeToQueueTickets(existingQueue.id)
      } else {
        // No active queue found
        console.log('No active or paused queue found')
        queueState.isActive = false
        queueState.isPaused = false
        queueState.queueId = null
        queueState.startedAt = null
        queueState.endedAt = null
      }
    } catch (error) {
      console.error('Failed to initialize queue state:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      // Don't show alert on initialization failure, just log
    }
  }

  // Handle tab visibility changes: when returning to the tab, refresh auth and queue state
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      try {
        await refreshUser()
        await initializeQueueState()
      } catch (e) {
        console.warn('Failed to refresh after visibility change', e)
      }
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    unsubscribeQueueTickets()
  })

  /**
   * Start a new queue
   * Creates a new queue in the database using the authenticated user's clinic_id
   */
  const startQueue = async () => {
    try {
      // Get the authenticated user's clinic_id
      const clinicId = getClinicId()
      
      // Backend CreateQueueRequest explicitly expects camelCase fields via @JsonProperty
      const requestData: CreateQueueRequest = {
        clinicId: clinicId,
        queueStatus: 'ACTIVE'
      }
      
      console.log('Creating queue with request:', JSON.stringify(requestData))
      
      // Call backend API to create queue
      const queueResponse: QueueResponse = await queueApi.createQueue(requestData)

      // Update local state with response from backend
      queueState.isActive = true
      queueState.isPaused = false
      queueState.queueId = queueResponse.id
  // Backend returns snake_case fields in JSON
  queueState.startedAt = new Date(queueResponse.created_at * 1000)
      queueState.endedAt = null

  console.log('Queue started successfully:', queueResponse)

  // Load tickets for the newly started queue and subscribe to realtime updates
  await loadQueueTickets(queueResponse.id)
  subscribeToQueueTickets(queueResponse.id)
    } catch (error) {
      console.error('Failed to start queue:', error)
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          alert('You must be logged in to start a queue. Please sign in and try again.')
        } else if (error.message.includes('not associated with any clinic')) {
          alert(error.message)
        } else {
          alert(`Failed to start queue: ${error.message}`)
        }
      } else {
        alert('Failed to start queue. Please try again.')
      }
      throw error
    }
  }

  const pauseQueue = async () => {
    try {
      console.log('Pausing queue...', queueState.queueId)
      if (!queueState.queueId) {
        throw new Error('No active queue to pause')
      }

      // Update queue status to PAUSED in backend
      // Backend expects snake_case property names
      const updateRequest = {
        queueStatus: 'PAUSED' as const
      }
      console.log('Sending update request:', updateRequest)
      
      const updatedQueue = await queueApi.updateQueue(queueState.queueId, updateRequest)
      console.log('Queue paused successfully:', updatedQueue)

      // Update local state
      queueState.isPaused = true

    } catch (error) {
      console.error('Failed to pause queue:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      alert('Failed to pause queue. Please try again.')
      throw error
    }
  }

  const resumeQueue = async () => {
    try {
      console.log('Resuming queue...', queueState.queueId)
      if (!queueState.queueId) {
        throw new Error('No paused queue to resume')
      }

      // Update queue status to ACTIVE in backend
      // Backend expects snake_case property names
      const updateRequest = {
        queueStatus: 'ACTIVE' as const
      }
      console.log('Sending update request:', updateRequest)
      
      const updatedQueue = await queueApi.updateQueue(queueState.queueId, updateRequest)
      console.log('Queue resumed successfully:', updatedQueue)

      // Update local state
      queueState.isPaused = false

    } catch (error) {
      console.error('Failed to resume queue:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      alert('Failed to resume queue. Please try again.')
      throw error
    }
  }

  const endQueue = async () => {
    try {
      // If there are pending patients, prompt the user to decide
      const pending = patients.value.filter(p => p.status === 'Checked In' || p.status === 'Called')
      if (pending.length > 0) {
        const choice = window.prompt(
          `There are still ${pending.length} patients in the queue. Type one of: cancel | no-show | completed`,
          'cancel'
        )
        if (!choice || choice.toLowerCase() === 'cancel') {
          return
        }
        const nowIso = new Date().toISOString()
        if (choice.toLowerCase() === 'no-show') {
          await Promise.all(
            pending.map(p => queueTicketsApi.update(p.ticket_id, { ticket_status: 'No Show', no_show_at: nowIso }))
          )
        } else if (choice.toLowerCase() === 'completed') {
          await Promise.all(
            pending.map(p => queueTicketsApi.update(p.ticket_id, { ticket_status: 'Completed', completed_at: nowIso }))
          )
        } else {
          return
        }
      }

      if (queueState.queueId) {
        await queueApi.updateQueue(queueState.queueId, { queueStatus: 'CLOSED' })
      }

      // Clear local tickets and state
      patients.value = []
      queueState.isActive = false
      queueState.isPaused = false
      queueState.queueId = null
      queueState.endedAt = new Date()

      // Unsubscribe from realtime
      unsubscribeQueueTickets()

      console.log('Queue ended successfully')
    } catch (error) {
      console.error('Failed to end queue:', error)
      alert('Failed to end queue. Please try again.')
      // Still update local state even if API call fails
      queueState.isActive = false
      queueState.isPaused = false
      queueState.queueId = null
      queueState.endedAt = new Date()
    }
  }

  // Realtime: subscribe/unsubscribe helpers
  let ticketsChannel: any | null = null
  const subscribeToQueueTickets = (qid: number) => {
    unsubscribeQueueTickets()
    ticketsChannel = supabase
      .channel(`queue_tickets_${qid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets', filter: `queue_id=eq.${qid}` }, async () => {
        await loadQueueTickets(qid)
      })
      .subscribe()
  }

  const unsubscribeQueueTickets = () => {
    if (ticketsChannel) {
      try { ticketsChannel.unsubscribe() } catch {}
      ticketsChannel = null
    }
  }

  const callNext = async () => {
    if (queueState.isPaused || hasCalledTicket.value) return
    // Determine eligible: not Completed/No Show/Called => essentially 'Checked In'
    const eligible = patients.value
      .filter(p => p.status === 'Checked In')
      .sort((a, b) => {
        // priority fast-track first (1), then by id asc
        const pa = pToPriorityNum(a.priority)
        const pb = pToPriorityNum(b.priority)
        if (pa !== pb) return pb - pa
        return a.id - b.id
      })

    const next = eligible[0]
    if (!next) return

    await updatePatientStatus(next.id, 'Called', { setCalledAtNow: true })
    queueState.currentNumber = next.queueNumber
  }

  const pToPriorityNum = (p: QueuePriority): number => (p === 'fast-track' ? 1 : 0)

  const updatePatientStatus = async (
    patientId: number,
    status: QueueTicketStatus | 'checked-in' | 'called' | 'completed' | 'no-show',
    opts?: { setCalledAtNow?: boolean; setCompletedAtNow?: boolean; setNoShowAtNow?: boolean }
  ) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (!patient) return
    const nowIso = new Date().toISOString()
    // Normalize legacy lowercase statuses to canonical labels
    const normalized: QueueTicketStatus =
      status === 'checked-in' ? 'Checked In' :
      status === 'called' ? 'Called' :
      status === 'completed' ? 'Completed' :
      status === 'no-show' ? 'No Show' : status
    const payload: any = { ticket_status: normalized }
    if (opts?.setCalledAtNow) payload.called_at = nowIso
    if (opts?.setCompletedAtNow) payload.completed_at = nowIso
    if (opts?.setNoShowAtNow) payload.no_show_at = nowIso

    // Persist to backend
    await queueTicketsApi.update(patient.ticket_id, payload)

    // Update local state
    patient.status = normalized
    if (opts?.setCalledAtNow) patient.calledTime = new Date().toLocaleTimeString()
  }

  const moveToFastTrack = async (patientId: number) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (!patient) return
    await queueTicketsApi.update(patient.ticket_id, { priority: 1 })
    patient.priority = 'fast-track'
  }

  const removeFromFastTrack = async (patientId: number) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (!patient) return
    await queueTicketsApi.update(patient.ticket_id, { priority: 0 })
    patient.priority = 'normal'
  }

  // Reset queue for new day
  const resetQueue = () => {
    queueState.isActive = false
    queueState.isPaused = false
    queueState.currentNumber = 0
    queueState.totalServed = 0
    queueState.queueId = null
    queueState.startedAt = null
    queueState.endedAt = null
    patients.value.forEach(p => {
      if (p.status !== 'Completed' && p.status !== 'No Show') {
        p.status = 'Checked In'
        p.checkInTime = undefined
        p.calledTime = undefined
      }
    })
  }

  return {
    // State
    queueState,
    patients,
    
    // Computed
    waitingPatients,
    priorityPatients,
    normalPatients,
    currentPatient,
    hasCalledTicket,
    completedToday,
    noShowToday,
    
    // Actions
    initializeQueueState,
    startQueue,
    pauseQueue,
    resumeQueue,
    endQueue,
    callNext,
    updatePatientStatus,
    moveToFastTrack,
    removeFromFastTrack,
    resetQueue
  }
}
