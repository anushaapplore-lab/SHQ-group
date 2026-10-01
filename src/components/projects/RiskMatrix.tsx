import { useNavigate } from 'react-router-dom'
import { BellRing, ShieldAlert } from 'lucide-react'
import type { Risk } from '../../data/types'
import { useStore } from '../../store/store'
import { cx, fmtDate } from '../../lib/format'
import { Button, KeyValue, Pill, SlideOver } from '../ui'
import type { Tone } from '../ui'

export const riskScore = (r: Risk) => r.probability * r.impact
export const riskTone = (score: number): Tone => (score >= 15 ? 'crit' : score >= 8 ? 'warn' : 'ok')
export const riskLevel = (score: number) => (score >= 15 ? 'High' : score >= 8 ? 'Medium' : 'Low')

const CELL_BG = (score: number) => (score >= 15 ? 'bg-crit-bg' : score >= 8 ? 'bg-warn-bg' : 'bg-ok-bg')

export function RiskScorePill({ risk }: { risk: Risk }) {
  const s = riskScore(risk)
  return (
    <Pill tone={riskTone(s)} className="tabular">
      {s} · {riskLevel(s)}
    </Pill>
  )
}

/** 5 x 5 probability x impact heat map. Click a cell to filter. */
export function RiskHeatMap({ risks, selected, onSelect, compact }: { risks: Risk[]; selected?: string | null; onSelect?: (cell: string | null) => void; compact?: boolean }) {
  const size = compact ? 'h-9' : 'h-11'
  return (
    <div className="flex gap-2">
      <div className="flex w-4 items-center justify-center">
        <span className="-rotate-90 text-[11px] whitespace-nowrap text-ink-3">Probability</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-[18px_repeat(5,minmax(0,1fr))] gap-1">
          {[5, 4, 3, 2, 1].map((p) => (
            <div key={p} className="contents">
              <span className="flex items-center justify-center text-[11px] text-ink-3">{p}</span>
              {[1, 2, 3, 4, 5].map((i) => {
                const key = `${p}-${i}`
                const n = risks.filter((r) => r.probability === p && r.impact === i).length
                const active = selected === key
                return (
                  <button
                    type="button"
                    key={key}
                    disabled={!onSelect}
                    onClick={() => onSelect?.(active ? null : key)}
                    title={`Probability ${p} × Impact ${i} = ${p * i}: ${n} risk${n === 1 ? '' : 's'}`}
                    className={cx(
                      'flex items-center justify-center rounded-[6px] text-[13px] font-semibold tabular',
                      size,
                      CELL_BG(p * i),
                      n ? 'text-ink' : 'text-transparent',
                      active && 'ring-2 ring-shell',
                      onSelect && 'hover:brightness-95',
                    )}
                  >
                    {n || '·'}
                  </button>
                )
              })}
            </div>
          ))}
          <span />
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="text-center text-[11px] text-ink-3">
              {i}
            </span>
          ))}
        </div>
        <div className="mt-1 text-center text-[11px] text-ink-3">Impact</div>
      </div>
    </div>
  )
}

export function RiskDetail({ risk, onClose }: { risk: Risk | null; onClose: () => void }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  if (!risk) return null
  const s = riskScore(risk)
  const project = state.projects.find((p) => p.id === risk.projectId)
  return (
    <SlideOver
      open
      onClose={onClose}
      title={risk.title}
      subtitle={`${risk.id} · ${project?.name ?? risk.projectId}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose(); navigate(`/projects/${risk.projectId}?tab=risks`) }}>
            Open project risks
          </Button>
          <Button
            variant="primary"
            icon={BellRing}
            onClick={() => actions.toast({ title: 'Mitigation review requested', body: `${risk.owner} asked to update mitigation status for ${risk.id}.`, tone: 'info' })}
          >
            Request update
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-[8px] bg-muted p-3">
        <ShieldAlert className={cx('size-6', s >= 15 ? 'text-crit' : s >= 8 ? 'text-warn' : 'text-ok')} strokeWidth={1.5} />
        <div>
          <div className="tabular text-[20px] font-semibold text-ink">
            {risk.probability} × {risk.impact} = {s}
          </div>
          <div className="text-[12px] text-ink-2">Probability × impact · {riskLevel(s)} risk</div>
        </div>
      </div>
      <KeyValue
        rows={[
          { label: 'Category', value: risk.category },
          { label: 'Status', value: <Pill tone={risk.status === 'Open' ? 'warn' : 'ok'} dot>{risk.status}</Pill> },
          { label: 'Owner', value: risk.owner },
          { label: 'Mitigation', value: risk.mitigation },
          { label: 'Raised', value: fmtDate(risk.createdAt) },
          { label: 'Last reviewed', value: fmtDate(risk.updatedAt) },
        ]}
      />
      <h3 className="caps mt-6 mb-2 text-[12px] text-ink-3">Position</h3>
      <RiskHeatMap risks={[risk]} compact />
    </SlideOver>
  )
}
