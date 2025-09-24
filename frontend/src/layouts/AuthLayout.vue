<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const pageTitle = computed(() => {
  return route.meta?.title || 'Authentication'
})
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[500px] lg:grid-cols-2 xl:min-h-[700px]">
    <div class="hidden bg-muted lg:block h-screen">
      <img 
        src="/assets/login-bg.jpg" 
        alt="Authentication Background" 
        class="w-full h-full object-cover brightness-70" 
      />
    </div>
    
    <div class="flex h-screen items-center justify-center py-12">
      <div class="mx-auto grid w-[350px] gap-6">
        <div class="grid gap-2">
          <h1 class="text-3xl lg:text-4xl font-bold">
            {{ pageTitle }}
          </h1>
          <div class="h-[3px] w-24 lg:w-32 bg-primary mb-4"></div>
        </div>
        
        <!-- Render Login or Register based on the route -->
        <RouterView />
      </div>
    </div>
  </div>
</template>
