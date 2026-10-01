import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, ClipboardList, Eye, FileCheck2, Gauge, Plus, ShieldAlert, Smartphone, Thermometer, TrendingUp, Construction, Inbox } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { hseCategories, permits } from '../../data/hse'
import type { Observation } from '../../data/types'
import { fmtShort, daysUntil, cx } from '../../lib/format'
import { roleProfile } from '../../store/roles'
import { inProject, openObservations, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { Button, Card, DemoTag, EmptyState, Kpi, LinkText, PageHeader, Pill, StatLine, StatusPill } from '../../components/ui'
import { NewObservationModal } from '../../components/hse/ObservationForm'
import { FieldAppPill } from '../../components/hse/FieldAppPill'

const isHigh = (o: Observation) => o.severity === 'High' || o.severity === 'Critical'

export function HseDashboard() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [newOpen, setNewOpen] = useState(false)
  const filter = state.projectFilter
  const profile = roleProfile(state.role)

  const obs = inProject(state.observations, filter)
  const open = openObservations(state, filter)
  const allOpen = openObservations(state)
  const closureRate = state.hseStats.totalObs > 0 ? ((state.hseStats.totalObs - allOpen.length) / state.hseStats.totalObs) * 100 : 0
  const activePermits = permits.filter((p) => p.status === 'Active').length
  const suspendedPermits = permits.filter((p) => p.status === 'Suspended').length
  const pendingPermits = permits.filter((p) => p.status === 'Pending').length

  const catData = useMemo(
    () =>
      hseCategories.map((c) => ({
        name: c,
        total: obs.filter((o) => o.category === c).length,
        open: obs.filter((o) => o.category === c && o.status !== 'Closed').length,
      })),
    [obs],
  )

  const highRisk = open
    .filter(isHigh)
    .sort((a, b) => {
      // newest field captures first, then AI-flagged, then by date
      const fa = a.source === 'Field App' && a.id !== 'OBS-1042' ? 1 : 0
      const fb = b.source === 'Field App' && b.id !== 'OBS-1042' ? 1 : 0
      if (fa !== fb) return fb - fa
      if (!!a.ai !== !!b.ai) return a.ai ? -1 : 1
      return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
    })

  const hseActions = inProject(state.actions, filter).filter((a) => a.department === 'HSE' && a.status !== 'Closed')
  const overdueActions = hseActions.filter((a) => a.status === 'Overdue' || daysUntil(a.dueDate) < 0)
  const fieldObs = obs.filter((o) => o.source === 'Field App').slice(0, 4)

  const setStatus = (id: string, status: string) => {
    actions.setActionStatus(id, status)
    actions.toast({ title: `${id} ${status === 'Closed' ? 'closed' : `set to ${status}`}`, tone: status === 'Closed' ? 'success' : 'info' })
  }

  return (
    <div>
      <PageHeader
        title="HSE Command Centre"
        subtitle={
          state.role === 'HSE Manager' ? (
            <span>
              Good morning, {profile.firstName}. {open.filter(isHigh).length} high-risk observations and {overdueActions.length} overdue actions need you today.
            </span>
          ) : (
            'Observations, actions, permits and site risk across active projects.'
          )
        }
        tag={filter !== 'all' ? <Pill tone="info">{projectName(state, filter)}</Pill> : undefined}
        actions={
          <>
            <Button icon={Eye} onClick={() => navigate('/hse/observations')}>
              All observations
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setNewOpen(true)}>
              New Observation
            </Button>
          </>
        }
      />

      {state.role === 'HSE Manager' && (
        <Card title="My queue" icon={Inbox} className="mb-6" bodyClassName="grid gap-3 p-4 sm:grid-cols-3">
          <QueueTile label="High-risk observations to review" value={open.filter(isHigh).length} tone="crit" onClick={() => navigate('/hse/observations?severity=High')} />
          <QueueTile label="Overdue corrective actions" value={overdueActions.length} tone="warn" onClick={() => document.getElementById('hse-actions')?.scrollIntoView({ behavior: 'smooth' })} />
          <QueueTile label="Permits suspended" value={suspendedPermits} tone="warn" onClick={() => navigate('/hse/permits')} />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Observations" value={state.hseStats.totalObs} sub="Year to date, all projects" icon={Eye} to="/hse/observations" />
        <Kpi label="Open Observations" value={open.length} sub={`${open.filter(isHigh).length} high or critical`} icon={ShieldAlert} tone={open.filter(isHigh).length ? 'warn' : 'ok'} to="/hse/observations?status=open" />
        <Kpi label="Closure Rate" value={`${closureRate.toFixed(1)}%`} sub="Rolling, target 90%" icon={TrendingUp} tone={closureRate >= 90 ? 'ok' : 'warn'} />
        <Kpi label="Incidents" value={state.hseStats.incidents} sub="This month, no lost time injury" icon={AlertTriangle} to="/hse/incidents" />
        <Kpi label="Near Misses" value={state.hseStats.nearMisses} sub="This month, reporting encouraged" icon={Activity} to="/hse/incidents" />
        <Kpi label="High-Risk Activities" value={state.hseStats.highRiskActivities} sub="Critical lifts, hot work, confined space" icon={Construction} to="/hse/risk-assessments" />
        <Kpi label="Permit Status" value={`${activePermits} active`} sub={`${suspendedPermits} suspended · ${pendingPermits} pending`} icon={FileCheck2} tone={suspendedPermits ? 'warn' : 'ok'} to="/hse/permits" />
        <Kpi label="Heat Stress Index" value="42°C" sub="Extreme caution, work/rest regime in force" icon={Thermometer} tone="crit" to="/hse/heat" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card
          title="Open high-risk observations"
          icon={ShieldAlert}
          subtitle={`${highRisk.length} open, High or Critical`}
          actions={<LinkText to="/hse/observations">View all</LinkText>}
          bodyClassName="p-0"
        >
          {highRisk.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No open high-risk observations" body="Every High and Critical observation has been closed out." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {highRisk.slice(0, 7).map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => navigate(`/hse/observations/${o.id}`)} className="flex w-full items-start gap-3 px-5 py-3 text-start hover:bg-[#f9fafb]">
                    <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', o.severity === 'Critical' || o.severity === 'High' ? 'bg-crit' : 'bg-[#d97706]')} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-medium text-ink-3">{o.id}</span>
                        {o.ai && <DemoTag>AI flagged</DemoTag>}
                        {o.source === 'Field App' && <FieldAppPill />}
                      </span>
                      <span className="mt-0.5 block truncate text-[14px] font-medium text-ink">{o.title}</span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-3">
                        {o.category} · {o.location} · {projectName(state, o.projectId)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusPill status={o.status} />
                      <span className="text-[12px] text-ink-3">Due {fmtShort(o.dueDate)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Observations by category" icon={Gauge} subtitle="Seeded register, current filter" actions={<DemoTag>Illustrative Data</DemoTag>}>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="#eef0f3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#7b7d81' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 12, fill: '#7b7d81' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 }} />
                <Bar dataKey="total" name="Observations" radius={[0, 4, 4, 0]} barSize={14}>
                  {catData.map((c) => (
                    <Cell key={c.name} fill={c.name === 'Suspended Load' ? '#b91c1c' : '#1d4ed8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card id="hse-actions" title="Open actions" icon={ClipboardList} subtitle={`${hseActions.length} open · ${overdueActions.length} overdue`} bodyClassName="p-0">
          {hseActions.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No open HSE actions" body="All corrective actions are closed." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {hseActions.slice(0, 8).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1 basis-60">
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                      <span className="font-medium">{a.id}</span>
                      <span>·</span>
                      <LinkText to={`/hse/observations/${a.sourceId}`}>{a.sourceId}</LinkText>
                      <span>·</span>
                      <span>{a.owner}</span>
                    </div>
                    <div className="mt-0.5 text-[14px] text-ink">{a.title}</div>
                    <div className={cx('mt-0.5 text-[12px]', daysUntil(a.dueDate) < 0 ? 'text-crit' : 'text-ink-3')}>Due {fmtShort(a.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={a.status} />
                    {a.status !== 'In Progress' && (
                      <Button size="sm" onClick={() => setStatus(a.id, 'In Progress')}>
                        Start
                      </Button>
                    )}
                    <Button size="sm" variant="success" onClick={() => setStatus(a.id, 'Closed')}>
                      Close
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid content-start gap-4">
          <Card title="From the field app" icon={Smartphone} subtitle="Captured on site, synced into this dashboard" bodyClassName="p-0">
            {fieldObs.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Smartphone} title="No field captures yet" body="Observations captured in the mobile field app appear here after sync." />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {fieldObs.map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => navigate(`/hse/observations/${o.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-start hover:bg-[#f9fafb]">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[12px] text-ink-3">
                          {o.id} <FieldAppPill />
                        </span>
                        <span className="block truncate text-[14px] text-ink">{o.title}</span>
                        <span className="block truncate text-[12px] text-ink-3">
                          {o.reportedBy} · {o.location}
                        </span>
                      </span>
                      <StatusPill status={o.severity} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Today on site" icon={Thermometer}>
            <StatLine label="Active permits to work" value={state.hseStats.activePermits} />
            <StatLine label="Critical lifts planned" value={4} />
            <StatLine label="Lifting permit PTW-NPE-2292" value="Suspended" tone="crit" />
            <StatLine label="Toolbox talks delivered" value="18 / 19" />
            <StatLine label="WBGT peak forecast" value="42°C at 13:00" tone="crit" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" iconRight={ArrowRight} onClick={() => navigate('/hse/permits')}>
                Permits
              </Button>
              <Button size="sm" iconRight={ArrowRight} onClick={() => navigate('/hse/heat')}>
                Heat stress
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <NewObservationModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}

function QueueTile({ label, value, tone, onClick }: { label: string; value: number; tone: 'crit' | 'warn'; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-between gap-3 rounded-[8px] bg-muted px-4 py-3 text-start hover:bg-[#eef0f3]">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className={cx('tabular text-[22px] font-semibold', value ? (tone === 'crit' ? 'text-crit' : 'text-warn') : 'text-ink')}>{value}</span>
    </button>
  )
}
