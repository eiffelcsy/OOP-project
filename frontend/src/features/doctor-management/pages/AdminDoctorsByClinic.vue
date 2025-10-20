<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDoctors } from '../composables/useDoctors'
import { useClinics } from '@/features/clinic-management/composables/useClinics'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'

const { doctors, loading: doctorsLoading, error: doctorsError, fetchDoctorsByClinicId, navigateToDoctor, navigateToCreateDoctor } = useDoctors()
const { clinics, loading: clinicsLoading, error: clinicsError, fetchClinics } = useClinics()

const selectedClinicId = ref<number | null>(null)
const searchQuery = ref('')
const showClinicSelector = ref(false)
const clinicSearchQuery = ref('')

// Get selected clinic details
const selectedClinic = computed(() => {
  if (!selectedClinicId.value) return null
  return clinics.value.find(c => c.id === selectedClinicId.value)
})

// Filter doctors based on search
const filteredDoctors = computed(() => {
  let filtered = doctors.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doctor => 
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialty?.toLowerCase().includes(query)
    )
  }

  return filtered
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

// Statistics
const stats = computed(() => ({
  total: doctors.value.length,
  active: doctors.value.filter(d => d.active).length,
  inactive: doctors.value.filter(d => !d.active).length,
  specialties: new Set(doctors.value.map(d => d.specialty).filter(Boolean)).size
}))

const handleSelectClinic = async (clinicId: number) => {
  selectedClinicId.value = clinicId
  showClinicSelector.value = false
  clinicSearchQuery.value = ''
  await fetchDoctorsByClinicId(clinicId)
  if (doctorsError.value) {
    toast.error('Failed to Load Doctors', {
      description: doctorsError.value,
      action: {
        label: 'Retry',
        onClick: () => fetchDoctorsByClinicId(clinicId)
      }
    })
  }
}

const handleClearClinic = () => {
  selectedClinicId.value = null
  doctors.value = []
  searchQuery.value = ''
}

onMounted(async () => {
  await fetchClinics()
  if (clinicsError.value) {
    toast.error('Failed to Load Clinics', {
      description: clinicsError.value,
      action: {
        label: 'Retry',
        onClick: () => fetchClinics()
      }
    })
  }
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Page Header -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Doctor Management</h1>
          <p class="text-muted-foreground">Manage doctors across all clinics</p>
        </div>
        <Button 
          @click="navigateToCreateDoctor" 
          size="lg"
          :disabled="!selectedClinicId"
        >
          <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
          Add New Doctor
        </Button>
      </div>
    </div>

    <!-- Clinic Selector -->
    <Card>
      <CardHeader>
        <CardTitle>Select Clinic</CardTitle>
        <CardDescription>Choose a clinic to view and manage its doctors</CardDescription>
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
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="showClinicSelector = true">
              <Icon icon="lucide:repeat" class="mr-2 h-4 w-4" />
              Change Clinic
            </Button>
            <Button variant="ghost" size="sm" @click="handleClearClinic">
              <Icon icon="lucide:x" class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button 
          v-else 
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
      </CardContent>
    </Card>

    <!-- Statistics Cards (shown when clinic is selected) -->
    <div v-if="selectedClinicId" class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Doctors</CardTitle>
          <Icon icon="lucide:user-round" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.total }}</div>
          <p class="text-xs text-muted-foreground">In this clinic</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active</CardTitle>
          <Icon icon="lucide:check-circle" class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.active }}</div>
          <p class="text-xs text-muted-foreground">Currently practicing</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Inactive</CardTitle>
          <Icon icon="lucide:x-circle" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.inactive }}</div>
          <p class="text-xs text-muted-foreground">Not practicing</p>
        </CardContent>
      </Card>
    </div>

    <!-- Search Bar (shown when clinic is selected) -->
    <Card v-if="selectedClinicId">
      <CardHeader>
        <CardTitle>Search Doctors</CardTitle>
        <CardDescription>Find doctors by name or specialty</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="relative">
          <Input 
            v-model="searchQuery" 
            placeholder="Search by name or specialty..." 
            class="pr-10"
          />
          <Icon icon="lucide:search" class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="doctorsLoading && selectedClinicId" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 6" :key="i">
        <CardHeader>
          <Skeleton class="h-6 w-3/4 mb-2" />
          <Skeleton class="h-4 w-full" />
        </CardHeader>
      </Card>
    </div>

    <!-- Doctors Grid -->
    <div v-else-if="selectedClinicId && filteredDoctors.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card 
        v-for="doctor in filteredDoctors" 
        :key="doctor.id"
        class="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
        @click="navigateToDoctor(doctor.id)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg mb-2">{{ doctor.name }}</CardTitle>
              <CardDescription>
                <div class="flex items-center gap-2">
                  <Icon icon="lucide:stethoscope" class="h-3 w-3" />
                  <span class="text-sm">{{ doctor.specialty || 'General Practice' }}</span>
                </div>
              </CardDescription>
            </div>
            <Badge :variant="doctor.active ? 'default' : 'secondary'" class="ml-2">
              {{ doctor.active ? 'Active' : 'Inactive' }}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter class="border-t pt-4">
          <div class="flex items-center justify-between w-full text-sm">
            <div class="flex items-center gap-2 text-muted-foreground">
              <Icon icon="lucide:calendar" class="h-4 w-4" />
              <span>View Schedule</span>
            </div>
            <Icon icon="lucide:chevron-right" class="h-4 w-4 text-muted-foreground" />
          </div>
        </CardFooter>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else-if="selectedClinicId" class="border-none shadow-none">
      <CardContent class="pt-6">
        <div class="text-center py-12">
          <Icon icon="lucide:user-round" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No doctors found</h3>
          <p class="text-muted-foreground mb-4">
            {{ searchQuery 
              ? 'Try adjusting your search' 
              : 'Get started by adding your first doctor to this clinic' }}
          </p>
          <Button @click="navigateToCreateDoctor" v-if="!searchQuery">
            <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
            Add New Doctor
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- No Clinic Selected State -->
    <Card v-else-if="!selectedClinicId" class="border-none shadow-none">
      <CardContent class="pt-6">
        <div class="text-center py-12">
          <Icon icon="lucide:building" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">Select a clinic to begin</h3>
          <p class="text-muted-foreground mb-4">
            Choose a clinic from the selector above to view and manage its doctors
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Clinic Selector Dialog -->
    <Dialog v-model:open="showClinicSelector">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Clinic</DialogTitle>
          <DialogDescription>
            Choose a clinic to view and manage its doctors
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
            <div v-if="clinicsLoading" class="space-y-2">
              <Skeleton v-for="i in 5" :key="i" class="h-16 w-full" />
            </div>
            <div 
              v-else
              v-for="clinic in filteredClinics" 
              :key="clinic.id"
              class="p-4 border rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md"
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
            <div v-if="!clinicsLoading && filteredClinics.length === 0" class="text-center py-8">
              <p class="text-muted-foreground">No clinics found</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

