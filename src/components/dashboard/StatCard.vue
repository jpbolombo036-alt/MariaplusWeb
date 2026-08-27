<template>
  <div class="bg-white border border-outline-variant/60 rounded-card p-5 shadow-card flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <span class="w-10 h-10 rounded-lg grid place-items-center" :class="iconBg">
        <span class="material-symbols-outlined" :class="'text-' + tone">{{ icon }}</span>
      </span>
      <span v-if="badge" class="px-2 py-1 rounded-md text-[11px] font-semibold" :class="badgeClass">{{ badge }}</span>
    </div>
    <span class="text-sm text-on-surface-variant">{{ label }}</span>
    <div class="mt-1 flex items-baseline gap-2">
      <span class="text-2xl font-bold text-on-surface">{{ value }}</span>
      <span v-if="total" class="text-sm text-on-surface-variant">/ {{ total }}</span>
    </div>
    <div v-if="progress !== null" class="mt-3 w-full h-2 rounded-full bg-surface-variant/60 overflow-hidden">
      <div class="h-full rounded-full transition-all" :class="barClass" :style="{ width: pct + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  total?: string | number
  icon: string
  tone?: 'primary' | 'success' | 'attention' | 'error'
  badge?: string
  progress?: number // 0-100, ou null pour pas de barre
}>()

const iconBg = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'bg-green-50'
    case 'attention':
      return 'bg-amber-50'
    case 'error':
      return 'bg-red-50'
    default:
      return 'bg-primary-light'
  }
})

const toneClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'text-green-600'
    case 'attention':
      return 'text-amber-500'
    case 'error':
      return 'text-red-600'
    default:
      return 'text-primary'
  }
})

const badgeClass = computed(() => {
  switch (props.tone) {
    case 'success':
    case 'attention':
    case 'error':
      return 'bg-opacity-10 ' + toneClass.value
    default:
      return 'bg-green-50 text-green-700'
  }
})

const barClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'bg-green-600'
    case 'attention':
      return 'bg-amber-500'
    case 'error':
      return 'bg-red-600'
    default:
      return 'bg-primary'
  }
})

const pct = computed(() => Math.max(0, Math.min(100, props.progress ?? 0)))
</script>
