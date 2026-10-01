import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Camera,
  ClipboardCheck,
  FileText,
  FileWarning,
  Hash,
  History,
  MapPin,
  MessageSquarePlus,
  Network,
  RotateCcw,
  ShieldAlert,
  User,
  Wrench,
} from 'lucide-react'
import { DISCIPLINES, FINDING_LIBRARY, ProjectFilterNote, SeverityPill, useProjectShort } from '../../components/quality/shared'
import { Button, Card, DataTable, DemoTag, EmptyState, FileTile, FilterChip, KeyValue, LinkText, Modal, PageHeader, Pill, ProgressBar, SitePhoto, StatusPill, Textarea } from '../../components/ui'
import type { Inspection } from '../../data/types'
import { cx, fmtDate, fmtShort } from '../../lib/format'
import { inProject, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'

const RESULTS: Inspection['result'][] = ['Passed', 'Failed', 'Pending', 'Re-inspection Requested']

export function InspectionsList() {
  const { state } = useStore()
  const navigate = useNavigate()
  const short = useProjectShort()
  const [disc, setDisc] = useState<string>('all')
  const [result, setResult] = useState<string>('all')
  const base = inProject(state.inspections, state.projectFilter)
  const rows = base
    .filter((i) => disc === 'all' || i.discipline === disc)
    .filter((i) => result === 'all' || i.result === result)
    .sort((a, b) => (a.result === 'Failed' && b.result !== 'Failed' ? -1 : b.result === 'Failed' && a.result !== 'Failed' ? 1 : b.date.localeCompare(a.date)))
  const failed = base.filter((i) => i.result === 'Failed').length
  const passed = base.filter((i) => i.result === 'Passed').length

  return (
    <div>
      <PageHeader
        title="Inspections"
        count={rows.length}
        subtitle="Inspection records against approved ITPs. Failed inspections must be dispositioned with an NCR."
        crumbs={[{ label: 'QA/QC', to: '/quality' }, { label: 'Inspections' }]}
      />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Recorded" value={base.length} />
        <Stat label="Passed" value={passed} tone="ok" />
        <Stat label="Failed" value={failed} tone={failed ? 'crit' : undefined} />
        <Stat label="Failed without NCR" value={base.filter((i) => i.result === 'Failed' && !i.ncrId).length} tone="crit" />
      </div>
      <Card bodyClassName="p-0">
        <div className="space-y-3 border-b border-line p-4">
          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-0.5">
            <FilterChip active={disc === 'all'} onClick={() => setDisc('all')} count={base.length}>
              All disciplines
            </FilterChip>
            {DISCIPLINES.map((d) => (
              <FilterChip key={d} active={disc === d} onClick={() => setDisc(d)} count={base.filter((i) => i.discipline === d).length}>
                {d}
              </FilterChip>
            ))}
          </div>
          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-0.5">
            <FilterChip active={result === 'all'} onClick={() => setResult('all')}>
              Any result
            </FilterChip>
            {RESULTS.map((r) => (
              <FilterChip key={r} active={result === r} onClick={() => setResult(r)} count={base.filter((i) => i.result === r).length}>
                {r}
              </FilterChip>
            ))}
          </div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/quality/inspections/${r.id}`)}
          highlight={(r) => r.result === 'Failed'}
          empty={
            <div className="p-5">
              <EmptyState icon={ClipboardCheck} title="No inspections match" body="Adjust the discipline or result filter." />
            </div>
          }
          columns={[
            { key: 'id', header: 'Inspection', render: (r) => <span className={cx('font-medium whitespace-nowrap', r.result === 'Failed' && 'text-crit')}>{r.id}</span> },
            { key: 'p', header: 'Project', render: (r) => <span className="whitespace-nowrap">{short(r.projectId)}</span> },
            { key: 'd', header: 'Discipline', render: (r) => <span className="whitespace-nowrap">{r.discipline}</span> },
            { key: 'l', header: 'Location', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.location}</span>, hideBelow: 'md' },
            { key: 'r', header: 'Reference', render: (r) => <span className="whitespace-nowrap">{r.reference}</span> },
            { key: 'i', header: 'Inspector', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.inspector}</span>, hideBelow: 'lg' },
            { key: 't', header: 'Type', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.type}</span>, hideBelow: 'lg' },
            { key: 'dt', header: 'Date', render: (r) => <span className="whitespace-nowrap text-ink-2">{fmtShort(r.date)}</span>, hideBelow: 'sm' },
            { key: 'res', header: 'Result', render: (r) => <StatusPill status={r.result} /> },
            {
              key: 'ncr',
              header: 'NCR',
              render: (r) => (r.ncrId ? <LinkText to={`/quality/ncrs/${r.ncrId}`}>{r.ncrId}</LinkText> : r.result === 'Failed' ? <Pill tone="crit">Not raised</Pill> : <span className="text-ink-3">—</span>),
            },
          ]}
        />
      </Card>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'crit' }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface px-4 py-3">
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className={cx('tabular mt-1 text-[20px] font-semibold', tone === 'crit' && value > 0 ? 'text-crit' : tone === 'ok' ? 'text-ok' : 'text-ink')}>{value}</div>
    </div>
  )
}

/* ---------------------------------------------------------------- detail */

export function InspectionDetail() {
  const { id = '' } = useParams()
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const ins = state.inspections.find((i) => i.id === id)

  if (!ins) {
    return (
      <div>
        <PageHeader title="Inspection not found" crumbs={[{ label: 'QA/QC', to: '/quality' }, { label: 'Inspections', to: '/quality/inspections' }, { label: id }]} />
        <EmptyState
          icon={ClipboardCheck}
          title={`No inspection with ID ${id}`}
          body="It may have been removed in a demo reset, or the link is incorrect."
          action={
            <Button icon={ArrowLeft} onClick={() => navigate('/quality/inspections')}>
              Back to inspections
            </Button>
          }
        />
      </div>
    )
  }

  const wp = state.workPackages.find((w) => w.id === ins.workPackageId)
  const docs = state.documents.filter((d) => d.linkedTo.includes(ins.id) || d.linkedTo.includes(ins.reference))
  const ncr = ins.ncrId ? state.ncrs.find((n) => n.id === ins.ncrId) : undefined
  const isWeld = ins.discipline === 'Welding'
  const hasRecord360 = ins.reference === 'W-00428'
  const activity = state.activities.filter((a) => a.text.includes(ins.id) || a.text.includes(ins.reference) || (ins.ncrId && a.text.includes(ins.ncrId)))
  const canRaise = ins.result === 'Failed' || ins.result === 'Re-inspection Requested'

  const raise = () => {
    const newId = actions.raiseNCR(ins.id)
    if (newId) navigate(`/quality/ncrs/${newId}`)
  }

  const saveNote = () => {
    if (!note.trim()) return
    actions.addInspectionNote(ins.id, note.trim())
    setNote('')
    setNoteOpen(false)
  }

  return (
    <div>
      <PageHeader
        title={ins.id}
        count={`${ins.discipline} · ${ins.reference}`}
        crumbs={[{ label: 'QA/QC', to: '/quality' }, { label: 'Inspections', to: '/quality/inspections' }, { label: ins.id }]}
        tag={<StatusPill status={ins.status === ins.result ? ins.result : ins.status} />}
        subtitle={`${projectName(state, ins.projectId)} · ${ins.location} · inspected ${fmtDate(ins.date)} by ${ins.inspector}`}
        actions={
          <>
            <Button icon={MessageSquarePlus} onClick={() => setNoteOpen(true)}>
              Add Observation
            </Button>
            <Button icon={RotateCcw} onClick={() => actions.requestReinspection(ins.id)} disabled={ins.result === 'Re-inspection Requested' || ins.result === 'Passed'}>
              {ins.result === 'Re-inspection Requested' ? 'Re-inspection requested' : 'Request Re-inspection'}
            </Button>
            {ins.ncrId ? (
              <Button variant="primary" icon={FileWarning} onClick={() => navigate(`/quality/ncrs/${ins.ncrId}`)}>
                Open {ins.ncrId}
              </Button>
            ) : (
              <Button variant="primary" icon={FileWarning} onClick={raise} disabled={!canRaise}>
                Raise NCR
              </Button>
            )}
          </>
        }
      />

      {canRaise && !ins.ncrId && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#f3c5c5] bg-crit-bg px-4 py-3 text-[13px] text-crit">
          <ShieldAlert className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            Inspection failed acceptance criteria. Joint is on quality hold until a non-conformance report is raised and dispositioned.
          </span>
          <Button size="sm" variant="primary" onClick={raise}>
            Raise NCR
          </Button>
        </div>
      )}
      {ncr && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px]">
          <FileWarning className="size-[18px] shrink-0 text-warn" strokeWidth={1.5} />
          <span className="min-w-0 flex-1 text-ink-2">
            Dispositioned by <LinkText to={`/quality/ncrs/${ncr.id}`}>{ncr.id}</LinkText> {ncr.title}
          </span>
          <StatusPill status={ncr.status} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <Card title="Inspection record" icon={ClipboardCheck}>
            <KeyValue
              rows={[
                { icon: Hash, label: 'Inspection ID', value: ins.id },
                { icon: FileText, label: 'Project', value: <LinkText to={`/projects/${ins.projectId}`}>{projectName(state, ins.projectId)}</LinkText> },
                { icon: Wrench, label: 'Discipline', value: ins.discipline },
                { icon: MapPin, label: 'Location', value: ins.location },
                { icon: Hash, label: isWeld ? 'Weld' : 'Reference', value: ins.reference },
                { icon: User, label: 'Inspector', value: ins.inspector },
                { icon: ClipboardCheck, label: 'Inspection type', value: ins.type },
                { icon: Calendar, label: 'Date', value: fmtDate(ins.date) },
                { icon: ShieldAlert, label: 'Status', value: <StatusPill status={ins.result} /> },
              ]}
            />
          </Card>

          <Card title="Findings" icon={ShieldAlert} subtitle={ins.findings.length ? `${ins.findings.length} recorded` : undefined} actions={<DemoTag>Illustrative criteria</DemoTag>}>
            {ins.findings.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No findings recorded" body={ins.result === 'Passed' ? 'Accepted against ITP acceptance criteria.' : 'Inspection result pending.'} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {ins.findings.map((f, idx) => {
                  const lib = FINDING_LIBRARY[f]
                  return (
                    <div key={`${f}-${idx}`} className={cx('rounded-[8px] border p-4', lib ? 'border-[#f3c5c5]' : 'border-line')}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-semibold text-ink">{lib ? f : 'Inspector observation'}</span>
                        {lib ? <SeverityPill severity={lib.severity} /> : <Pill tone="info">Note</Pill>}
                      </div>
                      {lib ? (
                        <>
                          <p className="mt-2 text-[13px] text-ink">{lib.measured}</p>
                          <p className="mt-2 text-[12px] text-ink-2">
                            <span className="font-medium text-ink-2">Acceptance criteria: </span>
                            {lib.criteria}
                          </p>
                          <p className="mt-1 text-[12px] text-ink-3">Method: {lib.method}</p>
                          <div className="mt-2">
                            <Pill tone="crit">Reject</Pill>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-[13px] text-ink">{f}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Photos" icon={Camera} subtitle={`${ins.photos.length} attached`} actions={<DemoTag>Sample image placeholder</DemoTag>}>
            {ins.photos.length === 0 ? (
              <EmptyState icon={Camera} title="No photos attached" body="Photos captured from the field app attach here automatically." />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {ins.photos.map((p, i) => (
                  <figure key={p} className="min-w-0">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-muted">
                      <SitePhoto seed={i + 2} className="absolute inset-0 h-full w-full" label={p} />
                      <span className="absolute start-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">Sample image placeholder</span>
                    </div>
                    <figcaption className="mt-1.5 text-[12px] text-ink-2">{p}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </Card>

          {isWeld && (
            <Card title="Weld data" icon={Wrench} actions={<DemoTag>Illustrative Data</DemoTag>}>
              <div className="grid gap-x-8 sm:grid-cols-2">
                <KeyValue
                  rows={[
                    { label: 'WPS / PQR', value: 'WPS-012 Rev 3 / PQR-031' },
                    { label: 'Process', value: 'SMAW root and hot pass (E8010-P1), FCAW fill and cap' },
                    { label: 'Pipe', value: '24" API 5L X65, 12.7 mm WT' },
                  ]}
                />
                <KeyValue
                  rows={[
                    { label: 'Welder / crew', value: 'Crew W-2, welder ID WQ-104' },
                    { label: 'Preheat', value: '100 °C min, recorded 95 °C' },
                    { label: 'NDT', value: ins.reference === 'W-00428' ? 'RT-00428: Reject' : 'RT 100% per ITP' },
                  ]}
                />
              </div>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <Card title="Linked records" icon={Network}>
            <div className="space-y-4">
              {wp && (
                <Link to={`/projects/${ins.projectId}?tab=progress`} className="block rounded-[8px] border border-line p-3 hover:border-line-strong">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-ink-3">Work package</span>
                    <StatusPill status={wp.status} />
                  </div>
                  <div className="mt-1 text-[14px] font-medium text-ink">{wp.name}</div>
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-2">
                    <ProgressBar value={wp.progress} marker={wp.planned} tone={wp.progress < wp.planned ? 'warn' : 'ok'} className="flex-1" />
                    <span className="tabular whitespace-nowrap">
                      {wp.progress}% vs {wp.planned}%
                    </span>
                  </div>
                </Link>
              )}
              <div>
                <div className="mb-2 text-[12px] text-ink-3">Documents linked ({docs.length})</div>
                {docs.length === 0 ? (
                  <p className="text-[13px] text-ink-3">No documents linked yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {docs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 text-[13px]">
                        <Link to="/documents" className="min-w-0 truncate text-ink hover:text-action hover:underline">
                          {d.title}
                        </Link>
                        <StatusPill status={d.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {hasRecord360 && (
                <Button className="w-full" icon={Network} onClick={() => navigate(`/record/${ins.reference}`)}>
                  View Record 360°
                </Button>
              )}
            </div>
          </Card>

          {docs.some((d) => d.fileType === 'photo' || d.fileType === 'pdf') && (
            <Card title="Attachments" icon={FileText}>
              <div className="grid grid-cols-2 gap-3">
                {docs.slice(0, 4).map((d, i) => (
                  <FileTile
                    key={d.id}
                    name={d.title}
                    type={d.fileType}
                    photoSeed={i + 3}
                    meta={`Rev ${d.revision} · ${d.status}`}
                    onClick={() => actions.toast({ title: d.title, body: 'Document preview opens in the Document Centre (demo).', tone: 'info' })}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card title="Activity" icon={History}>
            {activity.length === 0 ? (
              <p className="text-[13px] text-ink-3">No activity recorded.</p>
            ) : (
              <ol className="space-y-3">
                {activity.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-line-strong" />
                    <div className="min-w-0">
                      <div className="text-[13px] text-ink">{a.text}</div>
                      <div className="text-[12px] text-ink-3">
                        {a.time} · {a.user}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add observation"
        subtitle={`${ins.id} · ${ins.reference}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveNote} disabled={!note.trim()}>
              Add observation
            </Button>
          </>
        }
      >
        <Textarea
          rows={4}
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Interpass cleaning inadequate on adjacent joint W-00429, slag inclusions visible at 6 o'clock."
        />
        <p className="mt-2 text-[12px] text-ink-3">Observations are added to the findings and the inspection activity log.</p>
      </Modal>
    </div>
  )
}
