<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[60] bg-slate-900/40 grid place-items-center p-4" @click.self="close">
      <div
        class="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="temp-password-title"
      >
        <div class="px-5 py-4 border-b border-slate-100">
          <h2 id="temp-password-title" class="text-[16px] font-bold text-slate-900">
            {{ result ? 'Mot de passe temporaire' : 'Réinitialiser le mot de passe' }}
          </h2>
          <p class="text-[12px] text-slate-500 mt-0.5 break-words">{{ fullName }} · {{ user.email }}</p>
        </div>

        <div v-if="!result" class="px-5 py-4 space-y-3 text-[13px] text-slate-700">
          <p>Un mot de passe temporaire va être généré. Toutes les sessions de cet utilisateur seront fermées et il devra choisir un nouveau mot de passe à sa prochaine connexion.</p>
          <p v-if="error" class="text-error" role="alert">{{ error }}</p>
        </div>

        <div v-else class="px-5 py-4 space-y-4">
          <div class="flex items-center gap-2">
            <code
              data-testid="temporary-password"
              class="flex-1 min-w-0 text-center text-[20px] font-bold tracking-wider text-slate-900 bg-slate-50 border border-slate-200 rounded-lg py-3 select-all break-all"
            >{{ result.temporaryPassword }}</code>
            <button
              type="button"
              class="h-11 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
              @click="copy"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">{{ copied ? 'check' : 'content_copy' }}</span>
              {{ copied ? 'Copié' : 'Copier' }}
            </button>
          </div>
          <a
            v-if="whatsappUrl"
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full h-11 rounded-lg bg-[#25D366] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
            Envoyer par WhatsApp à {{ result.phone }}
          </a>
          <p v-else class="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {{ result.phone
              ? `Le numéro « ${result.phone} » ne peut pas être converti au format international : envoyez le mot de passe manuellement.`
              : 'Aucun téléphone renseigné pour ce compte : transmettez le mot de passe par un autre moyen sûr.' }}
          </p>
          <p class="text-[12px] text-slate-500">Ce mot de passe ne sera plus affiché après la fermeture de cette fenêtre.</p>
        </div>

        <div class="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <template v-if="!result">
            <button type="button" class="h-10 px-4 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-50" :disabled="busy" @click="close">Annuler</button>
            <button
              type="button"
              class="h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold disabled:opacity-50"
              :disabled="busy"
              @click="generate"
            >{{ busy ? 'Génération…' : 'Générer un mot de passe temporaire' }}</button>
          </template>
          <button v-else type="button" class="h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold" @click="close">Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { issueTemporaryPassword, type TemporaryPassword } from '../../api/admin'
import { apiErrorMessage } from '../../api/http'

const props = defineProps<{ user: { id: number; firstName: string; lastName: string; email: string } }>()
const emit = defineEmits<{ close: [] }>()

const busy = ref(false)
const error = ref('')
const result = ref<TemporaryPassword | null>(null)
const copied = ref(false)

const fullName = computed(() => `${props.user.firstName} ${props.user.lastName}`.trim() || props.user.email)

const whatsappUrl = computed(() => {
  const r = result.value
  if (!r?.whatsappNumber) return ''
  const text = `Bonjour ${r.firstName}, voici votre mot de passe temporaire EventiaEasy : ${r.temporaryPassword}\n`
    + `Connectez-vous sur ${window.location.origin}/login avec ${r.email}. `
    + 'Vous devrez ensuite choisir votre propre mot de passe.'
  return `https://wa.me/${r.whatsappNumber}?text=${encodeURIComponent(text)}`
})

async function generate() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    result.value = await issueTemporaryPassword(props.user.id)
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busy.value = false
  }
}

async function copy() {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(result.value.temporaryPassword)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* the code stays selectable (select-all) */ }
}

function close() {
  if (!busy.value) emit('close')
}

function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  result.value = null // never keep the secret around
})
</script>
