<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClinics, type Clinic } from '../composables/useClinics'
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

const route = useRoute()
const router = useRouter()
const { fetchClinicById, updateClinic, deleteClinic, loading, error } = useClinics()

const clinic = ref<Clinic | null>(null)
const isEditing = ref(false)
const showDeleteDialog = ref(false)
const successMessage = ref('')

const editFormData = reactive<Partial<Clinic>>({})

const regions = ['Central', 'West', 'East', 'North-East', 'North']
const clinicTypes = ['General', 'Specialist', 'Polyclinic', 'Emergency']

const clinicId = computed(() => parseInt(route.params.id as string))

const loadClinic = async () => {
  const data = await fetchClinicById(clinicId.value)
  if (data) {
    clinic.value = data
    // Copy data to edit form
    Object.assign(editFormData, data)
  } else {
    // Clinic not found, redirect back
    router.push({ name: 'AdminClinics' })
  }
}

const handleEdit = () => {
  if (clinic.value) {
    // Clear and repopulate editFormData
    Object.keys(editFormData).forEach(key => {
      delete editFormData[key as keyof typeof editFormData]
    })
    Object.assign(editFormData, { ...clinic.value })
    console.log('Edit form data:', editFormData)
    console.log('Clinic type:', editFormData.clinic_type)
    console.log('Region:', editFormData.region)
  }
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
  Object.assign(editFormData, clinic.value)
}

const handleSave = async () => {
  const result = await updateClinic(clinicId.value, editFormData)
  if (result) {
    clinic.value = result
    isEditing.value = false
    successMessage.value = 'Clinic updated successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
}

const handleDelete = async () => {
  const success = await deleteClinic(clinicId.value)
  if (success) {
    router.push({ name: 'AdminClinics' })
  }
}

const handleBack = () => {
  router.push({ name: 'AdminClinics' })
}

onMounted(() => {
  loadClinic()
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Loading State -->
    <div v-if="loading && !clinic" class="space-y-6">
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
    <div v-else-if="clinic">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="handleBack">
            <Icon icon="lucide:arrow-left" class="h-5 w-5" />
          </Button>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-bold tracking-tight">{{ clinic.name }}</h1>
              <Badge variant="secondary">{{ clinic.clinic_type }}</Badge>
            </div>
            <p class="text-muted-foreground">Clinic ID: {{ clinic.id }}</p>
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

      <!-- Success Message -->
      <Card v-if="successMessage" class="border-green-500 bg-green-50 dark:bg-green-950">
        <CardContent class="pt-6">
          <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Icon icon="lucide:check-circle" class="h-5 w-5" />
            <p class="font-medium">{{ successMessage }}</p>
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

      <!-- View Mode -->
      <div v-if="!isEditing" class="space-y-6">
        <!-- Basic Information -->
        <Card>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Clinic Name</Label>
                <p class="text-base font-medium">{{ clinic.name }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Clinic Type</Label>
                <p class="text-base font-medium">{{ clinic.clinic_type || 'Not specified' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Region</Label>
                <p class="text-base font-medium">{{ clinic.region || 'Not specified' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Area</Label>
                <p class="text-base font-medium">{{ clinic.area || 'Not specified' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Location Details -->
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label class="text-muted-foreground">Address</Label>
              <p class="text-base font-medium">{{ clinic.address_line || 'Not specified' }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Operating Hours -->
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Opening Time</Label>
                <p class="text-base font-medium">{{ clinic.open_time || 'Not set' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Closing Time</Label>
                <p class="text-base font-medium">{{ clinic.close_time || 'Not set' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Additional Information -->
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label class="text-muted-foreground">Note</Label>
              <p class="text-base font-medium">{{ clinic.note || 'No notes' }}</p>
            </div>
            <Separator />
            <div>
              <Label class="text-muted-foreground">Remarks</Label>
              <p class="text-base font-medium">{{ clinic.remarks || 'No remarks' }}</p>
            </div>
            <Separator />
            <div>
              <Label class="text-muted-foreground">Source Reference</Label>
              <p class="text-base font-medium">{{ clinic.source_ref || 'No reference' }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Metadata -->
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Created At</Label>
                <p class="text-base font-medium">
                  {{ clinic.created_at ? new Date(clinic.created_at).toLocaleString() : 'Unknown' }}
                </p>
              </div>
              <div>
                <Label class="text-muted-foreground">Last Updated</Label>
                <p class="text-base font-medium">
                  {{ clinic.updated_at ? new Date(clinic.updated_at).toLocaleString() : 'Unknown' }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Edit Mode -->
      <form v-else @submit.prevent="handleSave" class="space-y-6">
        <!-- Basic Information -->
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Edit clinic details</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2 md:col-span-2">
                <Label for="edit-name">Clinic Name</Label>
                <Input id="edit-name" v-model="editFormData.name" />
              </div>

              <div class="space-y-2">
                <Label>Clinic Type</Label>
                <div class="flex flex-wrap gap-2">
                  <Button 
                    v-for="type in clinicTypes" 
                    :key="type"
                    type="button"
                    :variant="editFormData.clinic_type === type ? 'default' : 'outline'" 
                    size="sm"
                    @click="editFormData.clinic_type = type"
                  >
                    {{ type }}
                  </Button>
                </div>
              </div>

              <div class="space-y-2">
                <Label>Region</Label>
                <div class="flex flex-wrap gap-2">
                  <Button 
                    v-for="region in regions" 
                    :key="region"
                    type="button"
                    :variant="editFormData.region === region ? 'default' : 'outline'" 
                    size="sm"
                    @click="editFormData.region = region"
                  >
                    {{ region }}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Location Details -->
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="edit-area">Area</Label>
                <Input 
                  id="edit-area" 
                  :model-value="editFormData.area ?? ''"
                  @update:model-value="editFormData.area = ($event as string) || null"
                />
              </div>
              <div class="space-y-2">
                <Label for="edit-address">Address</Label>
                <Input 
                  id="edit-address" 
                  :model-value="editFormData.address_line ?? ''"
                  @update:model-value="editFormData.address_line = ($event as string) || null"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Operating Hours -->
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="edit-open-time">Opening Time</Label>
                <Input 
                  id="edit-open-time" 
                  type="time"
                  :model-value="editFormData.open_time ?? ''"
                  @update:model-value="editFormData.open_time = ($event as string) || null"
                />
              </div>
              <div class="space-y-2">
                <Label for="edit-close-time">Closing Time</Label>
                <Input 
                  id="edit-close-time" 
                  type="time"
                  :model-value="editFormData.close_time ?? ''"
                  @update:model-value="editFormData.close_time = ($event as string) || null"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Additional Information -->
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="edit-note">Note</Label>
              <Input 
                id="edit-note" 
                :model-value="editFormData.note ?? ''"
                @update:model-value="editFormData.note = ($event as string) || null"
              />
            </div>
            <div class="space-y-2">
              <Label for="edit-remarks">Remarks</Label>
              <Input 
                id="edit-remarks" 
                :model-value="editFormData.remarks ?? ''"
                @update:model-value="editFormData.remarks = ($event as string) || null"
              />
            </div>
            <div class="space-y-2">
              <Label for="edit-source-ref">Source Reference</Label>
              <Input 
                id="edit-source-ref" 
                :model-value="editFormData.source_ref ?? ''"
                @update:model-value="editFormData.source_ref = ($event as string) || null"
              />
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
          <DialogTitle>Delete Clinic</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ clinic?.name }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="handleDelete" :disabled="loading">
            <Icon v-if="loading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>