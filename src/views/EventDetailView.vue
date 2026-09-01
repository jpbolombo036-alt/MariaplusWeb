<template>
  <div v-if="loading" class="text-on-surface-variant">Chargement…</div>
  <div v-else-if="!event" class="text-error">Événement introuvable</div>

  <div v-else>
    <!-- Carrousel photos : couverture / couple / marié / mariée -->
    <div v-if="photos.length" class="relative rounded-2xl overflow-hidden mb-1">
      <div
        ref="carouselEl"
        class="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        @scroll.passive="onScroll"
      >
        <img
          v-for="(p, idx) in photos"
          :key="idx"
          :src="absolutePhotoUrl(p)"
          class="w-full h-64 md:h-80 object-cover snap-center shrink-0"
          alt=""
        />
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
      <div v-if="photos.length > 1" class="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
        <button
          v-for="(p, idx) in photos"
          :key="idx"
          type="button"
          class="w-2 h-2 rounded-full transition-all"
          :class="idx === activeSlide ? 'bg-white w-4' : 'bg-white/50'"
          @click="scrollTo(idx)"
        />
      </div>
      <div class="absolute bottom-10 left-4 right-4 text-white">
        <div class="flex items-center gap-2 text-xs font-semibold">
          <span class="px-2 py-0.5 rounded-full bg-white/20">{{ event.type }}</span>
          <StatusBadge :status="event.status" />
        </div>
        <h1 class="mt-2 text-2xl md:text-3xl font-bold">{{ event.weddingDetails?.displayName || event.name || 'Événement' }}</h1>
      </div>
    </div>

    <!-- Actions (Modifier / Publier) -->
    <div class="mt-3 flex gap-2">
      <PermGuard :allow="['EVENT_UPDATE']">
        <button class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-semibold">Modifier</button>
      </PermGuard>
      <PermGuard :allow="['EVENT_PUBLISH']">
        <button class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-semibold" @click="publish">Publier</button>
      </PermGuard>
    </div>

    <!-- Tabs (selon permission) -->
    <div class="mt-5 flex gap-1 overflow-x-auto border-b border-outline-variant">
      <router-link
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="px-4 py-2 text-sm font-medium whitespace-nowrap text-on-surface-variant"
        active-class="!text-primary border-b-2 border-primary"
      >
        {{ tab.label }}
      </router-link>
    </div>

    <div class="mt-5">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getEvent, updateEventStatus, loadEventImage, absolutePhotoUrl, type Event } from '../api/events'
import StatusBadge from '../components/common/StatusBadge.vue'
import PermGuard from '../components/common/PermGuard.vue'
import { useAuthStore } from '../stores/auth'
import { Perm } from '../permissions'

const route = useRoute()
const auth = useAuthStore()
const event = ref<Event | null>(null)
const loading = ref(true)

const eventId = Number(route.params.id)

/* --- Carrousel photos : couverture / couple / marié / mariée --- */
const carouselEl = ref<HTMLElement | null>(null)
const activeSlide = ref(0)
const coverUrl = ref<string | null>(null)

const photos = computed<string[]>(() => {
  const list: (string | null | undefined)[] = [
    coverUrl.value,
    event.value?.weddingDetails?.couplePhotoUrl,
    event.value?.weddingDetails?.groomPhotoUrl,
    event.value?.weddingDetails?.bridePhotoUrl,
  ]
  return list.filter((u): u is string => !!u && u.trim() !== '')
})

function onScroll() {
  const el = carouselEl.value
  if (!el) return
  activeSlide.value = Math.round(el.scrollLeft / el.clientWidth)
}
function scrollTo(idx: number) {
  const el = carouselEl.value
  if (!el) return
  el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
}

/* --- Défilement automatique (4 s, en boucle) --- */
const AUTOPLAY_MS = 4000
let autoTimer: number | null = null

function startAutoplay() {
  stopAutoplay()
  if (photos.value.length < 2) return
  autoTimer = window.setInterval(() => {
    const el = carouselEl.value
    if (!el) return
    const next = (activeSlide.value + 1) % photos.value.length
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }, AUTOPLAY_MS)
}
function stopAutoplay() {
  if (autoTimer !== null) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

onMounted(load)
async function load() {
  try {
    event.value = await getEvent(eventId)
    if (event.value?.hasImage) {
      coverUrl.value = await loadEventImage(eventId)
    }
    startAutoplay()
  } catch {
    event.value = null
  } finally {
    loading.value = false
  }
}
onBeforeUnmount(stopAutoplay)

async function publish() {
  try {
    event.value = await updateEventStatus(eventId, 'PUBLISHED')
  } catch {
    /* ignoré */
  }
}

const kind = (s: string) => `${s}`

const tabs = computed(() => {
  const id = eventId
  const list: { label: string; to: string }[] = []
  if (auth.can([Perm.dashboardView, Perm.statisticsView])) list.push({ label: 'Vue générale', to: `/dashboard/events/${id}` })
  if (auth.can([Perm.guestView])) list.push({ label: 'Invités', to: `/dashboard/events/${id}/guests` })
  if (auth.can([Perm.guestView])) list.push({ label: 'Catégories', to: `/dashboard/events/${id}/categories` })
  if (auth.can([Perm.invitationView])) list.push({ label: 'Invitations', to: `/dashboard/events/${id}/invitations` })
  if (auth.can([Perm.rsvpView])) list.push({ label: 'RSVP', to: `/dashboard/events/${id}/rsvp` })
  if (auth.can([Perm.checkinView])) list.push({ label: 'Check-in', to: `/dashboard/events/${id}/checkin` })
  if (auth.can([Perm.tableView])) list.push({ label: 'Tables', to: `/dashboard/events/${id}/tables` })
  if (auth.can([Perm.drinkView])) list.push({ label: 'Boissons', to: `/dashboard/events/${id}/drinks` })
  if (auth.can([Perm.eventView])) list.push({ label: 'Événements', to: `/dashboard/events/${id}/internal-events` })
  if (auth.can([Perm.statisticsView])) list.push({ label: 'Statistiques', to: `/dashboard/events/${id}/statistics` })
  return list
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
