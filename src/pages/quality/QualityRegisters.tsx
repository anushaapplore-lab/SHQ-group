import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, CheckCircle2, ClipboardList, FileSearch, GitBranch, ListChecks, Package, Ruler, Send } from 'lucide-react'
import { ProjectFilterNote, useProjectShort } from '../../components/quality/shared'
import { Button, Card, DataTable, DemoTag, EmptyState, FilterChip, KeyValue, LinkText, PageHeader, Pill, ProgressBar, SlideOver, StatusPill, Textarea } from '../../components/ui'
import { calibration, inspectionPlans, mtrs, punchCounts, punchItems, rfis } from '../../data/quality'
import { cx, daysUntil, fmtDate, fmtShort } from '../../lib/format'
import { inProject, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'

const QA_CRUMB = { label: 'QA/QC', to: '/quality' }

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone?: 'ok' | 'warn' | 'crit' }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface px-4 py-3">
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className={cx('tabular mt-1 text-[20px] font-semibold', tone === 'crit' ? 'text-crit' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-ink')}>{value}</div>
    </div>
  )
}

/* ---------------------------------------------------------------- CAPA */

export function CapaList() {
  const { state } = useStore()
  const navigate = useNavigate()
  const short = useProjectShort()
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const base = inProject(state.capas, state.projectFilter)
  const rows = base.filter((c) => filter === 'all' || c.status !== 'Closed')
  const overdue = base.filter((c) => c.status !== 'Closed' && (c.status === 'Overdue' || daysUntil(c.dueDate) < 0))

  return (
    <div>
      <PageHeader title="CAPA register" count={rows.length} subtitle="Corrective and preventive actions raised from NCRs. Each CAPA is approved by the QA/QC Manager and verified before NCR closure." crumbs={[QA_CRUMB, { label: 'CAPA' }]} />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Open CAPA" value={base.filter((c) => c.status !== 'Closed').length} />
        <MiniStat label="Overdue" value={overdue.length} tone={overdue.length ? 'crit' : undefined} />
        <MiniStat label="Due in 7 days" value={base.filter((c) => c.status !== 'Closed' && daysUntil(c.dueDate) >= 0 && daysUntil(c.dueDate) <= 7).length} tone="warn" />
        <MiniStat label="Avg progress" value={`${base.length ? Math.round(base.reduce((a, c) => a + c.progress, 0) / base.length) : 0}%`} />
      </div>
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>
            Open
          </FilterChip>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterChip>
        </div>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/quality/ncrs/${r.ncrId}`)}
          highlight={(r) => r.status === 'Overdue' || (r.status !== 'Closed' && daysUntil(r.dueDate) < 0)}
          empty={
            <div className="p-5">
              <EmptyState icon={GitBranch} title="No CAPA records" body="CAPA records are created when an NCR reaches CAPA Submitted." />
            </div>
          }
          columns={[
            { key: 'id', header: 'CAPA', render: (r) => <span className="font-medium whitespace-nowrap">{r.id}</span> },
            { key: 'ncr', header: 'NCR', render: (r) => <LinkText to={`/quality/ncrs/${r.ncrId}`}>{r.ncrId}</LinkText> },
            { key: 'p', header: 'Project', render: (r) => <span className="whitespace-nowrap">{short(r.projectId)}</span>, hideBelow: 'sm' },
            { key: 'rc', header: 'Root cause', render: (r) => <span className="line-clamp-2 min-w-[200px] text-ink-2">{r.rootCause}</span>, hideBelow: 'md' },
            { key: 'o', header: 'Owner', render: (r) => <span className="whitespace-nowrap">{r.owner}</span>, hideBelow: 'lg' },
            { key: 'due', header: 'Due', render: (r) => <span className={cx('whitespace-nowrap', r.status !== 'Closed' && daysUntil(r.dueDate) < 0 ? 'font-medium text-crit' : 'text-ink-2')}>{fmtShort(r.dueDate)}</span> },
            {
              key: 'pr',
              header: 'Progress',
              render: (r) => (
                <div className="flex min-w-[110px] items-center gap-2">
                  <ProgressBar value={r.progress} tone={r.progress >= 100 ? 'ok' : 'info'} className="flex-1" />
                  <span className="tabular text-[12px] text-ink-2">{r.progress}%</span>
                </div>
              ),
            },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------------------------------------------------------- RFIs */

type Rfi = (typeof rfis)[number]

export function RfiList() {
  const { state, actions } = useStore()
  const short = useProjectShort()
  const [filter, setFilter] = useState<'active' | 'Open' | 'Overdue' | 'Answered' | 'Closed' | 'all'>('active')
  const [answered, setAnswered] = useState<Record<string, string>>({})
  const [sel, setSel] = useState<Rfi | null>(null)
  const [reply, setReply] = useState('')
  const statusOf = (r: Rfi) => (answered[r.id] ? 'Answered' : r.status)
  const base = inProject(rfis, state.projectFilter)
  const rows = base.filter((r) => {
    const s = statusOf(r)
    if (filter === 'all') return true
    if (filter === 'active') return s === 'Open' || s === 'Overdue'
    return s === filter
  })
  const count = (s: string) => base.filter((r) => statusOf(r) === s).length

  const markAnswered = (r: Rfi) => {
    setAnswered((a) => ({ ...a, [r.id]: reply.trim() || 'Response received and accepted by discipline lead.' }))
    actions.toast({ title: `${r.id} marked answered`, body: `Response logged from ${r.to}. Originator ${r.raisedBy} notified.`, tone: 'success' })
    setReply('')
    setSel(null)
  }

  return (
    <div>
      <PageHeader title="RFIs" count={rows.length} subtitle="Requests for information to client engineering, design consultants and vendors." crumbs={[QA_CRUMB, { label: 'RFIs' }]} />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Open" value={count('Open') + count('Overdue')} />
        <MiniStat label="Response overdue" value={count('Overdue')} tone={count('Overdue') ? 'crit' : undefined} />
        <MiniStat label="Answered (session)" value={count('Answered')} tone="ok" />
        <MiniStat label="Avg response time" value="7.4 days" />
      </div>
      <Card bodyClassName="p-0">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b border-line p-4">
          {(
            [
              ['active', 'Open and overdue', count('Open') + count('Overdue')],
              ['Overdue', 'Overdue', count('Overdue')],
              ['Answered', 'Answered', count('Answered')],
              ['Closed', 'Closed', count('Closed')],
              ['all', 'All', base.length],
            ] as const
          ).map(([id, label, n]) => (
            <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)} count={n}>
              {label}
            </FilterChip>
          ))}
        </div>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSel(r)}
          highlight={(r) => statusOf(r) === 'Overdue'}
          empty={
            <div className="p-5">
              <EmptyState icon={FileSearch} title="No RFIs in this view" body="Change the status filter to see more." />
            </div>
          }
          columns={[
            { key: 'id', header: 'RFI', render: (r) => <span className="font-medium whitespace-nowrap">{r.id}</span> },
            { key: 't', header: 'Subject', render: (r) => <span className="line-clamp-2 min-w-[180px]">{r.title}</span> },
            { key: 'p', header: 'Project', render: (r) => <span className="whitespace-nowrap">{short(r.projectId)}</span>, hideBelow: 'sm' },
            { key: 'd', header: 'Discipline', render: (r) => <span className="text-ink-2">{r.discipline}</span>, hideBelow: 'md' },
            { key: 'to', header: 'Addressed to', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.to}</span>, hideBelow: 'lg' },
            { key: 'due', header: 'Response due', render: (r) => <span className={cx('whitespace-nowrap', statusOf(r) === 'Overdue' ? 'font-medium text-crit' : 'text-ink-2')}>{fmtShort(r.due)}</span> },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={statusOf(r)} /> },
          ]}
        />
      </Card>

      <SlideOver
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel ? `${sel.id} ${sel.title}` : ''}
        subtitle={sel ? projectName(state, sel.projectId) : undefined}
        footer={
          sel && (statusOf(sel) === 'Open' || statusOf(sel) === 'Overdue') ? (
            <>
              <Button variant="ghost" onClick={() => setSel(null)}>
                Close
              </Button>
              <Button variant="primary" icon={CheckCircle2} onClick={() => markAnswered(sel)}>
                Mark answered
              </Button>
            </>
          ) : (
            <Button onClick={() => setSel(null)}>Close</Button>
          )
        }
      >
        {sel && (
          <div className="space-y-4">
            <KeyValue
              rows={[
                { label: 'Status', value: <StatusPill status={statusOf(sel)} /> },
                { label: 'Discipline', value: sel.discipline },
                { label: 'Raised by', value: sel.raisedBy },
                { label: 'Addressed to', value: sel.to },
                { label: 'Raised', value: fmtDate(sel.raised) },
                { label: 'Response due', value: <span className={statusOf(sel) === 'Overdue' ? 'font-medium text-crit' : undefined}>{fmtDate(sel.due)}</span> },
              ]}
            />
            <div className="rounded-[8px] bg-muted p-3 text-[13px] text-ink-2">
              Clarification requested on “{sel.title.toLowerCase()}”. Work at the affected front continues to the issued-for-construction drawing; items dependent on the response are tracked as constraints in the look-ahead schedule.
            </div>
            {answered[sel.id] ? (
              <div className="rounded-[8px] border border-line p-3">
                <div className="text-[12px] text-ink-3">Response</div>
                <p className="mt-1 text-[13px] text-ink">{answered[sel.id]}</p>
              </div>
            ) : statusOf(sel) !== 'Closed' ? (
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Response summary (optional)</span>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="e.g. Client confirms detail per drawing NPE-C-0582 Rev B." />
              </label>
            ) : null}
          </div>
        )}
      </SlideOver>
    </div>
  )
}

/* ---------------------------------------------------------------- Punch */

export function PunchListPage() {
  const { state, actions } = useStore()
  const short = useProjectShort()
  const [cat, setCat] = useState<'all' | 'A' | 'B'>('all')
  const [closed, setClosed] = useState<string[]>([])
  const pf = state.projectFilter
  const counts = Object.entries(punchCounts).filter(([p]) => pf === 'all' || p === pf)
  const total = counts.reduce((a, [, n]) => a + n, 0)
  const statusOf = (p: (typeof punchItems)[number]) => (closed.includes(p.id) ? 'Closed' : p.status)
  const items = inProject(punchItems, pf).filter((p) => cat === 'all' || p.category === cat)

  return (
    <div>
      <PageHeader title="Punch list" count={total - closed.length} subtitle="Category A items block mechanical completion. Category B items must close before final handover." crumbs={[QA_CRUMB, { label: 'Punch List' }]} />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map(([p, n]) => (
          <MiniStat key={p} label={short(p)} value={n - closed.filter((id) => punchItems.find((x) => x.id === id)?.projectId === p).length} />
        ))}
      </div>
      <Card bodyClassName="p-0" title="Recent punch items" subtitle="Sample of open items, full list in the handover module">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          {(['all', 'A', 'B'] as const).map((c) => (
            <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c === 'all' ? 'All categories' : `Category ${c}`}
            </FilterChip>
          ))}
        </div>
        <DataTable
          rows={items}
          rowKey={(r) => r.id}
          empty={
            <div className="p-5">
              <EmptyState icon={ClipboardList} title="No punch items" body="No items for this project and category." />
            </div>
          }
          columns={[
            { key: 'id', header: 'Item', render: (r) => <span className="font-medium whitespace-nowrap">{r.id}</span> },
            { key: 'd', header: 'Description', render: (r) => <span className={cx('line-clamp-2 min-w-[180px]', statusOf(r) === 'Closed' && 'text-ink-3 line-through')}>{r.item}</span> },
            { key: 'c', header: 'Cat', render: (r) => <Pill tone={r.category === 'A' ? 'crit' : 'warn'}>{r.category}</Pill> },
            { key: 'p', header: 'Project', render: (r) => short(r.projectId), hideBelow: 'sm' },
            { key: 'disc', header: 'Discipline', render: (r) => <span className="text-ink-2">{r.discipline}</span>, hideBelow: 'md' },
            { key: 'o', header: 'Owner', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.owner}</span>, hideBelow: 'lg' },
            { key: 'due', header: 'Due', render: (r) => <span className="whitespace-nowrap text-ink-2">{fmtShort(r.due)}</span> },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={statusOf(r)} /> },
            {
              key: 'a',
              header: '',
              align: 'end',
              render: (r) =>
                statusOf(r) === 'Closed' ? null : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setClosed((c) => [...c, r.id])
                      actions.toast({ title: `${r.id} closed`, body: 'Closure photo and sign-off recorded. Punch closure certificate updated.', tone: 'success' })
                    }}
                  >
                    Close
                  </Button>
                ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------------------------------------------------------- Calibration */

export function CalibrationPage() {
  const { state, actions } = useStore()
  const short = useProjectShort()
  const [filter, setFilter] = useState<'all' | 'Valid' | 'Due' | 'Expired'>('all')
  const [booked, setBooked] = useState<string[]>([])
  const base = inProject(calibration, state.projectFilter)
  const rows = base.filter((c) => filter === 'all' || c.status === filter)
  const n = (s: string) => base.filter((c) => c.status === s).length

  return (
    <div>
      <PageHeader title="Calibration" count={rows.length} subtitle="Measuring and test equipment register. Expired instruments are quarantined and affected work is reviewed (rule QA-04)." crumbs={[QA_CRUMB, { label: 'Calibration' }]} />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-xl">
        <MiniStat label="Valid" value={n('Valid')} tone="ok" />
        <MiniStat label="Due" value={n('Due')} tone="warn" />
        <MiniStat label="Expired" value={n('Expired')} tone={n('Expired') ? 'crit' : undefined} />
      </div>
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          {(['all', 'Valid', 'Due', 'Expired'] as const).map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} count={s === 'all' ? base.length : n(s)}>
              {s === 'all' ? 'All' : s}
            </FilterChip>
          ))}
        </div>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          highlight={(r) => r.status === 'Expired'}
          empty={
            <div className="p-5">
              <EmptyState icon={Ruler} title="No instruments" body="Nothing matches this status." />
            </div>
          }
          columns={[
            { key: 'tag', header: 'Tag', render: (r) => <span className="font-medium whitespace-nowrap">{r.tag}</span> },
            { key: 'i', header: 'Instrument', render: (r) => <span className="min-w-[160px]">{r.instrument}</span> },
            { key: 'p', header: 'Project', render: (r) => short(r.projectId), hideBelow: 'sm' },
            { key: 'l', header: 'Last calibrated', render: (r) => <span className="whitespace-nowrap text-ink-2">{fmtShort(r.lastCal)}</span>, hideBelow: 'md' },
            {
              key: 'due',
              header: 'Due',
              render: (r) => {
                const d = daysUntil(r.due)
                return (
                  <span className={cx('whitespace-nowrap', d < 0 ? 'font-medium text-crit' : d <= 14 ? 'text-warn' : 'text-ink-2')}>
                    {fmtShort(r.due)} <span className="text-[12px] text-ink-3">({d < 0 ? `${-d}d ago` : `in ${d}d`})</span>
                  </span>
                )
              },
            },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={booked.includes(r.id) ? 'Booked' : r.status} /> },
            {
              key: 'a',
              header: '',
              align: 'end',
              render: (r) =>
                r.status === 'Valid' ? null : booked.includes(r.id) ? (
                  <span className="text-[12px] text-ink-3">Booked</span>
                ) : (
                  <Button
                    size="sm"
                    icon={CalendarCheck}
                    onClick={() => {
                      setBooked((b) => [...b, r.id])
                      actions.toast({ title: `Calibration booked for ${r.tag}`, body: `Accredited lab slot requested. ${r.status === 'Expired' ? 'Instrument quarantined until certificate is issued.' : 'Certificate will update the MDR automatically.'}`, tone: 'success' })
                    }}
                  >
                    Book calibration
                  </Button>
                ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------------------------------------------------------- MTR */

export function MtrPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const short = useProjectShort()
  const [verified, setVerified] = useState<string[]>([])
  const base = inProject(mtrs, state.projectFilter)
  const statusOf = (m: (typeof mtrs)[number]) => (verified.includes(m.id) ? 'Verified' : m.verified)

  return (
    <div>
      <PageHeader title="Material / MTR records" count={base.length} subtitle="Mill test reports verified against heat numbers, PO and material specification at receiving." crumbs={[QA_CRUMB, { label: 'Material / MTR' }]} />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-xl">
        <MiniStat label="Verified" value={base.filter((m) => statusOf(m) === 'Verified').length} tone="ok" />
        <MiniStat label="Pending" value={base.filter((m) => statusOf(m) === 'Pending').length} tone="warn" />
        <MiniStat label="Discrepancy" value={base.filter((m) => statusOf(m) === 'Discrepancy').length} tone="crit" />
      </div>
      <Card bodyClassName="p-0">
        <DataTable
          rows={base}
          rowKey={(r) => r.id}
          highlight={(r) => statusOf(r) === 'Discrepancy'}
          onRowClick={(r) => (statusOf(r) === 'Discrepancy' ? navigate('/quality/ncrs/NCR-00209') : r.id === 'MTR-CS-2231' ? navigate('/record/W-00428') : undefined)}
          empty={
            <div className="p-5">
              <EmptyState icon={Package} title="No MTR records" body="No material certificates for this project." />
            </div>
          }
          columns={[
            { key: 'id', header: 'MTR', render: (r) => <span className="font-medium whitespace-nowrap">{r.id}</span> },
            { key: 'm', header: 'Material', render: (r) => <span className="min-w-[160px]">{r.material}</span> },
            { key: 'h', header: 'Heat / lot', render: (r) => <span className="whitespace-nowrap">{r.heat}</span> },
            { key: 'v', header: 'Vendor', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.vendor}</span>, hideBelow: 'md' },
            { key: 'po', header: 'PO', render: (r) => <LinkText to={`/procurement/pos/${r.po}`}>{r.po}</LinkText>, hideBelow: 'sm' },
            { key: 'p', header: 'Project', render: (r) => short(r.projectId), hideBelow: 'lg' },
            { key: 'd', header: 'Received', render: (r) => <span className="whitespace-nowrap text-ink-2">{fmtShort(r.date)}</span>, hideBelow: 'lg' },
            { key: 's', header: 'Verification', render: (r) => <StatusPill status={statusOf(r)} /> },
            {
              key: 'a',
              header: '',
              align: 'end',
              render: (r) =>
                statusOf(r) === 'Discrepancy' ? (
                  <LinkText to="/quality/ncrs/NCR-00209">NCR-00209</LinkText>
                ) : statusOf(r) === 'Pending' ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setVerified((v) => [...v, r.id])
                      actions.toast({ title: `${r.id} verified`, body: `Heat ${r.heat} matched against PO ${r.po} and material specification.`, tone: 'success' })
                    }}
                  >
                    Verify
                  </Button>
                ) : r.id === 'MTR-CS-2231' ? (
                  <LinkText to="/record/W-00428" className="whitespace-nowrap">
                    Used in W-00428
                  </LinkText>
                ) : null,
            },
          ]}
        />
      </Card>
    </div>
  )
}

/* ---------------------------------------------------------------- ITPs */

type Itp = (typeof inspectionPlans)[number]

const WELDING_ITP_ACTIVITIES: { step: string; activity: string; ref: string; contractor: 'H' | 'W' | 'R'; client: 'H' | 'W' | 'R' | '-' }[] = [
  { step: '1.1', activity: 'WPS / PQR approval', ref: 'API 1104 Sec. 5', contractor: 'H', client: 'H' },
  { step: '1.2', activity: 'Welder qualification test (WQT)', ref: 'API 1104 Sec. 6', contractor: 'H', client: 'W' },
  { step: '2.1', activity: 'Consumable receiving and storage', ref: 'AWS A5.1 / A5.5', contractor: 'R', client: 'R' },
  { step: '2.2', activity: 'Bevel and fit-up inspection', ref: 'WPS-012', contractor: 'W', client: 'R' },
  { step: '2.3', activity: 'Preheat verification', ref: 'WPS-012', contractor: 'W', client: '-' },
  { step: '3.1', activity: 'Welding parameter verification (new in Rev 3)', ref: 'WPS-012', contractor: 'H', client: 'W' },
  { step: '3.2', activity: 'Visual inspection of completed weld', ref: 'API 1104 Sec. 9', contractor: 'W', client: 'W' },
  { step: '4.1', activity: 'Radiographic testing (RT) 100%', ref: 'API 1104 Sec. 11', contractor: 'H', client: 'R' },
  { step: '4.2', activity: 'Repair weld and repeat NDT', ref: 'API 1104 Sec. 10', contractor: 'H', client: 'W' },
  { step: '5.1', activity: 'Weld map and log release to dossier', ref: 'Project MDR', contractor: 'R', client: 'R' },
]

function Marker({ m }: { m: 'H' | 'W' | 'R' | '-' }) {
  if (m === '-') return <span className="text-ink-3">—</span>
  const tone = m === 'H' ? 'crit' : m === 'W' ? 'warn' : 'info'
  return (
    <Pill tone={tone} className="!px-2 font-semibold">
      {m}
    </Pill>
  )
}

export function InspectionPlansPage() {
  const { state, actions } = useStore()
  const short = useProjectShort()
  const [sel, setSel] = useState<Itp | null>(null)
  const base = inProject(inspectionPlans, state.projectFilter)

  return (
    <div>
      <PageHeader title="Inspection & Test Plans" count={base.length} subtitle="Approved ITPs define hold (H), witness (W) and review (R) points for each discipline." crumbs={[QA_CRUMB, { label: 'Inspection Plans' }]} />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-xl">
        <MiniStat label="Activities" value={base.reduce((a, i) => a + i.activities, 0)} />
        <MiniStat label="Hold points" value={base.reduce((a, i) => a + i.hold, 0)} tone="crit" />
        <MiniStat label="Witness points" value={base.reduce((a, i) => a + i.witness, 0)} tone="warn" />
      </div>
      <Card bodyClassName="p-0">
        <DataTable
          rows={base}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSel(r)}
          empty={
            <div className="p-5">
              <EmptyState icon={ListChecks} title="No ITPs" body="No inspection and test plans for this project." />
            </div>
          }
          columns={[
            { key: 'id', header: 'ITP', render: (r) => <span className="font-medium whitespace-nowrap">{r.id}</span> },
            { key: 't', header: 'Title', render: (r) => <span className="min-w-[180px]">{r.title}</span> },
            { key: 'p', header: 'Project', render: (r) => short(r.projectId), hideBelow: 'sm' },
            { key: 'd', header: 'Discipline', render: (r) => <span className="text-ink-2">{r.discipline}</span>, hideBelow: 'md' },
            { key: 'a', header: 'Activities', align: 'end', render: (r) => <span className="tabular">{r.activities}</span>, hideBelow: 'md' },
            { key: 'h', header: 'Hold', align: 'end', render: (r) => <span className="tabular font-medium text-crit">{r.hold}</span> },
            { key: 'w', header: 'Witness', align: 'end', render: (r) => <span className="tabular text-warn">{r.witness}</span> },
            { key: 'rev', header: 'Rev', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.rev}</span>, hideBelow: 'sm' },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      </Card>

      <SlideOver
        open={!!sel}
        onClose={() => setSel(null)}
        width={620}
        title={sel ? sel.title : ''}
        subtitle={sel ? `${sel.id} · ${sel.rev} · ${projectName(state, sel.projectId)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSel(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={Send}
              onClick={() => {
                if (sel) actions.toast({ title: `${sel.id} issued to site`, body: 'Inspectors and client representative notified of current revision.', tone: 'success' })
                setSel(null)
              }}
            >
              Issue to site
            </Button>
          </>
        }
      >
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Activities" value={sel.activities} />
              <MiniStat label="Hold" value={sel.hold} tone="crit" />
              <MiniStat label="Witness" value={sel.witness} tone="warn" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <Marker m="H" /> Hold: work stops until released
              </span>
              <span className="flex items-center gap-1.5">
                <Marker m="W" /> Witness: notify, may proceed
              </span>
              <span className="flex items-center gap-1.5">
                <Marker m="R" /> Review of records
              </span>
            </div>
            {sel.id === 'ITP-NPE-WLD' ? (
              <div className="rounded-[8px] border border-line">
                <DataTable
                  dense
                  rows={WELDING_ITP_ACTIVITIES}
                  rowKey={(r) => r.step}
                  columns={[
                    { key: 's', header: '#', render: (r) => <span className="tabular text-ink-3">{r.step}</span> },
                    {
                      key: 'a',
                      header: 'Activity',
                      render: (r) => (
                        <div className="min-w-[160px]">
                          <div className="text-ink">{r.activity}</div>
                          <div className="text-[12px] text-ink-3">{r.ref}</div>
                        </div>
                      ),
                    },
                    { key: 'c', header: 'SHQ', align: 'center', render: (r) => <Marker m={r.contractor} /> },
                    { key: 'cl', header: 'Client', align: 'center', render: (r) => <Marker m={r.client} /> },
                  ]}
                />
              </div>
            ) : (
              <EmptyState icon={ListChecks} title="Activity breakdown in the controlled document" body={`${sel.activities} activities are maintained in the approved ${sel.rev} document. Open the Document Centre for the full ITP.`} />
            )}
            <DemoTag>Illustrative Data</DemoTag>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
