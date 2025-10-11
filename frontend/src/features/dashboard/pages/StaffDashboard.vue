<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'

// expose current user for template
const { currentUser } = useAuth()
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'

// Staff Dashboard Data
const todaysOverview = ref({
  totalAppointmentsToday: 42,
  patientsCheckedIn: 28,
  currentQueueLength: 8,
  nextAppointmentTime: '2:30 PM'
})

// Queue Control Data
const queueControl = ref({
  nowServing: 5,
  patientsWaiting: 8,
  queueStatus: 'active', // 'active', 'paused', 'stopped'
  lastCalledTime: '2:15 PM'
})

// Today's Appointments Data
const todaysAppointments = ref([
  {
    id: 1,
    patientName: 'Sarah Johnson',
    time: '9:00 AM',
    type: 'General Checkup',
    status: 'completed',
    queueNumber: 1,
    doctor: 'Dr. Smith'
  },
  {
    id: 2,
    patientName: 'Michael Chen',
    time: '9:30 AM',
    type: 'Follow-up',
    status: 'completed',
    queueNumber: 2,
    doctor: 'Dr. Johnson'
  },
  {
    id: 3,
    patientName: 'Emily Davis',
    time: '10:00 AM',
    type: 'Consultation',
    status: 'checked-in',
    queueNumber: 3,
    doctor: 'Dr. Smith'
  },
  {
    id: 4,
    patientName: 'Robert Wilson',
    time: '10:30 AM',
    type: 'General Checkup',
    status: 'checked-in',
    queueNumber: 4,
    doctor: 'Dr. Johnson'
  },
  {
    id: 5,
    patientName: 'Jessica Brown',
    time: '11:00 AM',
    type: 'Blood Test',
    status: 'checked-in',
    queueNumber: 5,
    doctor: 'Dr. Smith'
  },
  {
    id: 6,
    patientName: 'David Miller',
    time: '11:30 AM',
    type: 'X-Ray Review',
    status: 'scheduled',
    queueNumber: 6,
    doctor: 'Dr. Johnson'
  },
  {
    id: 7,
    patientName: 'Lisa Anderson',
    time: '2:00 PM',
    type: 'Vaccination',
    status: 'scheduled',
    queueNumber: 7,
    doctor: 'Dr. Smith'
  },
  {
    id: 8,
    patientName: 'Thomas Garcia',
    time: '2:30 PM',
    type: 'General Checkup',
    status: 'scheduled',
    queueNumber: 8,
    doctor: 'Dr. Johnson'
  },
  {
    id: 9,
    patientName: 'Maria Rodriguez',
    time: '3:00 PM',
    type: 'Follow-up',
    status: 'scheduled',
    queueNumber: 9,
    doctor: 'Dr. Smith'
  },
  {
    id: 10,
    patientName: 'James Taylor',
    time: '3:30 PM',
    type: 'Consultation',
    status: 'no-show',
    queueNumber: 10,
    doctor: 'Dr. Johnson'
  }
])

// Computed properties
const queueWaitingList = computed(() => {
  return todaysAppointments.value.filter(apt => apt.status === 'checked-in')
})

const upcomingAppointments = computed(() => {
  return todaysAppointments.value.filter(apt => apt.status === 'scheduled')
})

// Queue Control Functions
const callNext = () => {
  if (queueWaitingList.value.length > 0) {
    const nextPatient = queueWaitingList.value[0]
    queueControl.value.nowServing = nextPatient.queueNumber
    queueControl.value.lastCalledTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    // Update appointment status to completed for demonstration
    const appointmentIndex = todaysAppointments.value.findIndex(apt => apt.id === nextPatient.id)
    if (appointmentIndex !== -1) {
      todaysAppointments.value[appointmentIndex].status = 'completed'
    }
    
    // Update queue metrics
    todaysOverview.value.patientsCheckedIn++
    todaysOverview.value.currentQueueLength--
    queueControl.value.patientsWaiting--
  }
}

const startQueue = () => {
  queueControl.value.queueStatus = 'active'
}

const pauseQueue = () => {
  queueControl.value.queueStatus = 'paused'
}

const stopQueue = () => {
  queueControl.value.queueStatus = 'stopped'
}

// Appointment Actions
const checkInPatient = (appointmentId: number) => {
  const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
  if (appointment && appointment.status === 'scheduled') {
    appointment.status = 'checked-in'
    todaysOverview.value.patientsCheckedIn++
    todaysOverview.value.currentQueueLength++
    queueControl.value.patientsWaiting++
  }
}

const markNoShow = (appointmentId: number) => {
  const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
  if (appointment) {
    appointment.status = 'no-show'
  }
}

const cancelAppointment = (appointmentId: number) => {
  const appointmentIndex = todaysAppointments.value.findIndex(apt => apt.id === appointmentId)
  if (appointmentIndex !== -1) {
    todaysAppointments.value.splice(appointmentIndex, 1)
    todaysOverview.value.totalAppointmentsToday--
  }
}

const rescheduleAppointment = (appointmentId: number) => {
  // For demo purposes, just show an alert
  const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
  if (appointment) {
    alert(`Reschedule appointment for ${appointment.patientName} - Feature coming soon!`)
  }
}

// Status badge configuration
const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; class: string }> = {
    'scheduled': { 
      label: 'Scheduled', 
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
    },
    'checked-in': { 
      label: 'Checked In', 
      class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
    },
    'completed': { 
      label: 'Completed', 
      class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
    },
    'no-show': { 
      label: 'No Show', 
      class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
    }
  }
  return configs[status] || configs.scheduled
}

const getQueueStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; class: string; icon: string }> = {
    'active': { 
      label: 'Active', 
      class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: 'lucide:play-circle'
    },
    'paused': { 
      label: 'Paused', 
      class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: 'lucide:pause-circle'
    },
    'stopped': { 
      label: 'Stopped', 
      class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: 'lucide:stop-circle'
    }
  }
  return configs[status] || configs.active
}

onMounted(() => {
  console.log('Staff dashboard loaded with dummy data')
  
  // Simulate real-time updates
  setInterval(() => {
    // Simulate next appointment time updates
    const now = new Date()
    const nextHour = now.getHours() + 1
    const randomMinute = Math.floor(Math.random() * 60)
    todaysOverview.value.nextAppointmentTime = `${nextHour}:${randomMinute.toString().padStart(2, '0')} ${nextHour >= 12 ? 'PM' : 'AM'}`
  }, 60000) // Update every minute
})
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
          <p class="text-2xl font-bold mb-1">{{ todaysOverview.currentQueueLength }}</p>
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
                <span class="text-xl font-bold">Queue #{{ queueControl.nowServing }}</span>
                <div class="text-xs text-muted-foreground">
                  Called at {{ queueControl.lastCalledTime }}
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Patients Waiting:</span>
              <span class="text-xl font-semibold">{{ queueControl.patientsWaiting }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Queue Status:</span>
              <div class="flex items-center gap-2">
                <Icon :icon="getQueueStatusConfig(queueControl.queueStatus).icon" class="h-4 w-4" />
                <span 
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getQueueStatusConfig(queueControl.queueStatus).class"
                >
                  {{ getQueueStatusConfig(queueControl.queueStatus).label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-4">
            <div class="grid gap-4">
              <Button 
                @click="callNext" 
                variant="outline" 
                class="w-full" 
                :disabled="queueWaitingList.length === 0 || queueControl.queueStatus !== 'active'"
              >
                <Icon icon="lucide:phone-call" class="mr-2 h-4 w-4" />
                Call Next Patient
              </Button>
              
              <div class="grid grid-cols-3 gap-2">
                <Button 
                  @click="startQueue" 
                  variant="outline" 
                  size="sm"
                  :disabled="queueControl.queueStatus === 'active'"
                >
                  <Icon icon="lucide:play" class="mr-1 h-3 w-3" />
                  Start
                </Button>
                <Button 
                  @click="pauseQueue" 
                  variant="outline" 
                  size="sm"
                  :disabled="queueControl.queueStatus !== 'active'"
                >
                  <Icon icon="lucide:pause" class="mr-1 h-3 w-3" />
                  Pause
                </Button>
                <Button 
                  @click="stopQueue" 
                  variant="outline" 
                  size="sm"
                >
                  <Icon icon="lucide:stop-circle" class="mr-1 h-3 w-3" />
                  Stop
                </Button>
              </div>
            </div>

            <Button variant="outline" class="w-full">
              <Icon icon="lucide:list" class="mr-2 h-4 w-4" />
              View Full Queue Management
            </Button>
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
        <div class="space-y-1">
          <div 
            v-for="appointment in todaysAppointments" 
            :key="appointment.id"
            class="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
          >
            <div class="flex items-center gap-4">
              <div class="flex flex-col items-center">
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
</template>
