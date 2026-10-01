import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, FileCheck2, Info, ShieldCheck, Truck, Users, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, DemoTag, Kpi, PageHeader, Pill, ProgressBar } from '../ui'
import type { Tone } from '../ui'
import { useStore } from '../../store/store'
import { handoverPct } from '../../store/selectors'
import { cx } from '../../lib/format'
import { CHART, Note } from './shared'

/* ---------- small building blocks ---------- */

interface BarDatum {
  name: string
  value: number
  color: string
}

function HBarChart({ data, unit, target, targetLabel = 'Target', max, height = 132 }: { data: BarDatum[]; unit: string; target?: number; targetLabel?: string; max?: number; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 16, right: 40, bottom: 0, left: 0 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" tick={CHART.tick} axisLine={false} tickLine={false} domain={[0, max ?? 'auto']} unit={unit === '%' ? '%' : ''} />
          <YAxis type="category" dataKey="name" tick={CHART.tick} axisLine={false} tickLine={false} width={92} />
          <Tooltip cursor={{ fill: '#f6f7f9' }} contentStyle={CHART.tooltip} formatter={(v) => [`${v}${unit === '%' ? '%' : ` ${unit}`}`, 'Value']} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: '#0b1530', fontWeight: 600 }} formatter={(v) => `${v}${unit === '%' ? '%' : ''}`} />
          </Bar>
          {target !== undefined && (
            <ReferenceLine x={target} stroke={CHART.crit} strokeDasharray="4 3" label={{ value: `${targetLabel} ${target}${unit === '%' ? '%' : ''}`, position: 'top', fontSize: 11, fill: CHART.crit }} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Metric({ label, value, sub, tone, children }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; children?: ReactNode }) {
  const toneCls = tone === 'crit' ? 'text-crit' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-ink'
  return (
    <div className="min-w-0 rounded-[10px] border border-line px-4 py-3">
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className={cx('tabular mt-1 text-[22px] leading-tight font-semibold tracking-tight', toneCls)}>{value}</div>
      {sub && <div className="mt-1 text-[12px] text-ink-3">{sub}</div>}
      {children}
    </div>
  )
}

function Delta({ text, good }: { text: string; good: boolean }) {
  const Icon = good ? ArrowDownRight : ArrowUpRight
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-[12px] font-medium', good ? 'text-ok' : 'text-crit')}>
      <Icon className="size-3.5" strokeWidth={2} />
      {text}
    </span>
  )
}

function AreaCard({ title, icon, status, children, drives, to, toLabel }: { title: string; icon: LucideIcon; status: { label: string; tone: Tone }; children: ReactNode; drives: string; to: string; toLabel: string }) {
  return (
    <Card
      title={title}
      icon={icon}
      actions={
        <Pill tone={status.tone} dot>
          {status.label}
        </Pill>
      }
      className="flex flex-col"
      bodyClassName="flex flex-1 flex-col gap-4 p-5"
    >
      {children}
      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-[13px] text-ink-2">
          <Workflow className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
          <span>
            <span className="font-medium text-ink">How the platform drives this: </span>
            {drives}
          </span>
        </p>
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-action hover:underline">
          {toLabel}
          <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={1.75} />
        </Link>
      </div>
    </Card>
  )
}

/* ---------- page ---------- */

const NCR_BEFORE = 9.2
const NCR_NOW = 5.4
const NCR_TARGET = 4
const DOSSIER_NOW = 18
const DOSSIER_TARGET = 10
const DOSSIER_BASELINE = 31

export function EfficiencyPage() {
  const { state } = useStore()
  const docsPct = handoverPct(state, 'NPE')
  const ncrImprovement = Math.round(((NCR_BEFORE - NCR_NOW) / NCR_BEFORE) * 100)
  const npe = state.projects.find((p) => p.id === 'NPE')

  const idle = [
    { name: 'Inspection waiting', value: 420, color: CHART.warn },
    { name: 'Material waiting', value: 330, color: CHART.compare },
    { name: 'Heat stop', value: 260, color: CHART.compare },
    { name: 'Permit delays', value: 150, color: CHART.compare },
    { name: 'Other', value: 80, color: CHART.compare },
  ]

  return (
    <div>
      <PageHeader
        title="Operational Efficiency"
        crumbs={[{ label: 'Platform' }, { label: 'Operational Efficiency' }]}
        tag={<DemoTag icon={Info}>Demo baseline / illustrative data</DemoTag>}
        subtitle="Measurable KPIs the platform is designed to move across quality, handover, procurement, workforce and HSE."
      />

      <Note tone="info" className="mb-6">
        <span className="font-medium text-ink">Demo baseline / illustrative data.</span> These figures show how value would be tracked once the platform is live. They are not actual SHQ results and
        have not been measured on SHQ projects.
      </Note>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="NCR closure time" value="5.4 days" sub={<Delta text={`${ncrImprovement}% faster than 9.2 days`} good />} icon={BadgeCheck} tone="ok" />
        <Kpi label="MC → dossier submission" value="18 days" sub="Target 10 days" icon={FileCheck2} tone="warn" />
        <Kpi label="Documents complete" value={`${docsPct}%`} sub={`${npe?.shortName ?? 'North Pipeline'} MDR, live`} icon={FileCheck2} tone={docsPct >= 90 ? 'ok' : 'warn'} to="/handover/mdr" />
        <Kpi label="Avg delivery delay" value="8.4 days" sub="7 critical POs delayed" icon={Truck} tone="warn" />
        <Kpi label="Workforce utilisation" value="88%" sub="1,240 idle hours" icon={Users} tone="ok" />
        <Kpi label="Observation closure" value="91%" sub="4 actions overdue" icon={ShieldCheck} tone="ok" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {/* QA/QC */}
        <AreaCard
          title="QA/QC"
          icon={BadgeCheck}
          status={{ label: 'Improving', tone: 'ok' }}
          drives="Single inspection record feeds NCR, dossier and KPIs: no re-entry. Overdue NCRs escalate automatically (rule QA-01)."
          to="/quality/ncrs"
          toLabel="Open NCRs"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="NCR closure time" value="5.4 days" sub={<span className="flex flex-wrap items-center gap-2">Before 9.2 days <Delta text={`${ncrImprovement}% improvement`} good /></span>} tone="ok" />
            <Metric label="Rework cost" value="SAR 1.2M" sub="Year to date, all projects" />
          </div>
          <div>
            <div className="mb-1 text-[12px] text-ink-3">Average NCR closure (days), lower is better</div>
            <HBarChart
              unit="days"
              target={NCR_TARGET}
              max={10}
              data={[
                { name: 'Before', value: NCR_BEFORE, color: CHART.compare },
                { name: 'Current', value: NCR_NOW, color: CHART.primary },
              ]}
            />
          </div>
        </AreaCard>

        {/* Handover */}
        <AreaCard
          title="Handover"
          icon={FileCheck2}
          status={{ label: 'Behind target', tone: 'warn' }}
          drives="Documents are linked to MDR categories as they are approved, so dossier readiness is known daily, not at mechanical completion."
          to="/handover"
          toLabel="Open handover"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Mechanical completion → dossier submission" value="18 days" sub="Target 10 days, 8 days to recover" tone="warn" />
            <Metric label="Documents complete" value={`${docsPct}%`} sub={`${npe?.shortName ?? 'North Pipeline'} MDR, updates as documents are approved`} tone={docsPct >= 90 ? 'ok' : 'warn'}>
              <ProgressBar value={docsPct} tone={docsPct >= 90 ? 'ok' : 'warn'} marker={90} className="mt-2.5" />
              <div className="mt-1 text-[11px] text-ink-3">Marker: 90% readiness target before MC</div>
            </Metric>
          </div>
          <div>
            <div className="mb-1 text-[12px] text-ink-3">Days from mechanical completion to dossier submission</div>
            <HBarChart
              unit="days"
              target={DOSSIER_TARGET}
              max={35}
              data={[
                { name: 'Manual baseline', value: DOSSIER_BASELINE, color: CHART.compare },
                { name: 'Current', value: DOSSIER_NOW, color: CHART.warn },
              ]}
            />
          </div>
        </AreaCard>

        {/* Procurement */}
        <AreaCard
          title="Procurement"
          icon={Truck}
          status={{ label: 'Attention', tone: 'warn' }}
          drives="Price changes above 5% raise an alert with alternate vendors (rule PR-01); late deliveries are linked to the schedule activities they block."
          to="/procurement"
          toLabel="Open procurement"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Average delivery delay" value="8.4 days" tone="warn" />
            <Metric label="Price variance" value="+6.2%" sub="Tolerance 5%" tone="crit" />
            <Metric label="Critical delayed POs" value="7" tone="crit" />
          </div>
          <div>
            <div className="mb-1 text-[12px] text-ink-3">Average delivery delay (days), lower is better</div>
            <HBarChart
              unit="days"
              target={5}
              max={14}
              data={[
                { name: 'Before', value: 12.6, color: CHART.compare },
                { name: 'Current', value: 8.4, color: CHART.primary },
              ]}
            />
          </div>
        </AreaCard>

        {/* Workforce */}
        <AreaCard
          title="Workforce"
          icon={Users}
          status={{ label: 'On target', tone: 'ok' }}
          drives="Attendance, DPR manpower and inspection bookings share one record, so idle time is attributed to a cause instead of being lost (rule HR-01)."
          to="/hr/utilisation"
          toLabel="Open utilisation"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Utilisation" value="88%" sub="Target 85%" tone="ok">
              <ProgressBar value={88} tone="ok" marker={85} className="mt-2.5" />
            </Metric>
            <Metric label="Idle hours" value="1,240" sub="This month" />
            <Metric label="Inspection waiting" value="420 hours" sub="34% of idle time" tone="warn" />
          </div>
          <div>
            <div className="mb-1 text-[12px] text-ink-3">Idle hours by cause (1,240 total)</div>
            <HBarChart unit="hours" data={idle} height={190} max={500} />
          </div>
        </AreaCard>

        {/* HSE */}
        <AreaCard
          title="HSE"
          icon={ShieldCheck}
          status={{ label: 'Improving', tone: 'ok' }}
          drives="Field observations reach the HSE Manager in minutes; high-risk items escalate after 24 hours (rule HSE-01) and update the project risk score."
          to="/hse/observations"
          toLabel="Open observations"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Observation closure" value="91%" sub="Target 95%" tone="ok" />
            <Metric label="High-risk observations" value="12" sub="This month" tone="crit" />
            <Metric label="Overdue actions" value="4" tone="warn" />
          </div>
          <div>
            <div className="mb-1 text-[12px] text-ink-3">Observations closed on time (%), higher is better</div>
            <HBarChart
              unit="%"
              target={95}
              max={100}
              data={[
                { name: 'Before', value: 76, color: CHART.compare },
                { name: 'Current', value: 91, color: CHART.ok },
              ]}
            />
          </div>
        </AreaCard>

        {/* How values are measured */}
        <Card title="How these values are measured" icon={Info} bodyClassName="p-5">
          <ul className="space-y-3 text-[13px] text-ink-2">
            <li>
              <span className="font-medium text-ink">Before</span> values represent a typical manual baseline (spreadsheets, email, paper inspection forms). Illustrative only.
            </li>
            <li>
              <span className="font-medium text-ink">Current</span> values show the demo portfolio after the platform's shared records, rules and alerts are applied.
            </li>
            <li>
              <span className="font-medium text-ink">Documents complete</span> is calculated live from the {npe?.shortName ?? 'North Pipeline'} MDR. Approve a document in the register and this figure moves.
            </li>
            <li>
              <span className="font-medium text-ink">Targets</span> (dashed red markers) are placeholders to be agreed with SHQ department heads during rollout.
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/handover/register" className="inline-flex items-center gap-1 text-[13px] font-medium text-action hover:underline">
              Document register <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={1.75} />
            </Link>
            <span className="text-ink-3">·</span>
            <Link to="/playbooks" className="inline-flex items-center gap-1 text-[13px] font-medium text-action hover:underline">
              Operational playbooks <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={1.75} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
