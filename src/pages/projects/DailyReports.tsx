import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ClipboardList, Plus, Sparkles } from 'lucide-react'
import type { DPR } from '../../data/types'
import { useStore } from '../../store/store'
import { inProject } from '../../store/selectors'
import { cx, fmtDate, num } from '../../lib/format'
import { Button, Card, DataTable, DemoTag, EmptyState, KeyValue, Kpi, PageHeader, Pill, SitePhoto, SlideOver, StatusPill } from '../../components/ui'
import type { Column } from '../../components/ui'
import { DprModal } from '../../components/projects/DprForm'
import { AiDprSummary } from '../../components/projects/AiDprSummary'

export function DailyReportsPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<DPR | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const dprs = inProject(state.dprs, state.projectFilter)
  const detail = detailId ? state.dprs.find((d) => d.id === detailId) ?? null : null
  const pname = (id: string) => state.projects.find((p) => p.id === id)?.shortName ?? id
  const today = dprs.filter((d) => d.date === '2026-10-01')
  const withDelay = dprs.filter((d) => d.delayCause && d.delayCause !== 'None')
  const avgDelta = dprs.length ? Math.round((dprs.reduce((a, d) => a + d.progressDelta, 0) / dprs.length) * 10) / 10 : 0

  const cols: Column<DPR>[] = [
    {
      key: 'id',
      header: 'Report',
      render: (d) => (
        <div className="min-w-[130px]">
          <div className="flex items-center gap-2 font-medium text-ink">
            {d.id}
            {created?.id === d.id && <Pill tone="info">New</Pill>}
          </div>
          <div className="text-[12px] text-ink-3">{pname(d.projectId)}</div>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (d) => <span className="whitespace-nowrap text-ink-2">{fmtDate(d.date)}</span> },
    { key: 'wp', header: 'Work package', render: (d) => <span className="whitespace-nowrap">{d.workPackage}</span> },
    { key: 'loc', header: 'Location', hideBelow: 'lg', render: (d) => <span className="block min-w-[190px] text-ink-2">{d.location}</span> },
    { key: 'q', header: 'Quantity', hideBelow: 'md', render: (d) => <span className="whitespace-nowrap">{d.quantity}</span> },
    { key: 'mp', header: 'Manpower', align: 'end', hideBelow: 'md', render: (d) => <span className="tabular">{num(d.manpower)}</span> },
    { key: 'delta', header: 'Progress', align: 'end', render: (d) => <span className="tabular font-medium text-ok">+{d.progressDelta}%</span> },
    { key: 'delay', header: 'Delay cause', hideBelow: 'sm', render: (d) => (d.delayCause && d.delayCause !== 'None' ? <Pill tone="warn">{d.delayCause}</Pill> : <span className="text-ink-3">None</span>) },
    { key: 'st', header: 'Status', render: (d) => <StatusPill status={d.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        count={dprs.length}
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: 'Daily Reports' }]}
        subtitle="Daily progress reports (DPR) from site supervisors. Submissions update work package and project progress."
        tag={state.projectFilter !== 'all' ? <Pill tone="info">Filtered: {pname(state.projectFilter)}</Pill> : undefined}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
            Create Daily Report
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Reports today" value={today.length} sub="1 Oct 2026" icon={ClipboardList} />
        <Kpi label="Avg daily progress" value={`+${avgDelta}%`} sub="Across listed reports" />
        <Kpi label="Reports with delay cause" value={withDelay.length} tone={withDelay.length ? 'warn' : 'ok'} sub={withDelay[0]?.delayCause ?? 'None'} />
        <Kpi label="Photos attached" value={dprs.reduce((a, d) => a + d.photos, 0)} icon={Camera} />
      </div>

      {created && (
        <div className="anim-fade mb-4 rounded-[12px] border border-[#c5b8f0] bg-[#fbfaff] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-[#5b3fb5]" strokeWidth={1.5} />
            <span className="text-[14px] font-semibold text-ink">AI-style summary for {created.id}</span>
            <DemoTag>Demo AI Analysis</DemoTag>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-ink">{created.aiSummary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDetailId(created.id)}>
              View report
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/projects/${created.projectId}?tab=progress`)}>
              See updated progress
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[1fr_400px]">
        <Card title="Recent DPRs" subtitle="Newest first · click for full report" bodyClassName="p-0" className="min-w-0">
          <DataTable
            columns={cols}
            rows={dprs}
            rowKey={(d) => d.id}
            onRowClick={(d) => setDetailId(d.id)}
            highlight={(d) => d.id === created?.id}
            empty={<EmptyState title="No daily reports" body="Create the first daily report for this project." className="m-4" action={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Create Daily Report</Button>} />}
          />
        </Card>
        <AiDprSummary className="min-w-0 self-start" />
      </div>

      <DprModal
        open={open}
        onClose={() => setOpen(false)}
        defaultProjectId={state.projectFilter !== 'all' ? state.projectFilter : 'NPE'}
        onCreated={(d) => setCreated(d)}
      />

      {detail && (
        <SlideOver
          open
          onClose={() => setDetailId(null)}
          title={detail.id}
          subtitle={`${state.projects.find((p) => p.id === detail.projectId)?.name ?? detail.projectId} · ${fmtDate(detail.date)}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => navigate(`/projects/${detail.projectId}?tab=progress`)}>
                Open project
              </Button>
              <Button
                variant="primary"
                onClick={() => actions.toast({ title: 'DPR shared', body: `${detail.id} sent to the Project Director and client representative (demo).`, tone: 'success' })}
              >
                Share report
              </Button>
            </>
          }
        >
          <div className="mb-4 rounded-[8px] border border-[#c5b8f0] bg-[#fbfaff] p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-ink">AI summary</span>
              <DemoTag>Demo AI Analysis</DemoTag>
            </div>
            <p className="text-[13px] text-ink">{detail.aiSummary}</p>
          </div>
          <KeyValue
            rows={[
              { label: 'Status', value: <StatusPill status={detail.status} /> },
              { label: 'Work package', value: detail.workPackage },
              { label: 'Location', value: detail.location },
              { label: 'Weather', value: detail.weather },
              { label: 'Manpower', value: num(detail.manpower) },
              { label: 'Equipment', value: detail.equipment },
              { label: 'Work completed', value: detail.workCompleted },
              { label: 'Quantity', value: detail.quantity },
              { label: 'Progress', value: <span className="font-medium text-ok">+{detail.progressDelta}%</span> },
              { label: 'Issues', value: detail.issues || '—' },
              { label: 'Delay cause', value: detail.delayCause || 'None' },
              { label: 'Supervisor', value: detail.supervisor },
            ]}
          />
          <h3 className="caps mt-5 mb-2 text-[12px] text-ink-3">Photos ({detail.photos})</h3>
          {detail.photos > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: detail.photos }).map((_, i) => (
                <div key={i} className={cx('aspect-[4/3] overflow-hidden rounded-[8px] border border-line')}>
                  <SitePhoto seed={i + 1} className="h-full w-full" label={`DPR photo ${i + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-3">No photos attached.</p>
          )}
          <p className="mt-2 text-[11px] text-ink-3">Placeholder imagery for demo purposes.</p>
        </SlideOver>
      )}
    </div>
  )
}
