import { ref } from 'vue'
import { apiClient } from '@/lib/api'
import { useRouter } from 'vue-router'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

// Use the generated Supabase types
export type Profile = Tables<'profiles'>
export type Patient = Tables<'patients'>
export type Staff = Tables<'staff'>
export type Admin = Tables<'admins'>

export type ProfileInsert = TablesInsert<'profiles'>
export type PatientInsert = TablesInsert<'patients'>
export type StaffInsert = TablesInsert<'staff'>
export type AdminInsert = TablesInsert<'admins'>

// Combined user type with role-specific data (matches backend UserResponse)
// Uses snake_case to match backend Jackson configuration
export interface User {
  profile_id: number
  user_id: string
  role: 'patient' | 'staff' | 'admin'
  email: string
  full_name: string
  avatar_url?: string | null
  patient?: {
    id: number
    nric?: string | null
    dob?: string | null
    phone?: string | null
    address?: string | null
  } | null
  staff?: {
    id: number
    clinic_id?: number | null
    clinic_name?: string | null
    role?: string | null
  } | null
  admin?: {
    id: number
  } | null
  created_at?: string | null
  updated_at?: string | null
}

// Create user request (combines profile + role-specific data)
// Uses snake_case to match backend Jackson configuration
export interface CreateUserRequest {
  // Profile data
  email: string
  full_name: string
  avatar_url?: string | null
  
  // Role
  role: 'patient' | 'staff' | 'admin'
  
  // Patient-specific data
  nric?: string | null
  phone?: string | null
  dob?: string | null
  address?: string | null
  
  // Staff-specific data
  clinic_id?: number | null
  staff_role?: string | null
  
  // Password for new account
  password: string
}

// Update user request
// Uses snake_case to match backend Jackson configuration
export interface UpdateUserRequest {
  // Profile data
  full_name?: string
  avatar_url?: string | null
  
  // Patient-specific data
  nric?: string | null
  phone?: string | null
  dob?: string | null
  address?: string | null
  
  // Staff-specific data
  clinic_id?: number | null
  staff_role?: string | null
}

export function useUsers() {
  const router = useRouter()
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all users from Spring Boot backend
  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      const data = await apiClient.get('/api/admin/users')
      users.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch single user by ID from Spring Boot backend
  const fetchUserById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      const data = await apiClient.get(`/api/admin/users/${id}`)
      return data as User
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user'
      console.error('Error fetching user:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Create new user via Spring Boot backend
  const createUser = async (userData: CreateUserRequest) => {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      const data = await apiClient.post('/api/admin/users', userData)
      
      // Refresh users list
      await fetchUsers()
      
      return data as User
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create user'
      console.error('Error creating user:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Update user via Spring Boot backend
  const updateUser = async (id: number, userData: UpdateUserRequest) => {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      const data = await apiClient.put(`/api/admin/users/${id}`, userData)
      
      // Refresh users list
      await fetchUsers()
      
      return data as User
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user'
      console.error('Error updating user:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Delete user via Spring Boot backend
  const deleteUser = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      await apiClient.delete(`/api/admin/users/${id}`)
      
      // Refresh users list
      await fetchUsers()
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user'
      console.error('Error deleting user:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Navigate to user details
  const navigateToUser = (id: number) => {
    router.push({ name: 'AdminUserDetails', params: { id } })
  }

  // Navigate to create user
  const navigateToCreateUser = () => {
    router.push({ name: 'AdminCreateUser' })
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    navigateToUser,
    navigateToCreateUser
  }
}

