<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/composables/useAuth'

const { currentUser } = useAuth()
const patientId = currentUser?.id

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


// Extract queue info
const currentServing = dummyQueueTicketData.value.filter(q => q.ticket_status === 'Called')
const waiting = dummyQueueTicketData.value.filter(q => q.ticket_status === 'Checked-in')
const myTicket = dummyQueueTicketData.value.find(q => q.patient_id === patientId)

// Dummy appointment details
const appointment = ref({
doctorName: 'Dr. Sarah Smith',
type: 'General Checkup',
date: '2025-10-30',
time: '10:30 AM - 11:00 AM',
location: 'Tan Tock Seng Hospital'
})

onMounted(() => {
    console.log('Page loaded with dummy data')
})

</script>

<template>
    
    <div class="space-y-8 p-8">
        <!-- Page Title -->
        <div class="flex flex-col gap-1">
            <h1 class="text-3xl font-bold tracking-tight">My Queue Ticket</h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <Separator class="my-2" />

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
                </CardContent>
            </Card>

        <!-- Appointment Info Card -->
        <Card>
            <CardHeader class="border-b">
                <CardTitle>Appointment Details</CardTitle>
            </CardHeader>

            <CardContent>
            <div v-if="appointment">
                <p class="font-medium">{{ appointment.doctorName }}</p>
                <p class="text-sm text-muted-foreground">{{ appointment.type }}</p>
                <p class="mt-2">
                <span class="text-sm text-muted-foreground">Date:</span>
                {{ appointment.date }}
                </p>
                <p>
                <span class="text-sm text-muted-foreground">Time:</span>
                {{ appointment.time }}
                </p>
                <p>
                <span class="text-sm text-muted-foreground">Location:</span>
                {{ appointment.location }}
                </p>
            </div>
            <div v-else>
                <p class="text-muted-foreground">
                No appointment linked to this queue ticket.
                </p>
            </div>
            </CardContent>
        </Card>
        </div>
    </div>
</template>