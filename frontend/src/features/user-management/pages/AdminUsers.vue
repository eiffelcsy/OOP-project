<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUsers } from '../composables/useUsers'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'
import { Skeleton } from '@/components/ui/skeleton'

const { users, loading, error, fetchUsers, navigateToUser, navigateToCreateUser } = useUsers()

const searchQuery = ref('')
const selectedRole = ref<string>('All')

// Filter users based on search and filters
const filteredUsers = computed(() => {
  let filtered = users.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.full_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.patient?.nric?.toLowerCase().includes(query) ||
      user.patient?.phone?.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (selectedRole.value !== 'All') {
    filtered = filtered.filter(user => user.role === selectedRole.value.toLowerCase())
  }

  return filtered
})

// Get unique roles
const roles = ['All', 'Patient', 'Staff', 'Admin']

// Statistics
const stats = computed(() => ({
  total: users.value.length,
  byRole: users.value.reduce((acc, user) => {
    const role = user.role.charAt(0).toUpperCase() + user.role.slice(1)
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}))

// Get badge variant based on role
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive'
    case 'staff':
      return 'default'
    case 'patient':
      return 'secondary'
    default:
      return 'outline'
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Page Header -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">User Management</h1>
          <p class="text-muted-foreground">Manage patient, staff, and admin accounts</p>
        </div>
        <Button @click="navigateToCreateUser" size="lg">
          <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Users</CardTitle>
          <Icon icon="lucide:users" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.total }}</div>
          <p class="text-xs text-muted-foreground">All registered users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Patients</CardTitle>
          <Icon icon="lucide:user" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.byRole['Patient'] || 0 }}</div>
          <p class="text-xs text-muted-foreground">Patient accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Staff</CardTitle>
          <Icon icon="lucide:briefcase" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.byRole['Staff'] || 0 }}</div>
          <p class="text-xs text-muted-foreground">Staff members</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Admins</CardTitle>
          <Icon icon="lucide:shield" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.byRole['Admin'] || 0 }}</div>
          <p class="text-xs text-muted-foreground">Administrator accounts</p>
        </CardContent>
      </Card>
    </div>

    <!-- Search and Filters -->
    <Card>
      <CardHeader>
        <CardTitle>Search & Filter</CardTitle>
        <CardDescription>Find users by name, email, or role</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Search Bar -->
        <div class="space-y-2">
          <Label for="search">Search Users</Label>
          <div class="relative">
            <Input 
              id="search" 
              v-model="searchQuery" 
              placeholder="Search by name, email, NRIC, or phone..." 
              class="pr-10"
            />
            <Icon icon="lucide:search" class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <!-- Filters -->
        <div>
          <Label>User Role</Label>
          <div class="flex flex-wrap gap-2 mt-2">
            <Button 
              v-for="role in roles" 
              :key="role"
              :variant="selectedRole === role ? 'default' : 'outline'" 
              size="sm"
              @click="selectedRole = role"
            >
              {{ role }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Error Message -->
    <Card v-if="error" class="border-destructive">
      <CardContent class="pt-6">
        <div class="flex items-center gap-2 text-destructive">
          <Icon icon="lucide:alert-circle" class="h-5 w-5" />
          <p>{{ error }}</p>
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 6" :key="i">
        <CardHeader>
          <Skeleton class="h-6 w-3/4 mb-2" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-2/3" />
        </CardHeader>
      </Card>
    </div>

    <!-- Users Grid -->
    <div v-else-if="filteredUsers.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card 
        v-for="user in filteredUsers" 
        :key="user.profile_id"
        class="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
        @click="navigateToUser(user.profile_id)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg mb-2">{{ user.full_name || 'Unnamed User' }}</CardTitle>
              <CardDescription>
                <div class="flex items-center gap-2">
                  <Icon icon="lucide:mail" class="h-3 w-3" />
                  <span class="text-sm">{{ user.email }}</span>
                </div>
              </CardDescription>
            </div>
            <Badge :variant="getRoleBadgeVariant(user.role)" class="ml-2">
              {{ user.role.toUpperCase() }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-2 text-sm">
            <!-- Patient Info -->
            <div v-if="user.patient?.phone" class="flex items-center gap-2 text-muted-foreground">
              <Icon icon="lucide:phone" class="h-4 w-4 flex-shrink-0" />
              <span>{{ user.patient.phone }}</span>
            </div>
            
            <!-- Staff Info -->
            <div v-if="user.staff" class="flex items-center gap-2 text-muted-foreground">
              <Icon icon="lucide:briefcase" class="h-4 w-4 flex-shrink-0" />
              <span class="capitalize">{{ user.staff.role || 'Staff' }} • {{ user.staff.clinic_name || `Clinic ${user.staff.clinic_id}` }}</span>
            </div>
            
            <!-- Admin Info -->
            <div v-if="user.admin" class="flex items-center gap-2 text-muted-foreground">
              <Icon icon="lucide:shield-check" class="h-4 w-4 flex-shrink-0" />
              <span>System Administrator</span>
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t">
          <div class="flex items-center justify-between w-full text-sm">
            <div class="flex items-center gap-2 text-muted-foreground">
              <Icon icon="lucide:calendar" class="h-4 w-4" />
              <span v-if="user.created_at">
                Joined {{ new Date(user.created_at).toLocaleDateString() }}
              </span>
              <span v-else>Date unknown</span>
            </div>
            <Icon icon="lucide:chevron-right" class="h-4 w-4 text-muted-foreground" />
          </div>
        </CardFooter>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else class="border-none shadow-none">
      <CardContent class="pt-6">
        <div class="text-center py-12">
          <Icon icon="lucide:users" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No users found</h3>
          <p class="text-muted-foreground mb-4">
            {{ searchQuery || selectedRole !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by adding your first user' }}
          </p>
          <Button @click="navigateToCreateUser" v-if="!searchQuery && selectedRole === 'All'">
            <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

