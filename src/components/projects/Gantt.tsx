import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Project, WorkPackage } from '../../data/types'
import { DEMO_TODAY, cx, daysBetween, fmtShort } from '../../lib/format'
import { WorkPackageDetail } from './WorkPackageTable'
import { useStore } from '../../store/store'
import { fp, monthLabel, monthsBetween, sCurve, signedPct, timeSpan, variance, varianceTone } from './projectMath'
import { toneText } from '../ui'

export const TOOLTIP_STYLE = { borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 }
export const AXIS_TICK = { fontSize: 12, fill: '#7b7d81' }

/** Gantt-style timeline across months (CSS grid). Planned bar light, forecast/actual darker, today line. */
export function GanttChart({ rows }: { rows: WorkPackage[] }) {
  const { state } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  if (rows.length === 0) return null
  const span = timeSpan(rows)
  const months = monthsBetween(span.start, span.end)
  const start = months[0]
  const endD = new Date(months[months.length - 1] + 'T00:00:00Z')
  endD.setUTCMonth(endD.getUTCMonth() + 1)
  const end = endD.toISOString().slice(0, 10)
  const total = daysBetween(start, end)
  const pos = (d: string) => Math.max(0, Math.min(100, (daysBetween(start, d) / total) * 100))
  const today = pos(DEMO_TODAY)
  const open = openId ? state.workPackages.find((w) => w.id === openId) ?? null : null

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[170px_1fr] border-b border-line">
          <div className="caps px-3 py-2 text-[11px] text-ink-3">Work package</div>
          <div className="relative flex">
            {months.map((m) => (
              <div key={m} className="flex-1 border-s border-line px-1 py-2 text-center text-[11px] text-ink-3">
                {monthLabel(m, m.slice(5, 7) === '01' || m === start)}
              </div>
            ))}
          </div>
        </div>
        {rows.map((w) => {
          const v = variance(w)
          const slip = daysBetween(w.plannedFinish, w.forecastFinish)
          const late = slip > 0
          const barCls = slip > 7 ? 'bg-crit' : slip > 0 ? 'bg-[#d97706]' : 'bg-action'
          const as = w.actualStart ?? w.plannedStart
          const done = pos(as) + ((pos(w.forecastFinish) - pos(as)) * w.progress) / 100
          return (
            <button
              type="button"
              key={w.id}
              onClick={() => setOpenId(w.id)}
              className="grid w-full grid-cols-[170px_1fr] border-b border-line text-start last:border-b-0 hover:bg-[#f9fafb]"
            >
              <div className="min-w-0 px-3 py-2.5">
                <div className="truncate text-[13px] font-medium text-ink">{w.name}</div>
                <div className="text-[11px] text-ink-3">
                  {fp(w.progress)}% · <span className={toneText(varianceTone(v))}>{signedPct(v)}</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex">
                  {months.map((m) => (
                    <div key={m} className="flex-1 border-s border-line/70" />
                  ))}
                </div>
                <div
                  className="absolute top-[10px] h-2.5 rounded-full bg-[#dbe1ea]"
                  style={{ insetInlineStart: `${pos(w.plannedStart)}%`, width: `${Math.max(0.8, pos(w.plannedFinish) - pos(w.plannedStart))}%` }}
                  title={`Planned ${fmtShort(w.plannedStart)} to ${fmtShort(w.plannedFinish)}`}
                />
                {w.actualStart && (
                  <>
                    <div
                      className={cx('absolute top-[25px] h-2.5 rounded-full opacity-35', barCls)}
                      style={{ insetInlineStart: `${pos(as)}%`, width: `${Math.max(0.8, pos(w.forecastFinish) - pos(as))}%` }}
                      title={`Forecast finish ${fmtShort(w.forecastFinish)}`}
                    />
                    <div
                      className={cx('absolute top-[25px] h-2.5 rounded-full', barCls)}
                      style={{ insetInlineStart: `${pos(as)}%`, width: `${Math.max(0.8, done - pos(as))}%` }}
                    />
                  </>
                )}
                {late && (
                  <span className={cx('absolute top-[22px] text-[10px] font-semibold', slip > 7 ? 'text-crit' : 'text-warn')} style={{ insetInlineStart: `calc(${pos(w.forecastFinish)}% + 4px)` }}>
                    +{slip}d
                  </span>
                )}
                <div className="absolute top-0 bottom-0 w-px bg-crit" style={{ insetInlineStart: `${today}%` }} />
              </div>
            </button>
          )
        })}
        <div className="flex flex-wrap items-center gap-4 border-t border-line px-3 py-2.5 text-[12px] text-ink-2">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-full bg-[#dbe1ea]" />Planned (baseline)</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-full bg-action" />Actual to date</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-full bg-action opacity-35" />Forecast</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-full bg-[#d97706]" />Slip up to 7 days</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-full bg-crit" />Slip over 7 days</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-crit" />Today, {fmtShort(DEMO_TODAY)} 2026</span>
        </div>
      </div>
      <WorkPackageDetail wp={open} onClose={() => setOpenId(null)} />
    </div>
  )
}

export function SCurveChart({ project, height = 260 }: { project: Project; height?: number }) {
  const data = sCurve(project)
  const todayLabel = data.filter((d) => d.iso <= DEMO_TODAY).slice(-1)[0]?.month
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#eef0f3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e8eaee' }} interval="preserveStartEnd" minTickGap={18} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => (v === null || v === undefined ? '—' : `${v}%`)} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
          {todayLabel && <ReferenceLine x={todayLabel} stroke="#b91c1c" strokeDasharray="3 3" label={{ value: 'Today', fontSize: 11, fill: '#b91c1c', position: 'insideTopRight' }} />}
          <Line type="monotone" dataKey="planned" name="Planned cumulative" stroke="#94a3b8" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="actual" name="Actual cumulative" stroke="#1d4ed8" strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#1d4ed8" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
