<template>
  <header class="flex items-center gap-3 px-4 md:px-6 h-16 bg-surface-container-lowest border-b border-outline-variant shrink-0">
    <span class="material-symbols-outlined md:hidden text-on-surface-variant" @click="$emit('menu')">menu</span>
    <span class="md:hidden w-7 h-7 rounded overflow-hidden grid place-items-center"><img src="/logo.png" alt="" class="w-full h-full object-contain" /></span>

    <div class="flex items-center gap-2 flex-1">
      <span class="material-symbols-outlined text-on-surface-variant md:hidden">search</span>
      <input
        class="hidden md:block w-64 px-4 py-2 rounded-full bg-surface-container text-sm outline-none placeholder:text-on-surface-variant"
        placeholder="Rechercher…"
      />
    </div>

    <button class="relative text-on-surface-variant hover:text-primary">
      <span class="material-symbols-outlined">notifications</span>
      <span class="absolute right-0 top-0 w-2 h-2 rounded-full bg-error"></span>
    </button>

    <span class="w-8 h-8 rounded-full bg-surface-container grid place-items-center overflow-hidden">
      <span class="material-symbols-outlined text-on-surface-variant">person</span>
    </span>
  </header>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'menu'): void }>()
</script>
