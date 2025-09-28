<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/vue'

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
    // Load dashboard data - currently using dummy data
    console.log('Dashboard loaded with dummy data')
})
</script>

<template>
    <div class="space-y-8 p-8">
        <!-- Dashboard Title -->
        <div class="flex flex-col gap-1">
            <h1 class="text-3xl font-bold tracking-tight">Welcome back, John!</h1>
            <p class="text-muted-foreground">Here's what's happening with your health today.</p>
        </div>

        <!-- Quick Stats Cards -->
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

        <!-- Quick Actions -->
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

        <!-- Recent Appointments -->
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
    </div>
</template>