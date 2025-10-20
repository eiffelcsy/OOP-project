<script setup lang="ts">
import { ref } from 'vue'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@iconify/vue"
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { toast } from 'vue-sonner'

const email = ref('')
const isEmailSent = ref(false)

const router = useRouter()
const { resetPassword, isLoading } = useAuth()

const handleResetPassword = async () => {
  // Validate email
  if (!email.value) {
    toast.error('Missing Information', {
      description: 'Please enter your email address'
    })
    return
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    toast.error('Invalid Email', {
      description: 'Please enter a valid email address'
    })
    return
  }

  // Attempt to send reset email
  const success = await resetPassword(email.value)

  if (success) {
    isEmailSent.value = true
    toast.success('Email Sent', {
      description: 'Password reset instructions have been sent to your email'
    })
  } else {
    toast.error('Reset Failed', {
      description: 'Unable to send reset email. Please try again.'
    })
  }
}

const goBackToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Success State -->
    <div v-if="isEmailSent" class="grid gap-6">
      <div class="flex flex-col items-start gap-4">
        <div class="rounded-full bg-green-100 p-4">
          <Icon 
            icon="material-symbols-light:mark-email-read-outline-rounded" 
            width="64" 
            height="64" 
            class="text-green-600"
          />
        </div>
        <div class="grid gap-2">
          <h2 class="text-xl font-semibold">Check Your Email</h2>
          <p class="text-sm text-muted-foreground">
            We've sent password reset instructions to <span class="font-medium text-foreground">{{ email }}</span>
          </p>
        </div>
      </div>

      <div class="grid gap-3 text-sm text-muted-foreground">
        <p>
          If you don't see the email in your inbox, please check your spam folder.
        </p>
        <p>
          The reset link will expire in 1 hour.
        </p>
      </div>

      <Button 
        variant="outline" 
        class="w-full" 
        @click="goBackToLogin"
      >
        <Icon icon="material-symbols-light:arrow-back-rounded" class="mr-2" width="20" height="20" />
        Back to Login
      </Button>
    </div>

    <!-- Reset Form State -->
    <div v-else class="grid gap-6">
      <div class="grid gap-2">
        <p class="text-sm text-muted-foreground">
          Enter your email address below and we'll send you instructions to reset your password.
        </p>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="m@example.com"
            required
            :disabled="isLoading"
            @keyup.enter="handleResetPassword"
          />
        </div>

        <Button 
          type="submit" 
          class="w-full" 
          @click="handleResetPassword" 
          :disabled="isLoading"
        >
          <Icon v-if="isLoading" icon="svg-spinners:180-ring" class="mr-2" />
          {{ isLoading ? 'Sending...' : 'Send Reset Instructions' }}
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

