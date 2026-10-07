import { defineStore } from 'pinia'
import { listEvents, type Event } from '../api/events'
import { pickDefaultEventId } from '../utils/eventStatus'

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
    /**
     * Événement actif. Si l'id courant n'est plus valide (ou devient passé),
     * on retombe sur la même cascade de sélection par défaut que `load()`.
     */
    active(state): Event | null {
      if (!state.weddings.length) return null
      const byId = state.weddings.find((w) => w.id === state.activeId)
      if (byId) return byId
      const fallback = pickDefaultEventId(state.weddings, null)
      return state.weddings.find((w) => w.id === fallback) ?? null
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
        // Cascade intelligente : le choix de session n'est honoré que s'il
        // existe encore et n'est ni passé ni annulé ; sinon on prend
        // l'événement à venir le plus pertinent — jamais un événement passé
        // par défaut (sauf si tous le sont).
        this.activeId = pickDefaultEventId(this.weddings, savedId)
        if (this.activeId != null) {
          try {
            sessionStorage.setItem(STORAGE_KEY, String(this.activeId))
          } catch {
            /* stockage indisponible */
          }
        }
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
  },
})
