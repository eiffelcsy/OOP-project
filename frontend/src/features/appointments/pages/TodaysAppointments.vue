<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStaffAppointments } from '../composables/useStaffAppointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'
import { Input } from '@/components/ui/input'

const {
  todaysAppointments,
  doctors,
  appointmentsByDoctor,
  totalAppointments,
  checkedInCount,
  completedCount,
  noShowCount,
  checkInPatient,
  markNoShow,
  markCompleted,
  formatTime
} = useStaffAppointments()

// View modes
const viewMode = ref<'doctor' | 'list'>('doctor')

// Selected doctor filter
const selectedDoctorId = ref<number | null>(null)

// Search filter
const searchQuery = ref('')

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

// Filtered appointments based on selected doctor AND search
const filteredAppointmentsByDoctor = computed(() => {
  if (!selectedDoctorId.value) {
    // Apply search filter to all doctors
    const filtered = new Map()
    appointmentsByDoctor.value.forEach((appointments, doctorId) => {
      const filteredAppointments = appointments.filter(appt =>
        appt.patientName.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
      if (filteredAppointments.length > 0) {
        filtered.set(doctorId, filteredAppointments)
      }
    })
    return filtered
  }

  // Apply search filter to selected doctor only
  const filtered = new Map()
  if (appointmentsByDoctor.value.has(selectedDoctorId.value)) {
    const appointments = appointmentsByDoctor.value.get(selectedDoctorId.value)
    const filteredAppointments = appointments.filter(appt =>
      appt.patientName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    if (filteredAppointments.length > 0) {
      filtered.set(selectedDoctorId.value, filteredAppointments)
    }
  }
  return filtered
})

// Filtered appointments for list view
const filteredAppointmentsList = computed(() => {
  return todaysAppointments.value
    .filter(appt => {
      const matchesPatient = appt.patientName.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesDoctor = selectedDoctorId.value === null || appt.doctorId === selectedDoctorId.value
      return matchesPatient && matchesDoctor
    })
    .sort((a, b) => a.time.localeCompare(b.time))
})

// Get doctor by ID
const getDoctorById = (doctorId: number) => {
  return doctors.value.find(d => d.id === doctorId)
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
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">Today's Appointments</h1>
        <p class="text-muted-foreground">{{ new Date().toLocaleDateString('en-SG', {
          weekday: 'long', year: 'numeric',
          month: 'long', day: 'numeric'
        }) }}</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-sm text-muted-foreground">
          Current Time: <span class="font-mono font-medium">{{ formatTime(currentTime) }}</span>
        </div>
        <div class="flex gap-2">
          <Button :variant="viewMode === 'doctor' ? 'default' : 'outline'" @click="viewMode = 'doctor'" size="sm">
            <Icon icon="lucide:users" class="h-4 w-4 mr-2" />
            By Doctor
          </Button>
          <Button :variant="viewMode === 'list' ? 'default' : 'outline'" @click="viewMode = 'list'" size="sm">
            <Icon icon="lucide:list" class="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total</CardTitle>
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

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <!--search-->
      <div class="w-64">
        <Input v-model="searchQuery" placeholder="Search patient..."
          class="w-full h-10 border border-gray-300 rounded-md px-3" />
      </div>
      <span class="text-sm font-medium">Filter by Doctor:</span>
      <div class="flex gap-2 flex-wrap">
        <Button :variant="selectedDoctorId === null ? 'default' : 'outline'" @click="selectedDoctorId = null" size="sm">
          All Doctors
        </Button>
        <Button v-for="doctor in doctors" :key="doctor.id"
          :variant="selectedDoctorId === doctor.id ? 'default' : 'outline'" @click="selectedDoctorId = doctor.id"
          size="sm">
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
          <h2 class="text-xl font-semibold">Dr. {{ getDoctorById(doctorId)?.name }}</h2>
          <Badge variant="outline">
            {{ getDoctorById(doctorId)?.specialty }}
          </Badge>
          <Badge variant="secondary">{{ appointments.length }} appointments</Badge>
        </div>

        <div class="grid gap-4">
          <Card v-for="appointment in appointments" :key="appointment.id" :class="[
            'transition-all duration-200 hover:shadow-md',
            appointment.status === 'completed' ? 'border-green-200 bg-green-50' : '',
            appointment.status === 'no-show' ? 'border-red-200 bg-red-50' : '',
            appointment.status === 'checked-in' ? 'border-yellow-200 bg-yellow-50' : ''
          ]">
            <CardHeader class="flex flex-row items-start justify-between space-y-0">
              <div class="space-y-3 flex-1">
                <div class="flex items-center gap-3">
                  <div class="text-lg font-medium">{{ formatTime(appointment.time) }}</div>
                  <Badge :class="{
                    'bg-gray-100 text-gray-800': appointment.status === 'scheduled',
                    'bg-yellow-100 text-yellow-800': appointment.status === 'checked-in',
                    'bg-green-100 text-green-800': appointment.status === 'completed',
                    'bg-red-100 text-red-800': appointment.status === 'no-show',
                    'bg-gray-200 text-gray-800': appointment.status === 'cancelled'
                  }">
                    {{ appointment.status.replace('-', ' ').toUpperCase() }}
                  </Badge>
                </div>

                <div class="space-y-1">
                  <h3 class="font-semibold text-lg">{{ appointment.patientName }}</h3>
                  <p class="text-sm text-muted-foreground">
                    {{ appointment.type }}
                  </p>
                  <p v-if="appointment.patientPhone && appointment.patientPhone !== '-'"
                    class="text-sm text-muted-foreground">
                    <Icon icon="lucide:phone" class="h-3 w-3 inline mr-1" />
                    {{ appointment.patientPhone }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    <Icon icon="lucide:building" class="h-3 w-3 inline mr-1" />
                    {{ appointment.clinicName }} ({{ appointment.clinicType }})
                  </p>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="flex flex-col gap-2 ml-6">
                <Button v-if="appointment.status === 'scheduled'" @click="handleCheckIn(appointment.id)" size="sm"
                  class="min-w-[100px]">
                  <Icon icon="lucide:user-check" class="h-3 w-3 mr-1" />
                  Check In
                </Button>

                <Button v-if="appointment.status === 'checked-in'" @click="handleCompleted(appointment.id)" size="sm"
                  variant="outline" class="min-w-[100px]">
                  <Icon icon="lucide:check-circle" class="h-3 w-3 mr-1" />
                  Complete
                </Button>

                <Button v-if="appointment.status === 'scheduled'" @click="handleNoShow(appointment.id)" size="sm"
                  variant="destructive" class="min-w-[100px]">
                  <Icon icon="lucide:x-circle" class="h-3 w-3 mr-1" />
                  No Show
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="viewMode === 'list'" class="space-y-4">
      <div v-if="filteredAppointmentsList.length === 0" class="text-center py-12">
        <Icon icon="lucide:calendar-x" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium text-muted-foreground">No appointments found</h3>
        <p class="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
      </div>

      <Card v-for="appointment in filteredAppointmentsList" :key="appointment.id" :class="[
        'transition-all duration-200 hover:shadow-md',
        appointment.status === 'completed' ? 'border-green-200 bg-green-50' : '',
        appointment.status === 'no-show' ? 'border-red-200 bg-red-50' : '',
        appointment.status === 'checked-in' ? 'border-yellow-200 bg-yellow-50' : ''
      ]">
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <div class="flex-1">
            <CardTitle class="flex items-center gap-3">
              <span>{{ appointment.patientName }}</span>
              <Badge :class="{
                'bg-gray-100 text-gray-800': appointment.status === 'scheduled',
                'bg-yellow-100 text-yellow-800': appointment.status === 'checked-in',
                'bg-green-100 text-green-800': appointment.status === 'completed',
                'bg-red-100 text-red-800': appointment.status === 'no-show',
                'bg-gray-200 text-gray-800': appointment.status === 'cancelled'
              }">
                {{ appointment.status.replace('-', ' ').toUpperCase() }}
              </Badge>
            </CardTitle>
            <p class="text-sm text-muted-foreground mt-2">
              {{ formatTime(appointment.time) }} • Dr. {{ appointment.doctorName }} ({{ appointment.doctorSpecialty }})
              • {{ appointment.clinicName }} ({{ appointment.clinicType }})
            </p>
            <p class="text-sm text-muted-foreground">
              {{ appointment.type }}
            </p>
          </div>

          <div class="flex gap-2">
            <Button v-if="appointment.status === 'scheduled'" @click="handleCheckIn(appointment.id)" size="sm">
              Check In
            </Button>
            <Button v-if="appointment.status === 'checked-in'" @click="handleCompleted(appointment.id)" size="sm"
              variant="outline">
              Complete
            </Button>
            <Button v-if="appointment.status === 'scheduled' || appointment.status === 'checked-in'"
              @click="handleNoShow(appointment.id)" size="sm" variant="destructive">
              No Show
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  </div>
</template>
