<template>
  <div class="v-card">
    <button
      type="button"
      class="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="flex items-center gap-3 min-w-0">
        <span class="material-symbols-outlined text-primary text-[22px]">description</span>
        <span class="min-w-0">
          <span class="block text-[15px] font-bold text-slate-900">En-tête des devis et reçus</span>
          <span class="block text-[12px] text-slate-500 truncate">{{ summary }}</span>
        </span>
      </span>
      <span class="material-symbols-outlined text-slate-400 text-[20px]">{{ open ? 'expand_less' : 'expand_more' }}</span>
    </button>

    <form v-if="open" class="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4" @submit.prevent="save">
      <div class="flex flex-wrap items-center gap-4 pt-4">
        <div class="w-[140px] h-[80px] rounded-lg border border-dashed border-slate-200 grid place-items-center overflow-hidden bg-slate-50">
          <img v-if="logoUrl" :src="logoUrl" alt="Logo des documents" class="max-w-full max-h-full object-contain" />
          <span v-else class="text-[11px] text-slate-400 text-center px-2">Aucun logo</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <label class="v-btn cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">upload</span>
            {{ logoUrl ? 'Changer le logo' : 'Ajouter un logo' }}
            <input type="file" accept="image/png,image/jpeg" class="hidden" aria-label="Logo des documents" @change="onLogo" />
          </label>
          <button v-if="logoUrl" type="button" class="v-btn-danger" :disabled="busy" @click="removeLogo">Retirer</button>
        </div>
        <p class="text-[11.5px] text-slate-500">JPEG ou PNG, 1 Mo maximum.</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <label class="sm:col-span-2"><span class="v-label">Raison sociale</span><input v-model.trim="form.legalName" maxlength="150" placeholder="Ex. Exodus Events SARL" class="v-input" /></label>
        <label><span class="v-label">RCCM</span><input v-model.trim="form.rccm" maxlength="60" placeholder="CD/KIN/RCCM/24-B-00123" class="v-input" /></label>
        <label><span class="v-label">Id. Nat.</span><input v-model.trim="form.idNat" maxlength="60" class="v-input" /></label>
        <label><span class="v-label">N° d'impôt (NIF)</span><input v-model.trim="form.nif" maxlength="60" class="v-input" /></label>
        <label><span class="v-label">Téléphone</span><input v-model.trim="form.phone" maxlength="60" class="v-input" /></label>
        <label class="sm:col-span-2"><span class="v-label">Adresse</span><input v-model.trim="form.address" maxlength="255" class="v-input" /></label>
        <label class="sm:col-span-2"><span class="v-label">Email</span><input v-model.trim="form.email" type="email" maxlength="150" class="v-input" /></label>
        <label class="sm:col-span-2">
          <span class="v-label">Pied de page</span>
          <textarea v-model.trim="form.footerNote" rows="2" maxlength="500" placeholder="Ex. Acompte non remboursable en cas d'annulation à moins de 30 jours." class="v-input" />
        </label>
      </div>
      <p class="text-[12px] text-slate-500">Un champ laissé vide reprend les informations de votre organisation. Les mentions apparaissent sur chaque devis et reçu PDF.</p>
      <div class="flex justify-end">
        <button class="v-btn-primary" :disabled="busy">
          <span class="material-symbols-outlined text-[18px]">save</span>
          Enregistrer l'en-tête
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useNotificationStore } from '../../stores/notifications'
import {
  deleteDocumentLogo, getDocumentSettings, loadDocumentLogo, updateDocumentSettings, uploadDocumentLogo,
  type DocumentSettings,
} from '../../api/venues'

const notify = useNotificationStore()
const open = ref(false)
const busy = ref(false)
const logoUrl = ref<string | null>(null)
const form = reactive<DocumentSettings>({
  legalName: '', rccm: '', idNat: '', nif: '', address: '', phone: '', email: '', footerNote: '',
})

const summary = computed(() => {
  const parts = [form.legalName, form.rccm ? `RCCM ${form.rccm}` : '', logoUrl.value ? 'logo' : ''].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Logo, raison sociale, RCCM, Id. Nat., NIF et pied de page de vos documents'
})

function fill(s: DocumentSettings) {
  for (const key of ['legalName', 'rccm', 'idNat', 'nif', 'address', 'phone', 'email', 'footerNote'] as const) {
    form[key] = s[key] ?? ''
  }
}

async function refreshLogo(hasLogo?: boolean) {
  if (logoUrl.value) URL.revokeObjectURL(logoUrl.value)
  logoUrl.value = hasLogo ? await loadDocumentLogo() : null
}

async function save() {
  busy.value = true
  try {
    fill(await updateDocumentSettings({ ...form }))
    notify.push('En-tête des documents enregistré', 'success')
  } catch { /* message affiché par l'intercepteur */ } finally {
    busy.value = false
  }
}

async function onLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  busy.value = true
  try {
    const s = await uploadDocumentLogo(file)
    await refreshLogo(s.hasLogo)
    notify.push('Logo enregistré', 'success')
  } catch { /* message affiché */ } finally {
    busy.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function removeLogo() {
  busy.value = true
  try {
    await deleteDocumentLogo()
    await refreshLogo(false)
  } catch { /* message affiché */ } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    const s = await getDocumentSettings()
    fill(s)
    await refreshLogo(s.hasLogo)
  } catch { /* backend ancien : la carte reste vide */ }
})
onBeforeUnmount(() => { if (logoUrl.value) URL.revokeObjectURL(logoUrl.value) })
</script>
