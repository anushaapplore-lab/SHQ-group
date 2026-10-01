import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CloudUpload, FolderTree, Search, X } from 'lucide-react'
import { useStore } from '../../store/store'
import { docExpiringSoon, mdrSummary } from '../../store/selectors'
import type { DocStatus, DocumentRec } from '../../data/types'
import { daysUntil, fmtDate } from '../../lib/format'
import { Button, Card, DataTable, EmptyState, FilterChip, Input, PageHeader, Pill, Select, StatusPill } from '../../components/ui'
import type { Column } from '../../components/ui'
import { useDocWorkflow } from '../../components/documents/useDocWorkflow'
import { DocActions } from '../../components/documents/DocActions'
import { DOC_STATUSES, MDR_PROJECTS, daysLabel, expiryTone } from '../../components/documents/docShared'

function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[2px] bg-[#fdf1b1] px-0.5 text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

function DossierImpact() {
  const { state } = useStore()
  const [initial] = useState<Record<string, number>>(() => Object.fromEntries(MDR_PROJECTS.map((p) => [p, mdrSummary(state.mdr[p]).pct])))
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-line bg-muted px-4 py-2.5 text-[13px]">
      <span className="flex items-center gap-1.5 text-ink-2">
        <FolderTree className="size-4" strokeWidth={1.5} /> Dossier impact
      </span>
      {MDR_PROJECTS.filter((p) => state.mdr[p]).map((p) => {
        const now = mdrSummary(state.mdr[p]).pct
        const delta = Math.round((now - initial[p]) * 10) / 10
        return (
          <span key={p} className="tabular text-ink">
            <span className="font-medium">{p}</span> {now.toFixed(1)}%
            {delta !== 0 && <span className={delta > 0 ? 'ms-1 text-ok' : 'ms-1 text-crit'}>{delta > 0 ? `+${delta}` : delta}</span>}
          </span>
        )
      })}
      <span className="text-[12px] text-ink-3">Updates live as documents are uploaded and approved.</span>
    </div>
  )
}

const PRESET_TITLE = { all: 'Document Register', missing: 'Missing Documents', expiring: 'Expiring Documents' }

export function DocumentRegister({ preset = 'all' }: { preset?: 'all' | 'missing' | 'expiring' }) {
  const { state } = useStore()
  const [sp, setSp] = useSearchParams()
  const wf = useDocWorkflow()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const paramStatus = sp.get('status') as DocStatus | null
  const [status, setStatus] = useState<DocStatus | 'all'>(paramStatus && DOC_STATUSES.includes(paramStatus) ? paramStatus : 'all')
  const project = sp.get('project') ?? (state.projectFilter !== 'all' ? state.projectFilter : 'all')
  const category = sp.get('category') ?? 'all'

  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(sp)
    if (v === 'all' || !v) n.delete(k)
    else n.set(k, v)
    setSp(n, { replace: true })
  }

  const presetFilter = (d: DocumentRec) =>
    preset === 'missing' ? d.status === 'Missing' : preset === 'expiring' ? d.status === 'Expiring' || d.status === 'Expired' || docExpiringSoon(d) : true

  const qq = q.trim().toLowerCase()
  const scoped = state.documents.filter(
      (d) =>
        presetFilter(d) &&
        (project === 'all' || d.projectId === project) &&
        (category === 'all' || d.category === category) &&
        (!qq || [d.id, d.title, d.docType, d.owner, d.discipline, d.category].some((x) => x.toLowerCase().includes(qq))),
  )

  const rows = status === 'all' ? scoped : scoped.filter((d) => d.status === status)
  const counts = (s: DocStatus) => scoped.filter((d) => d.status === s).length
  const statusChips = DOC_STATUSES.filter((s) => preset === 'all' || counts(s) > 0)
  const projectOptions = [{ value: 'all', label: 'All projects' }, ...state.projects.filter((p) => state.documents.some((d) => d.projectId === p.id)).map((p) => ({ value: p.id, label: `${p.id} · ${p.shortName}` }))]
  const categories = Array.from(new Set(state.documents.map((d) => d.category))).sort()
  const qt = q.trim()

  const columns: Column<DocumentRec>[] = [
    {
      key: 'id',
      header: 'Document ID',
      render: (d) => (
        <div className="min-w-[200px] max-w-[300px]">
          <div className="font-medium text-ink">
            <Highlight text={d.id} q={qt} />
          </div>
          <div className="truncate text-[12px] text-ink-3" title={d.title}>
            <Highlight text={d.title} q={qt} />
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Document Type', render: (d) => <span className="whitespace-nowrap text-ink-2"><Highlight text={d.docType} q={qt} /></span> },
    { key: 'project', header: 'Project', render: (d) => <span className="text-ink-2">{d.projectId}</span> },
    { key: 'disc', header: 'Discipline', render: (d) => <span className="text-ink-2">{d.discipline}</span>, hideBelow: 'md' },
    { key: 'rev', header: 'Revision', render: (d) => <span className="tabular text-ink-2">{d.revision}</span>, align: 'center' },
    { key: 'status', header: 'Status', render: (d) => <StatusPill status={d.status} /> },
    { key: 'owner', header: 'Owner', render: (d) => <span className="whitespace-nowrap text-ink-2"><Highlight text={d.owner} q={qt} /></span>, hideBelow: 'md' },
    { key: 'sub', header: 'Submitted', render: (d) => <span className="whitespace-nowrap text-ink-2">{fmtDate(d.submitted)}</span>, hideBelow: 'lg' },
    { key: 'app', header: 'Approved', render: (d) => <span className="whitespace-nowrap text-ink-2">{fmtDate(d.approved)}</span>, hideBelow: 'lg' },
    {
      key: 'exp',
      header: 'Expiry',
      render: (d) => {
        if (!d.expiry) return <span className="text-ink-3">—</span>
        const t = expiryTone(d.expiry)
        return (
          <div className="whitespace-nowrap">
            <div className="text-ink-2">{fmtDate(d.expiry)}</div>
            {t && (
              <Pill tone={t} className="mt-0.5">
                {daysLabel(daysUntil(d.expiry))}
              </Pill>
            )}
          </div>
        )
      },
    },
    { key: 'act', header: 'Action', render: (d) => <DocActions doc={d} wf={wf} compact /> },
  ]

  return (
    <div>
      <PageHeader
        title={PRESET_TITLE[preset]}
        count={rows.length}
        subtitle={
          preset === 'missing'
            ? 'Required documents not yet uploaded. Uploading routes them for review and updates the dossier.'
            : preset === 'expiring'
              ? 'Documents expired or expiring within 30 days. Upload a renewal to restore validity.'
              : 'Controlled documents across projects with review workflow and expiry tracking.'
        }
        crumbs={[{ label: 'Handover', to: '/handover' }, { label: PRESET_TITLE[preset] }]}
        actions={
          <Button variant="primary" icon={CloudUpload} onClick={() => wf.uploadNew({ projectId: project !== 'all' ? project : undefined, category: category !== 'all' ? category : undefined })}>
            Upload Document
          </Button>
        }
      />
      <DossierImpact />
      <Card bodyClassName="p-0">
        <div className="space-y-3 border-b border-line p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setParam('q', e.target.value)
                }}
                placeholder="Search ID, title, type, owner"
                className="ps-9"
              />
            </div>
            <Select value={project} onChange={(e) => setParam('project', e.target.value)} options={projectOptions} aria-label="Project" />
            <Select value={category} onChange={(e) => setParam('category', e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...categories]} aria-label="Category" />
          </div>
          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={status === 'all'} onClick={() => setStatus('all')} count={scoped.length}>
              All
            </FilterChip>
            {statusChips.map((s) => (
              <FilterChip key={s} active={status === s} onClick={() => setStatus(s)} count={counts(s)}>
                {s}
              </FilterChip>
            ))}
          </div>
          {(category !== 'all' || project !== 'all' || qt) && (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
              Filtered by
              {project !== 'all' && (
                <button type="button" onClick={() => setParam('project', 'all')} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 hover:bg-line">
                  Project {project} <X className="size-3" />
                </button>
              )}
              {category !== 'all' && (
                <button type="button" onClick={() => setParam('category', 'all')} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 hover:bg-line">
                  {category} <X className="size-3" />
                </button>
              )}
              {qt && (
                <button
                  type="button"
                  onClick={() => {
                    setQ('')
                    setParam('q', '')
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 hover:bg-line"
                >
                  “{qt}” <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={(d) => (d.status === 'Missing' ? wf.upload(d) : wf.preview(d.id))}
          highlight={(d) => !!qt && d.id.toLowerCase() === qt.toLowerCase()}
          empty={
            <div className="p-5">
              <EmptyState
                title={preset === 'missing' ? 'No missing documents' : preset === 'expiring' ? 'Nothing expiring' : 'No documents match'}
                body={preset === 'all' ? 'Try clearing the search or filters.' : 'All documents in scope are current.'}
                action={
                  (qt || category !== 'all' || project !== 'all' || status !== 'all') && (
                    <Button
                      onClick={() => {
                        setQ('')
                        setStatus('all')
                        setSp(new URLSearchParams(), { replace: true })
                      }}
                    >
                      Clear filters
                    </Button>
                  )
                }
              />
            </div>
          }
        />
      </Card>
      {wf.modals}
    </div>
  )
}
