import { Filter } from 'lucide-react'
import type { NCR } from '../../data/types'
import { cx } from '../../lib/format'
import { projectName } from '../../store/selectors'
import { ncrAge, ncrOverdue } from '../../store/selectors'
import { useStore } from '../../store/store'
import type { Tone } from '../ui'
import { Pill, ProgressBar } from '../ui'

export const DISCIPLINES = ['Material', 'Welding', 'Civil', 'E&I', 'Coating', 'Hydrotest', 'Pipeline Integrity'] as const

export const NCR_STAGES: NCR['status'][] = ['Open', 'Investigation', 'CAPA Submitted', 'Verification', 'Closed']

export const CHART_TOOLTIP = { borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 }
export const AXIS_TICK = { fontSize: 12, fill: '#7b7d81' }

/** Closure SLA status for an NCR. */
export function ncrSla(n: NCR): { age: number; label: string; tone: Tone; pct: number; overdueBy: number } {
  const age = ncrAge(n)
  const pct = n.slaDays ? Math.min(100, Math.round((age / n.slaDays) * 100)) : 0
  if (n.status === 'Closed') return { age, label: 'Closed', tone: 'ok', pct: 100, overdueBy: 0 }
  if (ncrOverdue(n)) return { age, label: 'OVERDUE', tone: 'crit', pct: 100, overdueBy: age - n.slaDays }
  if (age === n.slaDays) return { age, label: 'Due today', tone: 'warn', pct, overdueBy: 0 }
  if (n.slaDays - age <= 1) return { age, label: 'Due tomorrow', tone: 'warn', pct, overdueBy: 0 }
  return { age, label: 'On track', tone: 'ok', pct, overdueBy: 0 }
}

export function SeverityPill({ severity }: { severity: string }) {
  const tone: Tone = severity === 'Critical' ? 'crit' : severity === 'Major' ? 'warn' : 'neutral'
  return <Pill tone={tone}>{severity}</Pill>
}

export function NcrAgeCell({ ncr }: { ncr: NCR }) {
  const s = ncrSla(ncr)
  return (
    <div className="min-w-[96px]">
      <div className={cx('tabular text-[13px]', s.tone === 'crit' ? 'font-semibold text-crit' : 'text-ink')}>
        {s.age}d <span className="font-normal text-ink-3">/ {ncr.slaDays}d</span>
      </div>
      {ncr.status !== 'Closed' && <ProgressBar value={s.pct} tone={s.tone === 'crit' ? 'crit' : s.tone === 'warn' ? 'warn' : 'ok'} height={4} className="mt-1" />}
    </div>
  )
}

/** Small note shown on list pages when the global project filter is active. */
export function ProjectFilterNote({ className }: { className?: string }) {
  const { state, actions } = useStore()
  if (state.projectFilter === 'all') return null
  return (
    <div className={cx('mb-4 flex flex-wrap items-center gap-2 text-[13px] text-ink-2', className)}>
      <Filter className="size-4 text-ink-3" strokeWidth={1.5} />
      Showing records for
      <Pill tone="info">{projectName(state, state.projectFilter)}</Pill>
      <button type="button" className="text-[12px] font-medium text-action hover:underline" onClick={() => actions.setProjectFilter('all')}>
        Show all projects
      </button>
    </div>
  )
}

export function useProjectShort() {
  const { state } = useStore()
  return (id: string) => state.projects.find((p) => p.id === id)?.shortName ?? id
}

/** Illustrative acceptance-criteria notes for common findings. */
export const FINDING_LIBRARY: Record<string, { severity: 'Minor' | 'Major' | 'Critical'; measured: string; criteria: string; method: string }> = {
  Undercut: {
    severity: 'Major',
    measured: 'External undercut 1.1 mm deep, 32 mm long at the 4 o\'clock position (cap pass).',
    criteria: 'API 1104 cl. 9.7: undercut adjacent to the cover pass deeper than 0.8 mm (or 12.5% of WT, whichever is smaller) is not acceptable.',
    method: 'Visual (VT) with undercut gauge',
  },
  'Incomplete penetration': {
    severity: 'Critical',
    measured: 'Incomplete penetration of the root (IP) over 38 mm continuous length, 11 to 12 o\'clock. Radiograph RT-00428.',
    criteria: 'API 1104 cl. 9.3.1: an individual IP indication longer than 25 mm, or aggregate over 25 mm in any 300 mm of weld, is rejectable.',
    method: 'Radiography (RT), gamma Ir-192, DWSI',
  },
  Porosity: {
    severity: 'Major',
    measured: 'Cluster porosity, max pore 3.4 mm, at spool joint W-B14-07.',
    criteria: 'API 1104 cl. 9.3.9: individual pore above 3 mm or 25% of WT is not acceptable.',
    method: 'Liquid penetrant (PT) and visual',
  },
  'Low dry film thickness': {
    severity: 'Minor',
    measured: 'DFT readings 165 to 190 µm on 4 of 12 spots.',
    criteria: 'Project coating specification: minimum 250 µm DFT for the epoxy system. SSPC-PA 2 spot measurement.',
    method: 'DFT gauge (calibrated DFT-05)',
  },
}
