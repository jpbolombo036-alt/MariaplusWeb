<template>
  <div>
    <div v-if="!client" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>
    <template v-else>
      <VenuePageHeader :title="client.fullName" :subtitle="client.phone || client.email || 'Client de salle'" back="/dashboard/venue/clients">
        <router-link v-if="auth.can([Perm.bookingManage])" :to="{ path: '/dashboard/venue/bookings/new', query: { clientId: client.id } }" class="v-btn-primary">
          <span class="material-symbols-outlined text-[18px]">add</span>
          Nouvelle réservation
        </router-link>
      </VenuePageHeader>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form class="v-card p-5 space-y-4" @submit.prevent="save">
          <h2 class="text-[16px] font-bold text-slate-900">Fiche</h2>
          <label><span class="v-label">Prénom</span><input v-model.trim="form.firstName" maxlength="100" class="v-input" /></label>
          <label><span class="v-label">Nom *</span><input v-model.trim="form.lastName" required maxlength="100" class="v-input" /></label>
          <label><span class="v-label">Téléphone</span><input v-model.trim="form.phone" type="tel" class="v-input" /></label>
          <label><span class="v-label">Email</span><input v-model.trim="form.email" type="email" class="v-input" /></label>
          <label><span class="v-label">Notes</span><textarea v-model="form.notes" rows="3" maxlength="2000" class="v-input" /></label>
          <div class="flex justify-end"><button class="v-btn-primary" :disabled="busy">Enregistrer</button></div>
        </form>

        <div class="v-card xl:col-span-2">
          <div class="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 class="text-[16px] font-bold text-slate-900">Réservations</h2>
            <span class="text-[12px] text-slate-500">{{ client.bookings?.length ?? 0 }}</span>
          </div>
          <p v-if="!client.bookings?.length" class="px-5 pb-6 text-sm text-slate-500">Aucune réservation pour ce client.</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-slate-50/80"><th class="v-th">Réf.</th><th class="v-th">Date</th><th class="v-th">Salle</th><th class="v-th">Statut</th><th class="v-th text-right">Reste</th></tr></thead>
              <tbody>
                <tr v-for="b in client.bookings" :key="b.id" class="border-t border-slate-100 hover:bg-primary-light/30 cursor-pointer" @click="$router.push(`/dashboard/venue/bookings/${b.id}`)">
                  <td class="v-td font-semibold">{{ b.reference }}</td>
                  <td class="v-td whitespace-nowrap">{{ formatDateTime(b.startAt) }}</td>
                  <td class="v-td">{{ b.venueName }}</td>
                  <td class="v-td"><BookingStatusBadge :status="b.status" /></td>
                  <td class="v-td text-right whitespace-nowrap" :class="b.balance > 0 ? 'text-error font-semibold' : ''">{{ formatMoney(b.balance, b.currency) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import BookingStatusBadge from '../../components/venue/BookingStatusBadge.vue'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notifications'
import { Perm } from '../../permissions'
import { formatDateTime, formatMoney, getVenueClient, updateVenueClient, type VenueClient } from '../../api/venues'

const route = useRoute()
const auth = useAuthStore()
const notify = useNotificationStore()
const id = Number(route.params.clientId)
const client = ref<VenueClient | null>(null)
const busy = ref(false)
const form = reactive({ firstName: '', lastName: '', phone: '', email: '', notes: '' })

async function load() {
  client.value = await getVenueClient(id)
  Object.assign(form, {
    firstName: client.value.firstName ?? '',
    lastName: client.value.lastName,
    phone: client.value.phone ?? '',
    email: client.value.email ?? '',
    notes: client.value.notes ?? '',
  })
}

async function save() {
  busy.value = true
  try {
    await updateVenueClient(id, {
      firstName: form.firstName || undefined,
      lastName: form.lastName,
      phone: form.phone || undefined,
      email: form.email || undefined,
      notes: form.notes || undefined,
    })
    await load()
    notify.push('Client enregistré', 'success')
  } catch { /* message affiché par l'intercepteur */ } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
