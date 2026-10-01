import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Cog,
  FileSignature,
  Gauge,
  History,
  MapPin,
  Play,
  ShieldCheck,
  Tag,
  Timer,
  User,
  Wrench,
} from 'lucide-react'
import type { Asset, PMTask, WorkOrder } from '../../data/types'
import { omContracts, slaTrend } from '../../data/om'
import { cx, daysUntil, fmtDate, num, sarM } from '../../lib/format'
import { inProject, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import type { Column } from '../../components/ui'
import { Button, Card, DataTable, DemoTag, EmptyState, FilterChip, KeyValue, Kpi, PageHeader, Pill, Select, SlideOver, StatusPill } from '../../components/ui'
import { CHART, MiniStat, ProjectFilterNote, Timeline } from '../../components/procurement/common'

const crumbs = (label: string) => [{ label: 'O&M', to: '/om' }, { label }]
const isOpenWo = (w: WorkOrder) => w.status !== 'Completed'
const breached = (w: WorkOrder) => isOpenWo(w) && w.elapsedHours > w.slaHours
const critTone = (c: Asset['criticality']) => (c === 'High' ? 'crit' : c === 'Medium' ? 'warn' : 'neutral')

function SlaBar({ w }: { w: WorkOrder }) {
  const ratio = w.elapsedHours / w.slaHours
  const tone = w.status === 'Completed' ? 'bg-ok' : ratio > 1 ? 'bg-crit' : ratio > 0.75 ? 'bg-[#d97706]' : 'bg-action'
  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-[12px]">
        <span className={cx('tabular', breached(w) ? 'font-medium text-crit' : 'text-ink-2')}>
          {w.elapsedHours} / {w.slaHours} h
        </span>
        {breached(w) && <span className="font-medium text-crit">Breach</span>}
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-[#eef0f3]">
        <div className={cx('h-full rounded-full', tone)} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
    </div>
  )
}

function WoActions({ w }: { w: WorkOrder }) {
  const { actions } = useStore()
  if (w.status === 'Completed') return <span className="text-[12px] text-ok">Done</span>
  return (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {w.status === 'Open' && (
        <Button size="sm" icon={Play} onClick={() => actions.setWorkOrderStatus(w.id, 'In Progress')}>
          Start
        </Button>
      )}
      <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => actions.setWorkOrderStatus(w.id, 'Completed')}>
        Complete
      </Button>
    </div>
  )
}

function useWoColumns(withAsset = true): Column<WorkOrder>[] {
  const { state } = useStore()
  const cols: Column<WorkOrder>[] = [
    {
      key: 'id',
      header: 'Work order',
      render: (w) => (
        <div className="min-w-[160px]">
          <div className="font-medium">{w.id}</div>
          <div className="text-[12px] text-ink-2">{w.title}</div>
        </div>
      ),
    },
  ]
  if (withAsset) cols.push({ key: 'asset', header: 'Asset', render: (w) => <span className="whitespace-nowrap">{state.assets.find((a) => a.id === w.assetId)?.tag ?? w.assetId}</span>, hideBelow: 'sm' })
  cols.push(
    { key: 'type', header: 'Type', render: (w) => w.type, hideBelow: 'md' },
    { key: 'pri', header: 'Priority', render: (w) => <StatusPill status={w.priority} />, hideBelow: 'sm' },
    { key: 'tech', header: 'Technician', render: (w) => <span className="whitespace-nowrap text-ink-2">{w.technician}</span>, hideBelow: 'lg' },
    { key: 'sla', header: 'SLA elapsed', render: (w) => <SlaBar w={w} /> },
    { key: 'st', header: 'Status', render: (w) => <StatusPill status={w.status} /> },
    { key: 'act', header: '', render: (w) => <WoActions w={w} /> },
  )
  return cols
}

function usePmColumns(): Column<PMTask>[] {
  const { state, actions } = useStore()
  return [
    {
      key: 'asset',
      header: 'Asset',
      render: (t) => {
        const a = state.assets.find((x) => x.id === t.assetId)
        return (
          <div className="min-w-[140px]">
            <div className="font-medium">{a?.name ?? t.assetId}</div>
            <div className="text-[12px] text-ink-3">{a?.location}</div>
          </div>
        )
      },
    },
    { key: 'type', header: 'Maintenance Type', render: (t) => t.maintenanceType },
    { key: 'due', header: 'Due Date', render: (t) => <span className="whitespace-nowrap">{fmtDate(t.dueDate)}</span> },
    { key: 'last', header: 'Last Service', render: (t) => <span className="whitespace-nowrap text-ink-2">{fmtDate(t.lastService)}</span>, hideBelow: 'md' },
    { key: 'st', header: 'Status', render: (t) => <StatusPill status={t.status} /> },
    { key: 'tech', header: 'Technician', render: (t) => <span className="whitespace-nowrap text-ink-2">{t.technician}</span>, hideBelow: 'sm' },
    {
      key: 'act',
      header: '',
      render: (t) =>
        t.status === 'Completed' ? (
          <span className="text-[12px] text-ok">Done</span>
        ) : (
          <Button
            size="sm"
            variant={t.status === 'Overdue' || t.status === 'Due' ? 'success' : 'secondary'}
            onClick={(e) => {
              e.stopPropagation()
              actions.completePM(t.id)
            }}
          >
            Complete
          </Button>
        ),
    },
  ]
}

/* ---------------- Dashboard ---------------- */

export function OmDashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const assets = inProject(state.assets, state.projectFilter)
  const wos = inProject(state.workOrders, state.projectFilter)
  const pms = inProject(state.pmTasks, state.projectFilter)
  const contracts = inProject(omContracts, state.projectFilter)
  const openWos = wos.filter(isOpenWo)
  const overduePm = pms.filter((t) => t.status === 'Overdue').length
  const pmCompliance = pms.length ? Math.round(92 + ((2 - overduePm) / pms.length) * 10) : 92
  const highAssets = assets.filter((a) => a.criticality === 'High')
  const notOperational = highAssets.filter((a) => a.status !== 'Operational')
  const cp = state.assets.find((a) => a.id === 'CP-042')
  const cpOpen = state.workOrders.filter((w) => w.assetId === 'CP-042' && isOpenWo(w)).length
  const woCols = useWoColumns()

  return (
    <div className="space-y-6">
      <PageHeader
        title="O&M"
        count={`${contracts.length} active contracts`}
        subtitle={`${openWos.length} open work orders, ${openWos.filter(breached).length} past SLA. ${overduePm} preventive maintenance tasks overdue.`}
        tag={<ProjectFilterNote state={state} />}
        actions={
          <>
            <Button icon={CalendarClock} onClick={() => navigate('/om/pm')}>
              PM schedule
            </Button>
            <Button variant="primary" icon={Wrench} onClick={() => navigate('/om/work-orders')}>
              Work orders
            </Button>
          </>
        }
      />
      <div className="grid [&>*]:min-w-0 gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Active Contracts" value={contracts.length} sub={sarM(contracts.reduce((a, c) => a + c.value, 0)) + ' total value'} icon={FileSignature} to="/om/contracts" />
        <Kpi label="Assets" value={assets.length} sub="Under maintenance scope" icon={Cog} to="/om/assets" />
        <Kpi label="Open Work Orders" value={openWos.length} tone={openWos.some(breached) ? 'warn' : undefined} sub={`${openWos.filter(breached).length} SLA breach`} icon={Wrench} to="/om/work-orders" />
        <Kpi label="PM Compliance" value={`${Math.min(100, pmCompliance)}%`} tone={overduePm ? 'warn' : 'ok'} sub={`${overduePm} overdue in schedule`} icon={CalendarClock} to="/om/pm" />
        <Kpi label="SLA Compliance" value={`${slaTrend[slaTrend.length - 1].sla}%`} sub="September 2026" icon={ShieldCheck} to="/om/sla" />
        <Kpi label="Critical Assets" value={highAssets.length} tone={notOperational.length ? 'crit' : undefined} sub={`${notOperational.length} not operational`} icon={Activity} to="/om/assets" />
      </div>

      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {cp && (
          <Card title="Asset highlight" icon={Cog} actions={<Button size="sm" onClick={() => navigate(`/om/assets/${cp.id}`)}>Open</Button>}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[16px] font-semibold text-ink">{cp.name}</span>
              <StatusPill status={cp.status} />
            </div>
            <KeyValue
              rows={[
                { icon: Tag, label: 'Asset', value: cp.name },
                { icon: MapPin, label: 'Location', value: cp.location },
                { icon: Activity, label: 'Status', value: cp.status },
                { icon: History, label: 'Last Maintenance', value: fmtDate(cp.lastMaintenance) },
                { icon: CalendarClock, label: 'Next PM', value: fmtDate(cp.nextPM) },
                { icon: Timer, label: 'Operating Hours', value: num(cp.operatingHours) },
                { icon: Wrench, label: 'Open Work Orders', value: cpOpen },
              ]}
            />
          </Card>
        )}
        <Card title="SLA and PM compliance" icon={ShieldCheck} subtitle="Apr to Sep 2026, target 95%">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART.tick} />
                <YAxis tick={CHART.tick} domain={[85, 100]} unit="%" />
                <Tooltip contentStyle={CHART.tooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={95} stroke={CHART.planned} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="sla" name="SLA compliance" stroke={CHART.primary} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pm" name="PM compliance" stroke={CHART.ok} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Open work orders" icon={Wrench} bodyClassName="p-0" actions={<Button size="sm" onClick={() => navigate('/om/work-orders')}>View all</Button>}>
        <DataTable rows={openWos} rowKey={(w) => w.id} columns={woCols} onRowClick={(w) => navigate(`/om/assets/${w.assetId}`)} highlight={breached} empty={<EmptyState className="m-5" icon={CheckCircle2} title="No open work orders" />} />
      </Card>
    </div>
  )
}

/* ---------------- Assets ---------------- */

export function AssetsPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState('all')
  const base = inProject(state.assets, state.projectFilter)
  const statuses = Array.from(new Set(state.assets.map((a) => a.status)))
  const rows = f === 'all' ? base : base.filter((a) => a.status === f)
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Assets')} title="Assets" count={rows.length} subtitle="Maintained equipment across O&M contracts." tag={<ProjectFilterNote state={state} />} />
      <div className="flex flex-wrap gap-2">
        <FilterChip active={f === 'all'} onClick={() => setF('all')} count={base.length}>
          All
        </FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} active={f === s} onClick={() => setF(s)} count={base.filter((a) => a.status === s).length}>
            {s}
          </FilterChip>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No assets" body="No assets match this filter or project." />
      ) : (
        <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => {
            const open = state.workOrders.filter((w) => w.assetId === a.id && isOpenWo(w)).length
            const dueIn = daysUntil(a.nextPM)
            return (
              <button key={a.id} type="button" onClick={() => navigate(`/om/assets/${a.id}`)} className="rounded-[12px] border border-line bg-surface p-5 text-start transition-colors hover:border-line-strong hover:bg-[#fcfcfd]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-ink">{a.name}</div>
                    <div className="truncate text-[13px] text-ink-2">{a.type}</div>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-2">
                  <MapPin className="size-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{a.location}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
                  <div>
                    <div className="text-ink-3">Next PM</div>
                    <div className={cx('font-medium', dueIn < 0 ? 'text-crit' : dueIn <= 7 ? 'text-warn' : 'text-ink')}>{fmtDate(a.nextPM)}</div>
                  </div>
                  <div>
                    <div className="text-ink-3">Hours</div>
                    <div className="tabular font-medium text-ink">{num(a.operatingHours)}</div>
                  </div>
                  <div>
                    <div className="text-ink-3">Open WOs</div>
                    <div className="tabular font-medium text-ink">{open}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <Pill tone={critTone(a.criticality)}>{a.criticality} criticality</Pill>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AssetDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useStore()
  const a = state.assets.find((x) => x.id === id)
  const woCols = useWoColumns(false)
  const pmCols = usePmColumns()
  if (!a) {
    return (
      <EmptyState
        title="Asset not found"
        body={`No asset with tag "${id}" exists in this demo dataset.`}
        action={
          <Button icon={ArrowLeft} onClick={() => navigate('/om/assets')}>
            Back to assets
          </Button>
        }
      />
    )
  }
  const wos = state.workOrders.filter((w) => w.assetId === a.id)
  const open = wos.filter(isOpenWo)
  const pms = state.pmTasks.filter((t) => t.assetId === a.id)
  const contract = omContracts.find((c) => c.projectId === a.projectId)
  const degraded = a.status !== 'Operational'
  const seed = a.tag.length + a.operatingHours / 1000
  const condition = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m, i) => ({
    month: m,
    vib: Math.round((1.6 + ((seed * (i + 3)) % 7) / 10 + (degraded ? i * 0.55 : i * 0.05)) * 10) / 10,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'O&M', to: '/om' }, { label: 'Assets', to: '/om/assets' }, { label: a.tag }]}
        title={a.name}
        count={a.type}
        tag={<StatusPill status={a.status} />}
        subtitle={`${a.location} · ${projectName(state, a.projectId)}`}
        actions={
          <Button icon={Wrench} onClick={() => actions.toast({ title: 'Work request raised', body: `Corrective work request for ${a.tag} sent to the maintenance planner.`, tone: 'success' })}>
            Raise work request
          </Button>
        }
      />
      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Operating hours" value={num(a.operatingHours)} />
        <MiniStat label="Open work orders" value={open.length} sub={`${open.filter(breached).length} past SLA`} />
        <MiniStat label="Next PM" value={fmtDate(a.nextPM)} sub={`${daysUntil(a.nextPM)} days`} />
        <MiniStat label="Criticality" value={a.criticality} />
      </div>
      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card title="Work orders" icon={Wrench} bodyClassName="p-0">
            <DataTable rows={wos} rowKey={(w) => w.id} columns={woCols} highlight={breached} empty={<EmptyState className="m-5" title="No work orders for this asset" />} />
          </Card>
          <Card title="Preventive maintenance" icon={CalendarClock} bodyClassName="p-0">
            <DataTable rows={pms} rowKey={(t) => t.id} columns={pmCols.filter((c) => c.key !== 'asset')} empty={<EmptyState className="m-5" title="No PM tasks scheduled" />} />
          </Card>
          <Card title="Condition monitoring" icon={Gauge} subtitle="Overall vibration velocity, mm/s RMS" actions={<DemoTag>Illustrative Data</DemoTag>}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={condition} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="month" tick={CHART.tick} />
                  <YAxis tick={CHART.tick} domain={[0, 6]} />
                  <Tooltip contentStyle={CHART.tooltip} formatter={(v) => [`${v} mm/s`, 'Vibration']} />
                  <ReferenceLine y={4.5} stroke={CHART.crit} strokeDasharray="4 4" label={{ value: 'Alarm 4.5', position: 'insideTopRight', fontSize: 11, fill: CHART.crit }} />
                  <Line type="monotone" dataKey="vib" stroke={degraded ? CHART.warn : CHART.primary} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="min-w-0 space-y-6">
          <Card title="Asset details" icon={Cog}>
            <KeyValue
              rows={[
                { icon: Tag, label: 'Tag', value: a.tag },
                { icon: Cog, label: 'Type', value: a.type },
                { icon: MapPin, label: 'Location', value: a.location },
                { icon: Activity, label: 'Status', value: <StatusPill status={a.status} /> },
                { icon: History, label: 'Last maintenance', value: fmtDate(a.lastMaintenance) },
                { icon: CalendarClock, label: 'Next PM', value: fmtDate(a.nextPM) },
                { icon: Timer, label: 'Operating hours', value: num(a.operatingHours) },
                { icon: User, label: 'Owner', value: a.owner },
                { icon: FileSignature, label: 'Contract', value: contract ? `${contract.id} · ${contract.scope}` : '—' },
              ]}
            />
          </Card>
          <Card title="History" icon={History}>
            <Timeline items={a.history.map((h, i) => ({ key: `${h.date}-${i}`, title: h.event, meta: `${fmtDate(h.date)} · ${h.by}`, tone: i === 0 ? 'ok' : 'neutral' }))} />
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ---------------- PM ---------------- */

const PM_STATUSES = ['Upcoming', 'Due', 'Overdue', 'Completed'] as const

export function PmPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState<'all' | (typeof PM_STATUSES)[number]>('all')
  const base = inProject(state.pmTasks, state.projectFilter)
  const rows = (f === 'all' ? base : base.filter((t) => t.status === f)).slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const cols = usePmColumns()
  const onTime = base.length ? Math.round((base.filter((t) => t.status !== 'Overdue').length / base.length) * 100) : 100
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Preventive maintenance')} title="Preventive maintenance" count={base.length} subtitle={`${onTime}% of the current schedule is on time.`} tag={<ProjectFilterNote state={state} />} />
      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PM_STATUSES.map((s) => (
          <Kpi key={s} label={s} value={base.filter((t) => t.status === s).length} tone={s === 'Overdue' ? 'crit' : s === 'Due' ? 'warn' : s === 'Completed' ? 'ok' : undefined} onClick={() => setF(s)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterChip active={f === 'all'} onClick={() => setF('all')} count={base.length}>
          All
        </FilterChip>
        {PM_STATUSES.map((s) => (
          <FilterChip key={s} active={f === s} onClick={() => setF(s)} count={base.filter((t) => t.status === s).length}>
            {s}
          </FilterChip>
        ))}
      </div>
      <Card bodyClassName="p-0">
        <DataTable rows={rows} rowKey={(t) => t.id} columns={cols} onRowClick={(t) => navigate(`/om/assets/${t.assetId}`)} highlight={(t) => t.status === 'Overdue'} empty={<EmptyState className="m-5" title={`No ${f === 'all' ? '' : f.toLowerCase() + ' '}PM tasks`} />} />
      </Card>
    </div>
  )
}

/* ---------------- Work orders ---------------- */

export function WorkOrdersPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState<'open' | 'breach' | 'all'>('open')
  const base = inProject(state.workOrders, state.projectFilter)
  const rows = f === 'open' ? base.filter(isOpenWo) : f === 'breach' ? base.filter(breached) : base
  const cols = useWoColumns()
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Work orders')} title="Work orders" count={base.filter(isOpenWo).length} subtitle="Corrective, preventive and inspection work with SLA clock." tag={<ProjectFilterNote state={state} />} />
      <div className="flex flex-wrap gap-2">
        <FilterChip active={f === 'open'} onClick={() => setF('open')} count={base.filter(isOpenWo).length}>
          Open
        </FilterChip>
        <FilterChip active={f === 'breach'} onClick={() => setF('breach')} count={base.filter(breached).length}>
          SLA breach
        </FilterChip>
        <FilterChip active={f === 'all'} onClick={() => setF('all')} count={base.length}>
          All
        </FilterChip>
      </div>
      <Card bodyClassName="p-0">
        <DataTable rows={rows} rowKey={(w) => w.id} columns={cols} onRowClick={(w) => navigate(`/om/assets/${w.assetId}`)} highlight={breached} empty={<EmptyState className="m-5" icon={CheckCircle2} title="No work orders" body="Nothing matches this filter." />} />
      </Card>
    </div>
  )
}

/* ---------------- SLA ---------------- */

export function SlaPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const contracts = inProject(omContracts, state.projectFilter)
  const data = contracts.map((c) => ({ name: projectName(state, c.projectId).replace(' Services', ''), sla: c.sla, id: c.id }))
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('SLA')} title="SLA compliance" count={`${slaTrend[slaTrend.length - 1].sla}%`} subtitle="Response and restoration SLA by contract. Target 95%." tag={<ProjectFilterNote state={state} />} />
      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-2">
        <Card title="SLA by contract" icon={ShieldCheck}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="id" tick={CHART.tick} />
                <YAxis tick={CHART.tick} domain={[80, 100]} unit="%" />
                <Tooltip contentStyle={CHART.tooltip} formatter={(v) => [`${v}%`, 'SLA']} />
                <ReferenceLine y={95} stroke={CHART.planned} strokeDasharray="4 4" />
                <Bar dataKey="sla" radius={[3, 3, 0, 0]}>
                  {data.map((d) => (
                    <Cell key={d.id} fill={d.sla < 90 ? CHART.crit : d.sla < 95 ? CHART.warn : CHART.ok} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Monthly trend" icon={Activity}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART.tick} />
                <YAxis tick={CHART.tick} domain={[85, 100]} unit="%" />
                <Tooltip contentStyle={CHART.tooltip} />
                <ReferenceLine y={95} stroke={CHART.planned} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="sla" name="SLA compliance" stroke={CHART.primary} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card bodyClassName="p-0">
        <DataTable
          rows={contracts}
          rowKey={(c) => c.id}
          onRowClick={() => navigate('/om/contracts')}
          empty={<EmptyState className="m-5" title="No O&M contracts for this project" />}
          columns={[
            { key: 'id', header: 'Contract', render: (c) => <span className="font-medium whitespace-nowrap">{c.id}</span> },
            { key: 's', header: 'Scope', render: (c) => c.scope, hideBelow: 'sm' },
            { key: 'sla', header: 'SLA', align: 'end', render: (c) => <span className={cx('tabular font-medium', c.sla < 90 ? 'text-crit' : c.sla < 95 ? 'text-warn' : 'text-ok')}>{c.sla}%</span> },
            { key: 'b', header: 'Breaches open', align: 'end', render: (c) => <span className="tabular">{state.workOrders.filter((w) => w.projectId === c.projectId && breached(w)).length}</span> },
            { key: 'st', header: 'Status', render: (c) => (c.sla >= 95 ? <Pill tone="ok">On target</Pill> : c.sla >= 90 ? <Pill tone="warn">Below target</Pill> : <Pill tone="crit">Penalty risk</Pill>) },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------- Contracts ---------------- */

type OmContract = (typeof omContracts)[number]

export function OmContractsPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [sel, setSel] = useState<OmContract | null>(null)
  const rows = inProject(omContracts, state.projectFilter)
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Contracts')} title="O&M contracts" count={rows.length} subtitle="Long-term operations and maintenance agreements (fictional clients)." tag={<ProjectFilterNote state={state} />} />
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(c) => c.id}
          onRowClick={setSel}
          empty={<EmptyState className="m-5" title="No O&M contracts for this project" />}
          columns={[
            { key: 'id', header: 'Contract', render: (c) => <span className="font-medium whitespace-nowrap">{c.id}</span> },
            { key: 'cl', header: 'Client', render: (c) => <span className="whitespace-nowrap">{c.client}</span>, hideBelow: 'md' },
            { key: 'sc', header: 'Scope', render: (c) => c.scope },
            { key: 'v', header: 'Value', align: 'end', render: (c) => <span className="tabular whitespace-nowrap">{sarM(c.value)}</span>, hideBelow: 'sm' },
            { key: 't', header: 'Term', render: (c) => <span className="whitespace-nowrap text-ink-2">{fmtDate(c.start)} to {fmtDate(c.end)}</span>, hideBelow: 'lg' },
            { key: 'sla', header: 'SLA', align: 'end', render: (c) => <span className="tabular">{c.sla}%</span> },
            { key: 'st', header: 'Status', render: (c) => <StatusPill status={c.status} /> },
          ]}
        />
      </Card>
      <SlideOver
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.id ?? ''}
        subtitle={sel?.scope}
        footer={
          sel && (
            <>
              <Button onClick={() => actions.toast({ title: 'Monthly service report generated', body: `${sel.id} report for September 2026 is ready in Reports (simulated).`, tone: 'success' })}>Service report</Button>
              <Button variant="primary" onClick={() => navigate(`/projects/${sel.projectId}`)}>
                Open project
              </Button>
            </>
          )
        }
      >
        {sel && (
          <div className="space-y-5">
            <KeyValue
              rows={[
                { label: 'Client', value: sel.client },
                { label: 'Project', value: projectName(state, sel.projectId) },
                { label: 'Contract value', value: sarM(sel.value) },
                { label: 'Term', value: `${fmtDate(sel.start)} to ${fmtDate(sel.end)}` },
                { label: 'SLA compliance', value: `${sel.sla}%` },
                { label: 'Status', value: <StatusPill status={sel.status} /> },
              ]}
            />
            <div>
              <h4 className="caps mb-2 text-[12px] text-ink-3">Assets in scope</h4>
              {state.assets.filter((a) => a.projectId === sel.projectId).length === 0 ? (
                <p className="text-[13px] text-ink-3">No assets registered.</p>
              ) : (
                <ul className="divide-y divide-line rounded-[8px] border border-line">
                  {state.assets
                    .filter((a) => a.projectId === sel.projectId)
                    .map((a) => (
                      <li key={a.id}>
                        <Link to={`/om/assets/${a.id}`} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-[#f9fafb]">
                          <span className="min-w-0 truncate text-[14px] text-ink">{a.name}</span>
                          <StatusPill status={a.status} />
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Open work orders" value={state.workOrders.filter((w) => w.projectId === sel.projectId && isOpenWo(w)).length} />
              <MiniStat label="PM overdue" value={state.pmTasks.filter((t) => t.projectId === sel.projectId && t.status === 'Overdue').length} />
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

/* ---------------- History ---------------- */

export function AssetHistoryPage() {
  const { state } = useStore()
  const [assetId, setAssetId] = useState('all')
  const assets = inProject(state.assets, state.projectFilter)
  const items = assets
    .filter((a) => assetId === 'all' || a.id === assetId)
    .flatMap((a) => a.history.map((h, i) => ({ ...h, a, key: `${a.id}-${i}` })))
    .sort((x, y) => y.date.localeCompare(x.date))
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Asset history')} title="Asset history" count={items.length} subtitle="Maintenance, inspection and condition events across all assets." tag={<ProjectFilterNote state={state} />} />
      <Card bodyClassName="p-4">
        <Select aria-label="Asset" className="max-w-sm" value={assetId} onChange={(e) => setAssetId(e.target.value)} options={[{ value: 'all', label: 'All assets' }, ...assets.map((a) => ({ value: a.id, label: a.name }))]} />
      </Card>
      <Card title="Timeline" icon={Clock}>
        {items.length === 0 ? (
          <EmptyState title="No history" body="No events recorded for this selection." />
        ) : (
          <Timeline
            items={items.slice(0, 60).map((h) => ({
              key: h.key,
              title: (
                <span>
                  <Link to={`/om/assets/${h.a.id}`} className="font-medium hover:text-action">
                    {h.a.tag}
                  </Link>{' '}
                  · {h.event}
                </span>
              ),
              meta: `${fmtDate(h.date)} · ${h.by} · ${h.a.location}`,
              tone: /corrective/i.test(h.event) ? 'warn' : /completed/i.test(h.event) ? 'ok' : 'neutral',
            }))}
          />
        )}
      </Card>
    </div>
  )
}
