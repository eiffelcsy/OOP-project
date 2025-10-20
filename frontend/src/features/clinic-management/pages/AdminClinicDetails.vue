<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClinics, type ClinicResponse, type UpdateClinicRequest } from '../composables/useClinics'
import { useDoctors } from '@/features/doctor-management/composables/useDoctors'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const { fetchClinicById, updateClinic, deleteClinic, loading, error } = useClinics()
const { 
  doctors, 
  loading: doctorsLoading, 
  error: doctorsError, 
  fetchDoctorsByClinicId,
  navigateToDoctor,
  navigateToCreateDoctor
} = useDoctors()

const clinic = ref<ClinicResponse | null>(null)
const isEditing = ref(false)
const showDeleteDialog = ref(false)
const successMessage = ref('')
const showAdditionalInfo = ref(false)
const showMetadata = ref(false)

const editFormData = reactive<Partial<UpdateClinicRequest>>({})

const regions = ['Central', 'West', 'East', 'North-East', 'North']
const clinicTypes = ['General', 'Specialist', 'Polyclinic', 'Emergency']

const clinicId = computed(() => parseInt(route.params.id as string))

const loadClinic = async () => {
  try {
    const data = await fetchClinicById(clinicId.value)
    clinic.value = data
    // Copy data to edit form
    Object.assign(editFormData, data)
    // Load doctors for this clinic
    await loadDoctors()
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to load clinic')
    toast.error('Load Failed', {
      description: errorMessage
    })
    router.push({ name: 'AdminClinics' })
  }
}

const loadDoctors = async () => {
  await fetchDoctorsByClinicId(clinicId.value)
}

// Doctor statistics
const doctorStats = computed(() => ({
  total: doctors.value.length,
  active: doctors.value.filter(d => d.active).length,
  inactive: doctors.value.filter(d => !d.active).length
}))

const handleEdit = () => {
  if (clinic.value) {
    // Clear and repopulate editFormData
    Object.keys(editFormData).forEach(key => {
      delete editFormData[key as keyof typeof editFormData]
    })
    Object.assign(editFormData, { ...clinic.value })
    console.log('Edit form data:', editFormData)
    console.log('Clinic type:', editFormData.clinicType)
    console.log('Region:', editFormData.region)
  }
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
  Object.assign(editFormData, clinic.value)
}

const handleSave = async () => {
  try {
    const result = await updateClinic(clinicId.value, editFormData)
    clinic.value = result
    isEditing.value = false
    toast.success('Clinic Updated', {
      description: 'Clinic information has been updated successfully',
      action: {
        label: 'View',
        onClick: () => {}
      }
    })
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to update clinic')
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
    await deleteClinic(clinicId.value)
    toast.success('Clinic Deleted', {
      description: 'The clinic has been permanently deleted',
      action: {
        label: 'Dismiss',
        onClick: () => {}
      }
    })
    router.push({ name: 'AdminClinics' })
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to delete clinic')
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
              <Badge variant="secondary">{{ clinic.clinicType }}</Badge>
            </div>
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
        <!-- All Clinic Information -->
        <Card>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Clinic Name</Label>
                <p class="text-base font-medium">{{ clinic.name }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Clinic Type</Label>
                <p class="text-base font-medium">{{ clinic.clinicType || 'Not specified' }}</p>
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

            <Separator />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <!-- Location Details -->
            <div>
              <h3 class="text-sm font-semibold mb-4">Location Details</h3>
              <div>
                <Label class="text-muted-foreground">Address</Label>
                <p class="text-base font-medium">{{ clinic.addressLine || 'Not specified' }}</p>
              </div>
            </div>

            <!-- Operating Hours -->
            <div>
              <h3 class="text-sm font-semibold mb-4">Operating Hours</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label class="text-muted-foreground">Opening Time</Label>
                  <p class="text-base font-medium">{{ clinic.openTime || 'Not set' }}</p>
                </div>
                <div>
                  <Label class="text-muted-foreground">Closing Time</Label>
                  <p class="text-base font-medium">{{ clinic.closeTime || 'Not set' }}</p>
                </div>
              </div>
            </div>
            </div>

            <Separator />

            <!-- Additional Information (Collapsible) -->
            <Collapsible v-model:open="showAdditionalInfo">
              <CollapsibleTrigger class="flex items-center justify-between w-full hover:opacity-70 transition-opacity">
                <h3 class="text-sm font-semibold">Additional Information</h3>
                <Icon 
                  :icon="showAdditionalInfo ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
                  class="h-4 w-4" 
                />
              </CollapsibleTrigger>
              <CollapsibleContent class="pt-4">
                <div class="space-y-4">
                  <div>
                    <Label class="text-muted-foreground">Note</Label>
                    <p class="text-base font-medium">{{ clinic.note || 'No notes' }}</p>
                  </div>
                  <div>
                    <Label class="text-muted-foreground">Remarks</Label>
                    <p class="text-base font-medium">{{ clinic.remarks || 'No remarks' }}</p>
                  </div>
                  <div>
                    <Label class="text-muted-foreground">Source Reference</Label>
                    <p class="text-base font-medium">{{ clinic.source_ref || 'No reference' }}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            <!-- Metadata (Collapsible) -->
            <Collapsible v-model:open="showMetadata">
              <CollapsibleTrigger class="flex items-center justify-between w-full hover:opacity-70 transition-opacity">
                <h3 class="text-sm font-semibold">Metadata</h3>
                <Icon 
                  :icon="showMetadata ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
                  class="h-4 w-4" 
                />
              </CollapsibleTrigger>
              <CollapsibleContent class="pt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label class="text-muted-foreground">Created At</Label>
                    <p class="text-base font-medium">
                      {{ clinic.createdAt ? new Date(clinic.createdAt).toLocaleString() : 'Unknown' }}
                    </p>
                  </div>
                  <div>
                    <Label class="text-muted-foreground">Last Updated</Label>
                    <p class="text-base font-medium">
                      {{ clinic.updatedAt ? new Date(clinic.updatedAt).toLocaleString() : 'Unknown' }}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <!-- Doctors at This Clinic -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Doctors</CardTitle>
                <CardDescription>Doctors assigned to this clinic</CardDescription>
              </div>
              <Button size="sm" @click="navigateToCreateDoctor">
                <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
                Add Doctor
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Doctor Stats -->
            <div class="grid grid-cols-3 gap-4">
              <div class="p-4 border rounded-lg">
                <div class="text-2xl font-bold">{{ doctorStats.total }}</div>
                <p class="text-xs text-muted-foreground">Total Doctors</p>
              </div>
              <div class="p-4 border rounded-lg">
                <div class="text-2xl font-bold">{{ doctorStats.active }}</div>
                <p class="text-xs text-muted-foreground">Active</p>
              </div>
              <div class="p-4 border rounded-lg">
                <div class="text-2xl font-bold">{{ doctorStats.inactive }}</div>
                <p class="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>

            <Separator />

            <!-- Loading State -->
            <div v-if="doctorsLoading" class="space-y-3">
              <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
            </div>

            <!-- Error State -->
            <div v-else-if="doctorsError" class="text-center py-8">
              <Icon icon="lucide:alert-circle" class="h-8 w-8 mx-auto text-destructive mb-2" />
              <p class="text-sm text-destructive">{{ doctorsError }}</p>
            </div>

            <!-- Doctors List -->
            <div v-else-if="doctors.length > 0" class="space-y-2">
              <div 
                v-for="doctor in doctors" 
                :key="doctor.id"
                class="p-4 border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
                @click="navigateToDoctor(doctor.id)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 flex-1">
                    <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon icon="lucide:user-round" class="h-5 w-5 text-primary" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <p class="font-semibold">{{ doctor.name }}</p>
                        <Badge :variant="doctor.active ? 'default' : 'secondary'" class="text-xs">
                          {{ doctor.active ? 'Active' : 'Inactive' }}
                        </Badge>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon icon="lucide:stethoscope" class="h-3 w-3" />
                        <span>{{ doctor.specialty || 'General Practice' }}</span>
                      </div>
                    </div>
                  </div>
                  <Icon 
                    icon="lucide:chevron-right" 
                    class="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" 
                  />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8">
              <Icon icon="lucide:user-round" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 class="text-lg font-semibold mb-2">No doctors yet</h3>
              <p class="text-muted-foreground mb-4">
                Get started by adding your first doctor to this clinic
              </p>
              <Button @click="navigateToCreateDoctor">
                <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
                Add First Doctor
              </Button>
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
                    :variant="editFormData.clinicType === type ? 'default' : 'outline'" 
                    size="sm"
                    @click="editFormData.clinicType = type"
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
                  :model-value="editFormData.addressLine ?? ''"
                  @update:model-value="editFormData.addressLine = ($event as string) || null"
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
                  :model-value="editFormData.openTime ?? ''"
                  @update:model-value="editFormData.openTime = ($event as string) || null"
                />
              </div>
              <div class="space-y-2">
                <Label for="edit-close-time">Closing Time</Label>
                <Input 
                  id="edit-close-time" 
                  type="time"
                  :model-value="editFormData.closeTime ?? ''"
                  @update:model-value="editFormData.closeTime = ($event as string) || null"
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