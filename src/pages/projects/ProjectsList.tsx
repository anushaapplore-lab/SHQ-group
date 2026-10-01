import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'
import type { Project } from '../../data/types'
import { useStore } from '../../store/store'
import { handoverPct, inProject } from '../../store/selectors'
import { cx, num, sarM } from '../../lib/format'
import { DataTable, EmptyState, FilterChip, Input, PageHeader, Pill, ProgressBar, RagBadge, Segmented, toneText } from '../../components/ui'
import type { Column } from '../../components/ui'
import { costConsumed, fp, scheduleLabel, scoreTone, signedPct, variance, varianceTone } from '../../components/projects/projectMath'

type Rag = 'all' | Project['rag']
type TypeF = 'all' | Project['type']

export function ProjectsList({ variant = 'all' }: { variant?: 'all' | 'construction' }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [rag, setRag] = useState<Rag>('all')
  const [type, setType] = useState<TypeF>('all')
  const [view, setView] = useState<'cards' | 'table'>('table')
  const isC = variant === 'construction'

  const scoped = useMemo(() => {
    const base = inProject(state.projects, state.projectFilter)
    return isC ? base.filter((p) => p.type === 'Construction') : base
  }, [state.projects, state.projectFilter, isC])

  const rows = scoped.filter((p) => {
    if (rag !== 'all' && p.rag !== rag) return false
    if (!isC && type !== 'all' && p.type !== type) return false
    if (q.trim()) {
      const s = q.toLowerCase()
      return [p.name, p.code, p.location, p.client, p.manager].some((x) => x.toLowerCase().includes(s))
    }
    return true
  })

  const fronts = (p: Project) => {
    const wps = state.workPackages.filter((w) => w.projectId === p.id)
    return { active: wps.filter((w) => w.progress > 0 && w.progress < 100).length, delayed: wps.filter((w) => variance(w) <= -5).length, total: wps.length }
  }
  const dprToday = (p: Project) => state.dprs.filter((d) => d.projectId === p.id && d.date === '2026-10-01').length

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-ink">{p.name}</div>
          <div className="text-[12px] text-ink-3">
            {p.code} · {p.type} · {p.location}
          </div>
        </div>
      ),
    },
    { key: 'rag', header: 'RAG', render: (p) => <RagBadge rag={p.rag} /> },
    {
      key: 'progress',
      header: 'Progress vs planned',
      render: (p) => (
        <div className="min-w-[150px]">
          <div className="mb-1 flex justify-between text-[12px]">
            <span className="tabular font-medium">
              {fp(p.progress)}% <span className="font-normal text-ink-3">/ {p.planned}%</span>
            </span>
            <span className={cx('tabular font-medium', toneText(varianceTone(variance(p))))}>{signedPct(variance(p))}</span>
          </div>
          <ProgressBar value={p.progress} marker={p.planned} tone={varianceTone(variance(p)) === 'ok' ? 'ok' : varianceTone(variance(p))} />
        </div>
      ),
    },
    {
      key: 'sched',
      header: 'Schedule',
      render: (p) => <span className={cx('whitespace-nowrap', p.scheduleVarianceDays < -5 ? 'text-crit' : p.scheduleVarianceDays < 0 ? 'text-warn' : 'text-ink-2')}>{scheduleLabel(p.scheduleVarianceDays)}</span>,
    },
    ...(isC
      ? [
          {
            key: 'fronts',
            header: 'Work fronts',
            render: (p: Project) => {
              const f = fronts(p)
              return (
                <span className="whitespace-nowrap">
                  <span className="tabular font-medium">{f.active}</span> <span className="text-ink-3">active</span>
                  {f.delayed > 0 && <Pill tone="crit" className="ms-2">{f.delayed} delayed</Pill>}
                </span>
              )
            },
          },
          { key: 'dpr', header: 'DPR today', hideBelow: 'lg' as const, render: (p: Project) => (dprToday(p) ? <Pill tone="ok" dot>Submitted</Pill> : <Pill tone="warn" dot>Pending</Pill>) },
        ]
      : []),
    {
      key: 'cost',
      header: 'Budget / actual',
      align: 'end',
      render: (p) => (
        <div className="whitespace-nowrap">
          <div className="tabular">
            {sarM(p.actual)} <span className="text-ink-3">/ {sarM(p.budget)}</span>
          </div>
          <div className="text-[12px] text-ink-3">{costConsumed(p)}% consumed</div>
        </div>
      ),
    },
    { key: 'q', header: 'Quality', align: 'end', hideBelow: 'md', render: (p) => <span className={cx('tabular font-medium', toneText(scoreTone(p.quality)))}>{p.quality}%</span> },
    { key: 'hse', header: 'HSE', align: 'end', hideBelow: 'md', render: (p) => <span className={cx('tabular font-medium', toneText(scoreTone(p.hse)))}>{p.hse}%</span> },
    {
      key: 'wf',
      header: 'Workforce',
      align: 'end',
      hideBelow: 'lg',
      render: (p) => (
        <span className="tabular whitespace-nowrap">
          {num(p.workforce)} <span className="text-ink-3">/ {num(p.workforcePlanned)}</span>
        </span>
      ),
    },
    { key: 'ho', header: 'Handover', align: 'end', hideBelow: 'lg', render: (p) => <span className="tabular">{handoverPct(state, p.id)}%</span> },
  ]

  const counts = {
    GREEN: scoped.filter((p) => p.rag === 'GREEN').length,
    AMBER: scoped.filter((p) => p.rag === 'AMBER').length,
    RED: scoped.filter((p) => p.rag === 'RED').length,
  }

  return (
    <div>
      <PageHeader
        title={isC ? 'Construction' : 'All Projects'}
        count={rows.length}
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: isC ? 'Construction' : 'All Projects' }]}
        subtitle={isC ? 'Active construction projects with live work-front and progress status' : 'Construction and O&M portfolio, health and delivery status'}
        tag={
          state.projectFilter !== 'all' ? (
            <button type="button" onClick={() => actions.setProjectFilter('all')} className="rounded-full">
              <Pill tone="info">Filtered: {state.projects.find((p) => p.id === state.projectFilter)?.shortName} · clear</Pill>
            </button>
          ) : undefined
        }
        actions={<Segmented value={view} onChange={setView} options={[{ id: 'table', label: 'Table' }, { id: 'cards', label: 'Cards' }]} />}
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {!isC && (
            <>
              {(['all', 'Construction', 'O&M'] as TypeF[]).map((t) => (
                <FilterChip key={t} active={type === t} onClick={() => setType(t)} count={t === 'all' ? scoped.length : scoped.filter((p) => p.type === t).length}>
                  {t === 'all' ? 'All types' : t}
                </FilterChip>
              ))}
              <span className="mx-1 hidden w-px self-stretch bg-line sm:block" />
            </>
          )}
          <FilterChip active={rag === 'all'} onClick={() => setRag('all')}>
            All RAG
          </FilterChip>
          {(['RED', 'AMBER', 'GREEN'] as const).map((r) => (
            <FilterChip key={r} active={rag === r} onClick={() => setRag(r)} count={counts[r]}>
              {r[0] + r.slice(1).toLowerCase()}
            </FilterChip>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search project, code, client, PM" className="ps-9" aria-label="Search projects" />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No projects match" body="Adjust the RAG or type filters, or clear the search." />
      ) : view === 'table' ? (
        <div className="rounded-[12px] border border-line bg-surface">
          <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/projects/${p.id}`)} />
        </div>
      ) : (
        <div className="grid gap-4 [&>*]:min-w-0 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => {
            const v = variance(p)
            const f = fronts(p)
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="min-w-0 rounded-[12px] border border-line bg-surface p-4 text-start transition-colors hover:border-line-strong hover:bg-[#fcfcfd]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-ink-3">
                      <MapPin className="size-3 shrink-0" strokeWidth={1.5} />
                      {p.code} · {p.location}
                    </div>
                  </div>
                  <RagBadge rag={p.rag} />
                </div>
                <div className="mt-4 mb-1 flex justify-between text-[12px]">
                  <span className="text-ink-2">
                    Progress <span className="tabular font-medium text-ink">{fp(p.progress)}%</span> / {p.planned}%
                  </span>
                  <span className={cx('tabular font-medium', toneText(varianceTone(v)))}>{signedPct(v)}</span>
                </div>
                <ProgressBar value={p.progress} marker={p.planned} tone={varianceTone(v) === 'ok' ? 'ok' : varianceTone(v)} />
                <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-2.5 text-[12px]">
                  <Metric label="Cost" value={`${costConsumed(p)}%`} />
                  <Metric label="Quality" value={`${p.quality}%`} tone={toneText(scoreTone(p.quality))} />
                  <Metric label="HSE" value={`${p.hse}%`} tone={toneText(scoreTone(p.hse))} />
                  <Metric label="Workforce" value={`${p.workforce}/${p.workforcePlanned}`} />
                  <Metric label="Handover" value={`${handoverPct(state, p.id)}%`} />
                  {isC ? <Metric label="Fronts" value={`${f.active} active`} tone={f.delayed ? 'text-crit' : undefined} /> : <Metric label="Schedule" value={scheduleLabel(p.scheduleVarianceDays)} />}
                </dl>
                <div className="mt-3 border-t border-line pt-2.5 text-[12px] text-ink-3">
                  {sarM(p.actual)} of {sarM(p.budget)} · PM {p.manager}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-3">{label}</dt>
      <dd className={cx('tabular truncate font-medium', tone ?? 'text-ink')}>{value}</dd>
    </div>
  )
}
