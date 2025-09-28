<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'

// Key Metrics Data
const metrics = ref({
  totalUsers: 1247,
  activeClinics: 23,
  systemHealth: 'Healthy',
  healthStatus: 'good' // 'good', 'warning', 'critical'
})

// System Status Data
const systemStatus = ref({
  serverUptime: '99.9%',
  uptimeDays: 127,
  databaseConnectivity: 'Connected',
  dbStatus: 'good', // 'good', 'warning', 'critical'
  lastBackup: '2 hours ago',
  activeConnections: 342
})

// System Usage Data
const systemUsage = ref({
  appointmentsToday: 156,
  appointmentsThisWeek: 892,
  appointmentsTrend: '+12%', // vs last week
  cancellationsToday: 8,
  cancellationRate: '5.1%',
  queueStats: {
    currentWaiting: 23,
    averageWaitTime: '15 min',
    longestWait: '45 min',
    queueStatus: 'normal' // 'normal', 'busy', 'critical'
  },
  systemLoad: {
    cpu: 23,
    memory: 67,
    diskUsage: 45,
    networkTraffic: 'Normal'
  }
})

// System Alerts Data
const systemAlerts = ref([
  {
    id: 1,
    level: 'info',
    message: 'Scheduled maintenance in 3 days',
    timestamp: '1 hour ago'
  },
  {
    id: 2,
    level: 'warning',
    message: 'High database query volume detected',
    timestamp: '2 hours ago'
  }
])

// Recent Activity Data
const recentActivity = ref([
  {
    id: 1,
    type: 'user_registration',
    message: 'New user registration: Dr. Sarah Johnson',
    timestamp: '10 minutes ago',
    icon: 'lucide:user-plus'
  },
  {
    id: 2,
    type: 'clinic_config',
    message: 'Clinic "City Medical Center" updated configuration',
    timestamp: '25 minutes ago',
    icon: 'lucide:building'
  },
  {
    id: 3,
    type: 'system_alert',
    message: 'Database backup completed successfully',
    timestamp: '2 hours ago',
    icon: 'lucide:check-circle'
  },
  {
    id: 4,
    type: 'user_registration',
    message: 'New patient registration: John Smith',
    timestamp: '3 hours ago',
    icon: 'lucide:user-plus'
  },
  {
    id: 5,
    type: 'clinic_config',
    message: 'New clinic "Regional Health Center" added',
    timestamp: '5 hours ago',
    icon: 'lucide:building-2'
  },
  {
    id: 6,
    type: 'system_alert',
    message: 'Server maintenance completed',
    timestamp: '8 hours ago',
    icon: 'lucide:settings'
  }
])

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user_registration': return 'lucide:user-plus'
    case 'clinic_config': return 'lucide:building'
    case 'system_alert': return 'lucide:alert-circle'
    default: return 'lucide:activity'
  }
}

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
    icon: 'lucide:building-2',
    action: () => handleAddClinic()
  },
  {
    title: 'View System Alerts',
    description: 'Check system notifications',
    icon: 'lucide:alert-triangle',
    action: () => handleViewAlerts()
  },
  {
    title: 'Access User Search',
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

onMounted(() => {
  // Simulate data fetching
  console.log('Admin dashboard loaded with dummy data')
  
  // Simulate real-time updates
  setInterval(() => {
    // Update active connections randomly
    systemStatus.value.activeConnections = Math.floor(Math.random() * 100) + 300
    
    // Update queue statistics
    systemUsage.value.queueStats.currentWaiting = Math.floor(Math.random() * 50) + 10
    const waitTimes = ['10 min', '15 min', '20 min', '25 min', '30 min']
    systemUsage.value.queueStats.averageWaitTime = waitTimes[Math.floor(Math.random() * waitTimes.length)]
    
    // Update system load
    systemUsage.value.systemLoad.cpu = Math.floor(Math.random() * 30) + 20
    systemUsage.value.systemLoad.memory = Math.floor(Math.random() * 40) + 50
  }, 30000) // Update every 30 seconds
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
          <div class="text-2xl font-bold mb-1">{{ metrics.totalUsers.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Active Clinics</CardTitle>
          <Icon icon="lucide:building" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold mb-1">{{ metrics.activeClinics }}</div>
          <p class="text-xs text-muted-foreground">+2 new this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>System Health</CardTitle>
          <Icon icon="lucide:heart-pulse" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold mb-1">{{ metrics.systemHealth }}</div>
          <p class="text-xs text-muted-foreground">All systems operational</p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions Panel -->
    <Card>
      <CardHeader class="border-b">
        <CardTitle class="flex items-center gap-2">
          <Icon icon="lucide:zap" class="size-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button
            v-for="action in quickActions"
            :key="action.title"
            variant="outline"
            class="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent hover:text-accent-foreground"
            @click="action.action"
          >
            <Icon :icon="action.icon" class="h-5 w-5 text-muted-foreground" />
            <div class="text-left">
              <div class="font-medium">{{ action.title }}</div>
              <div class="text-xs text-muted-foreground">{{ action.description }}</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Dashboard Content Grid -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Recent Activity Feed -->
      <Card>
        <CardHeader class="border-b">
          <CardTitle class="flex items-center gap-2">
            <Icon icon="lucide:activity" class="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div
              v-for="activity in recentActivity.slice(0, 6)"
              :key="activity.id"
              class="flex items-start gap-3 pb-3 last:pb-0"
            >
              <Icon
                :icon="getActivityIcon(activity.type)"
                class="h-4 w-4 mt-0.5 text-muted-foreground"
              />
              <div class="flex-1 space-y-1">
                <p class="text-sm font-medium leading-none">{{ activity.message }}</p>
                <p class="text-xs text-muted-foreground">{{ activity.timestamp }}</p>
              </div>
            </div>
          </div>
          <Separator class="my-4 w-full" />
          <Button variant="ghost" class="w-full justify-center text-sm">
            View All Activity
          </Button>
        </CardContent>
      </Card>

      <!-- System Status & Usage Widget -->
      <Card>
        <CardHeader class="border-b">
          <CardTitle class="text-xl flex items-center gap-2">
            <Icon icon="lucide:server" class="h-5 w-5" />
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
                    <div class="text-sm font-bold">{{ systemUsage.appointmentsToday }}</div>
                    <div class="text-xs text-muted-foreground">{{ systemUsage.appointmentsTrend }} vs last week</div>
                  </div>
                </div>

                <!-- Cancellations -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:calendar-x" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">Cancellations Today</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.cancellationsToday }}</div>
                    <div class="text-xs text-muted-foreground">{{ systemUsage.cancellationRate }} rate</div>
                  </div>
                </div>

                <!-- Weekly Summary -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:calendar-days" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">This Week Total</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.appointmentsThisWeek }}</div>
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
                    <div class="text-sm font-bold">{{ systemUsage.queueStats.currentWaiting }} patients</div>
                    <div class="text-xs text-muted-foreground">{{ systemUsage.queueStats.queueStatus }} load</div>
                  </div>
                </div>

                <!-- Average Wait Time -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:timer" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">Average Wait</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold">{{ systemUsage.queueStats.averageWaitTime }}</div>
                    <div class="text-xs text-muted-foreground">Longest: {{ systemUsage.queueStats.longestWait }}</div>
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
                    <div class="text-xs text-muted-foreground">{{ systemStatus.lastBackup }}</div>
                  </div>
                </div>
              </div>
            </div>
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
          <div class="text-2xl font-bold">47</div>
          <p class="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Queue Waiting</CardTitle>
          <Icon icon="lucide:clock-3" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ systemUsage.queueStats.currentWaiting }}</div>
          <p class="text-xs text-muted-foreground">Patients in queue</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Appointments Today</CardTitle>
          <Icon icon="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ systemUsage.appointmentsToday }}</div>
          <p class="text-xs text-muted-foreground">{{ systemUsage.cancellationsToday }} cancellations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Sessions</CardTitle>
          <Icon icon="lucide:monitor" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ systemStatus.activeConnections }}</div>
          <p class="text-xs text-muted-foreground">Current users online</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
