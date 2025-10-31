<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useViewAppointments } from '../composables/useViewAppointments'
import { useBookAppointment } from '../composables/useBookAppointment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CalendarDate, parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date'
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
  upcomingSortOrder,
  toggleUpcomingSortOrder,
  pastSortOrder,
  togglePastSortOrder,
  fetchPatientAppointments
} = useViewAppointments()

// Use booking composable so reschedule dialog has the same availability logic
const {
  availableSlots: bookAvailableSlots,
  availableWeekdays,
  availableDates,
  selectDate: bookSelectDate,
  selectTimeSlot: bookSelectTimeSlot,
  selectDoctor: bookSelectDoctor,
  fetchAppointmentsForDoctor,
  bookingData
} = useBookAppointment()

// Helper to create arrays from refs/sets/etc (same helper used in BookAppointment.vue)
const toIterableArray = (maybeRef: any) => {
  const raw = (maybeRef && (maybeRef as any).value !== undefined) ? (maybeRef as any).value : maybeRef
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (raw instanceof Set) return Array.from(raw)
  if (typeof raw === 'object' && typeof (raw as any)[Symbol.iterator] === 'function') {
    try { return Array.from(raw) } catch { /* fallthrough */ }
  }
  if (typeof raw === 'object') return Object.values(raw)
  return []
}

const availableWeekdaysArray = computed(() => toIterableArray(availableWeekdays))
const availableDatesArray = computed(() => toIterableArray(availableDates))

// Highlighting recently created appointment (via route query: ?highlight=<id>)
const route = useRoute()
const router = useRouter()
const highlightedId = ref<string | null>(null)
const highlightActive = ref(false)

const applyHighlightFromQuery = () => {
  try {
    const q = route.query?.highlight as string | undefined
    if (q) {
      highlightedId.value = String(q)
      highlightActive.value = true
      // remove highlight after 5s
      setTimeout(() => {
        highlightActive.value = false
        // optionally remove the query param so refresh doesn't re-highlight
        try {
          const newQuery = { ...route.query }
          delete (newQuery as any).highlight
          router.replace({ query: newQuery })
        } catch (_) {}
      }, 5000)
    }
  } catch (e) {
    console.warn('applyHighlightFromQuery failed', e)
  }
}

// Wrap handlers so both composables stay in sync
const handleDateSelect = async (date: DateValue | undefined) => {
  // If we have a selected doctor, prefetch their appointments for this date so booked flags are available
  try {
    const docId = (bookingData as any)?.doctor?.id ?? (bookingData as any)?.doctor_id
    if (docId && typeof fetchAppointmentsForDoctor === 'function' && date) {
      await fetchAppointmentsForDoctor(Number(docId), date).catch((e: any) => console.warn('fetchAppointmentsForDoctor in handleDateSelect failed', e))
    }
  } catch (e) {
    // ignore
  }

  // call both book flow and view flow
  if ((bookSelectDate as any)) (bookSelectDate as any)(date)
  if ((selectDate as any)) (selectDate as any)(date)
}

const handleSlotSelect = (slot: any) => {
  if ((bookSelectTimeSlot as any)) (bookSelectTimeSlot as any)(slot)
  if ((selectTimeSlot as any)) (selectTimeSlot as any)(slot)
}

// Open reschedule and prime booking composable so calendar & slots populate
const openReschedule = async (appointment: any) => {
  // reset wizard to first step and clear previous selection
  wizardStep.value = 1
  selectedDate.value = undefined
  selectedTimeSlot.value = null

  // open view's reschedule dialog and set appointment
  openRescheduleDialog(appointment)

  // try to prime booking composable with doctor so it fetches schedules/slots when date is chosen
  const docId = appointment?.doctor_id ?? appointment?.doctorId ?? appointment?.doctor_id
  if (docId && (bookSelectDoctor as any)) {
    try {
      (bookSelectDoctor as any)({ id: docId })
    } catch (e) {
      console.warn('bookSelectDoctor failed to run', e)
    }
  }

  // Also prime the booking composable with the appointment date so slots compute immediately
  try {
    const sgDateStr = new Date(appointment.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
    const parsed = parseDate(sgDateStr)

    // If we have a doctor id and the helper to prefetch appointments, await it so fetchedAppointments exist
    try {
      const docNum = Number(docId)
      if (!isNaN(docNum) && typeof fetchAppointmentsForDoctor === 'function') {
        await fetchAppointmentsForDoctor(docNum, parsed).catch((e: any) => console.warn('fetchAppointmentsForDoctor failed', e))
      }
    } catch (e) {
      // ignore
    }

    if ((bookSelectDate as any)) {
      (bookSelectDate as any)(parsed)
    }
  } catch (e) {
    // ignore parse failures
  }
}

// Local UI filters for sections
const upcomingStatusFilter = ref<string>('all')
const pastStatusFilter = ref<string>('all')

// Helpers to compute distinct statuses present in each section
const upcomingStatuses = computed(() => {
  const s = new Set<string>()
  scheduledAppointments.value.forEach(a => s.add(a.status || 'scheduled'))
  return Array.from(s)
})

const pastStatuses = computed(() => {
  const s = new Set<string>()
  pastAppointments.value.forEach(a => s.add(a.status || 'completed'))
  return Array.from(s)
})

const prettyStatus = (status: string) => {
  if (!status) return ''
  switch (status) {
    case 'no-show': return 'No-show'
    case 'checked-in': return 'Checked-in'
    case 'in-progress': return 'In-progress'
    case 'cancelled': return 'Cancelled'
    case 'completed': return 'Completed'
    case 'scheduled': return 'Scheduled'
    case 'confirmed': return 'Confirmed'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

const filteredScheduledAppointments = computed(() => {
  if (upcomingStatusFilter.value === 'all') return scheduledAppointments.value
  return scheduledAppointments.value.filter(a => a.status === upcomingStatusFilter.value)
})

const filteredPastAppointments = computed(() => {
  if (pastStatusFilter.value === 'all') return pastAppointments.value
  return pastAppointments.value.filter(a => a.status === pastStatusFilter.value)
})

// Loading states
const isRescheduling = ref(false)
const isCancelling = ref(false)

// Wizard step for reschedule: 1 = pick date, 2 = pick time
const wizardStep = ref(1)

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

// Helper to safely format selectedDate which may be a CalendarDate or Date
const formatMaybeDate = (d: any) => {
  try {
    return d ? (formatDate as any)(d) : ''
  } catch (e) {
    return ''
  }
}

// Helper to show a slot's display time without assuming types
const slotTimeDisplay = (slot: any) => {
  if (!slot) return ''
  if (slot.slot_start) return new Date(slot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })
  return slot.time ?? slot.display ?? ''
}

// Determine if a slot should be treated as booked for the reschedule UI.
// Allow selecting the appointment's own current slot (so the user can keep the same time if desired).
const isSlotBooked = (slot: any) => {
  try {
    const bookedFlag = !!(slot && (slot.booked === true || slot.status === 'scheduled'))
    if (!bookedFlag) return false

    // If we have an appointment being rescheduled, allow selecting the same exact times
    if (appointmentToReschedule && appointmentToReschedule.value) {
      const appt = appointmentToReschedule.value
      const apptStart = appt.start_time ?? appt.startTime ?? appt.start ?? appt.time
      const apptEnd = appt.end_time ?? appt.endTime ?? appt.end
      // Compare normalized time strings (slot.slot_start may include date or +08 offset)
      const normalize = (s: any) => s ? String(s).replace(/[:\-T+ ]/g, '') : ''
      const s1 = normalize(slot.slot_start || slot.start || slot.display)
      const s2 = normalize(slot.slot_end || slot.end)
      const a1 = normalize(apptStart)
      const a2 = normalize(apptEnd)
      if (a1 && a2 && s1 && s2 && a1 === s1 && a2 === s2) return false
    }

    return true
  } catch (e) {
    return !!(slot && slot.booked)
  }
}

// handleDateSelect is defined above to keep book and view composables in sync

// Explicitly trigger fetch and add page-level log to ensure we see console output when page mounts
fetchPatientAppointments().then(() => {
  console.log('ViewAppointments: fetchPatientAppointments() completed')
  applyHighlightFromQuery()
}).catch(err => console.error('ViewAppointments: fetch failed', err))
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
        <!-- Filters for upcoming section -->
        <div class="mb-4 flex items-center gap-4">
          <div class="text-sm text-muted-foreground">Filter by status:</div>
          <div class="flex gap-2 items-center">
            <Badge variant="outline" class="cursor-pointer" :class="upcomingStatusFilter === 'all' ? 'bg-gray-100' : ''" @click="upcomingStatusFilter = 'all'">All</Badge>
            <Badge v-for="status in upcomingStatuses" :key="status" variant="outline" class="cursor-pointer" :class="upcomingStatusFilter === status ? 'bg-gray-100' : ''" @click="upcomingStatusFilter = status">{{ prettyStatus(status) }}</Badge>
            <Button variant="ghost" size="sm" class="ml-2" @click="upcomingStatusFilter = 'all'">Clear</Button>
          </div>
          <!-- Sort control placed on same line as status filter -->
          <div class="ml-auto flex items-center gap-2">
            <label class="text-sm text-muted-foreground">Sort:</label>
            <select v-model="upcomingSortOrder" class="text-sm rounded border px-2 py-1">
              <option value="asc">Oldest first</option>
              <option value="desc">Newest first</option>
            </select>
          </div>
        </div>

  <!-- Explanatory line -->
  <p class="text-sm text-muted-foreground mb-2">Upcoming appointments include statuses: <strong>Scheduled</strong>, <strong>Confirmed</strong> and <strong>Checked-in</strong>.</p>

        <div v-for="appointment in filteredScheduledAppointments" :key="appointment.id">
          <Card :class="(appointment.id && highlightedId && String(appointment.id) === String(highlightedId) && highlightActive) ? 'ring-2 ring-sky-200 bg-sky-50' : ''">
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
                <template v-if="appointment.status === 'scheduled'">
                  <Button 
                    variant="outline" 
                    size="sm"
                    @click="openReschedule(appointment)"
                    class="flex items-center gap-2"
                  >
                    <Icon icon="lucide:calendar-clock" class="w-4 h-4" />
                    Reschedule
                  </Button>
                  <Button variant="ghost" size="sm" @click="openCancelDialog(appointment)">Cancel</Button>
                </template>
              </div>
            </CardContent>
          </Card>
        </div>
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
        <!-- Filters for past section -->
        <div class="mb-4 flex items-center gap-4">
          <div class="text-sm text-muted-foreground">Filter by status:</div>
          <div class="flex gap-2 items-center">
            <Badge variant="outline" class="cursor-pointer" :class="pastStatusFilter === 'all' ? 'bg-gray-100' : ''" @click="pastStatusFilter = 'all'">All</Badge>
            <Badge v-for="status in pastStatuses" :key="status" variant="outline" class="cursor-pointer" :class="pastStatusFilter === status ? 'bg-gray-100' : ''" @click="pastStatusFilter = status">{{ prettyStatus(status) }}</Badge>
            <Button variant="ghost" size="sm" class="ml-2" @click="pastStatusFilter = 'all'">Clear</Button>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <label class="text-sm text-muted-foreground">Sort:</label>
            <select v-model="pastSortOrder" class="text-sm rounded border px-2 py-1">
              <option value="asc">Oldest first</option>
              <option value="desc">Newest first</option>
            </select>
          </div>
        </div>

  <!-- Explanatory line -->
  <p class="text-sm text-muted-foreground mb-2">Past appointments include statuses: <strong>Completed</strong>, <strong>Cancelled</strong> and <strong>No-show</strong>.</p>

        <Card 
          v-for="appointment in filteredPastAppointments" 
          :key="appointment.id"
          :class="(appointment.id && highlightedId && String(appointment.id) === String(highlightedId) && highlightActive) ? 'ring-2 ring-sky-200 bg-sky-50' : ''"
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

    <!-- Reschedule Dialog (two-step wizard) -->
    <Dialog v-model:open="isRescheduleDialogOpen">
      <DialogContent class="max-w-[1000px] w-[96vw] mx-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Update your appointment with {{ appointmentToReschedule?.doctorName }} at {{ appointmentToReschedule?.clinicName }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="appointmentToReschedule" class="p-6">
          <!-- Step indicator -->
          <div class="flex items-center gap-4 mb-6">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center', wizardStep===1 ? 'bg-primary text-white' : 'bg-gray-100']">1</div>
            <div class="flex-1 border-t"></div>
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center', wizardStep===2 ? 'bg-primary text-white' : 'bg-gray-100']">2</div>
          </div>

          <!-- Step 1: Calendar -->
          <div v-if="wizardStep===1">
            <div class="mb-4 p-4 bg-muted rounded">
              <h4 class="font-medium mb-2">Pick a Date</h4>
              <p class="text-sm text-muted-foreground">Choose a date with available time slots.</p>
            </div>

            <div class="flex justify-center">
              <Calendar
                v-model="selectedDate"
                :min-value="today(getLocalTimeZone())"
                :available-weekdays="availableWeekdaysArray"
                :available-dates="availableDatesArray"
                @update:model-value="(d) => { handleDateSelect(d); if (d) wizardStep = 2 }"
                class="rounded-md border"
              />
            </div>

            <div class="mt-6 flex justify-end">
              <Button variant="outline" @click="closeRescheduleDialog" class="mr-2">Cancel</Button>
              <Button :disabled="!selectedDate" @click="wizardStep = 2">Next</Button>
            </div>
          </div>

          <!-- Step 2: Time slots (use same layout/logic as BookAppointment) -->
          <div v-else>
            <Card>
              <CardHeader>
                <CardTitle class="text-lg">Available Time Slots</CardTitle>
                <CardDescription v-if="!bookingData.date">
                  Please select a date first
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="bookingData.date" class="grid grid-cols-2 gap-2">
                  <Button v-for="slot in bookAvailableSlots" :key="slot.id"
                    :variant="bookingData.timeSlot?.id === slot.id ? 'default' : 'outline'"
                    size="sm"
                    :disabled="isSlotBooked(slot)"
                    @click="handleSlotSelect(slot)">
                    <span :class="isSlotBooked(slot) ? 'text-muted-foreground line-through' : ''">
                      {{ new Date(slot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) }} - {{ new Date(slot.slot_end).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) }}
                    </span>
                  </Button>
                </div>
                <div v-else class="text-center py-8 text-muted-foreground">
                  Select a date to view available time slots
                </div>
              </CardContent>
            </Card>

            <div class="mt-6 flex justify-between">
              <Button variant="outline" @click="wizardStep = 1">Back</Button>
              <div>
                <Button variant="outline" @click="closeRescheduleDialog" class="mr-2">Cancel</Button>
                <Button @click="handleReschedule" :disabled="!selectedTimeSlot || isRescheduling">
                  <Icon v-if="isRescheduling" icon="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isRescheduling ? 'Rescheduling...' : 'Save Changes' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
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
