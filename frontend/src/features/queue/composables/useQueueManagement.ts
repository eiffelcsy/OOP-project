import { ref, computed, reactive } from 'vue'
import type { Tables } from '@/types/supabase'
import { queueApi, type QueueResponse } from '@/services/queueApi'

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

  // Queue management actions
  /**
   * Start a new queue
   * Creates a new queue in the database with clinic_id=2 and status=ACTIVE
   */
  const startQueue = async () => {
    try {
      const requestData: { clinicId: number; queueStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED' } = {
        clinicId: 2, // Hardcoded as per requirement
        queueStatus: 'ACTIVE' as const
      }
      
      console.log('Creating queue with request:', JSON.stringify(requestData))
      
      // Call backend API to create queue
      const queueResponse: QueueResponse = await queueApi.createQueue(requestData)

      // Update local state with response from backend
      queueState.isActive = true
      queueState.isPaused = false
      queueState.queueId = queueResponse.id
      queueState.startedAt = new Date(queueResponse.createdAt)
      queueState.endedAt = null

      console.log('Queue started successfully:', queueResponse)
    } catch (error) {
      console.error('Failed to start queue:', error)
      // Optionally show error notification to user
      alert('Failed to start queue. Please try again.')
      throw error
    }
  }

  const pauseQueue = () => {
    queueState.isPaused = true
  }

  const resumeQueue = () => {
    queueState.isPaused = false
  }

  const endQueue = async () => {
    try {
      // Update queue status to CLOSED in backend
      if (queueState.queueId) {
        await queueApi.updateQueue(queueState.queueId, {
          queueStatus: 'CLOSED'
        })
      }

      // Update local state
      queueState.isActive = false
      queueState.isPaused = false
      queueState.endedAt = new Date()

      console.log('Queue ended successfully')
    } catch (error) {
      console.error('Failed to end queue:', error)
      // Still update local state even if API call fails
      queueState.isActive = false
      queueState.isPaused = false
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
