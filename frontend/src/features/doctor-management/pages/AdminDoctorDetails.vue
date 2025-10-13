<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDoctors, type DoctorResponse } from '../composables/useDoctors'
import { useSchedules, type ScheduleResponse, type CreateScheduleRequest, type UpdateScheduleRequest } from '../composables/useSchedules'
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

const route = useRoute()
const router = useRouter()
const { fetchDoctorById, updateDoctor, deleteDoctor, loading, error } = useDoctors()
const { 
  schedules, 
  loading: schedulesLoading, 
  error: schedulesError,
  fetchSchedulesByDoctorId,
  createSchedule,
  updateSchedule: updateScheduleApi,
  deleteSchedule: deleteScheduleApi
} = useSchedules()

const doctor = ref<DoctorResponse | null>(null)
const isEditing = ref(false)
const showDeleteDialog = ref(false)
const successMessage = ref('')
const showMetadata = ref(false)

// Schedule management state
const selectedDayFilter = ref<number | null>(null)
const validityFilter = ref<'all' | 'valid' | 'expired'>('all')
const showScheduleDialog = ref(false)
const showDeleteScheduleDialog = ref(false)
const scheduleToDelete = ref<ScheduleResponse | null>(null)
const isEditingSchedule = ref(false)
const editingScheduleId = ref<number | null>(null)

const editFormData = reactive<Partial<DoctorResponse>>({})

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

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
]

// Schedule form data
const scheduleFormData = reactive<Partial<CreateScheduleRequest>>({
  dayOfWeek: 1,
  startTime: '09:00:00',
  endTime: '17:00:00',
  slotDurationMinutes: 30,
  validFrom: null,
  validTo: null
})

const doctorId = computed(() => parseInt(route.params.id as string))

// Filter schedules based on day and validity
const filteredSchedules = computed(() => {
  let filtered = schedules.value

  // Filter by day of week
  if (selectedDayFilter.value !== null) {
    filtered = filtered.filter(s => s.dayOfWeek === selectedDayFilter.value)
  }

  // Filter by validity
  if (validityFilter.value !== 'all') {
    const today = new Date().toISOString().split('T')[0]
    filtered = filtered.filter(s => {
      const isValid = (!s.validTo || s.validTo >= today) && (!s.validFrom || s.validFrom <= today)
      return validityFilter.value === 'valid' ? isValid : !isValid
    })
  }

  return filtered
})

// Group schedules by day of week
const schedulesByDay = computed(() => {
  const grouped: Record<number, ScheduleResponse[]> = {}
  filteredSchedules.value.forEach(schedule => {
    if (!grouped[schedule.dayOfWeek]) {
      grouped[schedule.dayOfWeek] = []
    }
    grouped[schedule.dayOfWeek].push(schedule)
  })
  return grouped
})

const getDayLabel = (dayNum: number) => {
  return daysOfWeek.find(d => d.value === dayNum)?.label || 'Unknown'
}

const formatTime = (time: string) => {
  return time.substring(0, 5) // HH:MM
}

const isScheduleValid = (schedule: ScheduleResponse) => {
  const today = new Date().toISOString().split('T')[0]
  return (!schedule.validTo || schedule.validTo >= today) && 
         (!schedule.validFrom || schedule.validFrom <= today)
}

const loadDoctor = async () => {
  const data = await fetchDoctorById(doctorId.value)
  if (data) {
    doctor.value = data
    Object.assign(editFormData, data)
    // Load schedules from API
    await loadSchedules()
  } else {
    router.push({ name: 'AdminDoctorsByClinic' })
  }
}

// Load schedules from API
const loadSchedules = async () => {
  await fetchSchedulesByDoctorId(doctorId.value)
}

// Schedule dialog handlers
const handleAddSchedule = () => {
  isEditingSchedule.value = false
  editingScheduleId.value = null
  Object.assign(scheduleFormData, {
    dayOfWeek: 1,
    startTime: '09:00:00',
    endTime: '17:00:00',
    slotDurationMinutes: 30,
    validFrom: null,
    validTo: null
  })
  showScheduleDialog.value = true
}

const handleEditSchedule = (schedule: ScheduleResponse) => {
  isEditingSchedule.value = true
  editingScheduleId.value = schedule.id
  Object.assign(scheduleFormData, {
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    slotDurationMinutes: schedule.slotDurationMinutes,
    validFrom: schedule.validFrom,
    validTo: schedule.validTo
  })
  showScheduleDialog.value = true
}

const handleSaveSchedule = async () => {
  if (!doctorId.value) return

  const scheduleData = {
    doctorId: doctorId.value,
    dayOfWeek: scheduleFormData.dayOfWeek!,
    startTime: scheduleFormData.startTime!,
    endTime: scheduleFormData.endTime!,
    slotDurationMinutes: scheduleFormData.slotDurationMinutes!,
    validFrom: scheduleFormData.validFrom || null,
    validTo: scheduleFormData.validTo || null
  }

  let result
  if (isEditingSchedule.value && editingScheduleId.value) {
    result = await updateScheduleApi(editingScheduleId.value, scheduleData)
  } else {
    result = await createSchedule(scheduleData)
  }

  if (result) {
    showScheduleDialog.value = false
    successMessage.value = isEditingSchedule.value ? 'Schedule updated successfully!' : 'Schedule created successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
}

const handleDeleteScheduleClick = (schedule: ScheduleResponse) => {
  scheduleToDelete.value = schedule
  showDeleteScheduleDialog.value = true
}

const handleConfirmDeleteSchedule = async () => {
  if (!scheduleToDelete.value) return

  const success = await deleteScheduleApi(scheduleToDelete.value.id)
  if (success) {
    showDeleteScheduleDialog.value = false
    scheduleToDelete.value = null
    successMessage.value = 'Schedule deleted successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
}

const handleEdit = () => {
  if (doctor.value) {
    Object.keys(editFormData).forEach(key => {
      delete editFormData[key as keyof typeof editFormData]
    })
    Object.assign(editFormData, { ...doctor.value })
    
    // Check if current specialty is a custom one (not in predefined list)
    if (doctor.value.specialty && specialties.indexOf(doctor.value.specialty) === -1) {
      showCustomSpecialty.value = true
      customSpecialty.value = doctor.value.specialty
    } else {
      showCustomSpecialty.value = false
      customSpecialty.value = ''
    }
  }
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
  showCustomSpecialty.value = false
  customSpecialty.value = ''
  Object.assign(editFormData, doctor.value)
}

const handleSelectSpecialty = (specialty: string) => {
  editFormData.specialty = specialty
  showCustomSpecialty.value = false
  customSpecialty.value = ''
}

const handleSelectOther = () => {
  showCustomSpecialty.value = true
  editFormData.specialty = null
}

const handleCustomSpecialtyChange = (value: string) => {
  customSpecialty.value = value
  if (value.trim()) {
    editFormData.specialty = value.trim()
  } else {
    editFormData.specialty = null
  }
}

const handleSave = async () => {
  const result = await updateDoctor(doctorId.value, {
    name: editFormData.name,
    specialty: editFormData.specialty,
    active: editFormData.active,
    clinicId: editFormData.clinic_id
  })
  if (result) {
    doctor.value = result
    isEditing.value = false
    successMessage.value = 'Doctor updated successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
}

const handleDelete = async () => {
  const success = await deleteDoctor(doctorId.value)
  if (success) {
    router.push({ name: 'AdminDoctorsByClinic' })
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadDoctor()
})
</script>

<template>
  <div class="space-y-8 p-8">
    <!-- Loading State -->
    <div v-if="loading && !doctor" class="space-y-6">
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
    <div v-else-if="doctor">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="handleBack">
            <Icon icon="lucide:arrow-left" class="h-5 w-5" />
          </Button>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-bold tracking-tight">{{ doctor.name }}</h1>
              <Badge :variant="doctor.active ? 'default' : 'secondary'">
                {{ doctor.active ? 'Active' : 'Inactive' }}
              </Badge>
            </div>
            <p class="text-muted-foreground">{{ doctor.specialty || 'General Practice' }}</p>
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
        <!-- Doctor Information -->
        <Card>
          <CardHeader>
            <CardTitle>Doctor Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-muted-foreground">Doctor Name</Label>
                <p class="text-base font-medium">{{ doctor.name }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Specialty</Label>
                <p class="text-base font-medium">{{ doctor.specialty || 'Not specified' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Status</Label>
                <div class="flex items-center gap-2">
                  <Badge :variant="doctor.active ? 'default' : 'secondary'" class="mt-1">
                    {{ doctor.active ? 'Active' : 'Inactive' }}
                  </Badge>
                </div>
              </div>
              <div>
                <Label class="text-muted-foreground">Clinic ID</Label>
                <p class="text-base font-medium">{{ doctor.clinic_id }}</p>
              </div>
            </div>

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
                      {{ doctor.createdAt ? new Date(doctor.createdAt).toLocaleString() : 'Unknown' }}
                    </p>
                  </div>
                  <div>
                    <Label class="text-muted-foreground">Last Updated</Label>
                    <p class="text-base font-medium">
                      {{ doctor.updatedAt ? new Date(doctor.updatedAt).toLocaleString() : 'Unknown' }}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <!-- Doctor Schedules -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Doctor Schedules</CardTitle>
                <CardDescription>Weekly schedule and availability</CardDescription>
              </div>
              <Button @click="handleAddSchedule" size="sm">
                <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Filters -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Filter by Day</Label>
                <div class="flex flex-wrap gap-2 mt-2">
                  <Button 
                    :variant="selectedDayFilter === null ? 'default' : 'outline'" 
                    size="sm"
                    @click="selectedDayFilter = null"
                  >
                    All Days
                  </Button>
                  <Button 
                    v-for="day in daysOfWeek" 
                    :key="day.value"
                    :variant="selectedDayFilter === day.value ? 'default' : 'outline'" 
                    size="sm"
                    @click="selectedDayFilter = day.value"
                  >
                    {{ day.label }}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Filter by Validity</Label>
                <div class="flex flex-wrap gap-2 mt-2">
                  <Button 
                    :variant="validityFilter === 'all' ? 'default' : 'outline'" 
                    size="sm"
                    @click="validityFilter = 'all'"
                  >
                    All
                  </Button>
                  <Button 
                    :variant="validityFilter === 'valid' ? 'default' : 'outline'" 
                    size="sm"
                    @click="validityFilter = 'valid'"
                  >
                    <Icon icon="lucide:check-circle" class="mr-1 h-3 w-3" />
                    Valid
                  </Button>
                  <Button 
                    :variant="validityFilter === 'expired' ? 'default' : 'outline'" 
                    size="sm"
                    @click="validityFilter = 'expired'"
                  >
                    <Icon icon="lucide:x-circle" class="mr-1 h-3 w-3" />
                    Expired
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <!-- Loading State -->
            <div v-if="schedulesLoading" class="space-y-4">
              <Skeleton v-for="i in 3" :key="i" class="h-24 w-full" />
            </div>

            <!-- Schedules List -->
            <div v-else-if="filteredSchedules.length > 0" class="space-y-4">
              <div v-for="(daySchedules, day) in schedulesByDay" :key="day">
                <div class="mb-3">
                  <h4 class="font-semibold text-sm flex items-center gap-2">
                    <Icon icon="lucide:calendar" class="h-4 w-4" />
                    {{ getDayLabel(Number(day)) }}
                  </h4>
                </div>
                <div class="space-y-2 ml-6">
                  <div 
                    v-for="schedule in daySchedules" 
                    :key="schedule.id"
                    class="p-4 border rounded-lg hover:border-primary/50 transition-colors group"
                    :class="{ 'bg-muted/50': !isScheduleValid(schedule) }"
                  >
                    <div class="flex items-start justify-between">
                      <div class="space-y-2 flex-1">
                        <div class="flex items-center gap-3">
                          <div class="flex items-center gap-2">
                            <Icon icon="lucide:clock" class="h-4 w-4 text-muted-foreground" />
                            <span class="font-medium">
                              {{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}
                            </span>
                          </div>
                          <div class="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon icon="lucide:timer" class="h-3 w-3" />
                            <span>{{ schedule.slotDurationMinutes }} min slots</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-4 text-sm text-muted-foreground">
                          <div v-if="schedule.validFrom" class="flex items-center gap-1">
                            <Icon icon="lucide:calendar-check" class="h-3 w-3" />
                            <span>From: {{ schedule.validFrom }}</span>
                          </div>
                          <div v-if="schedule.validTo" class="flex items-center gap-1">
                            <Icon icon="lucide:calendar-x" class="h-3 w-3" />
                            <span>To: {{ schedule.validTo }}</span>
                          </div>
                          <div v-if="!schedule.validTo" class="flex items-center gap-1">
                            <Icon icon="lucide:infinity" class="h-3 w-3" />
                            <span>Ongoing</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Badge :variant="isScheduleValid(schedule) ? 'default' : 'secondary'">
                          {{ isScheduleValid(schedule) ? 'Valid' : 'Expired' }}
                        </Badge>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            class="h-8 w-8"
                            @click="handleEditSchedule(schedule)"
                          >
                            <Icon icon="lucide:edit" class="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            class="h-8 w-8 text-destructive hover:text-destructive"
                            @click="handleDeleteScheduleClick(schedule)"
                          >
                            <Icon icon="lucide:trash-2" class="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8">
              <Icon icon="lucide:calendar-x" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 class="text-lg font-semibold mb-2">No schedules found</h3>
              <p class="text-muted-foreground">
                {{ selectedDayFilter !== null || validityFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No schedules have been set up for this doctor yet' }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Edit Mode -->
      <form v-else @submit.prevent="handleSave" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Doctor Information</CardTitle>
            <CardDescription>Update doctor details</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2 md:col-span-2">
                <Label for="edit-name">Doctor Name</Label>
                <Input id="edit-name" v-model="editFormData.name" required />
              </div>

              <div class="space-y-2">
                <Label>Specialty</Label>
                <div class="flex flex-wrap gap-2">
                  <Button 
                    v-for="specialty in specialties" 
                    :key="specialty"
                    type="button"
                    :variant="editFormData.specialty === specialty && !showCustomSpecialty ? 'default' : 'outline'" 
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
                </div>
                
                <!-- Custom Specialty Input -->
                <div v-if="showCustomSpecialty" class="pt-2">
                  <Label for="edit-custom-specialty">Custom Specialty</Label>
                  <Input 
                    id="edit-custom-specialty" 
                    :model-value="customSpecialty"
                    @update:model-value="handleCustomSpecialtyChange"
                    placeholder="Enter custom specialty..."
                    class="mt-1"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label>Status</Label>
                <div class="flex gap-2">
                  <Button 
                    type="button"
                    :variant="editFormData.active ? 'default' : 'outline'" 
                    size="sm"
                    @click="editFormData.active = true"
                  >
                    <Icon icon="lucide:check-circle" class="mr-2 h-4 w-4" />
                    Active
                  </Button>
                  <Button 
                    type="button"
                    :variant="!editFormData.active ? 'default' : 'outline'" 
                    size="sm"
                    @click="editFormData.active = false"
                  >
                    <Icon icon="lucide:x-circle" class="mr-2 h-4 w-4" />
                    Inactive
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

    <!-- Delete Doctor Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Doctor</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ doctor?.name }}"? This action cannot be undone.
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

    <!-- Schedule Dialog (Add/Edit) -->
    <Dialog v-model:open="showScheduleDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ isEditingSchedule ? 'Edit Schedule' : 'Add New Schedule' }}</DialogTitle>
          <DialogDescription>
            {{ isEditingSchedule ? 'Update the schedule details below' : 'Create a new schedule for this doctor' }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleSaveSchedule" class="space-y-4">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2 col-span-2">
              <Label>Day of Week</Label>
              <div class="flex flex-wrap gap-2">
                <Button 
                  v-for="day in daysOfWeek" 
                  :key="day.value"
                  type="button"
                  :variant="scheduleFormData.dayOfWeek === day.value ? 'default' : 'outline'" 
                  size="sm"
                  @click="scheduleFormData.dayOfWeek = day.value"
                >
                  {{ day.label }}
                </Button>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="schedule-start-time">Start Time</Label>
              <Input 
                id="schedule-start-time" 
                v-model="scheduleFormData.startTime" 
                type="time"
                step="60"
                required 
              />
            </div>

            <div class="space-y-2">
              <Label for="schedule-end-time">End Time</Label>
              <Input 
                id="schedule-end-time" 
                v-model="scheduleFormData.endTime" 
                type="time"
                step="60"
                required 
              />
            </div>

            <div class="space-y-2 col-span-2">
              <Label for="schedule-slot-duration">Slot Duration (minutes)</Label>
              <div class="flex flex-wrap gap-2">
                <Button 
                  v-for="duration in [15, 20, 30, 45, 60]" 
                  :key="duration"
                  type="button"
                  :variant="scheduleFormData.slotDurationMinutes === duration ? 'default' : 'outline'" 
                  size="sm"
                  @click="scheduleFormData.slotDurationMinutes = duration"
                >
                  {{ duration }} min
                </Button>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="schedule-valid-from">Valid From (Optional)</Label>
              <Input 
                id="schedule-valid-from" 
                v-model="scheduleFormData.validFrom" 
                type="date"
              />
            </div>

            <div class="space-y-2">
              <Label for="schedule-valid-to">Valid To (Optional)</Label>
              <Input 
                id="schedule-valid-to" 
                v-model="scheduleFormData.validTo" 
                type="date"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showScheduleDialog = false" :disabled="schedulesLoading">
              Cancel
            </Button>
            <Button type="submit" :disabled="schedulesLoading">
              <Icon v-if="schedulesLoading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              <Icon v-else icon="lucide:save" class="mr-2 h-4 w-4" />
              {{ schedulesLoading ? 'Saving...' : (isEditingSchedule ? 'Update Schedule' : 'Create Schedule') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Schedule Confirmation Dialog -->
    <Dialog v-model:open="showDeleteScheduleDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Schedule</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this schedule? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteScheduleDialog = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="handleConfirmDeleteSchedule" :disabled="schedulesLoading">
            <Icon v-if="schedulesLoading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ schedulesLoading ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

