<script setup lang="ts">
import { ref } from 'vue'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@iconify/vue"
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { toast } from 'vue-sonner'

type UserRole = 'patient' | 'staff' | 'admin'

const selectedRole = ref<UserRole>('patient')
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const router = useRouter()
const { login, isLoading, error, currentUser } = useAuth()

const roles = [
  {
    id: 'patient' as UserRole,
    name: 'Patient',
    icon: 'material-symbols-light:inpatient-outline-rounded',
  },
  {
    id: 'staff' as UserRole,
    name: 'Staff',
    icon: 'material-symbols-light:id-card-outline-rounded',
  },
  {
    id: 'admin' as UserRole,
    name: 'Admin',
    icon: 'material-symbols-light:admin-panel-settings-outline-rounded',
  }
]

const selectRole = (role: UserRole) => {
  selectedRole.value = role
}

const handleLogin = async () => {
  // Validate inputs
  if (!email.value || !password.value) {
    toast.error('Missing Information', {
      description: 'Please enter both email and password'
    })
    return
  }

  // Attempt login
  const success = await login({
    email: email.value,
    password: password.value
  })

  if (!success) {
    // Show error message
    const errorMessage = error.value || 'Login failed. Please check your credentials.'
    toast.error('Login Failed', {
      description: errorMessage
    })
    return
  }

  if (!currentUser.value) {
    toast.error('Login Error', {
      description: 'Unable to retrieve user information'
    })
    return
  }

  // Verify the user's role matches the selected role
  if (currentUser.value.userType !== selectedRole.value) {
    toast.error('Role Mismatch', {
      description: `Invalid credentials for ${selectedRole.value} role`
    })
    return
  }

  // Show success message
  toast.success('Login Successful', {
    description: `Welcome back, ${currentUser.value.profile?.full_name || 'User'}!`
  })

  // Small delay before redirecting to let user see the success message
  setTimeout(() => {
    // Redirect to appropriate dashboard based on user type
    switch (currentUser.value?.userType) {
      case 'patient':
        router.push('/patient/dashboard')
        break
      case 'staff':
        router.push('/staff/dashboard')
        break
      case 'admin':
        router.push('/admin/dashboard')
        break
      default:
        router.push('/')
    }
  }, 800)
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2">
      <p class="text-sm text-muted-foreground">
        Select your role below and enter your email and password to login.
      </p>
    </div>
    <!-- Role Selection -->
    <div class="grid gap-3">
      <Label>Please select your role</Label>
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="role in roles"
          :key="role.id"
          @click="selectRole(role.id)"
          :class="[
            'relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-200 hover:bg-accent/40 hover:shadow-sm',
            selectedRole === role.id 
              ? 'border-primary bg-accent/40 shadow-sm' 
              : 'border-border hover:border-primary/50'
          ]"
        >
          <div class="flex flex-col items-center gap-2">
            <Icon :icon="role.icon" width="48" height="48" class="stroke-1" />
            <div 
              :class="[
                'font-medium text-sm transition-colors',
                selectedRole === role.id ? 'text-primary' : 'text-foreground'
              ]"
            >
              {{ role.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Form -->
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
        />
      </div>
      <div class="grid gap-2">
        <div class="flex items-center">
          <Label for="password">Password</Label>
          <RouterLink
            to="/forgot-password"
            class="ml-auto inline-block text-sm underline"
          >
            Forgot your password?
          </RouterLink>
        </div>
        <div class="relative">
          <Input 
            id="password" 
            v-model="password"
            :type="showPassword ? 'text' : 'password'" 
            required
            :disabled="isLoading"
            class="pr-10"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            :disabled="isLoading"
          >
            <Icon 
              :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'" 
              width="20" 
              height="20"
            />
          </button>
        </div>
      </div>
      <Button type="submit" class="w-full" @click="handleLogin" :disabled="isLoading">
        <Icon v-if="isLoading" icon="svg-spinners:180-ring" class="mr-2" />
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </Button>
    </div>

    <!-- Sign Up Links -->
    <div class="mt-4 text-center text-sm" v-if="selectedRole === 'patient'">
      Don't have an account?
      <RouterLink to="/register" class="underline">
        Sign up here
      </RouterLink>
    </div>
    <div class="mt-4 text-center text-sm" v-if="selectedRole === 'staff' || selectedRole === 'admin'">
      Sign up as a staff or admin? 
      <RouterLink to="/contact" class="underline">Contact us</RouterLink>
    </div>
  </div>
</template>
