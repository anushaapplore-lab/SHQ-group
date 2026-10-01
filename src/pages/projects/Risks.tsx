import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock } from 'lucide-react'
import type { Risk, WorkPackage } from '../../data/types'
import { useStore } from '../../store/store'
import { inProject } from '../../store/selectors'
import { cx } from '../../lib/format'
import { Button, Card, DataTable, EmptyState, FilterChip, Kpi, PageHeader, Pill, Select, toneText } from '../../components/ui'
import type { Column } from '../../components/ui'
import { RiskDetail, RiskHeatMap, RiskScorePill, riskScore } from '../../components/projects/RiskMatrix'
import { WorkPackageDetail } from '../../components/projects/WorkPackageTable'
import { fp, signedPct, variance, varianceTone } from '../../components/projects/projectMath'

export function RisksPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [project, setProject] = useState(state.projectFilter)
  const [category, setCategory] = useState('all')
  const [cell, setCell] = useState<string | null>(null)
  const [riskId, setRiskId] = useState<string | null>(null)
  const [wpId, setWpId] = useState<string | null>(null)

  const scoped = inProject(state.risks, project)
  const categories = Array.from(new Set(state.risks.map((r) => r.category))).sort()
  const byCat = category === 'all' ? scoped : scoped.filter((r) => r.category === category)
  const risks = (cell ? byCat.filter((r) => `${r.probability}-${r.impact}` === cell) : byCat).sort((a, b) => riskScore(b) - riskScore(a))
  const delayed = inProject(state.workPackages, project)
    .filter((w) => variance(w) <= -5)
    .sort((a, b) => variance(a) - variance(b))
  const pname = (id: string) => state.projects.find((p) => p.id === id)?.shortName ?? id
  const high = byCat.filter((r) => riskScore(r) >= 15).length
  const impactDays = delayed.reduce((a, w) => a + (w.impactDays ?? 0), 0)

  const riskCols: Column<Risk>[] = [
    {
      key: 't',
      header: 'Risk',
      render: (r) => (
        <div className="min-w-[220px]">
          <div className="font-medium text-ink">{r.title}</div>
          <div className="text-[12px] text-ink-3">
            {r.id} · {pname(r.projectId)}
          </div>
        </div>
      ),
    },
    { key: 'c', header: 'Category', hideBelow: 'sm', render: (r) => r.category },
    { key: 'pi', header: 'P × I', align: 'center', hideBelow: 'md', render: (r) => <span className="tabular whitespace-nowrap text-ink-2">{r.probability} × {r.impact}</span> },
    { key: 's', header: 'Score', render: (r) => <RiskScorePill risk={r} /> },
    { key: 'm', header: 'Mitigation', hideBelow: 'lg', render: (r) => <span className="block min-w-[200px] text-ink-2">{r.mitigation}</span> },
    { key: 'o', header: 'Owner', hideBelow: 'md', render: (r) => <span className="whitespace-nowrap">{r.owner}</span> },
  ]
  const wpCols: Column<WorkPackage>[] = [
    {
      key: 'n',
      header: 'Work package',
      render: (w) => (
        <div className="min-w-[150px]">
          <div className="font-medium">{w.name}</div>
          <div className="text-[12px] text-ink-3">{pname(w.projectId)}</div>
        </div>
      ),
    },
    {
      key: 'v',
      header: 'Progress / plan',
      align: 'end',
      render: (w) => (
        <span className="tabular whitespace-nowrap">
          {fp(w.progress)}% / {w.planned}% <span className={cx('font-semibold', toneText(varianceTone(variance(w))))}>{signedPct(variance(w))}</span>
        </span>
      ),
    },
    { key: 'c', header: 'Delay cause', render: (w) => <span className="block min-w-[160px]">{w.delayCause ?? <span className="text-ink-3">Not recorded</span>}</span> },
    { key: 'a', header: 'Action', hideBelow: 'lg', render: (w) => <span className="text-ink-2">{w.action ? `${w.action} · ${w.actionOwner}` : '—'}</span> },
    { key: 'i', header: 'Impact', align: 'end', render: (w) => (w.impactDays ? <Pill tone="crit">{w.impactDays} d</Pill> : <span className="text-ink-3">—</span>) },
  ]

  return (
    <div>
      <PageHeader
        title="Risks & Delays"
        count={byCat.length}
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: 'Risks & Delays' }]}
        subtitle="Portfolio risk register and delayed work packages with causes and schedule impact"
        actions={
          <Select
            value={project}
            onChange={(e) => {
              setProject(e.target.value)
              setCell(null)
            }}
            options={[{ value: 'all', label: 'All projects' }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))]}
            className="w-[min(300px,80vw)]"
            aria-label="Project"
          />
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Open risks" value={byCat.filter((r) => r.status === 'Open').length} icon={AlertTriangle} />
        <Kpi label="High risks (≥ 15)" value={high} tone={high ? 'crit' : 'ok'} />
        <Kpi label="Delayed work packages" value={delayed.length} tone={delayed.length ? 'warn' : 'ok'} sub="Variance ≤ −5%" />
        <Kpi label="Schedule impact" value={`${impactDays} d`} icon={Clock} sub="Sum of recorded delay impacts" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={category === 'all'} onClick={() => setCategory('all')} count={scoped.length}>
          All categories
        </FilterChip>
        {categories.map((c) => {
          const n = scoped.filter((r) => r.category === c).length
          return n ? (
            <FilterChip key={c} active={category === c} onClick={() => setCategory(c)} count={n}>
              {c}
            </FilterChip>
          ) : null
        })}
      </div>

      <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[1fr_340px]">
        <Card
          title="Risk register"
          subtitle={cell ? `Heat map cell P${cell.replace('-', ' × I')}` : 'Sorted by probability × impact'}
          actions={cell ? <Button size="sm" variant="ghost" onClick={() => setCell(null)}>Clear cell</Button> : undefined}
          bodyClassName="p-0"
          className="min-w-0"
        >
          <DataTable columns={riskCols} rows={risks} rowKey={(r) => r.id} onRowClick={(r) => setRiskId(r.id)} highlight={(r) => riskScore(r) >= 15} empty={<EmptyState title="No risks match" body="Change the project, category or heat map filter." className="m-4" />} />
        </Card>
        <Card title="Heat map" subtitle="Click a cell to filter the register" className="self-start">
          <RiskHeatMap risks={byCat} selected={cell} onSelect={setCell} />
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-ink-2">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-crit-bg ring-1 ring-crit/30" />High ≥ 15</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-warn-bg ring-1 ring-warn/30" />Medium 8 to 14</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ok-bg ring-1 ring-ok/30" />Low</span>
          </div>
        </Card>
      </div>

      <Card title="Delayed work packages" subtitle="Variance of −5% or worse against plan" className="mt-4" bodyClassName="p-0">
        <DataTable
          columns={wpCols}
          rows={delayed}
          rowKey={(w) => w.id}
          onRowClick={(w) => setWpId(w.id)}
          empty={<EmptyState title="No delayed work packages" body="All work packages are within 5% of plan." className="m-4" action={<Button onClick={() => navigate('/projects/schedule')}>Open schedule</Button>} />}
        />
      </Card>

      <RiskDetail risk={riskId ? state.risks.find((r) => r.id === riskId) ?? null : null} onClose={() => setRiskId(null)} />
      <WorkPackageDetail wp={wpId ? state.workPackages.find((w) => w.id === wpId) ?? null : null} onClose={() => setWpId(null)} />
    </div>
  )
}
