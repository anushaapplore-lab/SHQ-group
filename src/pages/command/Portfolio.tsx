import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight, Factory, HardHat } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Project, RAG } from '../../data/types'
import { cx, num, sarM } from '../../lib/format'
import { handoverPct, openNcrs, overallHealth, portfolioValue, totalWorkforce } from '../../store/selectors'
import { useStore } from '../../store/store'
import type { Column, Tone } from '../../components/ui'
import { Card, DataTable, EmptyState, FilterChip, PageHeader, ProgressBar, RagBadge, Segmented } from '../../components/ui'

type TypeFilter = 'All' | 'Construction' | 'O&M'
type RagFilter = 'All' | RAG
type View = 'table' | 'cards'

const RAG_COLOR: Record<RAG, string> = { GREEN: '#15803d', AMBER: '#d97706', RED: '#b91c1c' }
const tooltipStyle = { borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 }

export function Portfolio() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('table')
  const [type, setType] = useState<TypeFilter>('All')
  const [rag, setRag] = useState<RagFilter>('All')

  const all = state.projects
  const rows = all.filter((p) => (type === 'All' || p.type === type) && (rag === 'All' || p.rag === rag))

  const totalBudget = portfolioValue(state)
  const totalActual = all.reduce((a, p) => a + p.actual, 0)
  const weightedProgress = Math.round(all.reduce((a, p) => a + p.progress * p.budget, 0) / totalBudget)
  const weightedPlanned = Math.round(all.reduce((a, p) => a + p.planned * p.budget, 0) / totalBudget)
  const ragCount = (r: RAG) => all.filter((p) => p.rag === r).length

  const chartData = rows.map((p) => ({ id: p.id, name: p.shortName, consumed: Math.round((p.actual / p.budget) * 100), progress: p.progress, rag: p.rag }))

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-ink">{p.name}</p>
          <p className="text-[12px] text-ink-3">
            {p.code} · {p.location}
          </p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (p) => <span className="whitespace-nowrap text-ink-2">{p.type}</span> },
    { key: 'rag', header: 'RAG', render: (p) => <RagBadge rag={p.rag} /> },
    {
      key: 'progress',
      header: 'Progress vs plan',
      render: (p) => (
        <div className="w-[140px]">
          <div className="tabular mb-1 text-[12px] text-ink-2">
            <span className="font-medium text-ink">{p.progress}%</span> / {p.planned}%
          </div>
          <ProgressBar value={p.progress} marker={p.planned} tone={p.progress < p.planned ? 'warn' : 'ok'} />
        </div>
      ),
    },
    {
      key: 'sv',
      header: 'Schedule',
      align: 'end',
      render: (p) => <span className={cx('tabular whitespace-nowrap font-medium', p.scheduleVarianceDays < -10 ? 'text-crit' : p.scheduleVarianceDays < 0 ? 'text-warn' : 'text-ok')}>{p.scheduleVarianceDays > 0 ? '+' : ''}{p.scheduleVarianceDays} d</span>,
    },
    { key: 'budget', header: 'Budget', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sarM(p.budget)}</span> },
    { key: 'actual', header: 'Actual', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sarM(p.actual)}</span> },
    {
      key: 'consumed',
      header: 'Cost consumed',
      align: 'end',
      render: (p) => {
        const c = Math.round((p.actual / p.budget) * 100)
        return <span className={cx('tabular', c > p.progress + 5 ? 'font-medium text-warn' : 'text-ink')}>{c}%</span>
      },
    },
    { key: 'quality', header: 'Quality', align: 'end', render: (p) => <Score n={p.quality} /> },
    { key: 'hse', header: 'HSE', align: 'end', render: (p) => <Score n={p.hse} /> },
    { key: 'wf', header: 'Workforce', align: 'end', render: (p) => <span className="tabular">{num(p.workforce)}</span> },
    { key: 'ncr', header: 'Open NCRs', align: 'end', render: (p) => <span className="tabular">{openNcrs(state, p.id).length}</span> },
    { key: 'ho', header: 'Handover', align: 'end', render: (p) => <span className="tabular">{handoverPct(state, p.id)}%</span> },
    { key: 'risk', header: 'Risk score', align: 'end', render: (p) => <span className={cx('tabular font-medium', p.riskScore >= 60 ? 'text-crit' : p.riskScore >= 40 ? 'text-warn' : 'text-ink')}>{p.riskScore}</span> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Portfolio"
        count={`${all.length} projects`}
        subtitle="Every construction project and O&M contract in one view. Select a project to open its command view."
        crumbs={[{ label: 'Command', to: '/command' }, { label: 'Portfolio' }]}
        actions={
          <Segmented<View>
            options={[
              { id: 'table', label: 'Table' },
              { id: 'cards', label: 'Cards' },
            ]}
            value={view}
            onChange={setView}
          />
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-line bg-line md:grid-cols-3 xl:grid-cols-6">
        <Summary label="Portfolio value" value={sarM(totalBudget)} />
        <Summary label="Actual cost to date" value={sarM(Math.round(totalActual * 10) / 10)} sub={`${Math.round((totalActual / totalBudget) * 100)}% of budget`} />
        <Summary label="Weighted progress" value={`${weightedProgress}%`} sub={`${weightedPlanned}% planned`} />
        <Summary label="Workforce" value={num(totalWorkforce(state))} />
        <Summary label="Overall health" value={`${overallHealth(state)}%`} />
        <Summary
          label="RAG distribution"
          value={
            <span className="flex items-center gap-3 text-[15px]">
              <span className="text-ok">{ragCount('GREEN')} G</span>
              <span className="text-warn">{ragCount('AMBER')} A</span>
              <span className="text-crit">{ragCount('RED')} R</span>
            </span>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', 'Construction', 'O&M'] as TypeFilter[]).map((tp) => (
          <FilterChip key={tp} active={type === tp} onClick={() => setType(tp)} count={tp === 'All' ? all.length : all.filter((p) => p.type === tp).length}>
            {tp}
          </FilterChip>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
        {(['All', 'GREEN', 'AMBER', 'RED'] as RagFilter[]).map((r) => (
          <FilterChip key={r} active={rag === r} onClick={() => setRag(r)} count={r === 'All' ? undefined : ragCount(r)}>
            {r === 'All' ? 'Any RAG' : r.charAt(0) + r.slice(1).toLowerCase()}
          </FilterChip>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No projects match" body="Try a different type or RAG filter." />
      ) : view === 'table' ? (
        <Card bodyClassName="p-0">
          <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/projects/${p.id}`)} dense />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="group min-w-0 rounded-[12px] border border-line bg-surface p-5 transition-colors hover:border-line-strong">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink group-hover:text-action">{p.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-ink-3">
                    {p.type === 'O&M' ? <Factory className="size-3.5" strokeWidth={1.5} /> : <HardHat className="size-3.5" strokeWidth={1.5} />}
                    {p.code} · {p.client}
                  </p>
                </div>
                <RagBadge rag={p.rag} />
              </div>
              <div className="mt-4 flex items-baseline justify-between text-[13px]">
                <span className="text-ink-2">Progress</span>
                <span className="tabular text-ink-2">
                  <span className="font-semibold text-ink">{p.progress}%</span> / {p.planned}%
                </span>
              </div>
              <ProgressBar value={p.progress} marker={p.planned} tone={p.progress < p.planned ? 'warn' : 'ok'} className="mt-1.5" />
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[13px]">
                <Mini label="Schedule" value={`${p.scheduleVarianceDays > 0 ? '+' : ''}${p.scheduleVarianceDays} d`} tone={p.scheduleVarianceDays < 0 ? 'warn' : undefined} />
                <Mini label="Budget" value={sarM(p.budget)} />
                <Mini label="Actual" value={sarM(p.actual)} />
                <Mini label="Quality" value={`${p.quality}%`} />
                <Mini label="HSE" value={`${p.hse}%`} />
                <Mini label="Workforce" value={num(p.workforce)} />
                <Mini label="Open NCRs" value={`${openNcrs(state, p.id).length}`} />
                <Mini label="Handover" value={`${handoverPct(state, p.id)}%`} />
                <Mini label="Risk score" value={`${p.riskScore}`} tone={p.riskScore >= 60 ? 'crit' : undefined} />
              </dl>
              <p className="mt-4 flex items-center justify-end gap-1 text-[12px] font-medium text-action">
                Open project <ChevronRight className="size-4 rtl:rotate-180" strokeWidth={1.5} />
              </p>
            </Link>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <Card title="Cost consumed vs progress" subtitle="Bars coloured by RAG status. Cost running ahead of progress signals overrun risk." >
          <div className="h-[260px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7b7d81' }} tickLine={false} axisLine={{ stroke: '#e8eaee' }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#7b7d81' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f3f4f6' }} formatter={(v, n) => [`${v}%`, n === 'consumed' ? 'Cost consumed' : 'Progress']} />
                <Bar dataKey="progress" name="progress" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="consumed" name="consumed" radius={[4, 4, 0, 0]} maxBarSize={16} cursor="pointer" onClick={(d) => {
                  const id = (d as { payload?: { id?: string } }).payload?.id
                  if (id) navigate(`/projects/${id}`)
                }}>
                  {chartData.map((d) => (
                    <Cell key={d.id} fill={RAG_COLOR[d.rag]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-ink-2">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#94a3b8]" />Progress</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ok" />Cost consumed (Green)</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#d97706]" />Amber</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-crit" />Red</span>
          </div>
        </Card>
      )}
    </div>
  )
}

function Summary({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <p className="truncate text-[12px] text-ink-2">{label}</p>
      <div className="tabular mt-1 text-[18px] font-semibold text-ink">{value}</div>
      {sub && <p className="truncate text-[12px] text-ink-3">{sub}</p>}
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[12px] text-ink-3">{label}</dt>
      <dd className={cx('tabular truncate font-medium', tone === 'crit' ? 'text-crit' : tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</dd>
    </div>
  )
}

function Score({ n }: { n: number }) {
  return <span className={cx('tabular', n < 85 ? 'font-medium text-warn' : 'text-ink')}>{n}%</span>
}
