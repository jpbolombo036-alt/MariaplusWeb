<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap" :class="tone">
    {{ BOOKING_STATUS_LABELS[status] ?? status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BOOKING_STATUS_LABELS, type BookingStatus } from '../../api/venues'

const props = defineProps<{ status: BookingStatus }>()

const tone = computed(() => ({
  DEMANDE: 'bg-slate-100 text-slate-600',
  OPTION: 'bg-attention-light text-attention',
  CONFIRMEE: 'bg-success-light text-success',
  REALISEE: 'bg-primary-light text-primary',
  ANNULEE: 'bg-error-light text-error',
}[props.status] ?? 'bg-slate-100 text-slate-600'))
</script>
