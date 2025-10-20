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
  />
</template>

<style>
[data-sonner-toast] {
  background: hsl(var(--background)) !important;
  border: 1px solid hsl(var(--border)) !important;
  color: hsl(var(--foreground)) !important;
}

[data-sonner-toast][data-type="success"] {
  background: hsl(142.1 76.2% 36.3%) !important;
  border-color: hsl(142.1 76.2% 36.3%) !important;
  color: white !important;
}

[data-sonner-toast][data-type="success"] [data-icon] {
  color: white !important;
}

[data-sonner-toast][data-type="success"] [data-title],
[data-sonner-toast][data-type="success"] [data-description] {
  color: white !important;
}

[data-sonner-toast][data-type="error"] {
  background: hsl(0 84.2% 60.2%) !important;
  border-color: hsl(0 84.2% 60.2%) !important;
  color: white !important;
}

[data-sonner-toast][data-type="error"] [data-icon] {
  color: white !important;
}

[data-sonner-toast][data-type="error"] [data-title],
[data-sonner-toast][data-type="error"] [data-description] {
  color: white !important;
}

[data-sonner-toast][data-type="info"] {
  background: hsl(221.2 83.2% 53.3%) !important;
  border-color: hsl(221.2 83.2% 53.3%) !important;
  color: white !important;
}

[data-sonner-toast][data-type="warning"] {
  background: hsl(38 92% 50%) !important;
  border-color: hsl(38 92% 50%) !important;
  color: white !important;
}

[data-sonner-toast] [data-button] {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: none !important;
}

[data-sonner-toast] [data-button]:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

[data-sonner-toast] [data-close-button] {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: none !important;
}

[data-sonner-toast] [data-close-button]:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}
</style>
