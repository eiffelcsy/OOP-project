<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { usePatientQueue } from '../composables/usePatientQueue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'


const { currentUser } = useAuth()
const patientId = computed(() => currentUser.value?.patient?.id)

// Queue Ticket data
const { 
    currentTicket, 
    queueTickets, 
    isLoading: queueLoading,
    error: queueError,
    doctorDetails,
    getDoctorName,
    getClinicName,
    fetchPatientQueueInfo 
} = usePatientQueue()

// Loading states
const loadingQueue = computed(() => queueLoading.value)

// Currently serving and waiting computations
const currentServing = computed(() => 
    queueTickets.value.filter(t => t.ticket_status === 'Called')
)

// Load data on mount
onMounted(async () => {
    console.log('[QueueTicket] Loading with patientId:', patientId.value)
    if (patientId.value) {
        try {
            // Fetch queue data (doctor details are fetched automatically by the composable)
            await fetchPatientQueueInfo(patientId.value)
        } catch (error) {
            console.error('[QueueTicket] Error loading data:', error)
        }
    }
})

// Watch for user changes and refetch
watch(() => patientId.value, async (newId) => {
    if (newId) {
        console.log('[QueueTicket] Patient ID changed, refetching:', newId)
        await fetchPatientQueueInfo(newId)
    }
})
</script>

<template>
    <div class="space-y-8 p-8">
        <!-- Page Title -->
        <div class="flex flex-col gap-1">
            <h1 class="text-3xl font-bold tracking-tight">My Queue Tickets</h1>
            <p class="text-sm text-muted-foreground">
                You have {{ currentTicket.length }} active queue ticket(s)
            </p>
        </div>

        <!-- Loading State -->
        <Card v-if="loadingQueue">
            <CardContent class="flex flex-col items-center text-center py-12">
                <Icon icon="lucide:loader-2" class="size-12 mb-4 text-muted-foreground animate-spin" />
                <p class="text-muted-foreground">Loading your queue tickets...</p>
            </CardContent>
        </Card>

        <!-- Error State -->
        <Card v-else-if="queueError">
            <CardContent class="flex flex-col items-center text-center py-12">
                <Icon icon="lucide:alert-circle" class="size-12 mb-4 text-destructive" />
                <p class="text-destructive font-medium mb-2">Error loading queue information</p>
                <p class="text-sm text-muted-foreground">{{ queueError }}</p>
                <Button @click="fetchPatientQueueInfo(patientId)" class="mt-4">
                    Try Again
                </Button>
            </CardContent>
        </Card>

        <!-- No Tickets State -->
        <Card v-else-if="currentTicket.length === 0">
            <CardContent class="flex flex-col items-center text-center py-12">
                <Icon icon="lucide:ticket" class="size-12 mb-4 text-muted-foreground" />
                <p class="text-muted-foreground">
                    You have not checked in yet. Please visit the counter to join the queue.
                </p>
            </CardContent>
        </Card>

        <!-- Tickets List - Compact View -->
        <div v-else class="space-y-4">
            <Card 
                v-for="ticket in currentTicket" 
                :key="ticket.id" 
                class="overflow-hidden transition-all duration-200 hover:shadow-md"
                :class="{
                    'border-green-200 bg-green-50': ticket.ticket_status === 'Called',
                    'border-blue-200 bg-blue-50': ticket.ticket_status === 'Checked In'
                }"
            >
                <!-- Fast Track Banner -->
                <div 
                    v-if="ticket.priority"
                    class="bg-yellow-100 border-b border-yellow-200 px-6 py-3 flex items-center gap-3"
                >
                    <Icon icon="lucide:zap" class="size-5 flex-shrink-0 text-yellow-700" />
                    <div class="flex-1">
                        <p class="font-semibold text-sm text-yellow-900">Fast Track Priority</p>
                        <p class="text-xs text-yellow-700">You will be served ahead of regular queue patients</p>
                    </div>
                    <Badge class="bg-yellow-200 text-yellow-800 border-yellow-300 hover:bg-yellow-300">
                        Priority
                    </Badge>
                </div>

                <CardContent class="p-6">
                    <div class="flex items-start justify-between">
                        <!-- Left: Ticket Info -->
                        <div class="flex gap-6">
                            <div>
                                <p class="text-xs text-muted-foreground mb-1">Your Number</p>
                                <p class="text-3xl font-bold text-primary">#{{ ticket.ticket_number }}</p>
                            </div>

                            <Separator orientation="vertical" class="h-16" />

                            <div class="space-y-3">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <Icon icon="lucide:stethoscope" class="size-4 text-muted-foreground" />
                                        <span class="font-medium">
                                            Dr. {{ getDoctorName(ticket.id) }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Icon icon="lucide:building-2" class="size-4 text-muted-foreground" />
                                        <span class="text-sm text-muted-foreground">
                                            {{ getClinicName(ticket.id) }}
                                        </span>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2">
                                    <Badge 
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
                                    <span 
                                        class="text-sm"
                                        :class="ticket.ticket_status === 'Called' ? 'text-green-700 font-medium' : 'text-muted-foreground'"
                                    >
                                        {{ ticket.ticket_status === 'Called' ? 'Please proceed to the doctor now' : 'Waiting in queue' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Currently Serving -->
                        <div class="text-right">
                            <p class="text-xs text-muted-foreground mb-1">Now Serving</p>
                            <p class="text-2xl font-bold text-primary">
                                #{{ currentServing.length ? currentServing.map(t => t.ticket_number).join(', #') : '—' }}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>