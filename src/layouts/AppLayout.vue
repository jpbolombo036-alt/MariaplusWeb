<template>
  <div class="flex h-full w-full overflow-hidden">
    <Sidebar @create="createNew" />
    <div class="flex-1 flex flex-col min-w-0 h-full">
      <Header />
      <!-- pb-24 : laisse la place à la BottomNav (mobile) pour ne pas couper
           la fin des tableaux ; md+ n'a pas de BottomNav. -->
      <main class="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
        <div class="mx-auto max-w-content">
          <router-view :key="contentKey" />
        </div>
      </main>
    </div>
  </div>

  <BottomNav />
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '../components/layout/Sidebar.vue'
import Header from '../components/layout/Header.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import { usePlatformStore } from '../stores/platform'
import { useAuthStore } from '../stores/auth'
import { useWeddingStore } from '../stores/wedding'

const router = useRouter()
const route = useRoute()
const platform = usePlatformStore()
const auth = useAuthStore()
const weddingStore = useWeddingStore()

// Les onglets partagent leur en-tête ; un autre événement doit en revanche
// recréer les écrans qui lisent les paramètres au montage.
const contentKey = computed(() => `${route.matched[1]?.path ?? ''}:${route.params.id ?? ''}`)

// Un lien direct et les boutons précédent/suivant définissent aussi la
// sélection de la sidebar. Réappliquer après load() couvre son choix par défaut.
watch(
  () => [route.params.id, weddingStore.loaded, weddingStore.loading] as const,
  ([param]) => {
    const id = Number(param)
    if (auth.isAuthenticated && Number.isSafeInteger(id) && id > 0 && weddingStore.activeId !== id) {
      weddingStore.setActive(id)
    }
  },
  { immediate: true },
)

// Charge une fois par session l'état des réglages publics (ex. création
// d'événements autorisée ?) pour masquer les boutons concernés.
onMounted(() => {
  platform.load()
})

// Le bouton "Créer un nouvel évenement" de la sidebar ouvre le dialogue sur la
// page "Mes évenements" via une query. EventsView l'ouvre si ?new=1 est présent.
function createNew() {
  router.push('/dashboard/events?new=1')
}
</script>
