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
      {{ entry.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { filterNav, navTo } from '../../navigation'
import { listWeddings, type Wedding } from '../../api/weddings'

const auth = useAuthStore()
const weddings = ref<Wedding[]>([])
const activeWeddingId = computed(() => weddings.value[0]?.id ?? null)
const visible = computed(() => filterNav(auth.permissions).slice(0, 4))

onMounted(async () => {
  try {
    weddings.value = await listWeddings()
  } catch {
    /* aucune liste */
  }
})
</script>
