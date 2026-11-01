<template>
  <router-view :key="pageKey" />
  <Toast />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useNotificationStore } from './stores/notifications'
import Toast from './components/common/Toast.vue'

const notifications = useNotificationStore()
const route = useRoute()
// Les pages publiques et l'accueil agent capturent leur token/id au montage.
// Le layout dashboard reste monté lorsqu'on change d'événement ou d'onglet.
const pageKey = computed(() => route.matched[0]?.path === '/dashboard' ? '/dashboard' : route.path)

// Sur expiration de session (interceptor refresh) : notifier l'utilisateur.
// Enregistré une seule fois au setup et retiré au démontage — la redirection
// vers le login est gérée par le listener homologue de main.ts.
function onSessionExpired() {
  notifications.push('Votre session a expiré. Veuillez vous reconnecter.', 'error')
}
window.addEventListener('mp:session-expired', onSessionExpired)
onBeforeUnmount(() => {
  window.removeEventListener('mp:session-expired', onSessionExpired)
})

</script>
