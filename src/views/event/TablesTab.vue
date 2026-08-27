<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-on-surface">Tables & Placements</h2>
      <PermGuard :allow="['TABLE_CREATE']">
        <button class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold" @click="formOpen=true">+ Table</button>
      </PermGuard>
    </div>

    <div v-if="loading" class="text-on-surface-variant">Chargement…</div>
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="t in tables" :key="t.id" class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-on-surface">
        <div class="flex items-center justify-between">
          <span class="font-semibold">{{ t.name }}</span>
          <span class="text-xs text-on-surface-variant">{{ t.assignedCount }}/{{ t.capacity }}</span>
        </div>
        <div class="mt-2 h-2 rounded-full bg-surface-container overflow-hidden">
          <div class="h-full bg-primary" :style="{ width: Math.min(100, (t.assignedCount/t.capacity)*100) + '%' }"></div>
        </div>
      </div>
    </div>

    <div v-if="formOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="formOpen=false">
      <form class="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-6" @submit.prevent="create">
        <h3 class="font-bold mb-4">Nouvelle table</h3>
        <input v-model="name" required placeholder="Nom (ex: Table 1)" class="input mb-2" />
        <input v-model.number="capacity" required type="number" min="1" placeholder="Capacité" class="input mb-2" />
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="px-4 py-2 text-on-surface-variant" @click="formOpen=false">Annuler</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold">Créer</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listTables, createTable, type WeddingTable } from '../../api/tables'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const tables = ref<WeddingTable[]>([])
const loading = ref(true)
const formOpen = ref(false)
const name = ref('')
const capacity = ref(10)

onMounted(load)
async function load() {
  try {
    tables.value = await listTables(id)
  } finally {
    loading.value = false
  }
}
async function create() {
  await createTable(id, name.value, capacity.value)
  formOpen.value = false
  name.value = ''
  await load()
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary; }
</style>
