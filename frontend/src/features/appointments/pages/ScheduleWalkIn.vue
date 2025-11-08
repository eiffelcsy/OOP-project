<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScheduleWalkIn } from '../composables/useScheduleWalkIn'
import { Stepper, StepperItem, StepperIndicator, StepperTitle, StepperDescription, StepperSeparator } from '@/components/ui/stepper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { CalendarDate, parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import { Icon } from '@iconify/vue'

const {
    currentStep,
    bookingData,
    staffClinic,
    availableDoctors,
    availableSlots,
    availableDates,
    canProceedToNextStep,
    isLastStep,
    isFirstStep,
    updatePatientInfo,
    selectDoctor,
    selectDate,
    selectTimeSlot,
    nextStep,
    previousStep,
    scheduleWalkIn,
    formatTime,
} = useScheduleWalkIn()

// Helper to convert a value (ref, Set, Array, iterable, plain object) into a safe array
const toIterableArray = (maybeRef: any) => {
    // unwrap ref-like values
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

const availableDatesArray = computed(() => toIterableArray(availableDates))

const isBookingConfirmed = ref(false)
const bookingResult = ref<any>(null)

const handleScheduleWalkIn = async () => {
    const result = await scheduleWalkIn()
    bookingResult.value = result
    if (result.success) {
        isBookingConfirmed.value = true
    }
}

const stepperItems = [
    { title: 'Patient Info', description: 'Enter patient details' },
    { title: 'Doctor & Time', description: 'Select doctor and appointment time' },
    { title: 'Confirmation', description: 'Review and confirm walk-in appointment' }
]


// Calendar setup
const calendarValue = ref<CalendarDate>()

const handleDateSelect = (date: DateValue | undefined) => {
    if (date && date instanceof CalendarDate) {
        calendarValue.value = date
        selectDate(date)
    }
}

// Patient form data
const patientForm = ref({
    name: '',
    phone: '',
    nric: '',
    email: '',
    dateOfBirth: '',
})

const updatePatient = () => {
    updatePatientInfo(patientForm.value)
}
</script>

<template>
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <div class="mb-8">
            <h1 class="text-3xl font-bold mb-2">Schedule Walk-in Appointment</h1>
            <p class="text-muted-foreground">Schedule a walk-in appointment for {{ staffClinic.name }}</p>
        </div>

        <div class="mb-8">
            <Stepper v-model="currentStep" class="w-full items-center justify-center">
                <StepperItem v-for="(item, index) in stepperItems" :key="index" :step="index + 1"
                    :class="index + 1 < stepperItems.length ? 'flex-1' : 'flex-none'">
                    <div class="p-1 flex flex-col items-center text-center gap-1 rounded-md max-w-[10rem] mx-auto">
                        <StepperIndicator :step="index + 1">
                            <Icon icon="lucide:user" v-if="index + 1 === 1" />
                            <Icon icon="healthicons:doctor-outline" v-if="index + 1 === 2" />
                            <Icon icon="lucide:check" v-if="index + 1 === 3" />
                        </StepperIndicator>
                        <div class="flex flex-col items-center">
                            <StepperTitle class="text-sm font-medium hidden sm:block">{{ item.title }}</StepperTitle>
                            <StepperDescription class="text-xs text-muted-foreground hidden sm:block">
                                {{ item.description }}
                            </StepperDescription>
                        </div>
                    </div>
                    <StepperSeparator v-if="index + 1 < stepperItems.length" class="flex-1 h-[2px]" />
                </StepperItem>
            </Stepper>
        </div>

        <!-- Step Content -->
        <div class="min-h-[500px] flex h-full w-full">
            <!-- Step 1: Patient Information -->
            <div v-if="currentStep === 1" class="space-y-6 w-full">
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Patient Information</CardTitle>
                        <CardDescription>
                            Enter the patient's details for the walk-in appointment
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <Label for="patient-name">Full Name *</Label>
                                <Input id="patient-name" v-model="patientForm.name" @input="updatePatient"
                                    placeholder="Enter patient's full name" required />
                            </div>
                            <div class="space-y-2">
                                <Label for="patient-phone">Phone Number *</Label>
                                <Input id="patient-phone" v-model="patientForm.phone" @input="updatePatient"
                                    placeholder="+65 XXXX XXXX" required />
                            </div>
                            <div class="space-y-2">
                                <Label for="patient-nric">NRIC/FIN *</Label>
                                <Input id="patient-nric" v-model="patientForm.nric" @input="updatePatient"
                                    placeholder="SXXXXXXXA" required />
                            </div>
                            <div class="space-y-2">
                                <Label for="patient-email">Email</Label>
                                <Input id="patient-email" v-model="patientForm.email" @input="updatePatient"
                                    type="email" placeholder="patient@example.com" />
                            </div>
                            <div class="space-y-2">
                                <Label for="patient-dob">Date of Birth</Label>
                                <Input id="patient-dob" v-model="patientForm.dateOfBirth" @input="updatePatient"
                                    type="date" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Step 2: Doctor & Time Selection -->
            <div v-if="currentStep === 2" class="space-y-6 w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Select Doctor & Time</CardTitle>
                        <CardDescription>
                            Choose an available doctor and appointment time
                        </CardDescription>
                    </CardHeader>
                </Card>

                <!-- Doctor Selection -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold">Available Doctors</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card v-for="doctor in availableDoctors.filter(d => d.active)" :key="doctor.id"
                            class="cursor-pointer transition-colors hover:bg-muted/50"
                            :class="{ 'ring-2 ring-primary': bookingData.doctor?.id === doctor.id }"
                            @click="selectDoctor(doctor)">
                            <CardHeader>
                                <CardTitle class="text-lg">{{ doctor.name }}</CardTitle>
                                <CardDescription>
                                    <div class="space-y-1">
                                        <p class="font-medium">{{ doctor.specialty }}</p>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>

                <!-- Date & Time Selection -->
                <div v-if="bookingData.doctor" class="flex gap-6">
                    <!-- Calendar -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-lg">Select Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar v-model="calendarValue" :min-value="today(getLocalTimeZone())"
                                :available-dates="availableDatesArray"
                                @update:model-value="handleDateSelect" class="rounded-md border p-6" />
                            
                            <!-- Legend explaining the green highlight -->
                            <p class="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                                <span class="inline-block size-4 rounded-full bg-green-100 border border-green-200 shrink-0" aria-hidden="true"></span>
                                Days highlighted in light green have available time slots — select one to view times.
                            </p>
                        </CardContent>
                    </Card>

                    <!-- Time Slots -->
                    <Card class="w-full">
                        <CardHeader>
                            <CardTitle class="text-lg">Available Time Slots</CardTitle>
                            <CardDescription v-if="!bookingData.date">
                                Please select a date first
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div v-if="bookingData.date" class="grid grid-cols-2 gap-2">
                                <Button v-for="slot in availableSlots" :key="slot.id"
                                    :variant="bookingData.timeSlot?.id === slot.id ? 'default' : 'outline'" size="sm"
                                    :disabled="slot.status !== 'available'"
                                    @click="slot.status === 'available' && selectTimeSlot(slot)">
                                    {{ new Date(slot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) }} - {{ new Date(slot.slot_end).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) }}
                                </Button>
                            </div>
                            <div v-else class="text-center py-8 text-muted-foreground">
                                Select a date to view available time slots
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Step 3: Confirmation -->
            <div v-if="currentStep === 3" class="space-y-6 flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Confirm Walk-in Appointment</CardTitle>
                        <CardDescription>
                            Please review the appointment details before confirming
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4 flex flex-col justify-between">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-6">
                                <div>
                                    <Label class="text-sm font-medium">Patient</Label>
                                    <p class="text-sm text-muted-foreground mt-1">{{ bookingData.patient?.name }}</p>
                                    <p class="text-xs text-muted-foreground">{{ bookingData.patient?.phone }}</p>
                                </div>
                                <div>
                                    <Label class="text-sm font-medium">Clinic</Label>
                                    <p class="text-sm text-muted-foreground mt-1">{{ staffClinic.name }}</p>
                                    <p class="text-xs text-muted-foreground">{{ staffClinic.address_line }}</p>
                                </div>
                                <div>
                                    <Label class="text-sm font-medium">Doctor</Label>
                                    <p class="text-sm text-muted-foreground mt-1">{{ bookingData.doctor?.name }}</p>
                                    <p class="text-xs text-muted-foreground">{{ bookingData.doctor?.specialty }}</p>
                                </div>
                            </div>
                            <div class="space-y-6">
                                <div>
                                    <Label class="text-sm font-medium">Date</Label>
                                    <p class="text-sm text-muted-foreground mt-1">
                                        {{ bookingData.date?.toDate(getLocalTimeZone()).toLocaleDateString() }}
                                    </p>
                                </div>
                                <div>
                                    <Label class="text-sm font-medium">Time</Label>
                                    <p class="text-sm text-muted-foreground mt-1">{{ bookingData.timeSlot?.slot_start ? new Date(bookingData.timeSlot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) : '' }} - {{ bookingData.timeSlot?.slot_end ? new Date(bookingData.timeSlot.slot_end).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) : '' }}</p>
                                </div>
                            </div>
                        </div>

                        <div v-if="!isBookingConfirmed" class="pt-4">
                            <Button @click="handleScheduleWalkIn" class="w-full" size="lg">
                                Schedule Walk-in Appointment
                            </Button>
                        </div>

                        <div v-else class="text-center py-8">
                            <div class="text-green-600 mb-2">
                                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold mb-2">Walk-in Appointment Scheduled!</h3>
                            <p class="text-muted-foreground mb-4">
                                The walk-in appointment has been successfully scheduled.
                            </p>
                            <div v-if="bookingResult?.success" class="space-y-2">
                                <p class="text-sm"><strong>Appointment ID:</strong> {{ bookingResult.appointmentId }}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-8" v-if="!isBookingConfirmed">
            <Button variant="outline" @click="previousStep" :disabled="isFirstStep">
                Previous
            </Button>
            <Button @click="nextStep" :disabled="!canProceedToNextStep || isLastStep">
                Next
            </Button>
        </div>
    </div>
</template>
