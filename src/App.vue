<template>
  <router-view />
  <Toast />
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useNotificationStore } from './stores/notifications'
import Toast from './components/common/Toast.vue'

const notifications = useNotificationStore()

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
