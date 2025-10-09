<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStaffAppointments } from '../composables/useStaffAppointments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'

const {
  todaysAppointments,
  doctors,
  timeSlots,
  appointmentsByDoctor,
  appointmentsByTimeSlot,
  totalAppointments,
  checkedInCount,
  completedCount,
  noShowCount,
  inProgressCount,
  checkInPatient,
  markNoShow,
  markCompleted,
  formatTime,
  isCurrentTimeSlot
} = useStaffAppointments()

// View modes
const viewMode = ref<'doctor' | 'timeline'>('doctor')

// Selected doctor filter
const selectedDoctorId = ref<number | null>(null)

// Current time tracking
const currentTime = ref(new Date().toLocaleTimeString('en-SG', { 
  hour: '2-digit', 
  minute: '2-digit',
  hour12: false 
}))

// Update time every minute
setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString('en-SG', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}, 60000)

// Filtered appointments based on selected doctor
const filteredAppointmentsByDoctor = computed(() => {
  if (!selectedDoctorId.value) {
    return appointmentsByDoctor.value
  }
  
  const filtered = new Map()
  if (appointmentsByDoctor.value.has(selectedDoctorId.value)) {
    filtered.set(selectedDoctorId.value, appointmentsByDoctor.value.get(selectedDoctorId.value))
  }
  return filtered
})

// Get doctor by ID
const getDoctorById = (doctorId: number) => {
  return doctors.value.find(d => d.id === doctorId)
}

// Get appointments for a specific time slot
const getAppointmentsForTimeSlot = (timeSlot: string) => {
  return appointmentsByTimeSlot.value.get(timeSlot) || []
}

// Handle quick actions
const handleCheckIn = async (appointmentId: number) => {
  const success = await checkInPatient(appointmentId)
  if (success) {
    console.log('Patient checked in successfully')
  }
}

const handleNoShow = async (appointmentId: number) => {
  const success = await markNoShow(appointmentId)
  if (success) {
    console.log('Patient marked as no-show')
  }
}

const handleCompleted = async (appointmentId: number) => {
  const success = await markCompleted(appointmentId)
  if (success) {
    console.log('Appointment marked as completed')
  }
}

// Get priority badge for urgent appointments
const getUrgencyIndicator = (appointment: any) => {
  if (appointment.specialInstructions) {
    return 'urgent'
  }
  if (appointment.type.toLowerCase().includes('surgery') || appointment.type.toLowerCase().includes('emergency')) {
    return 'high'
  }
  return 'normal'
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'urgent': return 'bg-gray-700 text-white border-gray-700'
    case 'high': return 'bg-gray-500 text-white border-gray-500'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight">Today's Appointments</h1>
        <p class="text-muted-foreground">{{ new Date().toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-sm text-muted-foreground">
          Current Time: <span class="font-mono font-medium">{{ formatTime(currentTime) }}</span>
        </div>
        <div class="flex gap-2">
          <Button 
            :variant="viewMode === 'doctor' ? 'default' : 'outline'"
            @click="viewMode = 'doctor'"
            size="sm"
          >
            <Icon icon="lucide:users" class="h-4 w-4 mr-2" />
            By Doctor
          </Button>
          <Button 
            :variant="viewMode === 'timeline' ? 'default' : 'outline'"
            @click="viewMode = 'timeline'"
            size="sm"
          >
            <Icon icon="lucide:clock" class="h-4 w-4 mr-2" />
            Timeline
          </Button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Appointments</CardTitle>
          <Icon icon="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalAppointments }}</div>
          <p class="text-xs text-muted-foreground">Scheduled for today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Checked In</CardTitle>
          <Icon icon="lucide:user-check" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ checkedInCount }}</div>
          <p class="text-xs text-muted-foreground">Waiting in queue</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">In Progress</CardTitle>
          <Icon icon="lucide:clock" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ inProgressCount }}</div>
          <p class="text-xs text-muted-foreground">Currently being seen</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Completed</CardTitle>
          <Icon icon="lucide:check-circle" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ completedCount }}</div>
          <p class="text-xs text-muted-foreground">Finished today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">No Shows</CardTitle>
          <Icon icon="lucide:x-circle" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ noShowCount }}</div>
          <p class="text-xs text-muted-foreground">Did not attend</p>
        </CardContent>
      </Card>
    </div>

    <!-- Doctor Filter (for Doctor view) -->
    <div v-if="viewMode === 'doctor'" class="flex items-center gap-4">
      <span class="text-sm font-medium">Filter by Doctor:</span>
      <div class="flex gap-2 flex-wrap">
        <Button 
          :variant="selectedDoctorId === null ? 'default' : 'outline'"
          @click="selectedDoctorId = null"
          size="sm"
        >
          All Doctors
        </Button>
        <Button 
          v-for="doctor in doctors"
          :key="doctor.id"
          :variant="selectedDoctorId === doctor.id ? 'default' : 'outline'"
          @click="selectedDoctorId = doctor.id"
          size="sm"
        >
          {{ doctor.name }}
        </Button>
      </div>
    </div>

    <!-- Doctor View -->
    <div v-if="viewMode === 'doctor'" class="space-y-6">
      <div v-if="filteredAppointmentsByDoctor.size === 0" class="text-center py-12">
        <Icon icon="lucide:calendar-x" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium text-muted-foreground">No appointments found</h3>
        <p class="text-sm text-muted-foreground">There are no appointments for the selected criteria.</p>
      </div>
      
      <div v-for="[doctorId, appointments] in filteredAppointmentsByDoctor" :key="doctorId" class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded-full bg-gray-400"></div>
          <h2 class="text-xl font-semibold">{{ getDoctorById(doctorId)?.name }}</h2>
          <Badge variant="outline">
            {{ getDoctorById(doctorId)?.specialty }}
          </Badge>
          <Badge variant="secondary">{{ appointments.length }} appointments</Badge>
        </div>
        
        <div class="grid gap-4">
          <Card 
            v-for="appointment in appointments" 
            :key="appointment.id"
            :class="[
              'transition-all duration-200 hover:shadow-md',
              isCurrentTimeSlot(appointment.time) ? 'ring-2 ring-gray-400 ring-opacity-50' : '',
              appointment.status === 'in-progress' ? 'bg-gray-50' : '',
              appointment.status === 'completed' ? 'bg-gray-100' : '',
              appointment.status === 'no-show' ? 'bg-gray-200' : ''
            ]"
          >
            <CardContent class="p-6">
              <div class="flex items-start justify-between">
                <div class="space-y-3 flex-1">
                  <div class="flex items-center gap-3">
                    <div class="text-lg font-medium">{{ formatTime(appointment.time) }}</div>
                    <Badge class="font-medium">
                      {{ appointment.status.replace('-', ' ').toUpperCase() }}
                    </Badge>
                    <Badge 
                      v-if="getUrgencyIndicator(appointment) !== 'normal'"
                      variant="outline"
                      class="font-medium border-gray-400"
                    >
                      {{ getUrgencyIndicator(appointment).toUpperCase() }}
                    </Badge>
                    <div v-if="appointment.queueNumber" class="text-sm text-muted-foreground">
                      Queue #{{ appointment.queueNumber }}
                    </div>
                  </div>
                  
                  <div class="space-y-1">
                    <h3 class="font-semibold text-lg">{{ appointment.patientName }}</h3>
                    <p class="text-sm text-muted-foreground">{{ appointment.type }} • {{ appointment.duration }}min</p>
                    <p v-if="appointment.patientPhone" class="text-sm text-muted-foreground">
                      <Icon icon="lucide:phone" class="h-3 w-3 inline mr-1" />
                      {{ appointment.patientPhone }}
                    </p>
                  </div>
                  
                  <div v-if="appointment.notes || appointment.specialInstructions" class="space-y-1">
                    <p v-if="appointment.notes" class="text-sm bg-gray-50 p-2 rounded">
                      <Icon icon="lucide:file-text" class="h-3 w-3 inline mr-1" />
                      {{ appointment.notes }}
                    </p>
                    <p v-if="appointment.specialInstructions" class="text-sm bg-gray-100 p-2 rounded font-medium">
                      <Icon icon="lucide:alert-triangle" class="h-3 w-3 inline mr-1" />
                      {{ appointment.specialInstructions }}
                    </p>
                  </div>
                  
                  <div v-if="appointment.checkInTime" class="text-xs text-muted-foreground">
                    <Icon icon="lucide:clock" class="h-3 w-3 inline mr-1" />
                    Checked in at {{ formatTime(appointment.checkInTime) }}
                  </div>
                  
                  <div v-if="appointment.completedTime" class="text-xs text-muted-foreground">
                    <Icon icon="lucide:check-circle" class="h-3 w-3 inline mr-1" />
                    Completed at {{ formatTime(appointment.completedTime) }}
                  </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="flex flex-col gap-2 ml-6">
                  <Button 
                    v-if="appointment.status === 'scheduled'"
                    @click="handleCheckIn(appointment.id)"
                    size="sm"
                    class="min-w-[100px]"
                  >
                    <Icon icon="lucide:user-check" class="h-3 w-3 mr-1" />
                    Check In
                  </Button>
                  
                  <Button 
                    v-if="appointment.status === 'checked-in' || appointment.status === 'in-progress'"
                    @click="handleCompleted(appointment.id)"
                    size="sm"
                    variant="outline"
                    class="min-w-[100px]"
                  >
                    <Icon icon="lucide:check-circle" class="h-3 w-3 mr-1" />
                    Complete
                  </Button>
                  
                  <Button 
                    v-if="appointment.status === 'scheduled' || appointment.status === 'checked-in'"
                    @click="handleNoShow(appointment.id)"
                    size="sm"
                    variant="destructive"
                    class="min-w-[100px]"
                  >
                    <Icon icon="lucide:x-circle" class="h-3 w-3 mr-1" />
                    No Show
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Timeline View -->
    <div v-if="viewMode === 'timeline'" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="lucide:clock" class="h-5 w-5" />
            Daily Schedule Timeline
          </CardTitle>
          <CardDescription>All appointments organized by time slots</CardDescription>
        </CardHeader>
        <CardContent class="p-0">
          <div class="max-h-[800px] overflow-y-auto">
            <div v-for="timeSlot in timeSlots" :key="timeSlot.time" class="border-b last:border-b-0">
              <div 
                :class="[
                  'flex p-4 hover:bg-gray-50 transition-colors',
                  isCurrentTimeSlot(timeSlot.time) ? 'bg-gray-100 border-l-4 border-l-gray-400' : '',
                  getAppointmentsForTimeSlot(timeSlot.time).length > 0 ? 'bg-white' : 'bg-gray-25'
                ]"
              >
                <div class="w-20 flex-shrink-0">
                  <div :class="[
                    'text-sm font-medium',
                    isCurrentTimeSlot(timeSlot.time) ? 'text-gray-900' : 'text-muted-foreground'
                  ]">
                    {{ formatTime(timeSlot.time) }}
                  </div>
                </div>
                
                <div class="flex-1 space-y-2">
                  <div v-if="getAppointmentsForTimeSlot(timeSlot.time).length === 0" class="text-sm text-muted-foreground italic">
                    No appointments scheduled
                  </div>
                  
                  <div 
                    v-for="appointment in getAppointmentsForTimeSlot(timeSlot.time)" 
                    :key="appointment.id"
                    class="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-3 h-3 rounded-full bg-gray-400"></div>
                      <div>
                        <div class="font-medium">{{ appointment.patientName }}</div>
                        <div class="text-sm text-muted-foreground">
                          {{ appointment.doctorName }} • {{ appointment.type }}
                        </div>
                      </div>
                      <Badge class="text-xs">
                        {{ appointment.status.replace('-', ' ').toUpperCase() }}
                      </Badge>
                      <div v-if="appointment.queueNumber" class="text-xs text-muted-foreground">
                        #{{ appointment.queueNumber }}
                      </div>
                    </div>
                    
                    <div class="flex gap-1">
                      <Button 
                        v-if="appointment.status === 'scheduled'"
                        @click="handleCheckIn(appointment.id)"
                        size="sm"
                        variant="outline"
                      >
                        <Icon icon="lucide:user-check" class="h-3 w-3" />
                      </Button>
                      <Button 
                        v-if="appointment.status === 'checked-in' || appointment.status === 'in-progress'"
                        @click="handleCompleted(appointment.id)"
                        size="sm"
                        variant="outline"
                      >
                        <Icon icon="lucide:check-circle" class="h-3 w-3" />
                      </Button>
                      <Button 
                        v-if="appointment.status === 'scheduled' || appointment.status === 'checked-in'"
                        @click="handleNoShow(appointment.id)"
                        size="sm"
                        variant="destructive"
                      >
                        <Icon icon="lucide:x-circle" class="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
