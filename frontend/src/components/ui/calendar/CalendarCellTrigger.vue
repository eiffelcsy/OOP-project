<script lang="ts" setup>
import type { CalendarCellTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CalendarCellTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes["class"], availableWeekdays?: number[], availableDates?: string[] }>(), {
  as: "button",
})

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)

import { computed } from 'vue'

// Determine if this calendar day is in the exact set of available dates.
// We only highlight exact dates (YYYY-MM-DD) that appear in `availableDates`.
const isAvailable = computed(() => {
  try {
    const dayVal = (forwardedProps as any).day ?? (props as any).day
    if (!dayVal) return false
    const dt = new Date(String(dayVal))
    if (isNaN(dt.getTime())) return false
    const dateStr = dt.toISOString().slice(0, 10)

  // availableDates may be passed as a raw Array, a Set, or a ref/computed wrapping any of those.
  let datesRaw: any = (props.availableDates ?? (forwardedProps as any).availableDates)
  if (datesRaw && (datesRaw as any).value !== undefined) datesRaw = (datesRaw as any).value
  const datesArr = datesRaw || []
  if (Array.isArray(datesArr)) return datesArr.indexOf(dateStr) !== -1
  // If availableDates isn't an array but is a Set-like, try has()
  if (datesArr && typeof (datesArr as any).has === 'function') return (datesArr as any).has(dateStr)
    return false
  } catch (e) {
    return false
  }
})
</script>

<template>
  <CalendarCellTrigger
    data-slot="calendar-cell-trigger"
    :class="cn(
      buttonVariants({ variant: 'ghost' }),
      'size-8 p-0 font-normal aria-selected:opacity-100 cursor-default',
      '[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground',
      // Selected
      'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:opacity-100 data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground',
      // Disabled
      'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
      // Unavailable
      'data-[unavailable]:text-destructive-foreground data-[unavailable]:line-through',
  // Highlight days with availability — light green background + green text
  'data-[has-availability]:bg-green-100 data-[has-availability]:text-green-800',
      // Outside months
      'data-[outside-view]:text-muted-foreground',
      props.class,
    )"
    v-bind="forwardedProps"
    :data-has-availability="isAvailable ? true : undefined"
  >
    <slot />
  </CalendarCellTrigger>
</template>
