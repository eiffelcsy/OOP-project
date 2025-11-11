<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useQueueManagement } from '@/features/queue/composables/useQueueManagement'
import { useStaffDashboard } from '@/features/dashboard/composables/useStaffDashboard'

// expose current user for template
const { currentUser } = useAuth()
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'

// Hook into shared queue management (backend fetch + realtime)
const {
  queueState,
  waitingPatients,
  currentPatient,
  hasCalledTicket,
  initializeQueueState,
  startQueue,
  pauseQueue,
  resumeQueue,
  endQueue,
  callNext,
  endQueueMarkRemainingNoShow,
  updatePatientStatus
} = useQueueManagement()

// Hook into staff dashboard composable for appointments data
const {
  todaysOverview,
  todaysAppointments,
  loading,
  error,
  fetchTodaysAppointments,
  checkInPatient,
  markNoShow,
  cancelAppointment,
  rescheduleAppointment,
  getStatusConfig
} = useStaffDashboard()

const hasLoadedInitialAppointments = ref(false)

const loadAppointments = async () => {
  try {
    await fetchTodaysAppointments()
    hasLoadedInitialAppointments.value = true
  } catch (err) {
    console.error('Failed to load appointments:', err)
  }
}

// Computed properties related to queue
const currentQueueLength = computed(() => waitingPatients.value.length)
const nowServingNumber = computed(() => currentPatient.value ? currentPatient.value.queueNumber : (queueState.currentNumber || '-'))
const lastCalledTime = computed(() => currentPatient.value?.calledTime || '-')
const queueStatusLabel = computed(() => (!queueState.isActive ? 'Stopped' : (queueState.isPaused ? 'Paused' : 'Active')))
const queueStatusIcon = computed(() => (!queueState.isActive ? 'lucide:stop-circle' : (queueState.isPaused ? 'lucide:pause-circle' : 'lucide:play-circle')))
const queueStatusClass = computed(() => (!queueState.isActive ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : (queueState.isPaused ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200')))

// Update overview with current queue length from queue management
watch(currentQueueLength, (newLength) => {
  todaysOverview.value.currentQueueLength = newLength
}, { immediate: true })

// End Queue modal state (same behaviour as queue page)
const showEndModal = ref(false)
const pendingCount = computed(() => (waitingPatients.value.length + (currentPatient.value ? 1 : 0)))
const handleStopQueueClick = () => {
  if (pendingCount.value > 0) {
    showEndModal.value = true
  } else {
    endQueue()
  }
}
const confirmEndQueue = async () => {
  try {
    await endQueueMarkRemainingNoShow()
  } finally {
    showEndModal.value = false
  }
}
const cancelEndQueue = () => { showEndModal.value = false }

// Initialize queue data and appointments on mount
onMounted(async () => {
  try { 
    await initializeQueueState()
  } catch (err) {
    console.error('Failed to initialize dashboard:', err)
  }
})

watch(
  () => currentUser.value?.staff?.clinic_id,
  (clinicId) => {
    if (clinicId && !hasLoadedInitialAppointments.value) {
      loadAppointments()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Dashboard Title -->
    <div class="flex flex-col gap-1">
  <h1 class="text-3xl font-bold tracking-tight">Welcome back, {{ currentUser?.profile?.full_name || currentUser?.profile?.email || 'there' }}!</h1>
      <p class="text-muted-foreground">Manage today's appointments and queue operations.</p>
    </div>

    <!-- Today's Overview -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Appointments Today</CardTitle>
          <Icon icon="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold mb-1">{{ todaysOverview.totalAppointmentsToday }}</div>
          <p class="text-xs text-muted-foreground">Across all doctors</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Patients Checked In</CardTitle>
          <Icon icon="lucide:user-check" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold mb-1">{{ todaysOverview.patientsCheckedIn }}</p>
          <p class="text-xs text-muted-foreground">Ready for appointments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Current Queue Length</CardTitle>
          <Icon icon="lucide:users" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold mb-1">{{ currentQueueLength }}</p>
          <p class="text-xs text-muted-foreground">Patients waiting</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Next Appointment</CardTitle>
          <Icon icon="lucide:clock" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold mb-1">{{ todaysOverview.nextAppointmentTime }}</p>
          <p class="text-xs text-muted-foreground">Upcoming slot</p>
        </CardContent>
      </Card>
    </div>

    <!-- Queue Control Panel -->
    <Card>
      <CardHeader class="border-b">
        <CardTitle class="flex items-center gap-2">
          <Icon icon="lucide:radio" class="h-5 w-5" />
          Queue Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-8 md:grid-cols-2">
          <!-- Current Status -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Now Serving:</span>
              <div class="flex flex-col items-center gap-2">
                <template v-if="queueState.isActive">
                  <template v-if="currentPatient">
                    <span class="text-xl font-bold">Queue #{{ nowServingNumber }}</span>
                    <div class="text-xs text-muted-foreground">Called at {{ lastCalledTime }}</div>
                  </template>
                  <template v-else>
                    <span class="text-sm text-muted-foreground">No Patients Called</span>
                  </template>
                </template>
                <template v-else>
                  <span class="text-sm text-muted-foreground">No Queue Started</span>
                </template>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Patients Waiting:</span>
              <span class="text-xl font-semibold">{{ currentQueueLength }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Queue Status:</span>
              <div class="flex items-center gap-2">
                <Icon :icon="queueStatusIcon" class="h-4 w-4" />
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="queueStatusClass">{{ queueStatusLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-4">
            <div class="grid gap-4">
              <template v-if="currentPatient && queueState.isActive">
                <div class="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    @click="updatePatientStatus(currentPatient.id, 'Completed', { setCompletedAtNow: true })" 
                    variant="outline" 
                    class="w-full"
                    :disabled="queueState.isPaused"
                  >
                    <Icon icon="lucide:check" class="mr-2 h-4 w-4" />
                    Mark Patient as Complete
                  </Button>
                  <Button 
                    @click="updatePatientStatus(currentPatient.id, 'No Show', { setNoShowAtNow: true })" 
                    variant="outline" 
                    class="w-full"
                    :disabled="queueState.isPaused"
                  >
                    <Icon icon="lucide:user-x" class="mr-2 h-4 w-4" />
                    Mark Patient as No Show
                  </Button>
                </div>
              </template>
              <template v-else>
                <Button 
                  @click="callNext()" 
                  variant="outline" 
                  class="w-full" 
                  :disabled="(!queueState.isActive) || queueState.isPaused || waitingPatients.length === 0"
                >
                  <Icon icon="lucide:phone-call" class="mr-2 h-4 w-4" />
                  Call Next Patient
                </Button>
              </template>
              
              <template v-if="queueState.isActive">
                <div class="grid grid-cols-2 gap-2">
                  <Button 
                    @click="queueState.isPaused ? resumeQueue() : pauseQueue()" 
                    variant="outline" 
                    size="sm"
                  >
                    <Icon :icon="queueState.isPaused ? 'lucide:play' : 'lucide:pause'" class="mr-1 h-3 w-3" />
                    {{ queueState.isPaused ? 'Resume' : 'Pause' }}
                  </Button>
                  <Button 
                    @click="handleStopQueueClick" 
                    variant="outline" 
                    size="sm"
                  >
                    <Icon icon="lucide:stop-circle" class="mr-1 h-3 w-3" />
                    Stop Queue
                  </Button>
                </div>
              </template>
              <template v-else>
                <Button 
                  @click="startQueue" 
                  variant="outline" 
                  size="sm"
                  class="w-full"
                >
                  <Icon icon="lucide:play" class="mr-1 h-3 w-3" />
                  Start Queue
                </Button>
              </template>
            </div>

            <a href="/staff/queue" class="w-full">
              <Button variant="outline" class="w-full">
                <Icon icon="lucide:list" class="mr-2 h-4 w-4" />
                View Full Queue Management
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Today's Appointments -->
    <Card>
      <CardHeader class="border-b">
        <CardTitle class="flex items-center gap-2">
          <Icon icon="lucide:calendar-days" class="h-5 w-5" />
          Today's Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {{ error }}
        </div>
        <div v-if="loading" class="text-center py-8 text-muted-foreground">
          Loading appointments...
        </div>
        <div v-else-if="todaysAppointments.length === 0" class="text-center py-8 text-muted-foreground">
          No appointments scheduled for today.
        </div>
        <div v-else class="space-y-1">
          <div 
            v-for="appointment in todaysAppointments" 
            :key="appointment.id"
            class="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
          >
              <div class="flex items-center gap-4">
              <div class="flex flex-col items-center" v-if="appointment.queueNumber">
                <span class="text-xs text-muted-foreground">Queue</span>
                <span class="text-lg font-bold">#{{ appointment.queueNumber }}</span>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ appointment.patientName }}</span>
                  <span 
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="getStatusConfig(appointment.status).class"
                  >
                    {{ getStatusConfig(appointment.status).label }}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <Icon icon="lucide:clock" class="h-3 w-3" />
                    {{ appointment.time }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="lucide:stethoscope" class="h-3 w-3" />
                    {{ appointment.type }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="lucide:user-md" class="h-3 w-3" />
                    {{ appointment.doctor }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center gap-2">
              <Button
                v-if="appointment.status === 'scheduled'"
                @click="checkInPatient(appointment.id)"
                size="sm"
                variant="outline"
              >
                <Icon icon="lucide:user-check" class="mr-1 h-3 w-3" />
                Check In
              </Button>
              
              <Button
                v-if="appointment.status === 'scheduled'"
                @click="markNoShow(appointment.id)"
                size="sm"
                variant="outline"
              >
                <Icon icon="lucide:user-x" class="mr-1 h-3 w-3" />
                No Show
              </Button>

              <Button
                v-if="appointment.status === 'scheduled' || appointment.status === 'checked-in'"
                @click="rescheduleAppointment(appointment.id)"
                size="sm"
                variant="outline"
              >
                <Icon icon="lucide:calendar-clock" class="mr-1 h-3 w-3" />
                Reschedule
              </Button>

              <Button
                @click="cancelAppointment(appointment.id)"
                size="sm"
                variant="outline"
                class="text-red-600 hover:text-red-700"
              >
                <Icon icon="lucide:x" class="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- End Queue Modal -->
  <div v-if="showEndModal" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="cancelEndQueue" />
    <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
      <div class="p-6 border-b">
        <h3 class="text-xl font-semibold">End Queue</h3>
      </div>
      <div class="p-6">
        <p class="text-gray-700">There are {{ pendingCount }} patient(s) remaining. End queue now and mark them as No Show?</p>
      </div>
      <div class="p-4 border-t flex justify-end gap-2">
        <Button variant="outline" @click="cancelEndQueue">No</Button>
        <Button variant="destructive" @click="confirmEndQueue">Yes</Button>
      </div>
    </div>
  </div>
</template>
