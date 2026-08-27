<template>
  <aside class="hidden md:flex flex-col w-sidebar bg-surface-container-lowest border-r border-outline-variant h-full shrink-0">
    <!-- Logo -->
    <div class="px-8 pt-8 pb-6">
      <div class="flex items-center gap-2.5">
        <span class="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-primary/20 grid place-items-center shrink-0">
          <img src="/logo.png" alt="MariagePlus" class="w-full h-full object-contain" />
        </span>
        <div class="leading-none">
          <div style="font-size:21px;font-weight:700;color:#1F2937">Mariage<span style="color:#4B24B5">Plus</span></div>
          <div style="font-size:13px;color:#667085;margin-top:3px">Event Management</div>
        </div>
      </div>
    </div>

    <!-- Bouton créer un événement -->
    <div class="px-8">
      <button
        v-if="canCreate"
        @click="$emit('create')"
        class="w-full h-12 rounded-lg bg-[#4B24B5] text-white inline-flex items-center gap-2 text-[15px] font-semibold shadow-sm shadow-[#4B24B5]/25 hover:bg-[#3f1a99] transition-colors px-5"
      >
        <span class="material-symbols-outlined text-[22px]">add</span>
        <span class="truncate">Créer un nouvel événement</span>
      </button>
    </div>

    <!-- Menu -->
    <nav class="flex-1 flex flex-col px-6 pt-7 gap-1 overflow-y-auto">
      <router-link
        v-for="item in visible"
        v-show="!item.disabled"
        :key="item.label"
        :to="routeFor(item)"
        class="flex items-center gap-3 px-4 h-12 rounded-lg text-[15px] font-medium transition-colors"
        :class="isActive(item.label) ? activeCls : idleCls"
      >
        <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
        {{ item.label }}
      </router-link>
      <div
        v-for="item in visible"
        v-show="item.disabled"
        :key="item.label + '-d'"
        class="flex items-center gap-3 px-4 h-12 rounded-lg text-[15px] font-medium text-on-surface-variant opacity-60 cursor-not-allowed"
      >
        <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
        {{ item.label }}
      </div>
    </nav>

    <!-- Profil -->
    <div class="px-6 py-4 border-t border-outline-variant">
      <div class="flex items-center gap-3">
        <span class="w-12 h-12 rounded-full bg-surface-container grid place-items-center overflow-hidden shrink-0">
          <span class="material-symbols-outlined text-[22px] text-on-surface-variant">account_circle</span>
        </span>
        <div class="min-w-0 leading-tight">
          <div class="text-[15px] font-semibold text-on-surface truncate">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</div>
          <div class="text-[12px] font-semibold text-primary uppercase">Organisateur</div>
        </div>
        <span class="material-symbols-outlined text-on-surface-variant ml-auto" style="font-size:20px">expand_more</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { hasAny } from '../../permissions'
import { listWeddings, type Wedding } from '../../api/weddings'

const emit = defineEmits<{ (e: 'create'): void }>()
const auth = useAuthStore()
const weddings = ref<Wedding[]>([])
const activeWeddingId = computed(() => weddings.value[0]?.id ?? null)
const canCreate = computed(() => hasAny(auth.permissions, 'WEDDING_CREATE'))

const visible = computed(() => {
  const perms = auth.permissions
  const all = [
    { label: 'Dashboard', icon: 'grid_view', to: '/dashboard', perm: ['DASHBOARD_VIEW'] },
    { label: 'Mes Événements', icon: 'calendar_month', to: '/dashboard/events', perm: ['WEDDING_VIEW'] },
    { label: 'Invités', icon: 'group', to: null, perm: ['GUEST_VIEW'], section: true },
    { label: 'Prestataires', icon: 'handyman', to: null, disabled: true },
    { label: 'Budget', icon: 'account_balance_wallet', to: null, disabled: true },
    { label: 'Messages', icon: 'mail', to: null, disabled: true },
    { label: 'Paramètres', icon: 'settings', to: '/profile', perm: ['SETTINGS_VIEW'] },
  ]
  return all.map((e) => ({ ...e, shown: !e.perm || e.perm.some((p) => perms.includes(p)) })).filter((e) => e.shown)
})

function routeFor(item: { to: string | null; section?: boolean }) {
  if (item.to) return item.to
  if (item.section) return activeWeddingId.value ? `/dashboard/events/${activeWeddingId.value}/guests` : '/dashboard/events'
  return '#'
}
function isActive(label: string) {
  return label === 'Mes Événements'
}
const activeCls = '!bg-primary-light !text-primary'
const idleCls = 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'

onMounted(async () => {
  try {
    weddings.value = await listWeddings()
  } catch {
    /* aucune liste */
  }
})
</script>
