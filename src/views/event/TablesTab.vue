<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Tables & Placements</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ tables.length }} table(s)</p>
        </div>
        <div class="flex items-center gap-3">
          <PermGuard :allow="['TABLE_CREATE']">
            <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="$router.push(`/dashboard/events/${id}/tables/new`)">
              <span class="material-symbols-outlined text-[18px]">add</span> Nouvelle Table
            </button>
          </PermGuard>
        </div>
      </div>
    </div>

    <!-- Recherche style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
      <div class="flex items-center gap-3">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input v-model="query" placeholder="Rechercher une table..." class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-slate-400 py-8 text-center text-sm">Chargement…</div>

    <!-- Cartes professionnelles des tables -->
    <div v-else-if="filtered.length === 0" class="bg-white border border-slate-200 rounded-xl py-14 text-center">
      <div class="w-14 h-14 mx-auto rounded-lg bg-slate-50 grid place-items-center mb-4 ring-1 ring-slate-100">
        <span class="material-symbols-outlined text-3xl text-slate-300">table_restaurant</span>
      </div>
      <h3 class="font-bold text-slate-700 text-[15px]">Aucune table</h3>
      <p class="text-[13px] text-slate-400 mt-1">Créez votre première table pour organiser les placements.</p>
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <article v-for="t in filtered" :key="t.id" class="table-card">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="table-icon"><span class="material-symbols-outlined text-[20px]">table_restaurant</span></span>
              <h3 class="text-[17px] font-bold text-slate-900 truncate">{{ t.name }}</h3>
            </div>
            <p class="text-[12px] text-slate-500 mt-1">{{ t.assignedCount }} / {{ t.capacity }} personnes · {{ guestsFor(t.id).length }} invité(s)</p>
          </div>
          <span class="table-status" :class="occupancyClass(t)">{{ occupancyLabel(t) }}</span>
        </div>

        <div class="mt-4">
          <div class="flex items-center justify-between text-[12px] mb-1.5">
            <span class="font-semibold text-slate-600">Occupation</span>
            <span class="font-bold text-slate-800">{{ occupancy(t) }}%</span>
          </div>
          <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full transition-all" :class="occupancyBarClass(t)" :style="{ width: `${occupancy(t)}%` }"></div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-[12px] font-bold uppercase tracking-wide text-slate-500">Invités placés</h4>
            <span v-if="guestsFor(t.id).length" class="text-[11px] text-slate-400">{{ t.remainingCapacity }} place(s) libre(s)</span>
          </div>
          <div v-if="guestsFor(t.id).length" class="space-y-2 max-h-40 overflow-y-auto pr-1">
            <div v-for="a in guestsFor(t.id)" :key="a.assignmentId" class="guest-row">
              <span class="guest-avatar">{{ initials(a.guestName) }}</span>
              <span class="flex-1 min-w-0 truncate text-[13px] font-semibold text-slate-700">{{ a.guestName }}</span>
              <span v-if="a.companions > 0" class="companion-badge">+{{ a.companions }}</span>
            </div>
          </div>
          <p v-else class="text-[12px] text-slate-400 py-2">Aucun invité placé sur cette table.</p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <PermGuard :allow="['TABLE_ASSIGN_GUEST']">
            <button type="button" class="table-action table-action-primary" @click.stop.prevent="openAssign(t)"><span class="material-symbols-outlined text-[16px]">groups</span>Gérer les invités</button>
          </PermGuard>
          <button class="table-action" title="Modifier" @click="$router.push(`/dashboard/events/${id}/tables/${t.id}/edit`)"><span class="material-symbols-outlined text-[16px]">edit</span>Modifier</button>
          <PermGuard :allow="['TABLE_DELETE']">
            <button class="table-action table-action-danger" title="Supprimer" @click="remove(t)"><span class="material-symbols-outlined text-[16px]">delete</span></button>
          </PermGuard>
        </div>
      </article>
    </div>

    <!-- Modale de gestion des placements -->
    <Teleport to="body">
    <div v-if="assignOpen" class="fixed inset-0 z-[100] grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4" @click.self="closeAssign">
      <div class="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 class="text-[16px] font-bold text-slate-900">Placements — {{ assignTable?.name }}</h3>
            <p class="text-[12px] text-slate-500 mt-0.5">{{ assignTable ? assignTable.assignedCount + '/' + assignTable.capacity + ' place(s) · ' + assignTable.assignedGuests + ' invité(s)' : '' }}</p>
          </div>
          <button @click="closeAssign" class="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-50 grid place-items-center transition-colors"><span class="material-symbols-outlined">close</span></button>
        </div>

        <div class="px-6 py-5 space-y-7">
          <div v-if="assignmentError" class="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
            <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{{ assignmentError }}</span>
          </div>

          <div>
            <h4 class="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">Sur cette table</h4>
            <div v-if="guestsFor(assignTable?.id).length === 0" class="text-[13px] text-slate-400 py-2">Aucun invité placé sur cette table.</div>
            <div v-else class="space-y-2">
              <div v-for="a in guestsFor(assignTable?.id)" :key="a.assignmentId" class="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                <span class="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-semibold text-slate-700 truncate">{{ a.guestName }}<span v-if="a.companions > 0" class="ml-1.5 text-[11px] font-bold text-primary">+{{ a.companions }}</span></p>
                  <p class="text-[11px] text-slate-400">
                    <span v-if="a.companions > 0" class="font-semibold text-slate-500">{{ a.companions }} accompagnant(s) à la même table</span>
                    <span v-else>Sans accompagnant</span>
                    · Affecté le : {{ a.assignedAt ? new Date(a.assignedAt).toLocaleString('fr-FR') : '—' }}
                  </p>
                </div>
                <PermGuard :allow="['TABLE_ASSIGN_GUEST']">
                  <select class="h-8 px-2 rounded-lg border border-slate-200 text-[12px] text-slate-600 outline-none focus:border-primary max-w-[180px]" :value="assignTable?.id" @change="onMove(a, $event)">
                    <option v-for="tt in tables" :key="tt.id" :value="tt.id" :disabled="tt.id === assignTable?.id || tt.remainingCapacity < 1 + a.companions" :title="tt.remainingCapacity < 1 + a.companions && tt.id !== assignTable?.id ? 'Places insuffisantes pour ce groupe (' + (1 + a.companions) + ' requis)' : ''">{{ tt.name }} ({{ tt.remainingCapacity }} libre(s))</option>
                  </select>
                  <button @click="unassign(a)" class="h-8 w-8 rounded-lg text-error hover:bg-error/10 grid place-items-center transition-colors" title="Retirer de la table"><span class="material-symbols-outlined text-[18px]">person_remove</span></button>
                </PermGuard>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">Invités sans table</h4>
            <div v-if="unassignedGuests.length === 0" class="text-[13px] text-slate-400 py-2">Tous les invités sont déjà placés.</div>
            <div v-else class="grid sm:grid-cols-2 gap-2">
              <div v-for="g in unassignedGuests" :key="g.id" class="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
                <span class="material-symbols-outlined text-slate-400 text-[18px]">person_add</span>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-medium text-slate-700 truncate">{{ g.firstName }} {{ g.lastName }}</p>
                  <p v-if="(g.allowedCompanions ?? 0) > 0" class="text-[11px] text-slate-400">+{{ g.allowedCompanions }} accompagnant(s)</p>
                </div>
                <PermGuard :allow="['TABLE_ASSIGN_GUEST']">
                  <button @click="assignTo(g.id)" class="h-7 w-7 rounded-lg bg-primary text-white grid place-items-center hover:bg-primary-dark transition-colors" title="Placer sur cette table"><span class="material-symbols-outlined text-[15px]">add</span></button>
                </PermGuard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { listTables, deleteTable, type WeddingTable } from '../../api/tables'
import { listGuests, type Guest } from '../../api/guests'
import { listAssignments, assignGuest, moveAssignment, removeAssignment, type TableAssignment } from '../../api/assignments'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const tables = ref<WeddingTable[]>([])
const assignments = ref<TableAssignment[]>([])
const guests = ref<Guest[]>([])
const loading = ref(true)
const query = ref('')

const assignOpen = ref(false)
const assignTable = ref<WeddingTable | null>(null)
const assignmentError = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return tables.value
  return tables.value.filter(t => t.name.toLowerCase().includes(q))
})

/** Invités qui n'ont encore aucune table. */
const unassignedGuests = computed(() =>
  guests.value.filter((g) => !assignments.value.some((a) => a.guestId === g.id)),
)

function guestsFor(tableId?: number): TableAssignment[] {
  if (tableId == null) return []
  return assignments.value.filter((a) => a.tableId === tableId)
}

function occupancy(table: WeddingTable): number {
  if (!table.capacity) return 0
  return Math.min(100, Math.round((table.assignedCount / table.capacity) * 100))
}

function occupancyLabel(table: WeddingTable): string {
  const value = occupancy(table)
  if (value >= 100) return 'Complète'
  if (value >= 80) return 'Presque pleine'
  if (value > 0) return 'Disponible'
  return 'Vide'
}

function occupancyClass(table: WeddingTable): string {
  const value = occupancy(table)
  if (value >= 100) return 'table-status-full'
  if (value >= 80) return 'table-status-warning'
  if (value > 0) return 'table-status-open'
  return 'table-status-empty'
}

function occupancyBarClass(table: WeddingTable): string {
  const value = occupancy(table)
  if (value >= 100) return 'bg-red-500'
  if (value >= 80) return 'bg-amber-500'
  return 'bg-primary'
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

onMounted(load)
async function load() {
  try {
    const [t, a, g] = await Promise.all([listTables(id), listAssignments(id), listGuests(id)])
    tables.value = t
    assignments.value = a
    guests.value = g
    if (assignTable.value) {
      assignTable.value = t.find((table) => table.id === assignTable.value?.id) ?? null
    }
  } finally {
    loading.value = false
  }
}

function openAssign(t: WeddingTable) {
  assignTable.value = t
  assignmentError.value = ''
  assignOpen.value = true
}
function closeAssign() {
  assignOpen.value = false
  assignTable.value = null
  assignmentError.value = ''
}

async function assignTo(guestId: number) {
  const tableId = assignTable.value?.id
  if (tableId == null) return
  assignmentError.value = ''
  const guest = guests.value.find((item) => item.id === guestId)
  const seatsRequired = 1 + Number(guest?.allowedCompanions ?? 0)
  const available = assignTable.value?.remainingCapacity ?? 0
  if (seatsRequired > available) {
    assignmentError.value = `Cette table ne peut pas accueillir ce groupe : ${seatsRequired} place(s) nécessaire(s), ${available} libre(s). Choisissez une autre table ou retirez d'abord un invité.`
    return
  }
  try {
    await assignGuest(id, tableId, guestId)
    await load()
  } catch (e: any) {
    assignmentError.value = e?.response?.data?.error || 'Impossible de placer cet invité. Vérifiez les places disponibles.'
  }
}

async function onMove(a: TableAssignment, ev: Event) {
  const target = Number((ev.target as HTMLSelectElement).value)
  if (!target || target === a.tableId || !assignTable.value) return
  assignmentError.value = ''
  try {
    await moveAssignment(id, a.assignmentId, target)
    await load()
  } catch (e: any) {
    assignmentError.value = e?.response?.data?.error || 'Impossible de déplacer cet invité. Vérifiez la capacité de la table cible.'
    await load()
  }
}

async function unassign(a: TableAssignment) {
  if (!confirm(`Retirer « ${a.guestName} » de la table « ${a.tableName} » ?`)) return
  try {
    await removeAssignment(id, a.assignmentId)
    await load()
  } catch (e: any) {
    assignmentError.value = e?.response?.data?.error || 'Impossible de retirer cet invité de la table.'
  }
}

async function remove(t: WeddingTable) {
  if (!confirm(`Supprimer la table « ${t.name} » ?`)) return
  await deleteTable(id, t.id)
  tables.value = tables.value.filter((x) => x.id !== t.id)
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
.table-card { @apply bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20; }
.table-icon { @apply w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0; }
.table-status { @apply px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap; }
.table-status-full { @apply bg-red-50 text-red-600; }
.table-status-warning { @apply bg-amber-50 text-amber-700; }
.table-status-open { @apply bg-green-50 text-green-700; }
.table-status-empty { @apply bg-slate-100 text-slate-500; }
.guest-row { @apply flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2; }
.guest-avatar { @apply w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-bold shrink-0; }
.companion-badge { @apply rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600; }
.table-action { @apply h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors; }
.table-action-primary { @apply border-primary/20 bg-primary/5 text-primary hover:bg-primary/10; }
.table-action-danger { @apply px-2 border-error/20 text-error hover:bg-error/10; }
</style>
