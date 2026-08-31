import { defineStore } from 'pinia'
import { listEvents, type Event } from '../api/events'

const STORAGE_KEY = 'mp_active_event'

/**
 * Store partagé de l'événement actif : la sidebar, le dashboard et les écrans
 * métier travaillent tous sur le MÊME événement sélectionné.
 */
export const useWeddingStore = defineStore('wedding', {
  state: () => ({
    weddings: [] as Event[],
    activeId: null as number | null,
    loading: false,
    loaded: false,
  }),
  getters: {
    active(state): Event | null {
      return (
        state.weddings.find((w) => w.id === state.activeId) ??
        state.weddings[0] ??
        null
      )
    },
  },
  actions: {
    setActive(id: number) {
      this.activeId = id
      try {
        sessionStorage.setItem(STORAGE_KEY, String(id))
      } catch {
        /* stockage indisponible */
      }
    },
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        this.weddings = await listEvents()
        const saved = sessionStorage.getItem(STORAGE_KEY)
        const savedId = saved ? Number(saved) : null
        this.activeId =
          savedId && this.weddings.some((w) => w.id === savedId)
            ? savedId
            : (this.weddings[0]?.id ?? null)
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
  },
})
