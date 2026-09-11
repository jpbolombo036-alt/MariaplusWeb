<template>
  <div>
    <!-- Statistiques plateforme -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center mb-3">
          <span class="material-symbols-outlined text-primary text-[22px]">group</span>
        </div>
        <p class="text-[13px] text-slate-500">Utilisateurs</p>
        <p class="text-2xl font-bold text-slate-900">{{ stats.users < 0 ? '…' : stats.users }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="w-11 h-11 rounded-lg bg-success-light flex items-center justify-center mb-3">
          <span class="material-symbols-outlined text-success text-[22px]">corporate_fare</span>
        </div>
        <p class="text-[13px] text-slate-500">Organisations</p>
        <p class="text-2xl font-bold text-slate-900">{{ stats.orgs < 0 ? '…' : stats.orgs }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="w-11 h-11 rounded-lg bg-attention-light flex items-center justify-center mb-3">
          <span class="material-symbols-outlined text-attention text-[22px]">event</span>
        </div>
        <p class="text-[13px] text-slate-500">Événements</p>
        <p class="text-2xl font-bold text-slate-900">{{ stats.events < 0 ? '…' : stats.events }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="w-11 h-11 rounded-lg flex items-center justify-center mb-3" :class="settings?.whatsappSendingEnabled ? 'bg-success-light' : 'bg-error-light'">
          <span class="material-symbols-outlined text-[22px]" :class="settings?.whatsappSendingEnabled ? 'text-success' : 'text-error'">chat</span>
        </div>
        <p class="text-[13px] text-slate-500">Envoi WhatsApp</p>
        <p class="text-lg font-bold" :class="settings?.whatsappSendingEnabled ? 'text-success' : 'text-error'">
          {{ settings === null ? '…' : settings.whatsappSendingEnabled ? 'Activé' : 'Désactivé' }}
        </p>
      </div>
    </div>

    <p v-if="loadErr" class="text-sm text-error inline-flex items-center gap-1 mb-4">
      <span class="material-symbols-outlined text-[16px]">error</span>
      Erreur lors du chargement des statistiques (droits insuffisants ou serveur injoignable).
    </p>

    <!-- Raccourcis -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <router-link
        v-for="q in quickLinks"
        :key="q.to"
        :to="q.to"
        class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-primary/40 hover:shadow transition-all group"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-[22px]">{{ q.icon }}</span>
            <span class="text-[14px] font-semibold text-slate-900">{{ q.label }}</span>
          </div>
          <span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[20px]">arrow_forward</span>
        </div>
        <p class="text-[12px] text-slate-500 mt-2">{{ q.hint }}</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  listUsers,
  listOrganizations,
  listAllEvents,
  getWhatsappSettings,
  type WhatsappSettings,
} from '../../api/admin'

const stats = reactive({ users: -1, orgs: -1, events: -1 })
const settings = ref<WhatsappSettings | null>(null)
const loadErr = ref(false)

const quickLinks = [
  { label: 'Gérer les utilisateurs', icon: 'manage_accounts', to: '/dashboard/admin/users', hint: 'Activer, désactiver, supprimer des comptes.' },
  { label: 'Organisations', icon: 'corporate_fare', to: '/dashboard/admin/organizations', hint: 'Organisateurs, membres et leurs événements.' },
  { label: 'Tous les événements', icon: 'event', to: '/dashboard/admin/events', hint: 'Vue plateforme, filtrable par organisation.' },
  { label: 'Réglages WhatsApp', icon: 'tune', to: '/dashboard/settings', hint: "Interrupteur global et plafond de relances." },
]

onMounted(async () => {
  loadErr.value = false
  // totalElements suffit : on ne charge qu'une page vide (size=1).
  const jobs = [
    listUsers(0, 1).then((p) => { stats.users = p.totalElements }),
    listOrganizations().then((o) => { stats.orgs = o.length }),
    listAllEvents(0, 1).then((p) => { stats.events = p.totalElements }),
    getWhatsappSettings().then((s) => { settings.value = s }),
  ]
  const results = await Promise.allSettled(jobs)
  if (results.some((r) => r.status === 'rejected')) loadErr.value = true
})
</script>