<template>
  <div class="relative" @click.stop>
    <button
      class="relative text-slate-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-50"
      :title="unreadCount ? `${unreadCount} message(s) non lu(s)` : 'Notifications'"
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
        <span class="text-[13px] font-bold text-slate-800">Messages de l'équipe</span>
        <button v-if="unreadCount" class="text-[12px] font-semibold text-primary hover:underline" @click="readAll">
          Tout marquer comme lu
        </button>
      </div>

      <p v-if="!items.length" class="px-4 py-6 text-center text-[13px] text-slate-500">
        Aucune notification pour le moment.
      </p>
      <ul v-else class="max-h-[26rem] overflow-y-auto divide-y divide-slate-100">
        <li v-for="n in items" :key="n.id">
          <button
            class="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors"
            :class="n.readAt ? '' : 'bg-primary/5'"
            :aria-expanded="expandedId === n.id"
            @click="toggleItem(n)"
          >
            <span class="material-symbols-outlined text-[20px] shrink-0 mt-0.5" :class="isReminder(n) ? 'text-amber-600' : 'text-primary'" aria-hidden="true">
              {{ isReminder(n) ? 'event_upcoming' : n.broadcast ? 'campaign' : 'mail' }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-[13px] text-slate-800 break-words" :class="n.readAt ? 'font-medium' : 'font-bold'">{{ n.title }}</span>
              <span
                class="block text-[12px] text-slate-600 mt-0.5 break-words whitespace-pre-line"
                :class="expandedId === n.id ? '' : 'line-clamp-2'"
              >{{ n.message }}</span>
              <span class="block text-[11px] text-slate-400 mt-1">
                {{ isReminder(n) ? 'Rappel automatique' : n.broadcast ? 'Tous les organisateurs' : 'Équipe EventiaEasy' }} · {{ formatNotificationDate(n.createdAt) }}
              </span>
            </span>
            <span v-if="!n.readAt" class="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" aria-label="Non lue"></span>
          </button>
          <div v-if="expandedId === n.id && isReminder(n)" class="px-4 pb-3 pl-12">
            <button
              v-if="n.eventId"
              class="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold text-primary hover:bg-slate-50 inline-flex items-center gap-1.5"
              @click="openEvent(n.eventId)"
            >
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">open_in_new</span> Ouvrir l'événement
            </button>
          </div>
          <div v-else-if="expandedId === n.id" class="px-4 pb-3 pl-12">
            <p v-if="replySent" class="text-[12px] font-semibold text-success" data-testid="reply-sent">
              Réponse envoyée à l'équipe.
            </p>
            <button
              v-else-if="!replying"
              class="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold text-primary hover:bg-slate-50 inline-flex items-center gap-1.5"
              @click="startReply"
            >
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">reply</span> Répondre
            </button>
            <form v-else @submit.prevent="sendReply(n)">
              <label :for="`reply-${n.id}`" class="sr-only">Votre réponse</label>
              <textarea
                :id="`reply-${n.id}`"
                ref="replyField"
                v-model="reply"
                rows="3"
                maxlength="2000"
                :disabled="sending"
                placeholder="Votre réponse…"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              ></textarea>
              <div class="flex justify-end gap-2 mt-2">
                <button type="button" class="h-8 px-3 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50" :disabled="sending" @click="replying = false">Annuler</button>
                <button type="submit" class="h-8 px-3 rounded-lg bg-primary text-white text-[12px] font-semibold disabled:opacity-50" :disabled="sending || !reply.trim()">
                  {{ sending ? 'Envoi…' : 'Envoyer' }}
                </button>
              </div>
              <p v-if="replyError" class="mt-1 text-[12px] text-error" role="alert">{{ replyError }}</p>
            </form>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  listUserNotifications, markUserNotificationRead, markAllUserNotificationsRead, sendContactMessage,
  type UserNotification,
} from '../../api/adminNotifications'
import { apiErrorMessage } from '../../api/http'
import { useNotificationStore } from '../../stores/notifications'
import { usePolledNotifications } from '../../composables/usePolledNotifications'
import { formatNotificationDate } from '../../utils/notificationDate'

const toasts = useNotificationStore()
const open = ref(false)
const expandedId = ref<number | null>(null)
const replying = ref(false)
const reply = ref('')
const sending = ref(false)
const replySent = ref(false)
const replyError = ref('')
const replyField = ref<HTMLTextAreaElement[] | HTMLTextAreaElement | null>(null)

const { items, unreadCount, refresh, markRead, markAllRead } = usePolledNotifications<UserNotification>({
  list: listUserNotifications,
  markRead: markUserNotificationRead,
  markAllRead: markAllUserNotificationsRead,
})

const router = useRouter()

function isReminder(n: UserNotification) {
  return n.type === 'EVENT_REMINDER'
}

function openEvent(eventId: number) {
  open.value = false
  void router.push(`/dashboard/events/${eventId}`)
}

function resetReply() {
  replying.value = false
  reply.value = ''
  replySent.value = false
  replyError.value = ''
}

function toggle() {
  open.value = !open.value
  if (open.value) void refresh()
}

function toggleItem(n: UserNotification) {
  resetReply()
  expandedId.value = expandedId.value === n.id ? null : n.id
  void markRead(n)
}

function startReply() {
  replying.value = true
  void nextTick(() => {
    const field = Array.isArray(replyField.value) ? replyField.value[0] : replyField.value
    field?.focus()
  })
}

async function sendReply(n: UserNotification) {
  const text = reply.value.trim()
  if (!text || sending.value) return
  sending.value = true
  replyError.value = ''
  try {
    await sendContactMessage(`Réponse à « ${n.title} » :\n${text}`)
    replySent.value = true
    replying.value = false
    reply.value = ''
  } catch (e) {
    replyError.value = apiErrorMessage(e)
  } finally {
    sending.value = false
  }
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
