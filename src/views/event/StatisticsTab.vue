<template>
  <div>
    <h2 class="text-lg font-bold text-on-surface mb-4">Statistiques</h2>
    <div v-if="loading" class="text-on-surface-variant">Chargement…</div>
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Kpi label="Invités" :value="stats?.guests.total ?? 0" icon="group" />
      <Kpi label="Acceptés" :value="stats?.invitations.accepted ?? 0" icon="check" />
      <Kpi label="Déclinés" :value="stats?.invitations.declined ?? 0" icon="close" />
      <Kpi label="Taux de réponse" :value="Math.round((stats?.invitations.responseRate ?? 0))" icon="how_to_reg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getDashboard, type Dashboard } from '../../api/dashboard'
import Kpi from '../../components/dashboard/Kpi.vue'

const route = useRoute()
const id = Number(route.params.id)
const stats = ref<Dashboard | null>(null)
const loading = ref(true)
onMounted(async () => {
  try {
    stats.value = await getDashboard(id)
  } finally {
    loading.value = false
  }
})
</script>
