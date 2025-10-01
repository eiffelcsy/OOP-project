<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/vue'
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Medical Records</h1>
      <p class="text-gray-600 mt-2">View and manage your medical history</p>
    </div>

    <Card class="max-w-2xl mx-auto">
      <CardHeader class="text-center">
        <div class="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Icon icon="lucide:construction" class="size-8 text-green-600" />
        </div>
        <CardTitle class="text-2xl">Medical Records</CardTitle>
        <CardDescription class="text-lg">
          This page is currently under development
        </CardDescription>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        <p class="text-gray-600">
          We're building a comprehensive medical records system that will include:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Visit History</h3>
            <p class="text-sm text-gray-600">Complete record of all appointments</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Prescriptions</h3>
            <p class="text-sm text-gray-600">Current and past medications</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Treatment Plans</h3>
            <p class="text-sm text-gray-600">Ongoing care and follow-up plans</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Documents</h3>
            <p class="text-sm text-gray-600">Medical certificates and reports</p>
          </div>
        </div>
        <div class="mt-6 p-4 bg-green-50 rounded-lg">
          <p class="text-green-800 font-medium">Coming Soon!</p>
          <p class="text-green-600 text-sm mt-1">
            Your complete medical history will be available here soon
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
