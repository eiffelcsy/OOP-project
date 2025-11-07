<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { usePatientQueue } from '@/features/queue/composables/usePatientQueue'
import { useQueueDoctors } from '@/features/queue/composables/useQueueDoctors'
import { appointmentsApi } from '@/services/appointmentsApi'
import type { AppointmentResponse } from '@/services/appointmentsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'

const { currentUser } = useAuth()
const patientId = computed(() => currentUser.value?.patient?.id)

// Queue Ticket data
const { 
    currentTicket, 
    queueTickets, 
    isLoading: queueLoading, 
    error: queueError,
    fetchPatientQueueInfo 
} = usePatientQueue()

// Queue Ticket Doctors data
const {
    doctorDetails,
    isLoading: doctorsLoading,
    error: doctorsError,
    fetchDoctorDetails,
    getDoctorName,
    getClinicName
} = useQueueDoctors(currentTicket)

// Loading states
const loadingAppointments = ref(false)
const loadingQueue = computed(() => queueLoading.value || doctorsLoading.value)

// Live appointments data
const appointments = ref<AppointmentResponse[]>([])

// Fetch appointments from backend
const fetchAppointments = async () => {
    try {
        loadingAppointments.value = true
        const data = await appointmentsApi.getPatientAppointments()
        appointments.value = data || []
        console.log('Fetched appointments:', appointments.value)
    } catch (error) {
        console.error('Error fetching appointments:', error)
        appointments.value = []
    } finally {
        loadingAppointments.value = false
    }
}

// Format date for display
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Reset time parts for comparison
    today.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    
    if (compareDate.getTime() === today.getTime()) {
        return 'Today'
    } else if (compareDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow'
    } else {
        return date.toLocaleDateString('en-SG', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }
}

// Format time for display
const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-SG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    })
}

// Get appointment status badge variant
const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
        case 'completed':
            return 'default'
        case 'cancelled':
            return 'destructive'
        case 'no_show':
        case 'no show':
            return 'secondary'
        default:
            return 'outline'
    }
}

// Get status display text
const getStatusText = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'no_show' || statusLower === 'no show') {
        return 'No Show'
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
}

// Computed: Upcoming appointments (scheduled, confirmed, checked-in)
const upcomingAppointments = computed(() => {
    const now = new Date()
    return appointments.value
        .filter(apt => {
            const aptDate = new Date(apt.start_time)
            const isUpcoming = aptDate >= now
            const isActiveStatus = ['scheduled', 'confirmed', 'checked-in'].includes(apt.status.toLowerCase())
            return isUpcoming && isActiveStatus
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 3) // Show only first 3
})

// Computed: Recent (past) appointments
const recentAppointments = computed(() => {
    const now = new Date()
    return appointments.value
        .filter(apt => {
            const aptDate = new Date(apt.start_time)
            return aptDate < now // Past appointments only
        })
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()) // Most recent first
        .slice(0, 5) // Show only last 5
})

// Computed: Next appointment
const nextAppointment = computed(() => {
    if (upcomingAppointments.value.length === 0) {
        return null
    }
    const next = upcomingAppointments.value[0]
    return {
        doctorName: next.doctor_name || 'Doctor',
        type: next.treatment_summary || 'Consultation',
        date: formatDate(next.start_time),
        time: formatTime(next.start_time)
    }
})

// Computed: Total upcoming appointments count
const totalUpcomingCount = computed(() => {
    const now = new Date()
    return appointments.value.filter(apt => {
        const aptDate = new Date(apt.start_time)
        const isUpcoming = aptDate >= now
        const isActiveStatus = ['scheduled', 'confirmed', 'checked-in'].includes(apt.status.toLowerCase())
        return isUpcoming && isActiveStatus
    }).length
})

// Load data on mount
onMounted(async () => {
    console.log('[Dashboard] Loading with patientId:', patientId.value)
    if (patientId.value) {
        try {
            // Fetch appointments and queue data in parallel
            await Promise.all([
                fetchAppointments(),
                fetchPatientQueueInfo(patientId.value)
            ])
            
            // Only fetch doctor details if we have queue tickets
            if (currentTicket.value.length > 0) {
                await fetchDoctorDetails()
            }
        } catch (error) {
            console.error('[Dashboard] Error loading data:', error)
        }
    }
})

// Watch for user changes and refetch
watch(() => patientId.value, async (newId) => {
    if (newId) {
        try {
            await Promise.all([
                fetchAppointments(),
                fetchPatientQueueInfo(newId)
            ])
            if (currentTicket.value.length > 0) {
                await fetchDoctorDetails()
            }
        } catch (error) {
            console.error('[Dashboard] Error loading data:', error)
        }
    }
})
</script>

<template>
    <div class="space-y-8 p-8">
        <!-- Dashboard Title -->
        <div class="flex flex-col gap-1">
            <h1 class="text-3xl font-bold tracking-tight">Welcome back, {{ currentUser?.profile?.full_name || currentUser?.profile?.email || 'there' }}!</h1>
            <p class="text-muted-foreground">Here's what's happening with your health today.</p>
        </div>

        <!-- Row 1 Cards: Quick Stats -->
        <div class="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Next Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                    <template v-if="loadingAppointments">
                        <p class="text-sm text-muted-foreground">Loading...</p>
                    </template>
                    <template v-else-if="nextAppointment">
                        <p class="text-2xl font-bold">{{ nextAppointment.date }}, {{ nextAppointment.time }}</p>
                        <p class="text-xs text-muted-foreground">{{ nextAppointment.doctorName }} - {{ nextAppointment.type }}</p>
                    </template>
                    <template v-else>
                        <p class="text-sm text-muted-foreground">No upcoming appointments</p>
                    </template>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                    <template v-if="loadingAppointments">
                        <p class="text-sm text-muted-foreground">Loading...</p>
                    </template>
                    <template v-else>
                        <p class="text-2xl font-bold mb-1">{{ totalUpcomingCount }}</p>
                        <p class="text-xs text-muted-foreground">Total scheduled</p>
                    </template>
                </CardContent>
            </Card>
        </div>

        <!-- Row 2 Cards: Quick Actions -->
        <div class="grid gap-4 md:grid-cols-2">
            <Card class="border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
                <RouterLink to="/patient/appointments/book" class="block">
                    <CardHeader>
                        <CardTitle class="flex items-center gap-2">
                            <Icon icon="lucide:calendar-plus" class="size-4" />
                            Book Appointment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm text-muted-foreground">Schedule your next visit</p>
                    </CardContent>
                </RouterLink>
            </Card>
            <Card class="border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
                <RouterLink to="/patient/medical-records" class="block">
                    <CardHeader>
                        <CardTitle class="flex items-center gap-2">
                            <Icon icon="lucide:file-text" class="size-4" />
                            View Medical Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm text-muted-foreground">Access your past appointments</p>
                    </CardContent>
                </RouterLink>
            </Card>
        </div>

        <!-- Row 3 Cards: Recent Appointments & Queue Ticket-->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card class="md:col-span-2">
                <CardHeader class="border-b">
                    <CardTitle class="flex items-center justify-between">
                        <span>Recent Appointments</span>
                            <RouterLink to="/patient/appointments">
                                <Button variant="link" size="sm" class="h-4">

                                <span>View All</span>
                                <Icon icon="lucide:arrow-right" class="size-3" />
                                </Button>
                            </RouterLink>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <template v-if="loadingAppointments">
                        <div class="py-4 text-center text-sm text-muted-foreground">
                            Loading appointments...
                        </div>
                    </template>
                    <template v-else-if="recentAppointments.length === 0">
                        <div class="py-8 text-center">
                            <Icon icon="lucide:calendar-x" class="size-8 mx-auto mb-2 text-muted-foreground" />
                            <p class="text-sm text-muted-foreground">No past appointments</p>
                        </div>
                    </template>
                    <template v-else>
                        <div v-for="appointment in recentAppointments" :key="appointment.id"
                            class="flex items-center justify-between py-3 border-b last:border-0">
                            <div class="flex-1">
                                <p class="font-medium">{{ appointment.doctor_name || 'Doctor' }}</p>
                                <p class="text-sm text-muted-foreground">{{ appointment.treatment_summary || 'Consultation' }}</p>
                            </div>
                            <div class="text-right flex items-center gap-3">
                                <div>
                                    <p class="font-medium">{{ formatDate(appointment.start_time) }}</p>
                                    <p class="text-sm text-muted-foreground">{{ formatTime(appointment.start_time) }}</p>
                                </div>
                                <Badge :variant="getStatusVariant(appointment.status)" class="hidden md:block">
                                    {{ getStatusText(appointment.status) }}
                                </Badge>
                            </div>
                        </div>
                    </template>
                </CardContent>
            </Card>

            <!-- Queue Ticket Card -->
            <Card>
                <CardHeader class="border-b">
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle>Active Queue Tickets</CardTitle>
                            <p class="text-sm text-muted-foreground mt-1">
                                You have {{ currentTicket.length }} active queue {{ currentTicket.length === 1 ? 'ticket' : 'tickets' }}
                            </p>
                        </div>
                        <RouterLink to="/patient/queue">
                            <Button variant="link" size="sm" class="h-4">
                                View Details
                                <Icon icon="lucide:arrow-right" class="size-3 ml-1" />
                            </Button>
                        </RouterLink>
                    </div>
                </CardHeader>

                <CardContent>
                    <template v-if="loadingQueue">
                        <div class="py-4 text-center text-sm text-muted-foreground">
                            Loading queue status...
                        </div>
                    </template>
                    
                    <!-- Case: Error fetching queue data -->
                    <template v-else-if="queueError || doctorsError">
                        <div class="text-sm text-destructive">
                            {{ queueError || doctorsError }}
                        </div>
                    </template>

                    <!-- Case: Has Active Tickets -->
                    <template v-else-if="currentTicket.length">
                        <div class="space-y-2">
                            <div 
                                v-for="ticket in currentTicket" 
                                :key="ticket.id"
                                class="rounded-lg border p-3 transition-all duration-200"
                                :class="{
                                    'border-green-200 bg-green-50': ticket.ticket_status === 'Called',
                                    'border-blue-200 bg-blue-50': ticket.ticket_status === 'Checked In',
                                    'border-gray-200 bg-gray-50': ticket.ticket_status !== 'Called' && ticket.ticket_status !== 'Checked In'
                                }"
                            >
                                <!-- Fast Track Banner (if applicable) -->
                                <div 
                                    v-if="ticket.priority === 1"
                                    class="bg-yellow-100 border border-yellow-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2"
                                >
                                    <Icon icon="lucide:zap" class="size-4 flex-shrink-0 text-yellow-700" />
                                    <div class="flex-1">
                                        <p class="font-semibold text-xs text-yellow-900">Fast Track Priority</p>
                                        <p class="text-xs text-yellow-700">Ahead of regular queue</p>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between">
                                    <!-- Left: Doctor & Clinic Info -->
                                    <div class="flex-1">
                                        <p class="text-sm font-medium">
                                            <template v-if="doctorsLoading">
                                                <Icon icon="lucide:loader-2" class="size-3 animate-spin inline mr-1" />
                                                Loading doctor...
                                            </template>
                                            <template v-else>
                                                Dr. {{ getDoctorName(ticket.id) }}
                                            </template>
                                        </p>
                                        
                                        <!-- Clinic Name -->
                                        <p class="text-xs text-muted-foreground">
                                            <template v-if="doctorsLoading">
                                                <Icon icon="lucide:loader-2" class="size-3 animate-spin inline mr-1" />
                                                Loading clinic...
                                            </template>
                                            <template v-else>
                                                {{ getClinicName(ticket.id) }}
                                            </template>
                                        </p>
                                    </div>

                                    <!-- Middle: Queue Number -->
                                    <div class="mx-4">
                                        <span class="text-2xl font-bold text-primary">
                                            #{{ ticket.ticket_number }}
                                        </span>
                                    </div>

                                    <!-- Right: Status Badge -->
                                    <Badge 
                                        class="min-w-[80px] text-center text-xs"
                                        :class="{
                                            'bg-green-100 text-green-800': ticket.ticket_status === 'Called',
                                            'bg-blue-100 text-blue-800': ticket.ticket_status === 'Checked In',
                                            'bg-gray-100 text-gray-800': ticket.ticket_status !== 'Called' && ticket.ticket_status !== 'Checked In'
                                        }"
                                    >
                                        <Icon 
                                            :icon="ticket.ticket_status === 'Called' ? 'lucide:bell-ring' : 'lucide:clock'" 
                                            class="size-3 mr-1"
                                        />
                                        {{ ticket.ticket_status === 'Called' ? 'CALLED' : 'WAITING' }}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Case: Not in Queue -->
                    <template v-else>
                        <div class="flex flex-col items-center text-center py-6">
                            <Icon icon="lucide:ticket" class="size-6 mb-2 text-muted-foreground" />
                            <p class="text-sm text-muted-foreground">
                                No active queue tickets
                            </p>
                        </div>
                    </template>
                </CardContent>
            </Card>
        </div>
    </div>
</template>