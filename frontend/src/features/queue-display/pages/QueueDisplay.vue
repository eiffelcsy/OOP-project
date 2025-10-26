<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useQueueManagement } from '@/features/queue/composables/useQueueManagement'

const route = useRoute()
const queueId = computed(() => Number(route.params.queueId))

// Use the same queue management composable for real-time data
const {
    queueState,
    patients,
    waitingPatients,
    currentPatient,
    initializeQueueById
} = useQueueManagement()

// Validate queue ID and check if queue is active
const isValidQueue = computed(() => {
    return queueState.queueId === queueId.value && queueState.isActive
})

// Realtime clock for display
const now = ref(new Date())

// Computed properties for display
const currentNumber = computed(() => currentPatient.value?.queueNumber || 0)
const currentPatientName = computed(() => currentPatient.value?.name || 'No one')
const waitingNumbers = computed(() =>
    waitingPatients.value
        .sort((a, b) => a.queueNumber - b.queueNumber)
        .slice(0, 10) // Show only next 10 patients
        .map(p => ({
            number: p.queueNumber,
            priority: p.priority,
            status: p.status
        }))
)
const averageWaitTime = ref(15)

// Interval handle for realtime clock
let nowInterval: number

onMounted(async () => {
    // Initialize queue by route ID
    if (!isNaN(queueId.value)) {
        await initializeQueueById(queueId.value)
    }
    // Start realtime clock
    nowInterval = window.setInterval(() => {
        now.value = new Date()
    }, 1000)
})

onUnmounted(() => {
    if (nowInterval) {
        clearInterval(nowInterval)
    }
})

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

// React to route param changes
watch(queueId, async (newId) => {
    if (!isNaN(newId)) {
        await initializeQueueById(newId)
    }
})
</script>

<template>
    <div class="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
        <div class="flex-1 flex flex-col p-4 space-y-4">
            <!-- Header with Current Time -->
            <div class="flex justify-between items-center bg-white/80 backdrop-blur rounded-xl p-3 shadow-md">
                <div class="flex items-center gap-3">
                    <Icon icon="lucide:hospital" class="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">ClinicAMS Queue Display</h1>
                        <p class="text-sm text-gray-600">Please wait for your number to be called</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-bold text-gray-800">{{ formatTime(now) }}</div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="flex-1 grid grid-cols-3 gap-4">
                <!-- Left Column -->
                <div class="col-span-1">
                    <div class="bg-white rounded-xl shadow-md p-4 h-full flex flex-col">
                        <!-- Current Number Display -->
                        <div class="flex-1">
                            <h2 class="text-2xl font-semibold text-gray-700 mb-3 text-center">Now Serving</h2>
                            <div class="flex-1 flex flex-col justify-center h-full">
                                <!-- Invalid Queue Message -->
                                <div v-if="!isValidQueue" class="text-center space-y-3">
                                    <div class="bg-red-100 rounded-xl p-6">
                                        <div class="text-3xl font-bold text-red-600 mb-2">
                                            Invalid Queue
                                        </div>
                                        <div class="text-sm text-gray-600">
                                            This queue is no longer active or does not exist
                                        </div>
                                        <div class="text-xs text-gray-500 mt-2">
                                                Queue ID: {{ queueId }}
                                            </div>
                                    </div>
                                </div>
                                
                                <!-- Valid Queue - Current Patient -->
                                <div v-else-if="isValidQueue && currentPatient" class="text-center space-y-3">
                                    <div class="bg-green-100 rounded-xl p-6">
                                        <div class="text-5xl font-bold text-green-600 mb-2">
                                            #{{ currentNumber }}
                                        </div>
                                        <div class="text-xl font-medium text-gray-700">
                                            {{ currentPatientName }}
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-center gap-2 text-green-600">
                                        <Icon icon="lucide:bell-ring" class="h-5 w-5 animate-pulse" />
                                        <span class="text-sm font-medium">Please proceed to consultation room</span>
                                    </div>
                                </div>
                                
                                <!-- Valid Queue - No Current Patient -->
                                <div v-else class="text-center space-y-3">
                                    <div class="bg-gray-100 rounded-xl p-6">
                                        <div class="text-3xl font-bold text-gray-500 mb-2">
                                            {{ queueState.isPaused ? 'Queue Paused' : 'Please Wait' }}
                                        </div>
                                        <div class="text-sm text-gray-600">
                                            {{ queueState.isPaused ? 'Queue is temporarily paused' : 'Preparing for next patient' }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Important Information -->
                        <div class="mt-4 pt-4 border-t border-gray-200">
                            <h3 class="text-sm font-semibold text-gray-700 mb-2 text-center">Important Information</h3>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <Icon icon="lucide:user-check" class="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p class="text-xs font-medium text-gray-700">Check-In Required</p>
                                        <p class="text-xs text-gray-600">Ensure you've checked in at reception</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Icon icon="lucide:phone-off" class="h-4 w-4 text-red-600 flex-shrink-0" />
                                    <div>
                                        <p class="text-xs font-medium text-gray-700">Quiet Zone</p>
                                        <p class="text-xs text-gray-600">Mobile phones on silent mode</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Icon icon="lucide:shield-check" class="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p class="text-xs font-medium text-gray-700">Safety Guidelines</p>
                                        <p class="text-xs text-gray-600">Maintain social distancing</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Waiting Queue -->
                <div class="col-span-2">
                    <div class="bg-white rounded-xl shadow-md p-4 h-full flex flex-col">
                        <h2 class="text-2xl font-semibold text-gray-700 mb-3 text-center">Waiting Queue</h2>
                        <div v-if="!isValidQueue" class="flex-1 flex flex-col justify-center items-center">
                            <Icon icon="lucide:alert-triangle" class="h-12 w-12 text-red-300 mb-2" />
                            <p class="text-lg text-red-500">Queue Unavailable</p>
                            <p class="text-sm text-gray-500">Please check with reception</p>
                        </div>
                        <div v-else-if="waitingNumbers.length > 0" class="flex-1 flex flex-col space-y-3">
                            <div class="grid grid-cols-5 gap-2">
                                <div v-for="patient in waitingNumbers.slice(0, 10)" :key="patient.number" :class="[
                                    'rounded-lg p-2 text-center border transition-all duration-300',
                                    patient.priority === 'fast-track'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-blue-50 border-blue-200'
                                ]">
                                    <div :class="[
                                        'text-3xl font-bold mb-1',
                                        patient.priority === 'fast-track' ? 'text-red-600' : 'text-blue-600'
                                    ]">
                                        #{{ patient.number }}
                                    </div>
                                    <div class="text-xs font-medium text-gray-600">
                                        {{ patient.priority === 'fast-track' ? 'FAST TRACK' : 'WAITING' }}
                                    </div>
                                </div>
                            </div>

                            <!-- Average Wait Time -->
                            <div class="text-center mt-auto">
                                <div
                                    class="inline-flex items-center gap-2 bg-yellow-50 rounded-lg px-4 py-2 border border-yellow-200">
                                    <Icon icon="lucide:clock" class="h-4 w-4 text-yellow-600" />
                                    <span class="text-sm font-medium text-gray-700">
                                        Estimated wait time: {{ averageWaitTime }} minutes
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="flex-1 flex flex-col justify-center items-center">
                            <Icon icon="lucide:users" class="h-12 w-12 text-gray-300 mb-2" />
                            <p class="text-lg text-gray-500">No patients waiting</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center bg-white/60 backdrop-blur rounded-xl py-2">
                <p class="text-sm text-gray-600 font-medium">Thank you for your patience • ClinicAMS © 2024</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
