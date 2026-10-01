import type { ReactNode } from 'react'
import { Filter } from 'lucide-react'
import type { PurchaseOrder } from '../../data/types'
import { cx } from '../../lib/format'
import { poVariance } from '../../store/selectors'
import type { AppState } from '../../store/seed'
import { Pill } from '../ui'

/* Shared chart styling for the department modules (procurement, HR, O&M). */
export const CHART = {
  primary: '#1d4ed8',
  planned: '#94a3b8',
  ok: '#15803d',
  warn: '#d97706',
  crit: '#b91c1c',
  grid: '#eef0f3',
  tick: { fontSize: 12, fill: '#7b7d81' },
  tooltip: { borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 },
}

/** Compact SAR with one decimal for millions (SAR 4.2M), thousands as K. */
export function sarCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `SAR ${(Math.round(v / 100_000) / 10).toString()}M`
  if (Math.abs(v) >= 1_000) return `SAR ${Math.round(v / 1_000)}K`
  return `SAR ${v.toLocaleString('en-US')}`
}

export const varianceTone = (v: number) => (v > 5 ? 'crit' : v > 0.05 ? 'warn' : 'ok')

export function VarianceText({ po, value, className }: { po?: PurchaseOrder; value?: number; className?: string }) {
  const v = value ?? (po ? poVariance(po) : 0)
  const t = varianceTone(v)
  return (
    <span className={cx('tabular font-medium', t === 'crit' ? 'text-crit' : t === 'warn' ? 'text-warn' : 'text-ok', className)}>
      {v > 0 ? '+' : ''}
      {v.toFixed(1)}%
    </span>
  )
}

export function DeliveryText({ daysLate, status }: { daysLate: number; status?: string }) {
  if (status === 'Delivered') return <span className="text-ok">Delivered</span>
  if (daysLate <= 0) return <span className="text-ink-2">On schedule</span>
  return <span className={cx('tabular font-medium', daysLate > 7 ? 'text-crit' : 'text-warn')}>{daysLate} days late</span>
}

export const vendorName = (s: AppState, id: string) => s.vendors.find((v) => v.id === id)?.name ?? id

export function ProjectFilterNote({ state }: { state: AppState }) {
  if (state.projectFilter === 'all') return null
  const p = state.projects.find((x) => x.id === state.projectFilter)
  return (
    <Pill tone="info" className="gap-1">
      <Filter className="size-3" strokeWidth={2} />
      Filtered: {p?.shortName ?? state.projectFilter}
    </Pill>
  )
}

export function MiniStat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[8px] bg-muted px-3 py-2.5">
      <div className="truncate text-[12px] text-ink-2">{label}</div>
      <div className="tabular mt-0.5 text-[16px] font-semibold text-ink">{value}</div>
      {sub && <div className="truncate text-[12px] text-ink-3">{sub}</div>}
    </div>
  )
}

export function Timeline({ items }: { items: { key: string; title: ReactNode; meta?: ReactNode; tone?: 'ok' | 'warn' | 'crit' | 'info' | 'neutral' }[] }) {
  const dot = { ok: 'bg-ok', warn: 'bg-[#d97706]', crit: 'bg-crit', info: 'bg-action', neutral: 'bg-ink-3' }
  return (
    <ol className="relative space-y-4 border-s border-line ps-5">
      {items.map((it) => (
        <li key={it.key} className="relative">
          <span className={cx('absolute -start-[25px] top-1.5 size-2.5 rounded-full ring-4 ring-surface', dot[it.tone ?? 'neutral'])} />
          <div className="text-[14px] text-ink">{it.title}</div>
          {it.meta && <div className="mt-0.5 text-[12px] text-ink-3">{it.meta}</div>}
        </li>
      ))}
    </ol>
  )
}

export function ScoreBar({ label, value, suffix = '%' }: { label: string; value: number; suffix?: string }) {
  const tone = value >= 85 ? 'bg-ok' : value >= 75 ? 'bg-[#d97706]' : 'bg-crit'
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-ink-2">{label}</span>
        <span className="tabular font-medium text-ink">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#eef0f3]">
        <div className={cx('h-full rounded-full', tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}

export const SUGGESTED_ACTIONS = [
  'Review contractual price protection.',
  'Request commercial justification.',
  'Check approved alternate vendors.',
  'Compare available stock.',
  'Escalate to Procurement Head.',
]

export const DELAY_ACTIONS = [
  'Request recovery schedule from vendor.',
  'Assign expediter for vendor works visit.',
  'Check alternate source or available stock.',
  'Assess schedule impact with planning.',
  'Escalate to Procurement Head.',
]

/** Illustrative alternate-vendor quotes relative to the original PO rate. */
export const VENDOR_COMPARE: Record<string, { factor: number; lead: number; note: string }> = {
  'V-GIS': { factor: 0, lead: 24, note: 'Current vendor' },
  'V-ANE': { factor: 1.065, lead: 30, note: 'Limited X65 mill allocation' },
  'V-DPM': { factor: 1.025, lead: 18, note: 'Stock available at Dammam yard' },
  'V-HTS': { factor: 1.09, lead: 38, note: 'Not a line pipe specialist' },
}
