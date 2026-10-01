import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  CloudUpload,
  Download,
  FileCheck2,
  FileText,
  FileWarning,
  FolderTree,
  Send,
  Timer,
  UserPlus,
} from 'lucide-react'
import { useStore } from '../../store/store'
import { mdrSummary, projectName } from '../../store/selectors'
import type { MdrCategory } from '../../data/types'
import { addDays, cx, daysUntil, fmtDate, num } from '../../lib/format'
import { Button, Card, DemoTag, EmptyState, Kpi, Modal, PageHeader, Pill, ProgressBar, Segmented, StatusPill } from '../../components/ui'
import type { Tone } from '../../components/ui'
import { useDocWorkflow } from '../../components/documents/useDocWorkflow'
import { DocActions } from '../../components/documents/DocActions'
import { MDR_PROJECTS } from '../../components/documents/docShared'

/* ---------- shared helpers ---------- */

const MC_PLAN: Record<string, { mc: string; currentLag: number; targetLag: number }> = {
  NPE: { mc: '2027-01-15', currentLag: 18, targetLag: 10 },
  EGC: { mc: '2027-05-20', currentLag: 22, targetLag: 10 },
  RUU: { mc: '2026-11-20', currentLag: 15, targetLag: 10 },
}

const catPct = (c: MdrCategory) => (c.required ? Math.round((c.completed / c.required) * 100) : 0)
const catMissing = (c: MdrCategory) => Math.max(0, c.required - c.completed - c.review - c.expired)
const pctTone = (p: number): Tone => (p >= 85 ? 'ok' : p >= 60 ? 'warn' : 'crit')

function useMdrProject() {
  const [sp, setSp] = useSearchParams()
  const { state } = useStore()
  const q = sp.get('project')
  const pid = q && state.mdr[q] ? q : state.mdr[state.projectFilter] ? state.projectFilter : 'NPE'
  const setPid = (id: string) => {
    const n = new URLSearchParams(sp)
    n.set('project', id)
    setSp(n, { replace: true })
  }
  return [pid, setPid] as const
}

function ProjectSwitch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { state } = useStore()
  return (
    <div className="scrollbar-thin max-w-full overflow-x-auto">
    <Segmented
      value={value}
      onChange={onChange}
      options={MDR_PROJECTS.filter((p) => state.mdr[p]).map((p) => ({ id: p, label: state.projects.find((x) => x.id === p)?.shortName ?? p }))}
    />
    </div>
  )
}

function Ring({ value, size = 132 }: { value: number; size?: number }) {
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = value >= 85 ? '#15803d' : value >= 60 ? '#d97706' : '#b91c1c'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`${Math.round(value)}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f3" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(c * Math.min(100, value)) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray .5s' }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink" style={{ fontSize: 28, fontWeight: 600 }}>
        {Math.round(value)}%
      </text>
    </svg>
  )
}

/* ---------- Handover dashboard ---------- */

export function HandoverDashboard() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [pid, setPid] = useMdrProject()
  const wf = useDocWorkflow()
  const cats = state.mdr[pid] ?? []
  const sum = mdrSummary(cats)
  const plan = MC_PLAN[pid]
  const mcDays = plan ? daysUntil(plan.mc) : null
  const missingDocs = state.documents.filter((d) => d.projectId === pid && d.status === 'Missing')
  const reviewDocs = state.documents.filter((d) => d.projectId === pid && (d.status === 'Under Review' || d.status === 'Submitted'))
  const regQs = (extra = '') => `?project=${pid}${extra}`

  return (
    <div>
      <PageHeader
        title="Handover Readiness"
        subtitle={`${projectName(state, pid)} · mechanical completion dossier (MDR)`}
        crumbs={[{ label: 'Handover', to: '/handover' }, { label: 'Readiness' }]}
        actions={
          <>
            <Button icon={FileText} onClick={() => navigate(`/handover/register${regQs()}`)}>
              Document register
            </Button>
            <Button variant="primary" icon={CloudUpload} onClick={() => wf.uploadNew({ projectId: pid })}>
              Upload document
            </Button>
          </>
        }
      />
      <div className="mb-5">
        <ProjectSwitch value={pid} onChange={setPid} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card title="Overall dossier completeness" icon={FolderTree} actions={<Pill tone={pctTone(sum.pct)}>{sum.pct.toFixed(1)}% exact</Pill>}>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <Ring value={sum.pct} />
            <div className="w-full min-w-0 flex-1">
              <div className="text-[14px] text-ink-2">
                <span className="font-semibold text-ink">{num(sum.completed)}</span> of {num(sum.required)} required documents approved and filed in the dossier.
              </div>
              <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[#eef0f3]">
                <div className="bg-ok transition-[width] duration-500" style={{ width: `${(sum.completed / sum.required) * 100}%` }} title="Completed" />
                <div className="bg-[#d97706] transition-[width] duration-500" style={{ width: `${(sum.review / sum.required) * 100}%` }} title="Under review" />
                <div className="bg-crit transition-[width] duration-500" style={{ width: `${(sum.expired / sum.required) * 100}%` }} title="Expired" />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ok" />Completed</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#d97706]" />Under review</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-crit" />Expired</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#eef0f3]" />Missing</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Mechanical completion" icon={Timer} actions={<DemoTag>Illustrative Data</DemoTag>}>
          {plan && mcDays !== null ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <div className="tabular text-[34px] leading-none font-semibold text-ink">{mcDays}</div>
                <div className="pb-1 text-[14px] text-ink-2">days to planned mechanical completion ({fmtDate(plan.mc)})</div>
              </div>
              <div className="rounded-[10px] border border-line bg-muted p-3 text-[13px]">
                <div className="text-ink-2">Mechanical completion → dossier submission</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-ink">
                  <span className="font-semibold">Current {plan.currentLag} days</span>
                  <span className="text-ink-3">vs target {plan.targetLag} days</span>
                  <Pill tone={plan.currentLag > plan.targetLag ? 'warn' : 'ok'}>{plan.currentLag > plan.targetLag ? `${plan.currentLag - plan.targetLag} days over target` : 'On target'}</Pill>
                </div>
                <div className="mt-2 text-[12px] text-ink-3">
                  Target dossier submission {fmtDate(addDays(plan.mc, plan.targetLag))}. At current pace: {fmtDate(addDays(plan.mc, plan.currentLag))}.
                </div>
              </div>
              <Link to="/playbooks" className="flex items-start gap-2 rounded-[8px] border border-dashed border-line-strong px-3 py-2.5 text-[13px] text-ink-2 hover:border-action hover:text-ink">
                <BookOpen className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                <span>
                  <span className="font-medium text-ink">Rule HO-01:</span> documents missing within 30 days of mechanical completion create actions.
                  {mcDays > 30 ? ` Activates ${fmtDate(addDays(plan.mc, -30))}.` : ' Active now.'}
                </span>
              </Link>
            </div>
          ) : (
            <EmptyState title="No completion plan" body="Mechanical completion date not set for this project." />
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Required Documents" value={num(sum.required)} icon={FileText} to={`/handover/register${regQs()}`} sub="Per MDR index" />
        <Kpi label="Completed" value={num(sum.completed)} icon={CircleCheck} tone="ok" to={`/handover/register${regQs('&status=Approved')}`} sub={`${sum.pct.toFixed(1)}% of required`} />
        <Kpi label="Missing" value={num(sum.missing)} icon={FileWarning} tone="crit" to={`/handover/missing${regQs()}`} sub={`${missingDocs.length} tracked in register`} />
        <Kpi label="Under Review" value={num(sum.review)} icon={ClipboardCheck} tone="warn" to={`/handover/register${regQs('&status=Under Review')}`} sub={`${reviewDocs.length} awaiting your decision`} />
        <Kpi label="Expired" value={num(sum.expired)} icon={CircleX} tone="crit" to={`/handover/expiring${regQs()}`} sub="Need renewal before submission" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card title="Readiness by category" icon={FolderTree} subtitle="Click a category to open the filtered document register" bodyClassName="divide-y divide-line">
          {cats.map((c) => {
            const p = catPct(c)
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => navigate(`/handover/register?category=${encodeURIComponent(c.name)}&project=${pid}`)}
                className="block w-full px-5 py-3 text-start hover:bg-[#f9fafb]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[14px] font-medium text-ink">{c.name}</span>
                  <span className={cx('tabular text-[14px] font-semibold', p >= 85 ? 'text-ok' : p >= 60 ? 'text-warn' : 'text-crit')}>{p}%</span>
                </div>
                <ProgressBar value={p} tone={pctTone(p)} className="mt-2" />
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-ink-3">
                  <span className="text-ink-2">
                    {c.completed}/{c.required} completed
                  </span>
                  <span>{c.review} review</span>
                  <span className={c.expired ? 'text-crit' : ''}>{c.expired} expired</span>
                  <span>{catMissing(c)} missing</span>
                </div>
              </button>
            )
          })}
        </Card>

        <div className="space-y-4">
          <Card
            title="Missing documents"
            icon={FileWarning}
            subtitle={`${missingDocs.length} tracked in register · ${sum.missing} missing against MDR`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => navigate(`/handover/missing${regQs()}`)}>
                View all
              </Button>
            }
            bodyClassName="divide-y divide-line"
          >
            {missingDocs.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={CircleCheck} title="No tracked missing documents" body="All register items for this project have been uploaded." />
              </div>
            ) : (
              missingDocs.map((d) => (
                <div key={d.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">{d.title}</div>
                    <div className="mt-0.5 truncate text-[12px] text-ink-3">
                      {d.id} · {d.category} · Owner {d.owner}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="primary" icon={CloudUpload} onClick={() => wf.upload(d)}>
                      Upload
                    </Button>
                    <Button
                      size="sm"
                      icon={UserPlus}
                      onClick={() =>
                        actions.toast({
                          title: `Owner assigned: ${d.owner}`,
                          body: `${d.id} assigned with due date ${fmtDate(addDays('2026-10-01', 7))}. Reminder scheduled.`,
                          tone: 'success',
                        })
                      }
                    >
                      Assign owner
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card title="Awaiting review" icon={ClipboardCheck} subtitle="Approving moves the item into the dossier count" bodyClassName="divide-y divide-line">
            {reviewDocs.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Nothing awaiting review" />
              </div>
            ) : (
              reviewDocs.map((d) => (
                <div key={d.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => wf.preview(d.id)} className="min-w-0 text-start">
                    <div className="truncate text-[14px] font-medium text-ink hover:underline">{d.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                      {d.id} <StatusPill status={d.status} />
                    </div>
                  </button>
                  <DocActions doc={d} wf={wf} compact hidePreview />
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
      {wf.modals}
    </div>
  )
}

/* ---------- MDR / Dossier ---------- */

export function MdrPage() {
  const { state, actions } = useStore()
  const [pid, setPid] = useMdrProject()
  const wf = useDocWorkflow()
  const cats = state.mdr[pid] ?? []
  const sum = mdrSummary(cats)
  const [open, setOpen] = useState<Record<string, boolean>>({ 'Welding Records': true })

  return (
    <div>
      <PageHeader
        title="MDR / Dossier"
        count={`${sum.pct.toFixed(1)}% complete`}
        subtitle={`${projectName(state, pid)} · Manufacturer / mechanical completion data record structure`}
        crumbs={[{ label: 'Handover', to: '/handover' }, { label: 'MDR / Dossier' }]}
        actions={
          <>
            <Button onClick={() => setOpen(Object.fromEntries(cats.map((c) => [c.name, !Object.values(open).some(Boolean)])))}>
              {Object.values(open).some(Boolean) ? 'Collapse all' : 'Expand all'}
            </Button>
            <Button
              variant="primary"
              icon={Download}
              onClick={() =>
                actions.toast({ title: 'Dossier index exported (simulated)', body: `${pid}-MDR-INDEX.xlsx: ${cats.length} sections, ${sum.required} line items.`, tone: 'success' })
              }
            >
              Export dossier index
            </Button>
          </>
        }
      />
      <div className="mb-5 flex min-w-0 flex-wrap items-center gap-3">
        <ProjectSwitch value={pid} onChange={setPid} />
        <span className="text-[13px] text-ink-3">
          {sum.completed} completed · {sum.review} in review · {sum.expired} expired · {sum.missing} missing
        </span>
      </div>
      <div className="space-y-3">
        {cats.map((c, i) => {
          const docs = state.documents.filter((d) => d.projectId === pid && d.category === c.name)
          const untracked = Math.max(0, c.required - docs.length)
          const p = catPct(c)
          const isOpen = !!open[c.name]
          return (
            <section key={c.name} className="rounded-[12px] border border-line bg-surface">
              <button type="button" onClick={() => setOpen({ ...open, [c.name]: !isOpen })} className="flex w-full items-center gap-4 px-5 py-4 text-start" aria-expanded={isOpen}>
                <span className="tabular hidden w-8 text-[13px] text-ink-3 sm:block">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink">{c.name}</span>
                    <span className="flex items-center gap-2 text-[13px] text-ink-2">
                      <span className="tabular">
                        {c.completed}/{c.required}
                      </span>
                      <Pill tone={pctTone(p)}>{p}%</Pill>
                    </span>
                  </div>
                  <ProgressBar value={p} tone={pctTone(p)} className="mt-2" />
                </div>
                <ChevronDown className={cx('size-5 shrink-0 text-ink-3 transition-transform', isOpen && 'rotate-180')} strokeWidth={1.5} />
              </button>
              {isOpen && (
                <div className="border-t border-line">
                  {docs.length === 0 ? (
                    <div className="px-5 py-4 text-[13px] text-ink-3">No individually tracked documents in this section yet.</div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {docs.map((d) => (
                        <li key={d.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <button type="button" className="min-w-0 text-start" onClick={() => (d.status === 'Missing' ? wf.upload(d) : wf.preview(d.id))}>
                            <div className="truncate text-[14px] text-ink hover:underline">{d.title}</div>
                            <div className="mt-0.5 text-[12px] text-ink-3">
                              {d.id} · Rev {d.revision} · {d.owner}
                            </div>
                          </button>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <StatusPill status={d.status} />
                            <DocActions doc={d} wf={wf} compact />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line bg-[#fbfbfc] px-5 py-3 text-[12px] text-ink-3">
                    <span>
                      {untracked} untracked required items (MDR line items without an individual register entry) · {c.review} in review · {c.expired} expired
                    </span>
                    <Link to={`/handover/register?category=${encodeURIComponent(c.name)}&project=${pid}`} className="font-medium text-action hover:underline">
                      Open in register
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>
      {wf.modals}
    </div>
  )
}

/* ---------- Submission readiness ---------- */

interface Criterion {
  label: string
  detail: string
  pass: boolean
}

function criteriaFor(cats: MdrCategory[]): Criterion[] {
  const sum = mdrSummary(cats)
  const below = cats.filter((c) => catPct(c) < 95)
  const punch = cats.find((c) => c.name === 'Punch Closure')
  const client = cats.find((c) => c.name === 'Client Approvals')
  return [
    { label: 'All categories ≥ 95% complete', detail: below.length ? `${below.length} of ${cats.length} categories below 95%` : 'All categories meet threshold', pass: below.length === 0 },
    { label: 'No expired documents', detail: sum.expired ? `${sum.expired} expired documents in dossier` : 'No expired documents', pass: sum.expired === 0 },
    { label: 'Punch closure certificates', detail: punch ? `${punch.completed}/${punch.required} certificates issued` : 'Not tracked', pass: !!punch && punch.completed >= punch.required },
    { label: 'Client approvals', detail: client ? `${client.completed}/${client.required} approvals received` : 'Not tracked', pass: !!client && client.completed >= client.required },
    { label: 'No documents awaiting review', detail: sum.review ? `${sum.review} documents still in review` : 'Review queue clear', pass: sum.review === 0 },
  ]
}

export function SubmissionReadiness() {
  const { state, actions } = useStore()
  const [transmittal, setTransmittal] = useState<string | null>(null)
  const ids = MDR_PROJECTS.filter((p) => state.mdr[p] && (state.projectFilter === 'all' || state.projectFilter === p || !state.mdr[state.projectFilter]))
  const tCats = transmittal ? state.mdr[transmittal] ?? [] : []
  const tSum = mdrSummary(tCats)

  return (
    <div>
      <PageHeader
        title="Submission Readiness"
        subtitle="Dossier submission criteria per project. Criteria are evaluated live against the MDR."
        crumbs={[{ label: 'Handover', to: '/handover' }, { label: 'Submission readiness' }]}
        tag={<DemoTag>Illustrative criteria</DemoTag>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {ids.map((pid) => {
          const cats = state.mdr[pid]
          const sum = mdrSummary(cats)
          const crit = criteriaFor(cats)
          const passed = crit.filter((c) => c.pass).length
          const ready = passed === crit.length
          return (
            <Card key={pid} title={projectName(state, pid)} subtitle={`${pid} · ${sum.pct.toFixed(1)}% dossier complete`} icon={FileCheck2}>
              <div className={cx('mb-4 rounded-[10px] border px-4 py-3', ready ? 'border-ok/30 bg-ok-bg' : 'border-[#f3c5c5] bg-crit-bg')}>
                <div className="text-[12px] text-ink-2">Ready to submit?</div>
                <div className={cx('mt-0.5 text-[18px] font-semibold', ready ? 'text-ok' : 'text-crit')}>{ready ? 'Yes, ready for submission' : 'Not yet'}</div>
                <div className="mt-1 text-[12px] text-ink-2">
                  {passed} of {crit.length} criteria met
                </div>
              </div>
              <ul className="divide-y divide-line">
                {crit.map((c) => (
                  <li key={c.label} className="flex items-start gap-3 py-2.5">
                    {c.pass ? <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-ok" strokeWidth={1.5} /> : <CircleX className="mt-0.5 size-[18px] shrink-0 text-crit" strokeWidth={1.5} />}
                    <div className="min-w-0">
                      <div className="text-[14px] text-ink">{c.label}</div>
                      <div className="text-[12px] text-ink-3">{c.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" icon={Send} onClick={() => setTransmittal(pid)}>
                  Generate submission transmittal
                </Button>
                <Link to={`/handover?project=${pid}`} className="inline-flex h-9 items-center px-2 text-[13px] font-medium text-action hover:underline">
                  Open dashboard
                </Link>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={!!transmittal}
        onClose={() => setTransmittal(null)}
        width={720}
        title="Submission transmittal (preview)"
        subtitle={transmittal ? `${transmittal} · ${projectName(state, transmittal)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransmittal(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={Send}
              onClick={() => {
                actions.toast({
                  title: `Transmittal TR-${transmittal}-HO-0007 generated (simulated)`,
                  body: tSum.pct < 95 ? `Issued as partial submission: ${tSum.required - tSum.completed} items outstanding.` : 'Issued as full dossier submission.',
                  tone: 'success',
                })
                setTransmittal(null)
              }}
            >
              Issue transmittal
            </Button>
          </>
        }
      >
        {transmittal && (
          <div className="rounded-[8px] border border-line p-4 text-[13px]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
              <div>
                <div className="caps text-[11px] text-ink-3">SHQ Group · Document transmittal</div>
                <div className="mt-1 text-[16px] font-semibold text-ink">TR-{transmittal}-HO-0007</div>
              </div>
              <div className="text-end text-[12px] text-ink-2">
                <div>Date {fmtDate('2026-10-01')}</div>
                <div>To: {state.projects.find((p) => p.id === transmittal)?.client ?? 'Client'}</div>
                <div>Purpose: {tSum.pct >= 95 ? 'Final dossier submission' : 'Partial submission for information'}</div>
              </div>
            </div>
            <table className="mt-3 w-full text-[12px]">
              <thead>
                <tr className="text-ink-3">
                  <th className="caps py-1.5 text-start text-[10px] font-medium">Section</th>
                  <th className="caps py-1.5 text-end text-[10px] font-medium">Enclosed</th>
                  <th className="caps py-1.5 text-end text-[10px] font-medium">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {tCats.map((c, i) => (
                  <tr key={c.name} className="border-t border-line">
                    <td className="py-1.5 text-ink">
                      {String(i + 1).padStart(2, '0')} {c.name}
                    </td>
                    <td className="tabular py-1.5 text-end text-ink">{c.completed}</td>
                    <td className={cx('tabular py-1.5 text-end', c.required - c.completed ? 'text-crit' : 'text-ok')}>{c.required - c.completed}</td>
                  </tr>
                ))}
                <tr className="border-t border-line-strong font-semibold">
                  <td className="py-1.5">Total</td>
                  <td className="tabular py-1.5 text-end">{tSum.completed}</td>
                  <td className="tabular py-1.5 text-end">{tSum.required - tSum.completed}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-3">
              <span>Prepared by Document Controller · Reviewed by QA/QC Manager</span>
              <DemoTag>Simulated transmittal</DemoTag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
