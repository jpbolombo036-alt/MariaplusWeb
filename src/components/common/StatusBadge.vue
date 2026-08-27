<template>
  <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1" :class="classes">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full" :class="dotColor"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status?: string; dot?: boolean }>()

const label = computed(() => (props.status || 'DRAFT').toUpperCase())

const classes = computed(() => {
  switch (label.value) {
    case 'ACCEPTED':
    case 'ACCEPTÉ':
    case 'ACTIVE':
    case 'PUBLISHED':
      return 'bg-green-50 text-green-700'
    case 'PENDING':
    case 'EN ATTENTE':
    case 'DRAFT':
      return 'bg-amber-50 text-amber-700'
    case 'DECLINED':
    case 'REFUSÉ':
    case 'CANCELLED':
      return 'bg-red-50 text-red-700'
    case 'EXPIRED':
    case 'ARCHIVED':
      return 'bg-surface-variant text-on-surface-variant'
    default:
      return 'bg-primary-light text-primary'
  }
})

const dotColor = computed(() => {
  switch (label.value) {
    case 'ACCEPTED':
    case 'ACCEPTÉ':
      return 'bg-green-600'
    case 'PENDING':
    case 'EN ATTENTE':
      return 'bg-amber-500'
    case 'DECLINED':
    case 'REFUSÉ':
      return 'bg-red-600'
    default:
      return 'bg-current'
  }
})
</script>

