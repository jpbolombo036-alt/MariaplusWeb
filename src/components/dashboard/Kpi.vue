<template>
  <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-sm">
    <div class="flex items-center gap-2 text-on-surface-variant">
      <span class="material-symbols-outlined text-xl">{{ icon }}</span>
      <span class="text-sm">{{ label }}</span>
    </div>
    <div class="mt-2 text-3xl font-bold text-on-surface">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number; icon: string }>()
</script>
