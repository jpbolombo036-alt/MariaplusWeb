<!DOCTYPE vue3-sfc>
<template>
  <div class="max-w-3xl">
    <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Paramètres plateforme</h1>
    <p class="text-[13px] text-slate-500 mt-0.5 font-medium mb-6">
      Interrupteurs globaux de la plateforme. Consultation ouverte — modification réservée au SUPER_ADMIN.
    </p>

    <!-- Carte WhatsApp -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div class="flex items-center gap-2 mb-5">
        <span class="material-symbols-outlined text-[20px] text-primary">tune</span>
        <h2 class="text-[15px] font-bold text-slate-900">Envoi WhatsApp</h2>
      </div>

      <p v-if="loadMsg" class="text-sm inline-flex items-center gap-1 mb-4" :class="loadErr ? 'text-error' : 'text-success'">
        <span class="material-symbols-outlined text-[16px]">{{ loadErr ? 'error' : 'check_circle' }}</span>
        {{ loadMsg }}
      </p>

      <div class="flex items-start justify-between gap-6">
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-800">Relances automatiques par WhatsApp</div>
          <p class="text-[13px] text-slate-500 mt-1 leading-relaxed">
            Active ou désactive l'envoi des relances d'invitations par WhatsApp pour toute la plateforme.
            Désactivé, aucune relance ne parte (les invitations restent envoyables manuellement).
          </p>
          <p class="text-[12px] text-slate-400 mt-2">
            État actuel :
            <span v-if="loading" class="font-semibold">chargement…</span>
            <span v-else-if="loadErr" class="font-semibold">inconnu</span>
            <span v-else class="font-semibold" :class="whatsapp.whatsappSendingEnabled ? 'text-success' : 'text-error'">
              {{ whatsapp.whatsappSendingEnabled ? 'Activé' : 'Désactivé' }}
            </span>
          </p>
        </div>

        <!-- Toggle -->
        <label class="toggle" :class="{ 'toggle-disabled': !canUpdate || busy || loading || loadErr }">
          <input
            v-model="whatsapp.whatsappSendingEnabled"
            type="checkbox"
            class="toggle-input"
            :disabled="!canUpdate || busy || loading || loadErr"
            @change="onToggle"
          />
          <span class="toggle-track"><span class="toggle-thumb" /></span>
        </label>
      </div>

      <p v-if="saveMsg" class="mt-4 text-sm inline-flex items-center gap-1" :class="saveErr ? 'text-error' : 'text-success'">
        <span class="material-symbols-outlined text-[16px]">{{ saveErr ? 'error' : 'check_circle' }}</span>
        {{ saveMsg }}
      </p>

      <p v-if="!canUpdate" class="mt-4 text-[12px] text-slate-400 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[14px]">lock</span>
        Lecture seule : seul le SUPER_ADMIN peut modifier ces réglages.
      </p>
    </div>

    <!-- Carte Plafond de relances -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div class="flex items-center gap-2 mb-5">
        <span class="material-symbols-outlined text-[20px] text-primary">repeat</span>
        <h2 class="text-[15px] font-bold text-slate-900">Plafond de relances WhatsApp</h2>
      </div>

      <div class="flex items-start justify-between gap-6 flex-wrap">
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-800">Relances par invitation</div>
          <p class="text-[13px] text-slate-500 mt-1 leading-relaxed">
            Nombre maximal de relances WhatsApp envoyées pour une même invitation
            avant arrêt automatique (0 = aucune relance). Réinitialiser rétablit
            l'héritage du réglage global de la plateforme (défaut : 3).
          </p>
          <p class="text-[12px] text-slate-400 mt-2">
            État actuel :
            <span v-if="loading" class="font-semibold">chargement…</span>
            <span v-else-if="loadErr" class="font-semibold">inconnu</span>
            <span v-else-if="whatsapp.whatsappMaxReminders === null" class="font-semibold text-slate-600">
              Hérité du réglage global
            </span>
            <span v-else class="font-semibold text-success">
              {{ whatsapp.whatsappMaxReminders }} relance(s) max par invitation
            </span>
          </p>
        </div>

        <div class="shrink-0 flex flex-col items-end gap-2">
          <div class="flex items-center gap-2">
            <label class="block">
              <span class="sr-only">Plafond</span>
              <input
                v-model.number="maxInput"
                type="number"
                min="0"
                max="99"
                step="1"
                placeholder="—"
                :disabled="!canUpdate || busy || loading || loadErr"
                class="h-9 w-24 px-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 font-medium disabled:opacity-50"
                @keydown.enter="saveMax"
              />
            </label>
            <button
              :disabled="!canUpdate || busy || loading || loadErr"
              class="px-4 h-9 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none"
              @click="saveMax"
            >
              {{ busy ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
          <button
            :disabled="!canUpdate || busy || loading || loadErr"
            class="text-[12px] text-slate-500 hover:text-slate-700 underline underline-offset-2 disabled:opacity-50 transition-colors"
            @click="inheritMax"
          >
            Réinitialiser (hériter du global)
          </button>
        </div>
      </div>

      <p v-if="maxMsg" class="mt-4 text-sm inline-flex items-center gap-1" :class="maxErr ? 'text-error' : 'text-success'">
        <span class="material-symbols-outlined text-[16px]">{{ maxErr ? 'error' : 'check_circle' }}</span>
        {{ maxMsg }}
      </p>
    </div>
  </div>
</template>

<!DOCTYPE script>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { Perm } from '../permissions'
import { getWhatsappSettings, updateWhatsappSettings } from '../api/admin'

const auth = useAuthStore()

/* --- Autorisation (masquage UI ; la vraie sécurité est côté backend) --- */
const canUpdate = computed(() => auth.can([Perm.settingsUpdate]))

/* --- État local --- */
const whatsapp = reactive({ whatsappSendingEnabled: true, whatsappMaxReminders: null as number | null })
const maxInput = ref<number | ''>('')
const loading = ref(false)
const loadMsg = ref('')
const loadErr = ref(false)
const busy = ref(false)
const saveMsg = ref('')
const saveErr = ref(false)
const maxMsg = ref('')
const maxErr = ref(false)

async function load() {
  loading.value = true
  loadMsg.value = ''
  loadErr.value = false
  try {
    const s = await getWhatsappSettings()
    whatsapp.whatsappSendingEnabled = s.whatsappSendingEnabled
    whatsapp.whatsappMaxReminders = s.whatsappMaxReminders
    maxInput.value = s.whatsappMaxReminders === null ? '' : s.whatsappMaxReminders
    loadMsg.value = 'Réglages chargés.'
  } catch {
    loadErr.value = true
    loadMsg.value = 'Erreur lors du chargement des réglages.'
  } finally {
    loading.value = false
  }
}

async function onToggle() {
  busy.value = true
  saveMsg.value = ''
  saveErr.value = false
  const target = whatsapp.whatsappSendingEnabled
  try {
    const updated = await updateWhatsappSettings(target)
    whatsapp.whatsappSendingEnabled = updated.whatsappSendingEnabled
    saveMsg.value = `Envoi WhatsApp ${updated.whatsappSendingEnabled ? 'activé' : 'désactivé'} avec succès.`
  } catch {
    // rollback visuel : la vraie vérité est côté backend
    whatsapp.whatsappSendingEnabled = !target
    saveErr.value = true
    saveMsg.value = 'Erreur : modification refusée (rôle insuffisant ou serveur injoignable).'
  } finally {
    busy.value = false
  }
}

/** Enregistre le plafond de relances saisi (entier >= 0). */
async function saveMax() {
  const raw = typeof maxInput.value === 'number' ? maxInput.value : Number(String(maxInput.value).trim())
  if (!Number.isInteger(raw) || raw < 0 || raw > 99) {
    maxErr.value = true
    maxMsg.value = 'Entrez un entier positif entre 0 et 99 (0 = aucune relance).'
    return
  }
  busy.value = true
  maxMsg.value = ''
  maxErr.value = false
  try {
    const updated = await updateWhatsappSettings(undefined, raw)
    whatsapp.whatsappMaxReminders = updated.whatsappMaxReminders
    maxInput.value = updated.whatsappMaxReminders === null ? '' : updated.whatsappMaxReminders
    maxMsg.value = `Plafond mis à jour : ${updated.whatsappMaxReminders} relance(s) max par invitation.`
  } catch {
    maxErr.value = true
    maxMsg.value = 'Erreur : modification refusée (rôle insuffisant ou serveur injoignable).'
  } finally {
    busy.value = false
  }
}

/** Réinitialise le plafond → héritage du réglage global / environnement. */
async function inheritMax() {
  busy.value = true
  maxMsg.value = ''
  maxErr.value = false
  try {
    await updateWhatsappSettings(undefined, null)
    whatsapp.whatsappMaxReminders = null
    maxInput.value = ''
    maxMsg.value = 'Plafond réinitialisé : héritage du réglage global.'
  } catch {
    maxErr.value = true
    maxMsg.value = 'Erreur : modification refusée (rôle insuffisant ou serveur injoignable).'
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<!DOCTYPE style>
<style scoped>
.toggle {
  @apply relative inline-block w-[52px] h-[28px] shrink-0 cursor-pointer select-none;
}
.toggle-disabled {
  @apply cursor-not-allowed opacity-60;
}
.toggle-input {
  @apply hidden;
}
.toggle-track {
  @apply absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-success block;
  background: rgb(226 232 240);
}
.toggle-input:checked + .toggle-track {
  background: rgb(16 185 129);
}
.toggle-thumb {
  @apply absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-transform;
}
.toggle-input:checked ~ .toggle-track .toggle-thumb {
  transform: translateX(24px);
}
</style>