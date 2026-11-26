import { defineStore } from 'pinia'
import { getVenueModuleStatus } from '../api/venues'
import { invalidateStoreRequests, storeRequestState } from './requestState'

/**
 * État du module « Salles » pour l'organisation connectée (activé par le
 * SUPER_ADMIN). Sert à afficher le menu « Ma salle » et à garder ses routes ;
 * le backend refuse de toute façon (403) quand le module est désactivé.
 */
export const useVenueModuleStore = defineStore('venueModule', {
  state: () => ({
    enabled: false,
    loaded: false,
  }),
  actions: {
    reset() {
      invalidateStoreRequests(this)
      this.$reset()
    },
    async load(force = false) {
      const request = storeRequestState(this)
      if (request.promise && !force) return request.promise
      if (this.loaded && !force) return
      const revision = ++request.revision
      request.promise = (async () => {
        try {
          const enabled = await getVenueModuleStatus()
          if (request.revision === revision) this.enabled = enabled
        } catch {
          // Backend ancien ou réseau : on masque simplement le module.
          if (request.revision === revision) this.enabled = false
        } finally {
          if (request.revision === revision) {
            this.loaded = true
            request.promise = null
          }
        }
      })()
      return request.promise
    },
  },
})
