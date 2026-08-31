<template>
  <header class="flex items-center gap-4 px-4 md:px-6 h-14 bg-white border-b border-slate-200 shrink-0 relative z-50">
    <span class="material-symbols-outlined md:hidden text-slate-500 cursor-pointer" @click="$emit('menu')">menu</span>

    <!-- Titre de la page courante -->
    <h1 class="text-[15px] font-bold text-slate-800 tracking-tight">{{ pageTitle }}</h1>

    <div class="flex-1"></div>

    <!-- Recherche -->
    <div class="hidden md:flex items-center relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <span class="material-symbols-outlined text-[20px]">search</span>
      </span>
      <input
        placeholder="Rechercher..."
        class="h-9 w-64 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700 placeholder:text-slate-400 transition-all"
      />
    </div>

    <button class="relative text-slate-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-50" title="Notifications">
      <span class="material-symbols-outlined text-[22px]">notifications</span>
      <span class="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-error"></span>
    </button>

    <!-- Toggle sombre/clair -->
    <button
      class="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-50"
      title="Thème"
      @click="toggleTheme"
    >
      <span class="material-symbols-outlined text-[20px]">{{ themeStore.dark ? 'light_mode' : 'dark_mode' }}</span>
    </button>

    <!-- Avatar + menu déroulant -->
    <div class="relative" @click.stop>
      <button
        ref="dropdownButton"
        class="flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-full hover:bg-slate-50 transition-colors"
        @click="menuOpen = !menuOpen"
      >
        <span class="w-8 h-8 rounded-lg bg-primary text-white grid place-items-center text-[12px] font-bold overflow-hidden ring-1 ring-slate-200">
          {{ initials }}
        </span>
        <span class="hidden sm:block text-[13px] font-semibold text-slate-700">{{ auth.user?.firstName }}</span>
        <span class="material-symbols-outlined text-slate-400 text-[18px] transition-transform" :class="menuOpen ? 'rotate-180' : ''">expand_more</span>
      </button>

      <Teleport to="body">
        <div
          v-if="menuOpen"
          class="fixed bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
          :style="{ right: dropdownRight, top: dropdownTop }"
        >
          <div class="px-4 pt-3 pb-2 border-b border-slate-100">
            <div class="text-[13px] font-bold text-slate-800 truncate">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</div>
            <div class="text-[11px] text-slate-500 truncate">{{ auth.user?.email }}</div>
          </div>
          <router-link
            to="/dashboard/profile"
            class="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
            @click="menuOpen = false"
          >
            <span class="material-symbols-outlined text-[18px] text-slate-400">person</span>
            Mon profil
          </router-link>
          <button
            class="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-error hover:bg-error/5 transition-colors border-t border-slate-100"
            @click="doLogout"
          >
            <span class="material-symbols-outlined text-[18px]">logout</span>
            Déconnexion
          </button>
        </div>
      </Teleport>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { initialsOf } from '../../utils/initials'
import { useThemeStore } from '../../stores/theme'

defineEmits<{ (e: 'menu'): void }>()

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const themeStore = useThemeStore()
const dropdownButton = ref<HTMLElement | null>(null)
const dropdownRight = ref('0px')
const dropdownTop = ref('0px')

function updateDropdownPosition() {
  if (!dropdownButton.value) return
  const rect = dropdownButton.value.getBoundingClientRect()
  dropdownRight.value = `${window.innerWidth - rect.right}px`
  dropdownTop.value = `${rect.bottom + 8}px`
}

watch(menuOpen, (open) => {
  if (open) {
    nextTick(() => {
      updateDropdownPosition()
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)
    })
  } else {
    window.removeEventListener('scroll', updateDropdownPosition, true)
    window.removeEventListener('resize', updateDropdownPosition)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})

const TITLES: Array<[string, string]> = [
  ['/dashboard/events/', 'Détail événement'],
  ['/dashboard/events', 'Mes Événements'],
  ['/dashboard/members', 'Équipe'],
  ['/dashboard/profile', 'Mon profil'],
  ['/dashboard', 'Dashboard'],
]

const pageTitle = computed(() => {
  const path = route.path
  const found = TITLES.find(([prefix]) => path === prefix || path.startsWith(prefix))
  return found ? found[1] : 'Dashboard'
})

const initials = computed(() => initialsOf(auth.user?.firstName, auth.user?.lastName || auth.user?.email))

function toggleTheme() {
  themeStore.toggle()
}

function doLogout() {
  menuOpen.value = false
  auth.logout().finally(() => router.push('/login'))
}

function onDocClick() {
  menuOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>
