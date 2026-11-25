/** Whole days from today (local) to an ISO date (yyyy-mm-dd); null without a valid date. */
export function daysUntil(isoDate?: string | null, now: Date = new Date()): number | null {
  if (!isoDate) return null
  const target = new Date(`${isoDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Integer percentage of part/whole, 0 when whole is 0. */
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

/** "1 invité" / "12 invités" style plural. */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`
}
