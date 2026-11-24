<template>
  <div class="relative" @click.stop>
    <button
      class="relative text-slate-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-50"
      :title="unreadCount ? `${unreadCount} notification(s) non lue(s)` : 'Notifications'"
      :aria-label="unreadCount ? `Notifications, ${unreadCount} non lue(s)` : 'Notifications'"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="material-symbols-outlined text-[22px]">notifications</span>
      <span
        v-if="unreadCount"
        data-testid="bell-badge"
        class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold grid place-items-center leading-none"
      >{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
      role="dialog"
      aria-label="Notifications"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span class="text-[13px] font-bold text-slate-800">Notifications</span>
        <button
          v-if="unreadCount"
          class="text-[12px] font-semibold text-primary hover:underline"
          @click="readAll"
        >Tout marquer comme lu</button>
      </div>
      <p v-if="!items.length" class="px-4 py-6 text-center text-[13px] text-slate-500">
        Aucune notification pour le moment.
      </p>
      <ul v-else class="max-h-[26rem] overflow-y-auto divide-y divide-slate-100">
        <li v-for="n in items" :key="n.id">
          <button
            class="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors"
            :class="n.readAt ? '' : 'bg-primary/5'"
            @click="openNotification(n)"
          >
            <span
              class="material-symbols-outlined text-[20px] shrink-0 mt-0.5"
              :class="n.type === 'CONTACT_MESSAGE' ? 'text-primary' : 'text-amber-600'"
              aria-hidden="true"
            >{{ n.type === 'CONTACT_MESSAGE' ? 'mail' : 'domain_add' }}</span>
            <span class="min-w-0 flex-1">
              <span class="block text-[13px] text-slate-800 break-words" :class="n.readAt ? 'font-medium' : 'font-bold'">{{ n.title }}</span>
              <span class="block text-[12px] text-slate-600 mt-0.5 break-words whitespace-pre-line line-clamp-4">{{ n.message }}</span>
              <span class="block text-[11px] text-slate-400 mt-1 truncate">
                {{ n.senderEmail }}<template v-if="n.senderEmail && n.createdAt"> · </template>{{ formatNotificationDate(n.createdAt) }}
              </span>
              <span v-if="n.type === 'CONTACT_MESSAGE' && n.organizationId" class="block text-[11px] font-semibold text-primary mt-1">Répondre →</span>
            </span>
            <span v-if="!n.readAt" class="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" aria-label="Non lue"></span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  listAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead,
  type AdminNotification,
} from '../../api/adminNotifications'
import { apiErrorMessage } from '../../api/http'
import { useNotificationStore } from '../../stores/notifications'
import { usePolledNotifications } from '../../composables/usePolledNotifications'
import { formatNotificationDate } from '../../utils/notificationDate'

const router = useRouter()
const toasts = useNotificationStore()
const open = ref(false)
const { items, unreadCount, refresh, markRead, markAllRead } = usePolledNotifications<AdminNotification>({
  list: listAdminNotifications,
  markRead: markAdminNotificationRead,
  markAllRead: markAllAdminNotificationsRead,
})

function toggle() {
  open.value = !open.value
  if (open.value) void refresh()
}

/** A message opens the reply to its organization; a registration opens the organization. */
async function openNotification(n: AdminNotification) {
  open.value = false
  void markRead(n)
  const query: Record<string, string> = {}
  if (n.organizationId) query[n.type === 'CONTACT_MESSAGE' ? 'write' : 'org'] = String(n.organizationId)
  void router.push({ path: '/dashboard/admin/organizations', query })
}

async function readAll() {
  try {
    await markAllRead()
  } catch (e) {
    toasts.push(apiErrorMessage(e), 'error')
  }
}

function onDocClick() { open.value = false }
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>
