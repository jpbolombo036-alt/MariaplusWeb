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
          <PermGuard :allow="['GUEST_EXPORT']">
            <button class="h-10 px-5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition-all" @click="exportExcel">
              <span class="material-symbols-outlined text-[18px]">download</span> Exporter Excel
            </button>
          </PermGuard>
          <PermGuard :allow="['GUEST_IMPORT']">
            <button class="h-10 px-5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50" :disabled="importing" @click="fileInput?.click()">
              <span class="material-symbols-outlined text-[18px]">upload</span> {{ importing ? 'Import…' : 'Importer' }}
            </button>
          </PermGuard>
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

    <!-- Desktop : tableau -->
    <div v-else class="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Modifier" @click="$router.push(`/dashboard/events/${id}/guests/${g.id}/edit`)"><span class="material-symbols-outlined text-base">edit</span></button>
                <PermGuard :allow="['GUEST_DELETE']">
                  <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(g)"><span class="material-symbols-outlined text-base">delete</span></button>
                </PermGuard>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile : cartes -->
    <div v-if="!loading && filtered.length > 0" class="md:hidden space-y-3">
      <div
        v-for="g in filtered"
        :key="g.id"
        class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
      >
        <!-- En-tête : avatar + nom -->
        <div class="flex items-center gap-3 mb-3">
          <span class="w-10 h-10 rounded-lg bg-primary-light text-primary grid place-items-center text-sm font-bold shrink-0">{{ initials(g) }}</span>
          <p class="font-semibold text-slate-700 text-[15px] truncate">{{ g.firstName }} {{ g.lastName }}</p>
        </div>

        <!-- Coordonnées -->
        <div class="space-y-1.5 text-[13px] text-slate-600 mb-4">
          <p class="inline-flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px] text-slate-400">mail</span>
            {{ g.email || '—' }}
          </p>
          <p class="inline-flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px] text-slate-400">call</span>
            {{ g.phone || '—' }}
          </p>
          <p class="inline-flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px] text-slate-400">group</span>
            {{ g.allowedCompanions ?? 0 }} accompagnant(s)
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2">
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium" @click="$router.push(`/dashboard/events/${id}/guests/${g.id}/edit`)">
            <span class="material-symbols-outlined text-[18px]">edit</span>
            <span class="hidden sm:inline">Modifier</span>
          </button>
          <PermGuard :allow="['GUEST_DELETE']">
            <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium" @click="remove(g)">
              <span class="material-symbols-outlined text-[18px]">delete</span>
              <span class="hidden sm:inline">Supprimer</span>
            </button>
          </PermGuard>
        </div>
      </div>
    </div>

    <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onImportFile" />

    <!-- Résultat d'import -->
    <div v-if="importResult" class="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" @click.self="importResult = null">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900">Résultat de l'import</h3>
        <p class="text-sm text-slate-600 mt-2">
          ✅ <b>{{ importResult.imported }}</b> invité(s) importé(s) · ⏭️ {{ importResult.skipped }} ligne(s) vide(s) ignorée(s) ·
          <span :class="importResult.errors.length ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'">{{ importResult.errors.length }} erreur(s)</span>
        </p>
        <div v-if="importResult.errors.length" class="mt-3 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          <p v-for="e in importResult.errors" :key="e.line" class="px-3 py-2 text-[12px] text-red-600">
            Ligne {{ e.line }} : {{ e.message }}
          </p>
        </div>
        <div class="mt-5 flex items-center justify-between gap-3">
          <button class="text-[12px] font-semibold text-primary hover:underline" @click="downloadTemplate">Télécharger le modèle</button>
          <button class="h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-all" @click="importResult = null">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listGuests, deleteGuest, listCategories, exportGuestsExcel, importGuestsExcel, type Guest, type GuestCategory, type GuestImportResult } from '../../api/guests'
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
async function exportExcel() {
  const blob = await exportGuestsExcel(id)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'guests.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importResult = ref<GuestImportResult | null>(null)

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importing.value = true
  try {
    importResult.value = await importGuestsExcel(id, file)
    await load()
  } finally {
    importing.value = false
  }
}

function downloadTemplate() {
  const csv = 'firstName,lastName,email,phone,allowedCompanions,categoryName,notes\nJean,Mbolombo,jean@gmail.com,+243965019972,2,Famille,Exemple de note\n'
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modele-invites.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
</style>
