import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BellRing, CalendarClock, ClipboardCheck, Gauge, PackageSearch, Target, TrendingDown, User, Wrench } from 'lucide-react'
import type { WorkPackage } from '../../data/types'
import { useStore } from '../../store/store'
import { DEMO_TODAY, cx, daysBetween, fmtDate, fmtShort } from '../../lib/format'
import { Button, DataTable, KeyValue, LinkText, Pill, ProgressBar, SlideOver, StatusPill, toneText } from '../ui'
import type { Column } from '../ui'
import { WP_POS, fp, signedPct, timeSpan, variance, varianceTone, wpStatusTone } from './projectMath'

/** Mini Gantt: planned span (light) vs actual/forecast span (dark), today marker. */
export function MiniGantt({ wp, span }: { wp: WorkPackage; span: { start: string; end: string } }) {
  const total = Math.max(1, daysBetween(span.start, span.end))
  const pos = (d: string) => Math.max(0, Math.min(100, (daysBetween(span.start, d) / total) * 100))
  const ps = pos(wp.plannedStart)
  const pf = pos(wp.plannedFinish)
  const as = pos(wp.actualStart ?? wp.plannedStart)
  const ff = pos(wp.forecastFinish)
  const slip = daysBetween(wp.plannedFinish, wp.forecastFinish)
  return (
    <div className="relative h-5 w-44" title={`Planned ${fmtShort(wp.plannedStart)} to ${fmtShort(wp.plannedFinish)} · Forecast finish ${fmtShort(wp.forecastFinish)}`}>
      <div className="absolute top-1 h-1.5 rounded-full bg-[#cbd5e1]" style={{ insetInlineStart: `${ps}%`, width: `${Math.max(1, pf - ps)}%` }} />
      {wp.actualStart && <div className={cx('absolute top-3 h-1.5 rounded-full', slip > 7 ? 'bg-crit' : slip > 0 ? 'bg-[#d97706]' : 'bg-action')} style={{ insetInlineStart: `${as}%`, width: `${Math.max(1, ff - as)}%` }} />}
      <div className="absolute top-0 h-5 w-px bg-ink" style={{ insetInlineStart: `${pos(DEMO_TODAY)}%` }} />
    </div>
  )
}

export function WorkPackageTable({ rows, dense, showGantt = true }: { rows: WorkPackage[]; dense?: boolean; showGantt?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const { state } = useStore()
  const span = timeSpan(rows)
  const open = openId ? state.workPackages.find((w) => w.id === openId) ?? null : null

  const columns: Column<WorkPackage>[] = [
    {
      key: 'name',
      header: 'Work package',
      render: (w) => (
        <div className="min-w-[130px]">
          <div className="font-medium text-ink">{w.name}</div>
          <div className="text-[12px] text-ink-3">{w.id}</div>
        </div>
      ),
    },
    { key: 'ps', header: 'Planned start', render: (w) => <span className="tabular whitespace-nowrap text-ink-2">{fmtDate(w.plannedStart)}</span>, hideBelow: 'lg' },
    { key: 'pf', header: 'Planned finish', render: (w) => <span className="tabular whitespace-nowrap text-ink-2">{fmtDate(w.plannedFinish)}</span> },
    { key: 'as', header: 'Actual start', render: (w) => <span className="tabular whitespace-nowrap text-ink-2">{fmtDate(w.actualStart)}</span>, hideBelow: 'lg' },
    {
      key: 'ff',
      header: 'Forecast finish',
      render: (w) => {
        const slip = daysBetween(w.plannedFinish, w.forecastFinish)
        return <span className={cx('tabular whitespace-nowrap', slip > 7 ? 'font-medium text-crit' : slip > 0 ? 'font-medium text-warn' : 'text-ink-2')}>{fmtDate(w.forecastFinish)}</span>
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (w) => (
        <div className="flex min-w-[120px] items-center gap-2">
          <ProgressBar value={w.progress} marker={w.planned} tone={varianceTone(variance(w)) === 'crit' ? 'crit' : varianceTone(variance(w)) === 'warn' ? 'warn' : 'ok'} className="flex-1" />
          <span className="tabular w-10 text-end font-medium">{fp(w.progress)}%</span>
        </div>
      ),
    },
    { key: 'planned', header: 'Planned', align: 'end', render: (w) => <span className="tabular text-ink-2">{w.planned}%</span> },
    {
      key: 'var',
      header: 'Variance',
      align: 'end',
      render: (w) => <span className={cx('tabular font-semibold', toneText(varianceTone(variance(w))))}>{signedPct(variance(w))}</span>,
    },
    ...(showGantt ? [{ key: 'gantt', header: 'Planned vs forecast', hideBelow: 'md' as const, render: (w: WorkPackage) => <MiniGantt wp={w} span={span} /> }] : []),
    { key: 'status', header: 'Status', render: (w) => <Pill tone={wpStatusTone(w.status)} dot>{w.status}</Pill> },
  ]

  return (
    <>
      <DataTable columns={columns} rows={rows} rowKey={(w) => w.id} onRowClick={(w) => setOpenId(w.id)} dense={dense} highlight={(w) => variance(w) <= -5} />
      <WorkPackageDetail wp={open} onClose={() => setOpenId(null)} />
    </>
  )
}

export function WorkPackageDetail({ wp, onClose }: { wp: WorkPackage | null; onClose: () => void }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  if (!wp) return null
  const v = variance(wp)
  const inspections = state.inspections
    .filter((i) => i.workPackageId === wp.id)
    .sort((a, b) => (a.result === 'Failed' ? -1 : b.result === 'Failed' ? 1 : b.date.localeCompare(a.date)))
    .slice(0, 4)
  const pos = (WP_POS[wp.id] ?? []).map((id) => state.pos.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p)
  const slipDays = daysBetween(wp.plannedFinish, wp.forecastFinish)

  return (
    <SlideOver
      open
      onClose={onClose}
      title={wp.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {wp.id} · {state.projects.find((p) => p.id === wp.projectId)?.shortName}
          <Pill tone={wpStatusTone(wp.status)} dot>
            {wp.status}
          </Pill>
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose(); navigate(`/projects/${wp.projectId}?tab=schedule`) }}>
            Open schedule
          </Button>
          {wp.actionOwner && (
            <Button
              variant="primary"
              icon={BellRing}
              onClick={() => actions.toast({ title: `${wp.actionOwner} notified`, body: `${wp.action ?? 'Recovery action'} requested for ${wp.name} (${wp.affected ?? 'affected scope'}).`, tone: 'info' })}
            >
              Notify owner
            </Button>
          )}
        </>
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-[8px] bg-muted p-3">
          <div className="text-[12px] text-ink-2">Progress</div>
          <div className="tabular mt-1 text-[20px] font-semibold">{fp(wp.progress)}%</div>
        </div>
        <div className="rounded-[8px] bg-muted p-3">
          <div className="text-[12px] text-ink-2">Planned</div>
          <div className="tabular mt-1 text-[20px] font-semibold">{wp.planned}%</div>
        </div>
        <div className="rounded-[8px] bg-muted p-3">
          <div className="text-[12px] text-ink-2">Variance</div>
          <div className={cx('tabular mt-1 text-[20px] font-semibold', toneText(varianceTone(v)))}>{signedPct(v)}</div>
        </div>
      </div>
      <ProgressBar value={wp.progress} marker={wp.planned} tone={varianceTone(v) === 'ok' ? 'ok' : varianceTone(v)} height={8} />

      <h3 className="caps mt-6 mb-1 text-[12px] text-ink-3">Delay analysis</h3>
      {wp.delayCause ? (
        <KeyValue
          rows={[
            { icon: Gauge, label: 'Progress', value: `${fp(wp.progress)}%` },
            { icon: Target, label: 'Planned', value: `${wp.planned}%` },
            { icon: TrendingDown, label: 'Variance', value: <span className={toneText(varianceTone(v))}>{signedPct(v)}</span> },
            { icon: AlertTriangle, label: 'Delay cause', value: <span className="font-medium">{wp.delayCause}</span> },
            { icon: Wrench, label: 'Affected', value: wp.affected ?? '—' },
            { icon: ClipboardCheck, label: 'Action', value: wp.action ?? '—' },
            { icon: User, label: 'Owner', value: wp.actionOwner ?? wp.owner },
            { icon: CalendarClock, label: 'Schedule impact', value: wp.impactDays ? `${wp.impactDays} day${wp.impactDays === 1 ? '' : 's'} on finish` : '—' },
          ]}
        />
      ) : (
        <p className="rounded-[8px] bg-muted px-3 py-2.5 text-[13px] text-ink-2">No delay cause recorded. {v >= 0 ? 'Work package is at or ahead of plan.' : 'Minor variance within tolerance; monitored in the weekly look-ahead.'}</p>
      )}

      <h3 className="caps mt-6 mb-1 text-[12px] text-ink-3">Dates</h3>
      <KeyValue
        rows={[
          { label: 'Planned start', value: fmtDate(wp.plannedStart) },
          { label: 'Planned finish', value: fmtDate(wp.plannedFinish) },
          { label: 'Actual start', value: fmtDate(wp.actualStart) },
          { label: 'Forecast finish', value: <span className={slipDays > 0 ? 'text-crit' : ''}>{fmtDate(wp.forecastFinish)}{slipDays > 0 ? ` (+${slipDays} d)` : ''}</span> },
          { label: 'Package owner', value: wp.owner },
        ]}
      />

      {(pos.length > 0 || inspections.length > 0) && (
        <>
          <h3 className="caps mt-6 mb-2 text-[12px] text-ink-3">Linked records</h3>
          <ul className="divide-y divide-line rounded-[8px] border border-line">
            {pos.map((po) => (
              <li key={po.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]">
                <span className="flex min-w-0 items-center gap-2">
                  <PackageSearch className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                  <span className="min-w-0">
                    <LinkText to={`/procurement/pos/${po.id}`}>{po.id}</LinkText>
                    <span className="block truncate text-[12px] text-ink-3">{po.material}</span>
                  </span>
                </span>
                {po.daysLate > 0 ? <Pill tone="crit" dot>{po.daysLate} days late</Pill> : <StatusPill status={po.status} />}
              </li>
            ))}
            {inspections.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]">
                <span className="flex min-w-0 items-center gap-2">
                  <ClipboardCheck className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                  <span className="min-w-0">
                    <LinkText to={`/quality/inspections/${i.id}`}>{i.id}</LinkText>
                    <span className="block truncate text-[12px] text-ink-3">
                      {i.type} · {i.location}
                    </span>
                  </span>
                </span>
                <StatusPill status={i.result} />
              </li>
            ))}
          </ul>
        </>
      )}
    </SlideOver>
  )
}
