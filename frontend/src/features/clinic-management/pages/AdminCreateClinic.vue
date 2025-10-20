<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useClinics, type CreateClinicRequest } from '../composables/useClinics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'

const router = useRouter()
const { createClinic, loading, error } = useClinics()

const formData = reactive<Partial<CreateClinicRequest>>({
  name: '',
  clinicType: '',
  region: '',
  area: '',
  addressLine: '',
  openTime: '',
  closeTime: '',
  note: '',
  remarks: ''
})

const formErrors = ref<Record<string, string>>({})
const successMessage = ref(false)

const regions = ['Central', 'West', 'East', 'North-East', 'North']
const clinicTypes = ['General', 'Specialist', 'Polyclinic', 'Emergency']

const validateForm = () => {
  formErrors.value = {}
  
  if (!formData.name?.trim()) {
    formErrors.value.name = 'Clinic name is required'
  }
  
  if (!formData.clinicType) {
    formErrors.value.clinicType = 'Clinic type is required'
  }
  
  if (!formData.region) {
    formErrors.value.region = 'Region is required'
  }
  
  if (!formData.area?.trim()) {
    formErrors.value.area = 'Area is required'
  }
  
  if (!formData.addressLine?.trim()) {
    formErrors.value.addressLine = 'Address is required'
  }
  
  return Object.keys(formErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast.error('Validation Failed', {
      description: 'Please check all required fields',
      action: {
        label: 'Review',
        onClick: () => {}
      }
    })
    return
  }
  
  try {
    const result = await createClinic(formData)
    toast.success('Clinic Created', {
      description: 'New clinic has been successfully created',
      action: {
        label: 'View Details',
        onClick: () => router.push({ name: 'AdminClinicDetails', params: { id: result.id } })
      }
    })
    setTimeout(() => {
      router.push({ name: 'AdminClinicDetails', params: { id: result.id } })
    }, 1500)
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to create clinic')
    toast.error('Creation Failed', {
      description: errorMessage,
      action: {
        label: 'Retry',
        onClick: () => handleSubmit()
      }
    })
  }
}

const handleCancel = () => {
  router.push({ name: 'AdminClinics' })
}
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">Create New Clinic</h1>
        <p class="text-muted-foreground">Add a new healthcare facility to the system</p>
      </div>
      <Button variant="outline" @click="handleCancel">
        <Icon icon="lucide:x" class="mr-2 h-4 w-4" />
        Cancel
      </Button>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential details about the clinic</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Clinic Name -->
            <div class="space-y-2 md:col-span-2">
              <Label for="name">
                Clinic Name <span class="text-destructive">*</span>
              </Label>
              <Input 
                id="name" 
                v-model="formData.name" 
                placeholder="Enter clinic name"
                :class="{ 'border-destructive': formErrors.name }"
              />
              <p v-if="formErrors.name" class="text-sm text-destructive">{{ formErrors.name }}</p>
            </div>

            <!-- Clinic Type -->
            <div class="space-y-2">
              <Label>
                Clinic Type <span class="text-destructive">*</span>
              </Label>
              <div class="flex flex-wrap gap-2">
                <Button 
                  v-for="type in clinicTypes" 
                  :key="type"
                  type="button"
                  :variant="formData.clinicType === type ? 'default' : 'outline'" 
                  size="sm"
                  @click="formData.clinicType = type"
                >
                  {{ type }}
                </Button>
              </div>
              <p v-if="formErrors.clinicType" class="text-sm text-destructive">{{ formErrors.clinicType }}</p>
            </div>

            <!-- Region -->
            <div class="space-y-2">
              <Label>
                Region <span class="text-destructive">*</span>
              </Label>
              <div class="flex flex-wrap gap-2">
                <Button 
                  v-for="region in regions" 
                  :key="region"
                  type="button"
                  :variant="formData.region === region ? 'default' : 'outline'" 
                  size="sm"
                  @click="formData.region = region"
                >
                  {{ region }}
                </Button>
              </div>
              <p v-if="formErrors.region" class="text-sm text-destructive">{{ formErrors.region }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Location Details -->
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>Address and location information</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Area -->
            <div class="space-y-2">
              <Label for="area">
                Area <span class="text-destructive">*</span>
              </Label>
              <Input 
                id="area" 
                placeholder="e.g., Tampines, Jurong"
                :class="{ 'border-destructive': formErrors.area }"
                :model-value="formData.area ?? ''"
                @update:model-value="formData.area = ($event as string) || null"
              />
              <p v-if="formErrors.area" class="text-sm text-destructive">{{ formErrors.area }}</p>
            </div>

            <!-- Address Line -->
            <div class="space-y-2">
              <Label for="address">
                Address <span class="text-destructive">*</span>
              </Label>
              <Input 
                id="address" 
                placeholder="Full street address"
                :class="{ 'border-destructive': formErrors.addressLine }"
                :model-value="formData.addressLine ?? ''"
                @update:model-value="formData.addressLine = ($event as string) || null"
              />
              <p v-if="formErrors.addressLine" class="text-sm text-destructive">{{ formErrors.addressLine }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Operating Hours -->
      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription>Clinic operating schedule</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Open Time -->
            <div class="space-y-2">
              <Label for="open-time">Opening Time</Label>
              <Input 
                id="open-time" 
                type="time"
                placeholder="09:00"
                :model-value="formData.openTime ?? ''"
                @update:model-value="formData.openTime = ($event as string) || null"
              />
            </div>

            <!-- Close Time -->
            <div class="space-y-2">
              <Label for="close-time">Closing Time</Label>
              <Input 
                id="close-time" 
                type="time"
                placeholder="17:00"
                :model-value="formData.closeTime ?? ''"
                @update:model-value="formData.closeTime = ($event as string) || null"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Additional Information -->
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Optional notes and references</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <!-- Note -->
            <div class="space-y-2">
              <Label for="note">Note</Label>
              <Input 
                id="note" 
                placeholder="Additional notes about the clinic"
                :model-value="formData.note ?? ''"
                @update:model-value="formData.note = ($event as string) || null"
              />
            </div>

            <!-- Remarks -->
            <div class="space-y-2">
              <Label for="remarks">Remarks</Label>
              <Input 
                id="remarks" 
                placeholder="Any special remarks"
                :model-value="formData.remarks ?? ''"
                @update:model-value="formData.remarks = ($event as string) || null"
              />
            </div>

            <!-- Source Reference -->
            <div class="space-y-2">
              <Label for="source-ref">Source Reference</Label>
              <Input 
                id="source-ref" 
                placeholder="External reference or ID"
                :model-value="formData.source_ref ?? ''"
                @update:model-value="formData.source_ref = ($event as string) || null"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-4">
        <Button type="button" variant="outline" @click="handleCancel" :disabled="loading">
          Cancel
        </Button>
        <Button type="submit" :disabled="loading">
          <Icon v-if="loading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
          <Icon v-else icon="lucide:check" class="mr-2 h-4 w-4" />
          {{ loading ? 'Creating...' : 'Create Clinic' }}
        </Button>
      </div>
    </form>
  </div>
</template>