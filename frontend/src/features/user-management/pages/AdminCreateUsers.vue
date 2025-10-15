<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUsers, type CreateUserRequest } from '../composables/useUsers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/vue'

const router = useRouter()
const { createUser, loading, error } = useUsers()

const formData = reactive<CreateUserRequest>({
    email: '',
    full_name: '',
    avatar_url: null,
    role: 'patient',
    password: '',
    // Patient fields
    nric: '',
    phone: '',
    dob: '',
    address: '',
    // Staff fields
    clinic_id: undefined,
    staff_role: null
})

const confirmPassword = ref('')
const formErrors = ref<Record<string, string>>({})
const successMessage = ref(false)

const roles = ['patient', 'staff', 'admin'] as const
const staffRoles = ['receptionist', 'nurse', 'doctor', 'pharmacist']

// Show role-specific fields
const showPatientFields = computed(() => formData.role === 'patient')
const showStaffFields = computed(() => formData.role === 'staff')

const validateForm = () => {
    formErrors.value = {}

    // Common validations
    if (!formData.email?.trim()) {
        formErrors.value.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        formErrors.value.email = 'Invalid email format'
    }

    if (!formData.full_name?.trim()) {
        formErrors.value.full_name = 'Full name is required'
    }

    if (!formData.password) {
        formErrors.value.password = 'Password is required'
    } else if (formData.password.length < 8) {
        formErrors.value.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== confirmPassword.value) {
        formErrors.value.confirmPassword = 'Passwords do not match'
    }

    // Role-specific validations
    if (formData.role === 'staff') {
        if (!formData.clinic_id) {
            formErrors.value.clinic_id = 'Clinic is required for staff'
        }
    }

    return Object.keys(formErrors.value).length === 0
}

const handleSubmit = async () => {
    if (!validateForm()) {
        return
    }

    const result = await createUser(formData)

    if (result) {
        successMessage.value = true
        setTimeout(() => {
            router.push({ name: 'AdminUserDetails', params: { id: result.profile_id } })
        }, 1500)
    }
}

const handleCancel = () => {
    router.push({ name: 'AdminUsers' })
}

const getRoleDisplayName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
}
</script>

<template>
    <div class="space-y-8 p-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
                <h1 class="text-3xl font-bold tracking-tight">Create New User</h1>
                <p class="text-muted-foreground">Add a new user account to the system</p>
            </div>
            <Button variant="outline" @click="handleCancel">
                <Icon icon="lucide:x" class="mr-2 h-4 w-4" />
                Cancel
            </Button>
        </div>

        <!-- Success Message -->
        <Card v-if="successMessage" class="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent class="pt-6">
                <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Icon icon="lucide:check-circle" class="h-5 w-5" />
                    <p class="font-medium">User created successfully! Redirecting...</p>
                </div>
            </CardContent>
        </Card>

        <!-- Error Message -->
        <Card v-if="error" class="border-destructive">
            <CardContent class="pt-6">
                <div class="flex items-center gap-2 text-destructive">
                    <Icon icon="lucide:alert-circle" class="h-5 w-5" />
                    <p>{{ error }}</p>
                </div>
            </CardContent>
        </Card>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Account Information -->
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Basic account details and credentials</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Email -->
                        <div class="space-y-2 md:col-span-2">
                            <Label for="email">
                                Email Address <span class="text-destructive">*</span>
                            </Label>
                            <Input id="email" v-model="formData.email" type="email" placeholder="user@example.com"
                                :class="{ 'border-destructive': formErrors.email }" />
                            <p v-if="formErrors.email" class="text-sm text-destructive">{{ formErrors.email }}</p>
                        </div>

                        <!-- Full Name -->
                        <div class="space-y-2 md:col-span-2">
                            <Label for="full_name">
                                Full Name <span class="text-destructive">*</span>
                            </Label>
                            <Input id="full_name" v-model="formData.full_name" placeholder="John Doe"
                                :class="{ 'border-destructive': formErrors.full_name }" />
                            <p v-if="formErrors.full_name" class="text-sm text-destructive">{{ formErrors.full_name }}
                            </p>
                        </div>

                        <!-- Password -->
                        <div class="space-y-2">
                            <Label for="password">
                                Password <span class="text-destructive">*</span>
                            </Label>
                            <Input id="password" v-model="formData.password" type="password"
                                placeholder="Min. 8 characters"
                                :class="{ 'border-destructive': formErrors.password }" />
                            <p v-if="formErrors.password" class="text-sm text-destructive">{{ formErrors.password }}</p>
                        </div>

                        <!-- Confirm Password -->
                        <div class="space-y-2">
                            <Label for="confirm_password">
                                Confirm Password <span class="text-destructive">*</span>
                            </Label>
                            <Input id="confirm_password" v-model="confirmPassword" type="password"
                                placeholder="Re-enter password"
                                :class="{ 'border-destructive': formErrors.confirmPassword }" />
                            <p v-if="formErrors.confirmPassword" class="text-sm text-destructive">{{
                                formErrors.confirmPassword }}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- User Role -->
            <Card>
                <CardHeader>
                    <CardTitle>User Role</CardTitle>
                    <CardDescription>Select the user's role in the system</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-2">
                        <Label>
                            Role <span class="text-destructive">*</span>
                        </Label>
                        <div class="flex flex-wrap gap-2">
                            <Button v-for="role in roles" :key="role" type="button"
                                :variant="formData.role === role ? 'default' : 'outline'" size="sm"
                                @click="formData.role = role">
                                <Icon
                                    :icon="role === 'patient' ? 'lucide:user' : role === 'staff' ? 'lucide:briefcase' : 'lucide:shield'"
                                    class="mr-2 h-4 w-4" />
                                {{ getRoleDisplayName(role) }}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Patient-Specific Fields -->
            <Card v-if="showPatientFields">
                <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                    <CardDescription>Additional patient details</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- NRIC -->
                        <div class="space-y-2">
                            <Label for="nric">NRIC/FIN</Label>
                            <Input id="nric" v-model="formData.nric" placeholder="S1234567A" />
                        </div>

                        <!-- Phone -->
                        <div class="space-y-2">
                            <Label for="phone">Phone Number</Label>
                            <Input id="phone" v-model="formData.phone" type="tel" placeholder="+65 9123 4567" />
                        </div>

                        <!-- Date of Birth -->
                        <div class="space-y-2">
                            <Label for="dob">Date of Birth</Label>
                            <Input id="dob" v-model="formData.dob" type="date" />
                        </div>

                        <!-- Address -->
                        <div class="space-y-2 md:col-span-2 lg:col-span-3">
                            <Label for="address">Address</Label>
                            <Input id="address" v-model="formData.address" placeholder="123 Main Street, #01-234" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Staff-Specific Fields -->
            <Card v-if="showStaffFields">
                <CardHeader>
                    <CardTitle>Staff Information</CardTitle>
                    <CardDescription>Staff assignment and role details</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Clinic ID -->
                        <div class="space-y-2">
                            <Label for="clinic_id">
                                Clinic ID <span class="text-destructive">*</span>
                            </Label>
                            <Input id="clinic_id" v-model.number="formData.clinic_id" type="number"
                                placeholder="e.g., 1" :class="{ 'border-destructive': formErrors.clinic_id }" />
                            <p v-if="formErrors.clinic_id" class="text-sm text-destructive">{{ formErrors.clinic_id }}
                            </p>
                            <p class="text-xs text-muted-foreground">The clinic this staff member is assigned to</p>
                        </div>

                        <!-- Staff Role -->
                        <div class="space-y-2">
                            <Label>Staff Position</Label>
                            <div class="flex flex-wrap gap-2">
                                <Button v-for="staffRole in staffRoles" :key="staffRole" type="button"
                                    :variant="formData.staff_role === staffRole ? 'default' : 'outline'" size="sm"
                                    @click="formData.staff_role = staffRole">
                                    {{ staffRole.charAt(0).toUpperCase() + staffRole.slice(1) }}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Admin Notice -->
            <Card v-if="formData.role === 'admin'" class="border-amber-500 bg-amber-50 dark:bg-amber-950">
                <CardHeader class="text-amber-700 dark:text-amber-400">
                    <CardTitle class="font-medium flex items-center gap-2">
                        <Icon icon="lucide:alert-triangle" class="h-5 w-5 flex-shrink-0 mt-0.5" />
                        Creating Administrator Account
                    </CardTitle>
                    <CardDescription>Administrators have full system access. Please ensure this
                        account is properly secured.</CardDescription>
                </CardHeader>
            </Card>

            <!-- Action Buttons -->
            <div class="flex justify-end gap-4">
                <Button type="button" variant="outline" @click="handleCancel" :disabled="loading">
                    Cancel
                </Button>
                <Button type="submit" :disabled="loading">
                    <Icon v-if="loading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                    <Icon v-else icon="lucide:check" class="mr-2 h-4 w-4" />
                    {{ loading ? 'Creating...' : 'Create User' }}
                </Button>
            </div>
        </form>
    </div>
</template>
