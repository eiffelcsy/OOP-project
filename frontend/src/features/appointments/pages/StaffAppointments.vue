<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/vue'

// Placeholder component - to be implemented later
</script>

<template>
  <div class="space-y-8 p-8">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight">Today's Appointments</h1>
      <p class="text-muted-foreground">Manage all appointments for today.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Icon icon="lucide:construction" class="h-5 w-5" />
          Coming Soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">This feature is currently under development and will be available soon.</p>
      </CardContent>
    </Card>
  </div>
</template>
