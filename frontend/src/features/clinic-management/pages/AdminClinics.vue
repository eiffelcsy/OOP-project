<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useClinics } from '../composables/useClinics'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'
import { Skeleton } from '@/components/ui/skeleton'

const { clinics, loading, error, fetchClinics, navigateToClinic, navigateToCreateClinic } = useClinics()

const searchQuery = ref('')
const selectedRegion = ref<string>('All')
const selectedType = ref<string>('All')

// Filter clinics based on search and filters
const filteredClinics = computed(() => {
  let filtered = clinics.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(clinic => 
      clinic.name.toLowerCase().includes(query) ||
      clinic.address_line?.toLowerCase().includes(query) ||
      clinic.area?.toLowerCase().includes(query) ||
      clinic.region?.toLowerCase().includes(query)
    )
  }

  // Region filter
  if (selectedRegion.value !== 'All') {
    filtered = filtered.filter(clinic => clinic.region === selectedRegion.value)
  }

  // Type filter
  if (selectedType.value !== 'All') {
    filtered = filtered.filter(clinic => clinic.clinic_type === selectedType.value)
  }

  return filtered
})

// Get unique regions and types from clinics
const regions = computed(() => {
  const uniqueRegions = new Set(clinics.value.map(c => c.region).filter(Boolean))
  return ['All', ...Array.from(uniqueRegions).sort()]
})

const clinicTypes = computed(() => {
  const uniqueTypes = new Set(clinics.value.map(c => c.clinic_type).filter(Boolean))
  return ['All', ...Array.from(uniqueTypes).sort()]
})

// Statistics
const stats = computed(() => ({
  total: clinics.value.length,
  byRegion: clinics.value.reduce((acc, clinic) => {
    const region = clinic.region || 'Unknown'
    acc[region] = (acc[region] || 0) + 1
    return acc
  }, {} as Record<string, number>),
  byType: clinics.value.reduce((acc, clinic) => {
    const type = clinic.clinic_type || 'Unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}))


onMounted(() => {
  fetchClinics()
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Page Header -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Clinic Management</h1>
          <p class="text-muted-foreground">Manage and monitor all clinics in the system</p>
        </div>
        <Button @click="navigateToCreateClinic" size="lg">
          <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
          Add New Clinic
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Clinics</CardTitle>
          <Icon icon="lucide:building" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.total }}</div>
          <p class="text-xs text-muted-foreground">Active healthcare facilities</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Clinic Types</CardTitle>
          <Icon icon="lucide:stethoscope" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ Object.keys(stats.byType).length }}</div>
          <p class="text-xs text-muted-foreground">Service categories</p>
        </CardContent>
      </Card>
    </div>

    <!-- Search and Filters -->
    <Card>
      <CardHeader>
        <CardTitle>Search & Filter</CardTitle>
        <CardDescription>Find clinics by name, location, or type</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Search Bar -->
        <div class="space-y-2">
          <Label for="search">Search Clinics</Label>
          <div class="relative">
            <Input 
              id="search" 
              v-model="searchQuery" 
              placeholder="Search by name, address, area, or region..." 
              class="pr-10"
            />
            <Icon icon="lucide:search" class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Region</Label>
            <div class="flex flex-wrap gap-2 mt-2">
              <Button 
                v-for="region in regions" 
                :key="region ?? 'unknown'"
                :variant="selectedRegion === region ? 'default' : 'outline'" 
                size="sm"
                @click="selectedRegion = region ?? 'All'"
              >
                {{ region }}
              </Button>
            </div>
          </div>
          <div>
            <Label>Clinic Type</Label>
            <div class="flex flex-wrap gap-2 mt-2">
              <Button 
                v-for="type in clinicTypes" 
                :key="type ?? 'unknown'"
                :variant="selectedType === type ? 'default' : 'outline'" 
                size="sm"
                @click="selectedType = type ?? 'All'"
              >
                {{ type }}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Error Message -->
    <Card v-if="error" class="border-destructive">
      <CardContent>
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

    <!-- Clinics Grid -->
    <div v-else-if="filteredClinics.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card 
        v-for="clinic in filteredClinics" 
        :key="clinic.id"
        class="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
        @click="navigateToClinic(clinic.id)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg mb-2">{{ clinic.name }}</CardTitle>
              <CardDescription>
                <div class="flex items-center gap-2">
                  <Icon icon="lucide:map-pin" class="h-3 w-3" />
                  <span class="text-sm">{{ clinic.region }} • {{ clinic.area }}</span>
                </div>
              </CardDescription>
            </div>
            <Badge variant="secondary" class="ml-2">
              {{ clinic.clinic_type }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon icon="lucide:map" class="h-4 w-4 flex-shrink-0" />
            <span>{{ clinic.address_line }}</span>
          </div>
        </CardContent>
        <CardFooter class="border-t pt-4">
          <div class="flex items-center justify-between w-full text-sm">
            <div class="flex items-center gap-2 text-muted-foreground">
              <Icon icon="lucide:clock" class="h-4 w-4" />
              <span v-if="clinic.open_time && clinic.close_time">
                {{ clinic.open_time }} - {{ clinic.close_time }}
              </span>
              <span v-else>Hours not set</span>
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
          <Icon icon="lucide:building-2" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No clinics found</h3>
          <p class="text-muted-foreground mb-4">
            {{ searchQuery || selectedRegion !== 'All' || selectedType !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by adding your first clinic' }}
          </p>
          <Button @click="navigateToCreateClinic" v-if="!searchQuery && selectedRegion === 'All' && selectedType === 'All'">
            <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
            Add New Clinic
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>