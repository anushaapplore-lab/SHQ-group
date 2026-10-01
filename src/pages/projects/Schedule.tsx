import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, CalendarRange, ClipboardList } from 'lucide-react'
import { useStore } from '../../store/store'
import { fmtDate } from '../../lib/format'
import { Button, Card, DemoTag, Kpi, PageHeader, Select, toneText } from '../../components/ui'
import { WorkPackageTable } from '../../components/projects/WorkPackageTable'
import { GanttChart, SCurveChart } from '../../components/projects/Gantt'
import { AiDprSummary } from '../../components/projects/AiDprSummary'
import { fp, scheduleLabel, signedPct, variance, varianceTone } from '../../components/projects/projectMath'

export function SchedulePage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const construction = state.projects.filter((p) => p.type === 'Construction')
  const initial = state.projectFilter !== 'all' && state.projects.some((p) => p.id === state.projectFilter) ? state.projectFilter : 'NPE'
  const [pid, setPid] = useState(initial)
  const p = state.projects.find((x) => x.id === pid) ?? state.projects[0]
  const wps = state.workPackages.filter((w) => w.projectId === p.id)
  const v = variance(p)
  const delayed = wps.filter((w) => variance(w) <= -5).length
  const forecastFinish = wps.reduce((a, w) => (w.forecastFinish > a ? w.forecastFinish : a), p.finishDate)

  const options = [...construction, ...state.projects.filter((x) => x.type !== 'Construction')].map((x) => ({ value: x.id, label: `${x.name}${x.type === 'O&M' ? ' (O&M)' : ''}` }))

  return (
    <div>
      <PageHeader
        title="Schedule & Progress"
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: 'Schedule & Progress' }]}
        subtitle="Work package progress, baseline vs forecast and cumulative S-curve"
        actions={
          <>
            <Select value={pid} onChange={(e) => setPid(e.target.value)} options={options} className="w-[min(320px,80vw)]" aria-label="Project" />
            <Button icon={ArrowUpRight} onClick={() => navigate(`/projects/${p.id}?tab=progress`)}>
              Project view
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Progress" value={`${fp(p.progress)} / ${p.planned}%`} sub={<span className={toneText(varianceTone(v))}>{signedPct(v)} vs plan</span>} />
        <Kpi label="Schedule" value={<span className={p.scheduleVarianceDays < 0 ? 'text-crit' : ''}>{scheduleLabel(p.scheduleVarianceDays)}</span>} tone={p.scheduleVarianceDays < -5 ? 'crit' : p.scheduleVarianceDays < 0 ? 'warn' : 'ok'} />
        <Kpi label="Delayed packages" value={delayed} sub={`of ${wps.length}`} tone={delayed ? 'crit' : 'ok'} />
        <Kpi label="Baseline finish" value={<span className="text-[20px]">{fmtDate(p.finishDate)}</span>} />
        <Kpi label="Forecast finish" value={<span className={forecastFinish > p.finishDate ? 'text-[20px] text-crit' : 'text-[20px]'}>{fmtDate(forecastFinish)}</span>} />
      </div>

      <div className="space-y-4">
        <Card title="Work packages" icon={ClipboardList} subtitle={`${p.name} · click a row for delay causes`} bodyClassName="p-0">
          <WorkPackageTable rows={wps} />
        </Card>
        <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[1.4fr_1fr]">
          <Card title="Timeline" icon={CalendarRange} subtitle="Baseline (light) vs actual and forecast (dark)" bodyClassName="p-0">
            <GanttChart rows={wps} />
          </Card>
          <Card title="S-curve" subtitle="Cumulative planned vs actual" actions={<DemoTag>Illustrative curve</DemoTag>}>
            <SCurveChart project={p} height={300} />
          </Card>
        </div>
        <AiDprSummary />
      </div>
    </div>
  )
}
