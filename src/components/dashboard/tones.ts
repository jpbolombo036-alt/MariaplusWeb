/** Colour tones of the dashboard, limited to classes that have dark-mode overrides in style.css. */
export type Tone = 'primary' | 'amber' | 'green' | 'blue' | 'red' | 'slate'

export const TONE_CHIP: Record<Tone, string> = {
  primary: 'bg-primary-light text-primary',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-green-50 text-green-700',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
}

export const TONE_BAR: Record<Tone, string> = {
  primary: 'bg-primary',
  amber: 'bg-amber-500',
  green: 'bg-green-600',
  blue: 'bg-blue-600',
  red: 'bg-red-600',
  slate: 'bg-slate-400',
}
