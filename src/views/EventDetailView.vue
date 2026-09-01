<template>
  <div v-if="loading" class="text-on-surface-variant">Chargement…</div>
  <div v-else-if="!event" class="text-error">Événement introuvable</div>

  <div v-else>
    <!-- Header canvas -->
    <div class="relative h-64 md:h-80 rounded-2xl overflow-hidden">
      <img v-if="event.weddingDetails?.couplePhotoUrl" :src="event.weddingDetails.couplePhotoUrl" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full bg-surface-container"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div class="absolute bottom-4 left-4 right-4 text-white">
        <div class="flex items-center gap-2 text-xs font-semibold">
          <span class="px-2 py-0.5 rounded-full bg-white/20">{{ event.type }}</span>
          <StatusBadge :status="event.status" />
        </div>
        <h1 class="mt-2 text-2xl md:text-3xl font-bold">{{ event.weddingDetails?.displayName || event.name || 'Événement' }}</h1>
        <div class="flex flex-wrap gap-3 text-sm">
          <span v-if="event.weddingDetails?.couplePhotoUrl || event.name" class="flex items-center gap-1">
            <span class="material-symbols-outlined text-base">event</span>
          </span>
        </div>
        <div class="mt-3 flex gap-2">
          <PermGuard :allow="['EVENT_UPDATE']">
            <button class="px-3 py-1.5 rounded-lg bg-white/90 text-on-surface text-sm font-semibold">Modifier</button>
          </PermGuard>
          <PermGuard :allow="['EVENT_PUBLISH']">
            <button class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-semibold" @click="publish">Publier</button>
          </PermGuard>
        </div>
      </div>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getEvent, updateEventStatus, type Event } from '../api/events'
import StatusBadge from '../components/common/StatusBadge.vue'
import PermGuard from '../components/common/PermGuard.vue'
import { useAuthStore } from '../stores/auth'
import { Perm } from '../permissions'

const route = useRoute()
const auth = useAuthStore()
const event = ref<Event | null>(null)
const loading = ref(true)

const eventId = Number(route.params.id)

onMounted(load)
async function load() {
  try {
    event.value = await getEvent(eventId)
  } catch {
    event.value = null
  } finally {
    loading.value = false
  }
}

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
