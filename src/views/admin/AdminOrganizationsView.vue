<template>
  <div class="space-y-4">
    <div v-for="o in orgs" :key="o.id" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex items-center gap-3.5 min-w-0 flex-1">
          <div class="w-11 h-11 rounded-lg bg-success-light text-success flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[22px]">corporate_fare</span>
          </div>
          <div class="min-w-0">
            <p class="text-[15px] font-bold text-slate-900 truncate">{{ o.name }}</p>
            <p class="text-[13px] text-slate-500 truncate">{{ o.email || '—' }}<span v-if="o.phone"> · {{ o.phone }}</span></p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                :class="o.active ? 'bg-success-light text-success' : 'bg-error-light text-error'">
            <span class="w-1.5 h-1.5 rounded-full" :class="o.active ? 'bg-success' : 'bg-error'"></span>
            {{ o.active ? 'Active' : 'Désactivée' }}
          </span>
          <span v-if="o.createdAt" class="text-[12px] text-slate-400">créée le {{ formatDate(o.createdAt) }}</span>
          <button
            :disabled="busyId === o.id"
            class="h-9 px-3 rounded-lg border text-[12px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            :class="o.active ? 'border-error/30 text-error hover:bg-error-light' : 'border-success/30 text-success hover:bg-success-light'"
            @click="onToggleActive(o)"
          >
            <span class="material-symbols-outlined text-[16px]">{{ o.active ? 'block' : 'check_circle' }}</span>
            {{ o.active ? 'Désactiver' : 'Activer' }}
          </button>
          <button
            class="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            @click="toggleExpand(o)"
          >
            <span class="material-symbols-outlined text-[16px]">{{ expandedId === o.id ? 'expand_less' : 'group' }}</span>
            Organisateurs
          </button>
        </div>
      </div>

      <!-- Panneau dépliable : membres + événements -->
      <div v-if="expandedId === o.id" class="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
        <div v-if="membersLoading" class="text-sm text-slate-400 py-2">Chargement des membres…</div>
        <template v-else>
          <p class="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-3">Membres ({{ members.length }})</p>
          <div v-if="members.length === 0" class="text-sm text-slate-500">Aucun membre dans cette organisation.</div>
          <div v-else class="space-y-2">
            <div v-for="m in members" :key="m.id" class="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">
              <div class="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[12px] font-semibold shrink-0">
                {{ ((m.firstName?.[0] || '') + (m.lastName?.[0] || '')).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-slate-900 truncate">{{ m.firstName }} {{ m.lastName }}</p>
                <p class="text-[12px] text-slate-500 truncate">{{ m.email }}</p>
              </div>
              <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0" :class="m.roleCode === 'ORGANISATEUR' ? 'bg-primary-light text-primary' : 'bg-slate-100 text-slate-600'">
                {{ roleLabel(m.roleCode) }}
              </span>
              <span v-if="!m.active" class="text-[11px] font-semibold text-error shrink-0">retiré</span>
            </div>
          </div>

          <button
            class="mt-4 h-9 px-4 rounded-lg bg-primary text-white text-[12px] font-semibold inline-flex items-center gap-1.5 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all"
            @click="seeEvents(o)"
          >
            <span class="material-symbols-outlined text-[16px]">event</span>
            Voir les événements de cette organisation
          </button>
        </template>
      </div>
    </div>

    <div v-if="!loading && orgs.length === 0" class="bg-white border border-slate-200 rounded-xl py-16 text-center shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-primary-light mx-auto flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-primary text-[28px]">domain_off</span>
      </div>
      <p class="font-semibold text-slate-900">Aucune organisation</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  listOrganizations,
  toggleOrganizationActive,
  type AdminOrganization,
} from '../../api/admin'
import { listMembers, type OrgMember } from '../../api/organization'

const router = useRouter()
const orgs = ref<AdminOrganization[]>([])
const loading = ref(true)
const busyId = ref<number | null>(null)
const expandedId = ref<number | null>(null)
const members = ref<OrgMember[]>([])
const membersLoading = ref(false)

async function load() {
  loading.value = true
  try {
    orgs.value = await listOrganizations()
  } finally {
    loading.value = false
  }
}

async function onToggleActive(o: AdminOrganization) {
  busyId.value = o.id
  try {
    const updated = await toggleOrganizationActive(o.id)
    o.active = updated.active
  } finally {
    busyId.value = null
  }
}

async function toggleExpand(o: AdminOrganization) {
  if (expandedId.value === o.id) {
    expandedId.value = null
    return
  }
  expandedId.value = o.id
  members.value = []
  membersLoading.value = true
  try {
    members.value = await listMembers(o.id)
  } catch {
    members.value = []
  } finally {
    membersLoading.value = false
  }
}

function seeEvents(o: AdminOrganization) {
  router.push({ path: '/dashboard/admin/events', query: { orgId: String(o.id) } })
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

onMounted(load)
</script>