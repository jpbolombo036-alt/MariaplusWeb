<template>
  <div>
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div class="px-6 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-[18px] font-bold text-slate-900">Utilisateurs de la plateforme</h2>
          <p class="text-[13px] text-slate-500 mt-0.5">{{ total }} compte(s) — page {{ page + 1 }} / {{ totalPages }}</p>
        </div>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            v-model="search"
            placeholder="Rechercher un nom ou un email…"
            class="h-10 w-full sm:w-72 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div v-if="loading" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

      <div v-else-if="filtered.length === 0" class="py-16 text-center">
        <div class="w-14 h-14 rounded-2xl bg-primary-light mx-auto flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-primary text-[28px]">person_off</span>
        </div>
        <p class="font-semibold text-slate-900">Aucun utilisateur</p>
        <p class="text-sm text-slate-500 mt-1">{{ search ? 'Aucun résultat sur cette page.' : 'Aucun compte enregistré.' }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/80 text-[13px] font-semibold text-slate-500">
              <th class="py-3.5 px-4">Utilisateur</th>
              <th class="py-3.5 px-4">Rôles</th>
              <th class="py-3.5 px-4">Organisation</th>
              <th class="py-3.5 px-4">Dernière connexion</th>
              <th class="py-3.5 px-4">Statut</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id" class="border-b border-slate-100 last:border-0 hover:bg-primary-light/30 transition">
              <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    {{ initials(u.firstName, u.lastName) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-[15px] font-semibold text-slate-900 truncate">{{ u.firstName }} {{ u.lastName }}</p>
                    <p class="text-[13px] text-slate-500 truncate">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="r in u.roles" :key="r" class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold" :class="roleBadgeClass(r)">
                    {{ roleLabel(r) }}
                  </span>
                </div>
              </td>
              <td class="py-4 px-4 text-sm text-slate-700">{{ orgName(u.organizationId) }}</td>
              <td class="py-4 px-4 text-sm text-slate-500">{{ formatDate(u.lastLoginAt) }}</td>
              <td class="py-4 px-4">
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                      :class="u.active ? 'bg-success-light text-success' : 'bg-error-light text-error'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="u.active ? 'bg-success' : 'bg-error'"></span>
                  {{ u.active ? 'Actif' : 'Désactivé' }}
                </span>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    :disabled="busyId === u.id"
                    class="h-9 px-3 rounded-lg border text-[12px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    :class="u.active ? 'border-error/30 text-error hover:bg-error-light' : 'border-success/30 text-success hover:bg-success-light'"
                    :title="u.active ? 'Désactiver ce compte (connexion bloquée)' : 'Réactiver ce compte'"
                    @click="onToggleActive(u)"
                  >
                    <span class="material-symbols-outlined text-[16px]">{{ u.active ? 'block' : 'check_circle' }}</span>
                    {{ u.active ? 'Désactiver' : 'Activer' }}
                  </button>
                  <button
                    :disabled="busyId === u.id"
                    class="h-9 w-9 rounded-lg border border-slate-200 text-slate-400 hover:text-error hover:border-error/30 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                    title="Supprimer définitivement"
                    @click="onDelete(u)"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
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
import { computed, onMounted, ref } from 'vue'
import {
  listUsers,
  toggleUserActive,
  deleteAdminUser,
  listOrganizations,
  type AdminUser,
  type AdminOrganization,
} from '../../api/admin'

const rows = ref<AdminUser[]>([])
const orgs = ref<AdminOrganization[]>([])
const page = ref(0)
const total = ref(0)
const totalPages = ref(1)
const loading = ref(true)
const busyId = ref<number | null>(null)
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
})

async function load() {
  loading.value = true
  try {
    const p = await listUsers(page.value, 25)
    rows.value = p.content
    total.value = p.totalElements
    totalPages.value = Math.max(1, p.totalPages)
  } finally {
    loading.value = false
  }
}

function goPage(p: number) {
  if (p < 0 || p >= totalPages.value) return
  page.value = p
  load()
}

async function onToggleActive(u: AdminUser) {
  busyId.value = u.id
  try {
    const updated = await toggleUserActive(u.id)
    u.active = updated.active
  } finally {
    busyId.value = null
  }
}

async function onDelete(u: AdminUser) {
  const label = `${u.firstName} ${u.lastName}`.trim() || u.email
  if (!window.confirm(`Supprimer définitivement le compte de « ${label} » ?\nCette action est irréversible.`)) return
  busyId.value = u.id
  try {
    await deleteAdminUser(u.id)
    await load()
  } finally {
    busyId.value = null
  }
}

function initials(first: string, last: string): string {
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || '?'
}

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

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORGANISATEUR: 'Organisateur',
  GESTIONNAIRE_INVITES: 'Gest. invités',
  AGENT_ACCUEIL: 'Agent accueil',
}
function roleLabel(code: string): string {
  return ROLE_LABELS[code] ?? code
}
function roleBadgeClass(code: string): string {
  switch (code) {
    case 'SUPER_ADMIN': return 'bg-error-light text-error'
    case 'ORGANISATEUR': return 'bg-primary-light text-primary'
    case 'GESTIONNAIRE_INVITES': return 'bg-attention-light text-attention-dark'
    case 'AGENT_ACCUEIL': return 'bg-success-light text-success'
    default: return 'bg-slate-100 text-slate-600'
  }
}

onMounted(async () => {
  try {
    orgs.value = await listOrganizations()
  } catch { /* filtre organisationnel indisponible */ }
  await load()
})
</script>