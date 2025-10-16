<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsers, type User, type UpdateUserRequest } from '../composables/useUsers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const { fetchUserById, updateUser, deleteUser, loading, error } = useUsers()

const user = ref<User | null>(null)
const isEditing = ref(false)
const showDeleteDialog = ref(false)
const successMessage = ref('')

const editFormData = reactive<UpdateUserRequest>({})

const staffRoles = ['receptionist', 'nurse', 'doctor', 'pharmacist']

const userId = computed(() => parseInt(route.params.id as string))

// Show role-specific fields
const showPatientFields = computed(() => user.value?.role === 'patient')
const showStaffFields = computed(() => user.value?.role === 'staff')

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

const loadUser = async () => {
  try {
    const data = await fetchUserById(userId.value)
    user.value = data
    // Copy data to edit form
    Object.assign(editFormData, {
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      nric: data.patient?.nric,
      phone: data.patient?.phone,
      dob: data.patient?.dob,
      address: data.patient?.address,
      clinic_id: data.staff?.clinic_id,
      staff_role: data.staff?.role
    })
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to load user')
    toast.error('Load Failed', {
      description: errorMessage
    })
    router.push({ name: 'AdminUsers' })
  }
}

const handleEdit = () => {
  if (user.value) {
    // Clear and repopulate editFormData
    Object.keys(editFormData).forEach(key => {
      delete editFormData[key as keyof typeof editFormData]
    })
    Object.assign(editFormData, {
      full_name: user.value.full_name,
      avatar_url: user.value.avatar_url,
      nric: user.value.patient?.nric,
      phone: user.value.patient?.phone,
      dob: user.value.patient?.dob,
      address: user.value.patient?.address,
      clinic_id: user.value.staff?.clinic_id,
      staff_role: user.value.staff?.role
    })
  }
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
  if (user.value) {
    Object.assign(editFormData, {
      full_name: user.value.full_name,
      avatar_url: user.value.avatar_url,
      nric: user.value.patient?.nric,
      phone: user.value.patient?.phone,
      dob: user.value.patient?.dob,
      address: user.value.patient?.address,
      clinic_id: user.value.staff?.clinic_id,
      staff_role: user.value.staff?.role
    })
  }
}

const handleSave = async () => {
  try {
    const result = await updateUser(userId.value, editFormData)
    user.value = result
    isEditing.value = false
    toast.success('User Updated', {
      description: 'User profile has been updated successfully',
      action: {
        label: 'View',
        onClick: () => {}
      }
    })
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to update user')
    toast.error('Update Failed', {
      description: errorMessage,
      action: {
        label: 'Retry',
        onClick: () => handleSave()
      }
    })
  }
}

const handleDelete = async () => {
  try {
    await deleteUser(userId.value)
    toast.success('User Deleted', {
      description: 'The user account has been permanently deleted',
      action: {
        label: 'Dismiss',
        onClick: () => {}
      }
    })
    router.push({ name: 'AdminUsers' })
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to delete user')
    toast.error('Delete Failed', {
      description: errorMessage,
      action: {
        label: 'Retry',
        onClick: () => handleDelete()
      }
    })
  }
}

const handleBack = () => {
  router.push({ name: 'AdminUsers' })
}

onMounted(() => {
  loadUser()
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Loading State -->
    <div v-if="loading && !user" class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <Skeleton class="h-8 w-64" />
          <Skeleton class="h-4 w-96" />
        </div>
        <Skeleton class="h-10 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton class="h-6 w-48" />
        </CardHeader>
        <CardContent class="space-y-4">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <div v-else-if="user">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="handleBack">
            <Icon icon="lucide:arrow-left" class="h-5 w-5" />
          </Button>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-bold tracking-tight">{{ user.full_name || 'Unnamed User' }}</h1>
              <Badge :variant="getRoleBadgeVariant(user.role)">{{ user.role.toUpperCase() }}</Badge>
            </div>
            <p class="text-muted-foreground">User ID: {{ user.profile_id }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <Button 
            v-if="!isEditing" 
            variant="outline" 
            @click="handleEdit"
          >
            <Icon icon="lucide:edit" class="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            v-if="!isEditing" 
            variant="destructive" 
            @click="showDeleteDialog = true"
          >
            <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <!-- View Mode -->
      <div v-if="!isEditing" class="space-y-6">
        <!-- Account Information -->
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Full Name</Label>
                <p class="text-base font-medium">{{ user.full_name || 'Not specified' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Email Address</Label>
                <p class="text-base font-medium">{{ user.email }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Role</Label>
                <p class="text-base font-medium capitalize">{{ user.role }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Avatar URL</Label>
                <p class="text-base font-medium">{{ user.avatar_url || 'Not set' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Patient Information -->
        <Card v-if="showPatientFields && user.patient">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">NRIC/FIN</Label>
                <p class="text-base font-medium">{{ user.patient.nric || 'Not specified' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Phone Number</Label>
                <p class="text-base font-medium">{{ user.patient.phone || 'Not specified' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Date of Birth</Label>
                <p class="text-base font-medium">
                  {{ user.patient.dob ? new Date(user.patient.dob).toLocaleDateString() : 'Not specified' }}
                </p>
              </div>
              <div class="md:col-span-2">
                <Label class="text-muted-foreground">Address</Label>
                <p class="text-base font-medium">{{ user.patient.address || 'Not specified' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Staff Information -->
        <Card v-if="showStaffFields && user.staff">
          <CardHeader>
            <CardTitle>Staff Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Assigned Clinic</Label>
                <p class="text-base font-medium">{{ user.staff.clinic_name || `Clinic ID: ${user.staff.clinic_id}` || 'Not assigned' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Staff Position</Label>
                <p class="text-base font-medium capitalize">{{ user.staff.role || 'Not specified' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Admin Information -->
        <Card v-if="user.role === 'admin' && user.admin" class="border-amber-500">
          <CardHeader>
            <CardTitle>Administrator Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex items-start gap-2 text-amber-700 dark:text-amber-400">
              <Icon icon="lucide:shield-check" class="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-medium">System Administrator</p>
                <p class="text-sm mt-1">This account has full system access and privileges.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Metadata -->
        <Card>
          <CardHeader>
            <CardTitle>Account Metadata</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Created At</Label>
                <p class="text-base font-medium">
                  {{ user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown' }}
                </p>
              </div>
              <div>
                <Label class="text-muted-foreground">Last Updated</Label>
                <p class="text-base font-medium">
                  {{ user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Unknown' }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Edit Mode -->
      <form v-else @submit.prevent="handleSave" class="space-y-6">
        <!-- Account Information -->
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Edit user profile details</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2 md:col-span-2">
                <Label for="edit-full-name">Full Name</Label>
                <Input id="edit-full-name" v-model="editFormData.full_name" />
              </div>

              <div class="space-y-2 md:col-span-2">
                <Label for="edit-avatar">Avatar URL</Label>
                <Input 
                  id="edit-avatar" 
                  :model-value="editFormData.avatar_url ?? ''"
                  @update:model-value="editFormData.avatar_url = ($event as string) || null"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Patient Information (Edit) -->
        <Card v-if="showPatientFields">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Edit patient-specific details</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="edit-nric">NRIC/FIN</Label>
                <Input 
                  id="edit-nric" 
                  :model-value="editFormData.nric ?? ''"
                  @update:model-value="editFormData.nric = ($event as string) || null"
                />
              </div>

              <div class="space-y-2">
                <Label for="edit-phone">Phone Number</Label>
                <Input 
                  id="edit-phone" 
                  type="tel"
                  :model-value="editFormData.phone ?? ''"
                  @update:model-value="editFormData.phone = ($event as string) || null"
                />
              </div>

              <div class="space-y-2">
                <Label for="edit-dob">Date of Birth</Label>
                <Input 
                  id="edit-dob" 
                  type="date"
                  :model-value="editFormData.dob ?? ''"
                  @update:model-value="editFormData.dob = ($event as string) || null"
                />
              </div>

              <div class="space-y-2 md:col-span-2">
                <Label for="edit-address">Address</Label>
                <Input 
                  id="edit-address" 
                  :model-value="editFormData.address ?? ''"
                  @update:model-value="editFormData.address = ($event as string) || null"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Staff Information (Edit) -->
        <Card v-if="showStaffFields">
          <CardHeader>
            <CardTitle>Staff Information</CardTitle>
            <CardDescription>Edit staff assignment and role</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="edit-clinic-id">Clinic ID</Label>
                <Input 
                  id="edit-clinic-id" 
                  type="number"
                  :model-value="editFormData.clinic_id ?? ''"
                  @update:model-value="editFormData.clinic_id = ($event as string) ? parseInt($event as string) : null"
                />
              </div>

              <div class="space-y-2">
                <Label>Staff Position</Label>
                <div class="flex flex-wrap gap-2">
                  <Button 
                    v-for="staffRole in staffRoles" 
                    :key="staffRole"
                    type="button"
                    :variant="editFormData.staff_role === staffRole ? 'default' : 'outline'" 
                    size="sm"
                    @click="editFormData.staff_role = staffRole"
                  >
                    {{ staffRole.charAt(0).toUpperCase() + staffRole.slice(1) }}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4">
          <Button type="button" variant="outline" @click="handleCancelEdit" :disabled="loading">
            Cancel
          </Button>
          <Button type="submit" :disabled="loading">
            <Icon v-if="loading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            <Icon v-else icon="lucide:save" class="mr-2 h-4 w-4" />
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </Button>
        </div>
      </form>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ user?.full_name || user?.email }}"? This action cannot be undone and will permanently remove all associated data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="handleDelete" :disabled="loading">
            <Icon v-if="loading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Deleting...' : 'Delete User' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

