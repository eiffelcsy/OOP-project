import { ref, computed, reactive } from 'vue'

export interface Patient {
  id: string
  queueNumber: number
  name: string
  appointmentTime: string
  status: 'waiting' | 'called' | 'in-progress' | 'completed' | 'no-show' | 'checked-in'
  priority: 'normal' | 'emergency' | 'elderly' | 'fast-track'
  estimatedTime?: string
  checkInTime?: string
  calledTime?: string
}

export interface QueueState {
  isActive: boolean
  isPaused: boolean
  currentNumber: number
  totalServed: number
  averageWaitTime: number
  queueId: string | null
  startedAt: Date | null
  endedAt: Date | null
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

  // Dummy patient data
  const patients = ref<Patient[]>([
    {
      id: '1',
      queueNumber: 1,
      name: 'John Smith',
      appointmentTime: '09:00',
      status: 'checked-in',
      priority: 'normal',
      estimatedTime: '09:15',
      checkInTime: '08:45'
    },
    {
      id: '2',
      queueNumber: 2,
      name: 'Emily Johnson',
      appointmentTime: '09:30',
      status: 'waiting',
      priority: 'elderly',
      estimatedTime: '09:45'
    },
    {
      id: '3',
      queueNumber: 3,
      name: 'Michael Brown',
      appointmentTime: '10:00',
      status: 'waiting',
      priority: 'emergency',
      estimatedTime: '10:15'
    },
    {
      id: '4',
      queueNumber: 4,
      name: 'Sarah Davis',
      appointmentTime: '10:30',
      status: 'waiting',
      priority: 'normal',
      estimatedTime: '10:45'
    },
    {
      id: '5',
      queueNumber: 5,
      name: 'Robert Wilson',
      appointmentTime: '11:00',
      status: 'waiting',
      priority: 'normal',
      estimatedTime: '11:15'
    },
    {
      id: '6',
      queueNumber: 6,
      name: 'Lisa Anderson',
      appointmentTime: '11:30',
      status: 'waiting',
      priority: 'elderly',
      estimatedTime: '11:45'
    }
  ])

  // Computed properties
  const waitingPatients = computed(() => 
    patients.value.filter(p => p.status === 'waiting' || p.status === 'checked-in')
  )

  const priorityPatients = computed(() => 
    waitingPatients.value.filter(p => p.priority === 'emergency' || p.priority === 'elderly' || p.priority === 'fast-track')
  )

  const normalPatients = computed(() => 
    waitingPatients.value.filter(p => p.priority === 'normal')
  )

  const currentPatient = computed(() => 
    patients.value.find(p => p.status === 'called' || p.status === 'in-progress')
  )

  const completedToday = computed(() => 
    patients.value.filter(p => p.status === 'completed').length
  )

  const noShowToday = computed(() => 
    patients.value.filter(p => p.status === 'no-show').length
  )

  // Helper function to generate unique queue ID
  // TODO: generate queue ID in backend then fetch from database
  const generateQueueId = (): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `queue_${timestamp}_${random}`
  }

  // Queue management actions
  const startQueue = () => {
    queueState.isActive = true
    queueState.isPaused = false
    queueState.queueId = generateQueueId()
    queueState.startedAt = new Date()
    queueState.endedAt = null
  }

  const pauseQueue = () => {
    queueState.isPaused = true
  }

  const resumeQueue = () => {
    queueState.isPaused = false
  }

  const endQueue = () => {
    queueState.isActive = false
    queueState.isPaused = false
    queueState.endedAt = new Date()
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

  const updatePatientStatus = (patientId: string, status: Patient['status']) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (patient) {
      patient.status = status
      if (status === 'checked-in') {
        patient.checkInTime = new Date().toLocaleTimeString()
      }
    }
  }

  const moveToFastTrack = (patientId: string) => {
    const patient = patients.value.find(p => p.id === patientId)
    if (patient) {
      patient.priority = 'fast-track'
    }
  }

  const removeFromFastTrack = (patientId: string) => {
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
        p.status = 'waiting'
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
