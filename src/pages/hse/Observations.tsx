import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CircleCheck,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  History,
  MapPin,
  Plus,
  ShieldAlert,
  Siren,
  Smartphone,
  Sparkles,
  Tag,
  User,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { hseCategories } from '../../data/hse'
import type { Observation } from '../../data/types'
import { DEMO_TODAY, addDays, cx, fmtDate, fmtShort } from '../../lib/format'
import { inProject, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import {
  Button,
  Card,
  DataTable,
  DemoTag,
  EmptyState,
  Field,
  Input,
  KeyValue,
  LevelPill,
  Loading,
  Modal,
  PageHeader,
  Pill,
  ProgressBar,
  Select,
  StatusPill,
  Tabs,
} from '../../components/ui'
import type { Column } from '../../components/ui'
import { HazardPhoto, ObservationPhoto } from '../../components/hse/HazardPhoto'
import { HSE_ASSIGNEES, NewObservationModal } from '../../components/hse/ObservationForm'
import { FieldAppPill } from '../../components/hse/FieldAppPill'

const DEMO_AI: NonNullable<Observation['ai']> = {
  detection: 'Potential suspended-load exposure detected.',
  confidence: 94,
  risk: 'High',
  recommendation: 'Stop activity and establish exclusion zone before resuming lifting operation.',
  detected: ['Worker', 'Crane hook', 'Suspended load', 'Exclusion zone not visible'],
  hazards: ['Suspended load', 'Line-of-fire exposure', 'Inadequate exclusion zone'],
  controls: ['Establish exclusion zone', 'Assign spotter', 'Stop work until control is verified'],
}

/* ---------------- list ---------------- */

type StatusFilter = 'all' | 'open' | 'Open' | 'Action Assigned' | 'Escalated' | 'In Progress' | 'Closed'

export function ObservationsList() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [newOpen, setNewOpen] = useState(false)
  const status = (params.get('status') as StatusFilter) ?? 'all'
  const severity = params.get('severity') ?? 'all'
  const category = params.get('category') ?? 'all'
  const project = params.get('project') ?? 'all'
  const source = params.get('source') ?? 'all'

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v === 'all') next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const base = inProject(state.observations, state.projectFilter)
  const rows = base.filter(
    (o) =>
      (status === 'all' || (status === 'open' ? o.status !== 'Closed' : o.status === status)) &&
      (severity === 'all' || (severity === 'High' ? o.severity === 'High' || o.severity === 'Critical' : o.severity === severity)) &&
      (category === 'all' || o.category === category) &&
      (project === 'all' || o.projectId === project) &&
      (source === 'all' || o.source === source),
  )
  const anyFilter = [status, severity, category, project, source].some((v) => v !== 'all')

  const cols: Column<Observation>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (o) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-medium">{o.id}</span>
          {o.ai && <Sparkles className="size-3.5 text-[#5b3fb5]" strokeWidth={1.75} aria-label="AI flagged" />}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Observation',
      render: (o) => (
        <div className="min-w-[220px]">
          <div className="text-ink">{o.title}</div>
          <div className="text-[12px] text-ink-3">{o.location}</div>
        </div>
      ),
    },
    { key: 'cat', header: 'Category', render: (o) => <span className="whitespace-nowrap text-ink-2">{o.category}</span>, hideBelow: 'md' },
    { key: 'sev', header: 'Severity', render: (o) => <StatusPill status={o.severity} /> },
    { key: 'proj', header: 'Project', render: (o) => <span className="whitespace-nowrap text-ink-2">{o.projectId}</span>, hideBelow: 'lg' },
    { key: 'src', header: 'Source', render: (o) => (o.source === 'Field App' ? <FieldAppPill /> : <Pill>Web</Pill>), hideBelow: 'md' },
    { key: 'due', header: 'Due', render: (o) => <span className="whitespace-nowrap text-ink-2">{fmtShort(o.dueDate)}</span>, hideBelow: 'sm' },
    { key: 'status', header: 'Status', render: (o) => <StatusPill status={o.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Observations"
        count={rows.length}
        crumbs={[{ label: 'HSE', to: '/hse' }, { label: 'Observations' }]}
        subtitle="Every observation from web and field app, with action and escalation status."
        tag={state.projectFilter !== 'all' ? <Pill tone="info">{projectName(state, state.projectFilter)}</Pill> : undefined}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setNewOpen(true)}>
            New Observation
          </Button>
        }
      />
      <Card bodyClassName="p-0">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-3 xl:grid-cols-6">
          <Select
            aria-label="Status"
            value={status}
            onChange={(e) => setParam('status', e.target.value)}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'open', label: 'All open' },
              'Open',
              'Action Assigned',
              'In Progress',
              'Escalated',
              'Closed',
            ]}
          />
          <Select
            aria-label="Severity"
            value={severity}
            onChange={(e) => setParam('severity', e.target.value)}
            options={[{ value: 'all', label: 'All severities' }, { value: 'High', label: 'High and Critical' }, 'Medium', 'Low']}
          />
          <Select aria-label="Category" value={category} onChange={(e) => setParam('category', e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...hseCategories]} />
          <Select
            aria-label="Project"
            value={project}
            onChange={(e) => setParam('project', e.target.value)}
            options={[{ value: 'all', label: 'All projects' }, ...Array.from(new Set(base.map((o) => o.projectId))).map((id) => ({ value: id, label: projectName(state, id) }))]}
          />
          <Select aria-label="Source" value={source} onChange={(e) => setParam('source', e.target.value)} options={[{ value: 'all', label: 'All sources' }, 'Web', 'Field App']} />
          <Button variant="ghost" disabled={!anyFilter} onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            Clear filters
          </Button>
        </div>
        <DataTable
          columns={cols}
          rows={rows}
          rowKey={(o) => o.id}
          onRowClick={(o) => navigate(`/hse/observations/${o.id}`)}
          highlight={(o) => o.status !== 'Closed' && (o.severity === 'High' || o.severity === 'Critical')}
          empty={
            <div className="p-5">
              <EmptyState icon={ShieldAlert} title="No observations match" body="Try clearing a filter or switching the project selector to All projects." />
            </div>
          }
        />
      </Card>
      <NewObservationModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}

/* ---------------- detail ---------------- */

export function ObservationDetail() {
  const { id = '' } = useParams()
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const o = state.observations.find((x) => x.id === id)
  const [showDet, setShowDet] = useState(true)
  const [actionOpen, setActionOpen] = useState(false)
  const [demoRun, setDemoRun] = useState<'idle' | 'running' | 'done'>('idle')
  const [tab, setTab] = useState<'actions' | 'alerts' | 'activity'>('actions')

  useEffect(() => {
    if (demoRun !== 'running') return
    const t = window.setTimeout(() => setDemoRun('done'), 1100)
    return () => window.clearTimeout(t)
  }, [demoRun])

  if (!o)
    return (
      <div className="mx-auto max-w-xl py-12">
        <EmptyState
          icon={ShieldAlert}
          title={`Observation ${id} not found`}
          body="It may have been removed, or the link is from another demo session."
          action={
            <Button icon={ArrowLeft} onClick={() => navigate('/hse/observations')}>
              Back to observations
            </Button>
          }
        />
      </div>
    )

  const ai = o.ai ?? (demoRun === 'done' ? DEMO_AI : undefined)
  const linkedActions = state.actions.filter((a) => a.sourceId === o.id)
  const linkedAlerts = state.alerts.filter((a) => a.sourceId === o.id)
  const activity = state.activities.filter((a) => a.link?.endsWith(`/${o.id}`) || a.text.includes(o.id))
  const closed = o.status === 'Closed'
  const accepted = linkedActions.some((a) => a.title === ai?.recommendation)
  const photoKey = o.photo ?? (ai ? 'suspended-load' : undefined)

  const details = (
    <Card title="Observation details" icon={FileText}>
      <KeyValue
        rows={[
          { icon: MapPin, label: 'Location', value: o.location },
          { icon: Tag, label: 'Category', value: o.category },
          { icon: ShieldAlert, label: 'Severity', value: <StatusPill status={o.severity} /> },
          { icon: FileText, label: 'Description', value: o.description },
          { icon: Wrench, label: 'Immediate action', value: o.immediateAction || '—' },
          { icon: UserCheck, label: 'Assigned to', value: o.assignedTo },
          { icon: Calendar, label: 'Due date', value: fmtDate(o.dueDate) },
          { icon: User, label: 'Reported by', value: `${o.reportedBy} · ${fmtDate(o.createdAt)}` },
          { icon: Smartphone, label: 'Source', value: o.source === 'Field App' ? <FieldAppPill /> : <Pill>Web</Pill> },
          { icon: ClipboardList, label: 'Project', value: projectName(state, o.projectId) },
        ]}
      />
    </Card>
  )

  const linked = (
    <Card bodyClassName="p-0">
      <Tabs
        className="px-3"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'actions', label: 'Linked actions', icon: ClipboardList, count: linkedActions.length },
          { id: 'alerts', label: 'Alerts', icon: Bell, count: linkedAlerts.length },
          { id: 'activity', label: 'Activity', icon: History, count: activity.length },
        ]}
      />
      <div className="p-4">
        {tab === 'actions' &&
          (linkedActions.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No actions yet" body="Accept the recommendation or create an action to assign corrective work." />
          ) : (
            <ul className="divide-y divide-line">
              {linkedActions.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1 basis-52">
                    <div className="text-[12px] text-ink-3">
                      {a.id} · {a.owner} · Due {fmtShort(a.dueDate)}
                    </div>
                    <div className="text-[14px] text-ink">{a.title}</div>
                  </div>
                  <StatusPill status={a.status} />
                  {a.status !== 'Closed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        actions.setActionStatus(a.id, a.status === 'In Progress' ? 'Closed' : 'In Progress')
                        actions.toast({ title: `${a.id} ${a.status === 'In Progress' ? 'closed' : 'started'}`, tone: 'success' })
                      }}
                    >
                      {a.status === 'In Progress' ? 'Mark done' : 'Start'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ))}
        {tab === 'alerts' &&
          (linkedAlerts.length === 0 ? (
            <EmptyState icon={Bell} title="No alerts raised" body="High or Critical observations raise a leadership alert automatically." />
          ) : (
            <ul className="divide-y divide-line">
              {linkedAlerts.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => navigate('/alerts')} className="flex w-full flex-wrap items-center gap-3 py-3 text-start hover:bg-[#f9fafb]">
                    <LevelPill level={a.level} />
                    <span className="min-w-0 flex-1 basis-52">
                      <span className="block text-[14px] text-ink">{a.title}</span>
                      <span className="block text-[12px] text-ink-3">
                        {a.id} · {a.source} · Escalation: {a.escalation}
                      </span>
                    </span>
                    <StatusPill status={a.status} />
                  </button>
                </li>
              ))}
            </ul>
          ))}
        {tab === 'activity' &&
          (activity.length === 0 ? (
            <EmptyState icon={History} title="No activity logged yet" body="Actions taken on this observation are recorded here." />
          ) : (
            <ol className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-action" />
                  <div className="min-w-0">
                    <div className="text-[14px] text-ink">{a.text}</div>
                    <div className="text-[12px] text-ink-3">
                      {a.time} · {a.user}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ))}
      </div>
    </Card>
  )

  return (
    <div>
      <PageHeader
        title={o.title}
        crumbs={[{ label: 'HSE', to: '/hse' }, { label: 'Observations', to: '/hse/observations' }, { label: o.id }]}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{o.id}</span>
            <span className="text-ink-3">·</span>
            <span>{projectName(state, o.projectId)}</span>
            <StatusPill status={o.status} />
            <StatusPill status={`${o.severity} severity`} />
            {o.source === 'Field App' && <FieldAppPill />}
          </span>
        }
        actions={
          !closed && linkedActions.length > 0 ? (
            <Button variant="success" icon={CircleCheck} onClick={() => actions.closeObservation(o.id)}>
              Close observation
            </Button>
          ) : closed ? (
            <Pill tone="ok" dot>
              Closed, actions and alerts resolved
            </Pill>
          ) : undefined
        }
      />

      {photoKey || ai ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <Card
            title="Photo review"
            icon={Eye}
            actions={
              ai && photoKey === 'suspended-load' ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={showDet}
                  onClick={() => setShowDet((v) => !v)}
                  className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink"
                >
                  {showDet ? <Eye className="size-4" strokeWidth={1.5} /> : <EyeOff className="size-4" strokeWidth={1.5} />}
                  Show detections
                  <span className={cx('relative h-5 w-9 rounded-full transition-colors', showDet ? 'bg-action' : 'bg-line-strong')}>
                    <span className={cx('absolute top-0.5 size-4 rounded-full bg-white transition-all', showDet ? 'start-[18px]' : 'start-0.5')} />
                  </span>
                </button>
              ) : undefined
            }
            bodyClassName="p-0"
          >
            <div className="overflow-hidden bg-muted">
              {photoKey ? (
                <ObservationPhoto photo={photoKey} showDetections={!!ai && showDet} className="aspect-[16/10] w-full" />
              ) : (
                <HazardPhoto className="aspect-[16/10] w-full" />
              )}
            </div>
            <p className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 text-[12px] text-ink-3">
              <DemoTag>Illustrative image</DemoTag>
              Sample image placeholder. Simulated detection: no computer vision is running.
            </p>
          </Card>

          {ai ? (
            <AiPanel
              ai={ai}
              closed={closed}
              accepted={accepted}
              escalated={o.status === 'Escalated'}
              onAccept={() => actions.acceptRecommendation(o.id)}
              onCreate={() => setActionOpen(true)}
              onEscalate={() => actions.escalateObservation(o.id)}
            />
          ) : (
            <RunDemoCard category={o.category} running={demoRun === 'running'} onRun={() => setDemoRun('running')} />
          )}
        </div>
      ) : (
        o.category === 'Suspended Load' &&
        !closed && (
          <div className="mb-4">
            <RunDemoCard category={o.category} running={demoRun === 'running'} onRun={() => setDemoRun('running')} />
          </div>
        )
      )}

      {!ai && (
        <div className="mb-4 flex flex-wrap gap-2">
          {!closed && (
            <>
              <Button variant="primary" icon={Plus} onClick={() => setActionOpen(true)}>
                Create Action
              </Button>
              <Button variant="danger" icon={Siren} onClick={() => actions.escalateObservation(o.id)} disabled={o.status === 'Escalated'}>
                {o.status === 'Escalated' ? 'Escalated' : 'Escalate'}
              </Button>
            </>
          )}
        </div>
      )}

      <div className={cx('grid items-start gap-4 lg:grid-cols-2', (photoKey || ai) && 'mt-4')}>
        {details}
        {linked}
      </div>

      <CreateActionModal
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        defaultTitle={ai ? 'Establish exclusion zone and assign banksman before resuming lift' : `Close out ${o.category.toLowerCase()} hazard at ${o.location}`}
        defaultOwner={o.assignedTo}
        onSubmit={(title, owner, due) => actions.createObsAction(o.id, title, owner, due)}
      />
    </div>
  )
}

function RunDemoCard({ category, running, onRun }: { category: string; running: boolean; onRun: () => void }) {
  if (category !== 'Suspended Load')
    return (
      <Card title="Hazard analysis" icon={Sparkles}>
        <EmptyState icon={Sparkles} title="No demo analysis for this category" body="The demo hazard analysis is configured for suspended-load observations only." />
      </Card>
    )
  return (
    <Card title="AI Hazard Analysis" icon={Sparkles} actions={<DemoTag>Demo AI Analysis</DemoTag>}>
      {running ? (
        <div>
          <p className="mb-3 text-[13px] text-ink-2">Running demo hazard analysis…</p>
          <Loading lines={5} />
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="Not analysed yet"
          body="Run the demo hazard analysis to see simulated detections and recommended controls."
          action={
            <Button variant="primary" icon={Sparkles} onClick={onRun}>
              Run demo hazard analysis
            </Button>
          }
        />
      )}
    </Card>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <div className="caps mb-1.5 text-[11px] text-ink-3">{label}</div>
      {children}
    </div>
  )
}

function AiPanel({
  ai,
  closed,
  accepted,
  escalated,
  onAccept,
  onCreate,
  onEscalate,
}: {
  ai: NonNullable<Observation['ai']>
  closed: boolean
  accepted: boolean
  escalated: boolean
  onAccept: () => void
  onCreate: () => void
  onEscalate: () => void
}) {
  return (
    <Card title="AI Hazard Analysis" icon={Sparkles} actions={<DemoTag>Demo AI Analysis</DemoTag>} className="anim-fade">
      <Section label="AI detection">
        <p className="text-[15px] font-semibold text-ink">{ai.detection}</p>
      </Section>
      <Section label="Confidence">
        <div className="flex items-center gap-3">
          <ProgressBar value={ai.confidence} tone="info" height={8} className="flex-1" />
          <span className="tabular text-[14px] font-semibold text-ink">{ai.confidence}%</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
          Risk <StatusPill status={ai.risk} /> Severity <StatusPill status={ai.risk} />
        </div>
      </Section>
      <Section label="Detected">
        <ul className="flex flex-wrap gap-1.5">
          {ai.detected.map((d) => {
            const missing = /not visible/i.test(d)
            return (
              <li key={d}>
                <Pill tone={missing ? 'crit' : 'neutral'} dot={missing}>
                  {d}
                </Pill>
              </li>
            )
          })}
        </ul>
      </Section>
      <Section label="Potential hazards">
        <ol className="space-y-1">
          {ai.hazards.map((h, i) => (
            <li key={h} className="flex gap-2 text-[14px] text-ink">
              <span className="tabular flex size-5 shrink-0 items-center justify-center rounded-full bg-crit-bg text-[11px] font-semibold text-crit">{i + 1}</span>
              {h}
            </li>
          ))}
        </ol>
      </Section>
      <Section label="Recommended controls">
        <ul className="space-y-1">
          {ai.controls.map((c) => (
            <li key={c} className="flex gap-2 text-[14px] text-ink">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={2} />
              {c}
            </li>
          ))}
        </ul>
      </Section>
      <Section label="Recommended action">
        <p className="rounded-[8px] bg-warn-bg px-3 py-2.5 text-[14px] font-medium text-[#7c2d12]">{ai.recommendation}</p>
      </Section>
      {!closed && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant={accepted ? 'secondary' : 'primary'} icon={accepted ? Check : Sparkles} onClick={onAccept} disabled={accepted}>
            {accepted ? 'Recommendation accepted' : 'Accept Recommendation'}
          </Button>
          <Button icon={Plus} onClick={onCreate}>
            Create Action
          </Button>
          <Button variant="danger" icon={Siren} onClick={onEscalate} disabled={escalated}>
            {escalated ? 'Escalated' : 'Escalate'}
          </Button>
        </div>
      )}
      <p className="mt-3 text-[12px] text-ink-3">Simulated analysis for demonstration. A competent person must verify every hazard on site.</p>
    </Card>
  )
}

function CreateActionModal({
  open,
  onClose,
  defaultTitle,
  defaultOwner,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  defaultTitle: string
  defaultOwner: string
  onSubmit: (title: string, owner: string, due: string) => void
}) {
  const [title, setTitle] = useState(defaultTitle)
  const [owner, setOwner] = useState(defaultOwner)
  const [due, setDue] = useState(DEMO_TODAY)
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle)
      setOwner(defaultOwner)
      setDue(DEMO_TODAY)
    }
  }, [open, defaultTitle, defaultOwner])
  const owners = HSE_ASSIGNEES.includes(defaultOwner) ? HSE_ASSIGNEES : [defaultOwner, ...HSE_ASSIGNEES]
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create action"
      subtitle="Assign a corrective action linked to this observation."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={title.trim().length < 4}
            onClick={() => {
              onSubmit(title.trim(), owner, due)
              onClose()
            }}
          >
            Create action
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="Action">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Owner">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)} options={owners} />
          </Field>
          <Field label="Due date">
            <Select
              value={due}
              onChange={(e) => setDue(e.target.value)}
              options={[
                { value: DEMO_TODAY, label: `Today, ${fmtShort(DEMO_TODAY)}` },
                { value: addDays(DEMO_TODAY, 1), label: `Tomorrow, ${fmtShort(addDays(DEMO_TODAY, 1))}` },
                { value: addDays(DEMO_TODAY, 3), label: `In 3 days, ${fmtShort(addDays(DEMO_TODAY, 3))}` },
                { value: addDays(DEMO_TODAY, 7), label: `In 1 week, ${fmtShort(addDays(DEMO_TODAY, 7))}` },
              ]}
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
