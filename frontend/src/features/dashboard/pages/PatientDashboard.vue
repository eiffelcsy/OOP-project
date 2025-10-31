<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/vue'

const { currentUser } = useAuth()
const patientId = currentUser.value?.patient?.id

// Dummy appointments data
const upcomingAppointments = ref([
    {
        id: 1,
        doctorName: 'Dr. Sarah Smith',
        type: 'General Checkup',
        date: '2025-09-25',
        time: '2:00 PM'
    },
    {
        id: 2,
        doctorName: 'Dr. Michael Johnson',
        type: 'Cardiology Consultation',
        date: '2025-09-28',
        time: '10:30 AM'
    },
    {
        id: 3,
        doctorName: 'Dr. Emily Chen',
        type: 'Follow-up Visit',
        date: '2025-10-02',
        time: '3:15 PM'
    },
])

// Dummy medical records data
const recentRecords = ref([
    {
        id: 1,
        type: 'Lab Results',
        date: '2025-09-20',
        provider: 'City Medical Lab'
    },
    {
        id: 2,
        type: 'Prescription',
        date: '2025-09-18',
        provider: 'Dr. Sarah Smith'
    },
    {
        id: 3,
        type: 'X-Ray Report',
        date: '2025-09-15',
        provider: 'Regional Imaging Center'
    }
])

// Dummy queue ticket data
const dummyQueueTicketData = ref([
    { appointment_id: 101, patient_id: 201, ticket_number: 0, 
        priority: 1, ticket_status: 'No Show', room_name: "Room 1" },
    { appointment_id: 102, patient_id: 202, ticket_number: 1, 
        priority: 0, ticket_status: 'Completed', room_name: null },
    { appointment_id: 103, patient_id: 203, ticket_number: 2, 
        priority: 0, ticket_status: 'Called', room_name: null },
    { appointment_id: 104, patient_id: 204, ticket_number: 3,
        priority: 1, ticket_status: 'Checked-in', room_name: null },
    { appointment_id: 105, patient_id: 205, ticket_number: 4, 
        priority: 0, ticket_status: 'Checked-in', room_name: null },
    { appointment_id: 106, patient_id: 206, ticket_number: 5,
        priority: 0, ticket_status: 'Checked-in', room_name: null },
    { appointment_id: 107, patient_id: 207, ticket_number: 6, 
        priority: 0, ticket_status: 'Checked-in', room_name: null },
    { appointment_id: 108, patient_id: 208, ticket_number: 7, 
        priority: 1, ticket_status: 'Called', room_name: "Room 2" },
    { appointment_id: 109, patient_id: 209, ticket_number: 8, 
        priority: 0, ticket_status: 'Checked-in', room_name: null },
    { appointment_id: 110, patient_id: patientId, ticket_number: 9, 
        priority: 1, ticket_status: 'Checked-in', room_name: null } // current user
])

// Grouping Queue Tickets
const currentServing = dummyQueueTicketData.value.filter(q => q.ticket_status === "Called")
const waiting = dummyQueueTicketData.value.filter(q => q.ticket_status === "Checked-in")
const myTicket = dummyQueueTicketData.value.find(q => q.patient_id === patientId)

// Dashboard-specific data with dummy values
const stats = ref({
    nextAppointment: {
        doctorName: 'Dr. Sarah Smith',
        type: 'General Checkup',
        date: 'Tomorrow',
        time: '2:00 PM'
    },
    totalAppointments: 4,
    unreadNotifications: 2
})

onMounted(() => {
    console.log('Dashboard loaded with dummy data')
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
        <div class="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Next Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-2xl font-bold">{{ stats.nextAppointment.date }}, {{ stats.nextAppointment.time }}</p>
                    <p class="text-xs text-muted-foreground">{{ stats.nextAppointment.doctorName }} - {{
                        stats.nextAppointment.type }}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-2xl font-bold mb-1">{{ stats.totalAppointments }}</p>
                    <p class="text-xs text-muted-foreground">This month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-2xl font-bold mb-1">{{ stats.unreadNotifications }}</p>
                    <p class="text-xs text-muted-foreground">Unread Notifications</p>
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader class="border-b">
                    <CardTitle>Recent Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div v-for="appointment in upcomingAppointments.slice(0, 3)" :key="appointment.id"
                        class="flex items-center justify-between py-2">
                        <div>
                            <p class="font-medium">{{ appointment.doctorName }}</p>
                            <p class="text-sm text-muted-foreground">{{ appointment.type }}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-medium">{{ appointment.date }}</p>
                            <p class="text-sm text-muted-foreground">{{ appointment.time }}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Queue Ticket Card -->
            <Card>
                <CardHeader class="border-b">
                    <CardTitle class="flex items-center justify-between">
                        <span>My Queue Ticket</span>
                        <Badge
                            v-if="myTicket?.priority"
                            variant="secondary"
                            class="text-amber-600 bg-amber-100 dark:bg-amber-900/30"
                        >
                            Fast Track
                        </Badge>
                    </CardTitle>
                </CardHeader>

                <CardContent class="space-y-4">
                    <!-- Case: In Queue -->
                    <template v-if="myTicket">
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
                                {{ currentServing.length ? currentServing.map(t => t.ticket_number).join(', ') : '—' }}
                            </p>
                        </div>
                    </div>

                    <!-- Ticket Status Messages -->
                    <div>
                        <p
                        v-if="myTicket.ticket_status === 'Called'"
                        class="text-green-600 font-medium"
                        >
                        You are being served now.
                        Proceed to <span class="font-semibold">{{ myTicket.room_name || 'your assigned room' }}</span>.
                        </p>

                        <p
                        v-else-if="myTicket.ticket_status === 'Checked-in'"
                        class="text-blue-600 font-medium"
                        >
                        You are currently waiting.
                        <span class="font-semibold">{{ waiting.length - 1 }}</span> patients ahead.
                        </p>

                        <p
                        v-else-if="myTicket.ticket_status === 'Completed'"
                        class="text-gray-500 font-medium"
                        >
                        Your consultation has been completed.
                        </p>

                        <p
                        v-else-if="myTicket.ticket_status === 'No Show'"
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