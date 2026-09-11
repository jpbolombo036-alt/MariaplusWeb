<template>
  <div>
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div class="px-6 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-[18px] font-bold text-slate-900">Événements de la plateforme</h2>
          <p class="text-[13px] text-slate-500 mt-0.5">{{ total }} événement(s) — page {{ page + 1 }} / {{ totalPages }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[13px] text-slate-500 font-medium shrink-0">Organisation :</span>
          <select
            v-model="orgFilter"
            class="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-700 outline-none focus:border-primary"
            @change="onOrgFilterChange"
          >
            <option :value="null">Toutes</option>
            <option v-for="o in orgs" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

      <div v-else-if="rows.length === 0" class="py-16 text-center">
        <div class="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" :class="loadErr ? 'bg-error-light' : 'bg-primary-light'">
          <span class="material-symbols-outlined text-[28px]" :class="loadErr ? 'text-error' : 'text-primary'">{{ loadErr ? 'cloud_off' : 'event_busy' }}</span>
        </div>
        <p class="font-semibold text-slate-900">{{ loadErr ? 'Erreur de chargement' : 'Aucun événement' }}</p>
        <p class="text-sm text-slate-500 mt-1">
          {{ loadErr
            ? 'Le serveur a répondu une erreur interne. Vérifiez que le backend à jour est déployé, puis réessayez.'
            : (orgFilter ? 'Cette organisation n\'a pas encore d\'événement.' : 'Aucun événement sur la plateforme.') }}
        </p>
        <button v-if="loadErr" class="mt-4 h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-colors" @click="load">
          Réessayer
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/80 text-[13px] font-semibold text-slate-500">
              <th class="py-3.5 px-4">Événement</th>
              <th class="py-3.5 px-4">Type</th>
              <th class="py-3.5 px-4">Organisation</th>
              <th class="py-3.5 px-4">Date</th>
              <th class="py-3.5 px-4">Statut</th>
              <th class="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in rows" :key="e.id" class="border-b border-slate-100 last:border-0 hover:bg-primary-light/30 transition">
              <td class="py-4 px-4">
                <p class="text-[15px] font-semibold text-slate-900 truncate max-w-[280px]">{{ e.weddingDetails?.displayName || e.name }}</p>
                <p class="text-[13px] text-slate-500 truncate max-w-[280px]">{{ e.venueName || e.city || '—' }}</p>
              </td>
              <td class="py-4 px-4">
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                      :class="e.type === 'WEDDING' ? 'bg-primary-light text-primary' : 'bg-slate-100 text-slate-600'">
                  {{ e.type }}
                </span>
              </td>
              <td class="py-4 px-4 text-sm text-slate-700">{{ orgName(e.organizationId) }}</td>
              <td class="py-4 px-4 text-sm text-slate-500">{{ formatDate(e.eventDate) }}</td>
              <td class="py-4 px-4">
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold" :class="statusClass(e.status)">
                  {{ statusLabel(e.status) }}
                </span>
              </td>
              <td class="py-4 px-4 text-right">
                <router-link
                  :to="`/dashboard/events/${e.id}`"
                  class="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                  Ouvrir
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-slate-100">
        <p class="text-[13px] text-slate-500">Page {{ page + 1 }} sur {{ totalPages }}</p>
        <div class="flex items-center gap-2">
          <button :disabled="page === 0" class="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1" @click="goPage(page - 1)">
            <span class="material-symbols-outlined text-[16px]">chevron_left</span> Précédent
          </button>
          <button :disabled="page >= totalPages - 1" class="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1" @click="goPage(page + 1)">
            Suivant <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { listAllEvents, listOrganizations, type AdminOrganization } from '../../api/admin'
import type { Event } from '../../api/events'

const route = useRoute()
const rows = ref<Event[]>([])
const orgs = ref<AdminOrganization[]>([])
const orgFilter = ref<number | null>(null)
const page = ref(0)
const total = ref(0)
const totalPages = ref(1)
const loading = ref(true)
const loadErr = ref(false)

async function load() {
  loading.value = true
  loadErr.value = false
  try {
    const p = await listAllEvents(page.value, 25, orgFilter.value)
    rows.value = p.content
    total.value = p.totalElements
    totalPages.value = Math.max(1, p.totalPages)
  } catch {
    loadErr.value = true
  } finally {
    loading.value = false
  }
}

function goPage(p: number) {
  if (p < 0 || p >= totalPages.value) return
  page.value = p
  load()
}

function onOrgFilterChange() {
  page.value = 0
  load()
}

// Deep-link depuis l'onglet Organisations (?orgId=…)
watch(() => route.query.orgId, (v) => {
  const id = v != null ? Number(v) : null
  orgFilter.value = id != null && Number.isFinite(id) && id > 0 ? id : null
  page.value = 0
  load()
}, { immediate: false })

function orgName(orgId: number | null | undefined): string {
  if (orgId == null) return '—'
  const o = orgs.value.find((x) => x.id === orgId)
  return o ? o.name : `#${orgId}`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusLabel(status: string): string {
  switch (status) {
    case 'PUBLISHED': return 'Publié'
    case 'DRAFT': return 'Brouillon'
    case 'CANCELLED': return 'Annulé'
    case 'COMPLETED': return 'Terminé'
    default: return status
  }
}
function statusClass(status: string): string {
  switch (status) {
    case 'PUBLISHED': return 'bg-success-light text-success'
    case 'DRAFT': return 'bg-attention-light text-attention-dark'
    case 'CANCELLED': return 'bg-error-light text-error'
    default: return 'bg-slate-100 text-slate-600'
  }
}

onMounted(async () => {
  try {
    orgs.value = await listOrganizations()
  } catch { /* filtre organisationnel indisponible */ }
  const q = route.query.orgId
  const id = q != null ? Number(q) : null
  if (id != null && Number.isFinite(id) && id > 0) orgFilter.value = id
  await load()
})
</script>