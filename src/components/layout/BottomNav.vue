<template>
  <nav class="md:hidden fixed bottom-0 inset-x-0 bg-surface-container-lowest border-t border-outline-variant flex z-30">
    <router-link
      v-for="entry in visible"
      :key="entry.label"
      :to="navTo(entry, activeWeddingId)"
      class="flex-1 flex flex-col items-center py-2 text-xs text-on-surface-variant"
      active-class="!text-primary"
    >
      <span class="material-symbols-outlined text-[22px]">{{ entry.icon }}</span>
      <span class="text-center leading-tight px-0.5">{{ entry.shortLabel ?? entry.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { filterNav, navTo } from '../../navigation'
import { useAuthStore } from '../../stores/auth'
import { useWeddingStore } from '../../stores/wedding'

const auth = useAuthStore()
const weddingStore = useWeddingStore()

// Même événement actif que la sidebar / le dashboard (cascade intelligente
// du store) — plus de « premier événement de la liste », souvent passé.
weddingStore.load()
const activeWeddingId = computed(() => weddingStore.activeId)
const visible = computed(() => filterNav(auth.permissions).slice(0, 4))
</script>
