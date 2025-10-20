<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'

</script>

<template>
  <RouterView />
  <Toaster 
    :duration="4000"
    :close-button="true"
    rich-colors
  />
</template>

<style scoped></style>
