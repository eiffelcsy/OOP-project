<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAllAppointments } from '../composables/useAllAppointments' // adjust path if needed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Icon } from '@iconify/vue'

// Composable
const {
  allAppointments,
  doctors,
  clinics,
  cancelAppointment,
  rescheduleAppointment,
  formatDate,
  formatTime,
  fetchAllAppointments
} = useAllAppointments()

// Filters
const searchQuery = ref('')
const selectedDoctor = ref<'all' | number>('all')
const selectedClinic = ref<'all' | number>('all')
const selectedDate = ref('')

// Reschedule modal
const showReschedule = ref(false)
const rescheduleAppointmentId = ref<number | null>(null)
const rescheduleDate = ref('')
const rescheduleTime = ref('')
const rescheduleDoctorId = ref<number | null>(null)

// Fetch appointments on mount
onMounted(async () => {
  await fetchAllAppointments()
})

// Filtered appointments
const filteredAppointments = computed(() => {
  return allAppointments.value
    .filter(appt => {
      const matchesPatient = appt.patientName.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesDoctor = selectedDoctor.value === 'all' || appt.doctorId === selectedDoctor.value
      const matchesClinic = selectedClinic.value === 'all' || appt.clinicId === selectedClinic.value
      const matchesDate = !selectedDate.value || appt.date === selectedDate.value
      return matchesPatient && matchesDoctor && matchesClinic && matchesDate
    })
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateCompare !== 0) return dateCompare
      // If dates are equal, sort by time descending
      return b.time.localeCompare(a.time)
    })
})

// Cancel appointment
const handleCancel = async (appointmentId: number) => {
  const appt = allAppointments.value.find(a => a.id === appointmentId)
  if (!appt) return
  if (appt.status === 'completed') {
    alert("Completed appointments cannot be cancelled.")
    return
  }
  const confirmed = confirm(`Are you sure you want to cancel the appointment for ${appt.patientName}?`)
  if (confirmed) {
    await cancelAppointment(appointmentId)
    alert("Appointment cancelled successfully.")
  }
}

// Open reschedule modal
const openReschedule = (appointmentId: number) => {
  const appt = allAppointments.value.find(a => a.id === appointmentId)
  if (!appt) return
  if (appt.status === 'completed') {
    alert("Completed appointments cannot be rescheduled.")
    return
  }
  rescheduleAppointmentId.value = appointmentId
  rescheduleDate.value = appt.date
  rescheduleTime.value = appt.time
  rescheduleDoctorId.value = appt.doctorId
  showReschedule.value = true
}

// Confirm reschedule
const confirmReschedule = async () => {
  if (!rescheduleAppointmentId.value || !rescheduleDoctorId.value) return
  await rescheduleAppointment(rescheduleAppointmentId.value, rescheduleDoctorId.value, rescheduleDate.value, rescheduleTime.value)
  showReschedule.value = false
  alert("Appointment rescheduled successfully.")
}
</script>

<template>
  <div class="p-8 space-y-6">
    <h1 class="text-3xl font-bold">All Appointments</h1>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Search bar -->
      <div class="w-64">
        <label class="block text-sm font-medium mb-1">Search</label>
        <Input
          v-model="searchQuery"
          placeholder="Search patient..."
          class="w-full h-10"
        />
      </div>

      <!-- Doctor filter -->
      <div>
        <label class="block text-sm font-medium mb-1">Doctor</label>
        <select v-model="selectedDoctor" class="h-10 border rounded-md px-2">
          <option value="all">All Doctors</option>
          <option v-for="doc in doctors" :key="doc.id" :value="doc.id">
            {{ doc.name }} ({{ doc.specialty }})
          </option>
        </select>
      </div>

      <!-- Clinic filter -->
      <div>
        <label class="block text-sm font-medium mb-1">Clinic</label>
        <select v-model="selectedClinic" class="h-10 border rounded-md px-2">
          <option value="all">All Clinics</option>
          <option v-for="c in clinics" :key="c.id" :value="c.id">
            {{ c.name }} <span v-if="c.clinicType">({{ c.clinicType }})</span>
          </option>
        </select>
      </div>

      <!-- Date filter -->
      <div>
        <label class="block text-sm font-medium mb-1">Date</label>
        <input
          type="date"
          v-model="selectedDate"
          class="h-10 border rounded-md px-2"
        />
      </div>
    </div>

    <!-- Appointments List -->
    <div v-if="filteredAppointments.length === 0" class="text-center py-12">
      <Icon icon="lucide:calendar-x" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-medium text-muted-foreground">No appointments found</h3>
      <p class="text-sm text-muted-foreground">Try changing the filters above.</p>
    </div>

    <div v-for="appt in filteredAppointments" :key="appt.id">
      <Card class="mb-4">
        <CardHeader class="flex justify-between items-center">
          <div>
            <CardTitle>{{ appt.patientName }} - {{ appt.type }}</CardTitle>
            <p class="text-sm text-muted-foreground">
              {{ appt.date }} at {{ appt.time }} • Dr. {{ appt.doctorName }} ({{ appt.doctorSpecialty || '' }}) • {{ appt.clinicName }} <span v-if="appt.clinicType">({{ appt.clinicType }})</span>
            </p>
            <Badge :class="{
              'bg-gray-100 text-gray-800': appt.status==='scheduled',
              'bg-gray-200 text-gray-800': appt.status==='checked-in',
              'bg-gray-400 text-white': appt.status==='completed',
              'bg-red-200 text-red-800': appt.status==='no-show',
              'bg-yellow-200 text-yellow-800': appt.status==='cancelled',
              'bg-blue-200 text-blue-800': appt.status==='rescheduled'
            }">
              {{ appt.status.replace('-', ' ').toUpperCase() }}
            </Badge>
          </div>
          <div class="flex gap-2">
            <Button 
              v-if="appt.status !== 'completed' && appt.status !== 'cancelled'" 
              @click="handleCancel(appt.id)" 
              variant="destructive" size="sm"
            >
              Cancel
            </Button>
            <Button 
              v-if="appt.status !== 'completed' && appt.status !== 'cancelled'" 
              @click="openReschedule(appt.id)" 
              variant="outline" size="sm"
            >
              Reschedule
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>

    <!-- Reschedule Dialog -->
    <Dialog v-model:open="showReschedule">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Select Doctor</label>
            <select v-model="rescheduleDoctorId" class="w-full border rounded-md p-2">
              <option v-for="doc in doctors" :key="doc.id" :value="doc.id">
                {{ doc.name }} ({{ doc.specialty }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Select Date</label>
            <input type="date" v-model="rescheduleDate" class="w-full border rounded-md p-2" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Select Time</label>
            <input type="time" v-model="rescheduleTime" class="w-full border rounded-md p-2" />
          </div>
        </div>

        <DialogFooter class="mt-4 flex justify-end gap-2">
          <Button variant="outline" @click="showReschedule = false">Cancel</Button>
          <Button @click="confirmReschedule">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>