<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')

const router = useRouter()
const { register, isLoading, error } = useAuth()

// Computed property for full name
const fullName = computed(() => `${firstName.value.trim()} ${lastName.value.trim()}`.trim())

// Form validation
const isFormValid = computed(() => {
  return email.value.trim() !== '' &&
         password.value.trim() !== '' &&
         confirmPassword.value.trim() !== '' &&
         firstName.value.trim() !== '' &&
         lastName.value.trim() !== '' &&
         phoneNumber.value.trim() !== '' &&
         password.value === confirmPassword.value
})

const handleRegister = async () => {
  // Reset any previous errors
  error.value = null

  // Basic validation
  if (!isFormValid.value) {
    error.value = 'Please fill in all fields correctly'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  // Prepare registration data for patient
  const registrationData = {
    fullName: fullName.value,
    email: email.value.trim(),
    password: password.value,
    confirmPassword: confirmPassword.value,
    phone: phoneNumber.value.trim(),
    userType: 'patient' // Fixed as patient registration only, staff and admin is manually registered through contact page
  }

  try {
    const success = await register(registrationData)
    
    if (success) {
      // Registration successful - redirect to login with success message
      router.push({
        path: '/login',
        query: { message: 'Registration successful! Please login with your credentials.' }
      })
    }
  } catch (err) {
    // Error is already handled by the useAuth composable
    console.error('Registration failed:', err)
  }
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Error Message -->
    <div v-if="error" class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ error }}
    </div>

    <!-- Register Form -->
    <form @submit.prevent="handleRegister" class="grid gap-4">
      <!-- Name Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="firstName">First Name</Label>
          <Input
            id="firstName"
            v-model="firstName"
            type="text"
            placeholder="John"
            :disabled="isLoading"
            required
          />
        </div>
        <div class="grid gap-2">
          <Label for="lastName">Last Name</Label>
          <Input
            id="lastName"
            v-model="lastName"
            type="text"
            placeholder="Doe"
            :disabled="isLoading"
            required
          />
        </div>
      </div>

      <!-- Email Field -->
      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="john.doe@example.com"
          :disabled="isLoading"
          required
        />
      </div>

      <!-- Phone Number Field -->
      <div class="grid gap-2">
        <Label for="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          v-model="phoneNumber"
          type="tel"
          placeholder="+65 9123 4567"
          :disabled="isLoading"
          required
        />
      </div>

      <!-- Password Fields -->
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input 
          id="password" 
          v-model="password"
          type="password"
          :disabled="isLoading"
          required 
        />
      </div>
      <div class="grid gap-2">
        <Label for="confirmPassword">Confirm Password</Label>
        <Input 
          id="confirmPassword" 
          v-model="confirmPassword"
          type="password"
          :disabled="isLoading"
          :class="{ 'border-red-500': password && confirmPassword && password !== confirmPassword }"
          required 
        />
        <p v-if="password && confirmPassword && password !== confirmPassword" 
           class="text-sm text-red-600">
          Passwords do not match
        </p>
      </div>

      <!-- Register Button -->
      <Button 
        type="submit" 
        class="w-full" 
        :disabled="isLoading || !isFormValid"
      >
        <span v-if="isLoading" class="flex items-center gap-2">
          <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating Account...
        </span>
        <span v-else>Create Patient Account</span>
      </Button>
    </form>

    <!-- Login Link -->
    <div class="mt-4 text-center text-sm">
      Already have an account?
      <RouterLink to="/login" class="underline">
        Login here
      </RouterLink>
    </div>
  </div>
</template>
