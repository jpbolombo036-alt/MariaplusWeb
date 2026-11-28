<template>
  <div class="space-y-6">
    <div v-if="loading && !diag" class="py-16 text-center text-slate-400 text-sm">Chargement du diagnostic…</div>
    <p v-else-if="error" role="alert" class="rounded-xl border border-error/20 bg-error-light p-4 text-sm text-error">{{ error }}</p>

    <template v-else-if="diag">
      <!-- Verdict -->
      <section class="rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4" :class="verdict.box">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-11 h-11 rounded-xl grid place-items-center shrink-0" :class="verdict.icon">
            <span class="material-symbols-outlined" aria-hidden="true">{{ verdict.symbol }}</span>
          </span>
          <div class="min-w-0">
            <h2 class="text-[17px] font-bold text-slate-900">{{ verdict.title }}</h2>
            <p class="text-[13px] text-slate-600">{{ verdict.text }}</p>
          </div>
        </div>
        <button class="v-btn" :disabled="loading" @click="load">
          <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': loading }" aria-hidden="true">refresh</span>
          Actualiser
        </button>
      </section>

      <!-- Alertes -->
      <section v-if="diag.alerts.length" class="space-y-2.5" aria-label="Alertes">
        <div v-for="(a, i) in diag.alerts" :key="i" class="rounded-xl border p-4 flex gap-3" :class="LEVEL[a.level].box">
          <span class="material-symbols-outlined text-[20px] shrink-0" :class="LEVEL[a.level].text" aria-hidden="true">{{ LEVEL[a.level].symbol }}</span>
          <div class="min-w-0">
            <p class="text-[14px] font-semibold text-slate-900">{{ a.title }}</p>
            <p class="text-[13px] text-slate-600 mt-0.5">{{ a.detail }}</p>
          </div>
        </div>
      </section>

      <!-- Parcours des messages -->
      <section class="v-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[16px] font-bold text-slate-900">Messages des {{ diag.stats.days }} derniers jours</h2>
          <span class="text-[12px] text-slate-500">invitations et relances</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div v-for="s in statCards" :key="s.label" class="rounded-lg border border-slate-200 p-3.5">
            <p class="text-[12px] text-slate-500">{{ s.label }}</p>
            <p class="text-[22px] font-bold mt-0.5" :class="s.tone">{{ s.value }}</p>
            <p class="text-[11.5px] text-slate-400">{{ s.hint }}</p>
          </div>
        </div>
        <div v-if="diag.stats.accepted" class="mt-4">
          <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden flex" aria-hidden="true">
            <span class="h-full bg-success" :style="{ width: pct(diag.stats.delivered + diag.stats.read) }" />
            <span class="h-full bg-attention" :style="{ width: pct(diag.stats.awaitingOverOneHour) }" />
            <span class="h-full bg-error" :style="{ width: pct(failedAfterAcceptance) }" />
          </div>
          <p class="mt-2 text-[12px] text-slate-500">
            Livrés ou lus {{ pct(diag.stats.delivered + diag.stats.read) }} · sans nouvelles {{ pct(diag.stats.awaitingOverOneHour) }} des messages acceptés par Meta.
          </p>
        </div>
      </section>

      <!-- Dernières erreurs -->
      <section class="v-card">
        <div class="px-5 pt-5 pb-3"><h2 class="text-[16px] font-bold text-slate-900">Dernières erreurs</h2></div>
        <p v-if="!diag.recentErrors.length" class="px-5 pb-6 text-sm text-slate-500">Aucune erreur sur les {{ diag.stats.days }} derniers jours.</p>
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="(e, i) in diag.recentErrors" :key="i" class="px-5 py-4">
            <div class="flex flex-wrap items-center gap-2">
              <span v-if="e.code" class="rounded-md bg-error-light px-2 py-0.5 text-[12px] font-bold text-error">{{ e.code }}</span>
              <span class="text-[14px] font-semibold text-slate-900">{{ e.label }}</span>
              <span class="text-[12px] text-slate-400">· {{ formatDate(e.at) }}<template v-if="e.eventName"> · {{ e.eventName }}</template></span>
              <span class="ml-auto text-[11.5px] text-slate-500">{{ e.afterAcceptance ? 'Échec après acceptation' : "Refusé à l'envoi" }}</span>
            </div>
            <p class="mt-1.5 text-[13px] text-slate-600">{{ e.cause }}</p>
            <p class="mt-1 text-[13px] text-slate-900"><span class="font-semibold">À faire :</span> {{ e.action }}</p>
            <p v-if="e.rawMessage" class="mt-1 text-[11.5px] text-slate-400 break-words">Meta : {{ e.rawMessage }}</p>
          </li>
        </ul>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Webhook -->
        <section class="v-card p-5">
          <h2 class="text-[16px] font-bold text-slate-900">Webhook Meta (statuts de livraison)</h2>
          <dl class="mt-3 divide-y divide-slate-100 text-[13px]">
            <div class="py-2.5">
              <dt class="text-slate-500">URL de rappel à saisir dans Meta</dt>
              <dd class="mt-1 flex items-center gap-2">
                <code class="min-w-0 flex-1 truncate rounded bg-slate-100 px-2 py-1 text-[12px] text-slate-800">{{ diag.webhook.callbackUrl || 'Définissez PUBLIC_API_BASE_URL sur Railway' }}</code>
                <button v-if="diag.webhook.callbackUrl" class="text-primary text-[12px] font-semibold shrink-0" @click="copy(diag.webhook.callbackUrl)">{{ copied ? 'Copié' : 'Copier' }}</button>
              </dd>
            </div>
            <Row label="Jeton de vérification" :ok="diag.config.webhookVerifyTokenSet" :text="diag.config.webhookVerifyTokenSet ? 'Défini' : 'Vide (WHATSAPP_WEBHOOK_VERIFY_TOKEN)'" />
            <Row label="Secret de l'application" :ok="diag.config.appSecretSet" :text="diag.config.appSecretSet ? 'Défini' : 'Vide (WHATSAPP_APP_SECRET)'" />
            <Row label="Abonnement validé par Meta" :ok="!!diag.webhook.lastVerifiedAt" :text="diag.webhook.lastVerifiedAt ? formatDate(diag.webhook.lastVerifiedAt) : 'Pas depuis le dernier redémarrage'" neutral />
            <Row label="Dernière notification reçue" :ok="!!diag.webhook.lastReceivedAt" :text="diag.webhook.lastReceivedAt ? `${formatDate(diag.webhook.lastReceivedAt)} · ${diag.webhook.receivedSinceStart} depuis le démarrage` : 'Aucune depuis le dernier redémarrage'" neutral />
            <Row label="Dernier statut enregistré" :ok="!!diag.webhook.lastStatusAt" :text="diag.webhook.lastStatusAt ? formatDate(diag.webhook.lastStatusAt) : 'Jamais'" />
            <Row v-if="diag.webhook.rejectedSinceStart" label="Notifications refusées" :ok="false" :text="`${diag.webhook.rejectedSinceStart} (signature invalide)`" />
          </dl>
        </section>

        <!-- Configuration -->
        <section class="v-card p-5">
          <h2 class="text-[16px] font-bold text-slate-900">Configuration de l'envoi</h2>
          <dl class="mt-3 divide-y divide-slate-100 text-[13px]">
            <Row label="Envoi configuré" :ok="diag.config.configured" :text="diag.config.configured ? 'Oui' : 'Non (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID)'" />
            <Row label="Numéro d'envoi (Phone number ID)" :ok="!!diag.config.phoneNumberId" :text="diag.config.phoneNumberId || '—'" neutral />
            <Row label="Modèle" :ok="!!diag.config.templateName" :text="`${diag.config.templateName || '—'} (${diag.config.templateLanguage || '—'})`" neutral />
            <Row label="Image d'en-tête" :ok="true" :text="diag.config.sendHeaderImage ? 'Envoyée (couverture de l\'événement)' : 'Désactivée'" neutral />
            <Row label="Indicatif pays par défaut" :ok="!!diag.config.defaultCountryCode" :text="diag.config.defaultCountryCode ? '+' + diag.config.defaultCountryCode : 'Aucun (numéros 08… ignorés)'" />
            <Row label="Version de l'API Meta" :ok="true" :text="diag.config.apiVersion || '—'" neutral />
          </dl>
          <p class="mt-3 text-[11.5px] text-slate-400">Les jetons et secrets ne sont jamais affichés.</p>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { apiErrorMessage } from '../../api/http'
import { getWhatsAppDiagnostics, type DiagnosticLevel, type WhatsAppDiagnostics } from '../../api/whatsappDiagnostics'

/** Ligne « libellé / valeur » avec pastille verte, orange ou grise. */
const Row = defineComponent({
  props: { label: { type: String, required: true }, text: { type: String, required: true }, ok: Boolean, neutral: Boolean },
  setup(props) {
    return () => h('div', { class: 'py-2.5 flex items-start justify-between gap-4' }, [
      h('dt', { class: 'text-slate-500' }, props.label),
      h('dd', { class: 'flex items-center gap-1.5 text-right text-slate-900 font-medium' }, [
        h('span', {
          class: ['w-2 h-2 rounded-full shrink-0', props.ok ? 'bg-success' : props.neutral ? 'bg-slate-300' : 'bg-attention'],
          'aria-hidden': 'true',
        }),
        props.text,
      ]),
    ])
  },
})

const LEVEL: Record<DiagnosticLevel, { box: string; text: string; symbol: string }> = {
  ERROR: { box: 'border-error/25 bg-error-light/60', text: 'text-error', symbol: 'error' },
  WARNING: { box: 'border-attention/30 bg-attention-light/60', text: 'text-attention-dark', symbol: 'warning' },
  INFO: { box: 'border-slate-200 bg-slate-50', text: 'text-primary', symbol: 'info' },
}

const diag = ref<WhatsAppDiagnostics | null>(null)
const loading = ref(false)
const error = ref('')
const copied = ref(false)

const verdict = computed(() => {
  const o = diag.value?.overall
  if (o === 'ERROR') return { title: 'Envoi WhatsApp à corriger', text: 'Des invitations ne partent pas ou n\'arrivent pas. Suivez les actions ci-dessous.', box: 'border-error/25 bg-error-light/40', icon: 'bg-error text-white', symbol: 'error' }
  if (o === 'WARNING') return { title: 'Envoi WhatsApp à surveiller', text: 'Les messages partent, mais certains points méritent votre attention.', box: 'border-attention/30 bg-attention-light/40', icon: 'bg-attention text-white', symbol: 'warning' }
  return { title: 'Envoi WhatsApp opérationnel', text: 'Configuration complète et livraisons confirmées par Meta.', box: 'border-success/30 bg-success-light/40', icon: 'bg-success text-white', symbol: 'check_circle' }
})

const failedAfterAcceptance = computed(() => diag.value?.recentErrors.filter((e) => e.afterAcceptance).length ?? 0)

const statCards = computed(() => {
  const s = diag.value!.stats
  return [
    { label: 'Acceptés par Meta', value: s.accepted, hint: 'partis de la plateforme', tone: 'text-slate-900' },
    { label: 'Livrés', value: s.delivered + s.read, hint: `dont ${s.read} lu(s)`, tone: 'text-success' },
    { label: 'Sans nouvelles', value: s.awaitingOverOneHour, hint: 'depuis plus d\'1 h', tone: s.awaitingOverOneHour ? 'text-attention-dark' : 'text-slate-900' },
    { label: 'Échecs', value: s.failed, hint: 'refusés ou non livrés', tone: s.failed ? 'text-error' : 'text-slate-900' },
    { label: 'Ignorés', value: s.skipped, hint: 'numéro absent ou invalide', tone: 'text-slate-900' },
  ]
})

function pct(n: number): string {
  const total = diag.value?.stats.accepted ?? 0
  return total ? `${Math.round((n / total) * 100)} %` : '0 %'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* presse-papiers indisponible */ }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    diag.value = await getWhatsAppDiagnostics()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
