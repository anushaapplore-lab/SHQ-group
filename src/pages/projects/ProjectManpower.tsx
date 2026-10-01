import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, Clock, Users } from 'lucide-react'
import { manpowerByProject } from '../../data/hr'
import { useStore } from '../../store/store'
import { cx, num } from '../../lib/format'
import { Button, Card, DataTable, Kpi, PageHeader, Pill, ProgressBar } from '../../components/ui'
import type { Column } from '../../components/ui'
import { AXIS_TICK, TOOLTIP_STYLE } from '../../components/projects/Gantt'

type Row = (typeof manpowerByProject)[number] & { name: string; shortName: string; type: string }

export function ProjectManpowerPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const rows: Row[] = manpowerByProject
    .filter((m) => state.projectFilter === 'all' || m.projectId === state.projectFilter)
    .map((m) => {
      const p = state.projects.find((x) => x.id === m.projectId)
      return { ...m, name: p?.name ?? m.projectId, shortName: p?.shortName ?? m.projectId, type: p?.type ?? '' }
    })
  const planned = rows.reduce((a, r) => a + r.planned, 0)
  const actual = rows.reduce((a, r) => a + r.actual, 0)
  const idle = rows.reduce((a, r) => a + r.idle, 0)
  const ot = rows.reduce((a, r) => a + r.overtime, 0)
  const util = actual ? Math.round(rows.reduce((a, r) => a + r.utilisation * r.actual, 0) / actual) : 0

  const cols: Column<Row>[] = [
    {
      key: 'p',
      header: 'Project',
      render: (r) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-ink">{r.name}</div>
          <div className="text-[12px] text-ink-3">
            {r.projectId} · {r.type}
          </div>
        </div>
      ),
    },
    { key: 'pl', header: 'Planned', align: 'end', render: (r) => <span className="tabular">{num(r.planned)}</span> },
    { key: 'ac', header: 'Actual', align: 'end', render: (r) => <span className="tabular font-medium">{num(r.actual)}</span> },
    {
      key: 'gap',
      header: 'Gap',
      align: 'end',
      render: (r) => {
        const g = r.actual - r.planned
        return g < 0 ? <Pill tone={g / r.planned <= -0.1 ? 'crit' : 'warn'}>{g}</Pill> : <span className="text-ink-3">0</span>
      },
    },
    {
      key: 'u',
      header: 'Utilisation',
      render: (r) => (
        <div className="flex min-w-[120px] items-center gap-2">
          <ProgressBar value={r.utilisation} tone={r.utilisation >= 88 ? 'ok' : r.utilisation >= 80 ? 'warn' : 'crit'} className="flex-1" />
          <span className="tabular w-9 text-end">{r.utilisation}%</span>
        </div>
      ),
    },
    { key: 'i', header: 'Idle', align: 'end', render: (r) => <span className={cx('tabular', r.idle > 20 && 'font-medium text-crit')}>{r.idle}</span> },
    { key: 'ot', header: 'Overtime (h)', align: 'end', hideBelow: 'sm', render: (r) => <span className="tabular text-ink-2">{num(r.overtime)}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Project Manpower"
        count={rows.length}
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: 'Manpower' }]}
        subtitle="Planned vs deployed headcount, utilisation, idle workers and overtime by project"
        tag={state.projectFilter !== 'all' ? <Pill tone="info">Filtered</Pill> : undefined}
        actions={
          <Button icon={ArrowUpRight} onClick={() => navigate('/hr')}>
            HR workspace
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Planned headcount" value={num(planned)} icon={Users} />
        <Kpi label="Deployed" value={num(actual)} sub={<span className={actual < planned ? 'text-warn' : ''}>{planned - actual} below plan</span>} />
        <Kpi label="Utilisation" value={`${util}%`} tone={util >= 88 ? 'ok' : 'warn'} sub="Weighted by headcount" to="/hr/utilisation" />
        <Kpi label="Idle workers" value={idle} tone={idle > 50 ? 'crit' : 'warn'} sub="Inspection waiting is top cause" />
        <Kpi label="Overtime this month" value={`${num(ot)} h`} icon={Clock} />
      </div>
      <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[1fr_1fr]">
        <Card title="Manpower by project" bodyClassName="p-0" className="min-w-0">
          <DataTable columns={cols} rows={rows} rowKey={(r) => r.projectId} onRowClick={(r) => navigate(`/projects/${r.projectId}?tab=manpower`)} highlight={(r) => r.actual / r.planned < 0.9} />
        </Card>
        <Card title="Planned vs actual" subtitle="Headcount by project" className="min-w-0">
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f3" horizontal={false} />
                <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="projectId" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f6f6f6' }} labelFormatter={(l) => rows.find((r) => r.projectId === l)?.name ?? String(l)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="planned" name="Planned" fill="#94a3b8" radius={[0, 3, 3, 0]} barSize={7} />
                <Bar dataKey="actual" name="Actual" fill="#1d4ed8" radius={[0, 3, 3, 0]} barSize={7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
