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

          <!-- Réglages de l'organisation (override du réglage global) -->
          <div class="mt-5 pt-4 border-t border-slate-200">
            <p class="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-3">Réglages de l'organisation</p>
            <div v-if="st(o).loading" class="text-sm text-slate-400 py-1">Chargement des réglages…</div>
            <div v-else class="grid sm:grid-cols-2 gap-3">
              <!-- Création d'événements -->
              <div class="bg-white border border-slate-200 rounded-lg p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[13px] font-semibold text-slate-900">Création d'événements</p>
                    <p class="text-[11.5px] mt-0.5" :class="st(o).eventEffective ? 'text-success' : 'text-error'">
                      {{ st(o).eventEffective ? 'Autorisée' : 'Interdite' }}
                      <span class="text-slate-400">· {{ st(o).eventOverride === null ? 'hérité du global' : 'réglage spécifique' }}</span>
                    </p>
                    <p v-if="st(o).error" class="text-[11.5px] text-error mt-1">{{ st(o).error }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      v-if="st(o).eventOverride !== null"
                      :disabled="st(o).busy"
                      title="Rétablir l'héritage du réglage global"
                      class="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-primary hover:bg-primary-light transition-colors disabled:opacity-40"
                      @click="applyOrgSetting(o, 'event', 'inherit')"
                    >
                      <span class="material-symbols-outlined text-[16px]">restart_alt</span>
                    </button>
                    <label class="toggle" :class="{ 'toggle-disabled': st(o).busy }">
                      <input
                        type="checkbox"
                        class="toggle-input"
                        :checked="st(o).eventEffective"
                        :disabled="st(o).busy"
                        @change="toggleOrgEventCreation(o)"
                      />
                      <span class="toggle-track"><span class="toggle-thumb" /></span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Envoi WhatsApp -->
              <div class="bg-white border border-slate-200 rounded-lg p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[13px] font-semibold text-slate-900">Envoi WhatsApp</p>
                    <p class="text-[11.5px] mt-0.5" :class="st(o).whatsappEffective ? 'text-success' : 'text-error'">
                      {{ st(o).whatsappEffective ? 'Autorisé' : 'Interdit' }}
                      <span class="text-slate-400">· {{ st(o).whatsappOverride === null ? 'hérité du global' : 'réglage spécifique' }}</span>
                    </p>
                    <p v-if="st(o).error" class="text-[11.5px] text-error mt-1">{{ st(o).error }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      v-if="st(o).whatsappOverride !== null"
                      :disabled="st(o).busy"
                      title="Rétablir l'héritage du réglage global"
                      class="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-primary hover:bg-primary-light transition-colors disabled:opacity-40"
                      @click="applyOrgSetting(o, 'whatsapp', 'inherit')"
                    >
                      <span class="material-symbols-outlined text-[16px]">restart_alt</span>
                    </button>
                    <label class="toggle" :class="{ 'toggle-disabled': st(o).busy }">
                      <input
                        type="checkbox"
                        class="toggle-input"
                        :checked="st(o).whatsappEffective"
                        :disabled="st(o).busy"
                        @change="toggleOrgWhatsapp(o)"
                      />
                      <span class="toggle-track"><span class="toggle-thumb" /></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="!loading && loadErr" class="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-error-light mx-auto flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-error text-[28px]">cloud_off</span>
      </div>
      <p class="font-semibold text-slate-900">Erreur de chargement</p>
      <p class="text-sm text-slate-500 mt-1">Le serveur a répondu une erreur interne. Vérifiez que le backend à jour est déployé, puis réessayez.</p>
      <button class="mt-4 h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-colors" @click="load">
        Réessayer
      </button>
    </div>

    <div v-if="!loading && !loadErr && orgs.length === 0" class="bg-white border border-slate-200 rounded-xl py-16 text-center shadow-sm">
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
import { getOrgSettings, updateOrgSettings } from '../../api/organizationSettings'

const router = useRouter()
const orgs = ref<AdminOrganization[]>([])
const loading = ref(true)
const loadErr = ref(false)
const busyId = ref<number | null>(null)
const expandedId = ref<number | null>(null)
const members = ref<OrgMember[]>([])
const membersLoading = ref(false)

/** Réglages (création événements / WhatsApp) par organisation, avec héritage du global. */
interface OrgSettingsState {
  loading: boolean
  busy: boolean
  error: string
  whatsappOverride: boolean | null
  whatsappEffective: boolean
  eventOverride: boolean | null
  eventEffective: boolean
}
const settingsState = ref<Record<number, OrgSettingsState>>({})

function st(o: AdminOrganization): OrgSettingsState {
  return (
    settingsState.value[o.id] ?? {
      loading: true,
      busy: false,
      error: '',
      whatsappOverride: null,
      whatsappEffective: true,
      eventOverride: null,
      eventEffective: true,
    }
  )
}

async function load() {
  loading.value = true
  loadErr.value = false
  try {
    orgs.value = await listOrganizations()
  } catch {
    loadErr.value = true
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
  // Réglages : état de chargement immédiat, puis valeur réelle.
  settingsState.value[o.id] = {
    loading: true,
    busy: false,
    error: '',
    whatsappOverride: null,
    whatsappEffective: true,
    eventOverride: null,
    eventEffective: true,
  }
  try {
    const s = await getOrgSettings(o.id)
    settingsState.value[o.id] = {
      loading: false,
      busy: false,
      error: '',
      whatsappOverride: s.whatsappEnabled,
      whatsappEffective: s.effectiveWhatsapp,
      eventOverride: s.eventCreationEnabled,
      eventEffective: s.effectiveEventCreation,
    }
  } catch {
    settingsState.value[o.id] = {
      loading: false,
      busy: false,
      error: 'Réglages indisponibles',
      whatsappOverride: null,
      whatsappEffective: true,
      eventOverride: null,
      eventEffective: true,
    }
  }
  try {
    members.value = await listMembers(o.id)
  } catch {
    members.value = []
  } finally {
    membersLoading.value = false
  }
}

/** Applique un réglage d'organisation : true/false = override, 'inherit' = global. */
async function applyOrgSetting(
  o: AdminOrganization,
  key: 'event' | 'whatsapp',
  value: boolean | 'inherit',
) {
  const s = settingsState.value[o.id]
  if (!s) return
  s.busy = true
  s.error = ''
  try {
    const res = await updateOrgSettings(
      o.id,
      key === 'event' ? { eventCreationEnabled: value } : { whatsappEnabled: value },
    )
    s.eventOverride = res.eventCreationEnabled
    s.eventEffective = res.effectiveEventCreation
    s.whatsappOverride = res.whatsappEnabled
    s.whatsappEffective = res.effectiveWhatsapp
  } catch {
    s.error = 'Modification refusée par le serveur'
  } finally {
    s.busy = false
  }
}

function toggleOrgEventCreation(o: AdminOrganization) {
  applyOrgSetting(o, 'event', !st(o).eventEffective)
}

function toggleOrgWhatsapp(o: AdminOrganization) {
  applyOrgSetting(o, 'whatsapp', !st(o).whatsappEffective)
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

<style scoped>
.toggle {
  @apply relative inline-block w-[52px] h-[28px] shrink-0 cursor-pointer select-none;
}
.toggle-disabled {
  @apply cursor-not-allowed opacity-60;
}
.toggle-input {
  @apply hidden;
}
.toggle-track {
  @apply absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-success block;
  background: rgb(226 232 240);
}
.toggle-input:checked + .toggle-track {
  background: rgb(16 185 129);
}
.toggle-thumb {
  @apply absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-transform;
}
.toggle-input:checked ~ .toggle-track .toggle-thumb {
  transform: translateX(24px);
}
</style>