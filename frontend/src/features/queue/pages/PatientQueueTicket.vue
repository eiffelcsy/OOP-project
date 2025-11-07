<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/features/auth/composables/useAuth'
import { usePatientQueue } from '../composables/usePatientQueue'
import { Card, CardContent} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'

const router = useRouter()
const { currentUser } = useAuth()
const patientId = computed(() => currentUser.value?.patient?.id)

// Queue Ticket data - now includes queue computation methods
const { 
    currentTicket, 
    queueTickets, 
    isLoading: queueLoading,
    error: queueError,
    getDoctorName,
    getClinicName,
    currentServing,
    calculatePosition,
    calculateProgress,
    fetchPatientQueueInfo 
} = usePatientQueue()

// Load data on mount
onMounted(async () => {
    if (patientId.value) {
        try {
            await fetchPatientQueueInfo(patientId.value)
        } catch (error) {
            console.error('[QueueTicket] Error loading data:', error)
        }
    }
})

// Watch for user changes and refetch
watch(() => patientId.value, async (newId) => {
    if (newId) {
        await fetchPatientQueueInfo(newId)
    }
})
</script>

<template>
    <div class="space-y-8 p-4 md:p-8">
        <!-- Page Title -->
        <div class="flex flex-col gap-1">
            <h1 class="text-2xl md:text-3xl font-bold tracking-tight">My Queue Tickets</h1>
            <p class="text-sm text-muted-foreground">
                Track your position in the queue and get notified when it's your turn
            </p>
        </div>

        <!-- Loading State -->
        <Card v-if="queueLoading">
            <CardContent class="flex flex-col items-center text-center py-12">
                <Icon icon="lucide:loader-2" class="size-12 mb-4 text-muted-foreground animate-spin" />
                <p class="text-muted-foreground">Loading your queue tickets...</p>
                <p class="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
            </CardContent>
        </Card>

        <!-- Error State -->
        <Card v-else-if="queueError">
            <CardContent class="flex flex-col items-center text-center py-12">
                <Icon icon="lucide:alert-circle" class="size-16 mb-4 text-destructive" />
                <h3 class="text-lg font-semibold mb-2">Unable to Load Queue Information</h3>
                <p class="text-destructive mb-4">{{ queueError }}</p>
                <Button @click="fetchPatientQueueInfo(patientId)" variant="outline" size="lg">
                    <Icon icon="lucide:refresh-cw" class="mr-2" />
                    Try Again
                </Button>
            </CardContent>
        </Card>

        <!-- No Tickets State -->
        <Card v-else-if="currentTicket.length === 0">
            <CardContent class="flex flex-col items-center text-center py-12">
                <div class="text-muted-foreground mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2">No Active Queue Tickets</h3>
                <p class="text-muted-foreground mb-4">
                    You haven't checked in yet. Visit the clinic counter to join the queue.
                </p>
                <Button @click="router.push('/patient/appointments')">
                    <Icon icon="lucide:calendar" class="mr-2" />
                    View My Appointments
                </Button>
            </CardContent>
        </Card>

        <!-- Tickets List - Simple Card Layout -->
        <div v-else class="space-y-4">
            <Card 
                v-for="ticket in currentTicket" 
                :key="ticket.id"
                class="overflow-hidden"
                :class="{
                    'border-green-200 bg-green-50': ticket.ticket_status === 'Called',
                    'border-blue-200 bg-blue-50': ticket.ticket_status === 'Checked In'
                }"
            >
                <!-- Fast Track Banner -->
                <div 
                    v-if="ticket.priority"
                    class="bg-yellow-100 border-b border-yellow-200 px-3 py-2 flex items-center justify-between"
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="lucide:zap" class="size-4 text-yellow-700" />
                        <span class="text-sm font-semibold text-yellow-900">Fast Track Priority</span>
                    </div>
                    <Badge class="bg-yellow-200 text-yellow-800 border-yellow-300 text-xs">
                        Priority
                    </Badge>
                </div>

                <CardContent class="p-3">
                    <!-- Section 1: Doctor & Clinic Info -->
                    <div class="flex items-center gap-2 mb-3">
                        <Icon icon="lucide:stethoscope" class="size-5 text-primary flex-shrink-0" />
                        <div class="min-w-0 flex-1">
                            <p class="font-semibold truncate">Dr. {{ getDoctorName(ticket.id) }}</p>
                            <p class="text-xs text-muted-foreground truncate">{{ getClinicName(ticket.id) }}</p>
                        </div>
                    </div>

                    <Separator class="my-3" />

                    <!-- Section 2: Queue Numbers (Always Horizontal) -->
                    <div class="flex items-center justify-between mb-3">
                        <div class="text-center flex-1">
                            <p class="text-xs text-muted-foreground mb-1">Your Queue No.</p>
                            <p class="text-3xl font-bold text-primary">#{{ ticket.ticket_number }}</p>
                        </div>
                        
                        <Separator orientation="vertical" class="h-12 mx-4" />
                        
                        <div class="text-center flex-1">
                            <p class="text-xs text-muted-foreground mb-1">Currently Serving</p>
                            <p class="text-2xl font-bold text-muted-foreground">
                                #{{ currentServing.length ? currentServing.map(t => t.ticket_number).join(', #') : '—' }}
                            </p>
                        </div>
                    </div>

                    <!-- Section 3: Status & Progress (Single Row) -->
                    <div class="flex items-center justify-between gap-3">
                        <Badge 
                            class="text-sm px-3 py-1 flex-shrink-0"
                            :class="{
                                'bg-green-100 text-green-800': ticket.ticket_status === 'Called',
                                'bg-blue-100 text-blue-800': ticket.ticket_status === 'Checked In',
                                'bg-gray-100 text-gray-800': ticket.ticket_status !== 'Called' && ticket.ticket_status !== 'Checked In'
                            }"
                        >
                            <Icon 
                                :icon="ticket.ticket_status === 'Called' ? 'lucide:bell-ring' : 'lucide:clock'" 
                                class="size-4 mr-1"
                            />
                            {{ ticket.ticket_status === 'Called' ? 'CALLED' : 'WAITING' }}
                        </Badge>
                        
                        <!-- Message when called -->
                        <div 
                            v-if="ticket.ticket_status === 'Called'" 
                            class="flex items-center gap-2 text-green-700 font-medium animate-pulse"
                        >
                            <Icon icon="lucide:arrow-right" class="size-4" />
                            <span class="text-sm">Please proceed to doctor</span>
                        </div>

                        <!-- Progress info when waiting -->
                        <div v-else-if="ticket.ticket_status === 'Checked In'" class="flex-1 min-w-0">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="text-muted-foreground">
                                    <template v-if="calculatePosition(ticket) === 0">
                                        <Icon icon="lucide:check-circle" class="size-3 inline mr-1 text-green-600" />
                                        You're next!
                                    </template>
                                    <template v-else>
                                        {{ calculatePosition(ticket) }} {{ calculatePosition(ticket) === 1 ? 'person' : 'people' }} ahead
                                    </template>
                                </span>
                                <span class="text-muted-foreground">
                                    ~{{ calculatePosition(ticket) * 25 }} min
                                </span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    class="bg-primary h-1.5 rounded-full transition-all duration-500"
                                    :style="{ width: `${calculateProgress(ticket)}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>