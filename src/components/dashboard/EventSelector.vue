<template>
  <button class="flex items-center gap-3 h-12 px-3 bg-white border border-outline-variant/60 rounded-xl shadow-soft hover:border-primary/40 transition-colors">
    <span class="w-9 h-9 rounded-lg bg-primary-light grid place-items-center shrink-0">
      <span class="material-symbols-outlined text-primary text-lg">celebration</span>
    </span>
    <span class="text-left leading-tight min-w-0">
      <span class="block text-sm font-semibold text-on-surface truncate">{{ name || 'Sélectionner un événement' }}</span>
      <span class="block text-[11px] text-on-surface-variant truncate">{{ subtitle || 'Aucun événement actif' }}</span>
    </span>
    <span class="material-symbols-outlined text-on-surface-variant text-sm shrink-0">expand_more</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ name?: string; subtitle?: string }>()
</script>
