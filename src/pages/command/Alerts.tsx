import { useMemo, useState } from 'react'
import { BellRing, BookOpen, Check, CircleCheck, ExternalLink, Play, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Alert, Level } from '../../data/types'
import { cx, daysUntil, fmtDate, fmtShort } from '../../lib/format'
import { inProject, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { Button, Card, EmptyState, FilterChip, KeyValue, LevelPill, PageHeader, Pill, Select, SlideOver, StatusPill } from '../../components/ui'

type StatusFilter = 'Active' | 'Open' | 'Acknowledged' | 'Resolved' | 'All'
const LEVELS: { id: Level; label: string }[] = [
  { id: 'critical', label: 'Critical' },
  { id: 'warning', label: 'Warning' },
  { id: 'info', label: 'Information' },
]
const LEVEL_RANK: Record<Level, number> = { critical: 0, warning: 1, info: 2 }
const LEVEL_BORDER: Record<Level, string> = { critical: 'border-s-crit', warning: 'border-s-[#d97706]', info: 'border-s-action' }

export function AlertsPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [levels, setLevels] = useState<Level[]>([])
  const [dept, setDept] = useState('All')
  const [project, setProject] = useState('All')
  const [owner, setOwner] = useState('All')
  const [status, setStatus] = useState<StatusFilter>('Active')
  const [openId, setOpenId] = useState<string | null>(null)

  const scoped = inProject(state.alerts, state.projectFilter)
  const statusMatch = (a: Alert) => (status === 'All' ? true : status === 'Active' ? a.status !== 'Resolved' : a.status === status)
  const baseFiltered = scoped.filter((a) => statusMatch(a) && (dept === 'All' || a.department === dept) && (project === 'All' || a.projectId === project) && (owner === 'All' || a.owner === owner))
  const rows = useMemo(
    () => baseFiltered.filter((a) => levels.length === 0 || levels.includes(a.level)).sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.dueDate.localeCompare(b.dueDate)),
    [baseFiltered, levels],
  )

  const depts = ['All', ...Array.from(new Set(state.alerts.map((a) => a.department))).sort()]
  const owners = ['All', ...Array.from(new Set(state.alerts.map((a) => a.owner))).sort()]
  const projects = [{ value: 'All', label: 'All projects' }, ...Array.from(new Set(state.alerts.map((a) => a.projectId))).map((id) => ({ value: id, label: projectName(state, id) }))]
  const selected = state.alerts.find((a) => a.id === openId) ?? null

  const toggleLevel = (l: Level) => setLevels((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]))
  const clearFilters = () => {
    setLevels([])
    setDept('All')
    setProject('All')
    setOwner('All')
    setStatus('Active')
  }

  const runRules = () => {
    const created = actions.runRules()
    actions.toast(
      created > 0
        ? { title: `Rules engine created ${created} alert${created === 1 ? '' : 's'}`, body: 'New alerts are listed at the top and visible on the Executive dashboard.', tone: 'warning' }
        : { title: 'All rules evaluated, no new alerts', body: 'Quality, procurement, compliance and manpower rules checked against current records.', tone: 'success' },
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alerts & Escalations"
        count={rows.length}
        subtitle="Rule-driven alerts from every module, with owner, due date, escalation path and recommended action."
        crumbs={[{ label: 'Command', to: '/command' }, { label: 'Alerts & Escalations' }]}
        actions={
          <>
            <Button icon={BookOpen} onClick={() => navigate('/playbooks')}>
              Playbooks
            </Button>
            <Button variant="primary" icon={Play} onClick={runRules}>
              Run rules engine
            </Button>
          </>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {LEVELS.map((l) => (
            <FilterChip key={l.id} active={levels.includes(l.id)} onClick={() => toggleLevel(l.id)} count={baseFiltered.filter((a) => a.level === l.id).length}>
              {l.label}
            </FilterChip>
          ))}
          {state.projectFilter !== 'all' && <Pill tone="info">Filtered to {projectName(state, state.projectFilter)}</Pill>}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} options={depts.map((d) => ({ value: d, label: d === 'All' ? 'All departments' : d }))} />
          <Select aria-label="Project" value={project} onChange={(e) => setProject(e.target.value)} options={projects} />
          <Select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} options={owners.map((o) => ({ value: o, label: o === 'All' ? 'All owners' : o }))} />
          <Select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            options={[
              { value: 'Active', label: 'Open + Acknowledged' },
              { value: 'Open', label: 'Open' },
              { value: 'Acknowledged', label: 'Acknowledged' },
              { value: 'Resolved', label: 'Resolved' },
              { value: 'All', label: 'All statuses' },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title="No alerts"
          body="Nothing matches the current filters. Run the rules engine to re-evaluate all records."
          action={
            <Button size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <Card bodyClassName="divide-y divide-line">
          {rows.map((a) => {
            const due = daysUntil(a.dueDate)
            return (
              <button key={a.id} type="button" onClick={() => setOpenId(a.id)} className={cx('grid w-full gap-x-6 gap-y-2 border-s-[3px] px-4 py-3.5 text-start hover:bg-[#f9fafb] sm:px-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_170px]', LEVEL_BORDER[a.level], a.status === 'Resolved' && 'opacity-60')}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelPill level={a.level} />
                    <span className="text-[12px] text-ink-3">
                      {a.id} · {a.source}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14px] font-semibold text-ink">{a.title}</p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{a.impact}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-3">
                    {projectName(state, a.projectId)} · {a.department}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="caps text-[11px] text-ink-3">Recommended action</p>
                  <p className="mt-0.5 text-[13px] text-ink">{a.recommendation}</p>
                </div>
                <div className="flex flex-wrap items-start gap-x-4 gap-y-1 text-[12px] lg:flex-col lg:items-end lg:text-end">
                  <StatusPill status={a.status} />
                  <span className="text-ink-2">{a.owner}</span>
                  <span className={cx(due < 0 && a.status !== 'Resolved' ? 'font-medium text-crit' : due <= 1 ? 'text-warn' : 'text-ink-3')}>Due {fmtShort(a.dueDate)}</span>
                  <span className="text-ink-3">Escalates to {a.escalation}</span>
                </div>
              </button>
            )
          })}
        </Card>
      )}

      <SlideOver
        open={!!selected}
        onClose={() => setOpenId(null)}
        title={selected?.title ?? ''}
        subtitle={
          selected && (
            <span className="flex flex-wrap items-center gap-2">
              <LevelPill level={selected.level} /> <StatusPill status={selected.status} /> <span>{selected.id}</span>
            </span>
          )
        }
        footer={
          selected && (
            <>
              <Button icon={Sparkles} onClick={() => window.dispatchEvent(new Event('shq:open-ai'))}>
                Ask SHQ Intelligence
              </Button>
              {selected.link && (
                <Button icon={ExternalLink} onClick={() => navigate(selected.link ?? '/alerts')}>
                  Open source record
                </Button>
              )}
              {selected.status === 'Open' && (
                <Button icon={BellRing} onClick={() => actions.setAlertStatus(selected.id, 'Acknowledged')}>
                  Acknowledge
                </Button>
              )}
              {selected.status !== 'Resolved' ? (
                <Button variant="success" icon={Check} onClick={() => actions.setAlertStatus(selected.id, 'Resolved')}>
                  Resolve
                </Button>
              ) : (
                <Button onClick={() => actions.setAlertStatus(selected.id, 'Open')}>Reopen</Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-[10px] border border-line bg-muted p-4">
              <p className="caps text-[11px] text-ink-3">Recommended action</p>
              <p className="mt-1 text-[14px] text-ink">{selected.recommendation}</p>
            </div>
            <KeyValue
              rows={[
                { label: 'Issue', value: selected.title },
                { label: 'Impact', value: selected.impact },
                { label: 'Source', value: `${selected.source}${selected.sourceId ? ` · ${selected.sourceId}` : ''}` },
                { label: 'Rule', value: selected.rule ?? 'Manual / engine' },
                { label: 'Project', value: projectName(state, selected.projectId) },
                { label: 'Department', value: selected.department },
                { label: 'Owner', value: selected.owner },
                { label: 'Due date', value: fmtDate(selected.dueDate) },
                { label: 'Escalation level', value: selected.escalation },
                { label: 'Raised', value: fmtDate(selected.createdAt) },
                { label: 'Status', value: <StatusPill status={selected.status} /> },
              ]}
            />
            <p className="text-[12px] text-ink-3">Escalation path: {selected.owner} → {selected.escalation}. Unacknowledged alerts escalate automatically after the due date.</p>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
