<template>
  <div>
    <h2 class="text-lg font-bold text-on-surface mb-4">Check-in</h2>
    <form class="flex gap-2 mb-4" @submit.prevent="doScan">
      <input v-model="qr" placeholder="QR token ou jeton" class="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary" />
      <button class="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-semibold">Scanner</button>
    </form>

    <div v-if="result" class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
      <div class="font-bold text-on-surface">{{ result.guestName }}</div>
      <div class="text-sm text-on-surface-variant">Statut: {{ result.invitationStatus }}</div>
      <div class="text-sm text-on-surface-variant">Restants: {{ result.remainingAttendees }}</div>
      <PermGuard :allow="['CHECKIN_CREATE']">
        <button v-if="result.canCheckIn" class="mt-3 px-4 py-2 rounded-lg bg-secondary text-white font-semibold" @click="doCheckIn">
          Valider l'entrée
        </button>
      </PermGuard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { scan, checkIn, type CheckInScan } from '../../api/checkin'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const qr = ref('')
const result = ref<CheckInScan | null>(null)

async function doScan() {
  result.value = await scan(qr.value, id)
}
async function doCheckIn() {
  if (!qr.value) return
  await checkIn(qr.value, id, 1)
  result.value = await scan(qr.value, id)
}
</script>
