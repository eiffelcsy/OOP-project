<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDoctors, type CreateDoctorRequest } from '../composables/useDoctors'
import { useClinics } from '@/features/clinic-management/composables/useClinics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'

const router = useRouter()
const { createDoctor, loading, error } = useDoctors()
const { clinics, loading: clinicsLoading, fetchClinics } = useClinics()

const showClinicSelector = ref(false)
const clinicSearchQuery = ref('')
const selectedClinicId = ref<number | null>(null)

const formData = reactive<CreateDoctorRequest>({
  name: '',
  specialty: null,
  clinic_id: 0,
  active: true
})

const specialties = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Psychiatry',
  'Surgery',
  'Internal Medicine',
  'Emergency Medicine'
]

const showCustomSpecialty = ref(false)
const customSpecialty = ref('')

// Get selected clinic details
const selectedClinic = computed(() => {
  if (!selectedClinicId.value) return null
  return clinics.value.find(c => c.id === selectedClinicId.value)
})

// Filter clinics for the selector
const filteredClinics = computed(() => {
  if (!clinicSearchQuery.value) return clinics.value
  
  const query = clinicSearchQuery.value.toLowerCase()
  return clinics.value.filter(clinic =>
    clinic.name.toLowerCase().includes(query) ||
    clinic.region?.toLowerCase().includes(query) ||
    clinic.area?.toLowerCase().includes(query)
  )
})

const isFormValid = computed(() => {
  return formData.name.trim() !== '' && formData.clinic_id > 0
})

const handleSelectClinic = (clinicId: number) => {
  selectedClinicId.value = clinicId
  formData.clinic_id = clinicId
  showClinicSelector.value = false
  clinicSearchQuery.value = ''
}

const handleSelectSpecialty = (specialty: string) => {
  formData.specialty = specialty
  showCustomSpecialty.value = false
  customSpecialty.value = ''
}

const handleSelectOther = () => {
  showCustomSpecialty.value = true
  formData.specialty = null
}

const handleCustomSpecialtyChange = (value: string) => {
  customSpecialty.value = value
  if (value.trim()) {
    formData.specialty = value.trim()
  } else {
    formData.specialty = null
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    toast.error('Invalid Form', {
      description: 'Please fill in all required fields',
      action: {
        label: 'Review',
        onClick: () => {}
      }
    })
    return
  }

  try {
    const result = await createDoctor(formData)
    toast.success('Doctor Created', {
      description: 'New doctor profile has been successfully created',
      action: {
        label: 'View Profile',
        onClick: () => router.push({ name: 'AdminDoctorDetails', params: { id: result.id } })
      }
    })
    // Navigate to the new doctor's details page
    router.push({ name: 'AdminDoctorDetails', params: { id: result.id } })
  } catch (err) {
    const errorMessage = error.value || (err instanceof Error ? err.message : 'Failed to create doctor')
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
  router.back()
}

onMounted(() => {
  fetchClinics()
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Page Header -->
    <div class="flex items-center gap-4 mb-8">
      <Button variant="ghost" size="icon" @click="handleCancel">
        <Icon icon="lucide:arrow-left" class="h-5 w-5" />
      </Button>
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">Add New Doctor</h1>
        <p class="text-muted-foreground">Create a new doctor profile</p>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Clinic Selection -->
      <Card>
        <CardHeader>
          <CardTitle>Clinic Assignment</CardTitle>
          <CardDescription>Select which clinic this doctor will work at</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="selectedClinic" class="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div class="flex items-center gap-3">
              <Icon icon="lucide:building" class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="font-semibold">{{ selectedClinic.name }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ selectedClinic.region }} • {{ selectedClinic.area }}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" @click="showClinicSelector = true">
              <Icon icon="lucide:repeat" class="mr-2 h-4 w-4" />
              Change Clinic
            </Button>
          </div>
          <Button 
            v-else 
            type="button"
            @click="showClinicSelector = true" 
            variant="outline" 
            class="w-full h-24"
            :disabled="clinicsLoading"
          >
            <div class="flex flex-col items-center gap-2">
              <Icon icon="lucide:building" class="h-6 w-6" />
              <span>{{ clinicsLoading ? 'Loading clinics...' : 'Select a Clinic' }}</span>
            </div>
          </Button>
          <p v-if="!selectedClinicId" class="text-sm text-muted-foreground">
            <Icon icon="lucide:info" class="inline h-4 w-4 mr-1" />
            You must select a clinic before creating a doctor
          </p>
        </CardContent>
      </Card>

      <!-- Basic Information -->
      <Card>
        <CardHeader>
          <CardTitle>Doctor Information</CardTitle>
          <CardDescription>Enter the doctor's basic details</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Doctor Name <span class="text-destructive">*</span></Label>
            <Input 
              id="name" 
              v-model="formData.name" 
              placeholder="Dr. John Smith"
              required
            />
          </div>

          <div class="space-y-2">
            <Label>Specialty</Label>
            <p class="text-sm text-muted-foreground mb-2">Select the doctor's area of specialization</p>
            <div class="flex flex-wrap gap-2">
              <Button 
                v-for="specialty in specialties" 
                :key="specialty"
                type="button"
                :variant="formData.specialty === specialty && !showCustomSpecialty ? 'default' : 'outline'" 
                size="sm"
                @click="handleSelectSpecialty(specialty)"
              >
                {{ specialty }}
              </Button>
              <Button 
                type="button"
                :variant="showCustomSpecialty ? 'default' : 'outline'" 
                size="sm"
                @click="handleSelectOther"
              >
                <Icon icon="lucide:edit" class="mr-1 h-3 w-3" />
                Other
              </Button>
              <Button 
                type="button"
                :variant="formData.specialty === null && !showCustomSpecialty ? 'default' : 'outline'" 
                size="sm"
                @click="() => { formData.specialty = null; showCustomSpecialty = false; customSpecialty = '' }"
              >
                <Icon icon="lucide:x" class="mr-1 h-3 w-3" />
                None
              </Button>
            </div>
            
            <!-- Custom Specialty Input -->
            <div v-if="showCustomSpecialty" class="pt-2">

              <Input 
                id="custom-specialty" 
                :model-value="customSpecialty"
                @update:model-value="handleCustomSpecialtyChange"
                placeholder="Enter custom specialty..."
                class="mt-1"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label>Status</Label>
            <p class="text-sm text-muted-foreground mb-2">Set whether the doctor is currently active</p>
            <div class="flex gap-2">
              <Button 
                type="button"
                :variant="formData.active ? 'default' : 'outline'" 
                size="sm"
                @click="formData.active = true"
              >
                <Icon icon="lucide:check-circle" class="mr-2 h-4 w-4" />
                Active
              </Button>
              <Button 
                type="button"
                :variant="!formData.active ? 'default' : 'outline'" 
                size="sm"
                @click="formData.active = false"
              >
                <Icon icon="lucide:x-circle" class="mr-2 h-4 w-4" />
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Summary -->
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Review the information before creating</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Doctor Name:</span>
              <span class="font-medium">{{ formData.name || '(not set)' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Specialty:</span>
              <span class="font-medium">
                {{ formData.specialty || 'General Practice' }}
                <Badge v-if="showCustomSpecialty && formData.specialty" variant="outline" class="ml-2">Custom</Badge>
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Clinic:</span>
              <span class="font-medium">{{ selectedClinic?.name || '(not selected)' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Status:</span>
              <Badge :variant="formData.active ? 'default' : 'secondary'">
                {{ formData.active ? 'Active' : 'Inactive' }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-4">
        <Button type="button" variant="outline" @click="handleCancel" :disabled="loading">
          Cancel
        </Button>
        <Button type="submit" :disabled="loading || !isFormValid">
          <Icon v-if="loading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
          <Icon v-else icon="lucide:plus" class="mr-2 h-4 w-4" />
          {{ loading ? 'Creating...' : 'Create Doctor' }}
        </Button>
      </div>
    </form>

    <!-- Clinic Selector Dialog -->
    <Dialog v-model:open="showClinicSelector">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Clinic</DialogTitle>
          <DialogDescription>
            Choose which clinic this doctor will be assigned to
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 flex-1 overflow-hidden flex flex-col">
          <!-- Search -->
          <div class="relative">
            <Input 
              v-model="clinicSearchQuery" 
              placeholder="Search clinics..." 
              class="pr-10"
            />
            <Icon icon="lucide:search" class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <!-- Clinics List -->
          <div class="flex-1 overflow-y-auto space-y-2 pr-2">
            <div 
              v-for="clinic in filteredClinics" 
              :key="clinic.id"
              class="p-4 border rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md"
              :class="{ 'border-primary bg-primary/5': selectedClinicId === clinic.id }"
              @click="handleSelectClinic(clinic.id)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold">{{ clinic.name }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ clinic.region }} • {{ clinic.area }}
                  </p>
                </div>
                <Badge variant="secondary">{{ clinic.clinicType }}</Badge>
              </div>
            </div>
            <div v-if="filteredClinics.length === 0" class="text-center py-8">
              <Icon icon="lucide:building-2" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p class="text-muted-foreground">No clinics found</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

