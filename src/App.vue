<template>
  <router-view />
  <Toast />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notifications'
import router from './router'
import Toast from './components/common/Toast.vue'

const auth = useAuthStore()
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

onMounted(() => {
  if (!auth.restored) {
    auth.restore().finally(() => {
      const name = router.currentRoute.value.name
      const isPublic = ['login', 'landing', 'public-invitation'].includes(name as string)
      if (!auth.isAuthenticated && !isPublic) {
        router.push({ name: 'login' })
      }
    })
  }
})
</script>
