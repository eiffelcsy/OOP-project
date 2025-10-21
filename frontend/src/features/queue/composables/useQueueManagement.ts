import { ref, computed, reactive } from 'vue'
import type { Tables } from '@/types/supabase'
import { queueApi, type QueueResponse, type CreateQueueRequest } from '@/services/queueApi'
import { useAuth } from '@/features/auth/composables/useAuth'

// Type aliases from database
type QueueTicket = Tables<'queue_tickets'>
type Patient = Tables<'patients'>
type QueuePriority = 'normal' | 'elderly' | 'emergency' | 'fast-track'
type QueueTicketStatus = 'checked-in' | 'called' | 'in-progress' | 'completed' | 'no-show'

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
  const { currentUser, initializeAuth } = useAuth()

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

  // Dummy patient data (using database-aligned structure)
  const patients = ref<QueuePatient[]>([
    {
      id: 1,
      ticket_id: 1,
      queue_id: 1,
      patient_id: 1,
      appointment_id: 1,
      queueNumber: 1,
      name: 'John Smith',
      appointmentTime: '09:00',
      status: 'checked-in', // Using QueueTicketStatus
      priority: 'normal',
      estimatedTime: '09:15',
      checkInTime: '08:45'
    },
    {
      id: 2,
      ticket_id: 2,
      queue_id: 1,
      patient_id: 2,
      appointment_id: 2,
      queueNumber: 2,
      name: 'Emily Johnson',
      appointmentTime: '09:30',
      status: 'checked-in',
      priority: 'elderly',
      estimatedTime: '09:45'
    },
    {
      id: 3,
      ticket_id: 3,
      queue_id: 1,
      patient_id: 3,
      appointment_id: 3,
      queueNumber: 3,
      name: 'Michael Brown',
      appointmentTime: '10:00',
      status: 'checked-in',
      priority: 'emergency',
      estimatedTime: '10:15'
    },
    {
      id: 4,
      ticket_id: 4,
      queue_id: 1,
      patient_id: 4,
      appointment_id: 4,
      queueNumber: 4,
      name: 'Sarah Davis',
      appointmentTime: '10:30',
      status: 'checked-in',
      priority: 'normal',
      estimatedTime: '10:45'
    },
    {
      id: 5,
      ticket_id: 5,
      queue_id: 1,
      patient_id: 5,
      appointment_id: 5,
      queueNumber: 5,
      name: 'Robert Wilson',
      appointmentTime: '11:00',
      status: 'checked-in',
      priority: 'normal',
      estimatedTime: '11:15'
    },
    {
      id: 6,
      ticket_id: 6,
      queue_id: 1,
      patient_id: 6,
      appointment_id: 6,
      queueNumber: 6,
      name: 'Lisa Anderson',
      appointmentTime: '11:30',
      status: 'checked-in',
      priority: 'elderly',
      estimatedTime: '11:45'
    }
  ])

  // Computed properties
  const waitingPatients = computed(() => 
    patients.value.filter(p => p.status === 'checked-in')
  )

  const priorityPatients = computed(() => 
    waitingPatients.value.filter(p => p.priority === 'emergency' || p.priority === 'elderly' || p.priority === 'fast-track')
  )

  const normalPatients = computed(() => 
    waitingPatients.value.filter(p => p.priority === 'normal')
  )

  const currentPatient = computed(() => 
    patients.value.find(p => p.status === 'checked-in' || p.status === 'in-progress')
  )

  const completedToday = computed(() => 
    patients.value.filter(p => p.status === 'completed').length
  )

  const noShowToday = computed(() => 
    patients.value.filter(p => p.status === 'no-show').length
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
      // Update queue status to CLOSED in backend
      // Backend expects snake_case property names
      if (queueState.queueId) {
        await queueApi.updateQueue(queueState.queueId, {
          queueStatus: 'CLOSED'
        })
      }

      // Update local state - reset everything as queue is now closed
      queueState.isActive = false
      queueState.isPaused = false
      queueState.queueId = null
      queueState.endedAt = new Date()

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

  const callNext = () => {
    if (queueState.isPaused) return

    // Find the next patient to call (priority first, then by queue number)
    const nextPatient = priorityPatients.value.length > 0 
      ? priorityPatients.value.sort((a, b) => a.queueNumber - b.queueNumber)[0]
      : normalPatients.value.sort((a, b) => a.queueNumber - b.queueNumber)[0]

    if (nextPatient) {
      // Mark current patient as completed if exists
      if (currentPatient.value) {
        updatePatientStatus(currentPatient.value.id, 'completed')
      }

      // Call next patient
      updatePatientStatus(nextPatient.id, 'called')
      nextPatient.calledTime = new Date().toLocaleTimeString()
      queueState.currentNumber = nextPatient.queueNumber
      queueState.totalServed++
    }
  }

  const updatePatientStatus = (patientId: number, status: QueueTicketStatus) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (patient) {
      patient.status = status
      if (status === 'checked-in') {
        patient.checkInTime = new Date().toLocaleTimeString()
      }
    }
  }

  const moveToFastTrack = (patientId: number) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (patient) {
      patient.priority = 'fast-track'
    }
  }

  const removeFromFastTrack = (patientId: number) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (patient && patient.priority === 'fast-track') {
      patient.priority = 'normal'
    }
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
      if (p.status !== 'completed' && p.status !== 'no-show') {
        p.status = 'checked-in'
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
