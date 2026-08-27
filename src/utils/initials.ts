export function initialsOf(first?: string | null, last?: string | null): string {
  const a = (first || '').trim().charAt(0)
  const b = (last || '').trim().charAt(0)
  return (a + b || '?').toUpperCase().slice(0, 2)
}

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ') || 'Invité'
}
