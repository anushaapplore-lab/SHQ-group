import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileSearch,
  FileText,
  FileWarning,
  GitBranch,
  ListChecks,
  Wallet,
} from 'lucide-react'
import { AXIS_TICK, CHART_TOOLTIP, DISCIPLINES, NcrAgeCell, ProjectFilterNote, SeverityPill, useProjectShort } from '../../components/quality/shared'
import { Button, Card, DataTable, EmptyState, Kpi, LinkText, Pill, StatusPill, Tabs } from '../../components/ui'
import { punchCounts, rfis } from '../../data/quality'
import { DEMO_TODAY, cx, fmtShort, sar } from '../../lib/format'
import { roleProfile } from '../../store/roles'
import { inProject, myApprovals, ncrAge, ncrOverdue, openNcrs, overdueNcrs, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'

type DiscTab = 'all' | (typeof DISCIPLINES)[number]

// Illustrative split of today's 42 inspections across projects (used when the project filter is applied).
const TODAY_SPLIT: Record<string, number> = { NPE: 18, EGC: 11, RUU: 8, JTF: 3, KSS: 2 }

const STATUS_COLORS: Record<string, string> = {
  Open: '#b91c1c',
  Investigation: '#d97706',
  'CAPA Submitted': '#1d4ed8',
  Verification: '#94a3b8',
}

export function QualityDashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const short = useProjectShort()
  const pf = state.projectFilter
  const [disc, setDisc] = useState<DiscTab>('all')
  const isQaManager = state.role === 'QA/QC Manager'
  const profile = roleProfile(state.role)

  const inspections = inProject(state.inspections, pf)
  const ncrs = inProject(state.ncrs, pf)
  const open = openNcrs(state, pf)
  const overdue = overdueNcrs(state, pf)
  const openRfis = inProject(rfis, pf).filter((r) => r.status !== 'Closed')
  const punchTotal = pf === 'all' ? Object.values(punchCounts).reduce((a, b) => a + b, 0) : (punchCounts[pf] ?? 0)
  const capasOpen = inProject(state.capas, pf).filter((c) => c.status !== 'Closed')
  const capaOverdue = capasOpen.filter((c) => c.status === 'Overdue' || c.dueDate < DEMO_TODAY)
  const evaluated = inspections.filter((i) => i.result === 'Passed' || i.result === 'Failed')
  const passRate = pf === 'all' ? 94 : evaluated.length ? Math.round((evaluated.filter((i) => i.result === 'Passed').length / evaluated.length) * 100) : 100
  const reworkCost = pf === 'all' ? state.qaStats.reworkCost : ncrs.reduce((a, n) => a + (n.costImpact ?? 0), 0) * 6

  // Discipline filtering
  const inDisc = <T extends { discipline: string }>(list: T[]) => (disc === 'all' ? list : list.filter((x) => x.discipline === disc))
  const discInspections = inDisc(inspections)
  const discNcrs = inDisc(open)
  const discEval = discInspections.filter((i) => i.result === 'Passed' || i.result === 'Failed')
  const discPass = discEval.length ? Math.round((discEval.filter((i) => i.result === 'Passed').length / discEval.length) * 100) : null

  // Charts
  const projectIds = pf === 'all' ? state.projects.filter((p) => p.type === 'Construction' || open.some((n) => n.projectId === p.id)).map((p) => p.id) : [pf]
  const byProject = projectIds
    .map((pid) => {
      const row: Record<string, string | number> = { project: pid }
      ;(['Open', 'Investigation', 'CAPA Submitted', 'Verification'] as const).forEach((st) => {
        row[st] = open.filter((n) => n.projectId === pid && n.status === st).length
      })
      return row
    })
    .filter((r) => Object.values(r).some((v) => typeof v === 'number' && v > 0))
  const buckets = [
    { bucket: '0 to 5 days', count: open.filter((n) => ncrAge(n) <= 5).length, color: '#15803d' },
    { bucket: '6 to 10 days', count: open.filter((n) => ncrAge(n) >= 6 && ncrAge(n) <= 10).length, color: '#1d4ed8' },
    { bucket: '11 to 15 days', count: open.filter((n) => ncrAge(n) >= 11 && ncrAge(n) <= 15).length, color: '#d97706' },
    { bucket: 'Over 15 days', count: open.filter((n) => ncrAge(n) > 15).length, color: '#b91c1c' },
  ]

  // Requires attention
  const failedNoNcr = inspections
    .filter((i) => i.result === 'Failed' && !i.ncrId)
    .sort((a, b) => (a.id === 'INS-WLD-00428' ? -1 : b.id === 'INS-WLD-00428' ? 1 : b.date.localeCompare(a.date)))
  const attention = [
    ...failedNoNcr.map((i) => ({
      key: i.id,
      tone: 'crit' as const,
      kind: 'Failed inspection, no NCR',
      title: `${i.id} ${i.discipline} at ${i.location}`,
      meta: `${short(i.projectId)} · ${i.reference} · ${i.findings.join(', ') || 'Rejected'}`,
      to: `/quality/inspections/${i.id}`,
    })),
    ...overdue
      .slice()
      .sort((a, b) => ncrAge(b) - b.slaDays - (ncrAge(a) - a.slaDays))
      .map((n) => ({
        key: n.id,
        tone: 'crit' as const,
        kind: `NCR overdue by ${ncrAge(n) - n.slaDays}d`,
        title: `${n.id} ${n.title}`,
        meta: `${short(n.projectId)} · ${n.responsible} · ${n.status}`,
        to: `/quality/ncrs/${n.id}`,
      })),
    ...capaOverdue.map((c) => ({
      key: c.id,
      tone: 'warn' as const,
      kind: 'CAPA overdue',
      title: `${c.id} for ${c.ncrId}`,
      meta: `${short(c.projectId)} · ${c.owner} · due ${fmtShort(c.dueDate)} · ${c.progress}%`,
      to: `/quality/ncrs/${c.ncrId}`,
    })),
  ]

  // My queue (QA/QC Manager)
  const awaitingVerification = open.filter((n) => n.status === 'Verification')
  const capaApprovals = myApprovals(state, 'QA/QC Manager').filter((a) => a.type === 'NCR CAPA' && (pf === 'all' || a.projectId === pf))
  const docsUnderReview = inProject(state.documents, pf).filter((d) => d.status === 'Under Review' && d.department === 'QA/QC')

  const discTabs = [
    { id: 'all' as DiscTab, label: 'All disciplines', count: open.length },
    ...DISCIPLINES.map((d) => ({ id: d as DiscTab, label: d, count: open.filter((n) => n.discipline === d).length })),
  ]

  return (
    <div>
      <ProjectFilterNote />
      {isQaManager ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[13px] text-ink-3">QA/QC Manager workspace · {pf === 'all' ? 'All projects' : projectName(state, pf)}</div>
            <h1 className="mt-1 text-[24px] leading-tight font-semibold tracking-tight text-ink sm:text-[27px]">Good morning, {profile.firstName}</h1>
            <p className="mt-1.5 text-[14px] text-ink-2">
              {awaitingVerification.length} {awaitingVerification.length === 1 ? 'NCR awaits' : 'NCRs await'} your verification, {capaApprovals.length} CAPA {capaApprovals.length === 1 ? 'approval' : 'approvals'} pending, {overdue.length} {overdue.length === 1 ? 'NCR' : 'NCRs'} past SLA.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={ClipboardCheck} onClick={() => navigate('/quality/inspections')}>
              Inspections
            </Button>
            <Button variant="primary" icon={FileWarning} onClick={() => navigate('/quality/ncrs')}>
              NCR register
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-ink sm:text-[27px]">
              Quality Command Centre <span className="font-normal text-ink-2">({pf === 'all' ? 'All projects' : short(pf)})</span>
            </h1>
            <p className="mt-1.5 text-[14px] text-ink-2">Inspections, NCRs, CAPA and quality records across active projects.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={ClipboardCheck} onClick={() => navigate('/quality/inspections')}>
              Inspections
            </Button>
            <Button variant="primary" icon={FileWarning} onClick={() => navigate('/quality/ncrs')}>
              NCR register
            </Button>
          </div>
        </div>
      )}

      {isQaManager && (
        <Card title="My queue" icon={ListChecks} subtitle="Items waiting on Imran Siddiqui" className="mb-4" bodyClassName="p-0">
          <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
            <QueueColumn
              title="NCRs awaiting verification"
              count={awaitingVerification.length}
              empty="Nothing awaiting verification."
              items={awaitingVerification.map((n) => ({ key: n.id, label: `${n.id} ${n.title}`, meta: `${short(n.projectId)} · age ${ncrAge(n)}d of ${n.slaDays}d`, to: `/quality/ncrs/${n.id}`, crit: ncrOverdue(n) }))}
            />
            <QueueColumn
              title="CAPA approvals pending"
              count={capaApprovals.length}
              empty="No CAPA approvals pending."
              items={capaApprovals.map((a) => ({ key: a.id, label: a.title, meta: `${a.id} · requested by ${a.requestedBy}`, to: a.linkId ? `/quality/ncrs/${a.linkId}` : '/approvals' }))}
              footer={{ label: 'Open Approval Centre', to: '/approvals' }}
            />
            <QueueColumn
              title="Documents under review"
              count={docsUnderReview.length}
              empty="No QA/QC documents under review."
              items={docsUnderReview.slice(0, 4).map((d) => ({ key: d.id, label: d.title, meta: `${short(d.projectId)} · ${d.category} · Rev ${d.revision}`, to: '/documents' }))}
              footer={{ label: 'Open Document Centre', to: '/documents' }}
            />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Inspections Today" value={pf === 'all' ? state.qaStats.inspectionsToday : (TODAY_SPLIT[pf] ?? 0)} sub="Across ITP hold and witness points" icon={ClipboardCheck} to="/quality/inspections" />
        <Kpi label="Pass Rate" value={`${passRate}%`} sub="Rolling 30 days, first-time pass" icon={CheckCircle2} tone="ok" />
        <Kpi label="Open NCRs" value={open.length} sub={`${open.filter((n) => n.severity === 'Major').length} major`} icon={FileWarning} tone={open.length ? 'warn' : 'ok'} to="/quality/ncrs" />
        <Kpi label="NCRs Overdue" value={overdue.length} sub="Past closure SLA, rule QA-01" icon={Clock} tone={overdue.length ? 'crit' : 'ok'} to="/quality/ncrs?overdue=1" />
        <Kpi label="Open RFIs" value={openRfis.length} sub={`${openRfis.filter((r) => r.status === 'Overdue').length} overdue response`} icon={FileSearch} to="/quality/rfis" />
        <Kpi label="Punch Items" value={punchTotal} sub="Cat A and B open" icon={ClipboardList} to="/quality/punch" />
        <Kpi label="CAPA Due" value={capasOpen.length} sub={`${capaOverdue.length} overdue`} icon={GitBranch} tone={capaOverdue.length ? 'warn' : undefined} to="/quality/capa" />
        <Kpi label="Rework Cost" value={sar(reworkCost, { compact: true })} sub="Year to date, incl. repeat NDT" icon={Wallet} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card title="Requires attention" icon={AlertTriangle} subtitle="Failed inspections, overdue NCRs and CAPA" className="xl:col-span-1" bodyClassName="p-0">
          {attention.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CheckCircle2} title="Nothing needs attention" body="All failed inspections have NCRs and no NCR is past SLA." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {attention.slice(0, 9).map((a) => (
                <li key={a.key}>
                  <button type="button" onClick={() => navigate(a.to)} className="flex w-full items-start gap-3 px-5 py-3 text-start hover:bg-[#f9fafb]">
                    <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', a.tone === 'crit' ? 'bg-crit' : 'bg-[#d97706]')} />
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-[12px] font-medium', a.tone === 'crit' ? 'text-crit' : 'text-warn')}>{a.kind}</span>
                      <span className="block truncate text-[14px] text-ink">{a.title}</span>
                      <span className="block truncate text-[12px] text-ink-3">{a.meta}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Open NCRs by project" subtitle="Stacked by workflow status" icon={FileWarning} className="xl:col-span-1">
          {byProject.length === 0 ? (
            <EmptyState title="No open NCRs" />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProject} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="project" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e8eaee' }} interval={0} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: '#f6f6f6' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  {Object.entries(STATUS_COLORS).map(([k, c]) => (
                    <Bar key={k} dataKey={k} stackId="s" fill={c} maxBarSize={36} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="NCR ageing" icon={Clock} subtitle="Days since detection, open NCRs" className="xl:col-span-1">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="bucket" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e8eaee' }} interval={0} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: '#f6f6f6' }} formatter={(v) => [`${v} NCRs`, 'Open']} />
                <Bar dataKey="count" maxBarSize={44} radius={[3, 3, 0, 0]}>
                  {buckets.map((b) => (
                    <Cell key={b.bucket} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs tabs={discTabs} value={disc} onChange={setDisc} />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-xl">
          <MiniStat label="Inspections" value={String(discInspections.length)} />
          <MiniStat label="Pass rate" value={discPass === null ? 'n/a' : `${discPass}%`} tone={discPass !== null && discPass < 90 ? 'crit' : undefined} />
          <MiniStat label="Open NCRs" value={String(discNcrs.length)} tone={discNcrs.some(ncrOverdue) ? 'crit' : undefined} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
          <Card title="Inspections" subtitle={disc === 'all' ? 'Latest across disciplines' : `${disc} discipline`} actions={<LinkText to="/quality/inspections">View all</LinkText>} bodyClassName="p-0">
            <DataTable
              dense
              rows={[...discInspections].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/quality/inspections/${r.id}`)}
              highlight={(r) => r.result === 'Failed'}
              empty={<div className="p-5"><EmptyState title={`No ${disc === 'all' ? '' : disc + ' '}inspections`} body="No inspections recorded for this filter." /></div>}
              columns={[
                { key: 'id', header: 'ID', render: (r) => <span className="font-medium whitespace-nowrap">{r.id}</span> },
                { key: 'ref', header: 'Reference', render: (r) => <span className="whitespace-nowrap">{r.reference}</span> },
                { key: 'loc', header: 'Location', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.location}</span>, hideBelow: 'md' },
                { key: 'res', header: 'Result', render: (r) => <StatusPill status={r.result} /> },
              ]}
            />
          </Card>
          <Card title="Open NCRs" subtitle={disc === 'all' ? 'All disciplines' : `${disc} discipline`} actions={<LinkText to="/quality/ncrs">View register</LinkText>} bodyClassName="p-0">
            <DataTable
              dense
              rows={[...discNcrs].sort((a, b) => ncrAge(b) - b.slaDays - (ncrAge(a) - a.slaDays)).slice(0, 8)}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/quality/ncrs/${r.id}`)}
              highlight={(r) => ncrOverdue(r)}
              empty={<div className="p-5"><EmptyState icon={CheckCircle2} title="No open NCRs" body="This discipline has no open non-conformances." /></div>}
              columns={[
                { key: 'id', header: 'NCR', render: (r) => <span className="font-medium whitespace-nowrap">{r.id}</span> },
                { key: 't', header: 'Title', render: (r) => <span className="line-clamp-1 min-w-[160px]">{r.title}</span> },
                { key: 'sev', header: 'Severity', render: (r) => <SeverityPill severity={r.severity} />, hideBelow: 'md' },
                { key: 'age', header: 'Age / SLA', render: (r) => <NcrAgeCell ncr={r} /> },
              ]}
            />
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink icon={ListChecks} title="Inspection & Test Plans" body="Hold, witness and review points" to="/quality/plans" />
        <QuickLink icon={FileText} title="Material / MTR records" body="1 heat number discrepancy open" to="/quality/mtr" />
        <QuickLink icon={Clock} title="Calibration" body="Instruments due and expired" to="/quality/calibration" />
        <QuickLink icon={GitBranch} title="Record 360°: Weld W-00428" body="One record across every workflow" to="/record/W-00428" />
      </div>
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'crit' }) {
  return (
    <div className="rounded-[8px] bg-muted px-3 py-2.5">
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className={cx('tabular mt-0.5 text-[18px] font-semibold', tone === 'crit' ? 'text-crit' : 'text-ink')}>{value}</div>
    </div>
  )
}

function QueueColumn({ title, count, items, empty, footer }: { title: string; count: number; items: { key: string; label: string; meta: string; to: string; crit?: boolean }[]; empty: string; footer?: { label: string; to: string } }) {
  const navigate = useNavigate()
  return (
    <div className="min-w-0 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-2">{title}</span>
        <Pill tone={count ? 'warn' : 'ok'}>{count}</Pill>
      </div>
      {items.length === 0 ? (
        <p className="py-2 text-[13px] text-ink-3">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.key}>
              <button type="button" onClick={() => navigate(i.to)} className="block w-full rounded-[6px] px-2 py-1.5 text-start hover:bg-muted">
                <span className={cx('block truncate text-[13px]', i.crit ? 'text-crit' : 'text-ink')}>{i.label}</span>
                <span className="block truncate text-[12px] text-ink-3">{i.meta}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {footer && (
        <div className="mt-2 px-2">
          <LinkText to={footer.to} className="text-[12px]">
            {footer.label}
          </LinkText>
        </div>
      )}
    </div>
  )
}

function QuickLink({ icon: Icon, title, body, to }: { icon: typeof ListChecks; title: string; body: string; to: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(to)} className="flex items-start gap-3 rounded-[12px] border border-line bg-surface p-4 text-start hover:border-line-strong">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-muted">
        <Icon className="size-[18px] text-ink-2" strokeWidth={1.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium text-ink">{title}</span>
        <span className="block text-[12px] text-ink-3">{body}</span>
      </span>
    </button>
  )
}
