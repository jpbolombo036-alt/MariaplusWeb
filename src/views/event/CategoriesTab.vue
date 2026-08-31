<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Catégories d'invités</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ cats.length }} catégorie(s)</p>
        </div>
        <div class="flex items-center gap-3">
          <PermGuard :allow="['GUEST_CREATE']">
            <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="$router.push(`/dashboard/events/${id}/categories/new`)">
              <span class="material-symbols-outlined text-[18px]">add</span> Catégorie
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
          <input v-model="query" placeholder="Rechercher…" class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
        <button class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </div>
    </div>

      <p v-if="loading" class="text-slate-400 py-6 text-center text-sm">Chargement…</p>

      <div v-else-if="filtered.length === 0" class="bg-white border border-slate-200 rounded-xl py-12 text-center">
        <div class="w-16 h-16 mx-auto rounded-lg bg-slate-50 grid place-items-center mb-4 ring-1 ring-slate-100"><span class="material-symbols-outlined text-3xl text-slate-300">category</span></div>
        <h3 class="font-semibold text-slate-800">Aucune catégorie</h3>
        <p class="text-sm text-slate-500 mt-1">Créez des catégories pour organiser vos invités (Famille, Amis, Collègues…).</p>
      </div>

      <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500">
            <tr>
              <th class="px-5 py-3.5 font-medium">Nom</th>
              <th class="px-5 py-3.5 font-medium">Description</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="c in filtered" :key="c.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-lg bg-primary-light text-primary grid place-items-center shrink-0"><span class="material-symbols-outlined text-[18px]">label</span></span>
                  <span class="font-semibold text-slate-700 text-[14px]">{{ c.name }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-slate-600 text-[13px]">{{ c.description || '—' }}</td>
              <td class="px-5 py-3.5 text-right">
                <div class="inline-flex items-center gap-1">
                  <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Modifier"><span class="material-symbols-outlined text-base">edit</span></button>
                  <PermGuard :allow="['GUEST_DELETE']">
                    <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(c)"><span class="material-symbols-outlined text-base">delete</span></button>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listCategories, deleteCategory, type GuestCategory } from '../../api/guests'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const cats = ref<GuestCategory[]>([])
const loading = ref(true)
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return cats.value
  return cats.value.filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q))
})

onMounted(load)
async function load() {
  try {
    cats.value = await listCategories(id)
  } finally {
    loading.value = false
  }
}
async function remove(c: GuestCategory) {
  if (!confirm(`Supprimer la catégorie « ${c.name } » ?`)) return
  await deleteCategory(id, c.id)
  cats.value = cats.value.filter((x) => x.id !== c.id)
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
