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
    <div class="hidden bg-primary lg:flex flex-col h-screen justify-center p-8 lg:p-16 xl:p-24 gap-8 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary to-primary/90 pointer-events-none"></div>
      <div class="relative z-10 flex flex-col gap-8">
        <div class="transform transition-all duration-300 hover:scale-101">
          <img 
            src="/assets/login-bg.png" 
            alt="Authentication Background" 
            class="max-w-md max-h-md object-contain drop-shadow-2xl" 
          />
        </div>
        
        <!-- Content section -->
        <div class="max-w-2xl flex flex-col gap-4">
          <h1 class="text-3xl lg:text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight">
            Welcome Back to<br/>
            <span class="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Clinic Management System
            </span>
          </h1>
          <p class="text-xs lg:text-sm text-white/90 leading-relaxed">
            Efficient, secure, and designed for healthcare professionals and patients alike. <br/>
            Streamline your clinic operations and patient appointments.
          </p>
          
          <!-- Feature highlights -->
          <div class="flex flex-wrap gap-4 mt-4">
            <div class="flex items-center gap-2 text-white/80 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Secure & Reliable</span>
            </div>
            <div class="flex items-center gap-2 text-white/80 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Easy to Use</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex h-screen items-center justify-center py-12">
      <div class="mx-auto grid w-[350px] gap-6">
        <div class="grid gap-2">
          <h1 class="text-3xl lg:text-4xl font-bold">
            {{ pageTitle }}
          </h1>
        </div>
        
        <RouterView />
      </div>
    </div>
  </div>
</template>
