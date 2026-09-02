<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Nouvelle invitation</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Sélectionnez un invité pour créer une invitation.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form @submit.prevent="submitCreate" class="space-y-5">
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Invité *</span>
            <select v-model="selectedGuestId" required class="input">
              <option :value="null" disabled>Sélectionner un invité</option>
              <option v-for="g in guests" :key="g.id" :value="g.id">{{ g.firstName }} {{ g.lastName }}</option>
            </select>
          </label>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Table (optionnel)</span>
            <select v-model="selectedTableId" class="input" :disabled="tables.length === 0">
              <option :value="null">Aucune table</option>
              <option v-for="t in tables" :key="t.id" :value="t.id" :disabled="t.remainingCapacity < 1">
                {{ t.name }} ({{ t.remainingCapacity }} place(s) libre(s))
              </option>
            </select>
            <span v-if="tables.length === 0" class="text-[12px] text-slate-400 mt-1 block">
              Créez d'abord des tables dans l'onglet Tables pour placer l'invité.
            </span>
            <span v-else-if="guestCurrentTable" class="text-[12px] text-primary mt-1 block">
              {{
                guestCurrentTable === selectedTableName
                  ? 'Cet invité est déjà placé à cette table.'
                  : `Cet invité est actuellement à la table « ${guestCurrentTable} ». Choisir une autre table le déplacera.`
              }}
            </span>
          </label>

          <p v-if="errorMsg" class="text-[13px] text-error font-medium">{{ errorMsg }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="$router.back()" class="px-4 h-10 text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors">Annuler</button>
            <button type="submit" :disabled="submitting" class="px-5 h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60">
              {{ submitting ? 'Création…' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createInvitation } from '../../api/invitations'
import { listGuests, type Guest } from '../../api/guests'
import { listTables, type WeddingTable } from '../../api/tables'
import { listAssignments, assignGuest, moveAssignment, type TableAssignment } from '../../api/assignments'

const route = useRoute()
const id = Number(route.params.id)
const guests = ref<Guest[]>([])
const tables = ref<WeddingTable[]>([])
const assignments = ref<TableAssignment[]>([])
const selectedGuestId = ref<number | null>(null)
const selectedTableId = ref<number | null>(null)
const submitting = ref(false)
const errorMsg = ref('')

/** Table actuelle de l'invité sélectionné (null = pas encore placé). */
const guestCurrentTable = computed(() => {
  const gid = selectedGuestId.value
  if (gid == null) return null
  const a = assignments.value.find((x) => x.guestId === gid)
  return a ? a.tableName : null
})

const selectedTableName = computed(() => {
  const tid = selectedTableId.value
  const t = tables.value.find((x) => x.id === tid)
  return t ? t.name : null
})

onMounted(async () => {
  const [g, t, a] = await Promise.all([listGuests(id), listTables(id), listAssignments(id)])
  guests.value = g
  tables.value = t
  assignments.value = a
})

async function submitCreate() {
  if (!selectedGuestId.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    await createInvitation(id, selectedGuestId.value)

    // Placement optionnel : si l'invité a déjà une table différente → déplacement,
    // sinon (jamais placé) → affectation simple. Même table → aucun appel.
    const tableId = selectedTableId.value
    if (tableId) {
      const existing = assignments.value.find((x) => x.guestId === selectedGuestId.value)
      if (existing) {
        if (existing.tableId !== tableId) {
          await moveAssignment(id, existing.assignmentId, tableId)
        }
      } else {
        await assignGuest(id, tableId, selectedGuestId.value)
      }
    }

    window.history.length > 1 ? window.history.back() : window.location.href = `/dashboard/events/${id}/invitations`
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || e?.message || 'Erreur lors de la création de l’invitation.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
