<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/vue'
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Reports</h1>
      <p class="text-gray-600 mt-2">Generate and view clinic reports and analytics</p>
    </div>

    <Card class="max-w-2xl mx-auto">
      <CardHeader class="text-center">
        <div class="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon icon="lucide:construction" class="size-8 text-blue-600" />
        </div>
        <CardTitle class="text-2xl">Reports Module</CardTitle>
        <CardDescription class="text-lg">
          This page is currently under development
        </CardDescription>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        <p class="text-gray-600">
          We're working hard to bring you comprehensive reporting features including:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Analytics Dashboard</h3>
            <p class="text-sm text-gray-600">Patient statistics and trends</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Appointment Reports</h3>
            <p class="text-sm text-gray-600">Scheduling and attendance data</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Financial Reports</h3>
            <p class="text-sm text-gray-600">Revenue and billing insights</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Custom Reports</h3>
            <p class="text-sm text-gray-600">Generate tailored reports</p>
          </div>
        </div>
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-blue-800 font-medium">Coming Soon!</p>
          <p class="text-blue-600 text-sm mt-1">
            Check back later for full reporting functionality
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>