<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Check-in</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Scanner et valider les entrées</p>
        </div>
        <div class="flex items-center gap-3">
          <PermGuard :allow="['CHECKIN_SCAN']">
            <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="qrInput?.focus()">
              <span class="material-symbols-outlined text-[18px]">qr_code_scanner</span> Scanner
            </button>
          </PermGuard>
        </div>
      </div>
    </div>

    <!-- Recherche style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
      <form class="flex gap-3" @submit.prevent="doScan">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[20px]">qr_code</span>
          </span>
          <input ref="qrInput" v-model="qr" placeholder="QR token ou jeton" class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
        <button type="submit" class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </form>
    </div>

    <div v-if="result" class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center gap-4 mb-4">
        <span class="w-12 h-12 rounded-lg bg-primary-light text-primary grid place-items-center text-[24px]">
          <span class="material-symbols-outlined">person</span>
        </span>
        <div>
          <div class="font-bold text-slate-900 text-[15px]">{{ result.guestName }}</div>
          <div class="text-[13px] text-slate-500">Statut: {{ result.invitationStatus }}</div>
          <div class="text-[13px] text-slate-500">Restants: {{ result.remainingAttendees }}</div>
        </div>
      </div>
      <PermGuard :allow="['CHECKIN_CREATE']">
        <button v-if="result.canCheckIn" class="h-10 px-5 rounded-lg bg-secondary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm hover:bg-secondary/90 transition-all" @click="doCheckIn">
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
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
const qrInput = ref<HTMLInputElement | null>(null)
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