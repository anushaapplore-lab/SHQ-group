import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Activity as ActivityIcon,
  AlertTriangle,
  CalendarRange,
  ClipboardList,
  Coins,
  FileStack,
  FolderOpen,
  HardHat,
  LayoutGrid,
  PackageSearch,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  X,
} from 'lucide-react'
import type { DPR, Project } from '../../data/types'
import { useStore } from '../../store/store'
import { Button, Card, ChevronStepper, DemoTag, EmptyState, Kpi, PageHeader, RagBadge, Tabs, toneText } from '../../components/ui'
import { DprModal } from '../../components/projects/DprForm'
import { WorkPackageTable } from '../../components/projects/WorkPackageTable'
import { GanttChart, SCurveChart } from '../../components/projects/Gantt'
import { ActivityTimeline } from '../../components/projects/ActivityTimeline'
import { CostTab, DocumentsTab, HandoverTab, HseTab, ManpowerTab, OverviewTab, ProcurementTab, QaTab, RisksTab } from '../../components/projects/ProjectTabs'
import type { TabId } from '../../components/projects/ProjectTabs'
import { fp, phaseSteps, signedPct, variance, varianceTone } from '../../components/projects/projectMath'

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'schedule', label: 'Schedule', icon: CalendarRange },
  { id: 'cost', label: 'Cost', icon: Coins },
  { id: 'qaqc', label: 'QA/QC', icon: ShieldCheck },
  { id: 'hse', label: 'HSE', icon: HardHat },
  { id: 'manpower', label: 'Manpower', icon: Users },
  { id: 'procurement', label: 'Procurement', icon: PackageSearch },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'risks', label: 'Risks', icon: AlertTriangle },
  { id: 'handover', label: 'Handover', icon: FileStack },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
]

export function ProjectDetail() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { state } = useStore()
  const [dprOpen, setDprOpen] = useState(false)
  const [lastDpr, setLastDpr] = useState<DPR | null>(null)
  const project = state.projects.find((p) => p.id === id)

  if (!project) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Project not found"
        body={`No project with id "${id}" exists in the portfolio.`}
        action={<Button onClick={() => navigate('/projects')}>Back to projects</Button>}
        className="mt-10"
      />
    )
  }

  const raw = (params.get('tab') ?? 'overview').toLowerCase()
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'overview'
  const setTab = (t: TabId) => {
    const next = new URLSearchParams(params)
    if (t === 'overview') next.delete('tab')
    else next.set('tab', t)
    setParams(next)
  }
  const p = project

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: p.name }]}
        title={p.name}
        tag={<RagBadge rag={p.rag} />}
        subtitle={
          <span className="block">
            {p.code} · {p.type} · {p.location} · {p.client} · PM {p.manager}
          </span>
        }
        actions={
          <>
            <Button icon={Sparkles} onClick={() => window.dispatchEvent(new Event('shq:open-ai'))}>
              Ask AI
            </Button>
            {p.id === 'NPE' && (
              <Button icon={Video} onClick={() => navigate('/record/W-00428')}>
                Record 360°
              </Button>
            )}
            {p.type === 'Construction' && (
              <Button variant="primary" icon={Plus} onClick={() => setDprOpen(true)}>
                Create Daily Report
              </Button>
            )}
          </>
        }
      />

      <ChevronStepper steps={phaseSteps(p.phases)} className="mb-6" onStepClick={(i) => setTab(i <= 1 ? 'overview' : i === 2 ? 'progress' : i === 5 ? 'handover' : 'schedule')} />

      {lastDpr && (
        <div className="anim-fade mb-4 rounded-[12px] border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold text-ink">{lastDpr.id} submitted</span>
                <DemoTag>Demo AI Analysis</DemoTag>
              </div>
              <p className="mt-1.5 text-[14px] text-ink">{lastDpr.aiSummary}</p>
            </div>
            <button type="button" aria-label="Dismiss" onClick={() => setLastDpr(null)} className="rounded-[6px] p-1 text-ink-3 hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-5" />

      <div key={tab} className="anim-fade">
        {tab === 'overview' && <OverviewTab project={p} onTab={setTab} />}
        {tab === 'progress' && <ProgressTab project={p} />}
        {tab === 'schedule' && <ScheduleTab project={p} />}
        {tab === 'cost' && <CostTab project={p} />}
        {tab === 'qaqc' && <QaTab project={p} />}
        {tab === 'hse' && <HseTab project={p} />}
        {tab === 'manpower' && <ManpowerTab project={p} />}
        {tab === 'procurement' && <ProcurementTab project={p} />}
        {tab === 'documents' && <DocumentsTab project={p} />}
        {tab === 'risks' && <RisksTab project={p} />}
        {tab === 'handover' && <HandoverTab project={p} />}
        {tab === 'activity' && (
          <Card title="Project activity" subtitle="Events across QA/QC, HSE, procurement, documents and field app">
            <ActivityTimeline items={state.activities.filter((a) => a.projectId === p.id)} />
          </Card>
        )}
      </div>

      <DprModal
        open={dprOpen}
        onClose={() => setDprOpen(false)}
        defaultProjectId={p.id}
        onCreated={(d) => {
          setLastDpr(d)
          if (d.projectId !== p.id) navigate(`/projects/${d.projectId}?tab=progress`)
          else setTab('progress')
        }}
      />
    </div>
  )
}

function ProgressTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const wps = state.workPackages.filter((w) => w.projectId === p.id)
  const delayed = wps.filter((w) => variance(w) <= -5)
  const causes = wps.filter((w) => w.delayCause)
  const v = variance(p)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Actual progress" value={`${fp(p.progress)}%`} icon={TrendingUp} />
        <Kpi label="Planned progress" value={`${p.planned}%`} />
        <Kpi label="Variance" value={<span className={toneText(varianceTone(v))}>{signedPct(v)}</span>} sub={`${Math.abs(p.scheduleVarianceDays)} days ${p.scheduleVarianceDays < 0 ? 'behind' : 'ahead'}`} />
        <Kpi label="Delayed work packages" value={delayed.length} sub={`of ${wps.length} packages (variance ≤ −5%)`} tone={delayed.length ? 'crit' : 'ok'} />
      </div>
      <Card
        title="Work packages"
        subtitle="Click a work package for delay causes and linked records"
        icon={ClipboardList}
        actions={
          <Button size="sm" variant="ghost" onClick={() => navigate('/projects/dpr')}>
            Daily reports
          </Button>
        }
        bodyClassName="p-0"
      >
        <WorkPackageTable rows={wps} />
      </Card>
      {causes.length > 0 && (
        <Card title="Delay causes" subtitle="Recorded against work packages">
          <ul className="grid gap-3 md:grid-cols-2">
            {causes.map((w) => (
              <li key={w.id} className="rounded-[8px] bg-muted p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink">{w.name}</span>
                  <span className={`tabular text-[12px] font-semibold ${toneText(varianceTone(variance(w)))}`}>{signedPct(variance(w))}</span>
                </div>
                <div className="mt-1 text-[13px] text-ink">{w.delayCause}</div>
                <div className="mt-1 text-[12px] text-ink-3">
                  {w.affected} · {w.action} · {w.actionOwner}
                  {w.impactDays ? ` · ${w.impactDays} d impact` : ''}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function ScheduleTab({ project: p }: { project: Project }) {
  const { state } = useStore()
  const wps = state.workPackages.filter((w) => w.projectId === p.id)
  return (
    <div className="space-y-4">
      <Card title="Schedule timeline" subtitle="Baseline vs actual and forecast; click a bar for details" bodyClassName="p-0">
        <GanttChart rows={wps} />
      </Card>
      <Card title="S-curve" subtitle="Cumulative planned vs actual progress" actions={<DemoTag>Illustrative curve</DemoTag>}>
        <SCurveChart project={p} />
      </Card>
    </div>
  )
}
