<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import router from './router'

const auth = useAuthStore()

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
