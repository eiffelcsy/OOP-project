<script setup lang="ts">
import { ref } from 'vue'
import { useViewAppointments } from '../composables/useViewAppointments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CalendarDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import { Icon } from '@iconify/vue'

const {
  scheduledAppointments,
  pastAppointments,
  availableSlots,
  loading,
  isRescheduleDialogOpen,
  appointmentToReschedule,
  selectedDate,
  selectedTimeSlot,
  isCancelDialogOpen,
  appointmentToCancel,
  canRescheduleOrCancel,
  openRescheduleDialog,
  closeRescheduleDialog,
  openCancelDialog,
  closeCancelDialog,
  selectDate,
  selectTimeSlot,
  rescheduleAppointment,
  cancelAppointment,
  formatDate,
  getStatusColor
  ,
  fetchPatientAppointments
} = useViewAppointments()

// Loading states
const isRescheduling = ref(false)
const isCancelling = ref(false)

const handleReschedule = async () => {
  isRescheduling.value = true
  try {
    const success = await rescheduleAppointment()
    if (success) {
      // Could show a success toast here
      console.log('Appointment rescheduled successfully')
    }
  } finally {
    isRescheduling.value = false
  }
}

const handleCancel = async () => {
  isCancelling.value = true
  try {
    const success = await cancelAppointment()
    if (success) {
      // Could show a success toast here
      console.log('Appointment cancelled successfully')
    }
  } finally {
    isCancelling.value = false
  }
}

const handleDateSelect = (date: DateValue | undefined) => {
  selectDate(date)
}

// Explicitly trigger fetch and add page-level log to ensure we see console output when page mounts
fetchPatientAppointments().then(() => console.log('ViewAppointments: fetchPatientAppointments() completed')).catch(err => console.error('ViewAppointments: fetch failed', err))
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">My Appointments</h1>
      <p class="text-muted-foreground">View and manage upcoming and past appointments</p>
    </div>

    <!-- Upcoming Appointments -->
    <div class="mb-12">
      <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
        Upcoming Appointments
      </h2>
      
      <div v-if="scheduledAppointments.length === 0" class="text-center py-12">
        <Icon icon="lucide:calendar-x" class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p class="text-lg text-muted-foreground mb-2">No upcoming appointments</p>
        <p class="text-sm text-muted-foreground">Schedule your next appointment to see it here</p>
      </div>

      <div v-else class="space-y-4">
        <Card 
          v-for="appointment in scheduledAppointments" 
          :key="appointment.id"
        >
          <CardHeader>
            <div class="flex justify-between items-start">
              <div>
                <CardTitle class="text-lg">{{ appointment.clinicName }} <span class="text-sm text-muted-foreground">{{ appointment.clinicType }}</span></CardTitle>
                <CardDescription>
                  {{ appointment.doctorName }} • {{ appointment.doctorSpecialty || appointment.specialization }}
                </CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium border"
                  :class="getStatusColor(appointment.status)"
                >
                  {{ appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) }}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm">
                  <Icon icon="lucide:calendar" class="w-4 h-4 text-muted-foreground" />
                  <span>{{ formatDate(appointment.date) }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <Icon icon="lucide:clock" class="w-4 h-4 text-muted-foreground" />
                  <span>{{ appointment.time }}</span>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-start gap-2 text-sm">
                  <Icon icon="lucide:map-pin" class="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div>{{ appointment.address }}</div>
                    <div class="text-xs text-muted-foreground">Clinic type: {{ appointment.clinicType || 'N/A' }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="appointment.notes" class="mb-4 p-3 bg-muted rounded-md">
              <p class="text-sm text-muted-foreground">
                <Icon icon="lucide:sticky-note" class="w-4 h-4 inline mr-1" />
                {{ appointment.notes }}
              </p>
            </div>

            <div class="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                @click="openRescheduleDialog(appointment)"
                class="flex items-center gap-2"
              >
                <Icon icon="lucide:calendar-clock" class="w-4 h-4" />
                Reschedule
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                @click="openCancelDialog(appointment)"
                class="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Icon icon="lucide:x" class="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Past Appointments -->
    <div>
      <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
        Past Appointments
      </h2>
      
      <div v-if="pastAppointments.length === 0" class="text-center py-12">
        <Icon icon="lucide:calendar" class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p class="text-lg text-muted-foreground mb-2">No past appointments</p>
        <p class="text-sm text-muted-foreground">Your appointment history will appear here</p>
      </div>

      <div v-else class="space-y-4">
        <Card 
          v-for="appointment in pastAppointments" 
          :key="appointment.id"
        >
          <CardHeader>
            <div class="flex justify-between items-start">
              <div>
                <CardTitle class="text-lg">{{ appointment.clinicName }} <span class="text-sm text-muted-foreground">{{ appointment.clinicType }}</span></CardTitle>
                <CardDescription>
                  {{ appointment.doctorName }} • {{ appointment.doctorSpecialty || appointment.specialization }}
                </CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium border"
                  :class="getStatusColor(appointment.status)"
                >
                  {{ appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) }}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm">
                  <Icon icon="lucide:calendar" class="w-4 h-4 text-muted-foreground" />
                  <span>{{ formatDate(appointment.date) }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <Icon icon="lucide:clock" class="w-4 h-4 text-muted-foreground" />
                  <span>{{ appointment.time }}</span>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-start gap-2 text-sm">
                  <Icon icon="lucide:map-pin" class="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div>{{ appointment.address }}</div>
                    <div class="text-xs text-muted-foreground">Clinic type: {{ appointment.clinicType || 'N/A' }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="appointment.notes" class="mt-4 p-3 bg-muted rounded-md">
              <p class="text-sm text-muted-foreground">
                <Icon icon="lucide:sticky-note" class="w-4 h-4 inline mr-1" />
                {{ appointment.notes }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Reschedule Dialog -->
    <Dialog v-model:open="isRescheduleDialogOpen">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Update your appointment with {{ appointmentToReschedule?.doctorName }} at {{ appointmentToReschedule?.clinicName }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="appointmentToReschedule" class="space-y-6">
          <!-- Current appointment details -->
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium mb-2 text-base">Current Appointment</h4>
            <div class="flex justify-between gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Date:</span>
                <span class="ml-2">{{ formatDate(appointmentToReschedule.date) }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Time:</span>
                <span class="ml-2">{{ appointmentToReschedule.time }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <!-- Calendar -->
            <div class="space-y-4">
              <h4 class="font-medium">Select New Date</h4>
              <Calendar 
                v-model="selectedDate" 
                :min-value="today(getLocalTimeZone())"
                @update:model-value="handleDateSelect" 
                class="rounded-md border p-4" 
              />
            </div>

            <!-- Time Slots -->
            <div class="flex-1 space-y-4">
              <h4 class="font-medium">Select New Time</h4>
              <div v-if="selectedDate" class="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                <Button 
                  v-for="slot in availableSlots" 
                  :key="slot.id"
                  :variant="selectedTimeSlot?.id === slot.id ? 'default' : 'outline'" 
                  size="sm"
                  @click="selectTimeSlot(slot)"
                >
                  {{ slot.time }}
                </Button>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                Select a date to view available time slots
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeRescheduleDialog">
            Cancel
          </Button>
          <Button 
            @click="handleReschedule"
            :disabled="!canRescheduleOrCancel || isRescheduling"
          >
            <Icon v-if="isRescheduling" icon="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
            {{ isRescheduling ? 'Rescheduling...' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Cancel Confirmation Dialog -->
    <Dialog v-model:open="isCancelDialogOpen">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-red-600">
            <Icon icon="lucide:alert-triangle" class="w-5 h-5" />
            Cancel Appointment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your appointment?
          </DialogDescription>
        </DialogHeader>

        <div v-if="appointmentToCancel" class="space-y-4">
          <div class="p-4 bg-muted rounded-lg">
            <div class="space-y-2 text-sm">
              <div><strong>Doctor:</strong> {{ appointmentToCancel.doctorName }} <span class="text-muted-foreground">{{ appointmentToCancel.doctorSpecialty || '' }}</span></div>
              <div><strong>Clinic:</strong> {{ appointmentToCancel.clinicName }} <span class="text-muted-foreground">{{ appointmentToCancel.clinicType || '' }}</span></div>
              <div><strong>Date:</strong> {{ formatDate(appointmentToCancel.date) }}</div>
              <div><strong>Time:</strong> {{ appointmentToCancel.time }}</div>
            </div>
          </div>
          
          <p class="text-sm text-muted-foreground">
            This action cannot be undone. You will need to book a new appointment if you change your mind.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeCancelDialog">
            Keep Appointment
          </Button>
          <Button 
            variant="destructive"
            @click="handleCancel"
            :disabled="isCancelling"
          >
            <Icon v-if="isCancelling" icon="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
            {{ isCancelling ? 'Cancelling...' : 'Yes, Cancel' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
