<script setup lang="ts">
import { useQueueManagement } from '../composables/useQueueManagement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/vue'

const {
  queueState,
  patients,
  waitingPatients,
  priorityPatients,
  currentPatient,
  completedToday,
  noShowToday,
  startQueue,
  pauseQueue,
  resumeQueue,
  endQueue,
  callNext,
  updatePatientStatus,
  moveToFastTrack,
  removeFromFastTrack
} = useQueueManagement()

const openQueueDisplay = () => {
  if (!queueState.queueId) {
    alert('Please start the queue first before opening the display.')
    return
  }
  const url = `/queue-display/${queueState.queueId}`
  window.open(url, '_blank', 'width=1200,height=800,toolbar=no,menubar=no,scrollbars=yes,resizable=yes')
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'emergency': return 'lucide:alert-triangle'
    case 'elderly': return 'lucide:user-check'
    case 'fast-track': return 'lucide:zap'
    default: return 'lucide:user'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'emergency': return 'text-red-600'
    case 'elderly': return 'text-blue-600'
    case 'fast-track': return 'text-yellow-600'
    default: return 'text-gray-600'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'waiting': return 'bg-gray-100 text-gray-800'
    case 'checked-in': return 'bg-green-100 text-green-800'
    case 'called': return 'bg-blue-100 text-blue-800'
    case 'in-progress': return 'bg-yellow-100 text-yellow-800'
    case 'completed': return 'bg-green-100 text-green-800'
    case 'no-show': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">Queue Management</h1>
        <p class="text-muted-foreground">Manage patient queues and call patients for appointments.</p>
      </div>
      <Button 
        @click="openQueueDisplay" 
        :disabled="!queueState.isActive"
        variant="outline" 
        class="flex items-center gap-2"
      >
        <Icon icon="lucide:external-link" class="h-4 w-4" />
        Open Queue Display
      </Button>
    </div>

    <!-- Queue Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Queue Status</CardTitle>
          <Icon :icon="queueState.isActive ? 'lucide:play' : 'lucide:pause'" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ queueState.isActive ? (queueState.isPaused ? 'Paused' : 'Active') : 'Stopped' }}
          </div>
          <p class="text-xs text-muted-foreground">
            Current: #{{ queueState.currentNumber || 'None' }}
            <br v-if="queueState.queueId" />
            <span v-if="queueState.queueId" class="text-xs text-blue-600">ID: {{ queueState.queueId.split('_')[1] }}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Waiting</CardTitle>
          <Icon icon="lucide:users" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ waitingPatients.length }}</div>
          <p class="text-xs text-muted-foreground">{{ priorityPatients.length }} priority</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Completed</CardTitle>
          <Icon icon="lucide:check-circle" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ completedToday }}</div>
          <p class="text-xs text-muted-foreground">Today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">No Shows</CardTitle>
          <Icon icon="lucide:x-circle" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ noShowToday }}</div>
          <p class="text-xs text-muted-foreground">Today</p>
        </CardContent>
      </Card>
    </div>

    <!-- Queue Controls -->
    <Card>
      <CardHeader>
        <CardTitle>Queue Controls</CardTitle>
        <CardDescription>Start, pause, and manage the patient queue</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center gap-4">
          <Button 
            v-if="!queueState.isActive"
            @click="startQueue"
            class="flex items-center gap-2"
          >
            <Icon icon="lucide:play" class="h-4 w-4" />
            Start Queue
          </Button>
          
          <template v-else>
            <Button 
              v-if="!queueState.isPaused"
              @click="pauseQueue"
              variant="outline"
              class="flex items-center gap-2"
            >
              <Icon icon="lucide:pause" class="h-4 w-4" />
              Pause Queue
            </Button>
            
            <Button 
              v-else
              @click="resumeQueue"
              class="flex items-center gap-2"
            >
              <Icon icon="lucide:play" class="h-4 w-4" />
              Resume Queue
            </Button>
          </template>

          <Button 
            @click="callNext"
            :disabled="!queueState.isActive || queueState.isPaused || waitingPatients.length === 0"
            class="flex items-center gap-2"
          >
            <Icon icon="lucide:bell" class="h-4 w-4" />
            Call Next Patient
          </Button>

          <Button 
            v-if="queueState.isActive"
            @click="endQueue"
            variant="destructive"
            class="flex items-center gap-2"
          >
            <Icon icon="lucide:square" class="h-4 w-4" />
            End Queue
          </Button>
        </div>

        <!-- Current Patient -->
        <div v-if="currentPatient" class="p-4 border rounded-lg bg-blue-50">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium">Currently Serving</h4>
              <p class="text-lg font-bold">{{ currentPatient.name }} - Queue #{{ currentPatient.queueNumber }}</p>
              <p class="text-sm text-muted-foreground">Called at {{ currentPatient.calledTime }}</p>
            </div>
            <div class="flex gap-2">
              <Button @click="updatePatientStatus(currentPatient.id, 'completed')" size="sm">
                Complete
              </Button>
              <Button @click="updatePatientStatus(currentPatient.id, 'no-show')" variant="outline" size="sm">
                No Show
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Patient Queue List -->
    <Card>
      <CardHeader>
        <CardTitle>Patient Queue</CardTitle>
        <CardDescription>Manage individual patients in the queue</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <!-- Priority Patients -->
          <div v-if="priorityPatients.length > 0">
            <h4 class="font-medium text-red-600 mb-2">Priority Patients</h4>
            <div class="space-y-2">
              <div 
                v-for="patient in priorityPatients" 
                :key="patient.id"
                class="flex items-center justify-between p-4 border rounded-lg bg-red-50"
              >
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="getPriorityIcon(patient.priority)" :class="getPriorityColor(patient.priority)" class="h-5 w-5" />
                    <span class="font-bold text-lg">#{{ patient.queueNumber }}</span>
                  </div>
                  <div>
                    <p class="font-medium">{{ patient.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ patient.appointmentTime }} - {{ patient.priority }}</p>
                    <p v-if="patient.checkInTime" class="text-xs text-green-600">Checked in at {{ patient.checkInTime }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span :class="getStatusColor(patient.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ patient.status.replace('-', ' ').toUpperCase() }}
                  </span>
                  <div class="flex gap-1">
                    <Button 
                      v-if="patient.status === 'waiting'"
                      @click="updatePatientStatus(patient.id, 'checked-in')"
                      size="sm"
                      variant="outline"
                    >
                      Check In
                    </Button>
                    <Button 
                      v-if="patient.priority === 'fast-track'"
                      @click="removeFromFastTrack(patient.id)"
                      size="sm"
                      variant="outline"
                    >
                      <Icon icon="lucide:x" class="h-3 w-3" />
                    </Button>
                    <Button 
                      @click="updatePatientStatus(patient.id, 'no-show')"
                      size="sm"
                      variant="destructive"
                    >
                      No Show
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Normal Patients -->
          <div>
            <h4 class="font-medium mb-2">Regular Patients</h4>
            <div class="space-y-2">
              <div 
                v-for="patient in patients.filter(p => (p.status === 'waiting' || p.status === 'checked-in') && p.priority === 'normal')" 
                :key="patient.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="getPriorityIcon(patient.priority)" :class="getPriorityColor(patient.priority)" class="h-5 w-5" />
                    <span class="font-bold text-lg">#{{ patient.queueNumber }}</span>
                  </div>
                  <div>
                    <p class="font-medium">{{ patient.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ patient.appointmentTime }}</p>
                    <p v-if="patient.checkInTime" class="text-xs text-green-600">Checked in at {{ patient.checkInTime }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span :class="getStatusColor(patient.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ patient.status.replace('-', ' ').toUpperCase() }}
                  </span>
                  <div class="flex gap-1">
                    <Button 
                      v-if="patient.status === 'waiting'"
                      @click="updatePatientStatus(patient.id, 'checked-in')"
                      size="sm"
                      variant="outline"
                    >
                      Check In
                    </Button>
                    <Button 
                      @click="moveToFastTrack(patient.id)"
                      size="sm"
                      variant="outline"
                      title="Fast Track"
                    >
                      <Icon icon="lucide:zap" class="h-3 w-3" />
                    </Button>
                    <Button 
                      @click="updatePatientStatus(patient.id, 'no-show')"
                      size="sm"
                      variant="destructive"
                    >
                      No Show
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Completed/No Show Patients -->
          <div v-if="patients.filter(p => p.status === 'completed' || p.status === 'no-show').length > 0">
            <h4 class="font-medium mb-2">Processed Today</h4>
            <div class="space-y-2">
              <div 
                v-for="patient in patients.filter(p => p.status === 'completed' || p.status === 'no-show')" 
                :key="patient.id"
                class="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div class="flex items-center gap-3">
                  <span class="font-bold text-lg text-gray-500">#{{ patient.queueNumber }}</span>
                  <div>
                    <p class="font-medium text-gray-700">{{ patient.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ patient.appointmentTime }}</p>
                  </div>
                </div>
                <span :class="getStatusColor(patient.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ patient.status.replace('-', ' ').toUpperCase() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
