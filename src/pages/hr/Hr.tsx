import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarCheck,
  Clock,
  Flag,
  Gauge,
  HardHat,
  IdCard,
  Lightbulb,
  MapPin,
  RefreshCw,
  Users,
  UserX,
} from 'lucide-react'
import type { Employee } from '../../data/types'
import { attendanceWeek, competency, idleCauses, manpowerByProject } from '../../data/hr'
import { daysUntil, fmtDate, num } from '../../lib/format'
import { inProject, projectName, totalWorkforce } from '../../store/selectors'
import { roleProfile } from '../../store/roles'
import { useStore } from '../../store/store'
import { Button, Card, DataTable, DemoTag, EmptyState, FilterChip, Input, KeyValue, Kpi, PageHeader, Pill, Select, StatusPill } from '../../components/ui'
import { CHART, MiniStat, ProjectFilterNote, Timeline } from '../../components/procurement/common'

const crumbs = (label: string) => [{ label: 'HR / Manpower', to: '/hr' }, { label }]

function expiryStatus(date: string): 'Expired' | 'Expiring' | 'Renewal due' | 'Valid' {
  const d = daysUntil(date)
  if (d < 0) return 'Expired'
  if (d <= 30) return 'Expiring'
  if (d <= 90) return 'Renewal due'
  return 'Valid'
}

function DaysLeft({ date }: { date: string }) {
  const d = daysUntil(date)
  return <span className={d < 0 ? 'tabular font-medium text-crit' : d <= 14 ? 'tabular font-medium text-crit' : d <= 30 ? 'tabular font-medium text-warn' : 'tabular text-ink-2'}>{d < 0 ? `${-d} d overdue` : `${d} d`}</span>
}

const shortName = (s: { projects: { id: string; shortName: string }[] }, id: string) => s.projects.find((p) => p.id === id)?.shortName ?? id

/* ---------------- Dashboard ---------------- */

export function HrDashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const total = totalWorkforce(state)
  const planned = state.projects.reduce((a, p) => a + p.workforcePlanned, 0)
  const greet = state.role === 'HR Manager' ? `Good morning, ${roleProfile(state.role).firstName}. ` : ''
  const sampleCerts = state.employees.flatMap((e) => e.certifications.filter((c) => daysUntil(c.expiry) <= 30).map((c) => ({ e, c })))
  const sampleIqama = state.employees.filter((e) => daysUntil(e.iqamaExpiry) <= 30)
  const byProject = inProject(manpowerByProject, state.projectFilter)
  const chartData = byProject.map((r) => ({ name: shortName(state, r.projectId), planned: r.planned, actual: r.actual }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR / Manpower"
        count={`${num(total)} workforce`}
        subtitle={`${greet}Utilisation 88% across the portfolio. Inspection waiting is the main idle cause this week.`}
        tag={<ProjectFilterNote state={state} />}
        actions={
          <Button variant="primary" icon={Users} onClick={() => navigate('/hr/manpower')}>
            Directory
          </Button>
        }
      />
      <div className="grid [&>*]:min-w-0 gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Total Workforce" value={num(total)} sub="Deployed on 12 projects" icon={Users} to="/hr/manpower" />
        <Kpi label="Planned" value={num(planned)} sub={`${num(planned - total)} short of plan`} icon={Flag} />
        <Kpi label="Utilisation" value="88%" sub="Target 85%" icon={Gauge} tone="ok" to="/hr/utilisation" />
        <Kpi label="Idle" value="92" sub="Workers idle today" icon={UserX} tone="warn" to="/hr/utilisation" />
        <Kpi label="Certificates Expiring" value="27" sub="Within 30 days" icon={Award} tone="warn" to="/hr/certificates" />
        <Kpi label="Iqama Expiring" value="19" sub="Within 30 days" icon={IdCard} tone="warn" to="/hr/iqama" />
      </div>

      <Card title="Manpower by project" icon={HardHat} bodyClassName="p-0" actions={<Button size="sm" onClick={() => navigate('/hr/utilisation')}>Utilisation</Button>}>
        <div className="h-[240px] px-3 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="name" tick={CHART.tick} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={CHART.tick} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="planned" name="Planned" fill={CHART.planned} radius={[3, 3, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill={CHART.primary} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DataTable
          rows={byProject}
          rowKey={(r) => r.projectId}
          onRowClick={(r) => navigate(`/projects/${r.projectId}`)}
          highlight={(r) => r.utilisation < 75}
          columns={[
            { key: 'p', header: 'Project', render: (r) => <span className="font-medium whitespace-nowrap">{projectName(state, r.projectId)}</span> },
            { key: 'pl', header: 'Planned', align: 'end', render: (r) => <span className="tabular">{r.planned}</span> },
            { key: 'a', header: 'Actual', align: 'end', render: (r) => <span className="tabular">{r.actual}</span> },
            { key: 'u', header: 'Utilisation', align: 'end', render: (r) => <span className={r.utilisation < 75 ? 'tabular font-medium text-crit' : r.utilisation < 85 ? 'tabular font-medium text-warn' : 'tabular'}>{r.utilisation}%</span> },
            { key: 'i', header: 'Idle', align: 'end', render: (r) => <span className="tabular">{r.idle}</span> },
            { key: 'o', header: 'Overtime', align: 'end', render: (r) => <span className="tabular whitespace-nowrap">{num(r.overtime)} h</span>, hideBelow: 'sm' },
          ]}
        />
      </Card>

      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-2">
        <Card title="Idle causes" icon={Clock} subtitle="Idle hours this week">
          <IdleChart />
        </Card>
        <Card title="Expiring within 30 days" icon={Award} subtitle="Sample of employee records" actions={<DemoTag>Illustrative Data</DemoTag>} bodyClassName="divide-y divide-line">
          {[...sampleCerts.map(({ e, c }) => ({ key: `${e.id}-${c.name}`, e, what: c.name, date: c.expiry })), ...sampleIqama.map((e) => ({ key: `${e.id}-iqama`, e, what: 'Iqama', date: e.iqamaExpiry }))]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 8)
            .map((r) => (
              <Link key={r.key} to={`/hr/workers/${r.e.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#f9fafb]">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-ink">
                    <span className="font-medium">{r.e.name}</span> · {r.what}
                  </div>
                  <div className="text-[12px] text-ink-3">
                    {r.e.trade} · {fmtDate(r.date)}
                  </div>
                </div>
                <DaysLeft date={r.date} />
              </Link>
            ))}
          <div className="px-5 py-3">
            <Link to="/hr/expiry" className="text-[13px] font-medium text-action hover:underline">
              All expiry alerts
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

function IdleChart() {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={idleCauses} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis type="number" tick={CHART.tick} unit=" h" />
          <YAxis type="category" dataKey="cause" tick={CHART.tick} width={130} />
          <Tooltip contentStyle={CHART.tooltip} formatter={(v) => [`${v} hours`, 'Idle']} />
          <Bar dataKey="hours" radius={[0, 3, 3, 0]}>
            {idleCauses.map((c, i) => (
              <Cell key={c.cause} fill={i === 0 ? CHART.warn : CHART.planned} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------------- Directory ---------------- */

export function ManpowerPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [trade, setTrade] = useState('all')
  const [project, setProject] = useState('all')
  const [employer, setEmployer] = useState('all')
  const base = inProject(state.employees, state.projectFilter)
  const trades = Array.from(new Set(state.employees.map((e) => e.trade))).sort()
  const projects = Array.from(new Set(state.employees.map((e) => e.projectId)))
  const employers = Array.from(new Set(state.employees.map((e) => e.employer)))
  const rows = base.filter(
    (e) =>
      (trade === 'all' || e.trade === trade) &&
      (project === 'all' || e.projectId === project) &&
      (employer === 'all' || e.employer === employer) &&
      (!q || `${e.name} ${e.id}`.toLowerCase().includes(q.toLowerCase())),
  )
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Manpower')} title="Manpower directory" count={rows.length} subtitle="Sample of employee records. Portfolio headcount is 1,284." tag={<><ProjectFilterNote state={state} /><DemoTag>Illustrative Data</DemoTag></>} />
      <Card bodyClassName="p-4">
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Search name or employee ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <Select aria-label="Trade" value={trade} onChange={(e) => setTrade(e.target.value)} options={[{ value: 'all', label: 'All trades' }, ...trades]} />
          <Select aria-label="Project" value={project} onChange={(e) => setProject(e.target.value)} options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p, label: projectName(state, p) }))]} />
          <Select aria-label="Employer" value={employer} onChange={(e) => setEmployer(e.target.value)} options={[{ value: 'all', label: 'All employers' }, ...employers]} />
        </div>
      </Card>
      <Card bodyClassName="p-0">
        <EmployeeTable rows={rows} onRow={(e) => navigate(`/hr/workers/${e.id}`)} />
      </Card>
    </div>
  )
}

function EmployeeTable({ rows, onRow }: { rows: Employee[]; onRow: (e: Employee) => void }) {
  const { state } = useStore()
  return (
    <DataTable
      rows={rows}
      rowKey={(e) => e.id}
      onRowClick={onRow}
      empty={<EmptyState className="m-5" title="No employees match" body="Adjust the filters or search." />}
      columns={[
        {
          key: 'n',
          header: 'Employee',
          render: (e) => (
            <div className="min-w-[150px]">
              <div className="font-medium">{e.name}</div>
              <div className="text-[12px] text-ink-3">{e.id}</div>
            </div>
          ),
        },
        { key: 't', header: 'Trade', render: (e) => <span className="whitespace-nowrap">{e.trade}</span> },
        { key: 'p', header: 'Project', render: (e) => <span className="whitespace-nowrap text-ink-2">{shortName(state, e.projectId)}</span>, hideBelow: 'sm' },
        { key: 'em', header: 'Employer', render: (e) => <span className="whitespace-nowrap text-ink-2">{e.employer}</span>, hideBelow: 'lg' },
        { key: 's', header: 'Skill', render: (e) => e.skill, hideBelow: 'md' },
        { key: 'a', header: 'Attendance', align: 'end', render: (e) => <span className="tabular">{e.attendance}%</span>, hideBelow: 'md' },
        { key: 'u', header: 'Utilisation', align: 'end', render: (e) => <span className={e.utilisation < 75 ? 'tabular text-crit' : e.utilisation < 85 ? 'tabular text-warn' : 'tabular'}>{e.utilisation}%</span> },
        {
          key: 'x',
          header: 'Expiry',
          render: (e) => {
            const soonest = [...e.certifications.map((c) => c.expiry), e.iqamaExpiry].sort()[0]
            const st = expiryStatus(soonest)
            return st === 'Valid' ? <Pill tone="ok">Valid</Pill> : <StatusPill status={st} />
          },
        },
      ]}
    />
  )
}

/* ---------------- Attendance ---------------- */

const ABSENCE_REASONS = ['Sick leave', 'Annual leave', 'Iqama renewal appointment', 'Unauthorised absence', 'Emergency leave']

export function AttendancePage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const today = attendanceWeek[attendanceWeek.length - 1]
  const byProject = inProject(manpowerByProject, state.projectFilter).map((r) => {
    const absent = Math.max(0, Math.round(r.actual * 0.021 + (r.projectId === 'KSS' ? 3 : 0)))
    return { ...r, present: r.actual - absent, absent }
  })
  const absentees = [...inProject(state.employees, state.projectFilter)].sort((a, b) => a.attendance - b.attendance).slice(0, 5)
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Attendance')} title="Attendance" count={`Today ${num(today.present)} present`} subtitle="Biometric gate and field app attendance, last 7 working days." tag={<><ProjectFilterNote state={state} /><DemoTag>Simulated ERP Sync</DemoTag></>} />
      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-3">
        <Kpi label="Present today" value={num(today.present)} icon={CalendarCheck} tone="ok" />
        <Kpi label="Absent today" value={today.absent} icon={UserX} tone="warn" />
        <Kpi label="Attendance rate" value={`${((today.present / (today.present + today.absent)) * 100).toFixed(1)}%`} icon={Gauge} />
      </div>
      <Card title="Last 7 days" icon={CalendarCheck}>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceWeek} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="day" tick={CHART.tick} />
              <YAxis tick={CHART.tick} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" name="Present" stackId="a" fill={CHART.primary} />
              <Bar dataKey="absent" name="Absent" stackId="a" fill={CHART.warn} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card title="Today by project" icon={Building2} bodyClassName="p-0">
          <DataTable
            rows={byProject}
            rowKey={(r) => r.projectId}
            onRowClick={(r) => navigate(`/projects/${r.projectId}`)}
            columns={[
              { key: 'p', header: 'Project', render: (r) => <span className="font-medium whitespace-nowrap">{shortName(state, r.projectId)}</span> },
              { key: 'r', header: 'Rostered', align: 'end', render: (r) => <span className="tabular">{r.actual}</span> },
              { key: 'pr', header: 'Present', align: 'end', render: (r) => <span className="tabular">{r.present}</span> },
              { key: 'a', header: 'Absent', align: 'end', render: (r) => <span className={r.absent > 5 ? 'tabular font-medium text-warn' : 'tabular'}>{r.absent}</span> },
              { key: 'rate', header: 'Rate', align: 'end', render: (r) => <span className="tabular">{r.actual ? ((r.present / r.actual) * 100).toFixed(1) : '0'}%</span> },
            ]}
          />
        </Card>
        <Card title="Absentees" icon={UserX} subtitle="Sample, today">
          {absentees.length === 0 ? (
            <p className="text-[13px] text-ink-3">No absentees for this project.</p>
          ) : (
            <ul className="space-y-3">
              {absentees.map((e, i) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                  <Link to={`/hr/workers/${e.id}`} className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink hover:text-action">{e.name}</div>
                    <div className="truncate text-[12px] text-ink-3">
                      {e.trade} · {ABSENCE_REASONS[i % ABSENCE_REASONS.length]}
                    </div>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => actions.toast({ title: 'Follow-up logged', body: `Site HR to contact ${e.name}.`, tone: 'info' })}>
                    Follow up
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ---------------- Utilisation ---------------- */

export function UtilisationPage() {
  const { state, actions } = useStore()
  const rows = inProject(manpowerByProject, state.projectFilter)
  const data = rows.map((r) => ({ name: shortName(state, r.projectId), u: r.utilisation }))
  const idleHours = idleCauses.reduce((a, c) => a + c.hours, 0)
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Utilisation')} title="Utilisation" count="88%" subtitle="Productive hours against rostered hours. Rule MP-01 flags projects below 75%." tag={<ProjectFilterNote state={state} />} />
      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-3">
        <Kpi label="Portfolio utilisation" value="88%" icon={Gauge} tone="ok" />
        <Kpi label="Idle hours (week)" value={num(idleHours)} icon={Clock} tone="warn" />
        <Kpi label="Projects below 75%" value={rows.filter((r) => r.utilisation < 75).length} icon={Flag} tone="crit" />
      </div>
      <section className="flex flex-wrap items-start gap-4 rounded-[12px] border border-line bg-surface p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warn-bg">
          <Lightbulb className="size-[18px] text-warn" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="caps text-[12px] text-ink-2">Insight</span>
            <DemoTag>Demo Recommendation</DemoTag>
          </div>
          <p className="mt-1 text-[16px] font-semibold text-ink">Inspection waiting: 420 hours</p>
          <p className="mt-0.5 text-[14px] text-ink-2">Largest idle cause this week, concentrated on North Pipeline welding crews waiting for NDT and hold-point release.</p>
          <p className="mt-2 text-[14px] text-ink">
            <span className="font-medium">Recommendation:</span> Synchronise inspection planning with construction look-ahead.
          </p>
        </div>
        <Button onClick={() => actions.toast({ title: 'Shared with Project Managers', body: 'Recommendation sent to NPE and EGC look-ahead meetings.', tone: 'success' })}>Share</Button>
      </section>
      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-2">
        <Card title="Utilisation by project" icon={Gauge} subtitle="Threshold 75% (rule MP-01)">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="name" tick={CHART.tick} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={CHART.tick} domain={[50, 100]} unit="%" />
                <Tooltip contentStyle={CHART.tooltip} formatter={(v) => [`${v}%`, 'Utilisation']} />
                <ReferenceLine y={75} stroke={CHART.crit} strokeDasharray="4 4" />
                <Bar dataKey="u" radius={[3, 3, 0, 0]}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.u < 75 ? CHART.crit : d.u < 85 ? CHART.warn : CHART.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Idle hours by cause" icon={Clock}>
          <IdleChart />
        </Card>
      </div>
      <Card title="Idle workforce by project" icon={Users} bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(r) => r.projectId}
          highlight={(r) => r.utilisation < 75}
          columns={[
            { key: 'p', header: 'Project', render: (r) => <span className="font-medium whitespace-nowrap">{projectName(state, r.projectId)}</span> },
            { key: 'u', header: 'Utilisation', align: 'end', render: (r) => <span className="tabular">{r.utilisation}%</span> },
            { key: 'i', header: 'Idle workers', align: 'end', render: (r) => <span className="tabular">{r.idle}</span> },
            { key: 'h', header: 'Idle hours', align: 'end', render: (r) => <span className="tabular">{num(r.idle * 10)}</span>, hideBelow: 'sm' },
            { key: 's', header: 'Status', render: (r) => (r.utilisation < 75 ? <Pill tone="crit">Below threshold</Pill> : r.utilisation < 85 ? <Pill tone="warn">Watch</Pill> : <Pill tone="ok">Healthy</Pill>) },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------- Competency ---------------- */

export function CompetencyPage() {
  const rows = competency.map((c) => ({ ...c, gap: c.required - c.certified }))
  const totalGap = rows.reduce((a, r) => a + Math.max(0, r.gap), 0)
  const gapCls = (g: number) => (g > 5 ? 'bg-crit-bg text-crit' : g > 0 ? 'bg-warn-bg text-warn' : 'bg-ok-bg text-ok')
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Competency matrix')} title="Competency matrix" count={`${totalGap} certified gap`} subtitle="Required headcount against available and certified workers by trade. Gap = required minus certified." tag={<DemoTag>Illustrative Data</DemoTag>} />
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(r) => r.trade}
          columns={[
            { key: 't', header: 'Trade', render: (r) => <span className="font-medium whitespace-nowrap">{r.trade}</span> },
            { key: 'r', header: 'Required', align: 'end', render: (r) => <span className="tabular">{r.required}</span> },
            { key: 'a', header: 'Available', align: 'end', render: (r) => <span className="tabular">{r.available}</span> },
            { key: 'c', header: 'Certified', align: 'end', render: (r) => <span className="tabular">{r.certified}</span> },
            { key: 'e', header: 'Expiring', align: 'end', render: (r) => <span className={r.expiring > 3 ? 'tabular font-medium text-warn' : 'tabular'}>{r.expiring}</span> },
            {
              key: 'g',
              header: 'Gap',
              align: 'end',
              render: (r) => <span className={`tabular inline-block min-w-12 rounded-full px-2.5 py-0.5 text-center text-[12px] font-semibold ${gapCls(r.gap)}`}>{r.gap > 0 ? `-${r.gap}` : r.gap === 0 ? '0' : `+${-r.gap}`}</span>,
            },
          ]}
        />
      </Card>
      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Required vs certified" icon={BadgeCheck}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="trade" tick={CHART.tick} interval={0} angle={-30} textAnchor="end" height={70} />
                <YAxis tick={CHART.tick} />
                <Tooltip contentStyle={CHART.tooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="required" name="Required" fill={CHART.planned} radius={[3, 3, 0, 0]} />
                <Bar dataKey="certified" name="Certified" fill={CHART.primary} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Largest gaps" icon={Flag}>
          <ul className="space-y-3">
            {[...rows]
              .sort((a, b) => b.gap - a.gap)
              .filter((r) => r.gap > 0)
              .slice(0, 4)
              .map((r) => (
                <li key={r.trade} className="text-[14px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{r.trade}</span>
                    <span className={`tabular rounded-full px-2 py-0.5 text-[12px] font-semibold ${gapCls(r.gap)}`}>-{r.gap}</span>
                  </div>
                  <div className="text-[12px] text-ink-3">
                    {r.required - r.available > 0 ? `Mobilise ${r.required - r.available} from partner pool; ` : ''}
                    {r.available - r.certified > 0 ? `${r.available - r.certified} awaiting WQT / trade test` : 'certify new joiners'}
                  </div>
                </li>
              ))}
          </ul>
          <p className="mt-4 text-[12px] text-ink-3">Legend: red gap &gt; 5, amber 1 to 5, green no gap.</p>
        </Card>
      </div>
    </div>
  )
}

/* ---------------- Certificates ---------------- */

type CertRow = { key: string; e: Employee; name: string; expiry: string; status: ReturnType<typeof expiryStatus> }

export function HrCertificatesPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState<'all' | 'Expired' | 'Expiring' | 'Renewal due' | 'Valid'>('all')
  const all: CertRow[] = inProject(state.employees, state.projectFilter)
    .flatMap((e) => e.certifications.map((c) => ({ key: `${e.id}-${c.name}`, e, name: c.name, expiry: c.expiry, status: expiryStatus(c.expiry) })))
    .sort((a, b) => a.expiry.localeCompare(b.expiry))
  const rows = f === 'all' ? all : all.filter((r) => r.status === f)
  const count = (s: CertRow['status']) => all.filter((r) => r.status === s).length
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Certificates')} title="Employee certificates" count={all.length} subtitle="Welder qualifications (WQT), inspector, rigging and safety certificates." tag={<ProjectFilterNote state={state} />} />
      <div className="flex flex-wrap gap-2">
        <FilterChip active={f === 'all'} onClick={() => setF('all')} count={all.length}>All</FilterChip>
        <FilterChip active={f === 'Expiring'} onClick={() => setF('Expiring')} count={count('Expiring')}>Expiring ≤ 30 d</FilterChip>
        <FilterChip active={f === 'Renewal due'} onClick={() => setF('Renewal due')} count={count('Renewal due')}>Renewal due ≤ 90 d</FilterChip>
        <FilterChip active={f === 'Expired'} onClick={() => setF('Expired')} count={count('Expired')}>Expired</FilterChip>
        <FilterChip active={f === 'Valid'} onClick={() => setF('Valid')} count={count('Valid')}>Valid</FilterChip>
      </div>
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(r) => r.key}
          onRowClick={(r) => navigate(`/hr/workers/${r.e.id}`)}
          empty={<EmptyState className="m-5" title="No certificates in this status" />}
          columns={[
            { key: 'c', header: 'Certificate', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'e', header: 'Employee', render: (r) => <span className="whitespace-nowrap">{r.e.name}</span> },
            { key: 't', header: 'Trade', render: (r) => r.e.trade, hideBelow: 'md' },
            { key: 'x', header: 'Expiry', render: (r) => <span className="whitespace-nowrap">{fmtDate(r.expiry)}</span>, hideBelow: 'sm' },
            { key: 'd', header: 'Days', align: 'end', render: (r) => <DaysLeft date={r.expiry} /> },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            {
              key: 'a',
              header: '',
              render: (r) =>
                r.status !== 'Valid' ? (
                  <Button
                    size="sm"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      actions.toast({ title: 'Renewal scheduled', body: `${r.name} for ${r.e.name} booked with the training provider.`, tone: 'success' })
                    }}
                  >
                    Schedule
                  </Button>
                ) : null,
            },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------- Iqama ---------------- */

export function IqamaPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [range, setRange] = useState<30 | 60 | 90 | 365>(90)
  const list = inProject(state.employees, state.projectFilter)
    .filter((e) => e.nationality !== 'Saudi')
    .sort((a, b) => a.iqamaExpiry.localeCompare(b.iqamaExpiry))
  const within = (n: number) => list.filter((e) => daysUntil(e.iqamaExpiry) <= n)
  const rows = within(range)
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={crumbs('Iqama / Visa')}
        title="Iqama / Visa"
        count={`${within(30).length} within 30 days`}
        subtitle="Residency permit expiries for expatriate workforce. Portfolio total expiring within 30 days: 19."
        tag={<ProjectFilterNote state={state} />}
        actions={
          <Button variant="primary" icon={RefreshCw} onClick={() => actions.toast({ title: 'Batch renewal submitted', body: `${within(30).length} Iqama renewals queued for the government relations team (simulated).`, tone: 'success' })}>
            Batch renewal
          </Button>
        }
      />
      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-3">
        <Kpi label="Within 30 days" value={within(30).length} tone="crit" icon={IdCard} onClick={() => setRange(30)} />
        <Kpi label="Within 60 days" value={within(60).length} tone="warn" icon={IdCard} onClick={() => setRange(60)} />
        <Kpi label="Within 90 days" value={within(90).length} icon={IdCard} onClick={() => setRange(90)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {([30, 60, 90, 365] as const).map((n) => (
          <FilterChip key={n} active={range === n} onClick={() => setRange(n)} count={within(n).length}>
            {n === 365 ? 'All' : `≤ ${n} days`}
          </FilterChip>
        ))}
      </div>
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(e) => e.id}
          onRowClick={(e) => navigate(`/hr/workers/${e.id}`)}
          highlight={(e) => daysUntil(e.iqamaExpiry) <= 30}
          empty={<EmptyState className="m-5" title="No Iqama expiries in this window" />}
          columns={[
            { key: 'n', header: 'Employee', render: (e) => <span className="font-medium whitespace-nowrap">{e.name}</span> },
            { key: 'id', header: 'Employee ID', render: (e) => <span className="text-ink-2">{e.id}</span>, hideBelow: 'sm' },
            { key: 'nat', header: 'Nationality', render: (e) => e.nationality, hideBelow: 'md' },
            { key: 'p', header: 'Project', render: (e) => <span className="whitespace-nowrap">{shortName(state, e.projectId)}</span>, hideBelow: 'md' },
            { key: 'x', header: 'Iqama expiry', render: (e) => <span className="whitespace-nowrap">{fmtDate(e.iqamaExpiry)}</span> },
            { key: 'd', header: 'Days', align: 'end', render: (e) => <DaysLeft date={e.iqamaExpiry} /> },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------- Combined expiry ---------------- */

export function HrExpiryPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [kind, setKind] = useState<'all' | 'cert' | 'iqama'>('all')
  const all = useMemo(
    () =>
      inProject(state.employees, state.projectFilter)
        .flatMap((e) => [
          ...e.certifications.map((c) => ({ key: `${e.id}-${c.name}`, e, kind: 'cert' as const, what: c.name, date: c.expiry })),
          ...(e.nationality !== 'Saudi' ? [{ key: `${e.id}-iqama`, e, kind: 'iqama' as const, what: 'Iqama / residency permit', date: e.iqamaExpiry }] : []),
        ])
        .filter((r) => daysUntil(r.date) <= 60)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [state.employees, state.projectFilter],
  )
  const rows = kind === 'all' ? all : all.filter((r) => r.kind === kind)
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Expiry alerts')} title="Expiry alerts" count={all.length} subtitle="Certificates and Iqama expiring within 60 days. Feeds the global expiry engine." tag={<ProjectFilterNote state={state} />} />
      <div className="flex flex-wrap gap-2">
        <FilterChip active={kind === 'all'} onClick={() => setKind('all')} count={all.length}>All</FilterChip>
        <FilterChip active={kind === 'cert'} onClick={() => setKind('cert')} count={all.filter((r) => r.kind === 'cert').length}>Certificates</FilterChip>
        <FilterChip active={kind === 'iqama'} onClick={() => setKind('iqama')} count={all.filter((r) => r.kind === 'iqama').length}>Iqama</FilterChip>
      </div>
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(r) => r.key}
          onRowClick={(r) => navigate(`/hr/workers/${r.e.id}`)}
          empty={<EmptyState className="m-5" title="No expiries within 60 days" />}
          columns={[
            { key: 'w', header: 'Document', render: (r) => <span className="font-medium">{r.what}</span> },
            { key: 'k', header: 'Type', render: (r) => <Pill tone={r.kind === 'iqama' ? 'info' : 'neutral'}>{r.kind === 'iqama' ? 'Iqama' : 'Certificate'}</Pill>, hideBelow: 'sm' },
            { key: 'e', header: 'Employee', render: (r) => <span className="whitespace-nowrap">{r.e.name}</span> },
            { key: 'p', header: 'Project', render: (r) => shortName(state, r.e.projectId), hideBelow: 'md' },
            { key: 'x', header: 'Expiry', render: (r) => <span className="whitespace-nowrap">{fmtDate(r.date)}</span>, hideBelow: 'sm' },
            { key: 'd', header: 'Days', align: 'end', render: (r) => <DaysLeft date={r.date} /> },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={expiryStatus(r.date)} /> },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------- Worker profile ---------------- */

export function WorkerProfile() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useStore()
  const e = state.employees.find((x) => x.id === id)
  if (!e) {
    return (
      <EmptyState
        title="Worker not found"
        body={`No employee with ID "${id}" exists in this demo dataset.`}
        action={
          <Button icon={ArrowLeft} onClick={() => navigate('/hr/manpower')}>
            Back to directory
          </Button>
        }
      />
    )
  }
  const soonestCert = [...e.certifications].sort((a, b) => a.expiry.localeCompare(b.expiry))[0]
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'HR / Manpower', to: '/hr' }, { label: 'Manpower', to: '/hr/manpower' }, { label: e.name }]}
        title={e.name}
        count={e.id}
        tag={<StatusPill status={e.status} />}
        subtitle={`${e.trade} · ${projectName(state, e.projectId)} · ${e.employer}`}
        actions={
          <Button icon={RefreshCw} onClick={() => actions.toast({ title: 'Renewal requests raised', body: `Expiring documents for ${e.name} sent to HR operations.`, tone: 'success' })}>
            Renew expiring
          </Button>
        }
      />
      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Attendance" value={`${e.attendance}%`} sub="Last 30 days" />
        <MiniStat label="Utilisation" value={`${e.utilisation}%`} sub={e.utilisation < 75 ? 'Below 75% threshold' : 'Productive hours'} />
        <MiniStat label="Certificate expiry" value={soonestCert ? fmtDate(soonestCert.expiry) : '—'} sub={soonestCert?.name} />
        <MiniStat label="Iqama expiry" value={e.nationality === 'Saudi' ? 'N/A' : fmtDate(e.iqamaExpiry)} sub={e.nationality === 'Saudi' ? 'Saudi national' : `${daysUntil(e.iqamaExpiry)} days`} />
      </div>
      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-2">
        <Card title="Profile" icon={IdCard}>
          <KeyValue
            rows={[
              { icon: IdCard, label: 'Employee ID', value: e.id },
              { icon: HardHat, label: 'Trade', value: e.trade },
              { icon: MapPin, label: 'Project', value: <Link to={`/projects/${e.projectId}`} className="font-medium text-action hover:underline">{projectName(state, e.projectId)}</Link> },
              { icon: Building2, label: 'Employer', value: e.employer },
              { icon: Award, label: 'Skill', value: e.skill },
              { icon: Users, label: 'Nationality', value: e.nationality },
              { icon: CalendarCheck, label: 'Attendance', value: `${e.attendance}%` },
              { icon: Gauge, label: 'Utilisation', value: `${e.utilisation}%` },
              { icon: IdCard, label: 'Iqama expiry', value: e.nationality === 'Saudi' ? 'Not applicable' : <span>{fmtDate(e.iqamaExpiry)} <StatusPill status={expiryStatus(e.iqamaExpiry)} className="ms-1" /></span> },
            ]}
          />
        </Card>
        <div className="space-y-6">
          <Card title="Certifications" icon={BadgeCheck} bodyClassName="p-0">
            <DataTable
              rows={e.certifications}
              rowKey={(c) => c.name}
              columns={[
                { key: 'n', header: 'Certificate', render: (c) => <span className="font-medium">{c.name}</span> },
                { key: 'x', header: 'Expiry', render: (c) => <span className="whitespace-nowrap">{fmtDate(c.expiry)}</span> },
                { key: 'd', header: 'Days', align: 'end', render: (c) => <DaysLeft date={c.expiry} />, hideBelow: 'sm' },
                { key: 's', header: 'Status', render: (c) => <StatusPill status={expiryStatus(c.expiry)} /> },
              ]}
            />
          </Card>
          <Card title="Deployment history" icon={Briefcase}>
            <Timeline
              items={e.deployment.map((d, i) => ({
                key: `${d.project}-${d.from}`,
                title: <Link to={`/projects/${d.project}`} className="font-medium hover:text-action">{projectName(state, d.project)}</Link>,
                meta: `${fmtDate(d.from)} to ${d.to === 'Present' ? 'present' : fmtDate(d.to)}`,
                tone: i === 0 ? 'info' : 'neutral',
              }))}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
