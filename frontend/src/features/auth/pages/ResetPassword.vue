<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@iconify/vue"
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'

const newPassword = ref('')
const confirmPassword = ref('')
const isPasswordReset = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isValidSession = ref<boolean | null>(null) // null = checking, true = valid, false = invalid
const isResetting = ref(false) // Local loading state for the reset button

const router = useRouter()
const { updatePassword, session } = useAuth()

onMounted(async () => {
  try {
    // Check if there's a recovery token in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    
    // If we have a recovery token, give Supabase time to process it
    if (accessToken && type === 'recovery') {
      // Wait for Supabase to process the token
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verify session was created
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        isValidSession.value = true
      } else {
        isValidSession.value = false
        toast.error('Invalid Session', {
          description: 'Your password reset link has expired or is invalid'
        })
      }
    } else {
      // No recovery token in URL, check if we already have a session
      if (session.value) {
        isValidSession.value = true
      } else {
        isValidSession.value = false
        toast.error('Invalid Link', {
          description: 'No password reset token found in the URL'
        })
      }
    }
  } catch (error) {
    isValidSession.value = false
    toast.error('Error', {
      description: 'Failed to verify password reset link'
    })
  }
})

const handleResetPassword = async () => {
  // Validate inputs
  if (!newPassword.value || !confirmPassword.value) {
    toast.error('Missing Information', {
      description: 'Please fill in all fields'
    })
    return
  }

  // Check if passwords match
  if (newPassword.value !== confirmPassword.value) {
    toast.error('Passwords Don\'t Match', {
      description: 'Please make sure both passwords are the same'
    })
    return
  }

  try {
    isResetting.value = true
    
    // Attempt to update password
    const success = await updatePassword(newPassword.value)

    if (success) {
      isPasswordReset.value = true
      toast.success('Password Reset Successful', {
        description: 'Your password has been updated successfully'
      })
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      toast.error('Reset Failed', {
        description: 'Unable to reset password. Please try again.'
      })
    }
  } finally {
    // Only reset loading state if password reset was not successful
    if (!isPasswordReset.value) {
      isResetting.value = false
    }
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Loading State -->
    <div v-if="isValidSession === null" class="grid gap-6">
      <div class="flex flex-col items-center justify-center gap-4 py-8">
        <Icon icon="svg-spinners:180-ring" width="48" height="48" />
        <p class="text-sm text-muted-foreground">Verifying reset link...</p>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="isPasswordReset" class="grid gap-6">
      <div class="flex flex-col items-center justify-center gap-4 text-center">
        <div class="rounded-full bg-green-100 p-4">
          <Icon 
            icon="material-symbols-light:check-circle-outline-rounded" 
            width="64" 
            height="64" 
            class="text-green-600"
          />
        </div>
        <div class="grid gap-2">
          <h2 class="text-xl font-semibold">Password Reset Complete</h2>
          <p class="text-sm text-muted-foreground">
            Your password has been successfully updated.
          </p>
          <p class="text-sm text-muted-foreground">
            Redirecting to login page...
          </p>
        </div>
      </div>

      <Button 
        variant="default" 
        class="w-full" 
        @click="goToLogin"
      >
        <Icon icon="material-symbols-light:login-rounded" class="mr-2" width="20" height="20" />
        Go to Login
      </Button>
    </div>

    <!-- Invalid Session State -->
    <div v-else-if="isValidSession === false" class="grid gap-6">
      <div class="flex flex-col items-center justify-center gap-4 text-center">
        <div class="rounded-full bg-red-100 p-4">
          <Icon 
            icon="material-symbols-light:error-outline-rounded" 
            width="64" 
            height="64" 
            class="text-red-600"
          />
        </div>
        <div class="grid gap-2">
          <h2 class="text-xl font-semibold">Invalid or Expired Link</h2>
          <p class="text-sm text-muted-foreground">
            This password reset link has expired or is invalid.
          </p>
          <p class="text-sm text-muted-foreground">
            Please request a new password reset link.
          </p>
        </div>
      </div>

      <Button 
        variant="default" 
        class="w-full" 
        @click="() => router.push('/forgot-password')"
      >
        Request New Link
      </Button>
    </div>

    <!-- Reset Form State -->
    <div v-else class="grid gap-6">
      <div class="grid gap-2">
        <p class="text-sm text-muted-foreground">
          Enter your new password below to reset your password.
        </p>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="new-password">New Password</Label>
          <div class="relative">
            <Input
              id="new-password"
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter new password"
              required
              :disabled="isResetting"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              :disabled="isResetting"
            >
              <Icon 
                :icon="showPassword ? 'material-symbols-light:visibility-off-outline-rounded' : 'material-symbols-light:visibility-outline-rounded'" 
                width="20" 
                height="20" 
              />
            </button>
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="confirm-password">Confirm Password</Label>
          <div class="relative">
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm new password"
              required
              :disabled="isResetting"
              @keyup.enter="handleResetPassword"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              :disabled="isResetting"
            >
              <Icon 
                :icon="showConfirmPassword ? 'material-symbols-light:visibility-off-outline-rounded' : 'material-symbols-light:visibility-outline-rounded'" 
                width="20" 
                height="20" 
              />
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          class="w-full" 
          @click="handleResetPassword" 
          :disabled="isResetting"
        >
          <Icon v-if="isResetting" icon="svg-spinners:180-ring" class="mr-2" />
          {{ isResetting ? 'Resetting Password...' : 'Reset Password' }}
        </Button>
      </div>

      <div class="mt-2 text-center text-sm">
        <RouterLink to="/login" class="inline-flex items-center gap-1 underline">
          <Icon icon="material-symbols-light:arrow-back-rounded" width="16" height="16" />
          Back to Login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

