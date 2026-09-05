<template>
  <router-view />
  <Toast />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notifications'
import router from './router'
import Toast from './components/common/Toast.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()

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

  window.addEventListener('mp:session-expired', () => {
    notifications.push('Votre session a expiré. Veuillez vous reconnecter.', 'error')
  })
})
</script>
