<template>
  <div>
    <!-- En-tête console -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-primary text-white grid place-items-center shrink-0 shadow-lg shadow-primary/25">
          <span class="material-symbols-outlined text-[26px]">admin_panel_settings</span>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Console d'administration</h1>
            <span class="inline-flex items-center rounded-full bg-error-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-error">Super Admin</span>
          </div>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Gestion complète de la plateforme : utilisateurs, organisations, événements et réglages.</p>
        </div>
      </div>

      <!-- Onglets -->
      <nav class="flex items-center gap-2 mt-5 flex-wrap">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="inline-flex items-center gap-2 px-4 h-9 rounded-lg text-[13px] font-semibold transition-all"
          :class="isActive(tab.to) ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'"
        >
          <span class="material-symbols-outlined text-[18px]">{{ tab.icon }}</span>
          {{ tab.label }}
        </router-link>
      </nav>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Perm } from '../../permissions'

const route = useRoute()

const tabs = [
  { label: "Vue d'ensemble", icon: 'dashboard', to: '/dashboard/admin' },
  { label: 'Utilisateurs', icon: 'group', to: '/dashboard/admin/users', perm: Perm.userView },
  { label: 'Organisations', icon: 'corporate_fare', to: '/dashboard/admin/organizations', perm: Perm.organizationView },
  { label: 'Événements', icon: 'event', to: '/dashboard/admin/events', perm: Perm.eventView },
]

function isActive(to: string): boolean {
  return to === '/dashboard/admin' ? route.path === '/dashboard/admin' : route.path.startsWith(to)
}
</script>