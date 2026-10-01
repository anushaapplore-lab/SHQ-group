import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  PackageSearch,
  PiggyBank,
  Sparkles,
  Timer,
  Truck,
} from 'lucide-react'
import type { PurchaseOrder } from '../../data/types'
import { deliveries, vendorIssues } from '../../data/procurement'
import { daysBetween, fmtDate, num, sar } from '../../lib/format'
import { inProject, poExposure, poVariance, projectName } from '../../store/selectors'
import { roleProfile } from '../../store/roles'
import { useStore } from '../../store/store'
import type { Column } from '../../components/ui'
import { Button, Card, DataTable, DemoTag, EmptyState, FilterChip, Input, Kpi, LevelPill, LinkText, PageHeader, Pill, RagBadge, Select, SlideOver, StatusPill } from '../../components/ui'
import { CHART, DELAY_ACTIONS, DeliveryText, ProjectFilterNote, SUGGESTED_ACTIONS, VarianceText, sarCompact, vendorName } from '../../components/procurement/common'
import { PoDetailView } from '../../components/procurement/PoDetailView'
import type { AppState } from '../../store/seed'

const crumbs = (label: string) => [{ label: 'Procurement', to: '/procurement' }, { label }]

function usePoColumns(state: AppState, withProject = false): Column<PurchaseOrder>[] {
  const cols: Column<PurchaseOrder>[] = [
    { key: 'id', header: 'PO', render: (p) => <span className="font-medium whitespace-nowrap">{p.id}</span> },
    { key: 'vendor', header: 'Vendor', render: (p) => <span className="whitespace-nowrap">{vendorName(state, p.vendorId)}</span> },
    { key: 'material', header: 'Material', render: (p) => <span className="block max-w-[220px] truncate" title={p.material}>{p.material}</span>, hideBelow: 'sm' },
  ]
  if (withProject) cols.push({ key: 'project', header: 'Project', render: (p) => <span className="whitespace-nowrap text-ink-2">{state.projects.find((x) => x.id === p.projectId)?.shortName ?? p.projectId}</span>, hideBelow: 'md' })
  cols.push(
    { key: 'value', header: 'PO Value', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sarCompact(p.value)}</span> },
    { key: 'orig', header: 'Original Unit Price', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sar(p.originalUnitPrice)}</span>, hideBelow: 'lg' },
    { key: 'cur', header: 'New Vendor Price', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sar(p.currentUnitPrice)}</span>, hideBelow: 'lg' },
    { key: 'var', header: 'Variance', align: 'end', render: (p) => <VarianceText po={p} /> },
    { key: 'del', header: 'Delivery', render: (p) => <span className="whitespace-nowrap"><DeliveryText daysLate={p.daysLate} status={p.status} /></span>, hideBelow: 'sm' },
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={p.status} /> },
  )
  return cols
}

/* ---------------- Dashboard ---------------- */

export function ProcurementDashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const pos = inProject(state.pos, state.projectFilter)
  const open = pos.filter((p) => p.status !== 'Delivered')
  const delayed = pos.filter((p) => p.daysLate > 0 && p.status !== 'Delivered')
  const variances = pos.filter((p) => poVariance(p) > 5)
  const critical = pos.filter((p) => p.critical && p.status !== 'Delivered')
  const issuesOpen = inProject(vendorIssues, state.projectFilter).filter((i) => i.status !== 'Resolved')
  const prAlerts = state.alerts.filter((a) => a.rule === 'PR-01' && a.status === 'Open' && (state.projectFilter === 'all' || a.projectId === state.projectFilter))
  const columns = usePoColumns(state)
  const sorted = [...pos].sort((a, b) => Number(b.id === 'PO-450021') - Number(a.id === 'PO-450021') || poVariance(b) + b.daysLate / 3 - (poVariance(a) + a.daysLate / 3))
  const greet = state.role === 'Procurement Manager' ? `Good morning, ${roleProfile(state.role).firstName}. ` : ''
  const exposure = variances.reduce((a, p) => a + poExposure(p), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement"
        count={`${open.length} open POs`}
        subtitle={`${greet}${prAlerts.length} price alert${prAlerts.length === 1 ? '' : 's'} and ${delayed.length} delayed deliveries need attention.`}
        tag={<ProjectFilterNote state={state} />}
        actions={
          <>
            <Button icon={Sparkles} onClick={() => navigate('/procurement/recommendations')}>
              Recommendations
            </Button>
            <Button variant="primary" icon={ClipboardList} onClick={() => navigate('/procurement/pos')}>
              All POs
            </Button>
          </>
        }
      />

      <div className="grid [&>*]:min-w-0 gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Open POs" value={open.length} sub={sarCompact(open.reduce((a, p) => a + p.value, 0)) + ' committed'} icon={ClipboardList} to="/procurement/pos" />
        <Kpi label="Delayed Deliveries" value={delayed.length} tone={delayed.length ? 'warn' : 'ok'} sub={`Max ${Math.max(0, ...delayed.map((p) => p.daysLate))} days late`} icon={Truck} to="/procurement/deliveries" />
        <Kpi label="Price Variances" value={variances.length} tone={variances.length ? 'crit' : 'ok'} sub={`${sarCompact(exposure)} exposure (> 5%)`} icon={BadgePercent} to="/procurement/variance" />
        <Kpi label="Critical Materials" value={critical.length} tone="warn" sub="Long-lead or schedule-critical" icon={PackageSearch} to="/procurement/pos" />
        <Kpi label="Vendor Issues" value={issuesOpen.length} tone={issuesOpen.length ? 'warn' : 'ok'} sub="Commercial, delivery, quality" icon={FileWarning} to="/procurement/issues" />
        <Kpi label="Savings Opportunities" value="SAR 640K" sub={<DemoTag>Illustrative Data</DemoTag>} icon={PiggyBank} to="/procurement/recommendations" />
      </div>

      {prAlerts.length > 0 && (
        <section className="rounded-[12px] border border-[#f3c5c5] bg-crit-bg/60">
          {prAlerts.map((a) => (
            <Link key={a.id} to={a.link ?? `/procurement/pos/${a.sourceId}`} className="flex flex-wrap items-center gap-3 border-b border-[#f3c5c5] px-5 py-3.5 last:border-b-0 hover:bg-crit-bg">
              <AlertTriangle className="size-[18px] shrink-0 text-crit" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="caps text-[11px] text-crit">Automated alert · {a.source}</span>
                  <LevelPill level={a.level} />
                </div>
                <p className="mt-0.5 text-[14px] font-medium text-ink">{a.title.replace(/^(PO-\d+) vendor price increased ([\d.]+)% on active PO/, 'Vendor price increased $2% on $1 while PO remains active')}</p>
                <p className="text-[13px] text-ink-2">{a.impact} · {a.recommendation}</p>
              </div>
              <span className="flex items-center gap-1 text-[13px] font-medium text-action">
                Open PO <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={1.75} />
              </span>
            </Link>
          ))}
        </section>
      )}

      <Card title="Purchase orders" icon={ClipboardList} subtitle="Sorted by commercial and delivery risk" actions={<Button size="sm" iconRight={ArrowRight} onClick={() => navigate('/procurement/pos')}>View all</Button>} bodyClassName="p-0">
        <DataTable rows={sorted.slice(0, 8)} rowKey={(p) => p.id} columns={columns} onRowClick={(p) => navigate(`/procurement/pos/${p.id}`)} highlight={(p) => poVariance(p) > 5} empty={<EmptyState className="m-5" title="No purchase orders" body="No POs for the selected project." />} />
      </Card>

      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-2">
        <Card title="Vendor performance" icon={CheckCircle2} actions={<Button size="sm" onClick={() => navigate('/procurement/vendors')}>Scorecards</Button>} bodyClassName="divide-y divide-line">
          {state.vendors.map((v) => (
            <Link key={v.id} to={`/procurement/vendors/${v.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f9fafb]">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-ink">{v.name}</div>
                <div className="truncate text-[12px] text-ink-3">
                  Delivery {v.delivery}% · Quality {v.quality}% · Price stability {v.priceStability}%
                </div>
              </div>
              <RagBadge rag={v.rating} />
            </Link>
          ))}
        </Card>
        <Card title="Deliveries at risk" icon={Truck} actions={<Button size="sm" onClick={() => navigate('/procurement/deliveries')}>Tracking</Button>} bodyClassName="divide-y divide-line">
          {inProject(deliveries, state.projectFilter)
            .filter((d) => d.status !== 'Delivered')
            .map((d) => (
              <Link key={d.id} to={`/procurement/pos/${d.po}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f9fafb]">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-ink">
                    {d.po} · {d.items}
                  </div>
                  <div className="truncate text-[12px] text-ink-3">
                    ETA {fmtDate(d.eta)} · {d.location} · slip {Math.max(0, daysBetween(d.original, d.eta))} d
                  </div>
                </div>
                <StatusPill status={d.status} />
              </Link>
            ))}
        </Card>
      </div>
    </div>
  )
}

/* ---------------- PO list ---------------- */

export function PoList() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const [vendor, setVendor] = useState('all')
  const [project, setProject] = useState('all')
  const [varOnly, setVarOnly] = useState(false)
  const [lateOnly, setLateOnly] = useState(false)
  const [q, setQ] = useState('')
  const base = inProject(state.pos, state.projectFilter)
  const statuses = Array.from(new Set(state.pos.map((p) => p.status)))
  const projects = Array.from(new Set(state.pos.map((p) => p.projectId)))
  const rows = base.filter(
    (p) =>
      (status === 'all' || p.status === status) &&
      (vendor === 'all' || p.vendorId === vendor) &&
      (project === 'all' || p.projectId === project) &&
      (!varOnly || poVariance(p) > 5) &&
      (!lateOnly || p.daysLate > 0) &&
      (!q || `${p.id} ${p.material}`.toLowerCase().includes(q.toLowerCase())),
  )
  const columns = usePoColumns(state, true)
  const reset = () => {
    setStatus('all')
    setVendor('all')
    setProject('all')
    setVarOnly(false)
    setLateOnly(false)
    setQ('')
  }
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Purchase orders')} title="Purchase orders" count={rows.length} subtitle="Active POs with live price variance against the PO rate." tag={<ProjectFilterNote state={state} />} />
      <Card bodyClassName="p-4">
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Search PO or material" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'all', label: 'All statuses' }, ...statuses]} />
          <Select aria-label="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} options={[{ value: 'all', label: 'All vendors' }, ...state.vendors.map((v) => ({ value: v.id, label: v.name }))]} />
          <Select aria-label="Project" value={project} onChange={(e) => setProject(e.target.value)} options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p, label: projectName(state, p) }))]} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterChip active={varOnly} onClick={() => setVarOnly(!varOnly)} count={base.filter((p) => poVariance(p) > 5).length}>
            Variance &gt; 5% only
          </FilterChip>
          <FilterChip active={lateOnly} onClick={() => setLateOnly(!lateOnly)} count={base.filter((p) => p.daysLate > 0).length}>
            Late only
          </FilterChip>
          <Button size="sm" variant="ghost" onClick={reset}>
            Clear filters
          </Button>
        </div>
      </Card>
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(p) => p.id}
          columns={columns}
          onRowClick={(p) => navigate(`/procurement/pos/${p.id}`)}
          highlight={(p) => poVariance(p) > 5}
          empty={<EmptyState className="m-5" title="No purchase orders match" body="Adjust or clear the filters." action={<Button onClick={reset}>Clear filters</Button>} />}
        />
      </Card>
    </div>
  )
}

/* ---------------- PO detail ---------------- */

export function PoDetail() {
  return <PoDetailView />
}

/* ---------------- Deliveries ---------------- */

const TRACK_STEPS = ['PO placed', 'Manufacturing', 'Inspection / FAT', 'Dispatched', 'In transit', 'Customs clearance', 'Delivered to site']
const stepIndex = (status: string) =>
  ({ 'Factory Test': 2, 'Awaiting Dispatch': 2, 'In Transit': 4, Customs: 5, Delivered: 6 } as Record<string, number>)[status] ?? 1

type Delivery = (typeof deliveries)[number]

export function DeliveriesPage() {
  const { state, actions } = useStore()
  const [sel, setSel] = useState<Delivery | null>(null)
  const rows = inProject(deliveries, state.projectFilter)
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Deliveries')} title="Deliveries" count={rows.length} subtitle="Expediting view: current ETA against the contractual delivery date." tag={<><ProjectFilterNote state={state} /><DemoTag>Simulated ERP Sync</DemoTag></>} />
      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-3">
        <Kpi label="In progress" value={rows.filter((d) => d.status !== 'Delivered').length} icon={Truck} />
        <Kpi label="Slipped" value={rows.filter((d) => daysBetween(d.original, d.eta) > 0).length} tone="warn" icon={Timer} />
        <Kpi label="Average slip" value={`${(rows.reduce((a, d) => a + Math.max(0, daysBetween(d.original, d.eta)), 0) / Math.max(1, rows.length)).toFixed(1)} d`} icon={Timer} />
      </div>
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={setSel}
          empty={<EmptyState className="m-5" title="No deliveries" body="No shipments for the selected project." />}
          columns={[
            { key: 'id', header: 'Delivery', render: (d) => <span className="font-medium">{d.id}</span> },
            { key: 'po', header: 'PO', render: (d) => <LinkText to={`/procurement/pos/${d.po}`}>{d.po}</LinkText> },
            { key: 'items', header: 'Items', render: (d) => <span className="block max-w-[220px] truncate">{d.items}</span>, hideBelow: 'sm' },
            { key: 'orig', header: 'Original', render: (d) => <span className="whitespace-nowrap">{fmtDate(d.original)}</span>, hideBelow: 'md' },
            { key: 'eta', header: 'ETA', render: (d) => <span className="whitespace-nowrap">{fmtDate(d.eta)}</span> },
            {
              key: 'slip',
              header: 'Slip',
              align: 'end',
              render: (d) => {
                const s = daysBetween(d.original, d.eta)
                return <span className={s > 7 ? 'tabular font-medium text-crit' : s > 0 ? 'tabular font-medium text-warn' : 'tabular text-ok'}>{s > 0 ? `+${s} d` : '0 d'}</span>
              },
            },
            { key: 'loc', header: 'Location', render: (d) => <span className="whitespace-nowrap text-ink-2">{d.location}</span>, hideBelow: 'lg' },
            { key: 'st', header: 'Status', render: (d) => <StatusPill status={d.status} /> },
          ]}
        />
      </Card>
      <SlideOver
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel ? `${sel.id} tracking` : ''}
        subtitle={sel ? `${sel.po} · ${sel.items}` : ''}
        footer={
          sel && (
            <>
              <Button onClick={() => actions.toast({ title: 'Expediting request sent', body: `${vendorName(state, state.pos.find((p) => p.id === sel.po)?.vendorId ?? '')} asked to confirm ${sel.id} recovery plan.`, tone: 'success' })}>Expedite</Button>
              <Link to={`/procurement/pos/${sel.po}`}>
                <Button variant="primary" iconRight={ArrowRight}>Open PO</Button>
              </Link>
            </>
          )
        }
      >
        {sel && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[8px] bg-muted px-3 py-2">
                <div className="text-[12px] text-ink-2">Original</div>
                <div className="text-[14px] font-semibold text-ink">{fmtDate(sel.original)}</div>
              </div>
              <div className="rounded-[8px] bg-muted px-3 py-2">
                <div className="text-[12px] text-ink-2">Current ETA</div>
                <div className="text-[14px] font-semibold text-ink">{fmtDate(sel.eta)}</div>
              </div>
            </div>
            <p className="text-[13px] text-ink-2">
              Last known location: <span className="text-ink">{sel.location}</span> · Incoterms DAP site · {projectName(state, sel.projectId)}
            </p>
            <ol className="relative space-y-4 border-s border-line ps-5">
              {TRACK_STEPS.map((s, i) => {
                const idx = stepIndex(sel.status)
                const st = i < idx ? 'done' : i === idx ? 'current' : 'future'
                return (
                  <li key={s} className="relative">
                    <span className={`absolute -start-[25px] top-1 size-2.5 rounded-full ring-4 ring-surface ${st === 'done' ? 'bg-ok' : st === 'current' ? 'bg-action' : 'bg-line-strong'}`} />
                    <div className={st === 'future' ? 'text-[14px] text-ink-3' : 'text-[14px] font-medium text-ink'}>{s}</div>
                    <div className="text-[12px] text-ink-3">{st === 'done' ? 'Completed' : st === 'current' ? sel.status : 'Pending'}</div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

/* ---------------- Variance ---------------- */

export function VariancePage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const pos = inProject(state.pos, state.projectFilter)
  const data = pos.map((p) => ({ id: p.id, v: Math.round(poVariance(p) * 10) / 10 })).sort((a, b) => b.v - a.v)
  const rows = [...pos].sort((a, b) => poVariance(b) - poVariance(a))
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Price variance')} title="Price variance" count={`${pos.filter((p) => poVariance(p) > 5).length} above threshold`} subtitle="Current vendor price against the PO unit rate. Rule PR-01 alerts above 5%." tag={<ProjectFilterNote state={state} />} />
      <Card title="Variance by PO" icon={BadgePercent} subtitle="Threshold line: rule PR-01 (5%)">
        {data.length === 0 ? (
          <EmptyState title="No purchase orders" />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="id" tick={CHART.tick} tickFormatter={(x: string) => x.replace('PO-', '')} interval={0} angle={-35} textAnchor="end" height={50} />
                <YAxis tick={CHART.tick} unit="%" />
                <Tooltip contentStyle={CHART.tooltip} formatter={(x) => [`${x}%`, 'Variance']} />
                <ReferenceLine y={5} stroke={CHART.crit} strokeDasharray="4 4" label={{ value: 'PR-01 5%', position: 'insideTopRight', fontSize: 11, fill: CHART.crit }} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]} onClick={(d) => { const id = (d as { id?: string }).id; if (id) navigate(`/procurement/pos/${id}`) }} cursor="pointer">
                  {data.map((d) => (
                    <Cell key={d.id} fill={d.v > 5 ? CHART.crit : d.v > 0 ? CHART.warn : CHART.ok} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <Card bodyClassName="p-0">
        <DataTable
          rows={rows}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/procurement/pos/${p.id}`)}
          highlight={(p) => poVariance(p) > 5}
          columns={[
            { key: 'id', header: 'PO', render: (p) => <span className="font-medium">{p.id}</span> },
            { key: 'v', header: 'Vendor', render: (p) => <span className="whitespace-nowrap">{vendorName(state, p.vendorId)}</span>, hideBelow: 'sm' },
            { key: 'o', header: 'PO rate', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sar(p.originalUnitPrice)}</span>, hideBelow: 'md' },
            { key: 'c', header: 'Vendor price', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sar(p.currentUnitPrice)}</span>, hideBelow: 'md' },
            { key: 'var', header: 'Variance', align: 'end', render: (p) => <VarianceText po={p} /> },
            { key: 'exp', header: 'Exposure', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sar(poExposure(p))}</span> },
            { key: 'r', header: 'Rule', render: (p) => (poVariance(p) > 5 ? <Pill tone="crit">PR-01 fired</Pill> : <Pill tone="ok">Within tolerance</Pill>) },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------- Vendor issues ---------------- */

export function VendorIssuesPage() {
  const { state, actions } = useStore()
  const [resolved, setResolved] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const all = inProject(vendorIssues, state.projectFilter).map((i) => ({ ...i, status: resolved[i.id] ? 'Resolved' : i.status }))
  const rows = filter === 'open' ? all.filter((i) => i.status !== 'Resolved') : all
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Vendor issues')} title="Vendor issues" count={all.filter((i) => i.status !== 'Resolved').length} subtitle="Commercial, delivery and quality issues raised against vendors." tag={<ProjectFilterNote state={state} />} />
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'open'} onClick={() => setFilter('open')} count={all.filter((i) => i.status !== 'Resolved').length}>
          Open
        </FilterChip>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} count={all.length}>
          All
        </FilterChip>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No open vendor issues" body="All issues for this selection are resolved." />
      ) : (
        <div className="grid [&>*]:min-w-0 gap-4 lg:grid-cols-2">
          {rows.map((i) => (
            <Card key={i.id} bodyClassName="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] text-ink-3">
                    {i.id} · {i.type} · raised {fmtDate(i.raised)}
                  </div>
                  <p className="mt-1 text-[15px] font-medium text-ink">{i.issue}</p>
                  <p className="mt-1 text-[13px] text-ink-2">
                    <LinkText to={`/procurement/vendors/${i.vendorId}`}>{vendorName(state, i.vendorId)}</LinkText> · {projectName(state, i.projectId)}
                  </p>
                </div>
                <StatusPill status={i.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {i.status !== 'Resolved' && (
                  <Button
                    size="sm"
                    variant="success"
                    icon={CheckCircle2}
                    onClick={() => {
                      setResolved((r) => ({ ...r, [i.id]: true }))
                      actions.toast({ title: `${i.id} resolved`, body: 'Vendor scorecard will reflect the closure.', tone: 'success' })
                    }}
                  >
                    Resolve
                  </Button>
                )}
                {i.issue.match(/PO-\d+/) && (
                  <Link to={`/procurement/pos/${i.issue.match(/PO-\d+/)?.[0]}`}>
                    <Button size="sm">Open PO</Button>
                  </Link>
                )}
                {i.issue.match(/NCR-\d+/) && (
                  <Link to={`/quality/ncrs/${i.issue.match(/NCR-\d+/)?.[0]}`}>
                    <Button size="sm">Open NCR</Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Recommendations ---------------- */

export function RecommendationsPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const recs = useMemo(
    () =>
      inProject(state.pos, state.projectFilter)
        .filter((p) => poVariance(p) > 5 || p.daysLate > 5)
        .sort((a, b) => poVariance(b) + b.daysLate - (poVariance(a) + a.daysLate)),
    [state.pos, state.projectFilter],
  )
  return (
    <div className="space-y-6">
      <PageHeader crumbs={crumbs('Recommendations')} title="Recommendations" count={recs.length} subtitle="Rule-based suggestions for POs with price variance above 5% or delivery more than 5 days late." tag={<><ProjectFilterNote state={state} /><DemoTag>Demo Recommendation</DemoTag></>} />
      {recs.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No active recommendations" body="All POs are within price tolerance and delivery thresholds." />
      ) : (
        <div className="grid [&>*]:min-w-0 gap-4 lg:grid-cols-2">
          {recs.map((p) => {
            const v = poVariance(p)
            const price = v > 5
            const list = price ? SUGGESTED_ACTIONS : DELAY_ACTIONS
            return (
              <Card key={p.id} bodyClassName="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink-3">
                      {p.id} · {vendorName(state, p.vendorId)}
                    </div>
                    <p className="mt-1 text-[15px] font-semibold text-ink">
                      {price ? `Vendor price increased ${v.toFixed(1)}% while PO remains active.` : `Delivery ${p.daysLate} days late on ${p.critical ? 'critical' : 'non-critical'} material.`}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-2">
                      {p.material} · {projectName(state, p.projectId)}
                      {price && p.daysLate > 0 ? ` · also ${p.daysLate} days late` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.escalated && <Pill tone="crit">Escalated</Pill>}
                    {p.recommendationDismissed && <Pill>Dismissed</Pill>}
                    {price ? <Pill tone="crit">PR-01</Pill> : <Pill tone="warn">PR-02</Pill>}
                  </div>
                </div>
                <ol className="mt-3 space-y-1.5">
                  {list.map((a, i) => (
                    <li key={a} className="flex gap-2 text-[13px] text-ink">
                      <span className="tabular w-4 shrink-0 text-ink-3">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] text-ink-3">Recommendation only: management approval required.</span>
                  <Button size="sm" variant="primary" iconRight={ArrowRight} onClick={() => navigate(`/procurement/pos/${p.id}`)}>
                    Open PO
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <p className="text-[12px] text-ink-3">
        {num(recs.length)} recommendations derived from {state.pos.length} POs.
      </p>
    </div>
  )
}
