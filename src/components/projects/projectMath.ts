import type { Phase, Project, WorkPackage } from '../../data/types'
import type { Step, Tone } from '../ui'
import { DEMO_TODAY, daysBetween, parseDate } from '../../lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Format a percentage value that may be fractional after DPR updates. */
export const fp = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export const variance = (wp: { progress: number; planned: number }) => Math.round((wp.progress - wp.planned) * 10) / 10

export const varianceTone = (v: number): Tone => (v >= 0 ? 'ok' : v > -5 ? 'warn' : 'crit')

export const signedPct = (v: number) => `${v > 0 ? '+' : ''}${fp(v)}%`

export const wpStatusTone = (status: string): Tone =>
  status === 'Delayed' ? 'crit' : status === 'At Risk' ? 'warn' : status === 'Completed' || status === 'On Track' ? 'ok' : 'info'

export const ragTone = (rag: Project['rag']): Tone => (rag === 'GREEN' ? 'ok' : rag === 'AMBER' ? 'warn' : 'crit')

export const scoreTone = (n: number, good = 92, warn = 85): Tone => (n >= good ? 'ok' : n >= warn ? 'warn' : 'crit')

export function scheduleLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} behind`
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ahead`
  return 'On schedule'
}

export const costConsumed = (p: Project) => Math.round((p.actual / p.budget) * 1000) / 10

export function phaseSteps(phases: Phase[]): Step[] {
  return phases.map((ph) => ({
    label: ph.name,
    state: ph.progress >= 100 ? 'done' : ph.progress > 0 ? 'current' : 'future',
    caption: ph.progress >= 100 ? 'Completed' : `${ph.progress}%`,
  }))
}

export function costMetrics(p: Project) {
  const earned = (p.progress / 100) * p.budget
  const plannedValue = (p.planned / 100) * p.budget
  const cpi = p.actual > 0 ? earned / p.actual : 1
  const spi = p.planned > 0 ? p.progress / p.planned : 1
  const committed = Math.min(p.budget, p.actual * 1.12)
  const eac = cpi > 0 ? p.budget / cpi : p.budget
  return {
    earned: Math.round(earned * 10) / 10,
    plannedValue: Math.round(plannedValue * 10) / 10,
    cpi: Math.round(cpi * 100) / 100,
    spi: Math.round(spi * 100) / 100,
    committed: Math.round(committed * 10) / 10,
    eac: Math.round(eac * 10) / 10,
    vac: Math.round((p.budget - eac) * 10) / 10,
  }
}

export const COST_SPLIT = [
  { name: 'Materials', w: 0.38 },
  { name: 'Labour', w: 0.24 },
  { name: 'Subcontract', w: 0.2 },
  { name: 'Equipment', w: 0.11 },
  { name: 'Indirects', w: 0.07 },
]

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x))
  return c * c * (3 - 2 * c)
}

/** First-of-month list covering [from, to]. */
export function monthsBetween(from: string, to: string): string[] {
  const a = parseDate(from)
  const b = parseDate(to)
  const out: string[] = []
  const d = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1))
  while (d <= b) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return out
}

export const monthLabel = (iso: string, withYear = false) => {
  const d = parseDate(iso)
  return withYear ? `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}` : MONTHS[d.getUTCMonth()]
}

/**
 * Plausible monthly S-curve. Planned and actual pass exactly through the project's
 * current planned / actual % at the demo date; forecast runs to 100% at the forecast finish.
 */
export function sCurve(p: Project) {
  const total = Math.max(1, daysBetween(p.startDate, p.finishDate))
  const xToday = Math.max(0.01, daysBetween(p.startDate, DEMO_TODAY) / total)
  const fT = smooth(xToday) || 0.01
  const forecastFinishX = (total - p.scheduleVarianceDays) / total
  const finishEnd = p.scheduleVarianceDays < 0 ? new Date(parseDate(p.finishDate).getTime() - p.scheduleVarianceDays * 86400000).toISOString().slice(0, 10) : p.finishDate
  const pts = monthsBetween(p.startDate, finishEnd)
  const lastPast = pts.filter((q) => q <= DEMO_TODAY).slice(-1)[0]
  return pts.map((m) => {
    const x = daysBetween(p.startDate, m) / total
    const fx = smooth(x)
    const planned = x <= xToday ? (p.planned * fx) / fT : p.planned + ((100 - p.planned) * (fx - fT)) / Math.max(0.0001, 1 - fT)
    const isPast = m <= DEMO_TODAY
    const actual = isPast ? (p.progress * fx) / fT : null
    let forecast: number | null = null
    if (m === lastPast) forecast = actual
    else if (!isPast) {
      // decelerating tail of the S-curve from today's actual to 100% at forecast finish
      const span = Math.max(0.0001, forecastFinishX - xToday)
      const t = Math.max(0, Math.min(1, (x - xToday) / span))
      forecast = p.progress + (100 - p.progress) * ((smooth(0.5 + t * 0.5) - 0.5) / 0.5)
    }
    return {
      month: monthLabel(m, true),
      iso: m,
      planned: Math.round(Math.min(100, planned) * 10) / 10,
      actual: actual === null ? null : Math.round(Math.min(100, actual) * 10) / 10,
      forecast: forecast === null ? null : Math.round(Math.min(100, forecast) * 10) / 10,
    }
  })
}

/** Monthly spend derived from the actual S-curve (SAR M). */
export function monthlySpend(p: Project) {
  const curve = sCurve(p).filter((c) => c.actual !== null)
  const last = curve[curve.length - 1]?.actual ?? 1
  return curve.slice(1).map((c, i) => {
    const prev = curve[i].actual ?? 0
    const share = ((c.actual ?? 0) - prev) / (last || 1)
    return { month: c.month, spend: Math.round(share * p.actual * 100) / 100 }
  })
}

export const TRADES = [
  { trade: 'Welders', w: 0.17 },
  { trade: 'Pipe fitters', w: 0.13 },
  { trade: 'Equipment operators', w: 0.12 },
  { trade: 'Civil labour', w: 0.21 },
  { trade: 'Riggers', w: 0.08 },
  { trade: 'Coating crew', w: 0.07 },
  { trade: 'E&I technicians', w: 0.06 },
  { trade: 'Supervision', w: 0.08 },
  { trade: 'QA/QC and NDT', w: 0.05 },
  { trade: 'HSE', w: 0.03 },
]

/** Illustrative split of project workforce across trades. Totals reconcile exactly. */
export function tradeSplit(p: Project) {
  // skilled trades carry most of the shortfall (illustrative)
  const gapWeight = [1.6, 1.2, 0.8, 0.6, 1.2, 0.8, 1.4, 0.4, 1.6, 0.4]
  const gap = p.workforcePlanned - p.workforce
  const gw = gapWeight.reduce((a, g, i) => a + g * TRADES[i].w, 0)
  const rows = TRADES.map((t, i) => {
    const planned = Math.round(p.workforcePlanned * t.w)
    return { trade: t.trade, planned, actual: Math.round(planned - (gap * t.w * gapWeight[i]) / gw) }
  })
  const fix = (key: 'planned' | 'actual', total: number) => {
    const diff = total - rows.reduce((a, r) => a + r[key], 0)
    rows[3][key] += diff
  }
  fix('planned', p.workforcePlanned)
  fix('actual', p.workforce)
  return rows
}

export const timeSpan = (wps: WorkPackage[]) => {
  const start = wps.reduce((a, w) => (w.plannedStart < a ? w.plannedStart : a), wps[0]?.plannedStart ?? DEMO_TODAY)
  const end = wps.reduce((a, w) => {
    const f = w.forecastFinish > w.plannedFinish ? w.forecastFinish : w.plannedFinish
    return f > a ? f : a
  }, wps[0]?.plannedFinish ?? DEMO_TODAY)
  return { start, end }
}

/** Related records for work package detail (demo linkage). */
export const WP_POS: Record<string, string[]> = {
  'NPE-WP03': ['PO-450021', 'PO-450037'],
  'NPE-WP04': ['PO-450021', 'PO-450044'],
  'NPE-WP05': ['PO-450048'],
  'NPE-WP06': ['PO-450050'],
}
