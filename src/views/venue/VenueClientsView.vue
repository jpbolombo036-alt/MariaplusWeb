<template>
  <div>
    <VenuePageHeader title="Clients" subtitle="Les personnes qui louent vos salles. Aucun compte n'est nécessaire.">
      <button class="v-btn-primary" @click="creating = !creating">
        <span class="material-symbols-outlined text-[18px]">person_add</span>
        Nouveau client
      </button>
    </VenuePageHeader>

    <form v-if="creating" class="v-card p-5 mb-6 space-y-4" @submit.prevent="create">
      <div class="grid sm:grid-cols-2 gap-4">
        <label><span class="v-label">Prénom</span><input v-model.trim="draft.firstName" maxlength="100" class="v-input" /></label>
        <label><span class="v-label">Nom *</span><input v-model.trim="draft.lastName" required maxlength="100" class="v-input" /></label>
        <label><span class="v-label">Téléphone</span><input v-model.trim="draft.phone" type="tel" placeholder="0812 345 678" class="v-input" /></label>
        <label><span class="v-label">Email</span><input v-model.trim="draft.email" type="email" class="v-input" /></label>
        <label class="sm:col-span-2"><span class="v-label">Notes</span><textarea v-model="draft.notes" rows="2" maxlength="2000" class="v-input" /></label>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="v-btn" @click="creating = false">Annuler</button>
        <button class="v-btn-primary" :disabled="busy">Enregistrer</button>
      </div>
    </form>

    <div class="v-card">
      <div class="p-4">
        <input v-model.trim="query" placeholder="Rechercher par nom, téléphone ou email…" class="v-input" aria-label="Rechercher un client" @input="search" />
      </div>
      <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Chargement…</div>
      <p v-else-if="!clients.length" class="px-5 pb-8 text-center text-sm text-slate-500">Aucun client.</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead><tr class="bg-slate-50/80"><th class="v-th">Client</th><th class="v-th">Téléphone</th><th class="v-th">Email</th><th class="v-th">Depuis</th></tr></thead>
          <tbody>
            <tr v-for="c in clients" :key="c.id" class="border-t border-slate-100 hover:bg-primary-light/30 cursor-pointer" @click="$router.push(`/dashboard/venue/clients/${c.id}`)">
              <td class="v-td font-semibold text-slate-900">{{ c.fullName }}</td>
              <td class="v-td whitespace-nowrap">{{ c.phone || '—' }}</td>
              <td class="v-td">{{ c.email || '—' }}</td>
              <td class="v-td whitespace-nowrap">{{ c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
        <button class="v-btn !h-8" :disabled="pageIndex === 0" @click="go(pageIndex - 1)">Précédent</button>
        <span class="text-[12px] text-slate-500">Page {{ pageIndex + 1 }} / {{ totalPages }}</span>
        <button class="v-btn !h-8" :disabled="pageIndex + 1 >= totalPages" @click="go(pageIndex + 1)">Suivant</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import { createVenueClient, listVenueClients, type VenueClient } from '../../api/venues'

const router = useRouter()
const clients = ref<VenueClient[]>([])
const query = ref('')
const pageIndex = ref(0)
const totalPages = ref(1)
const loading = ref(true)
const busy = ref(false)
const creating = ref(false)
const draft = reactive({ firstName: '', lastName: '', phone: '', email: '', notes: '' })

async function load() {
  loading.value = true
  try {
    const page = await listVenueClients(query.value, pageIndex.value, 25)
    clients.value = page.content
    totalPages.value = Math.max(page.totalPages, 1)
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
function search() {
  clearTimeout(timer)
  timer = setTimeout(() => go(0), 250)
}

function go(p: number) {
  pageIndex.value = p
  void load()
}

async function create() {
  busy.value = true
  try {
    const c = await createVenueClient({
      firstName: draft.firstName || undefined,
      lastName: draft.lastName,
      phone: draft.phone || undefined,
      email: draft.email || undefined,
      notes: draft.notes || undefined,
    })
    router.push(`/dashboard/venue/clients/${c.id}`)
  } catch { /* message affiché par l'intercepteur */ } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
