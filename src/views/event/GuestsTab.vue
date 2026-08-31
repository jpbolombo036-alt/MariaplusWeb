<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Invités</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ guests.length }} invité(s) au total</p>
        </div>
        <div class="flex items-center gap-3">
          <PermGuard :allow="['GUEST_CREATE', 'GUEST_IMPORT']">
            <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="$router.push(`/dashboard/events/${id}/guests/new`)">
              <span class="material-symbols-outlined text-[18px]">person_add</span> Ajouter
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
          <input
            v-model="query"
            placeholder="Rechercher par nom, email, téléphone..."
            class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all"
          />
        </div>
        <button class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-slate-400 py-6 text-center text-sm">Chargement…</p>

    <!-- État vide -->
    <div v-else-if="filtered.length === 0" class="bg-white border border-slate-200 rounded-xl py-14 text-center">
      <div class="w-14 h-14 mx-auto rounded-lg bg-slate-50 grid place-items-center mb-4 ring-1 ring-slate-100">
        <span class="material-symbols-outlined text-3xl text-slate-300">group</span>
      </div>
      <h3 class="font-bold text-slate-700 text-[15px]">Aucun invité</h3>
      <p class="text-[13px] text-slate-400 mt-1">Ajoutez votre premier invité ou importez une liste.</p>
    </div>

    <!-- Tableau d'invités -->
    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-slate-500">
          <tr>
            <th class="px-5 py-3.5 font-medium">Invité</th>
            <th class="px-5 py-3.5 font-medium">Email</th>
            <th class="px-5 py-3.5 font-medium">Téléphone</th>
            <th class="px-5 py-3.5 font-medium">Accompagnants</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="g in filtered" :key="g.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-primary-light text-primary grid place-items-center text-xs font-bold shrink-0">{{ initials(g) }}</span>
                <span class="font-semibold text-slate-700 text-[14px]">{{ g.firstName }} {{ g.lastName }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-slate-600 text-[13px]">{{ g.email || '—' }}</td>
            <td class="px-5 py-3.5 text-slate-600 text-[13px]">{{ g.phone || '—' }}</td>
            <td class="px-5 py-3.5 text-slate-600 text-[13px]">{{ g.allowedCompanions ?? 0 }}</td>
            <td class="px-5 py-3.5 text-right">
              <div class="inline-flex items-center gap-1">
                <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Modifier"><span class="material-symbols-outlined text-base">edit</span></button>
                <PermGuard :allow="['GUEST_DELETE']">
                  <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(g)"><span class="material-symbols-outlined text-base">delete</span></button>
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
import { listGuests, deleteGuest, listCategories, type Guest, type GuestCategory } from '../../api/guests'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const guests = ref<Guest[]>([])
const categories = ref<GuestCategory[]>([])
const loading = ref(true)
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return guests.value
  return guests.value.filter(
    (g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q),
  )
})

const initials = (g: Guest) => `${g.firstName.charAt(0)}${g.lastName.charAt(0)}`.toUpperCase()

const categoryLabel = (cid?: number | null) => categories.value.find((c) => c.id === cid)?.name

onMounted(load)
async function load() {
  try {
    const [g, c] = await Promise.all([listGuests(id), listCategories(id)])
    guests.value = g
    categories.value = c
  } finally {
    loading.value = false
  }
}
async function remove(g: Guest) {
  if (!confirm(`Supprimer l'invité ${g.firstName} ${g.lastName} ?`)) return
  await deleteGuest(id, g.id)
  guests.value = guests.value.filter((x) => x.id !== g.id)
}
</script>

<style scoped>
</style>
