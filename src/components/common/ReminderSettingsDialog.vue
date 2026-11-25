<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[60] bg-slate-900/40 grid place-items-center p-4" @click.self="close">
      <form
        class="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg max-h-[calc(100vh-2rem)] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-settings-title"
        @submit.prevent="save"
      >
        <div class="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 id="reminder-settings-title" class="text-[16px] font-bold text-slate-900">Rappels d'événements</h2>
            <p class="text-[12px] text-slate-500 mt-0.5 break-words">{{ subtitle }}</p>
          </div>
          <button type="button" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50" aria-label="Fermer" @click="close">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p v-if="loading" class="px-5 py-8 text-center text-[13px] text-slate-500">Chargement…</p>
        <p v-else-if="loadError" class="px-5 py-8 text-center text-[13px] text-error" role="alert">{{ loadError }}</p>

        <div v-else class="px-5 py-4 space-y-4 overflow-y-auto">
          <p class="text-[12px] text-slate-500">
            Les organisateurs reçoivent ces rappels dans leur cloche.
            <template v-if="level === 'global'">« Par défaut » reprend la configuration du serveur.</template>
            <template v-else>« Hériter » reprend le réglage {{ level === 'event' ? "de l'organisation" : 'de la plateforme' }}.</template>
          </p>

          <div class="grid sm:grid-cols-2 gap-3">
            <label class="block">
              <span class="block text-[12px] font-semibold text-slate-700 mb-1">Rappels</span>
              <select v-model="form.enabled" aria-label="Rappels" :class="selectClass">
                <option value="inherit">{{ inheritLabel(onOff(view!.inherited.enabled, 'Activés', 'Désactivés')) }}</option>
                <option value="on">Activés</option>
                <option value="off">Désactivés</option>
              </select>
            </label>
            <label class="block">
              <span class="block text-[12px] font-semibold text-slate-700 mb-1">Heure d'envoi</span>
              <select v-model="form.sendHour" aria-label="Heure d'envoi" :class="selectClass">
                <option value="inherit">{{ inheritLabel(hourLabel(view!.inherited.sendHour)) }}</option>
                <option v-for="h in 24" :key="h - 1" :value="String(h - 1)">{{ hourLabel(h - 1) }}</option>
              </select>
            </label>
            <label class="block">
              <span class="block text-[12px] font-semibold text-slate-700 mb-1">Premier rappel</span>
              <select v-model="form.firstReminderEnabled" aria-label="Premier rappel" :class="selectClass">
                <option value="inherit">{{ inheritLabel(onOff(view!.inherited.firstReminderEnabled, 'Oui', 'Non')) }}</option>
                <option value="on">Oui</option>
                <option value="off">Non</option>
              </select>
            </label>
            <label class="block">
              <span class="block text-[12px] font-semibold text-slate-700 mb-1">Jours avant le premier rappel</span>
              <select v-model="form.firstReminderDays" aria-label="Jours avant le premier rappel" :class="selectClass">
                <option value="inherit">{{ inheritLabel(`${view!.inherited.firstReminderDays} jours`) }}</option>
                <option v-for="d in 29" :key="d + 1" :value="String(d + 1)">{{ d + 1 }} jours</option>
              </select>
            </label>
            <label class="block">
              <span class="block text-[12px] font-semibold text-slate-700 mb-1">Rappel la veille</span>
              <select v-model="form.eveEnabled" aria-label="Rappel la veille" :class="selectClass">
                <option value="inherit">{{ inheritLabel(onOff(view!.inherited.eveEnabled, 'Oui', 'Non')) }}</option>
                <option value="on">Oui</option>
                <option value="off">Non</option>
              </select>
            </label>
            <label class="block">
              <span class="block text-[12px] font-semibold text-slate-700 mb-1">Rappel le jour J</span>
              <select v-model="form.dayOfEnabled" aria-label="Rappel le jour J" :class="selectClass">
                <option value="inherit">{{ inheritLabel(onOff(view!.inherited.dayOfEnabled, 'Oui', 'Non')) }}</option>
                <option value="on">Oui</option>
                <option value="off">Non</option>
              </select>
            </label>
            <label v-if="view!.timeZoneEditable" class="block sm:col-span-2">
              <span class="block text-[12px] font-semibold text-slate-700 mb-1">Fuseau horaire</span>
              <select v-model="form.timeZone" aria-label="Fuseau horaire" :class="selectClass">
                <option value="inherit">{{ inheritLabel(zoneLabel(view!.inherited.timeZone)) }}</option>
                <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.label }}</option>
              </select>
            </label>
            <p v-else class="sm:col-span-2 text-[12px] text-slate-500">
              Fuseau horaire : celui de l'organisation ({{ zoneLabel(view!.inherited.timeZone) }}).
            </p>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-700" data-testid="reminder-summary">
            <span class="font-semibold">Résultat :</span> {{ summary }}
          </div>
          <p v-if="saveError" class="text-[12px] text-error" role="alert">{{ saveError }}</p>
        </div>

        <div class="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" class="h-10 px-4 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-50" :disabled="saving" @click="close">Annuler</button>
          <button
            type="submit"
            class="h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold disabled:opacity-50"
            :disabled="saving || loading || !!loadError"
          >{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  getReminderSettings, saveReminderSettings, effectiveReminderSettings, describeReminderSettings,
  type ReminderLevel, type ReminderSettings, type ReminderSettingsView,
} from '../../api/reminderSettings'
import { apiErrorMessage } from '../../api/http'

const props = defineProps<{ level: ReminderLevel; targetId?: number; subtitle: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const zones = [
  { id: 'Africa/Kinshasa', label: 'Kinshasa (UTC+1)' },
  { id: 'Africa/Lubumbashi', label: 'Lubumbashi (UTC+2)' },
  { id: 'Africa/Brazzaville', label: 'Brazzaville (UTC+1)' },
  { id: 'Africa/Douala', label: 'Douala (UTC+1)' },
  { id: 'Africa/Lagos', label: 'Lagos (UTC+1)' },
  { id: 'Africa/Abidjan', label: 'Abidjan (UTC+0)' },
  { id: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
  { id: 'Africa/Kigali', label: 'Kigali (UTC+2)' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg (UTC+2)' },
  { id: 'Africa/Nairobi', label: 'Nairobi (UTC+3)' },
  { id: 'Europe/Brussels', label: 'Bruxelles' },
  { id: 'Europe/Paris', label: 'Paris' },
  { id: 'UTC', label: 'UTC' },
]

const selectClass = 'w-full h-10 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20'

type Choice = string // 'inherit' or a value
const form = reactive<Record<keyof ReminderSettings, Choice>>({
  enabled: 'inherit', firstReminderEnabled: 'inherit', firstReminderDays: 'inherit',
  eveEnabled: 'inherit', dayOfEnabled: 'inherit', sendHour: 'inherit', timeZone: 'inherit',
})
const view = ref<ReminderSettingsView | null>(null)
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')

const fromBool = (v: boolean | null): Choice => (v == null ? 'inherit' : v ? 'on' : 'off')
const toBool = (c: Choice): boolean | null => (c === 'inherit' ? null : c === 'on')
const toNum = (c: Choice): number | null => (c === 'inherit' ? null : Number(c))

function fill(v: ReminderSettingsView) {
  view.value = v
  form.enabled = fromBool(v.settings.enabled)
  form.firstReminderEnabled = fromBool(v.settings.firstReminderEnabled)
  form.firstReminderDays = v.settings.firstReminderDays == null ? 'inherit' : String(v.settings.firstReminderDays)
  form.eveEnabled = fromBool(v.settings.eveEnabled)
  form.dayOfEnabled = fromBool(v.settings.dayOfEnabled)
  form.sendHour = v.settings.sendHour == null ? 'inherit' : String(v.settings.sendHour)
  form.timeZone = v.settings.timeZone ?? 'inherit'
}

function current(): ReminderSettings {
  return {
    enabled: toBool(form.enabled),
    firstReminderEnabled: toBool(form.firstReminderEnabled),
    firstReminderDays: toNum(form.firstReminderDays),
    eveEnabled: toBool(form.eveEnabled),
    dayOfEnabled: toBool(form.dayOfEnabled),
    sendHour: toNum(form.sendHour),
    timeZone: form.timeZone === 'inherit' || !view.value?.timeZoneEditable ? null : form.timeZone,
  }
}

const summary = computed(() => view.value
  ? describeReminderSettings(effectiveReminderSettings({ ...view.value, settings: current() }))
  : '')

function inheritLabel(value: string) {
  return `${props.level === 'global' ? 'Par défaut' : 'Hériter'} (${value})`
}
function onOff(v: boolean | null, yes: string, no: string) { return v ? yes : no }
function hourLabel(h: number | null) { return h == null ? '—' : `${String(h).padStart(2, '0')}h00` }
function zoneLabel(id: string | null) { return zones.find((z) => z.id === id)?.label ?? id ?? '—' }

async function save() {
  if (saving.value || !view.value) return
  saving.value = true
  saveError.value = ''
  try {
    fill(await saveReminderSettings(props.level, props.targetId, current()))
    emit('saved')
  } catch (e) {
    saveError.value = apiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

function close() { if (!saving.value) emit('close') }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  try {
    fill(await getReminderSettings(props.level, props.targetId))
  } catch (e) {
    loadError.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>
