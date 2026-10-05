<template>
  <div class="space-y-4">
    <!-- ============ Couleurs de tenue (max 3) ============ -->
    <div>
      <span class="field-label">Couleurs de tenue demandées (facultatif)</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="c in options"
          :key="c.value"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="isSelected(c.value)
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
          :disabled="!isSelected(c.value) && colors.length >= MAX"
          :title="c.description || c.label"
          @click="toggle(c.value)"
        >
          <span class="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" :style="{ backgroundColor: c.hex }"></span>
          {{ c.label }}
        </button>
      </div>
      <p v-if="colors.length" class="text-[11px] text-slate-500 mt-1.5">
        {{ colors.length }}/{{ MAX }} couleur{{ colors.length > 1 ? 's' : '' }} sélectionnée{{ colors.length > 1 ? 's' : '' }} —
        un pagne peut combiner plusieurs teintes.
      </p>
      <p v-else class="text-[11px] text-slate-400 mt-1.5">
        Aucune couleur imposée : les invités porteront ce qu'ils souhaitent.
      </p>
    </div>

    <!-- ============ Photo du pagne / tissu ============ -->
    <div>
      <span class="field-label">Photo du pagne / tissu à porter (facultatif)</span>
      <p class="text-[11px] text-slate-500 mb-1.5">
        Pour les mariages coutumiers : montrez le tissu exact que les invités doivent coudre.
      </p>
      <div class="flex items-center gap-3">
        <div class="w-20 h-20 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center shrink-0">
          <img v-if="preview" :src="preview" alt="Aperçu du pagne" class="w-full h-full object-cover" />
          <span v-else class="material-symbols-outlined text-2xl text-slate-300">texture</span>
        </div>
        <div class="min-w-0">
          <button type="button"
                  class="px-3 h-8 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
                  @click="input?.click()">
            <span class="material-symbols-outlined text-[15px]">photo_camera</span>
            {{ preview ? 'Remplacer' : 'Choisir une photo' }}
          </button>
          <button v-if="preview" type="button"
                  class="ml-2 text-[12px] text-error hover:bg-error/10 rounded-lg px-2 py-1 transition-colors"
                  @click="clear">Retirer</button>
        </div>
      </div>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPick" />
    </div>

    <p v-if="error" class="text-error text-[12px]">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  deleteEventDressImage,
  fetchDressCodes,
  loadEventDressImage,
  uploadEventDressImage,
  type DressCodeOption,
} from '../../api/events'

/** Maximum imposé par le backend (DressColors.MAX) : un pagne combine 3 teintes. */
const MAX = 3

const props = defineProps<{
  modelValue: string[]
  /** Événement déjà créé : la photo est uploadée immédiatement. Sinon émise au parent. */
  eventId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void
  (e: 'pending-file', f: File | null): void
}>()

const options = ref<DressCodeOption[]>([])
const input = ref<HTMLInputElement | null>(null)
const preview = ref<string | null>(null)
const error = ref('')

const colors = computed(() => props.modelValue ?? [])

onMounted(async () => {
  try {
    options.value = await fetchDressCodes()
  } catch {
    /* sélecteur vide : la tenue reste facultative */
  }
  if (props.eventId) {
    preview.value = await loadEventDressImage(props.eventId)
  }
})

function isSelected(value: string): boolean {
  return colors.value.includes(value)
}

function toggle(value: string) {
  const next = isSelected(value)
    ? colors.value.filter((c) => c !== value)
    : [...colors.value, value]
  if (next.length > MAX) {
    error.value = `Vous pouvez demander au maximum ${MAX} couleurs de tenue.`
    return
  }
  error.value = ''
  emit('update:modelValue', next)
}

function onPick(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files?.[0]
  el.value = ''
  if (!file) return
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
    error.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'Image trop volumineuse (max 2 Mo).'
    return
  }
  error.value = ''
  if (preview.value?.startsWith('blob:')) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(file)
  if (props.eventId) {
    uploadEventDressImage(props.eventId, file).catch(() => {
      error.value = "Envoi de la photo impossible."
    })
  } else {
    emit('pending-file', file)
  }
}

function clear() {
  if (preview.value?.startsWith('blob:')) URL.revokeObjectURL(preview.value)
  preview.value = null
  if (props.eventId) {
    deleteEventDressImage(props.eventId).catch(() => {
      error.value = 'Suppression de la photo impossible.'
    })
  } else {
    emit('pending-file', null)
  }
}
</script>

<style scoped>
.field-label { @apply text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block; }
</style>