import { ref, computed, reactive, onMounted, onBeforeUnmount, triggerRef } from 'vue'
import type { Tables } from '@/types/supabase'
import { queueApi, type QueueResponse, type CreateQueueRequest } from '@/services/queueApi'
import { queueTicketsApi } from '@/services/queueTicketsApi'
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
  appointment_id?: number
  queue_id: number
  ticket_id: number
}

// Create a factory function that constructs the queue management state and methods
const createQueueManagement = () => {
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
    
    try {
      const tickets = await queueTicketsApi.list(queueId)

      // Backend now returns patient names from profiles table
      const transformed: QueuePatient[] = (tickets || []).map(t => {
        const status = mapStatus(t.ticket_status)
        const calledTimeStr = t.called_at ? new Date(t.called_at).toLocaleTimeString() : undefined
        const updatedTimeStr = t.updated_at ? new Date(t.updated_at).toLocaleTimeString() : undefined
        const completedTimeStr = t.completed_at ? new Date(t.completed_at).toLocaleTimeString() : undefined
        const noShowTimeStr = t.no_show_at ? new Date(t.no_show_at).toLocaleTimeString() : undefined

        // Determine the primary time to display under the patient's name based on status
        let primaryTime: string | undefined
        switch (status) {
          case 'Called':
            primaryTime = calledTimeStr
            break
          case 'Completed':
            primaryTime = completedTimeStr
            break
          case 'No Show':
            primaryTime = noShowTimeStr
            break
          case 'Checked In':
          default:
            primaryTime = updatedTimeStr
            break
        }

        return {
          id: t.id,
          ticket_id: t.id,
          queue_id: t.queue_id,
          appointment_id: t.appointment_id ?? undefined,
          queueNumber: t.ticket_number,
          name: t.patient_name || 'Walk-in',
          // Display time under patient's name per status rules
          appointmentTime: primaryTime || '-',
          status,
          priority: mapPriority(t.priority || 0),
          estimatedTime: undefined,
          // Keep check-in time (created_at) as supplementary info
          checkInTime: t.created_at ? new Date(t.created_at).toLocaleTimeString() : undefined,
          // Explicit called time used in "Currently Serving" section
          calledTime: calledTimeStr,
        }
      })
      
      // Update the patients array
      patients.value = transformed
      
      // Force trigger reactivity in case Vue doesn't detect the change
      triggerRef(patients)
      
    } catch (error) {
      console.error('Failed to load queue tickets:', error)
    }
  }

  // Resolve patient name from appointment_id via appointments -> patients -> profiles
  const resolvePatientNameByAppointmentId = async (appointmentId?: number | null): Promise<string> => {
    if (!appointmentId) return 'Walk-in'
    const { data: appt, error: apptErr } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('id', appointmentId)
      .single()
    if (apptErr || !appt?.patient_id) return 'Walk-in'

    const { data: patient, error: patErr } = await supabase
      .from('patients')
      .select('user_id')
      .eq('id', appt.patient_id)
      .single()
    if (patErr) return `Patient #${appt.patient_id}`

    if (patient?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', patient.user_id)
        .single()
      return profile?.full_name || `Patient #${appt.patient_id}`
    }
    return `Patient #${appt.patient_id}`
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
      const clinicId = getClinicId()
      
      // Query for active or paused queues for this clinic
      const result = await queueApi.listQueues({
        clinicId: clinicId,
        statuses: ['ACTIVE', 'PAUSED'],
        size: 1,
        sortBy: 'created_at',
        sortDir: 'DESC'
      })

      if (result.data && result.data.length > 0) {
        const existingQueue = result.data[0]
        
        // Update local state to reflect existing queue
        queueState.isActive = true
        queueState.isPaused = existingQueue.queue_status === 'PAUSED'
        queueState.queueId = existingQueue.id
        queueState.startedAt = new Date(existingQueue.created_at * 1000) // Convert Unix timestamp to Date
        queueState.endedAt = null

  // Load tickets for this queue and subscribe to realtime updates
  await loadQueueTickets(existingQueue.id)
  subscribeToQueueTickets(existingQueue.id)
  subscribeToQueueStatus(existingQueue.id)
      } else {
        // No active queue found
        queueState.isActive = false
        queueState.isPaused = false
        queueState.queueId = null
        queueState.startedAt = null
        queueState.endedAt = null
      }

      // Always subscribe at clinic scope to auto-discover new ACTIVE/PAUSED queues
      subscribeToClinicQueues(clinicId)
    } catch (error) {
      console.error('Failed to initialize queue state:', error)
    }
  }

  // Handle tab visibility changes: when returning to the tab, refresh queue state
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      try {
        // If we already know the queueId (either staff or display page), just reload and resubscribe
        if (queueState.queueId && queueState.isActive) {
          // Re-subscribe to ensure realtime connection is alive after tab switch
          subscribeToQueueTickets(queueState.queueId)
          subscribeToQueueStatus(queueState.queueId)
          await loadQueueTickets(queueState.queueId)
        }
        // Ensure clinic-level subscription exists (only when user has a clinic)
        const cid = currentUser.value?.staff?.clinic_id
        if (cid) {
          subscribeToClinicQueues(cid)
        }
      } catch (e) {
        console.warn('Failed to refresh queue data after visibility change', e)
      }
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    unsubscribeQueueTickets()
    unsubscribeQueueStatus()
    unsubscribeClinicQueues()
  })

  /**
   * Start a new queue
   * Creates a new queue in the database using the authenticated user's clinic_id
   */
  const startQueue = async () => {
    try {
      console.log('Starting queue...', queueState.queueId)
      // Get the authenticated user's clinic_id
      const clinicId = getClinicId()
      
      // Backend CreateQueueRequest explicitly expects camelCase fields via @JsonProperty
      const requestData: CreateQueueRequest = {
        clinic_id: clinicId,
        queue_status: 'ACTIVE'
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
  subscribeToQueueStatus(queueResponse.id)
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

      const updateRequest = {
        queue_status: 'PAUSED' as const
      }
      console.log('Sending update request:', updateRequest)
      
      const updatedQueue = await queueApi.updateQueue(queueState.queueId, updateRequest)
      console.log('Queue paused successfully:', updatedQueue)

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
        queue_status: 'ACTIVE' as const
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
        await queueApi.updateQueue(queueState.queueId, { queue_status: 'CLOSED' })
      }

      // Clear local tickets and state
      patients.value = []
      queueState.isActive = false
      queueState.isPaused = false
      queueState.queueId = null
      queueState.endedAt = new Date()

      // Unsubscribe from realtime
      unsubscribeQueueTickets()
  unsubscribeQueueStatus()

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
  let queuesChannel: any | null = null
  let clinicQueuesChannel: any | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 5
  let isReconnecting = false
  let reconnectTimeout: number | null = null
  let isIntentionalUnsubscribe = false // Track intentional unsubscribes to prevent reconnection loops
  
  const subscribeToQueueTickets = (qid: number) => {
    // Clear any pending reconnection attempts
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    // Mark as intentional unsubscribe before calling unsubscribe
    isIntentionalUnsubscribe = true
    unsubscribeQueueTickets()
    isIntentionalUnsubscribe = false
    
    ticketsChannel = supabase
      .channel(`queue_tickets_${qid}`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets' }, async (payload: any) => {
        try {
          if (payload.eventType === 'INSERT') {
            // New ticket added - need to fetch patient info
            const newTicket = payload.new
            if (newTicket.queue_id !== qid) {
              return
            }
            
            // Resolve patient name via appointment
            const patientName = await resolvePatientNameByAppointmentId(newTicket.appointment_id)
            
            const newPatient: QueuePatient = {
              id: newTicket.id,
              ticket_id: newTicket.id,
              queue_id: newTicket.queue_id,
              appointment_id: newTicket.appointment_id ?? undefined,
              queueNumber: newTicket.ticket_number,
              name: patientName,
              appointmentTime: newTicket.updated_at ? new Date(newTicket.updated_at).toLocaleTimeString() : '-',
              status: mapStatus(newTicket.ticket_status),
              priority: mapPriority(newTicket.priority),
              checkInTime: newTicket.created_at ? new Date(newTicket.created_at).toLocaleTimeString() : undefined,
              calledTime: newTicket.called_at ? new Date(newTicket.called_at).toLocaleTimeString() : undefined,
            }
            
            patients.value = [...patients.value, newPatient]
            triggerRef(patients)
            
          } else if (payload.eventType === 'UPDATE') {
            // Ticket updated - update the existing patient or add/remove if moved between queues
            const updatedTicket = payload.new
            const oldTicket = payload.old

            const oldQueueId = oldTicket?.queue_id
            const newQueueId = updatedTicket?.queue_id

            // If this ticket moved out of this queue, remove it
            if (oldQueueId === qid && newQueueId !== qid) {
              const removedId = updatedTicket.id
              patients.value = patients.value.filter(p => p.id !== removedId)
              triggerRef(patients)
              return
            }

            // If this ticket doesn't belong to this queue (neither old nor new), ignore
            if (newQueueId !== qid && oldQueueId !== qid) {
              return
            }

            const index = patients.value.findIndex(p => p.id === updatedTicket.id)
            if (index !== -1) {
              const existingPatient = patients.value[index]
              const newStatus = mapStatus(updatedTicket.ticket_status)
              // Compute primary time per status
              let updatedPrimaryTime: string | undefined
              if (newStatus === 'Called' && updatedTicket.called_at) {
                updatedPrimaryTime = new Date(updatedTicket.called_at).toLocaleTimeString()
              } else if (newStatus === 'Completed' && updatedTicket.completed_at) {
                updatedPrimaryTime = new Date(updatedTicket.completed_at).toLocaleTimeString()
              } else if (newStatus === 'No Show' && updatedTicket.no_show_at) {
                updatedPrimaryTime = new Date(updatedTicket.no_show_at).toLocaleTimeString()
              } else if (updatedTicket.updated_at) {
                updatedPrimaryTime = new Date(updatedTicket.updated_at).toLocaleTimeString()
              }

              // If appointment_id changed, refresh name via appointment
              let updatedName = existingPatient.name
              if (updatedTicket.appointment_id !== existingPatient.appointment_id) {
                updatedName = await resolvePatientNameByAppointmentId(updatedTicket.appointment_id)
              }

              const updatedPatient: QueuePatient = {
                ...existingPatient,
                name: updatedName,
                appointment_id: updatedTicket.appointment_id ?? existingPatient.appointment_id,
                queueNumber: updatedTicket.ticket_number,
                status: newStatus,
                priority: mapPriority(updatedTicket.priority),
                appointmentTime: updatedPrimaryTime || '-',
                checkInTime: updatedTicket.created_at ? new Date(updatedTicket.created_at).toLocaleTimeString() : existingPatient.checkInTime,
                calledTime: updatedTicket.called_at ? new Date(updatedTicket.called_at).toLocaleTimeString() : undefined,
              }
              
              // Create a new array with the updated patient
              patients.value = [
                ...patients.value.slice(0, index),
                updatedPatient,
                ...patients.value.slice(index + 1)
              ]
              triggerRef(patients)
            } else {
              // If the ticket moved into this queue (old was different), add it
              if (newQueueId === qid) {
                const patientName = await resolvePatientNameByAppointmentId(updatedTicket.appointment_id)
                const newStatus2 = mapStatus(updatedTicket.ticket_status)
                let primaryTime: string | undefined
                if (newStatus2 === 'Called' && updatedTicket.called_at) {
                  primaryTime = new Date(updatedTicket.called_at).toLocaleTimeString()
                } else if (newStatus2 === 'Completed' && updatedTicket.completed_at) {
                  primaryTime = new Date(updatedTicket.completed_at).toLocaleTimeString()
                } else if (newStatus2 === 'No Show' && updatedTicket.no_show_at) {
                  primaryTime = new Date(updatedTicket.no_show_at).toLocaleTimeString()
                } else if (updatedTicket.updated_at) {
                  primaryTime = new Date(updatedTicket.updated_at).toLocaleTimeString()
                }
                const addedPatient: QueuePatient = {
                  id: updatedTicket.id,
                  ticket_id: updatedTicket.id,
                  queue_id: updatedTicket.queue_id,
                  appointment_id: updatedTicket.appointment_id ?? undefined,
                  queueNumber: updatedTicket.ticket_number,
                  name: patientName,
                  appointmentTime: primaryTime || '-',
                  status: newStatus2,
                  priority: mapPriority(updatedTicket.priority),
                  checkInTime: updatedTicket.created_at ? new Date(updatedTicket.created_at).toLocaleTimeString() : undefined,
                  calledTime: updatedTicket.called_at ? new Date(updatedTicket.called_at).toLocaleTimeString() : undefined,
                }
                patients.value = [...patients.value, addedPatient]
                triggerRef(patients)
              }
            }
            
          } else if (payload.eventType === 'DELETE') {
            // Ticket deleted
            const deletedId = payload.old.id
            const deletedQueueId = payload.old.queue_id
            if (deletedQueueId === qid) {
              patients.value = patients.value.filter(p => p.id !== deletedId)
              triggerRef(patients)
            }
          }
          
        } catch (err) {
          console.error('Error processing realtime update:', err)
          await loadQueueTickets(qid)
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          reconnectAttempts = 0 // Reset on successful connection
          isReconnecting = false
        }
        
        if (status === 'CHANNEL_ERROR' && !isReconnecting) {
          console.error('[Realtime] ✗ Channel error:', err)
          handleReconnection(qid)
        }
        
        if (status === 'TIMED_OUT' && !isReconnecting) {
          console.error('[Realtime] ✗ Channel timed out')
          handleReconnection(qid)
        }
        
        if (status === 'CLOSED' && !isReconnecting && !isIntentionalUnsubscribe) {
          console.warn('[Realtime] ⚠ Channel closed unexpectedly')
          // Don't reconnect if we're switching tabs or intentionally closing
          // Only reconnect if we have an active queue
          if (queueState.queueId === qid && queueState.isActive) {
            handleReconnection(qid)
          }
        } else if (status === 'CLOSED' && isIntentionalUnsubscribe) {
          console.log('[Realtime] Channel closed intentionally (resubscribing)')
        }
      })
  }

  const handleReconnection = (qid: number) => {
    if (isReconnecting) {
      return
    }
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[Realtime] Max reconnection attempts reached. Please refresh the page.')
      isReconnecting = false
      return
    }
    
    isReconnecting = true
    reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000) // Exponential backoff, max 30s
    
    console.log(`[Realtime] Attempting reconnection ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`)
    
    reconnectTimeout = window.setTimeout(() => {
      // Only reconnect if we still have this queue active
      if (queueState.queueId === qid && queueState.isActive) {
        subscribeToQueueTickets(qid)
      } else {
        console.log('[Realtime] Queue no longer active, cancelling reconnection')
        isReconnecting = false
      }
    }, delay)
  }

  const unsubscribeQueueTickets = () => {
    // Clear any pending reconnection attempts
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    isReconnecting = false
    reconnectAttempts = 0 // Reset reconnect attempts
    
    if (ticketsChannel) {
      try { 
        console.log('[Realtime] Unsubscribing from channel')
        // If not already marked as intentional, mark it now
        if (!isIntentionalUnsubscribe) {
          isIntentionalUnsubscribe = true
        }
        ticketsChannel.unsubscribe()
        // Reset the flag after a short delay to allow the CLOSED event to fire
        setTimeout(() => {
          isIntentionalUnsubscribe = false
        }, 100)
      } catch (e) {
        console.error('[Realtime] Error unsubscribing:', e)
        isIntentionalUnsubscribe = false
      }
      ticketsChannel = null
    }
  }

  // Subscribe to queues changes scoped to the user's clinic to auto-adopt new ACTIVE/PAUSED queues
  const subscribeToClinicQueues = (clinicId: number) => {
    // Ensure previous channel is closed
    unsubscribeClinicQueues()

    clinicQueuesChannel = supabase
      .channel(`queues_clinic_${clinicId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queues', filter: `clinic_id=eq.${clinicId}` },
        async (payload: any) => {
          try {
            const row = payload.new || payload.old
            if (!row) return

            const statusRaw: string = row.queue_status || ''
            const status = statusRaw.toString().toLowerCase()

            // Ignore updates for the currently tracked queue; the per-queue subscription handles those
            if (queueState.queueId && row.id === queueState.queueId) return

            // Only adopt ACTIVE or PAUSED queues
            const isActivish = status === 'active' || status === 'paused'
            if (!isActivish) return

            // Assumption: at most one non-CLOSED queue per clinic. Adopt the new/updated queue immediately.
            // Clean up any existing per-queue subscriptions just in case
            unsubscribeQueueTickets()
            unsubscribeQueueStatus()

            queueState.isActive = true
            queueState.isPaused = status === 'paused'
            queueState.queueId = row.id
            queueState.startedAt = row.created_at ? new Date(row.created_at) : null
            queueState.endedAt = null

            await loadQueueTickets(row.id)
            subscribeToQueueTickets(row.id)
            subscribeToQueueStatus(row.id)
          } catch (e) {
            console.error('[Realtime][clinic-queues] Error handling payload:', e)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime][clinic-queues] Channel error:', err)
        }
        if (status === 'TIMED_OUT') {
          console.warn('[Realtime][clinic-queues] Channel timed out')
        }
        if (status === 'CLOSED') {
          console.warn('[Realtime][clinic-queues] Channel closed')
        }
      })
  }

  const unsubscribeClinicQueues = () => {
    if (clinicQueuesChannel) {
      try {
        clinicQueuesChannel.unsubscribe()
      } catch (e) {
        console.error('[Realtime][clinic-queues] Error unsubscribing:', e)
      }
      clinicQueuesChannel = null
    }
  }

  // Subscribe to realtime changes on the queues table for the current queue id
  const subscribeToQueueStatus = (qid: number) => {
    // Ensure previous channel is closed
    unsubscribeQueueStatus()

    queuesChannel = supabase
      .channel(`queues_${qid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues', filter: `id=eq.${qid}` }, (payload: any) => {
        try {
          const row = payload.new || payload.old
          if (!row) return
          const statusRaw: string = row.queue_status || ''
          const status = statusRaw.toString().toLowerCase()
          if (status === 'active') {
            queueState.isActive = true
            queueState.isPaused = false
          } else if (status === 'paused') {
            queueState.isActive = true
            queueState.isPaused = true
          } else if (status === 'closed') {
            // Queue closed: visually clear tickets and mark queue inactive
            queueState.isActive = false
            queueState.isPaused = false
            queueState.endedAt = new Date()
            // Clear displayed tickets without updating their statuses in DB
            patients.value = []
            triggerRef(patients)
            // Stop listening for ticket updates of the closed queue
            unsubscribeQueueTickets()
            // Clear queue association to prevent auto-reload on visibility change
            queueState.queueId = null
          }
        } catch (e) {
          console.error('[Realtime][queues] Error handling payload:', e)
        }
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime][queues] Channel error:', err)
        }
        if (status === 'TIMED_OUT') {
          console.warn('[Realtime][queues] Channel timed out')
        }
        if (status === 'CLOSED') {
          console.warn('[Realtime][queues] Channel closed')
        }
      })
  }

  const unsubscribeQueueStatus = () => {
    if (queuesChannel) {
      try {
        queuesChannel.unsubscribe()
      } catch (e) {
        console.error('[Realtime][queues] Error unsubscribing:', e)
      }
      queuesChannel = null
    }
  }

  /**
   * Initialize queue state for a specific queue ID (used by public display)
   * Loads the queue by ID, sets local state, loads tickets, and subscribes to realtime updates.
   */
  const initializeQueueById = async (qid: number) => {
    try {
      const q = await queueApi.getQueueById(qid)
      // Consider ACTIVE or PAUSED as active for display purposes
      queueState.isActive = q.queue_status !== 'CLOSED'
      queueState.isPaused = q.queue_status === 'PAUSED'
      queueState.queueId = q.id
      queueState.startedAt = new Date(q.created_at * 1000)
      queueState.endedAt = null

      await loadQueueTickets(qid)
      subscribeToQueueTickets(qid)
      subscribeToQueueStatus(qid)
    } catch (error) {
      console.error('Failed to initialize queue by ID:', error)
      queueState.isActive = false
      queueState.isPaused = false
      queueState.queueId = null
      queueState.startedAt = null
      queueState.endedAt = null
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
    initializeQueueById,
    resetQueue
  }
}

// Singleton instance so every import of useQueueManagement() shares the same state
let queueManagementInstance: ReturnType<typeof createQueueManagement> | null = null

export const useQueueManagement = () => {
  if (!queueManagementInstance) {
    console.log('[useQueueManagement] Creating new singleton instance')
    queueManagementInstance = createQueueManagement()
  } else {
    console.log('[useQueueManagement] Reusing existing singleton instance')
  }
  return queueManagementInstance
}
