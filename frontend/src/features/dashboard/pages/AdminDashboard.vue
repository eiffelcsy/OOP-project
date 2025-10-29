<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'
import { statisticsApi } from '@/services/statisticsApi'
import type { SystemMetrics, SystemStatus, SystemUsage } from '@/services/statisticsApi'
import { toast } from 'vue-sonner'

// Key Metrics Data
const metrics = ref<SystemMetrics>({
  total_users: 0,
  active_clinics: 0,
  system_health: 'Loading...',
  health_status: 'good'
})

// System Status Data
const systemStatus = ref<SystemStatus>({
  server_uptime: '0%',
  uptime_days: 0,
  database_connectivity: 'Connecting...',
  db_status: 'good',
  last_backup: 'Checking...',
  active_connections: 0
})

// System Usage Data
const systemUsage = ref<SystemUsage>({
  appointments_today: 0,
  appointments_this_week: 0,
  appointments_trend: '0%',
  cancellations_today: 0,
  cancellation_rate: '0%',
  queue_stats: {
    current_waiting: 0,
    average_wait_time: '0 min',
    longest_wait: '0 min',
    queue_status: 'normal'
  },
  system_load: {
    cpu: 0,
    memory: 0,
    disk_usage: 0,
    network_traffic: 'Normal'
  }
})

// New registrations count
const newRegistrations = ref(0)

// Loading state
const isLoading = ref(true)

// Interval ID for periodic updates
let updateInterval: number | null = null

// Quick Actions
const quickActions = [
  {
    title: 'Create User Account',
    description: 'Add new system user',
    icon: 'lucide:user-plus',
    action: () => handleCreateUser()
  },
  {
    title: 'Add New Clinic',
    description: 'Register new healthcare facility',
    icon: 'lucide:plus',
    action: () => handleAddClinic()
  },
  {
    title: 'View System Alerts',
    description: 'Check system notifications',
    icon: 'lucide:alert-triangle',
    action: () => handleViewAlerts()
  },
  {
    title: 'Search Users',
    description: 'Find and manage users',
    icon: 'lucide:search',
    action: () => handleUserSearch()
  }
]

// Action handlers (dummy implementations)
const handleCreateUser = () => {
  console.log('Opening create user dialog...')
  // TODO: Implement user creation dialog
  alert('Create User Account feature - Coming Soon!')
}

const handleAddClinic = () => {
  console.log('Opening add clinic dialog...')
  // TODO: Implement clinic creation dialog
  alert('Add New Clinic feature - Coming Soon!')
}

const handleViewAlerts = () => {
  console.log('Opening system alerts...')
  // TODO: Navigate to alerts page
  alert('System Alerts view - Coming Soon!')
}

const handleUserSearch = () => {
  console.log('Opening user search...')
  // TODO: Navigate to user search page
  alert('User Search feature - Coming Soon!')
}

/**
 * Fetch system statistics from the backend
 */
const fetchStatistics = async () => {
  try {
    // Fetch main statistics
    const stats = await statisticsApi.getSystemStatistics()
    
    // Update reactive refs with fetched data
    metrics.value = stats.metrics
    systemStatus.value = stats.system_status
    systemUsage.value = stats.system_usage
    
    // Fetch new registrations (last 24 hours)
    const registrations = await statisticsApi.getNewRegistrations(24)
    newRegistrations.value = registrations.count
    
    isLoading.value = false
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
    toast.error('Failed to load system statistics', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    })
    isLoading.value = false
  }
}

/**
 * Refresh statistics periodically
 */
const startPeriodicUpdate = () => {
  // Update every 30 seconds
  updateInterval = window.setInterval(() => {
    fetchStatistics()
  }, 30000)
}

/**
 * Stop periodic updates
 */
const stopPeriodicUpdate = () => {
  if (updateInterval !== null) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

onMounted(async () => {
  console.log('Admin dashboard loading...')
  
  // Initial fetch
  await fetchStatistics()
  
  // Start periodic updates
  startPeriodicUpdate()
  
  console.log('Admin dashboard loaded successfully')
})

onUnmounted(() => {
  // Clean up interval on component unmount
  stopPeriodicUpdate()
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Dashboard Title -->
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight">System Administration</h1>
      <p class="text-muted-foreground">Monitor and manage your healthcare management system.</p>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Total Users</CardTitle>
          <Icon icon="lucide:users" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold mb-1">{{ metrics.total_users.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Active Clinics</CardTitle>
          <Icon icon="lucide:building" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold mb-1">{{ metrics.active_clinics }}</div>
          <p class="text-xs text-muted-foreground">+2 new this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>System Health</CardTitle>
          <Icon icon="lucide:heart-pulse" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold mb-1">{{ metrics.system_health }}</div>
          <p class="text-xs text-muted-foreground">All systems operational</p>
        </CardContent>
      </Card>
    </div>

    <!-- System Status & Usage Widget -->
    <div class="grid lg:grid-cols-4 grid-cols-1 gap-6">
      <Card class="lg:col-span-3 col-span-1">
        <CardHeader class="border-b">
          <CardTitle class="flex items-center gap-2">
            <Icon icon="lucide:server" class="h-4 w-4" />
            System Status & Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Appointment Usage -->
            <div>
              <h4 class="text-sm font-semibold mb-4 flex items-center gap-2">
                <Icon icon="lucide:calendar" class="h-4 w-4" />
                Appointment Usage
              </h4>
              <div class="space-y-2">
                <!-- Appointments Today -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:calendar-check" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">Today's Appointments</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.appointments_today }}</div>
                    <div class="text-xs text-muted-foreground">{{ systemUsage.appointments_trend }} vs last week</div>
                  </div>
                </div>

                <!-- Cancellations -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:calendar-x" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">Cancellations Today</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.cancellations_today }}</div>
                    <div class="text-xs text-muted-foreground">{{ systemUsage.cancellation_rate }} rate</div>
                  </div>
                </div>

                <!-- Weekly Summary -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:calendar-days" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">This Week Total</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.appointments_this_week }}</div>
                    <div class="text-xs text-muted-foreground">All clinics combined</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <!-- Queue Statistics -->
            <div>
              <h4 class="text-sm font-semibold mb-4 flex items-center gap-2">
                <Icon icon="lucide:users" class="h-4 w-4" />
                Queue Statistics
              </h4>
              <div class="space-y-2">
                <!-- Current Waiting -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:clock-3" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">Currently Waiting</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.queue_stats.current_waiting }} patients</div>
                    <div class="text-xs text-muted-foreground">{{ systemUsage.queue_stats.queue_status }} load</div>
                  </div>
                </div>

                <!-- Average Wait Time -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:timer" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">Average Wait</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.queue_stats.average_wait_time }}</div>
                    <div class="text-xs text-muted-foreground">Longest: {{ systemUsage.queue_stats.longest_wait }}</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <!-- System Backup & Alerts -->
            <div>
              <h4 class="text-sm font-semibold mb-4 flex items-center gap-2">
                <Icon icon="lucide:shield-check" class="h-4 w-4" />
                Backup & Alerts
              </h4>
              <div class="space-y-2">
                <!-- Last Backup -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:archive" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">Last Backup</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">Success</div>
                    <div class="text-xs text-muted-foreground">{{ systemStatus.last_backup }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <!-- Quick Actions Panel -->
      <Card class="lg:col-span-1 col-span-1 order-first lg:order-last">
        <CardHeader class="border-b">
          <CardTitle class="flex items-center gap-2">
            <Icon icon="lucide:zap" class="size-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-4">
            <Button v-for="action in quickActions" :key="action.title" variant="outline"
              class="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent hover:text-accent-foreground"
              @click="action.action">
              <Icon :icon="action.icon" class="h-5 w-5 text-muted-foreground" />
              <div class="text-left">
                <div class="font-medium">{{ action.title }}</div>
                <div class="text-xs text-muted-foreground">{{ action.description }}</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Additional Stats Row -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">New Registrations</CardTitle>
          <Icon icon="lucide:user-check" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ newRegistrations }}</div>
          <p class="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Queue Time</CardTitle>
          <Icon icon="lucide:clock-3" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ systemUsage.queue_stats.average_wait_time }}</div>
          <p class="text-xs text-muted-foreground">Average wait time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Appointments Today</CardTitle>
          <Icon icon="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ systemUsage.appointments_today }}</div>
          <p class="text-xs text-muted-foreground">{{ systemUsage.cancellations_today }} cancellations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Sessions</CardTitle>
          <Icon icon="lucide:monitor" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ systemStatus.active_connections }}</div>
          <p class="text-xs text-muted-foreground">Current users online</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
