import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FastForward,
  FileText,
  FileWarning,
  GitBranch,
  History,
  Network,
  Save,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { NCR_STAGES, NcrAgeCell, ProjectFilterNote, SeverityPill, ncrSla, useProjectShort } from '../../components/quality/shared'
import {
  Button,
  Card,
  ChevronStepper,
  DataTable,
  DemoTag,
  EmptyState,
  Field,
  FilterChip,
  Input,
  KeyValue,
  LinkText,
  PageHeader,
  Pill,
  ProgressBar,
  Segmented,
  Select,
  StatLine,
  StatusPill,
  Textarea,
} from '../../components/ui'
import type { Step } from '../../components/ui'
import type { NCR } from '../../data/types'
import { cx, fmtDate, fmtShort, sar } from '../../lib/format'
import { inProject, ncrAge, ncrOverdue, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'

type StatusFilter = 'open' | 'closed' | 'all'

export function NcrList() {
  const { state } = useStore()
  const navigate = useNavigate()
  const short = useProjectShort()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<StatusFilter>('open')
  const [project, setProject] = useState('all')
  const [severity, setSeverity] = useState('all')
  const overdueOnly = params.get('overdue') === '1'
  const setOverdueOnly = (v: boolean) => {
    const next = new URLSearchParams(params)
    if (v) next.set('overdue', '1')
    else next.delete('overdue')
    setParams(next, { replace: true })
  }

  const base = inProject(state.ncrs, state.projectFilter)
  const rows = base
    .filter((n) => (status === 'all' ? true : status === 'closed' ? n.status === 'Closed' : n.status !== 'Closed'))
    .filter((n) => project === 'all' || n.projectId === project)
    .filter((n) => severity === 'all' || n.severity === severity)
    .filter((n) => !overdueOnly || ncrOverdue(n))
    .sort((a, b) => {
      // Newest raised first, then the oldest open items.
      if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt)
      return b.id.localeCompare(a.id)
    })
  const open = base.filter((n) => n.status !== 'Closed')
  const projectsWithNcrs = Array.from(new Set(base.map((n) => n.projectId)))

  return (
    <div>
      <PageHeader
        title="NCR register"
        count={rows.length}
        subtitle="Non-conformance reports with closure SLA tracking. Rule QA-01 escalates to the Project Director when the closure target is exceeded."
        crumbs={[{ label: 'QA/QC', to: '/quality' }, { label: 'NCRs' }]}
      />
      <ProjectFilterNote />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MiniKpi label="Open" value={open.length} />
        <MiniKpi label="Overdue" value={open.filter(ncrOverdue).length} tone="crit" onClick={() => setOverdueOnly(true)} />
        <MiniKpi label="Major / Critical" value={open.filter((n) => n.severity !== 'Minor').length} tone="warn" />
        <MiniKpi label="In verification" value={open.filter((n) => n.status === 'Verification').length} />
        <MiniKpi label="Closed (30 days)" value={base.filter((n) => n.status === 'Closed').length} tone="ok" />
      </div>
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { id: 'open', label: 'Open statuses' },
              { id: 'closed', label: 'Closed' },
              { id: 'all', label: 'All' },
            ]}
          />
          {state.projectFilter === 'all' && (
            <Select
              aria-label="Project"
              className="!h-9 w-auto min-w-[150px] text-[13px]"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              options={[{ value: 'all', label: 'All projects' }, ...projectsWithNcrs.map((p) => ({ value: p, label: short(p) }))]}
            />
          )}
          <Select
            aria-label="Severity"
            className="!h-9 w-auto min-w-[130px] text-[13px]"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={[{ value: 'all', label: 'Any severity' }, 'Critical', 'Major', 'Minor']}
          />
          <FilterChip active={overdueOnly} onClick={() => setOverdueOnly(!overdueOnly)} count={open.filter(ncrOverdue).length}>
            Overdue only
          </FilterChip>
        </div>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/quality/ncrs/${r.id}`)}
          highlight={(r) => ncrOverdue(r)}
          empty={
            <div className="p-5">
              <EmptyState icon={FileWarning} title="No NCRs match" body="Change the status, severity or overdue filter to see more records." />
            </div>
          }
          columns={[
            {
              key: 'id',
              header: 'NCR',
              render: (r) => (
                <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                  {r.id}
                  {r.createdAt === '2026-10-01' && <Pill tone="info">New</Pill>}
                </span>
              ),
            },
            { key: 't', header: 'Title', render: (r) => <span className="line-clamp-2 min-w-[180px]">{r.title}</span> },
            { key: 'p', header: 'Project', render: (r) => <span className="whitespace-nowrap">{short(r.projectId)}</span>, hideBelow: 'sm' },
            { key: 'sev', header: 'Severity', render: (r) => <SeverityPill severity={r.severity} /> },
            { key: 'd', header: 'Discipline', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.discipline}</span>, hideBelow: 'lg' },
            { key: 's', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            { key: 'age', header: 'Age / SLA', render: (r) => <NcrAgeCell ncr={r} /> },
            { key: 'resp', header: 'Responsible', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.responsible}</span>, hideBelow: 'md' },
            { key: 'due', header: 'Due', render: (r) => <span className={cx('whitespace-nowrap', ncrOverdue(r) ? 'font-medium text-crit' : 'text-ink-2')}>{fmtShort(r.dueDate)}</span>, hideBelow: 'sm' },
          ]}
        />
      </Card>
    </div>
  )
}

function MiniKpi({ label, value, tone, onClick }: { label: string; value: number; tone?: 'crit' | 'warn' | 'ok'; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={cx('rounded-[12px] border border-line bg-surface px-4 py-3 text-start', onClick && 'hover:border-line-strong')}>
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className={cx('tabular mt-1 text-[20px] font-semibold', tone === 'crit' && value > 0 ? 'text-crit' : tone === 'warn' && value > 0 ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-ink')}>{value}</div>
    </Tag>
  )
}

/* ---------------------------------------------------------------- detail */

const RESPONSIBLE = [
  'Construction Manager',
  'Welding Superintendent',
  'QA/QC Manager',
  'QA/QC Inspector',
  'Piping Superintendent',
  'Civil Superintendent',
  'Coating Supervisor',
  'Painting Supervisor',
  'E&I Supervisor',
  'Mechanical Supervisor',
  'Testing Engineer',
  'Procurement Manager',
  'O&M Supervisor',
]

const STAGE_CAPTION: Record<NCR['status'], string> = {
  Open: 'Raised, containment',
  Investigation: 'Root cause analysis',
  'CAPA Submitted': 'CAPA under approval',
  Verification: 'Repair and re-test',
  Closed: 'Verified and closed',
}

export function NcrDetail() {
  const { id = '' } = useParams()
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const ncr = state.ncrs.find((n) => n.id === id)

  if (!ncr) {
    return (
      <div>
        <PageHeader title="NCR not found" crumbs={[{ label: 'QA/QC', to: '/quality' }, { label: 'NCRs', to: '/quality/ncrs' }, { label: id }]} />
        <EmptyState
          icon={FileWarning}
          title={`No NCR with ID ${id}`}
          body="If you are following the demo journey, raise NCR-00218 from inspection INS-WLD-00428 first."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button icon={ArrowLeft} onClick={() => navigate('/quality/ncrs')}>
                NCR register
              </Button>
              <Button variant="primary" onClick={() => navigate('/quality/inspections/INS-WLD-00428')}>
                Open INS-WLD-00428
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const stageIdx = NCR_STAGES.indexOf(ncr.status)
  const next = ncr.status === 'Closed' ? null : NCR_STAGES[stageIdx + 1]
  const steps: Step[] = NCR_STAGES.map((label, i) => ({
    label,
    caption: i < stageIdx || ncr.status === 'Closed' ? 'Completed' : i === stageIdx ? STAGE_CAPTION[label] : 'Not started',
    date: i === 0 ? fmtShort(ncr.detectedAt) : i === stageIdx && i > 0 ? fmtShort(ncr.updatedAt) : undefined,
    state: ncr.status === 'Closed' || i < stageIdx ? 'done' : i === stageIdx ? 'current' : 'future',
  }))
  const sla = ncrSla(ncr)
  const escalated = ncr.status !== 'Closed' && (ncrOverdue(ncr) || !!ncr.escalated)
  const capa = ncr.capaId ? state.capas.find((c) => c.id === ncr.capaId) : undefined
  const approval = state.approvals.find((a) => a.linkId === ncr.id && a.type === 'NCR CAPA')
  const ins = ncr.inspectionId ? state.inspections.find((i) => i.id === ncr.inspectionId) : undefined
  const isDemo = ncr.inspectionId === 'INS-WLD-00428'
  const keys = [ncr.id, ncr.inspectionId, ins?.reference, ncr.capaId].filter(Boolean) as string[]
  const docs = state.documents.filter((d) => d.linkedTo.some((l) => keys.includes(l)))
  const activity = state.activities.filter((a) => a.text.includes(ncr.id) || (ncr.capaId && a.text.includes(ncr.capaId)))
  const canApprove = approval?.status === 'Pending' && (state.role === 'QA/QC Manager' || state.role === 'CEO')

  const advance = () => actions.advanceNCR(ncr.id)
  const onStep = (i: number) => {
    if (i === stageIdx + 1) advance()
    else if (i > stageIdx + 1) actions.toast({ title: 'Stages advance in sequence', body: `Complete ${next} first.`, tone: 'info' })
  }

  return (
    <div>
      <PageHeader
        title={ncr.id}
        count={ncr.title}
        crumbs={[{ label: 'QA/QC', to: '/quality' }, { label: 'NCRs', to: '/quality/ncrs' }, { label: ncr.id }]}
        tag={
          <div className="flex flex-wrap gap-2">
            <SeverityPill severity={ncr.severity} />
            <StatusPill status={ncr.status} />
          </div>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{projectName(state, ncr.projectId)}</span>
            <span className="text-ink-3">·</span>
            <span>
              Source:{' '}
              {ncr.inspectionId ? (
                <LinkText to={`/quality/inspections/${ncr.inspectionId}`}>Inspection {ncr.inspectionId}</LinkText>
              ) : (
                ncr.source
              )}
            </span>
            <span className="text-ink-3">·</span>
            <span>{ncr.discipline}</span>
          </span>
        }
        actions={
          next ? (
            <Button variant="primary" iconRight={ArrowRight} onClick={advance}>
              Advance to {next}
            </Button>
          ) : (
            <Pill tone="ok" dot>
              Closed
            </Pill>
          )
        }
      />

      {escalated && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#f3c5c5] bg-crit-bg px-4 py-3 text-[13px] text-crit">
          <AlertOctagon className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            <span className="font-semibold">Escalated to Project Director (rule QA-01).</span> Closure target of {ncr.slaDays} days exceeded by {Math.max(0, sla.age - ncr.slaDays)} days. Critical alert raised in the Alert Centre.
          </span>
          <Link to="/alerts" className="font-medium underline">
            Open Alert Centre
          </Link>
        </div>
      )}

      <Card title="Workflow" icon={GitBranch} className="mb-4" actions={next ? <span className="text-[12px] text-ink-3">Click the next stage to advance</span> : undefined}>
        <ChevronStepper steps={steps} onStepClick={next ? onStep : undefined} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <NcrForm key={`${ncr.id}-${ncr.status}-${ncr.capaId ?? ''}`} ncr={ncr} />

          <Card
            title="CAPA"
            icon={ClipboardCheck}
            subtitle={capa ? `${capa.id} · corrective and preventive action` : 'Corrective and preventive action'}
            actions={capa ? <StatusPill status={capa.status} /> : undefined}
          >
            {capa ? (
              <div className="space-y-4">
                <KeyValue
                  rows={[
                    { label: 'Root cause', value: capa.rootCause },
                    { label: 'Corrective action', value: capa.correctiveAction },
                    { label: 'Preventive action', value: capa.preventiveAction },
                    { label: 'Owner', value: capa.owner },
                    { label: 'Due', value: fmtDate(capa.dueDate) },
                    { label: 'Status', value: <StatusPill status={capa.status} /> },
                  ]}
                />
                <div>
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="text-ink-2">Implementation progress</span>
                    <span className="tabular font-semibold text-ink">{capa.progress}%</span>
                  </div>
                  <ProgressBar value={capa.progress} tone={capa.progress >= 100 ? 'ok' : 'info'} height={8} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[25, 50, 75, 100].map((v) => (
                      <Button
                        key={v}
                        size="sm"
                        variant={capa.progress === v ? 'primary' : 'secondary'}
                        disabled={capa.status === 'Closed'}
                        onClick={() => {
                          actions.updateCapaProgress(capa.id, v)
                          actions.toast({ title: `${capa.id} progress ${v}%`, body: v === 100 ? 'Ready for verification of effectiveness.' : undefined, tone: 'success' })
                        }}
                      >
                        {v}%
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[8px] bg-muted p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] text-ink-3">Approval</div>
                      <div className="text-[13px] text-ink">{approval ? `${approval.id} · approver ${approval.approver}` : 'No approval routed'}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {approval && <StatusPill status={approval.status} />}
                      {canApprove && approval && (
                        <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => actions.decideApproval(approval.id, 'Approved', 'CAPA approved from NCR record.')}>
                          Approve CAPA
                        </Button>
                      )}
                      <LinkText to="/approvals" className="text-[12px]">
                        Approval Centre
                      </LinkText>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No CAPA yet"
                body={
                  ncr.status === 'Open'
                    ? 'A CAPA record is created when the NCR reaches CAPA Submitted. Start the investigation to confirm the root cause.'
                    : 'A CAPA record is created when the NCR reaches CAPA Submitted, then routed to the QA/QC Manager in the Approval Centre.'
                }
                action={
                  next && (
                    <Button variant="primary" iconRight={ArrowRight} onClick={advance}>
                      Advance to {next}
                    </Button>
                  )
                }
              />
            )}
          </Card>

          <Card title="Activity" icon={History}>
            {activity.length === 0 ? (
              <p className="text-[13px] text-ink-3">No activity recorded for this NCR yet.</p>
            ) : (
              <ol className="space-y-3">
                {activity.slice(0, 12).map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', a.kind === 'alert' ? 'bg-crit' : 'bg-line-strong')} />
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

        <div className="min-w-0 space-y-4">
          <Card title="Closure SLA" icon={Timer} actions={<StatusLabel label={sla.label} tone={sla.tone} />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-muted px-3 py-2.5">
                <div className="text-[12px] text-ink-2">Closure target</div>
                <div className="tabular mt-0.5 text-[20px] font-semibold text-ink">{ncr.slaDays} days</div>
              </div>
              <div className="rounded-[8px] bg-muted px-3 py-2.5">
                <div className="text-[12px] text-ink-2">Age</div>
                <div className={cx('tabular mt-0.5 text-[20px] font-semibold', sla.tone === 'crit' ? 'text-crit' : 'text-ink')}>{ncrAge(ncr)} days</div>
              </div>
            </div>
            <ProgressBar value={sla.pct} tone={sla.tone === 'crit' ? 'crit' : sla.tone === 'warn' ? 'warn' : 'ok'} height={8} className="mt-4" />
            <div className="mt-2 flex justify-between text-[12px] text-ink-3">
              <span>Detected {fmtShort(ncr.detectedAt)}</span>
              <span>Due {fmtShort(ncr.dueDate)}</span>
            </div>
            <div className="mt-4 rounded-[8px] border border-dashed border-line-strong p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[12px] text-ink-2">Escalation rule QA-01: Project Director notified when age exceeds target.</span>
              </div>
              <Button size="sm" icon={FastForward} disabled={ncr.status === 'Closed'} onClick={() => actions.simulateNcrAgeing(ncr.id, 3)}>
                Simulate +3 days
              </Button>
              <DemoTag className="ms-2">Demo time travel</DemoTag>
            </div>
          </Card>

          <Card title="Impact" icon={TrendingUp}>
            <StatLine label="Cost impact" value={ncr.costImpact ? sar(ncr.costImpact) : 'Not assessed'} tone={ncr.costImpact && ncr.costImpact > 15000 ? 'warn' : undefined} />
            <StatLine label="Schedule impact" value={isDemo ? '2 days, welding front KP 42' : ncr.severity === 'Minor' ? 'None expected' : 'Under assessment'} tone={isDemo ? 'warn' : undefined} />
            <StatLine label="Hold status" value={ncr.status === 'Closed' ? 'Released' : isDemo ? 'Joint W-00428 quarantined' : 'Item on hold'} />
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-2 text-[12px] text-ink-3">Linked documents ({docs.length})</div>
              {docs.length === 0 ? (
                <p className="text-[13px] text-ink-3">No documents linked.</p>
              ) : (
                <ul className="space-y-1.5">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 text-[13px]">
                      <Link to="/documents" className="flex min-w-0 items-center gap-1.5 text-ink hover:text-action hover:underline">
                        <FileText className="size-3.5 shrink-0 text-ink-3" strokeWidth={1.5} />
                        <span className="truncate">{d.title}</span>
                      </Link>
                      <StatusPill status={d.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isDemo && (
              <Button className="mt-4 w-full" icon={Network} onClick={() => navigate('/record/W-00428')}>
                View Record 360°
              </Button>
            )}
          </Card>

          {ins && (
            <Card title="Source inspection" icon={CalendarClock}>
              <Link to={`/quality/inspections/${ins.id}`} className="block rounded-[8px] border border-line p-3 hover:border-line-strong">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-ink">{ins.id}</span>
                  <StatusPill status={ins.result} />
                </div>
                <div className="mt-1 text-[12px] text-ink-2">
                  {ins.reference} · {ins.location} · {ins.inspector}
                </div>
                <div className="mt-1 text-[12px] text-ink-3">Findings: {ins.findings.join(', ') || 'none'}</div>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusLabel({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'crit' | 'info' | 'neutral' | 'brand' }) {
  return (
    <Pill tone={tone} dot className={tone === 'crit' ? 'font-semibold' : undefined}>
      {label}
    </Pill>
  )
}

function NcrForm({ ncr }: { ncr: NCR }) {
  const { actions } = useStore()
  const [form, setForm] = useState({
    description: ncr.description,
    rootCause: ncr.rootCause,
    immediateCorrection: ncr.immediateCorrection,
    correctiveAction: ncr.correctiveAction,
    preventiveAction: ncr.preventiveAction,
    responsible: ncr.responsible,
    dueDate: ncr.dueDate,
  })
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== ncr[k])
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const responsibleOptions = RESPONSIBLE.includes(ncr.responsible) ? RESPONSIBLE : [ncr.responsible, ...RESPONSIBLE]
  const locked = ncr.status === 'Closed'

  const save = () => {
    actions.updateNCR(ncr.id, form)
    actions.toast({ title: `${ncr.id} saved`, body: 'NCR record updated and visible to all linked workflows.', tone: 'success' })
  }

  return (
    <Card
      title="NCR details"
      icon={FileWarning}
      actions={
        <Button size="sm" variant={dirty ? 'primary' : 'secondary'} icon={Save} onClick={save} disabled={!dirty || locked}>
          Save
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Description" className="md:col-span-2">
          <Textarea value={form.description} onChange={set('description')} disabled={locked} rows={3} />
        </Field>
        <Field label="Root cause" hint={!form.rootCause ? 'Confirmed during investigation (5-Why / fishbone).' : undefined}>
          <Textarea value={form.rootCause} onChange={set('rootCause')} disabled={locked} placeholder="Not yet determined" />
        </Field>
        <Field label="Immediate correction">
          <Textarea value={form.immediateCorrection} onChange={set('immediateCorrection')} disabled={locked} />
        </Field>
        <Field label="Corrective action">
          <Textarea value={form.correctiveAction} onChange={set('correctiveAction')} disabled={locked} placeholder="Defined at CAPA submission" />
        </Field>
        <Field label="Preventive action">
          <Textarea value={form.preventiveAction} onChange={set('preventiveAction')} disabled={locked} placeholder="Defined at CAPA submission" />
        </Field>
        <Field label="Responsible person">
          <Select value={form.responsible} onChange={set('responsible')} disabled={locked} options={responsibleOptions} />
        </Field>
        <Field label="Due date">
          <Input type="date" value={form.dueDate} onChange={set('dueDate')} disabled={locked} />
        </Field>
      </div>
    </Card>
  )
}
