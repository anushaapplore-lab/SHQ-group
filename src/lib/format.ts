export const DEMO_TODAY = '2026-10-01'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function parseDate(d: string): Date {
  return new Date(d.slice(0, 10) + 'T00:00:00Z')
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return d
  const x = parseDate(d)
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`
}

export function fmtShort(d: string | null | undefined): string {
  if (!d) return '—'
  if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return d
  const x = parseDate(d)
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`
}

export function addDays(d: string, n: number): string {
  const x = parseDate(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000)
}

export function daysUntil(d: string): number {
  return daysBetween(DEMO_TODAY, d)
}

export function sar(value: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    const trim = (x: string) => x.replace(/\.?0+$/, '')
    if (Math.abs(value) >= 1_000_000) return `SAR ${trim((value / 1_000_000).toFixed(Math.abs(value) >= 10_000_000 ? 1 : 2))}M`
    if (Math.abs(value) >= 1_000) return `SAR ${Math.round(value / 1_000)}K`
  }
  return `SAR ${value.toLocaleString('en-US')}`
}

export function sarM(millions: number): string {
  return `SAR ${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`
}

export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`
}

export function num(n: number): string {
  return n.toLocaleString('en-US')
}

export function signed(n: number, suffix = ''): string {
  return `${n > 0 ? '+' : ''}${n}${suffix}`
}

export function clockLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((p) => p && p[0] === p[0].toUpperCase() && p !== 'Al')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
