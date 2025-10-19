<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { Toaster as Sonner } from "vue-sonner"

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :position="props.position ?? 'top-right'"
    :close-on-click="props.closeOnClick ?? true"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      // tweak radius/shadow for a clean, modern look
      '--border-radius': '10px',
      boxShadow: '0 6px 20px rgba(2,6,23,0.08)'
    }"
  />
</template>
