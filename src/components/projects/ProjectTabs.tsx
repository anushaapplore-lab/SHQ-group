import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ClipboardCheck,
  Coins,
  FileStack,
  Gauge,
  HardHat,
  PackageSearch,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react'
import type { Project } from '../../data/types'
import { manpowerByProject, idleCauses } from '../../data/hr'
import { useStore } from '../../store/store'
import { handoverPct, mdrSummary, ncrAge, ncrOverdue, openNcrs, overdueNcrs, poVariance } from '../../store/selectors'
import { cx, fmtDate, num, sar, sarM } from '../../lib/format'
import {
  Avatar,
  Button,
  Card,
  DataTable,
  DemoTag,
  EmptyState,
  FileTile,
  FilterChip,
  Kpi,
  LevelPill,
  LinkText,
  Pill,
  ProgressBar,
  StatLine,
  StatusPill,
  toneText,
} from '../ui'
import type { Column, Tone } from '../ui'
import { AXIS_TICK, TOOLTIP_STYLE } from './Gantt'
import { RiskDetail, RiskHeatMap, RiskScorePill, riskScore } from './RiskMatrix'
import { ActivityTimeline } from './ActivityTimeline'
import { COST_SPLIT, costConsumed, costMetrics, fp, monthlySpend, scheduleLabel, scoreTone, signedPct, tradeSplit, variance, varianceTone } from './projectMath'

export type TabId = 'overview' | 'progress' | 'schedule' | 'cost' | 'qaqc' | 'hse' | 'manpower' | 'procurement' | 'documents' | 'risks' | 'handover' | 'activity'

/* ---------------- Overview ---------------- */

export function OverviewTab({ project: p, onTab }: { project: Project; onTab: (t: TabId) => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const v = variance(p)
  const ho = handoverPct(state, p.id)
  const issues = state.alerts
    .filter((a) => a.projectId === p.id && a.status !== 'Resolved')
    .sort((a, b) => (a.level === b.level ? 0 : a.level === 'critical' ? -1 : b.level === 'critical' ? 1 : a.level === 'warning' ? -1 : 1))
    .slice(0, 4)
  const acts = state.activities.filter((a) => a.projectId === p.id).slice(0, 6)
  const risks = state.risks.filter((r) => r.projectId === p.id && r.status === 'Open')
  const highRisks = risks.filter((r) => riskScore(r) >= 15).length
  const ragTone: Tone = p.rag === 'GREEN' ? 'ok' : p.rag === 'AMBER' ? 'warn' : 'crit'

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-[19px] font-medium text-ink">Project health</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="RAG" value={<span className={toneText(ragTone)}>{p.rag}</span>} sub={`Health score ${p.health}`} icon={Gauge} tone={ragTone} />
          <Kpi label="Progress" value={`${fp(p.progress)} / ${p.planned}%`} sub={<span className={toneText(varianceTone(v))}>{signedPct(v)} vs plan</span>} icon={ClipboardCheck} onClick={() => onTab('progress')} />
          <Kpi label="Cost" value={`${costConsumed(p)}%`} sub={`consumed · ${sarM(p.actual)} of ${sarM(p.budget)}`} icon={Coins} onClick={() => onTab('cost')} />
          <Kpi
            label="Schedule"
            value={<span className={p.scheduleVarianceDays < 0 ? 'text-crit' : 'text-ink'}>{scheduleLabel(p.scheduleVarianceDays)}</span>}
            sub={`Finish ${fmtDate(p.finishDate)}`}
            icon={CalendarClock}
            tone={p.scheduleVarianceDays < -5 ? 'crit' : p.scheduleVarianceDays < 0 ? 'warn' : 'ok'}
            onClick={() => onTab('schedule')}
          />
          <Kpi label="Quality" value={`${p.quality}%`} sub={`${openNcrs(state, p.id).length} open NCRs`} icon={ShieldCheck} tone={scoreTone(p.quality)} onClick={() => onTab('qaqc')} />
          <Kpi label="HSE" value={`${p.hse}%`} sub={`${state.observations.filter((o) => o.projectId === p.id && o.status !== 'Closed').length} open observations`} icon={HardHat} tone={scoreTone(p.hse)} onClick={() => onTab('hse')} />
          <Kpi label="Manpower" value={`${num(p.workforce)} / ${num(p.workforcePlanned)}`} sub={p.workforce < p.workforcePlanned ? `${p.workforcePlanned - p.workforce} below plan` : 'At planned strength'} icon={Users} onClick={() => onTab('manpower')} />
          <Kpi label="Handover" value={`${ho}%`} sub="Dossier completion" icon={FileStack} tone={ho >= 80 ? 'ok' : ho >= 50 ? 'warn' : 'crit'} onClick={() => onTab('handover')} />
        </div>
      </section>

      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        <Card title="Project timeline" icon={CalendarClock} subtitle={`${fmtDate(p.startDate)} to ${fmtDate(p.finishDate)}`}>
          <ul className="space-y-3.5">
            {p.phases.map((ph) => (
              <li key={ph.name}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">{ph.name}</span>
                  {ph.progress >= 100 ? <Pill tone="ok" dot>Completed</Pill> : <span className="tabular text-ink-2">{ph.progress}%</span>}
                </div>
                <ProgressBar value={ph.progress} tone={ph.progress >= 100 ? 'ok' : ph.progress > 0 ? 'info' : 'neutral'} />
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Key issues"
          icon={AlertTriangle}
          subtitle={`${issues.length} open alerts shown`}
          actions={
            <Button size="sm" variant="ghost" onClick={() => navigate('/alerts')}>
              Alert centre
            </Button>
          }
          bodyClassName="p-2"
        >
          {issues.length === 0 ? (
            <EmptyState title="No open issues" body="No open alerts for this project." className="m-3" />
          ) : (
            <ul>
              {issues.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => navigate(a.link ?? '/alerts')} className="flex w-full items-start gap-3 rounded-[8px] px-3 py-3 text-start hover:bg-[#f9fafb]">
                    <LevelPill level={a.level} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-ink">{a.title}</div>
                      <div className="mt-0.5 text-[12px] text-ink-3">
                        {a.impact} · {a.owner}
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-ink-3 rtl:-scale-x-100" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent activity"
          actions={
            <Button size="sm" variant="ghost" onClick={() => onTab('activity')}>
              View all
            </Button>
          }
          bodyClassName="px-3 py-2"
        >
          <ActivityTimeline items={acts} compact />
        </Card>

        <Card
          title="Risk exposure"
          icon={AlertTriangle}
          actions={
            <Button size="sm" variant="ghost" onClick={() => onTab('risks')}>
              Risk register
            </Button>
          }
        >
          <div className="mb-4 flex items-end gap-4">
            <div>
              <div className="text-[13px] text-ink-2">Risk score</div>
              <div className={cx('tabular text-[32px] leading-none font-semibold', p.riskScore >= 60 ? 'text-crit' : p.riskScore >= 40 ? 'text-warn' : 'text-ok')}>{p.riskScore}</div>
            </div>
            <div className="flex-1 pb-1">
              <ProgressBar value={p.riskScore} tone={p.riskScore >= 60 ? 'crit' : p.riskScore >= 40 ? 'warn' : 'ok'} height={8} />
              <div className="mt-1 text-[12px] text-ink-3">0 to 100 composite of schedule, cost, quality and HSE exposure</div>
            </div>
          </div>
          <StatLine label="Open risks" value={risks.length} />
          <StatLine label="High (score ≥ 15)" value={highRisks} tone={highRisks ? 'crit' : 'ok'} />
          <StatLine label="Delayed work packages" value={state.workPackages.filter((w) => w.projectId === p.id && variance(w) <= -5).length} tone="warn" />
        </Card>
      </div>
    </div>
  )
}

/* ---------------- Cost ---------------- */

export function CostTab({ project: p }: { project: Project }) {
  const m = costMetrics(p)
  const cats = COST_SPLIT.map((c, i) => ({
    name: c.name,
    budget: Math.round(p.budget * c.w * 10) / 10,
    actual: Math.round(p.actual * c.w * [1.06, 0.97, 1.02, 0.94, 0.92][i] * 10) / 10,
  }))
  const spend = monthlySpend(p)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DemoTag>Illustrative data</DemoTag>
        <span className="text-[12px] text-ink-3">Budget and actual from project controls; commitments and splits simulated. Production integration configurable.</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Budget" value={sarM(p.budget)} sub="Approved baseline" />
        <Kpi label="Actual cost" value={sarM(p.actual)} sub={`${costConsumed(p)}% consumed`} />
        <Kpi label="Committed" value={sarM(m.committed)} sub="POs and subcontracts" />
        <Kpi label="Forecast at completion" value={sarM(m.eac)} sub={<span className={m.vac >= 0 ? 'text-ok' : 'text-crit'}>{m.vac >= 0 ? `${sarM(m.vac)} under budget` : `${sarM(-m.vac)} over budget`}</span>} />
        <Kpi label="CPI" value={m.cpi.toFixed(2)} sub={m.cpi >= 1 ? 'Cost efficient' : 'Over-spending vs earned'} tone={m.cpi >= 1 ? 'ok' : m.cpi >= 0.95 ? 'warn' : 'crit'} icon={Gauge} />
        <Kpi label="SPI" value={m.spi.toFixed(2)} sub={m.spi >= 1 ? 'On or ahead' : 'Behind schedule'} tone={m.spi >= 1 ? 'ok' : m.spi >= 0.95 ? 'warn' : 'crit'} icon={Gauge} />
      </div>
      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        <Card title="Cost by category" subtitle="SAR millions, budget vs actual">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cats} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e8eaee' }} interval={0} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `SAR ${v}M`} cursor={{ fill: '#f6f6f6' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="actual" name="Actual" fill="#1d4ed8" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Monthly spend" subtitle="SAR millions per month, actual to date">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e8eaee' }} minTickGap={12} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `SAR ${v}M`} cursor={{ fill: '#f6f6f6' }} />
                <Bar dataKey="spend" name="Spend" fill="#1d4ed8" radius={[3, 3, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card title="Earned value" bodyClassName="px-5 py-3">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <StatLine label="Planned value (PV)" value={sarM(m.plannedValue)} />
          <StatLine label="Earned value (EV)" value={sarM(m.earned)} />
          <StatLine label="Actual cost (AC)" value={sarM(p.actual)} />
          <StatLine label="Cost variance (EV − AC)" value={sarM(Math.round((m.earned - p.actual) * 10) / 10)} tone={m.earned >= p.actual ? 'ok' : 'crit'} />
          <StatLine label="Schedule variance (EV − PV)" value={sarM(Math.round((m.earned - m.plannedValue) * 10) / 10)} tone={m.earned >= m.plannedValue ? 'ok' : 'warn'} />
          <StatLine label="Variance at completion" value={sarM(m.vac)} tone={m.vac >= 0 ? 'ok' : 'crit'} />
        </div>
      </Card>
    </div>
  )
}

/* ---------------- QA/QC ---------------- */

export function QaTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const ins = state.inspections.filter((i) => i.projectId === p.id).sort((a, b) => (a.id === 'INS-WLD-00428' ? -1 : b.id === 'INS-WLD-00428' ? 1 : b.date.localeCompare(a.date)))
  const ncrs = state.ncrs.filter((n) => n.projectId === p.id).sort((a, b) => b.id.localeCompare(a.id))
  const decided = ins.filter((i) => i.result === 'Passed' || i.result === 'Failed')
  const passRate = decided.length ? Math.round((decided.filter((i) => i.result === 'Passed').length / decided.length) * 100) : 100
  const featured = ins.find((i) => i.id === 'INS-WLD-00428') ?? ins.find((i) => i.result === 'Failed')
  const open = openNcrs(state, p.id).length
  const overdue = overdueNcrs(state, p.id).length

  const insCols: Column<(typeof ins)[number]>[] = [
    { key: 'id', header: 'Inspection', render: (i) => <LinkText to={`/quality/inspections/${i.id}`}>{i.id}</LinkText> },
    { key: 'type', header: 'Type', render: (i) => <span className="whitespace-nowrap">{i.type}</span> },
    { key: 'd', header: 'Discipline', hideBelow: 'md', render: (i) => i.discipline },
    { key: 'loc', header: 'Location', hideBelow: 'sm', render: (i) => <span className="whitespace-nowrap text-ink-2">{i.location}</span> },
    { key: 'insp', header: 'Inspector', hideBelow: 'lg', render: (i) => i.inspector },
    { key: 'date', header: 'Date', render: (i) => <span className="whitespace-nowrap text-ink-2">{fmtDate(i.date)}</span> },
    { key: 'res', header: 'Result', render: (i) => <StatusPill status={i.result} /> },
  ]
  const ncrCols: Column<(typeof ncrs)[number]>[] = [
    { key: 'id', header: 'NCR', render: (n) => <LinkText to={`/quality/ncrs/${n.id}`}>{n.id}</LinkText> },
    { key: 't', header: 'Title', render: (n) => <span className="block min-w-[200px]">{n.title}</span> },
    { key: 'sev', header: 'Severity', render: (n) => <Pill tone={n.severity === 'Minor' ? 'info' : 'crit'}>{n.severity}</Pill> },
    { key: 'age', header: 'Age', align: 'end', hideBelow: 'sm', render: (n) => <span className={cx('tabular', ncrOverdue(n) && 'font-medium text-crit')}>{ncrAge(n)} d</span> },
    { key: 'resp', header: 'Responsible', hideBelow: 'lg', render: (n) => n.responsible },
    { key: 'st', header: 'Status', render: (n) => (ncrOverdue(n) ? <Pill tone="crit" dot>Overdue · {n.status}</Pill> : <StatusPill status={n.status} />) },
  ]

  return (
    <div className="space-y-4">
      {featured && (
        <button
          type="button"
          onClick={() => navigate(`/quality/inspections/${featured.id}`)}
          className="flex w-full flex-col gap-3 rounded-[12px] border border-[#f3c5c5] bg-crit-bg/40 p-4 text-start hover:bg-crit-bg/70 sm:flex-row sm:items-center"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crit-bg">
            <XCircle className="size-5 text-crit" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-ink">
                {featured.discipline} inspection {featured.id}
              </span>
              <Pill tone="crit" dot>
                {featured.result}
              </Pill>
              {featured.ncrId && <Pill tone="warn">{featured.ncrId} raised</Pill>}
            </span>
            <span className="mt-1 block text-[13px] text-ink-2">
              {featured.reference} · {featured.location} · {featured.findings.join(', ') || 'Findings recorded'} · {featured.inspector}, {fmtDate(featured.date)}
            </span>
          </span>
          <span className="caps inline-flex items-center gap-1 text-[12px] text-action">
            Open inspection <ArrowUpRight className="size-4 rtl:-scale-x-100" strokeWidth={1.5} />
          </span>
        </button>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Quality score" value={`${p.quality}%`} tone={scoreTone(p.quality)} icon={ShieldCheck} />
        <Kpi label="Open NCRs" value={open} to="/quality/ncrs" sub="Across all stages" />
        <Kpi label="Overdue NCRs" value={overdue} tone={overdue ? 'crit' : 'ok'} sub="Beyond closure SLA" to="/quality/ncrs" />
        <Kpi label="Inspection pass rate" value={`${passRate}%`} tone={passRate >= 90 ? 'ok' : passRate >= 80 ? 'warn' : 'crit'} sub={`${decided.length} decided inspections`} to="/quality/inspections" />
      </div>
      <Card title="Inspections" subtitle={`${ins.length} records`} bodyClassName="p-0">
        <DataTable columns={insCols} rows={ins} rowKey={(i) => i.id} onRowClick={(i) => navigate(`/quality/inspections/${i.id}`)} highlight={(i) => i.result === 'Failed'} empty={<EmptyState title="No inspections" body="No inspections recorded for this project." className="m-4" />} />
      </Card>
      <Card title="Non-conformance reports" subtitle={`${ncrs.length} records, ${open} open`} bodyClassName="p-0">
        <DataTable columns={ncrCols} rows={ncrs} rowKey={(n) => n.id} onRowClick={(n) => navigate(`/quality/ncrs/${n.id}`)} empty={<EmptyState title="No NCRs" body="No non-conformances raised on this project." className="m-4" />} />
      </Card>
    </div>
  )
}

/* ---------------- HSE ---------------- */

export function HseTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const obs = state.observations.filter((o) => o.projectId === p.id)
  const openObs = obs.filter((o) => o.status !== 'Closed')
  const acts = state.actions.filter((a) => a.projectId === p.id && a.status !== 'Closed')
  const cols: Column<(typeof obs)[number]>[] = [
    { key: 'id', header: 'Observation', render: (o) => <LinkText to={`/hse/observations/${o.id}`}>{o.id}</LinkText> },
    { key: 't', header: 'Title', render: (o) => <span className="block min-w-[200px]">{o.title}</span> },
    { key: 'c', header: 'Category', hideBelow: 'md', render: (o) => o.category },
    { key: 's', header: 'Severity', render: (o) => <StatusPill status={o.severity} /> },
    { key: 'l', header: 'Location', hideBelow: 'lg', render: (o) => <span className="text-ink-2">{o.location}</span> },
    { key: 'st', header: 'Status', render: (o) => <StatusPill status={o.status} /> },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="HSE score" value={`${p.hse}%`} tone={scoreTone(p.hse)} icon={HardHat} />
        <Kpi label="Open observations" value={openObs.length} to="/hse/observations" />
        <Kpi label="High / critical open" value={openObs.filter((o) => o.severity === 'High' || o.severity === 'Critical').length} tone={openObs.some((o) => o.severity === 'High' || o.severity === 'Critical') ? 'crit' : 'ok'} />
        <Kpi label="Open corrective actions" value={acts.length} sub={`${acts.filter((a) => a.status === 'Overdue').length} overdue`} />
      </div>
      <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Observations" subtitle={`${obs.length} records`} bodyClassName="p-0">
          <DataTable columns={cols} rows={obs} rowKey={(o) => o.id} onRowClick={(o) => navigate(`/hse/observations/${o.id}`)} highlight={(o) => o.status !== 'Closed' && o.severity === 'High'} empty={<EmptyState title="No observations" className="m-4" />} />
        </Card>
        <Card title="Open actions" subtitle="Corrective actions from observations and NCRs" bodyClassName="p-2">
          {acts.length === 0 ? (
            <EmptyState title="No open actions" className="m-3" />
          ) : (
            <ul>
              {acts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => navigate(a.sourceType === 'Observation' ? `/hse/observations/${a.sourceId}` : a.sourceType === 'NCR' ? `/quality/ncrs/${a.sourceId}` : '/hse')}
                    className="w-full rounded-[8px] px-3 py-2.5 text-start hover:bg-[#f9fafb]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium text-ink">{a.title}</span>
                      <StatusPill status={a.status} />
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-3">
                      {a.id} · {a.owner} · due {fmtDate(a.dueDate)} · from {a.sourceId}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ---------------- Manpower ---------------- */

export function ManpowerTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const mp = manpowerByProject.find((m) => m.projectId === p.id)
  const trades = tradeSplit(p)
  const emps = state.employees.filter((e) => e.projectId === p.id)
  const totalIdle = manpowerByProject.reduce((a, m) => a + m.idle, 0)
  const share = mp ? mp.idle / totalIdle : 0
  const idle = idleCauses.map((c) => ({ ...c, hours: Math.round(c.hours * share) }))
  const maxIdle = Math.max(1, ...idle.map((c) => c.hours))
  const cols: Column<(typeof emps)[number]>[] = [
    {
      key: 'n',
      header: 'Name',
      render: (e) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Avatar name={e.name} size={24} />
          <LinkText to={`/hr/workers/${e.id}`}>{e.name}</LinkText>
        </span>
      ),
    },
    { key: 't', header: 'Trade', render: (e) => <span className="whitespace-nowrap">{e.trade}</span> },
    { key: 's', header: 'Skill', hideBelow: 'md', render: (e) => e.skill },
    { key: 'emp', header: 'Employer', hideBelow: 'lg', render: (e) => <span className="text-ink-2">{e.employer}</span> },
    { key: 'a', header: 'Attendance', align: 'end', render: (e) => <span className="tabular">{e.attendance}%</span> },
    { key: 'u', header: 'Utilisation', align: 'end', render: (e) => <span className={cx('tabular', e.utilisation < 80 && 'text-warn')}>{e.utilisation}%</span> },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Planned headcount" value={num(p.workforcePlanned)} icon={Users} />
        <Kpi label="Actual on site" value={num(p.workforce)} sub={p.workforce < p.workforcePlanned ? <span className="text-warn">{p.workforcePlanned - p.workforce} short of plan</span> : 'At plan'} />
        <Kpi label="Utilisation" value={`${mp?.utilisation ?? 90}%`} tone={(mp?.utilisation ?? 90) >= 88 ? 'ok' : 'warn'} />
        <Kpi label="Idle workers today" value={mp?.idle ?? 0} sub={`${num(mp?.overtime ?? 0)} overtime hours this month`} tone={(mp?.idle ?? 0) > 20 ? 'crit' : 'neutral'} />
      </div>
      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.5fr_1fr]">
        <Card title="Planned vs actual by trade" actions={<DemoTag>Illustrative split</DemoTag>}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trades} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f3" horizontal={false} />
                <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="trade" tick={AXIS_TICK} tickLine={false} axisLine={false} width={118} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f6f6f6' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="planned" name="Planned" fill="#94a3b8" radius={[0, 3, 3, 0]} barSize={7} />
                <Bar dataKey="actual" name="Actual" fill="#1d4ed8" radius={[0, 3, 3, 0]} barSize={7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Idle time causes" subtitle="Hours this week, allocated to this project">
          <ul className="space-y-3">
            {idle.map((c) => (
              <li key={c.cause}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-ink">{c.cause}</span>
                  <span className="tabular text-ink-2">{c.hours} h</span>
                </div>
                <ProgressBar value={(c.hours / maxIdle) * 100} tone={c.cause === 'Inspection waiting' ? 'warn' : 'neutral'} />
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-4" onClick={() => navigate('/hr/utilisation')}>
            Utilisation analysis
          </Button>
        </Card>
      </div>
      <Card title="Deployed personnel" subtitle={`${emps.length} key personnel shown of ${num(p.workforce)} on site`} actions={<Button size="sm" variant="ghost" onClick={() => navigate('/hr/manpower')}>HR manpower</Button>} bodyClassName="p-0">
        <DataTable columns={cols} rows={emps} rowKey={(e) => e.id} onRowClick={(e) => navigate(`/hr/workers/${e.id}`)} empty={<EmptyState title="No personnel records" body="No named personnel linked to this project in the demo dataset." className="m-4" />} />
      </Card>
    </div>
  )
}

/* ---------------- Procurement ---------------- */

export function ProcurementTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const pos = state.pos.filter((x) => x.projectId === p.id)
  const vendor = (id: string) => state.vendors.find((v) => v.id === id)?.name ?? id
  const late = pos.filter((x) => x.daysLate > 0).length
  const exposure = pos.reduce((a, x) => a + Math.max(0, (x.currentUnitPrice - x.originalUnitPrice) * x.qty), 0)
  const cols: Column<(typeof pos)[number]>[] = [
    { key: 'id', header: 'PO', render: (x) => <LinkText to={`/procurement/pos/${x.id}`}>{x.id}</LinkText> },
    {
      key: 'm',
      header: 'Material / service',
      render: (x) => (
        <div className="min-w-[200px]">
          <div className="text-ink">{x.material}</div>
          <div className="text-[12px] text-ink-3">{vendor(x.vendorId)}</div>
        </div>
      ),
    },
    { key: 'v', header: 'Value', align: 'end', hideBelow: 'sm', render: (x) => <span className="tabular whitespace-nowrap">{sar(x.value, { compact: true })}</span> },
    {
      key: 'var',
      header: 'Price variance',
      align: 'end',
      render: (x) => {
        const v = poVariance(x)
        return <span className={cx('tabular font-medium', v > 5 ? 'text-crit' : v > 0 ? 'text-warn' : 'text-ink-2')}>{v > 0 ? '+' : ''}{v.toFixed(1)}%</span>
      },
    },
    { key: 'due', header: 'Delivery due', hideBelow: 'md', render: (x) => <span className="whitespace-nowrap text-ink-2">{fmtDate(x.deliveryDue)}</span> },
    { key: 'late', header: 'Days late', align: 'end', render: (x) => <span className={cx('tabular', x.daysLate > 0 ? 'font-medium text-crit' : 'text-ink-3')}>{x.daysLate > 0 ? x.daysLate : '—'}</span> },
    { key: 'st', header: 'Status', render: (x) => <StatusPill status={x.status} /> },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Purchase orders" value={pos.length} icon={PackageSearch} to="/procurement/pos" />
        <Kpi label="Order value" value={sar(pos.reduce((a, x) => a + x.value, 0), { compact: true })} />
        <Kpi label="Late deliveries" value={late} tone={late ? 'crit' : 'ok'} to="/procurement/deliveries" />
        <Kpi label="Price exposure" value={sar(Math.round(exposure), { compact: true })} tone={exposure > 0 ? 'warn' : 'ok'} sub="Remaining quantity at current price" to="/procurement/variance" />
      </div>
      <Card title="Purchase orders" bodyClassName="p-0">
        <DataTable columns={cols} rows={pos} rowKey={(x) => x.id} onRowClick={(x) => navigate(`/procurement/pos/${x.id}`)} highlight={(x) => x.critical && (x.daysLate > 0 || poVariance(x) > 5)} empty={<EmptyState title="No purchase orders" className="m-4" />} />
      </Card>
    </div>
  )
}

/* ---------------- Documents ---------------- */

type DocFilter = 'All' | 'Approved' | 'Under Review' | 'Missing'

export function DocumentsTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState<DocFilter>('All')
  const docs = state.documents.filter((d) => d.projectId === p.id)
  const shown = f === 'All' ? docs : docs.filter((d) => d.status === f)
  const mdr = state.mdr[p.id]
  const sum = mdr ? mdrSummary(mdr) : null
  return (
    <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[1fr_320px]">
      <Card title="Project documents" subtitle={`${docs.length} documents in register`} actions={<Button size="sm" variant="ghost" onClick={() => navigate(`/handover/register?project=${p.id}`)}>Open register</Button>}>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['All', 'Approved', 'Under Review', 'Missing'] as DocFilter[]).map((x) => (
            <FilterChip key={x} active={f === x} onClick={() => setF(x)} count={x === 'All' ? docs.length : docs.filter((d) => d.status === x).length}>
              {x}
            </FilterChip>
          ))}
        </div>
        {shown.length === 0 ? (
          <EmptyState title={`No ${f.toLowerCase()} documents`} body="Try another filter." />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            {shown.map((d, i) => (
              <FileTile
                key={d.id}
                name={d.title}
                type={d.fileType}
                photoSeed={i + 1}
                onClick={() => navigate(`/handover/register?q=${encodeURIComponent(d.id)}`)}
                meta={
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <StatusPill status={d.status} className="!text-[11px]" />
                    <span>Rev {d.revision}</span>
                  </span>
                }
              />
            ))}
          </div>
        )}
      </Card>
      {sum && (
        <Card title="Dossier completeness" subtitle="Manufacturer data report (MDR)" className="self-start">
          <div className="tabular text-[32px] leading-none font-semibold text-ink">{Math.round(sum.pct)}%</div>
          <ProgressBar value={sum.pct} tone={sum.pct >= 80 ? 'ok' : sum.pct >= 50 ? 'warn' : 'crit'} className="mt-3" height={8} />
          <div className="mt-4">
            <StatLine label="Required" value={sum.required} />
            <StatLine label="Completed" value={sum.completed} tone="ok" />
            <StatLine label="Under review" value={sum.review} tone="warn" />
            <StatLine label="Expired" value={sum.expired} tone="crit" />
            <StatLine label="Missing" value={sum.missing} tone="crit" />
          </div>
          <Button size="sm" className="mt-4 w-full" onClick={() => navigate(`/handover?project=${p.id}`)}>
            Open handover dossier
          </Button>
        </Card>
      )}
    </div>
  )
}

/* ---------------- Risks ---------------- */

export function RisksTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [cell, setCell] = useState<string | null>(null)
  const all = state.risks.filter((r) => r.projectId === p.id).sort((a, b) => riskScore(b) - riskScore(a))
  const rows = cell ? all.filter((r) => `${r.probability}-${r.impact}` === cell) : all
  const open = openId ? state.risks.find((r) => r.id === openId) ?? null : null
  const cols: Column<(typeof all)[number]>[] = [
    { key: 'id', header: 'Risk', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.id}</span>, hideBelow: 'md' },
    { key: 't', header: 'Description', render: (r) => <span className="block min-w-[220px] font-medium">{r.title}</span> },
    { key: 'c', header: 'Category', hideBelow: 'sm', render: (r) => r.category },
    { key: 'pi', header: 'P × I', align: 'center', render: (r) => <span className="tabular whitespace-nowrap text-ink-2">{r.probability} × {r.impact}</span> },
    { key: 's', header: 'Score', render: (r) => <RiskScorePill risk={r} /> },
    { key: 'm', header: 'Mitigation', hideBelow: 'lg', render: (r) => <span className="block min-w-[220px] text-ink-2">{r.mitigation}</span> },
    { key: 'o', header: 'Owner', hideBelow: 'md', render: (r) => <span className="whitespace-nowrap">{r.owner}</span> },
  ]
  return (
    <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[1fr_320px]">
      <Card title="Risk register" subtitle={cell ? `Filtered to cell P${cell.replace('-', ' × I')}` : `${all.length} risks, sorted by score`} actions={cell ? <Button size="sm" variant="ghost" onClick={() => setCell(null)}>Clear filter</Button> : undefined} bodyClassName="p-0">
        <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} highlight={(r) => riskScore(r) >= 15} empty={<EmptyState title="No risks recorded" body="This project has no risks in the register." className="m-4" />} />
      </Card>
      <Card title="Heat map" subtitle="Probability × impact; click a cell to filter" className="self-start">
        <RiskHeatMap risks={all} selected={cell} onSelect={setCell} />
      </Card>
      <RiskDetail risk={open} onClose={() => setOpenId(null)} />
    </div>
  )
}

/* ---------------- Handover ---------------- */

export function HandoverTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const cats = state.mdr[p.id]
  if (!cats) {
    return (
      <div className="space-y-4">
        <Card title="Handover readiness">
          <div className="flex items-end gap-4">
            <div className="tabular text-[32px] leading-none font-semibold">{p.handover}%</div>
            <ProgressBar value={p.handover} className="mb-2 flex-1" tone={p.handover >= 80 ? 'ok' : p.handover >= 50 ? 'warn' : 'crit'} height={8} />
          </div>
        </Card>
        <EmptyState
          icon={FileStack}
          title="No MDR dossier configured for this project"
          body={p.type === 'O&M' ? 'O&M contracts are handed over at mobilisation; readiness is tracked through the service contract.' : 'Readiness is tracked at project level until the dossier index is loaded.'}
          action={<Button onClick={() => navigate(`/handover?project=${p.id}`)}>Open handover</Button>}
        />
      </div>
    )
  }
  const s = mdrSummary(cats)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Dossier complete" value={`${Math.round(s.pct)}%`} tone={s.pct >= 80 ? 'ok' : s.pct >= 50 ? 'warn' : 'crit'} icon={FileStack} />
        <Kpi label="Required" value={s.required} />
        <Kpi label="Completed" value={s.completed} />
        <Kpi label="Under review" value={s.review} />
        <Kpi label="Missing / expired" value={s.missing + s.expired} tone="crit" to="/handover/missing" />
      </div>
      <Card title="Dossier by category" actions={<Button size="sm" variant="primary" iconRight={ArrowUpRight} onClick={() => navigate(`/handover?project=${p.id}`)}>Open dossier</Button>}>
        <ul className="space-y-3.5">
          {cats.map((c) => {
            const pc = Math.round((c.completed / c.required) * 100)
            const missing = c.required - c.completed - c.review - c.expired
            return (
              <li key={c.name} className="grid gap-1.5 sm:grid-cols-[200px_1fr_200px] sm:items-center sm:gap-4">
                <span className="text-[13px] font-medium text-ink">{c.name}</span>
                <div className="flex h-2 overflow-hidden rounded-full bg-[#eef0f3]">
                  <div className="bg-ok" style={{ width: `${(c.completed / c.required) * 100}%` }} />
                  <div className="bg-[#d97706]" style={{ width: `${(c.review / c.required) * 100}%` }} />
                  <div className="bg-crit" style={{ width: `${(c.expired / c.required) * 100}%` }} />
                </div>
                <span className="tabular text-[12px] text-ink-2 sm:text-end">
                  {c.completed}/{c.required} · {pc}% {missing > 0 && <span className="text-crit">· {missing} missing</span>}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-[12px] text-ink-2">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-ok" />Completed</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#d97706]" />Under review</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-crit" />Expired</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#eef0f3]" />Missing</span>
        </div>
      </Card>
      <p className="text-[12px] text-ink-3">
        Missing documents are listed in the <Link className="text-action hover:underline" to="/handover/missing">missing documents register</Link>.
      </p>
    </div>
  )
}
