<template>
  <div class="flex h-full w-full overflow-hidden">
    <Sidebar @create="createNew" />
    <div class="flex-1 flex flex-col min-w-0 h-full">
      <Header @menu="menuOpen = true" />
      <main class="flex-1 overflow-y-auto p-4 md:p-4">
        <div class="mx-auto max-w-content">
          <router-view />
        </div>
      </main>
    </div>
  </div>

  <!-- Drawer mobile -->
  <div v-if="menuOpen" class="md:hidden fixed inset-0 bg-black/40 z-40" @click="menuOpen = false">
    <div class="w-4/5 max-w-[300px] h-full bg-white" @click.stop>
      <Sidebar @create="createNew" />
    </div>
  </div>

  <BottomNav />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../components/layout/Sidebar.vue'
import Header from '../components/layout/Header.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

// Le bouton "Créer un nouvel évenement" de la sidebar ouvre le dialogue sur la
// page "Mes évenements" via une query. EventsView l'ouvre si ?new=1 est présent.
function createNew() {
  router.push('/dashboard/events?new=1')
  menuOpen.value = false
}
</script>
