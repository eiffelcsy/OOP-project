<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBookAppointment } from '../composables/useBookAppointment'
import { TIME_ZONE } from '@/lib/utils'
// Removed Supabase debug code
import { Stepper, StepperItem, StepperIndicator, StepperTitle, StepperDescription, StepperSeparator } from '@/components/ui/stepper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDate, parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import { Icon } from '@iconify/vue'

const {
    currentStep,
    bookingData,
    clinicSearchQuery,
    selectedClinicType,
    selectedRegion,
    // doctor filters & search
    doctorSearchQuery,
    selectedDoctorSpecialty,
    distinctDoctorSpecialties,
    filteredClinics,
    availableDoctors,
    availableSlots,
    availableWeekdays,
    availableDates,
    distinctClinicTypes,
    distinctRegions,
    canProceedToNextStep,
    isLastStep,
    isFirstStep,
    selectClinic,
    selectDoctor,
    selectDate,
    selectTimeSlot,
    nextStep,
    previousStep,
    confirmBooking
} = useBookAppointment()

// doctor search & debug helpers handled via composable

const isBookingConfirmed = ref(false)

const handleConfirmBooking = async () => {
    try {
        console.log('handleConfirmBooking: calling confirmBooking')
        const result: any = await confirmBooking()
        console.log('handleConfirmBooking: confirmBooking returned', result)

        // support both boolean return and { success: boolean } shape
        const ok = typeof result === 'boolean' ? result : (result && result.success === true)
        if (ok) {
            isBookingConfirmed.value = true
        } else {
            // not successful — make sure user sees feedback in console
            console.warn('Appointment confirmation failed or returned false', result)
        }
    } catch (err) {
        console.error('handleConfirmBooking: unexpected error', err)
    }
}

const stepperItems = [
    { title: 'Select Clinic', description: 'Choose your preferred clinic' },
    { title: 'Choose Doctor', description: 'Select a doctor for your appointment' },
    { title: 'Date & Time', description: 'Pick your preferred date and time' },
    { title: 'Confirmation', description: 'Review and confirm your appointment' }
]

// clinicTypes and regions are derived from the composable now
// We'll use the computed lists provided by useBookAppointment
const formatLabel = (val: string) => {
    if (!val) return ''
    if (val === 'All') return 'All'
    // normalize like 'GENERAL' -> 'General', 'NORTH-EAST' -> 'North-East'
    return val.toLowerCase().split(/[ _-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-')
}

const calendarValue = ref<CalendarDate>()

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

const availableWeekdaysArray = computed(() => toIterableArray(availableWeekdays))
const availableDatesArray = computed(() => toIterableArray(availableDates))

const handleDateSelect = (date: DateValue | undefined) => {
    if (date && date instanceof CalendarDate) {
        calendarValue.value = date
        selectDate(date)
    }
}
</script>

<template>
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <div class="mb-8">
            <h1 class="text-3xl font-bold mb-2">Book an Appointment</h1>
            <p class="text-muted-foreground">Follow the steps below to schedule an appointment</p>
            <!-- (debug controls removed) -->
        </div>

        <div class="mb-8">
            <Stepper v-model="currentStep" class="w-full items-center justify-center">
                <StepperItem v-for="(item, index) in stepperItems" :key="index" :step="index + 1" 
                    :class="index + 1 < stepperItems.length ? 'flex-1' : 'flex-none'">
                    <div class="p-1 flex flex-col items-center text-center gap-1 rounded-md max-w-[10rem] mx-auto">
                        <StepperIndicator :step="index + 1">
                            <Icon icon="lucide:hospital" v-if="index + 1 === 1" />
                            <Icon icon="healthicons:doctor-outline" v-if="index + 1 === 2" />
                            <Icon icon="lucide:calendar" v-if="index + 1 === 3" />
                            <Icon icon="lucide:check" v-if="index + 1 === 4" />
                        </StepperIndicator>
                        <div class="flex flex-col items-center">
                            <StepperTitle class="text-sm font-medium hidden sm:block">{{ item.title }}</StepperTitle>
                            <StepperDescription class="text-xs text-muted-foreground hidden sm:block">
                                {{ item.description }}
                            </StepperDescription>
                        </div>
                    </div>
                    <StepperSeparator v-if="index + 1 < stepperItems.length" class="flex-1 h-[2px]"/>
                </StepperItem>
            </Stepper>
        </div>

        <!-- Step Content -->
        <div class="min-h-[500px] flex h-full w-full">
            <!-- Step 1: Select Clinic -->
            <div v-if="currentStep === 1" class="space-y-6 w-full">
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Select Clinic</CardTitle>
                        <CardDescription>
                            Search and filter clinics to find the one that best suits your needs
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6">
                        <!-- Search -->
                        <div class="space-y-2">
                            <Label for="clinic-search">Search clinics</Label>
                            <div class="relative w-full max-w-sm items-center">
                                <Input id="clinic-search" v-model="clinicSearchQuery"
                                placeholder="Search by name, location, or address..." class="mt-1" />
                                <Icon icon="lucide:search" class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>

                        <!-- Filters -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Clinic Type</Label>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <Button v-for="type in distinctClinicTypes" :key="type"
                                            :variant="selectedClinicType === type ? 'default' : 'outline'" size="sm"
                                            @click="selectedClinicType = type">
                                            {{ formatLabel(type) }}
                                        </Button>
                                </div>
                            </div>
                            <div>
                                <Label>Region</Label>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <Button v-for="region in distinctRegions" :key="region"
                                        :variant="selectedRegion === region ? 'default' : 'outline'" size="sm"
                                        @click="selectedRegion = region">
                                        {{ formatLabel(region) }}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Clinic Results -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card v-for="clinic in filteredClinics" :key="clinic.id"
                        class="cursor-pointer transition-colors hover:bg-muted/50"
                        :class="{ 'ring-2 ring-primary': bookingData.clinic?.id === clinic.id }"
                        @click="selectClinic(clinic)">
                        <CardHeader>
                            <CardTitle class="text-lg">{{ clinic.name }}</CardTitle>
                            <CardDescription>
                                <div class="space-y-1">
                                    <p>{{ clinic.clinicType }} • {{ clinic.region }}</p>
                                    <p class="text-sm">{{ clinic.area }}</p>
                                    <p class="text-xs text-muted-foreground">{{ clinic.addressLine }}</p>
                                </div>
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <div v-if="filteredClinics.length === 0" class="text-center py-8">
                    <p class="text-muted-foreground">No clinics found matching your criteria.</p>
                </div>
            </div>

            <!-- Step 2: Choose Doctor -->
            <div v-if="currentStep === 2" class="space-y-6 w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Choose Doctor</CardTitle>
                        <CardDescription>
                            Select a doctor from {{ bookingData.clinic?.name }}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <!-- Doctor Search & Specialty Filter -->
                <div class="space-y-4">
                    <div class="w-full max-w-sm">
                        <Label for="doctor-search">Search doctors</Label>
                        <div class="relative mt-1">
                            <Input id="doctor-search" v-model="doctorSearchQuery" placeholder="Search by name or specialty..." />
                            <Icon icon="lucide:search" class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div>
                        <Label>Specialty</Label>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <Button v-for="spec in distinctDoctorSpecialties" :key="spec"
                                :variant="selectedDoctorSpecialty === spec ? 'default' : 'outline'" size="sm"
                                @click="selectedDoctorSpecialty = spec">
                                {{ spec === 'All' ? 'All' : spec }}
                            </Button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card v-for="doctor in availableDoctors" :key="doctor.id"
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

                <div v-if="availableDoctors.length === 0" class="text-center py-8">
                    <p class="text-muted-foreground">No doctors available at this clinic.</p>
                </div>
            </div>

            <!-- Step 3: Date & Time -->
            <div v-if="currentStep === 3" class="space-y-6 w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Date & Time</CardTitle>
                        <CardDescription>
                            Select your preferred appointment date and time with {{ bookingData.doctor?.name }}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div class="flex gap-6">
                    <!-- Calendar -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-lg">Select Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar v-model="calendarValue" :min-value="today(getLocalTimeZone())"
                                :available-weekdays="availableWeekdaysArray"
                                :available-dates="availableDatesArray"
                                @update:model-value="handleDateSelect" class="rounded-md border p-6" />

                            <!-- Legend explaining the green highlight -->
                            <p class="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                                <span class="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-200" aria-hidden="true"></span>
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
                                    :disabled="slot.booked === true"
                                    @click="selectTimeSlot(slot)">
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

            <!-- Step 4: Confirmation -->
            <div v-if="currentStep === 4" class="space-y-6 flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Confirm Your Appointment</CardTitle>
                        <CardDescription>
                            Please review your appointment details before confirming
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4 flex flex-col justify-between">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-6">
                                <div>
                                    <Label class="text-sm font-medium">Clinic</Label>
                                    <p class="text-sm text-muted-foreground mt-1">{{ bookingData.clinic?.name }}</p>
                                    <p class="text-xs text-muted-foreground">{{ bookingData.clinic?.addressLine }}</p>
                                </div>
                                <div>
                                    <Label class="text-sm font-medium">Doctor</Label>
                                    <p class="text-sm text-muted-foreground mt-1">{{ bookingData.doctor?.name }}</p>
                                    <p class="text-xs text-muted-foreground">{{ bookingData.doctor?.specialty }}
                                    </p>
                                </div>
                            </div>
                            <div class="space-y-6">
                                <div>
                                    <Label class="text-sm font-medium">Date</Label>
                                    <p class="text-sm text-muted-foreground mt-1">
                                        {{ bookingData.date?.toDate(TIME_ZONE).toLocaleDateString() }}
                                    </p>
                                </div>
                                <div>
                                    <Label class="text-sm font-medium">Time</Label>
                                    <p class="text-sm text-muted-foreground mt-1">{{ bookingData.timeSlot?.slot_start ? new Date(bookingData.timeSlot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) : '' }} - {{ bookingData.timeSlot?.slot_end ? new Date(bookingData.timeSlot.slot_end).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }) : '' }}</p>
                                </div>
                            </div>
                        </div>

                        <div v-if="!isBookingConfirmed" class="pt-4">
                            <Button @click="handleConfirmBooking" class="w-full" size="lg">
                                Confirm Appointment
                            </Button>
                        </div>

                        <div v-else class="text-center py-8">
                            <div class="text-green-600 mb-2">
                                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold mb-2">Appointment Confirmed!</h3>
                                <p class="text-muted-foreground">
                                Your appointment has been successfully scheduled. You will receive a confirmation email
                                shortly.
                            </p>
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
