import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface NotificationLike { id: number; readAt: string | null }
export interface NotificationPage<T extends NotificationLike> { unreadCount: number; items: T[] }

const POLL_MS = 60_000

/**
 * Bell state shared by the SUPER_ADMIN and user bells: polls every minute while
 * the tab is visible, refreshes on focus, and keeps optimistic read marks from
 * being overwritten by a poll that started before them.
 */
export function usePolledNotifications<T extends NotificationLike>(api: {
  list: () => Promise<NotificationPage<T>>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}) {
  const items = ref([]) as Ref<T[]>
  const unreadCount = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined
  let revision = 0
  let disposed = false

  async function refresh() {
    if (disposed || document.visibilityState !== 'visible') return
    const current = ++revision
    try {
      const page = await api.list()
      if (disposed || current !== revision) return
      items.value = page.items
      unreadCount.value = page.unreadCount
    } catch { /* Keep the last known list; the next poll retries. */ }
  }

  async function markRead(n: T) {
    if (n.readAt) return
    n.readAt = new Date().toISOString()
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    revision++ // an in-flight poll must not resurrect the unread state
    try { await api.markRead(n.id) } catch { /* the next poll restores the truth */ }
  }

  /** Throws on failure so the caller can report it. */
  async function markAllRead() {
    await api.markAllRead()
    revision++
    const now = new Date().toISOString()
    items.value.forEach((n) => { n.readAt ??= now })
    unreadCount.value = 0
  }

  function onVisibility() { if (document.visibilityState === 'visible') void refresh() }

  onMounted(() => {
    void refresh()
    timer = setInterval(() => { void refresh() }, POLL_MS)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibility)
  })
  onBeforeUnmount(() => {
    disposed = true
    if (timer) clearInterval(timer)
    window.removeEventListener('focus', refresh)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return { items, unreadCount, refresh, markRead, markAllRead }
}
