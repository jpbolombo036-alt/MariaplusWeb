<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Tables & Placements</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ tables.length }} table(s)</p>
        </div>
        <div class="flex items-center gap-3">
          <PermGuard :allow="['TABLE_CREATE']">
            <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="$router.push(`/dashboard/events/${id}/tables/new`)">
              <span class="material-symbols-outlined text-[18px]">add</span> Nouvelle Table
            </button>
          </PermGuard>
        </div>
      </div>
    </div>

    <!-- Recherche style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
      <div class="flex items-center gap-3">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input v-model="query" placeholder="Rechercher une table..." class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
        <button class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-slate-400 py-8 text-center text-sm">Chargement…</div>

    <!-- Tableau de tables -->
    <div v-else-if="filtered.length === 0" class="bg-white border border-slate-200 rounded-xl py-14 text-center">
      <div class="w-14 h-14 mx-auto rounded-lg bg-slate-50 grid place-items-center mb-4 ring-1 ring-slate-100">
        <span class="material-symbols-outlined text-3xl text-slate-300">table_restaurant</span>
      </div>
      <h3 class="font-bold text-slate-700 text-[15px]">Aucune table</h3>
      <p class="text-[13px] text-slate-400 mt-1">Créez votre première table pour organiser les placements.</p>
    </div>

    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-slate-500">
          <tr>
            <th class="px-5 py-3.5 font-medium">Table</th>
            <th class="px-5 py-3.5 font-medium">Capacité</th>
            <th class="px-5 py-3.5 font-medium">Assignés</th>
            <th class="px-5 py-3.5 font-medium">Occupation</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="t in filtered" :key="t.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5">
              <span class="font-semibold text-slate-700 text-[14px]">{{ t.name }}</span>
            </td>
            <td class="px-5 py-3.5 text-slate-600 text-[13px]">{{ t.capacity }}</td>
            <td class="px-5 py-3.5 text-slate-600 text-[13px]">{{ t.assignedCount }}</td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(100, (t.assignedCount / t.capacity) * 100) + '%' }"></div>
                </div>
                <span class="text-xs text-slate-500">{{ Math.round((t.assignedCount / t.capacity) * 100) }}%</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right">
              <div class="inline-flex items-center gap-1">
                <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Modifier"><span class="material-symbols-outlined text-base">edit</span></button>
                <PermGuard :allow="['TABLE_DELETE']">
                  <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(t)"><span class="material-symbols-outlined text-base">delete</span></button>
                </PermGuard>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { listTables, deleteTable, type WeddingTable } from '../../api/tables'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const tables = ref<WeddingTable[]>([])
const loading = ref(true)
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return tables.value
  return tables.value.filter(t => t.name.toLowerCase().includes(q))
})

onMounted(load)
async function load() {
  try {
    tables.value = await listTables(id)
  } finally {
    loading.value = false
  }
}
async function remove(t: WeddingTable) {
  if (!confirm(`Supprimer la table « ${t.name} » ?`)) return
  await deleteTable(id, t.id)
  tables.value = tables.value.filter((x) => x.id !== t.id)
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
