import { http, decodeMap } from './http'

export type ReminderLevel = 'global' | 'organization' | 'event'

/** null = inherit from the level above (event → organization → global → server). */
export interface ReminderSettings {
  enabled: boolean | null
  firstReminderEnabled: boolean | null
  firstReminderDays: number | null
  eveEnabled: boolean | null
  dayOfEnabled: boolean | null
  sendHour: number | null
  timeZone: string | null
}

export interface ReminderSettingsView {
  settings: ReminderSettings
  /** Values this level inherits: always filled in. */
  inherited: ReminderSettings
  timeZoneEditable: boolean
}

function path(level: ReminderLevel, id?: number): string {
  if (level === 'global') return '/api/admin/reminder-settings'
  if (level === 'organization') return `/api/organizations/${id}/reminder-settings`
  return `/api/events/${id}/reminder-settings`
}

function parseSettings(j: Record<string, unknown> | undefined): ReminderSettings {
  const o = j ?? {}
  const bool = (v: unknown) => (v == null ? null : Boolean(v))
  const num = (v: unknown) => (v == null ? null : Number(v))
  return {
    enabled: bool(o.enabled),
    firstReminderEnabled: bool(o.firstReminderEnabled),
    firstReminderDays: num(o.firstReminderDays),
    eveEnabled: bool(o.eveEnabled),
    dayOfEnabled: bool(o.dayOfEnabled),
    sendHour: num(o.sendHour),
    timeZone: o.timeZone == null ? null : String(o.timeZone),
  }
}

function parseView(data: unknown): ReminderSettingsView {
  const j = decodeMap(data)
  return {
    settings: parseSettings(j.settings as Record<string, unknown>),
    inherited: parseSettings(j.inherited as Record<string, unknown>),
    timeZoneEditable: Boolean(j.timeZoneEditable),
  }
}

export async function getReminderSettings(level: ReminderLevel, id?: number): Promise<ReminderSettingsView> {
  const res = await http.get(path(level, id), { skipNotification: true })
  return parseView(res.data)
}

export async function saveReminderSettings(level: ReminderLevel, id: number | undefined, settings: ReminderSettings): Promise<ReminderSettingsView> {
  const res = await http.put(path(level, id), settings, { skipNotification: true })
  return parseView(res.data)
}

/** The values that apply at this level: its own, else the inherited ones. */
export function effectiveReminderSettings(view: ReminderSettingsView): ReminderSettings {
  const s = view.settings
  const p = view.inherited
  return {
    enabled: s.enabled ?? p.enabled,
    firstReminderEnabled: s.firstReminderEnabled ?? p.firstReminderEnabled,
    firstReminderDays: s.firstReminderDays ?? p.firstReminderDays,
    eveEnabled: s.eveEnabled ?? p.eveEnabled,
    dayOfEnabled: s.dayOfEnabled ?? p.dayOfEnabled,
    sendHour: s.sendHour ?? p.sendHour,
    timeZone: s.timeZone ?? p.timeZone,
  }
}

/** Plain-French summary, e.g. "7 jours avant, la veille et le jour J, à 08h (Africa/Kinshasa)". */
export function describeReminderSettings(e: ReminderSettings): string {
  if (!e.enabled) return 'Aucun rappel'
  const moments: string[] = []
  if (e.firstReminderEnabled && e.firstReminderDays) moments.push(`${e.firstReminderDays} jours avant`)
  if (e.eveEnabled) moments.push('la veille')
  if (e.dayOfEnabled) moments.push('le jour J')
  if (!moments.length) return 'Aucun rappel'
  const list = moments.length === 1 ? moments[0] : `${moments.slice(0, -1).join(', ')} et ${moments[moments.length - 1]}`
  const hour = e.sendHour == null ? '' : `, à ${String(e.sendHour).padStart(2, '0')}h`
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}${hour}${e.timeZone ? ` (${e.timeZone})` : ''}`
}
