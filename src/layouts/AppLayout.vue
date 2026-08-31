<template>
  <div class="flex h-full w-full overflow-hidden">
    <Sidebar @create="createNew" />
    <div class="flex-1 flex flex-col min-w-0 h-full">
      <Header />
      <!-- pb-24 : laisse la place à la BottomNav (mobile) pour ne pas couper
           la fin des tableaux ; md+ n'a pas de BottomNav. -->
      <main class="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
        <div class="mx-auto max-w-content">
          <router-view />
        </div>
      </main>
    </div>
  </div>

  <BottomNav />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Sidebar from '../components/layout/Sidebar.vue'
import Header from '../components/layout/Header.vue'
import BottomNav from '../components/layout/BottomNav.vue'

const router = useRouter()

// Le bouton "Créer un nouvel évenement" de la sidebar ouvre le dialogue sur la
// page "Mes évenements" via une query. EventsView l'ouvre si ?new=1 est présent.
function createNew() {
  router.push('/dashboard/events?new=1')
}
</script>
