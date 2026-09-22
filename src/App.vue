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
  // Pages publiques (landing, login, invitation publique) : aucune session
  // n'est nécessaire — on ne tente PAS de restore(). Sinon, un visiteur avec
  // un cookie de refresh absent/expiré déclenchait un POST /auth/refresh
  // voué à l'échec et voyait un toast « Refresh token invalide » sur la
  // landing, pour rien. (Même règle que le garde du routeur.)
  const name = router.currentRoute.value.name
  const isPublic = ['login', 'landing', 'public-invitation'].includes(name as string)
  if (isPublic) return

  if (!auth.restored) {
    auth.restore().finally(() => {
      const current = router.currentRoute.value.name
      const stillPublic = ['login', 'landing', 'public-invitation'].includes(current as string)
      if (!auth.isAuthenticated && !stillPublic) {
        router.push({ name: 'login' })
      }
    })
  }
})
</script>
