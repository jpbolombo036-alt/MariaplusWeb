<template>
  <div class="max-w-md">
    <h1 class="text-display-md font-bold text-on-surface mb-1">Profil</h1>
    <p class="text-on-surface-variant mb-6">Votre compte</p>

    <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
      <div class="flex items-center gap-4">
        <span class="w-14 h-14 rounded-full bg-surface-container grid place-items-center text-2xl">
          {{ auth.user?.firstName?.[0] }}{{ auth.user?.lastName?.[0] }}
        </span>
        <div>
          <div class="font-bold text-on-surface text-lg">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</div>
          <div class="text-sm text-on-surface-variant">{{ auth.user?.email }}</div>
        </div>
      </div>

      <div class="mt-5 space-y-1">
        <div class="text-sm font-semibold text-on-surface-variant">Rôles</div>
        <div v-for="r in auth.roles" :key="r" class="inline-block mr-2 px-2 py-1 rounded-full bg-surface-container text-xs text-on-surface">
          {{ r }}
        </div>
      </div>

      <button class="mt-6 w-full py-2.5 rounded-lg bg-error-container text-error font-semibold" @click="logout">
        Se déconnecter
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>
