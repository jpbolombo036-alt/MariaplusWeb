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
        <button class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-slate-400 py-8 text-center text-sm">Chargement…</div>

    <!-- Tableau de tables -->
    <div v-else-if="filtered.length === 0" class="bg-white border border-slate-200 rounded-xl py-14 text-center">
      <div class="w-14 h-14 mx-auto rounded-lg bg-slate-50 grid place-items-center mb-4 ring-1 ring-slate-100">
        <span class="material-symbols-outlined text-3xl text-slate-300">table_restaurant</span>
      </div>
      <h3 class="font-bold text-slate-700 text-[15px]">Aucune table</h3>
      <p class="text-[13px] text-slate-400 mt-1">Créez votre première table pour organiser les placements.</p>
    </div>

    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-slate-500">
          <tr>
            <th class="px-5 py-3.5 font-medium">Table</th>
            <th class="px-5 py-3.5 font-medium">Capacité</th>
            <th class="px-5 py-3.5 font-medium">Assignés</th>
            <th class="px-5 py-3.5 font-medium">Occupation</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="t in filtered" :key="t.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5">
              <span class="font-semibold text-slate-700 text-[14px]">{{ t.name }}</span>
            </td>
            <td class="px-5 py-3.5 text-slate-600 text-[13px]">{{ t.capacity }}</td>
            <td class="px-5 py-3.5">
              <div v-if="guestsFor(t.id).length > 0" class="flex flex-wrap gap-1.5 max-w-[420px]">
                <span v-for="a in guestsFor(t.id)" :key="a.assignmentId" class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[12px] font-semibold">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {{ a.guestName }}
                </span>
              </div>
              <span v-else class="text-slate-400 text-[12px]">Aucun invité placé</span>
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(100, (t.assignedCount / t.capacity) * 100) + '%' }"></div>
                </div>
                <span class="text-xs text-slate-500">{{ Math.round((t.assignedCount / t.capacity) * 100) }}%</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right">
              <div class="inline-flex items-center gap-1">
                <PermGuard :allow="['TABLE_ASSIGN_GUEST']">
                  <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Gérer les placements" @click="openAssign(t)"><span class="material-symbols-outlined text-base">groups</span></button>
                </PermGuard>
                <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Modifier"><span class="material-symbols-outlined text-base">edit</span></button>
                <PermGuard :allow="['TABLE_DELETE']">
                  <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(t)"><span class="material-symbols-outlined text-base">delete</span></button>
                </PermGuard>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modale de gestion des placements -->
    <div v-if="assignOpen" class="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4" @click.self="closeAssign">
      <div class="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 class="text-[16px] font-bold text-slate-900">Placements — {{ assignTable?.name }}</h3>
            <p class="text-[12px] text-slate-500 mt-0.5">{{ assignTable ? assignTable.assignedCount + '/' + assignTable.capacity + ' place(s) utilisée(s)' : '' }}</p>
          </div>
          <button @click="closeAssign" class="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-50 grid place-items-center transition-colors"><span class="material-symbols-outlined">close</span></button>
        </div>

        <div class="px-6 py-5 space-y-7">
          <div>
            <h4 class="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">Sur cette table</h4>
            <div v-if="guestsFor(assignTable?.id).length === 0" class="text-[13px] text-slate-400 py-2">Aucun invité placé sur cette table.</div>
            <div v-else class="space-y-2">
              <div v-for="a in guestsFor(assignTable?.id)" :key="a.assignmentId" class="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                <span class="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-semibold text-slate-700 truncate">{{ a.guestName }}</p>
                  <p class="text-[11px] text-slate-400">Arrivé à : {{ a.assignedAt ? new Date(a.assignedAt).toLocaleString('fr-FR') : '—' }}</p>
                </div>
                <PermGuard :allow="['TABLE_ASSIGN_GUEST']">
                  <select class="h-8 px-2 rounded-lg border border-slate-200 text-[12px] text-slate-600 outline-none focus:border-primary max-w-[180px]" :value="assignTable?.id" @change="onMove(a, $event)">
                    <option v-for="tt in tables" :key="tt.id" :value="tt.id" :disabled="tt.id === assignTable?.id || tt.remainingCapacity < 1">{{ tt.name }}</option>
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

onMounted(load)
async function load() {
  try {
    const [t, a, g] = await Promise.all([listTables(id), listAssignments(id), listGuests(id)])
    tables.value = t
    assignments.value = a
    guests.value = g
  } finally {
    loading.value = false
  }
}

function openAssign(t: WeddingTable) {
  assignTable.value = t
  assignOpen.value = true
}
function closeAssign() {
  assignOpen.value = false
  assignTable.value = null
}

async function assignTo(guestId: number) {
  const tableId = assignTable.value?.id
  if (tableId == null) return
  try {
    await assignGuest(id, tableId, guestId)
    await load()
  } catch (e: any) {
    alert(e?.response?.data?.error || 'Impossible de placer cet invité.')
  }
}

async function onMove(a: TableAssignment, ev: Event) {
  const target = Number((ev.target as HTMLSelectElement).value)
  if (!target || target === a.tableId || !assignTable.value) return
  try {
    await moveAssignment(id, a.assignmentId, target)
    await load()
  } catch (e: any) {
    alert(e?.response?.data?.error || 'Impossible de déplacer cet invité.')
  }
}

async function unassign(a: TableAssignment) {
  if (!confirm(`Retirer « ${a.guestName} » de la table « ${a.tableName} » ?`)) return
  try {
    await removeAssignment(id, a.assignmentId)
    await load()
  } catch (e: any) {
    alert(e?.response?.data?.error || 'Impossible de retirer cet invité.')
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
</style>
