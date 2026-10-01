import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock, CircleX, CloudUpload, FileWarning, LayoutGrid, List, Network, Search, TriangleAlert } from 'lucide-react'
import { useStore } from '../../store/store'
import { complianceStatus, mdrSummary, projectName } from '../../store/selectors'
import type { ComplianceItem, DocumentRec } from '../../data/types'
import { cx, daysUntil, fmtDate } from '../../lib/format'
import { Button, Card, DataTable, DemoTag, EmptyState, FileTile, Input, Kpi, PageHeader, Pill, Segmented, Select, StatusPill } from '../../components/ui'
import type { Column } from '../../components/ui'
import { useDocWorkflow } from '../../components/documents/useDocWorkflow'
import { DocActions } from '../../components/documents/DocActions'
import { ComplianceAction, ExpirySlideOver, daysTone } from '../../components/documents/ExpirySlideOver'
import type { ExpiryRef } from '../../components/documents/ExpirySlideOver'
import { daysLabel } from '../../components/documents/docShared'

type Preset = 'all' | 'recent' | 'expiring' | 'missing' | 'project'
type ExpiryFilter = 'any' | '7' | '30' | 'expired' | 'due'

interface EngineItem {
  key: string
  source: 'doc' | 'compliance'
  id: string
  title: string
  type: string
  projectId: string
  department: string
  status: string
  owner: string
  expiry: string | null
  days: number | null
  updatedAt: string
  doc?: DocumentRec
  comp?: ComplianceItem
}

const fromDoc = (d: DocumentRec): EngineItem => ({
  key: `d-${d.id}`,
  source: 'doc',
  id: d.id,
  title: d.title,
  type: d.docType,
  projectId: d.projectId,
  department: d.department,
  status: d.status,
  owner: d.owner,
  expiry: d.expiry,
  days: d.expiry ? daysUntil(d.expiry) : null,
  updatedAt: d.updatedAt,
  doc: d,
})

const fromComp = (c: ComplianceItem): EngineItem => ({
  key: `c-${c.id}`,
  source: 'compliance',
  id: c.id,
  title: c.item,
  type: c.kind,
  projectId: c.projectId,
  department: 'Compliance',
  status: complianceStatus(c),
  owner: c.owner,
  expiry: c.expiry,
  days: daysUntil(c.expiry),
  updatedAt: c.updatedAt,
  comp: c,
})

/** Items whose expiry is actively tracked (renewals in progress and missing items excluded). */
const tracked = (i: EngineItem) => i.days !== null && i.status !== 'Renewal In Progress' && i.status !== 'Missing'
const within = (i: EngineItem, n: number) => tracked(i) && (i.days as number) >= 0 && (i.days as number) <= n
const expired = (i: EngineItem) => tracked(i) && (i.days as number) < 0

function matchExpiry(i: EngineItem, f: ExpiryFilter) {
  if (f === 'any') return true
  if (f === '7') return within(i, 7)
  if (f === '30') return within(i, 30)
  if (f === 'expired') return expired(i)
  return within(i, 30) || expired(i)
}

const TITLES: Record<Preset, string> = {
  all: 'Document Centre',
  recent: 'Recent Documents',
  expiring: 'Expiring Documents',
  missing: 'Missing Documents',
  project: 'Documents by Project',
}

function LinkedChain({ onPreview }: { onPreview: (id: string) => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const ins = state.inspections.find((i) => i.id === 'INS-WLD-00428')
  const ncr = state.ncrs.find((n) => n.inspectionId === 'INS-WLD-00428')
  const photo = state.documents.find((d) => d.id === 'DOC-NPE-PH-00428')
  const mtr = state.documents.find((d) => d.id === 'DOC-NPE-MTR-2231')
  const welding = state.mdr.NPE?.find((c) => c.name === 'Welding Records')
  const nodes: { label: string; id: string; status?: string; onClick: () => void }[] = [
    ncr
      ? { label: 'NCR', id: ncr.id, status: ncr.status, onClick: () => navigate(`/quality/ncrs/${ncr.id}`) }
      : { label: 'NCR', id: 'Raise from INS-WLD-00428', status: 'Not raised', onClick: () => navigate('/quality/inspections/INS-WLD-00428') },
    { label: 'Inspection', id: 'INS-WLD-00428', status: ins?.result, onClick: () => navigate('/quality/inspections/INS-WLD-00428') },
    { label: 'Photo', id: 'DOC-NPE-PH-00428', status: photo?.status, onClick: () => onPreview('DOC-NPE-PH-00428') },
    { label: 'MTR', id: 'DOC-NPE-MTR-2231', status: mtr?.status, onClick: () => onPreview('DOC-NPE-MTR-2231') },
    { label: 'Project', id: 'NPE', status: projectName(state, 'NPE'), onClick: () => navigate('/projects/NPE') },
    {
      label: 'Handover dossier',
      id: 'Welding Records',
      status: welding ? `${Math.round((welding.completed / welding.required) * 100)}% · NPE ${mdrSummary(state.mdr.NPE).pct.toFixed(1)}%` : undefined,
      onClick: () => navigate(`/handover/register?category=${encodeURIComponent('Welding Records')}&project=NPE`),
    },
  ]
  return (
    <Card
      title="Connected records"
      icon={Network}
      subtitle="One weld, one chain: every document is linked to the records it evidences"
      actions={
        <Button size="sm" variant="primary" onClick={() => navigate('/record/W-00428')}>
          Open Record 360°
        </Button>
      }
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {nodes.map((n, i) => (
          <Fragment key={n.label}>
            <button type="button" onClick={n.onClick} className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-start hover:border-action">
              <div className="caps text-[10px] text-ink-3">{n.label}</div>
              <div className="mt-0.5 truncate text-[13px] font-medium text-action">{n.id}</div>
              {n.status && <div className="mt-1 truncate text-[12px] text-ink-2">{n.status}</div>}
            </button>
            {i < nodes.length - 1 && (
              <div className="flex items-center justify-center text-ink-3">
                <ArrowRight className="size-4 rotate-90 lg:rotate-0 rtl:lg:rotate-180" strokeWidth={1.5} />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </Card>
  )
}

export function DocumentCentre({ preset = 'all' }: { preset?: Preset }) {
  const { state } = useStore()
  const wf = useDocWorkflow()
  const [project, setProject] = useState(state.projectFilter)
  const [dept, setDept] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState(preset === 'missing' ? 'Missing' : 'all')
  const [expiry, setExpiry] = useState<ExpiryFilter>(preset === 'expiring' ? 'due' : 'any')
  const [owner, setOwner] = useState('all')
  const [q, setQ] = useState('')
  const [view, setView] = useState<'table' | 'grid'>(preset === 'project' ? 'grid' : 'table')
  const [slide, setSlide] = useState<ExpiryRef | null>(null)

  const docsOnly = preset === 'recent' || preset === 'project'
  const all: EngineItem[] = [...state.documents.map(fromDoc), ...(docsOnly ? [] : state.compliance.map(fromComp))]
  const inScope = all.filter((i) => project === 'all' || i.projectId === project)

  const qq = q.trim().toLowerCase()
  let rows = inScope.filter(
    (i) =>
      (dept === 'all' || i.department === dept) &&
      (type === 'all' || i.type === type) &&
      (status === 'all' || i.status === status) &&
      (owner === 'all' || i.owner === owner) &&
      matchExpiry(i, expiry) &&
      (!qq || [i.id, i.title, i.type, i.owner].some((x) => x.toLowerCase().includes(qq))),
  )
  if (preset === 'recent') rows = [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20)
  else if (expiry !== 'any') rows = [...rows].sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))

  // Summary tiles always combine documents and compliance items (one engine).
  const engine = [...state.documents.map(fromDoc), ...state.compliance.map(fromComp)].filter((i) => project === 'all' || i.projectId === project)
  const t7 = engine.filter((i) => within(i, 7)).length
  const t30 = engine.filter((i) => within(i, 30)).length
  const tExp = engine.filter(expired).length
  const tMiss = engine.filter((i) => i.status === 'Missing').length

  const uniq = (xs: string[]) => Array.from(new Set(xs)).sort()
  const opt = (label: string, xs: string[]) => [{ value: 'all', label }, ...uniq(xs)]
  const projectOptions = [{ value: 'all', label: 'All projects' }, ...state.projects.filter((p) => all.some((i) => i.projectId === p.id)).map((p) => ({ value: p.id, label: `${p.id} · ${p.shortName}` }))]
  const activeFilters = [project !== 'all', dept !== 'all', type !== 'all', status !== 'all', expiry !== 'any', owner !== 'all', !!qq].filter(Boolean).length

  const open = (i: EngineItem) => {
    if (i.source === 'compliance') setSlide({ kind: 'compliance', id: i.id })
    else if (i.status === 'Missing' && i.doc) wf.upload(i.doc)
    else if (i.expiry) setSlide({ kind: 'doc', id: i.id })
    else wf.preview(i.id)
  }

  const clear = () => {
    setProject('all')
    setDept('all')
    setType('all')
    setStatus('all')
    setExpiry('any')
    setOwner('all')
    setQ('')
  }

  const columns: Column<EngineItem>[] = [
    {
      key: 'title',
      header: 'Document / item',
      render: (i) => (
        <div className="min-w-[200px] max-w-[320px]">
          <div className="truncate font-medium text-ink">{i.title}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
            {i.id}
            {i.source === 'compliance' && <Pill className="!px-1.5 !py-0 !text-[10px]">Compliance</Pill>}
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (i) => <span className="whitespace-nowrap text-ink-2">{i.type}</span> },
    { key: 'project', header: 'Project', render: (i) => <span className="text-ink-2">{i.projectId}</span> },
    { key: 'dept', header: 'Department', render: (i) => <span className="text-ink-2">{i.department}</span>, hideBelow: 'md' },
    { key: 'status', header: 'Status', render: (i) => <StatusPill status={i.status} /> },
    { key: 'owner', header: 'Owner', render: (i) => <span className="whitespace-nowrap text-ink-2">{i.owner}</span>, hideBelow: 'lg' },
    { key: 'updated', header: 'Updated', render: (i) => <span className="whitespace-nowrap text-ink-2">{fmtDate(i.updatedAt)}</span>, hideBelow: 'lg' },
    {
      key: 'expiry',
      header: 'Expiry',
      render: (i) =>
        i.expiry && i.days !== null ? (
          <div className="whitespace-nowrap">
            <div className="text-ink-2">{fmtDate(i.expiry)}</div>
            {i.days <= 30 && i.status !== 'Renewal In Progress' && (
              <Pill tone={daysTone(i.days)} className="mt-0.5">
                {daysLabel(i.days)}
              </Pill>
            )}
          </div>
        ) : (
          <span className="text-ink-3">—</span>
        ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (i) => (i.comp ? <ComplianceAction c={i.comp} /> : i.doc ? <DocActions doc={i.doc} wf={wf} compact /> : null),
    },
  ]

  const tile = (i: EngineItem, n: number) => (
    <FileTile
      key={i.key}
      name={i.title}
      type={i.doc ? i.doc.fileType : 'pdf'}
      photoSeed={n + 2}
      onClick={() => open(i)}
      meta={
        <span className="flex items-center gap-1.5">
          <StatusPill status={i.status} className="!px-1.5 !py-0 !text-[10px]" />
          {i.id}
        </span>
      }
    />
  )

  const grouped = state.projects
    .map((p) => ({ p, items: rows.filter((r) => r.projectId === p.id) }))
    .filter((g) => g.items.length > 0)

  return (
    <div>
      <PageHeader
        title={TITLES[preset]}
        count={rows.length}
        subtitle="Shared document and expiry engine across projects, quality, HSE, procurement, HR, O&M and compliance."
        crumbs={[{ label: 'Documents', to: '/documents' }, { label: TITLES[preset] }]}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: 'table', label: 'Table' },
                { id: 'grid', label: 'Grid' },
              ]}
            />
            <Button variant="primary" icon={CloudUpload} onClick={() => wf.uploadNew({ projectId: project !== 'all' ? project : undefined })}>
              Upload
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Expiring in 7 days" value={t7} icon={TriangleAlert} tone={t7 ? 'warn' : 'ok'} onClick={() => setExpiry(expiry === '7' ? 'any' : '7')} sub={expiry === '7' ? 'Filter applied' : 'Documents + compliance'} className={cx(expiry === '7' && '!border-shell')} />
        <Kpi label="Expiring in 30 days" value={t30} icon={CalendarClock} tone={t30 ? 'warn' : 'ok'} onClick={() => setExpiry(expiry === '30' ? 'any' : '30')} sub={expiry === '30' ? 'Filter applied' : 'Documents + compliance'} className={cx(expiry === '30' && '!border-shell')} />
        <Kpi label="Expired" value={tExp} icon={CircleX} tone={tExp ? 'crit' : 'ok'} onClick={() => setExpiry(expiry === 'expired' ? 'any' : 'expired')} sub={expiry === 'expired' ? 'Filter applied' : 'Renewal required'} className={cx(expiry === 'expired' && '!border-shell')} />
        <Kpi
          label="Missing"
          value={tMiss}
          icon={FileWarning}
          tone={tMiss ? 'crit' : 'ok'}
          onClick={() => {
            setStatus(status === 'Missing' ? 'all' : 'Missing')
            setExpiry('any')
          }}
          sub={status === 'Missing' ? 'Filter applied' : 'Required, not uploaded'}
          className={cx(status === 'Missing' && '!border-shell')}
        />
      </div>

      {(preset === 'all' || preset === 'project') && (
        <div className="mt-4">
          <LinkedChain onPreview={wf.preview} />
        </div>
      )}

      <Card className="mt-4" bodyClassName="p-0">
        <div className="space-y-3 border-b border-line p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents, certificates, IDs, owners" className="ps-9" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            <Select aria-label="Project" value={project} onChange={(e) => setProject(e.target.value)} options={projectOptions} />
            <Select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} options={opt('All departments', inScope.map((i) => i.department))} />
            <Select aria-label="Document type" value={type} onChange={(e) => setType(e.target.value)} options={opt('All types', inScope.map((i) => i.type))} />
            <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={opt('All statuses', [...inScope.map((i) => i.status), ...(status !== 'all' ? [status] : [])])} />
            <Select
              aria-label="Expiry"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as ExpiryFilter)}
              options={[
                { value: 'any', label: 'Any expiry' },
                { value: '7', label: 'Next 7 days' },
                { value: '30', label: 'Next 30 days' },
                { value: 'expired', label: 'Expired' },
                { value: 'due', label: 'Expired or ≤ 30 days' },
              ]}
            />
            <Select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} options={opt('All owners', inScope.map((i) => i.owner))} />
          </div>
          {(activeFilters > 0 || docsOnly) && (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
              {activeFilters > 0 && (
                <>
                  {activeFilters} filter{activeFilters > 1 ? 's' : ''} applied
                  <button type="button" onClick={clear} className="font-medium text-action hover:underline">
                    Clear all
                  </button>
                </>
              )}
              {preset === 'recent' && <span>Showing the 20 most recently updated documents.</span>}
              {preset === 'project' && <span>Grouped by project. Compliance items are on the Compliance pages.</span>}
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No documents match" body="Adjust or clear the filters to see more of the register." action={activeFilters > 0 ? <Button onClick={clear}>Clear filters</Button> : undefined} />
          </div>
        ) : view === 'table' ? (
          preset === 'project' ? (
            <div className="divide-y divide-line">
              {grouped.map((g) => (
                <div key={g.p.id}>
                  <div className="bg-muted px-4 py-2 text-[13px] font-medium text-ink">
                    {g.p.name} <span className="font-normal text-ink-3">({g.items.length})</span>
                  </div>
                  <DataTable columns={columns} rows={g.items} rowKey={(i) => i.key} onRowClick={open} />
                </div>
              ))}
            </div>
          ) : (
            <DataTable columns={columns} rows={rows} rowKey={(i) => i.key} onRowClick={open} />
          )
        ) : preset === 'project' ? (
          <div className="space-y-6 p-4">
            {grouped.map((g) => (
              <div key={g.p.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[15px] font-medium text-ink">
                    {g.p.name} <span className="font-normal text-ink-2">({g.items.length})</span>
                  </div>
                  {state.mdr[g.p.id] && <Pill tone="info">Dossier {mdrSummary(state.mdr[g.p.id]).pct.toFixed(1)}%</Pill>}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{g.items.map(tile)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{rows.map(tile)}</div>
        )}
      </Card>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
        <List className="size-3.5" strokeWidth={1.5} />
        Expiry alerts are raised 30 days ahead; renewals and approvals update the dossier, compliance calendar and alert centre together.
        <DemoTag icon={LayoutGrid}>Production integration configurable</DemoTag>
      </div>

      <ExpirySlideOver item={slide} onClose={() => setSlide(null)} wf={wf} />
      {wf.modals}
    </div>
  )
}
