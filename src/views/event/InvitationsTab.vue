<template>
  <div>
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-on-surface">Invitations</h2>
        <p class="text-sm text-on-surface-variant mt-0.5">{{ invitations.length }} invitation(s)</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="statusFilter" class="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary">
          <option value="">Tous</option>
          <option value="DRAFT">Brouillon</option>
          <option value="GENERATED">Générée</option>
          <option value="SENT">Envoyée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><span class="material-symbols-outlined text-lg">search</span></span>
          <input v-model="query" placeholder="Code ou invité…" class="h-10 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary w-48" />
        </div>
        <PermGuard :allow="['INVITATION_CREATE']">
          <button class="h-10 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:opacity-90 transition" @click="formOpen=true">
            <span class="material-symbols-outlined text-lg">add</span> Inviter
          </button>
        </PermGuard>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement…</p>
    <div v-else-if="filtered.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-surface-container-high grid place-items-center mb-4"><span class="material-symbols-outlined text-3xl text-on-surface-variant">mail</span></div>
      <h3 class="font-semibold text-on-surface">Aucune invitation</h3>
      <p class="text-sm text-on-surface-variant mt-1">Créez une invitation pour un invité puis envoyez-la.</p>
    </div>

    <div v-else class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-container text-left text-on-surface-variant">
          <tr>
            <th class="px-5 py-3.5">Invité</th>
            <th class="px-5 py-3.5">Code</th>
            <th class="px-5 py-3.5">Statut</th>
            <th class="px-5 py-3.5">Relances</th>
            <th class="px-5 py-3.5">Ouvert</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          <tr v-for="i in filtered" :key="i.id" class="text-on-surface hover:bg-surface-container/40">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white shrink-0" :style="{ background: avatarColor(i.id) }">{{ initialsFor(i) }}</span>
                <span>{{ guestNameFor(i) }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5 font-mono text-xs">{{ i.invitationCode }}</td>
            <td class="px-5 py-3.5"><StatusBadge :status="i.status" /></td>
            <td class="px-5 py-3.5">{{ i.reminderCount }}</td>
            <td class="px-5 py-3.5">{{ i.openedAt ? 'Oui' : 'Non' }}</td>
            <td class="px-5 py-3.5 text-right">
              <div class="inline-flex items-center gap-1">
                <PermGuard :allow="['INVITATION_SEND']">
                  <button v-if="i.status==='GENERATED' || i.status==='DRAFT'" class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg inline-flex items-center gap-1" title="Envoyer"><span class="material-symbols-outlined text-base">send</span></button>
                </PermGuard>
                <PermGuard :allow="['INVITATION_RESEND']">
                  <button v-if="i.status==='SENT'" class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg inline-flex items-center gap-1" title="Relancer" @click="resend(i)"><span class="material-symbols-outlined text-base">refresh</span></button>
                </PermGuard>
                <PermGuard :allow="['INVITATION_SEND']">
                  <button v-if="i.status==='SENT' || i.status==='GENERATED' || i.status==='DRAFT'" class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="QR" @click="showQr(i)"><span class="material-symbols-outlined text-base">qr_code</span></button>
                </PermGuard>
                <PermGuard :allow="['INVITATION_CANCEL']">
                  <button v-if="i.status!=='CANCELLED'" class="px-2 py-1 text-amber-500 hover:bg-amber-50 rounded-lg" title="Annuler" @click="cancel(i)"><span class="material-symbols-outlined text-base">block</span></button>
                </PermGuard>
                <PermGuard :allow="['INVITATION_DELETE']">
                  <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(i)"><span class="material-symbols-outlined text-base">delete</span></button>
                </PermGuard>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal création -->
    <div v-if="formOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="formOpen=false">
      <form class="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-6 shadow-2xl" @submit.prevent="doCreate">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-on-surface text-lg">Nouvelle invitation</h3>
          <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="formOpen=false"><span class="material-symbols-outlined">close</span></button>
        </div>
        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Invité *</label>
        <select v-model="selectedGuestId" required class="input mb-4">
          <option :value="null" disabled>Sélectionner un invité</option>
          <option v-for="g in guests" :key="g.id" :value="g.id">{{ g.firstName }} {{ g.lastName }}</option>
        </select>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 h-10 text-on-surface-variant" @click="formOpen=false">Annuler</button>
          <button type="submit" class="px-5 h-10 rounded-lg bg-primary text-on-primary font-semibold">Créer</button>
        </div>
      </form>
    </div>

    <!-- Détail QR -->
    <div v-if="qrOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="qrOpen=false">
      <div class="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm text-center">
        <img v-if="qrDataUri" :src="qrDataUri" class="w-56 h-56 mx-auto" alt="QR" />
        <p class="mt-2 text-sm text-on-surface-variant">QR de l'invitation</p>
        <div class="mt-4 flex justify-center gap-2">
          <PermGuard :allow="['INVITATION_UPDATE']">
            <button class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm" @click="rotate">Faire pivoter</button>
          </PermGuard>
          <button class="px-3 py-1.5 rounded-lg border border-outline-variant text-sm" @click="qrOpen=false">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  listInvitations, createInvitation, sendInvitation, resendInvitation, cancelInvitation, deleteInvitation,
  getQr, rotateQr, type Invitation,
} from '../../api/invitations'
import { listGuests, type Guest } from '../../api/guests'
import PermGuard from '../../components/common/PermGuard.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'

const route = useRoute()
const id = Number(route.params.id)
const invitations = ref<Invitation[]>([])
const guests = ref<Guest[]>([])
const loading = ref(true)
const query = ref('')
const statusFilter = ref('')
const formOpen = ref(false)
const selectedGuestId = ref<number | null>(null)
const qrOpen = ref(false)
const qrDataUri = ref('')
const qrInv = ref<Invitation | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const st = statusFilter.value
  return invitations.value.filter((i) => {
    if (st && i.status !== st) return false
    if (q && !guestNameFor(i).toLowerCase().includes(q) && !i.invitationCode.toLowerCase().includes(q)) return false
    return true
  })
})

const guest = (i: Invitation) => guests.value.find((g) => g.id === i.guestId)
const guestNameFor = (i: Invitation) => {
  const g = guest(i)
  return g ? `${g.firstName} ${g.lastName}` : `#${i.guestId}`
}
const initialsFor = (i: Invitation) => {
  const g = guest(i)
  return g ? `${g.firstName.charAt(0)}${g.lastName.charAt(0)}`.toUpperCase() : '?'
}
const avatarPalette = ['#5b2ecc', '#176b5b', '#f4a340', '#1f2937', '#7c3aed', '#0e7490']
const avatarColor = (n: number) => avatarPalette[n % avatarPalette.length]

onMounted(load)
async function load() {
  try {
    const [inv, g] = await Promise.all([listInvitations(id), listGuests(id)])
    invitations.value = inv
    guests.value = g
  } finally {
    loading.value = false
  }
}
async function doCreate() {
  if (!selectedGuestId.value) return
  const created = await createInvitation(id, selectedGuestId.value)
  invitations.value.push(created)
  formOpen.value = false
  selectedGuestId.value = null
}
async function send(i: Invitation) {
  await sendInvitation(id, i.id)
  await load()
}
async function resend(i: Invitation) {
  await resendInvitation(id, i.id)
  await load()
}
async function cancel(i: Invitation) {
  if (!confirm(`Annuler l'invitation ?`)) return
  await cancelInvitation(id, i.id)
  await load()
}
async function remove(i: Invitation) {
  if (!confirm(`Supprimer l'invitation ?`)) return
  await deleteInvitation(id, i.id)
  invitations.value = invitations.value.filter((x) => x.id !== i.id)
}
async function showQr(i: Invitation) {
  const q = await getQr(id, i.id)
  qrDataUri.value = q.dataUri
  qrInv.value = i
  qrOpen.value = true
}
async function rotate() {
  if (!qrInv.value) return
  const q = await rotateQr(id, qrInv.value.id)
  qrDataUri.value = q.dataUri
  await load()
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface; }
</style>

