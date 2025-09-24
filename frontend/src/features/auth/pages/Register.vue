<script setup lang="ts">
import { ref } from 'vue'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')

const router = useRouter()

const handleRegister = () => {
  // Basic validation
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }

  /* 
    TODO: Implement registration logic
    - Validate form data
    - Send registration request to backend
    - Handle success/error responses
  */
  console.log('Register attempt:', {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    phoneNumber: phoneNumber.value,
    password: password.value,
    confirmPassword: confirmPassword.value
  })

  // For now, redirect to login after registration
  router.push('/login')
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Register Form -->
    <div class="grid gap-4">
      <!-- Name Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="firstName">First Name</Label>
          <Input
            id="firstName"
            v-model="firstName"
            type="text"
            placeholder="John"
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
          required 
        />
      </div>
      <div class="grid gap-2">
        <Label for="confirmPassword">Confirm Password</Label>
        <Input 
          id="confirmPassword" 
          v-model="confirmPassword"
          type="password" 
          required 
        />
      </div>

      <!-- Register Button -->
      <Button type="submit" class="w-full" @click="handleRegister">
        Create Account
      </Button>
    </div>

    <!-- Login Link -->
    <div class="mt-4 text-center text-sm">
      Already have an account?
      <RouterLink to="/login" class="underline">
        Login here
      </RouterLink>
    </div>
  </div>
</template>
