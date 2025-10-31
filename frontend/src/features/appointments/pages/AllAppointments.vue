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
    <h1 class="text-3xl font-bold">All Upcoming Appointments</h1>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Search bar -->
      <div class="w-64">
        <label class="block text-sm font-medium mb-1">Search</label>
        <Input v-model="searchQuery" placeholder="Search patient..." class="w-full h-10" />
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

      <!-- Date filter -->
      <div>
        <label class="block text-sm font-medium mb-1">Date</label>
        <input type="date" v-model="selectedDate" class="h-10 border rounded-md px-2" />
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
              {{ appt.date }} at {{ appt.time }} • Dr. {{ appt.doctorName }} ({{ appt.doctorSpecialty || '' }}) • {{
                appt.clinicName }} <span v-if="appt.clinicType">({{ appt.clinicType }})</span>
            </p>
            <Badge :class="{
              'bg-gray-100 text-gray-800': appt.status === 'scheduled',
              'bg-gray-200 text-gray-800': appt.status === 'checked-in',
              'bg-gray-400 text-white': appt.status === 'completed',
              'bg-red-200 text-red-800': appt.status === 'no-show',
              'bg-yellow-200 text-yellow-800': appt.status === 'cancelled',
              'bg-blue-200 text-blue-800': appt.status === 'rescheduled'
            }">
              {{ appt.status.replace('-', ' ').toUpperCase() }}
            </Badge>
          </div>
          <div class="flex gap-2">
            <Button v-if="appt.status !== 'completed' && appt.status !== 'cancelled'" @click="handleCancel(appt.id)"
              variant="destructive" size="sm">
              Cancel
            </Button>
            <Button v-if="appt.status !== 'completed' && appt.status !== 'cancelled'" @click="openReschedule(appt.id)"
              variant="outline" size="sm">
              Reschedule
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>

    <!-- Reschedule Dialog -->
    <Dialog v-model:open="showReschedule">
      <DialogContent class="max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader class="pb-4">
          <DialogTitle
            class="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Reschedule Appointment
          </DialogTitle>
          <p class="text-sm text-muted-foreground mt-2">
            Follow the steps below to reschedule appointment
          </p>
        </DialogHeader>

        <div class="space-y-6">
          <!-- Step 1: Doctor Selection -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div
                class="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <h3 class="text-lg font-semibold">Choose Your Doctor</h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
              <div v-for="doctor in doctors.filter(d => d.active)" :key="doctor.id"
                class="group relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md" :class="rescheduleDoctorId === doctor.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50'" @click="rescheduleDoctorId = doctor.id; rescheduleTime = ''">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-base truncate">{{ doctor.name }}</span>
                      <Badge v-if="rescheduleDoctorId === doctor.id" variant="default" class="text-xs shrink-0">
                        Selected
                      </Badge>
                    </div>
                    <p class="text-sm text-muted-foreground">{{ doctor.specialty }}</p>
                  </div>
                  <div class="shrink-0">
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                      :class="rescheduleDoctorId === doctor.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'">
                      <div v-if="rescheduleDoctorId === doctor.id" class="w-2 h-2 rounded-full bg-primary-foreground">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Date & Time Selection -->
          <div v-if="rescheduleDoctorId" class="space-y-6">
            <!-- Date Selection -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div
                  class="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  2
                </div>
                <h3 class="text-lg font-semibold">Select Date</h3>
              </div>

              <div class="relative">
                <input type="date" v-model="rescheduleDate"
                  class="w-full border-2 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  :min="new Date().toISOString().split('T')[0]" />
              </div>
            </div>

            <!-- Time Selection -->
            <div v-if="rescheduleDate" class="space-y-3">
              <div class="flex items-center gap-2">
                <div
                  class="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  3
                </div>
                <h3 class="text-lg font-semibold">Choose Time Slot</h3>
              </div>

              <div
                class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                <Button
                  v-for="slot in Array.from({ length: 8 }).map((_, idx) => ({ id: idx + 1, slot_start: `${9 + idx}:00`, status: Math.random() > 0.2 ? 'available' : 'unavailable' }))"
                  :key="slot.id" :variant="rescheduleTime === slot.slot_start ? 'default' : 'outline'"
                  class="h-11 font-medium transition-all"
                  :class="slot.status !== 'available' ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'"
                  :disabled="slot.status !== 'available'" @click="rescheduleTime = slot.slot_start">
                  {{ slot.slot_start }}
                </Button>
              </div>
            </div>
          </div>

          <!-- Waiting states -->
          <div v-if="!rescheduleDoctorId" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p class="text-muted-foreground">Select a doctor to continue</p>
          </div>

          <div v-else-if="rescheduleDoctorId && !rescheduleDate"
            class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-muted-foreground">Select a date to view available times</p>
          </div>
        </div>

        <DialogFooter class="mt-6 pt-4 border-t flex-row gap-3 sm:gap-2">
          <Button variant="outline" @click="showReschedule = false" class="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button :disabled="!rescheduleDoctorId || !rescheduleDate || !rescheduleTime" @click="confirmReschedule"
            class="flex-1 sm:flex-none">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Confirm Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>



  </div>
</template>