import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type NotificationType = 'error' | 'success' | 'info'

export interface Notification {
  id: number
  message: string
  type: NotificationType
  duration?: number
}

let counter = 0

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])

  const push = (message: string, type: NotificationType = 'error', duration = 4000) => {
    const id = ++counter
    items.value.push({ id, message, type, duration })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }

  const remove = (id: number) => {
    const idx = items.value.findIndex((n) => n.id === id)
    if (idx >= 0) items.value.splice(idx, 1)
  }

  const clear = () => {
    items.value = []
  }

  return { items, push, remove, clear }
})
