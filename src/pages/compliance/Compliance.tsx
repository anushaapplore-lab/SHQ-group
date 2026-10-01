import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Award, BadgeCheck, Building2, CalendarDays, CircleCheck, CircleX, FileSignature, FileWarning, Shield, TriangleAlert, Umbrella, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../../store/store'
import { complianceStatus, inProject, projectName } from '../../store/selectors'
import type { ComplianceItem } from '../../data/types'
import { addDays, cx, daysUntil, fmtDate, fmtShort, parseDate } from '../../lib/format'
import { Button, Card, DataTable, DemoTag, EmptyState, Kpi, PageHeader, Pill, Segmented, StatusPill } from '../../components/ui'
import type { Column, Tone } from '../../components/ui'
import { useDocWorkflow } from '../../components/documents/useDocWorkflow'
import { ComplianceAction, ExpirySlideOver, daysTone } from '../../components/documents/ExpirySlideOver'
import type { ExpiryRef } from '../../components/documents/ExpirySlideOver'
import { daysLabel } from '../../components/documents/docShared'

const KINDS: { kind: ComplianceItem['kind']; label: string; icon: LucideIcon; to?: string }[] = [
  { kind: 'Licence', label: 'Licences', icon: Award, to: '/compliance/licences' },
  { kind: 'Permit', label: 'Permits', icon: FileSignature, to: '/compliance/permits' },
  { kind: 'Vendor Contract', label: 'Vendor Contracts', icon: Building2, to: '/compliance/contracts' },
  { kind: 'Equipment Certificate', label: 'Equipment Certificates', icon: BadgeCheck, to: '/compliance/equipment' },
  { kind: 'Warranty', label: 'Warranties', icon: Shield, to: '/compliance/warranties' },
  { kind: 'Insurance', label: 'Insurance', icon: Umbrella, to: '/compliance/contracts' },
  { kind: 'Employee Document', label: 'Employee Documents', icon: Users },
]

const sortByDays = (a: ComplianceItem, b: ComplianceItem) => daysUntil(a.expiry) - daysUntil(b.expiry)

function FilterNote() {
  const { state } = useStore()
  if (state.projectFilter === 'all') return null
  return <Pill tone="info">Filtered: {projectName(state, state.projectFilter)}</Pill>
}

function ComplianceTable({ rows, onOpen }: { rows: ComplianceItem[]; onOpen: (c: ComplianceItem) => void }) {
  const columns: Column<ComplianceItem>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (c) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-ink">{c.item}</div>
          <div className="text-[12px] text-ink-3">{c.kind}</div>
        </div>
      ),
    },
    { key: 'ref', header: 'Reference', render: (c) => <span className="whitespace-nowrap text-ink-2">{c.reference}</span> },
    { key: 'project', header: 'Project', render: (c) => <span className="text-ink-2">{c.projectId}</span>, hideBelow: 'md' },
    { key: 'expiry', header: 'Expiry', render: (c) => <span className="whitespace-nowrap text-ink-2">{fmtDate(c.expiry)}</span> },
    {
      key: 'days',
      header: 'Days remaining',
      render: (c) => {
        const d = daysUntil(c.expiry)
        return <span className={cx('tabular whitespace-nowrap font-medium', d < 0 ? 'text-crit' : d <= 30 ? 'text-warn' : 'text-ink-2')}>{d < 0 ? `${Math.abs(d)} overdue` : d}</span>
      },
      align: 'end',
    },
    { key: 'status', header: 'Status', render: (c) => <StatusPill status={complianceStatus(c)} /> },
    { key: 'owner', header: 'Owner', render: (c) => <span className="whitespace-nowrap text-ink-2">{c.owner}</span>, hideBelow: 'lg' },
    { key: 'action', header: 'Action', render: (c) => <ComplianceAction c={c} /> },
  ]
  return <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} onRowClick={onOpen} />
}

/* ---------- Dashboard ---------- */

export function ComplianceDashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const wf = useDocWorkflow()
  const [slide, setSlide] = useState<ExpiryRef | null>(null)
  const [kind, setKind] = useState<ComplianceItem['kind'] | 'all'>('all')
  const [scope, setScope] = useState<'alerts' | 'all'>('alerts')
  const items = inProject(state.compliance, state.projectFilter)
  const by = (s: ReturnType<typeof complianceStatus>) => items.filter((c) => complianceStatus(c) === s).length
  const missingDocs = inProject(state.documents, state.projectFilter).filter((d) => d.status === 'Missing' && (d.department === 'Compliance' || d.department === 'HSE'))
  const renewing = by('Renewal In Progress')

  const rows = items
    .filter((c) => (kind === 'all' || c.kind === kind) && (scope === 'all' || complianceStatus(c) !== 'Valid'))
    .sort(sortByDays)

  const weeks = Array.from({ length: 8 }, (_, w) => {
    const from = addDays('2026-10-01', w * 7)
    const inWeek = (exp: string) => {
      const d = daysUntil(exp)
      return d >= w * 7 && d < w * 7 + 7
    }
    return {
      week: `w/c ${fmtShort(from)}`,
      Compliance: items.filter((c) => complianceStatus(c) !== 'Renewal In Progress' && inWeek(c.expiry)).length,
      Documents: inProject(state.documents, state.projectFilter).filter((d) => d.expiry && d.status !== 'Missing' && inWeek(d.expiry)).length,
    }
  })

  return (
    <div>
      <PageHeader
        title="Compliance Dashboard"
        subtitle="Licences, permits, contracts, certificates, warranties, insurance and employee documents with expiry alerts."
        tag={<FilterNote />}
        actions={
          <Button icon={CalendarDays} onClick={() => navigate('/compliance/calendar')}>
            Expiry calendar
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Valid" value={by('Valid')} icon={CircleCheck} tone="ok" sub={renewing ? `+ ${renewing} renewal${renewing > 1 ? 's' : ''} in progress` : 'No action required'} onClick={() => setScope('all')} />
        <Kpi label="Expiring Soon" value={by('Expiring Soon')} icon={TriangleAlert} tone="warn" sub="Within 30 days" onClick={() => setScope('alerts')} />
        <Kpi label="Expired" value={by('Expired')} icon={CircleX} tone="crit" sub="Renewal overdue" onClick={() => setScope('alerts')} />
        <Kpi label="Missing" value={missingDocs.length} icon={FileWarning} tone={missingDocs.length ? 'crit' : 'ok'} sub="Required HSE / compliance documents not uploaded" to="/documents/missing" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {KINDS.map((k) => {
          const list = items.filter((c) => c.kind === k.kind)
          const exp = list.filter((c) => complianceStatus(c) === 'Expired').length
          const soon = list.filter((c) => complianceStatus(c) === 'Expiring Soon').length
          const active = kind === k.kind
          return (
            <button
              key={k.kind}
              type="button"
              onClick={() => setKind(active ? 'all' : k.kind)}
              className={cx('rounded-[12px] border bg-surface p-3.5 text-start transition-colors hover:border-line-strong', active ? 'border-shell' : 'border-line')}
            >
              <div className="flex items-center justify-between gap-2">
                <k.icon className="size-[18px] text-ink-2" strokeWidth={1.5} />
                <span className="tabular text-[20px] font-semibold text-ink">{list.length}</span>
              </div>
              <div className="mt-2 truncate text-[13px] font-medium text-ink">{k.label}</div>
              <div className="mt-1 flex flex-wrap gap-x-2 text-[11px]">
                <span className={soon ? 'text-warn' : 'text-ink-3'}>{soon} expiring</span>
                <span className={exp ? 'text-crit' : 'text-ink-3'}>{exp} expired</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card
          title="Expiry alerts"
          icon={TriangleAlert}
          subtitle={kind === 'all' ? 'Sorted by days remaining' : `${kind} · sorted by days remaining`}
          actions={
            <Segmented
              value={scope}
              onChange={setScope}
              options={[
                { id: 'alerts', label: 'Alerts' },
                { id: 'all', label: 'All items' },
              ]}
            />
          }
          bodyClassName="p-0"
        >
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CircleCheck} title="No expiry alerts" body="Everything in scope is valid for more than 30 days." />
            </div>
          ) : (
            <ComplianceTable rows={rows} onOpen={(c) => setSlide({ kind: 'compliance', id: c.id })} />
          )}
        </Card>
        <Card title="Expiries per week" icon={CalendarDays} subtitle="Next 8 weeks · compliance items and documents">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#7b7d81' }} tickLine={false} axisLine={{ stroke: '#e8eaee' }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#7b7d81' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 }} cursor={{ fill: '#f6f6f6' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                <Bar dataKey="Compliance" stackId="a" fill="#1d4ed8" maxBarSize={28} />
                <Bar dataKey="Documents" stackId="a" fill="#94a3b8" maxBarSize={28} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[12px] text-ink-3">Renewals in progress are excluded. Rule CMP-01 raises an alert 30 days before expiry.</p>
        </Card>
      </div>
      <ExpirySlideOver item={slide} onClose={() => setSlide(null)} wf={wf} />
      {wf.modals}
    </div>
  )
}

/* ---------- List ---------- */

export function ComplianceList({ title, kinds }: { title: string; kinds: ComplianceItem['kind'][] }) {
  const { state } = useStore()
  const wf = useDocWorkflow()
  const [slide, setSlide] = useState<ExpiryRef | null>(null)
  const [status, setStatus] = useState<'all' | 'due'>('all')
  const items = inProject(state.compliance, state.projectFilter).filter((c) => kinds.includes(c.kind))
  const rows = items.filter((c) => status === 'all' || complianceStatus(c) !== 'Valid').sort(sortByDays)
  const due = items.filter((c) => complianceStatus(c) !== 'Valid').length
  return (
    <div>
      <PageHeader
        title={title}
        count={items.length}
        subtitle={`${kinds.join(', ')} tracked by the expiry engine`}
        crumbs={[{ label: 'Compliance', to: '/compliance' }, { label: title }]}
        tag={<FilterNote />}
        actions={
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { id: 'all', label: `All (${items.length})` },
              { id: 'due', label: `Needs action (${due})` },
            ]}
          />
        }
      />
      <Card bodyClassName="p-0">
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={items.length === 0 ? `No ${title.toLowerCase()} in scope` : 'Nothing needs action'}
              body={items.length === 0 ? 'Change the project filter to see items from other projects.' : 'All items are valid for more than 30 days.'}
            />
          </div>
        ) : (
          <ComplianceTable rows={rows} onOpen={(c) => setSlide({ kind: 'compliance', id: c.id })} />
        )}
      </Card>
      <ExpirySlideOver item={slide} onClose={() => setSlide(null)} wf={wf} />
      {wf.modals}
    </div>
  )
}

/* ---------- Calendar ---------- */

interface CalItem {
  ref: ExpiryRef
  title: string
  sub: string
  expiry: string
  days: number
  tone: Tone
  status: string
}

const MONTHS = [
  { id: '2026-10', label: 'October 2026' },
  { id: '2026-11', label: 'November 2026' },
]
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const chipCls: Record<Tone, string> = {
  crit: 'bg-crit-bg text-crit border-[#f3c5c5]',
  warn: 'bg-warn-bg text-warn border-[#f5dcaa]',
  ok: 'bg-ok-bg text-ok border-transparent',
  info: 'bg-info-bg text-info border-transparent',
  neutral: 'bg-muted text-ink-2 border-transparent',
  brand: 'bg-muted text-ink-2 border-transparent',
}

function CalList({ items, onOpen }: { items: CalItem[]; onOpen: (i: CalItem) => void }) {
  if (items.length === 0) return <EmptyState icon={CalendarDays} title="No expiries this month" body="Nothing in scope expires in the selected month." />
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => (
        <li key={`${i.ref.kind}-${i.ref.id}`}>
          <button type="button" onClick={() => onOpen(i)} className="flex w-full items-center gap-3 py-3 text-start hover:bg-[#f9fafb]">
            <div className="w-12 shrink-0 text-center">
              <div className="tabular text-[18px] leading-none font-semibold text-ink">{parseDate(i.expiry).getUTCDate()}</div>
              <div className="caps mt-0.5 text-[10px] text-ink-3">{fmtShort(i.expiry).split(' ')[1]}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-ink">{i.title}</div>
              <div className="truncate text-[12px] text-ink-3">{i.sub}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusPill status={i.status} />
              <span className={cx('text-[11px]', i.days < 0 ? 'text-crit' : i.days <= 30 ? 'text-warn' : 'text-ink-3')}>{daysLabel(i.days)}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function ExpiryCalendar() {
  const { state } = useStore()
  const wf = useDocWorkflow()
  const [month, setMonth] = useState('2026-10')
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [slide, setSlide] = useState<ExpiryRef | null>(null)

  const all: CalItem[] = [
    ...inProject(state.compliance, state.projectFilter).map((c): CalItem => {
      const st = complianceStatus(c)
      const d = daysUntil(c.expiry)
      return { ref: { kind: 'compliance', id: c.id }, title: c.item, sub: `${c.kind} · ${c.reference} · ${c.projectId}`, expiry: c.expiry, days: d, tone: st === 'Renewal In Progress' ? 'info' : daysTone(d) === 'ok' ? 'neutral' : daysTone(d), status: st }
    }),
    ...inProject(state.documents, state.projectFilter)
      .filter((d) => d.expiry && d.status !== 'Missing')
      .map((doc): CalItem => {
        const d = daysUntil(doc.expiry as string)
        return { ref: { kind: 'doc', id: doc.id }, title: doc.title, sub: `${doc.docType} · ${doc.id} · ${doc.projectId}`, expiry: doc.expiry as string, days: d, tone: daysTone(d) === 'ok' ? 'neutral' : daysTone(d), status: doc.status }
      }),
  ].sort((a, b) => a.expiry.localeCompare(b.expiry))

  const monthItems = all.filter((i) => i.expiry.startsWith(month))
  const overdue = all.filter((i) => i.days < 0 && i.status !== 'Renewal In Progress' && i.expiry < `${month}-01`)

  const first = parseDate(`${month}-01`)
  const lead = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  const cells: (string | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)]
  while (cells.length % 7) cells.push(null)

  const open = (i: CalItem) => setSlide(i.ref)

  return (
    <div>
      <PageHeader
        title="Expiry Calendar"
        count={`${monthItems.length} this month`}
        subtitle="Compliance items and controlled documents by expiry date."
        crumbs={[{ label: 'Compliance', to: '/compliance' }, { label: 'Expiry calendar' }]}
        tag={<FilterNote />}
        actions={
          <>
            <Segmented value={month} onChange={setMonth} options={MONTHS.map((m) => ({ id: m.id, label: m.label.split(' ')[0] }))} />
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: 'calendar', label: 'Calendar' },
                { id: 'list', label: 'List' },
              ]}
            />
          </>
        }
      />

      {overdue.length > 0 && (
        <div className="mb-4 rounded-[12px] border border-[#f3c5c5] bg-crit-bg px-4 py-3">
          <div className="text-[13px] font-medium text-crit">Overdue from earlier months ({overdue.length})</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {overdue.map((i) => (
              <button key={`${i.ref.kind}-${i.ref.id}`} type="button" onClick={() => open(i)} className="rounded-full border border-[#f3c5c5] bg-surface px-2.5 py-1 text-[12px] text-crit hover:bg-crit-bg">
                {i.title} · {fmtShort(i.expiry)}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card
        title={MONTHS.find((m) => m.id === month)?.label}
        icon={CalendarDays}
        actions={
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-ink-2">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-crit" />Expired</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#d97706]" />≤ 30 days</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-action" />Renewal in progress</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ink-3" />Later</span>
          </div>
        }
      >
        {view === 'list' ? (
          <CalList items={monthItems} onOpen={open} />
        ) : (
          <>
            <div className="md:hidden">
              <CalList items={monthItems} onOpen={open} />
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-7 border-s border-t border-line">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="caps border-e border-b border-line bg-muted px-2 py-1.5 text-[11px] text-ink-3">
                    {w}
                  </div>
                ))}
                {cells.map((day, idx) => {
                  const chips = day ? monthItems.filter((i) => i.expiry === day) : []
                  const isToday = day === '2026-10-01'
                  return (
                    <div key={idx} className={cx('min-h-[104px] min-w-0 border-e border-b border-line p-1.5', !day && 'bg-[#fbfbfc]')}>
                      {day && (
                        <>
                          <div className={cx('mb-1 inline-flex size-6 items-center justify-center rounded-full text-[12px]', isToday ? 'bg-shell font-semibold text-white' : 'text-ink-2')}>
                            {parseDate(day).getUTCDate()}
                          </div>
                          <div className="space-y-1">
                            {chips.slice(0, 3).map((c) => (
                              <button
                                key={`${c.ref.kind}-${c.ref.id}`}
                                type="button"
                                onClick={() => open(c)}
                                title={`${c.title} · ${c.status}`}
                                className={cx('block w-full truncate rounded-[4px] border px-1.5 py-0.5 text-start text-[11px] font-medium hover:brightness-95', chipCls[c.tone])}
                              >
                                {c.title}
                              </button>
                            ))}
                            {chips.length > 3 && (
                              <button type="button" onClick={() => setView('list')} className="text-[11px] text-ink-3 hover:underline">
                                +{chips.length - 3} more
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </Card>
      <div className="mt-3">
        <DemoTag>Illustrative Data</DemoTag>
      </div>
      <ExpirySlideOver item={slide} onClose={() => setSlide(null)} wf={wf} />
      {wf.modals}
    </div>
  )
}
