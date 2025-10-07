import { ref, computed } from 'vue'
import type { 
  User, 
  Profile, 
  Patient, 
  Staff, 
  Admin, 
  UserType 
} from '@/types/database'

// Auth state interface
export interface AuthUser {
  id: string // UUID from auth.users
  email: string
  userType: UserType
  profile?: Profile
  patient?: Patient
  staff?: Staff
  admin?: Admin
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone: string
  userType: UserType
  // Additional fields based on user type
  nric?: string // for patients
  dateOfBirth?: string // for patients
  address?: string // for patients
  clinicId?: number // for staff
  role?: string // for staff
}

export const useAuth = () => {
  // Auth state
  const currentUser = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => !!currentUser.value)
  const isPatient = computed(() => currentUser.value?.userType === 'patient')
  const isStaff = computed(() => currentUser.value?.userType === 'staff')
  const isAdmin = computed(() => currentUser.value?.userType === 'admin')
  const isDoctor = computed(() => currentUser.value?.userType === 'doctor')

  // Auth actions
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      // TODO: Implement actual login API call
      // const response = await authAPI.login(credentials)
      
      // Mock login for development
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock user data
      currentUser.value = {
        id: 'mock-user-id',
        email: credentials.email,
        userType: 'patient', // This would come from the API
        profile: {
          id: 1,
          user_id: 'mock-user-id',
          full_name: 'John Doe',
          phone: '+65 9123 4567',
          avatar_url: null,
          metadata: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // TODO: Implement actual registration API call
      // const response = await authAPI.register(data)
      
      // Mock registration for development
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      // TODO: Implement actual logout API call
      // await authAPI.logout()
      
      // Clear user state
      currentUser.value = null
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
    } finally {
      isLoading.value = false
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      // TODO: Implement actual user refresh API call
      // const response = await authAPI.getCurrentUser()
      // currentUser.value = response.data
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh user'
      currentUser.value = null
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (profileData: Partial<Profile>): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      // TODO: Implement actual profile update API call
      // const response = await authAPI.updateProfile(profileData)
      
      // Mock update for development
      if (currentUser.value?.profile) {
        Object.assign(currentUser.value.profile, profileData)
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Profile update failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Initialize auth state (check for existing session)
  const initializeAuth = async (): Promise<void> => {
    try {
      // TODO: Check for existing session/token
      // await refreshUser()
    } catch (err) {
      console.error('Failed to initialize auth:', err)
    }
  }

  return {
    // State
    currentUser,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    isPatient,
    isStaff,
    isAdmin,
    isDoctor,
    
    // Actions
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    initializeAuth
  }
}
