<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Statistiques</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Vue d'ensemble des statistiques</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
            <span class="material-symbols-outlined text-[18px]">refresh</span> Actualiser
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-slate-400 py-8 text-center text-sm">Chargement…</div>
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Invités</div>
        <div class="text-2xl font-bold text-slate-900 mt-1">{{ stats?.guests.total ?? 0 }}</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Acceptés</div>
        <div class="text-2xl font-bold text-green-700 mt-1">{{ stats?.invitations.accepted ?? 0 }}</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Déclinés</div>
        <div class="text-2xl font-bold text-red-700 mt-1">{{ stats?.invitations.declined ?? 0 }}</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Taux de réponse</div>
        <div class="text-2xl font-bold text-primary mt-1">{{ Math.round((stats?.invitations.responseRate ?? 0)) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getDashboard, type Dashboard } from '../../api/dashboard'

const route = useRoute()
const id = Number(route.params.id)
const stats = ref<Dashboard | null>(null)
const loading = ref(true)
onMounted(async () => {
  try {
    stats.value = await getDashboard(id)
  } finally {
    loading.value = false
  }
})
</script>