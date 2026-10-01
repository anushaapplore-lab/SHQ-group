import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Factory,
  FileClock,
  FolderCheck,
  Gauge,
  HardHat,
  HeartPulse,
  Layers,
  Package,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  UserCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { alerts as seededAlerts } from '../../data/alerts'
import { manpowerByProject } from '../../data/hr'
import type { Level, Project } from '../../data/types'
import { useT } from '../../i18n'
import { cx, fmtShort, num, sarM } from '../../lib/format'
import { roleProfile } from '../../store/roles'
import {
  attentionProjects,
  complianceStatus,
  criticalOpen,
  expiringCount,
  handoverPct,
  myApprovals,
  openNcrs,
  openObservations,
  overallHealth,
  overdueNcrs,
  portfolioValue,
  projectName,
  totalWorkforce,
} from '../../store/selectors'
import { useStore } from '../../store/store'
import { Button, Card, DemoTag, EmptyState, Kpi, LevelPill, Pill, ProgressBar, RagBadge, StatusPill } from '../../components/ui'
import type { Tone } from '../../components/ui'

const SEEDED_ALERT_IDS = new Set(seededAlerts.map((a) => a.id))

interface AttentionItem {
  key: string
  level: Level
  area: string
  issue: string
  detail: string
  recommended: string
  to: string
  isNew?: boolean
  meta?: string
}

const STATIC_ATTENTION: AttentionItem[] = [
  {
    key: 'npe-schedule',
    level: 'critical',
    area: 'North Pipeline Expansion',
    issue: '8-day schedule variance',
    detail: 'Late material delivery',
    recommended: 'Review vendor PO 450021 and alternate supplier availability.',
    to: '/projects/NPE?tab=progress',
  },
  {
    key: 'egc-ncr',
    level: 'warning',
    area: 'Eastern Gas Compression',
    issue: 'NCR closure ageing',
    detail: '12 NCRs exceed target closure period.',
    recommended: 'Escalate CAPA owners and schedule closure review.',
    to: '/quality/ncrs',
  },
  {
    key: 'ruu-mdr',
    level: 'warning',
    area: 'Refinery Utilities',
    issue: 'MDR completeness',
    detail: '23 documents missing before planned mechanical completion.',
    recommended: 'Assign document owners and initiate weekly dossier review.',
    to: '/handover?project=RUU',
  },
  {
    key: 'manpower-idle',
    level: 'warning',
    area: 'Manpower',
    issue: '17% idle workforce',
    detail: 'Primary cause: Inspection waiting time.',
    recommended: 'Synchronise inspection planning with construction look-ahead.',
    to: '/hr/utilisation',
  },
]

const LEVEL_BORDER: Record<Level, string> = {
  critical: 'border-s-crit',
  warning: 'border-s-[#d97706]',
  info: 'border-s-action',
}

const tooltipStyle = { borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 }

export function ExecutiveDashboard() {
  const { state, actions } = useStore()
  const t = useT()
  const navigate = useNavigate()
  const profile = roleProfile(state.role)

  const critical = criticalOpen(state)
  const attention = attentionProjects(state)
  const construction = state.projects.filter((p) => p.type === 'Construction')
  const om = state.projects.filter((p) => p.type === 'O&M')
  const flagship = state.projects.filter((p) => p.flagship)
  const approvals = myApprovals(state, state.role)

  const attentionItems: AttentionItem[] = useMemo(() => {
    const fresh = state.alerts
      .filter((a) => !SEEDED_ALERT_IDS.has(a.id) && a.status !== 'Resolved')
      .map<AttentionItem>((a) => ({
        key: a.id,
        level: a.level,
        area: projectName(state, a.projectId),
        issue: a.title,
        detail: a.impact,
        recommended: a.recommendation,
        to: a.link ?? '/alerts',
        isNew: true,
        meta: `${a.id} · ${a.source} · escalation ${a.escalation}`,
      }))
    return [...fresh, ...STATIC_ATTENTION]
  }, [state])

  // Department pulse values (all derived from the shared store)
  const ncrOpen = openNcrs(state).length
  const ncrOverdue = overdueNcrs(state).length
  const hseHigh = openObservations(state).filter((o) => o.severity === 'High' || o.severity === 'Critical').length
  const latePos = state.pos.filter((p) => p.daysLate > 0 && p.status !== 'Delivered').length
  const criticalLate = state.pos.filter((p) => p.daysLate > 0 && p.critical && p.status !== 'Delivered').length
  const npeDossier = handoverPct(state, 'NPE')
  const utilisation = useMemo(() => {
    let w = 0
    let total = 0
    state.projects.forEach((p) => {
      const m = manpowerByProject.find((x) => x.projectId === p.id)
      if (!m) return
      w += m.utilisation * p.workforce
      total += p.workforce
    })
    return total ? Math.round(w / total) : 0
  }, [state.projects])
  const complianceExpiring = state.compliance.filter((c) => complianceStatus(c) === 'Expiring Soon').length
  const complianceExpired = state.compliance.filter((c) => complianceStatus(c) === 'Expired').length

  const chartData = construction.map((p) => ({ name: p.shortName, id: p.id, Actual: p.progress, Planned: p.planned }))

  const pulse: { label: string; icon: LucideIcon; value: string; sub: string; tone?: Tone; to: string }[] = [
    { label: 'QA/QC', icon: ClipboardCheck, value: `${ncrOpen}`, sub: `open NCRs · ${ncrOverdue} overdue`, tone: ncrOverdue > 0 ? 'crit' : undefined, to: '/quality' },
    { label: 'HSE', icon: ShieldAlert, value: `${hseHigh}`, sub: 'open high-risk observations', tone: hseHigh > 0 ? 'warn' : 'ok', to: '/hse' },
    { label: 'Procurement', icon: Package, value: `${latePos}`, sub: `late POs · ${criticalLate} critical`, tone: criticalLate > 0 ? 'crit' : latePos > 0 ? 'warn' : 'ok', to: '/procurement' },
    { label: 'Handover', icon: FolderCheck, value: `${npeDossier}%`, sub: 'North Pipeline dossier', tone: npeDossier < 80 ? 'warn' : 'ok', to: '/handover' },
    { label: 'Manpower', icon: UserCheck, value: `${utilisation}%`, sub: 'workforce utilisation', tone: utilisation < 85 ? 'warn' : 'ok', to: '/hr' },
    { label: 'Compliance', icon: FileClock, value: `${complianceExpiring}`, sub: `expiring in 30 days · ${complianceExpired} expired`, tone: complianceExpired > 0 ? 'crit' : complianceExpiring > 0 ? 'warn' : 'ok', to: '/compliance' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[14px] text-ink-2">
              {t('Good morning')}, {profile.firstName}
            </p>
            <h1 className="mt-1 text-[24px] leading-tight font-semibold tracking-tight text-ink sm:text-[27px]">{t('SHQ Operations Command Centre')}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={RefreshCw} onClick={() => actions.refresh()}>
              Refresh
            </Button>
            <Button icon={TriangleAlert} onClick={() => navigate('/alerts')}>
              {t('Alerts & Escalations')}
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-line bg-line sm:grid-cols-4">
          <MetaCell icon={Clock} label={t('Last data refresh')} value={state.lastRefresh} />
          <MetaCell icon={Briefcase} label={t('Active projects')} value={num(state.projects.length)} to="/portfolio" />
          <MetaCell icon={TriangleAlert} label={t('Projects requiring attention')} value={num(attention.length)} tone="warn" to="/portfolio" />
          <MetaCell icon={ShieldAlert} label={t('Open critical issues')} value={num(critical.length)} tone="crit" to="/alerts" />
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        <Kpi label={t('Projects')} value={state.projects.length} icon={Layers} sub="Across 3 regions" to="/portfolio" />
        <Kpi label={t('Active Construction')} value={construction.length} icon={HardHat} sub={`${construction.filter((p) => p.rag !== 'GREEN').length} need attention`} to="/projects/construction" />
        <Kpi label={t('O&M Contracts')} value={om.length} icon={Wrench} sub="Long-term service" to="/om" />
        <Kpi label={t('Total Workforce')} value={num(totalWorkforce(state))} icon={Users} sub={`${utilisation}% utilised`} to="/hr" />
        <Kpi label={t('Portfolio Value')} value={sarM(portfolioValue(state))} icon={Wallet} sub="Contract value" to="/portfolio" />
        <Kpi label={t('Overall Health')} value={`${overallHealth(state)}%`} icon={HeartPulse} sub="Weighted project health" to="/portfolio" />
        <Kpi label={t('Open Critical Issues')} value={critical.length} icon={ShieldAlert} tone="crit" sub="Alerts and escalations" to="/alerts" />
        <Kpi label={t('Documents Expiring')} value={expiringCount(state)} icon={FileClock} tone="warn" sub="Within 30 days" to="/documents/expiring" />
      </div>

      {/* What needs attention */}
      <Card
        title={t('What Needs Attention')}
        icon={TriangleAlert}
        subtitle={`${attentionItems.filter((a) => a.level === 'critical').length} critical · ${attentionItems.filter((a) => a.level === 'warning').length} warning`}
        actions={
          <Link to="/alerts" className="text-[13px] font-medium text-action hover:underline">
            {t('View all')}
          </Link>
        }
        bodyClassName="divide-y divide-line"
      >
        {attentionItems.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => navigate(a.to)}
            className={cx('group grid w-full gap-x-6 gap-y-2 border-s-[3px] px-5 py-4 text-start transition-colors hover:bg-[#f9fafb] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-center', LEVEL_BORDER[a.level], a.isNew && 'anim-fade bg-[#fffaf0]')}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <LevelPill level={a.level} />
                {a.isNew && (
                  <Pill tone="info" dot>
                    New
                  </Pill>
                )}
                <span className="text-[13px] text-ink-2">{a.area}</span>
              </div>
              <p className="mt-1.5 text-[15px] font-semibold text-ink">{a.issue}</p>
              <p className="mt-0.5 text-[13px] text-ink-2">{a.detail}</p>
              {a.meta && <p className="mt-0.5 text-[12px] text-ink-3">{a.meta}</p>}
            </div>
            <div className="min-w-0">
              <p className="caps text-[11px] text-ink-3">{t('Recommended action')}</p>
              <p className="mt-0.5 text-[13px] text-ink">{a.recommended}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-action lg:justify-end">
              Drill down
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" strokeWidth={1.5} />
            </span>
          </button>
        ))}
      </Card>

      {/* Portfolio health */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[19px] font-medium text-ink">
            {t('Portfolio Health')} <span className="text-ink-2">({flagship.length})</span>
          </h2>
          <Link to="/portfolio" className="inline-flex items-center gap-1 text-[13px] font-medium text-action hover:underline">
            All {state.projects.length} projects
            <ChevronRight className="size-4 rtl:rotate-180" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {flagship.map((p) => (
            <ProjectHealthCard key={p.id} p={p} openNcr={openNcrs(state, p.id).length} handover={handoverPct(state, p.id)} t={t} />
          ))}
        </div>
      </section>

      {/* Department pulse */}
      <section>
        <h2 className="mb-3 text-[19px] font-medium text-ink">{t('Department Pulse')}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {pulse.map((d) => (
            <Link key={d.label} to={d.to} className="group min-w-0 rounded-[12px] border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-[#fcfcfd]">
              <div className="flex items-center justify-between gap-2">
                <span className="caps truncate text-[12px] text-ink-2">{d.label}</span>
                <d.icon className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="tabular text-[22px] leading-none font-semibold text-ink">{d.value}</span>
                {d.tone && <span className={cx('size-2 rounded-full', d.tone === 'crit' ? 'bg-crit' : d.tone === 'warn' ? 'bg-[#d97706]' : 'bg-ok')} aria-hidden />}
              </div>
              <p className="mt-1.5 truncate text-[12px] text-ink-3" title={d.sub}>
                {d.sub}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Lower area */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          className="min-w-0"
          title={t('Progress vs Plan')}
          icon={Gauge}
          subtitle="Construction projects, % complete"
          actions={
            <Link to="/projects/schedule" className="text-[13px] font-medium text-action hover:underline">
              {t('View all')}
            </Link>
          }
        >
          <div className="h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={2} barCategoryGap="22%">
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7b7d81' }} tickLine={false} axisLine={{ stroke: '#e8eaee' }} interval={0} angle={-25} textAnchor="end" height={64} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7b7d81' }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f3f4f6' }} formatter={(v) => `${v}%`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#5a606b' }} />
                <Bar dataKey="Planned" name={t('Planned')} fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="Actual" name={t('Actual')} fill="#1d4ed8" radius={[4, 4, 0, 0]} maxBarSize={18} cursor="pointer" onClick={(d) => {
                  const id = (d as { payload?: { id?: string } }).payload?.id
                  if (id) navigate(`/projects/${id}`)
                }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          className="min-w-0"
          title={t('Pending Approvals')}
          icon={ClipboardCheck}
          subtitle={`${approvals.length} awaiting ${state.role === 'CEO' ? 'leadership' : state.role}`}
          actions={
            <Link to="/approvals" className="text-[13px] font-medium text-action hover:underline">
              {t('View all')}
            </Link>
          }
          bodyClassName="divide-y divide-line"
        >
          {approvals.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={ClipboardCheck} title="No approvals waiting" body="Everything assigned to you has been decided." />
            </div>
          ) : (
            approvals.slice(0, 4).map((a) => (
              <button key={a.id} type="button" onClick={() => navigate(`/approvals?id=${a.id}`)} className="flex w-full items-start gap-3 px-5 py-3.5 text-start hover:bg-[#f9fafb]">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                    <span className="font-medium text-ink-2">{a.type}</span>
                    <span>·</span>
                    <span>{a.id}</span>
                    <span>·</span>
                    <span className="truncate">{projectName(state, a.projectId)}</span>
                  </div>
                  <p className="mt-1 truncate text-[14px] font-medium text-ink">{a.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    Requested by {a.requestedBy} · {fmtShort(a.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {a.value && <span className="tabular text-[13px] font-medium text-ink">{a.value}</span>}
                  <StatusPill status={a.status} />
                </div>
              </button>
            ))
          )}
        </Card>
      </div>

      <Card
        title={t('Recent Activity')}
        icon={ActivityIcon}
        subtitle="One record, many workflows: every module writes here"
        actions={<DemoTag>Illustrative Data</DemoTag>}
        bodyClassName="divide-y divide-line"
      >
        {state.activities.slice(0, 8).map((a) => {
          const row = (
            <>
              <span className="tabular w-[92px] shrink-0 pt-0.5 text-[12px] text-ink-3">{a.time}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-ink">{a.text}</p>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {a.user} · {a.department} · {projectName(state, a.projectId)}
                </p>
              </div>
              {a.link && <ArrowUpRight className="size-4 shrink-0 text-ink-3 rtl:-scale-x-100" strokeWidth={1.5} />}
            </>
          )
          return a.link ? (
            <Link key={a.id} to={a.link} className="flex items-start gap-3 px-5 py-3 hover:bg-[#f9fafb]">
              {row}
            </Link>
          ) : (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3">
              {row}
            </div>
          )
        })}
      </Card>
    </div>
  )
}

function MetaCell({ icon: Icon, label, value, tone, to }: { icon: LucideIcon; label: string; value: string; tone?: Tone; to?: string }) {
  const inner = (
    <>
      <Icon className={cx('size-4 shrink-0', tone === 'crit' ? 'text-crit' : tone === 'warn' ? 'text-warn' : 'text-ink-3')} strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="truncate text-[12px] text-ink-2">{label}</p>
        <p className={cx('tabular truncate text-[15px] font-semibold', tone === 'crit' ? 'text-crit' : 'text-ink')}>{value}</p>
      </div>
    </>
  )
  const cls = 'flex min-w-0 items-center gap-3 bg-surface px-4 py-3'
  return to ? (
    <Link to={to} className={cx(cls, 'hover:bg-[#fcfcfd]')}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

function ProjectHealthCard({ p, openNcr, handover, t }: { p: Project; openNcr: number; handover: number; t: (k: string) => string }) {
  const behind = p.progress < p.planned
  const costPct = Math.round((p.actual / p.budget) * 100)
  const stat = (label: string, value: string, tone?: Tone) => (
    <div className="min-w-0">
      <p className="truncate text-[12px] text-ink-3">{label}</p>
      <p className={cx('tabular truncate text-[14px] font-medium', tone === 'crit' ? 'text-crit' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-ink')}>{value}</p>
    </div>
  )
  const scoreTone = (n: number): Tone | undefined => (n < 85 ? 'warn' : undefined)
  return (
    <Link to={`/projects/${p.id}`} className="group flex min-w-0 flex-col rounded-[12px] border border-line bg-surface transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink group-hover:text-action">{p.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-ink-3">
            {p.type === 'O&M' ? <Factory className="size-3.5" strokeWidth={1.5} /> : <HardHat className="size-3.5" strokeWidth={1.5} />}
            {p.code} · {p.type}
          </p>
        </div>
        <RagBadge rag={p.rag} />
      </div>
      <div className="flex-1 space-y-4 px-5 py-4">
        <div>
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="text-ink-2">{t('Progress')}</span>
            <span className="tabular text-ink-2">
              <span className="text-[18px] font-semibold text-ink">{p.progress}%</span> / {p.planned}% {t('Planned').toLowerCase()}
            </span>
          </div>
          <ProgressBar value={p.progress} marker={p.planned} tone={behind ? 'warn' : 'ok'} className="mt-2" height={8} />
          <p className={cx('mt-2 text-[12px] font-medium', p.scheduleVarianceDays < 0 ? 'text-warn' : 'text-ok')}>
            {t('Schedule')} {p.scheduleVarianceDays > 0 ? '+' : ''}
            {p.scheduleVarianceDays} {t('days')}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-3 border-t border-line pt-4">
          {stat(t('Budget'), sarM(p.budget))}
          {stat(t('Actual'), sarM(p.actual))}
          {stat('Cost used', `${costPct}%`)}
          {stat(t('Quality'), `${p.quality}%`, scoreTone(p.quality))}
          {stat(t('HSE'), `${p.hse}%`, scoreTone(p.hse))}
          {stat(t('Workforce'), num(p.workforce))}
          {stat(t('Open NCRs'), `${openNcr}`, openNcr > 5 ? 'warn' : undefined)}
          {stat(t('Open risks'), `${p.openRisks}`)}
          {stat('Handover', `${handover}%`, handover < 70 ? 'warn' : undefined)}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[12px]">
        <span className="text-ink-3">{p.manager}</span>
        <span className="inline-flex items-center gap-1 font-medium text-action">
          {t('Open project')}
          <ChevronRight className="size-4 rtl:rotate-180" strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  )
}

