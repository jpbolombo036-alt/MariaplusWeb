<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Équipe & Membres</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Affectez vos gestionnaires d'invités et agents d'accueil à un mariage précis.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="auth.can([Perm.organizationManageMembers])"
            @click="$router.push('/dashboard/members/new')"
            class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all"
          >
            <span class="material-symbols-outlined text-[18px]">person_add</span>
            Ajouter un membre
          </button>
        </div>
      </div>
    </div>

    <!-- 4 cartes statistiques -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div class="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-primary text-[24px]">group</span>
        </div>
        <div>
          <p class="text-[13px] text-slate-500">Membres</p>
          <p class="text-2xl font-bold text-slate-900">{{ members.length }}</p>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-lg bg-success-light flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-success text-[24px]">how_to_reg</span>
        </div>
        <div>
          <p class="text-[13px] text-slate-500">Gestionnaires d'invités</p>
          <p class="text-2xl font-bold text-slate-900">{{ countRole('GESTIONNAIRE_INVITES') }}</p>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-lg bg-attention-light flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-attention text-[24px]">badge</span>
        </div>
        <div>
          <p class="text-[13px] text-slate-500">Agents d'accueil</p>
          <p class="text-2xl font-bold text-slate-900">{{ countRole('AGENT_ACCUEIL') }}</p>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-lg bg-error-light flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-error text-[24px]">event</span>
        </div>
        <div>
          <p class="text-[13px] text-slate-500">Affectations à un mariage</p>
          <p class="text-2xl font-bold text-slate-900">{{ members.filter((m) => m.eventId != null).length }}</p>
        </div>
      </div>
    </div>

    <!-- Liste des membres -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div class="px-6 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-[18px] font-bold text-slate-900">Liste des membres</h2>
        <span class="text-[13px] text-slate-500">{{ members.length }} membre(s)</span>
      </div>

      <div v-if="loading" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

      <div v-else-if="members.length === 0" class="py-16 text-center">
        <div class="w-14 h-14 rounded-2xl bg-primary-light mx-auto flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-primary text-[28px]">group_off</span>
        </div>
        <p class="font-semibold text-slate-900">Aucun membre</p>
        <p class="text-sm text-slate-500 mt-1">Ajoutez un gestionnaire d'invités et affectez-le à un mariage.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/80 text-[13px] font-semibold text-slate-500">
              <th class="py-3.5 px-4">Membre</th>
              <th class="py-3.5 px-4">Rôle</th>
              <th class="py-3.5 px-4">Mariage affecté</th>
              <th class="py-3.5 px-4">Statut</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id" class="border-b border-slate-100 last:border-0 hover:bg-primary-light/30 transition">
              <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    {{ initials(m.firstName, m.lastName) }}
                  </div>
                  <div>
                    <p class="text-[15px] font-semibold text-slate-900">{{ m.firstName }} {{ m.lastName }}</p>
                    <p class="text-[13px] text-slate-500">{{ m.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4">
                <span class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold" :class="roleBadgeClass(m.roleCode)">
                  {{ roleLabel(m.roleCode) }}
                </span>
              </td>
              <td class="py-4 px-4">
                <select
                  v-if="canManage && isAgent(m.roleCode)"
                  :value="m.eventId ?? ''"
                  :disabled="savingId === m.id"
                  @change="onAssign(m, $event)"
                  class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none"
                >
                  <option value="" disabled>Choisir un événement…</option>
                  <option v-for="w in weddings" :key="w.id" :value="w.id">{{ w.weddingDetails?.displayName || w.name }}</option>
                </select>
                <span v-else-if="m.eventId" class="text-sm text-slate-900">{{ weddingName(m.eventId) }}</span>
                <span v-else class="text-sm text-slate-500">—</span>
              </td>
              <td class="py-4 px-4">
                <span class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
                      :class="m.active ? 'bg-success-light text-success' : 'bg-gray-100 text-gray-500'">
                  {{ m.active ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="py-4 px-4 text-right">
                <button
                  v-if="canManage"
                  @click="onRemove(m)"
                  class="p-2 rounded-lg text-slate-400 hover:bg-error-light hover:text-error transition"
                  title="Retirer l'affectation"
                >
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { Perm } from '../permissions'
import { listMembers, removeMember, updateMemberWedding, type OrgMember } from '../api/organization'
import { listEvents, type Event } from '../api/events'
import { initialsOf } from '../utils/initials'

const auth = useAuthStore()

const members = ref<OrgMember[]>([])
const weddings = ref<Event[]>([])
const loading = ref(true)
const savingId = ref<number | null>(null)

const canManage = computed(() => auth.can([Perm.organizationManageMembers]))
const orgId = computed(() => auth.user?.organizationId ?? null)

function initials(first: string, last: string): string {
  return initialsOf(first, last)
}

function countRole(code: string): number {
  return members.value.filter((m) => m.roleCode === code).length
}

function isAgent(code: string): boolean {
  return code === 'GESTIONNAIRE_INVITES' || code === 'AGENT_ACCUEIL'
}

function roleLabel(code: string): string {
  if (code === 'GESTIONNAIRE_INVITES') return "Gestionnaire d'invités"
  if (code === 'ORGANISATEUR') return 'Organisateur'
  return code
}

function roleBadgeClass(code: string): string {
  if (code === 'GESTIONNAIRE_INVITES') return 'bg-primary-light text-primary-dark'
  if (code === 'AGENT_ACCUEIL') return 'bg-primary-light text-primary-dark'
  if (code === 'ORGANISATEUR') return 'bg-success-light text-success'
  return 'bg-gray-100 text-gray-700'
}

function weddingName(id: number): string {
  return weddings.value.find((w) => w.id === id)?.name ?? `Événement #${id}`
}

async function load() {
  loading.value = true
  try {
    weddings.value = await listEvents(undefined, 0, 100)
    if (orgId.value != null) {
      members.value = await listMembers(orgId.value)
    }
  } finally {
    loading.value = false
  }
}

async function onAssign(m: OrgMember, ev: Event) {
  if (orgId.value == null) return
  const eventId = Number((ev.target as HTMLSelectElement).value)
  if (!eventId || eventId === m.eventId) return
  savingId.value = m.id
  try {
    await updateMemberWedding(orgId.value, m.id, eventId)
    await load()
  } finally {
    savingId.value = null
  }
}

async function onRemove(m: OrgMember) {
  if (orgId.value == null) return
  if (!window.confirm(`Retirer ${m.firstName} ${m.lastName} de l'organisation ?`)) return
  await removeMember(orgId.value, m.id)
  await load()
}

onMounted(load)
</script>


