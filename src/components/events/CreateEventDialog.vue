<template>
  <div class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="$emit('close')">
    <form class="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-2xl max-h-[90vh] overflow-y-auto" @submit.prevent="submit">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-on-surface">Nouvel événement</h2>
        <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="$emit('close')"><span class="material-symbols-outlined">close</span></button>
      </div>

      <p class="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Marié 🎩</p>
      <div class="grid sm:grid-cols-2 gap-3 mb-4">
        <input v-model="form.groomFirstName" required placeholder="Prénom du marié" class="input" />
        <input v-model="form.groomLastName" required placeholder="Nom du marié" class="input" />
      </div>

      <p class="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Mariée 👰</p>
      <div class="grid sm:grid-cols-2 gap-3 mb-4">
        <input v-model="form.brideFirstName" required placeholder="Prénom de la mariée" class="input" />
        <input v-model="form.brideLastName" required placeholder="Nom de la mariée" class="input" />
      </div>

      <p class="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Détails</p>
      <input v-model="form.couplePhotoUrl" placeholder="URL photo du couple" class="input mb-3" />
      <textarea v-model="form.description" rows="2" placeholder="Description (optionnel)" class="input mb-3 resize-none"></textarea>
      <textarea v-model="form.message" rows="2" placeholder="Message d'invitation (optionnel)" class="input resize-none"></textarea>

      <p v-if="error" class="text-error text-sm mt-3">{{ error }}</p>
      <div class="flex justify-end gap-2 mt-6">
        <button type="button" class="px-4 h-10 rounded-lg text-on-surface-variant" @click="$emit('close')">Annuler</button>
        <button type="submit" :disabled="loading" class="px-6 h-10 rounded-xl bg-primary text-on-primary font-semibold disabled:opacity-60 inline-flex items-center gap-2">
          <span v-if="loading" class="material-symbols-outlined text-base animate-spin">progress_activity</span> Créer
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createWedding, type Wedding } from '../../api/weddings'

const emit = defineEmits<{ (e: 'close'): void; (e: 'created', w: Wedding): void }>()

const form = reactive({
  groomFirstName: '',
  groomLastName: '',
  brideFirstName: '',
  brideLastName: '',
  couplePhotoUrl: '',
  description: '',
  message: '',
})
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const w = await createWedding({
      groomFirstName: form.groomFirstName,
      groomLastName: form.groomLastName,
      brideFirstName: form.brideFirstName,
      brideLastName: form.brideLastName,
      couplePhotoUrl: form.couplePhotoUrl || null,
      description: form.description || null,
      message: form.message || null,
    })
    emit('created', w)
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Création impossible'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input {
  @apply block w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant/60;
}
</style>
