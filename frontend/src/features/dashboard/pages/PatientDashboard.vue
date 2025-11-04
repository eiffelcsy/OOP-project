<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'
import { appointmentsApi } from '@/services/appointmentsApi'
import type { AppointmentResponse } from '@/services/appointmentsApi'

const { currentUser } = useAuth()
const patientId = computed(() => currentUser.value?.patient?.id)

// Loading states
const loadingAppointments = ref(false)
const loadingQueue = ref(false)

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

// Get status badge variant
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

// Queue ticket data - Note: Backend doesn't have a patient-specific endpoint yet
// For now, we'll use a placeholder structure. In production, you'd need to either:
// 1. Create a backend endpoint like GET /api/patient/queue-ticket
// 2. Or fetch from a specific queue if you know the queue ID
const queueTicketData = ref<any>(null)
const currentServing = ref<any[]>([])
const waiting = ref<any[]>([])

// Fetch queue ticket data (placeholder - needs backend endpoint)
const fetchQueueTicket = async () => {
    try {
        loadingQueue.value = true
        // TODO: Implement when backend provides patient-specific queue ticket endpoint
        // For now, we'll leave it as null to show "not checked in" state
        queueTicketData.value = null
        currentServing.value = []
        waiting.value = []
    } catch (error) {
        console.error('Error fetching queue ticket:', error)
    } finally {
        loadingQueue.value = false
    }
}

// Computed: My ticket
const myTicket = computed(() => queueTicketData.value)

// Load data on mount
onMounted(async () => {
    console.log('Dashboard loading live data...')
    await Promise.all([
        fetchAppointments(),
        fetchQueueTicket()
    ])
})

// Watch for user changes and refetch
watch(() => currentUser.value, async (newUser) => {
    if (newUser?.patient?.id) {
        await Promise.all([
            fetchAppointments(),
            fetchQueueTicket()
        ])
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
                    <CardTitle class="flex items-center justify-between">
                        <span>My Queue Ticket</span>
                        <Badge
                            v-if="myTicket?.priority === 1"
                            variant="secondary"
                            class="text-amber-600 bg-amber-100 dark:bg-amber-900/30"
                        >
                            Fast Track
                        </Badge>
                    </CardTitle>
                </CardHeader>

                <CardContent class="space-y-4">
                    <template v-if="loadingQueue">
                        <div class="py-4 text-center text-sm text-muted-foreground">
                            Loading queue status...
                        </div>
                    </template>
                    
                    <!-- Case: In Queue -->
                    <template v-else-if="myTicket">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-muted-foreground">Your Ticket Number</p>
                                <p class="text-3xl font-bold text-primary">
                                    {{ myTicket.ticket_number }}
                                </p>
                            </div>

                            <div class="text-right">
                                <p class="text-sm text-muted-foreground">Currently Serving</p>
                                <p class="text-2xl font-bold text-primary">
                                    {{ currentServing.length ? currentServing.map((t: any) => t.ticket_number).join(', ') : '—' }}
                                </p>
                            </div>
                        </div>

                        <!-- Ticket Status Messages -->
                        <div>
                            <p
                                v-if="myTicket.ticket_status === 'called'"
                                class="text-green-600 font-medium"
                            >
                                You are being served now.
                                <template v-if="myTicket.doctor_name">
                                    Proceed to <span class="font-semibold">Dr. {{ myTicket.doctor_name }}</span>.
                                </template>
                            </p>

                            <p
                                v-else-if="myTicket.ticket_status === 'waiting' || myTicket.ticket_status === 'checked-in'"
                                class="text-blue-600 font-medium"
                            >
                                You are currently waiting.
                                <span class="font-semibold">{{ waiting.length > 0 ? waiting.length - 1 : 0 }}</span> patients ahead.
                            </p>

                            <p
                                v-else-if="myTicket.ticket_status === 'completed'"
                                class="text-gray-500 font-medium"
                            >
                                Your consultation has been completed.
                            </p>

                            <p
                                v-else-if="myTicket.ticket_status === 'no_show' || myTicket.ticket_status === 'no show'"
                                class="text-red-600 font-medium"
                            >
                                You missed your appointment.
                            </p>
                        </div>
                    </template>

                    <!-- Case: Not in Queue -->
                    <template v-else>
                        <div class="flex flex-col items-center text-center py-8">
                            <Icon icon="lucide:ticket" class="size-6 mb-2 text-muted-foreground" />
                            <p class="text-muted-foreground">
                                You have not checked in yet. Please visit the counter to join the queue.
                            </p>
                        </div>
                    </template>

                    <!-- Always show the Queue page link -->
                    <div class="pt-2 flex justify-end">
                        <RouterLink
                            to="/patient/queue"
                            class="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                            <span>View Full Queue</span>
                            <Icon icon="lucide:arrow-right" class="size-3" />
                        </RouterLink>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>