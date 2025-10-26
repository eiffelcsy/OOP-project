/*
useAuth.ts composable for authentication

Responsible for:
- Logging in and registering new users
- Maintaining session data
- Handling user roles and permissions
- Password reset and recovery

Composable is used to store the authentication state and provide methods for login, register, and logout.


Models:
- AuthUser - Represents the user object with all necessary details
- RegisterData - Represents the data required for user registration

Composable:
- login - Logs in a user with email and password
- register - Registers a new user with email and password
- logout - Logs out the user
- resetPassword - Sends password reset email to user
- updatePassword - Updates the user's password (used after reset)
- refreshUser - Refreshes the user session (when user information is updated)
- initializeAuth - Initializes the auth state
- getAccessToken - Gets the access token for the user

*/

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/api'
import type { Session } from '@supabase/supabase-js'
import type {
  Tables,
} from '@/types/supabase'

export interface AuthUser {
  id: string
  email: string
  userType: string
  profile?: Tables<"profiles">
  patient?: Tables<"patients">
  staff?: Tables<"staff">
  admin?: Tables<"admins">
}

export interface RegisterData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  userType: string
}

// Create a factory that constructs the auth state and methods
const createAuth = () => {
  const currentUser = ref<AuthUser | null>(null)
  const session = ref<Session | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!currentUser.value)
  const isPatient = computed(() => currentUser.value?.userType === 'patient')
  const isStaff = computed(() => currentUser.value?.userType === 'staff')
  const isAdmin = computed(() => currentUser.value?.userType === 'admin')

  // Fetch user profile and determine user type
  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    console.log('[FetchUserProfile] Fetching user profile for user ID:', userId)
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) throw profileError

      // Determine user type by checking which table has the user
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (patient) {
        return {
          id: userId,
          email: profile.email || '',
          userType: 'patient',
          profile,
          patient
        }
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (staff) {
        return {
          id: userId,
          email: profile.email || '',
          userType: 'staff',
          profile,
          staff
        }
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (admin) {
        return {
          id: userId,
          email: profile.email || '',
          userType: 'admin',
          profile,
          admin
        }
      }

      return null
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (signInError) throw signInError

      session.value = data.session
      currentUser.value = await fetchUserProfile(data.user.id)

      return true
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            user_type: data.userType
          }
        }
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Registration failed')

      return true
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      // Clear the API client's token cache
      apiClient.clearTokenCache()

      currentUser.value = null
      session.value = null
      error.value = null
    } catch (err: any) {
      error.value = err.message || 'Logout failed'
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetError) throw resetError

      return true
    } catch (err: any) {
      error.value = err.message || 'Password reset failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      return true
    } catch (err: any) {
      error.value = err.message || 'Password update failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      isLoading.value = true
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log('[RefreshUser] Refreshing user...')
      console.log('[RefreshUser] Current session:', currentSession)

      if (currentSession?.user) {
        session.value = currentSession
        console.log('[RefreshUser] Session refreshed successfully. Fetching user profile...')
        currentUser.value = await fetchUserProfile(currentSession.user.id)
        console.log('[RefreshUser] User profile fetched successfully. Current user:', currentUser.value)
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to refresh user'
      currentUser.value = null
    } finally {
      isLoading.value = false
    }
  }

  const initializeAuth = async (): Promise<void> => {
    await refreshUser()

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      session.value = newSession

      if (newSession?.user) {
        currentUser.value = await fetchUserProfile(newSession.user.id)
      } else {
        currentUser.value = null
      }
    })
  }

  // Get access token for backend API calls
  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  return {
    currentUser,
    session,
    isLoading,
    error,
    isAuthenticated,
    isPatient,
    isStaff,
    isAdmin,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    refreshUser,
    initializeAuth,
    getAccessToken
  }
}

// Singleton instance so every import of useAuth() shares the same state
let authInstance: ReturnType<typeof createAuth> | null = null

export const useAuth = () => {
  if (!authInstance) authInstance = createAuth()
  return authInstance
}