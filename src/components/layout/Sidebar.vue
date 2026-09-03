<template>
  <aside
    class="hidden md:flex flex-col bg-slate-100 border-r border-slate-200 h-full shrink-0"
    style="width:280px"
  >
    <!-- Logo -->
    <div class="px-6 pt-6 pb-5">
      <div class="flex items-center gap-3.5">
        <span class="w-10 h-10 rounded-lg overflow-hidden grid place-items-center shrink-0 bg-slate-50 border border-slate-200">
          <img src="/logo.png" alt="EventiaEasy" class="w-full h-full object-contain" />
        </span>
        <div class="leading-none min-w-0">
          <div style="font-size:22px" class="font-bold text-slate-900 tracking-tight">Eventia<span class="text-primary">Easy</span></div>
          <div style="font-size:12px" class="text-slate-500 mt-0.5 font-medium truncate">Event Management</div>
        </div>
      </div>
    </div>

    <!-- Menu -->
    <nav class="flex-1 flex flex-col px-4 pt-3 gap-1 overflow-y-auto">
      <router-link
        v-for="item in generalItems"
        :key="item.label"
        :to="item.to"
        :title="item.label"
        class="flex items-center gap-3.5 px-3.5 rounded-lg font-medium transition-all duration-200"
        :class="[isActive(item.match) ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-slate-700 hover:bg-white hover:text-slate-900']"
        style="height:44px;font-size:15px"
      >
        <span class="material-symbols-outlined" style="font-size:26px">{{ item.icon }}</span>
        <span class="truncate">{{ item.label }}</span>
      </router-link>

      <template v-if="sectionItems.length">
        <p class="px-3.5 pt-7 pb-2.5 font-bold uppercase tracking-widest text-slate-500" style="font-size:11px">Gestion de l'événement</p>

        <router-link
          v-for="item in sectionItems"
          :key="item.label"
          :to="sectionRoute(item.section)"
          :title="item.label"
          class="flex items-center gap-3.5 rounded-lg font-medium transition-all duration-200"
          :class="[isSectionActive(item.section) ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-slate-700 hover:bg-white hover:text-slate-900']"
          style="height:44px;font-size:15px;padding-left:14px;padding-right:16px"
        >
        <span class="material-symbols-outlined" style="font-size:26px">{{ item.icon }}</span>
        <span class="truncate">{{ item.label }}</span>
      </router-link>
    </template>

    <template>
      <p class="px-3.5 pt-7 pb-2.5 font-bold uppercase tracking-widest text-slate-400" style="font-size:11px">Bientôt</p>
      <div
        v-for="item in soonItems"
        :key="item.label"
        class="flex items-center gap-3.5 px-3.5 rounded-lg font-medium text-slate-500 cursor-not-allowed"
        style="height:44px;font-size:15px"
      >
        <span class="material-symbols-outlined" style="font-size:26px">{{ item.icon }}</span>
        {{ item.label }}
      </div>
    </template>

    <template>
      <p class="px-3.5 pt-7 pb-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Bientôt</p>
      <div
        v-for="item in soonItems"
        :key="item.label"
        class="flex items-center gap-3.5 px-3.5 h-11 rounded-lg text-[15px] font-medium text-slate-500 cursor-not-allowed"
      >
        <span class="material-symbols-outlined text-[26px]">{{ item.icon }}</span>
        {{ item.label }}
      </div>
    </template>
    </nav>

    <!-- Profil -->
    <div class="px-4 py-3.5 border-t border-slate-200">
      <router-link to="/dashboard/profile" class="flex items-center gap-3.5" title="Mon profil">
        <span class="w-10 h-10 rounded-lg bg-primary text-white grid place-items-center overflow-hidden shrink-0" style="font-size:14px">
          {{ initials }}
        </span>
        <div class="min-w-0 leading-tight flex-1">
          <div style="font-size:14px" class="font-semibold text-slate-700 truncate">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</div>
          <div style="font-size:11px" class="font-semibold text-primary uppercase tracking-wide">{{ roleLabel }}</div>
        </div>
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useWeddingStore } from '../../stores/wedding'
import { hasAny, Perm } from '../../permissions'
import { filterNav, type NavSection } from '../../navigation'

const auth = useAuthStore()
const weddingStore = useWeddingStore()
const route = useRoute()

const canCreate = computed(() => hasAny(auth.permissions, Perm.weddingCreate))

// Un rôle peut accéder à la liste des événements dès qu'il possède AU MOINS une
// permission liée à un événement. NB : WEDDING_VIEW seul ne suffit pas car les
// rôles opérationnels (AGENT_ACCUEIL, GESTIONNAIRE_INVITES) ne l'ont pas —
// ils ont en revanche GUEST_VIEW / CHECKIN_VIEW / INVITATION_VIEW / EVENT_VIEW.
const canAccessEvents = computed(() =>
  hasAny(
    auth.permissions,
    Perm.weddingView,
    Perm.eventView,
    Perm.guestView,
    Perm.invitationView,
    Perm.rsvpView,
    Perm.checkinView,
    Perm.tableView,
    Perm.drinkView,
    Perm.statisticsView,
  ),
)

// Libellé du rôle réel (jamais codé en dur) pour le badge sous le nom.
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORGANISATEUR: 'Organisateur',
  GESTIONNAIRE_INVITES: 'Gestionnaire d’invités',
  AGENT_ACCUEIL: 'Agent d’accueil',
}
const roleLabel = computed(() => {
  const role = (auth.user?.roles ?? [])[0]
  return ROLE_LABELS[role] ?? role ?? 'Membre'
})

const initials = computed(() => {
  const first = auth.user?.firstName || ''
  const last = auth.user?.lastName || ''
  return (first[0] + (last[0] || '')).toUpperCase()
})

// Entrées générales (hors mariage) — filtrées par permissions.
const generalItems = computed(() => {
  const items: Array<{ label: string; icon: string; to: string; match: string; perm: string }> = [
    { label: 'Dashboard', icon: 'grid_view', to: '/dashboard', match: '/dashboard', perm: Perm.dashboardView },
  ]
  if (canAccessEvents.value) {
    items.push({ label: 'Événements', icon: 'calendar_month', to: '/dashboard/events', match: '/dashboard/events', perm: Perm.eventView })
  }
  if (hasAny(auth.permissions, Perm.organizationManageMembers)) {
    items.push({ label: 'Équipe', icon: 'manage_accounts', to: '/dashboard/members', match: '/dashboard/members', perm: Perm.organizationManageMembers })
  }
  return items
})

// Entrées liées à l'événement actif (onglets du mariage sélectionné).
const sectionItems = computed(() =>
  filterNav(auth.permissions).filter((e) => e.section) as Array<{ label: string; icon: string; section: NavSection }>,
)

const soonItems = [
  { label: 'Prestataires', icon: 'handyman' },
  { label: 'Budget', icon: 'account_balance_wallet' },
  { label: 'Messages', icon: 'mail' },
]

function sectionRoute(section: NavSection): string {
  return weddingStore.activeId
    ? `/dashboard/events/${weddingStore.activeId}/${section}`
    : '/dashboard/events'
}

function isSectionActive(section: NavSection): boolean {
  const id = weddingStore.activeId
  if (!id) return false
  return route.path === `/dashboard/events/${id}/${section}`
}

function isActive(match: string): boolean {
  if (match === '/dashboard') return route.path === '/dashboard'
  return route.path === match
}

onMounted(() => {
  weddingStore.load()
})
</script>
