import { apiClient } from '@/lib/api'

/**
 * Staff Users API Service
 * Handles all HTTP requests to the Staff Users backend endpoints
 * All endpoints use /api/staff/users
 */

export interface UserResponse {
  user_id: string
  full_name: string | null
  email: string
  date_of_birth: string | null
  role: string
  patient?: {
    id: number
    nric: string
    phone: string | null
  } | null
  staff?: {
    id: number
    clinic_id: number
    staff_role: string | null
  } | null
  admin?: {
    id: number
  } | null
}

export const staffUsersApi = {
  /**
   * Get all users (profiles)
   * GET /api/staff/users
   * 
   * Staff-facing endpoint to list all users in the system
   * Used for appointment management and user lookup
   */
  async getAllUsers(): Promise<UserResponse[]> {
    return apiClient.get('/api/staff/users')
  },

  /**
   * Get user by ID
   * GET /api/staff/users/{id}
   * 
   * Staff-facing endpoint to get detailed user information
   * 
   * @param id User ID (profile ID)
   * @return User details if found
   */
  async getUserById(id: number): Promise<UserResponse> {
    return apiClient.get(`/api/staff/users/${id}`)
  }
}

