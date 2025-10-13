import { ref } from 'vue'
import { 
  schedulesApi, 
  type ScheduleResponse, 
  type CreateScheduleRequest, 
  type UpdateScheduleRequest 
} from '@/services/schedulesApi'

/**
 * Schedules Composable
 * Handles state management for schedule-related operations
 */

export function useSchedules() {
  const schedules = ref<ScheduleResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all schedules for a specific doctor
   */
  const fetchSchedulesByDoctorId = async (doctorId: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await schedulesApi.getSchedulesByDoctorId(doctorId)
      schedules.value = data || []
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch schedules'
      console.error('Error fetching schedules:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new schedule
   */
  const createSchedule = async (scheduleData: CreateScheduleRequest) => {
    loading.value = true
    error.value = null
    try {
      const data = await schedulesApi.createSchedule(scheduleData)
      
      // Add to local schedules array
      schedules.value.push(data)
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create schedule'
      console.error('Error creating schedule:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing schedule
   */
  const updateSchedule = async (id: number, scheduleData: UpdateScheduleRequest) => {
    loading.value = true
    error.value = null
    try {
      const data = await schedulesApi.updateSchedule(id, scheduleData)
      
      // Update in local schedules array
      const index = schedules.value.findIndex(s => s.id === id)
      if (index !== -1) {
        schedules.value[index] = data
      }
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update schedule'
      console.error('Error updating schedule:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a schedule
   */
  const deleteSchedule = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await schedulesApi.deleteSchedule(id)
      
      // Remove from local schedules array
      schedules.value = schedules.value.filter(s => s.id !== id)
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete schedule'
      console.error('Error deleting schedule:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    schedules,
    loading,
    error,
    
    // API operations
    fetchSchedulesByDoctorId,
    createSchedule,
    updateSchedule,
    deleteSchedule
  }
}

// Re-export types for convenience
export type { 
  ScheduleResponse, 
  CreateScheduleRequest, 
  UpdateScheduleRequest 
} from '@/services/schedulesApi'

