import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BadgeCheck, Bell, BookOpen, CheckCircle2, FileCheck2, FlaskConical, Play, ShieldCheck, Truck, Users, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, DataTable, DemoTag, Kpi, LevelPill, PageHeader, Pill } from '../ui'
import { useStore } from '../../store/store'
import { poVariance } from '../../store/selectors'
import type { Alert } from '../../data/types'
import { clockLabel, cx, fmtDate, sar } from '../../lib/format'
import { Note, Switch } from './shared'

interface Rule {
  id: string
  area: string
  icon: LucideIcon
  condition: string
  actions: string[]
  escalation: string
}

const RULES: Rule[] = [
  { id: 'PR-01', area: 'Procurement', icon: Truck, condition: 'Vendor price changes > 5% on an active PO', actions: ['Create alert', 'Compare alternate vendors', 'Notify Procurement Head'], escalation: 'Procurement Head' },
  { id: 'QA-01', area: 'Quality', icon: BadgeCheck, condition: 'NCR remains open > SLA (closure target days)', actions: ['Escalate to Department Head', 'Create alert for Project Director'], escalation: 'Department Head' },
  { id: 'HO-01', area: 'Handover', icon: FileCheck2, condition: 'Document missing within 30 days of mechanical completion', actions: ['Create document action', 'Notify Document Controller'], escalation: 'Document Controller' },
  { id: 'HSE-01', area: 'HSE', icon: ShieldCheck, condition: 'High-risk observation remains open > 24 hours', actions: ['Escalate to HSE Manager'], escalation: 'HSE Manager' },
  { id: 'HSE-02', area: 'HSE', icon: ShieldCheck, condition: 'High-severity observation is raised', actions: ['Alert HSE Manager & Project Director', 'Update project risk score'], escalation: 'HSE Manager, Project Director' },
  { id: 'HR-01', area: 'Manpower', icon: Users, condition: 'Utilisation < 75%', actions: ['Flag idle workforce', 'Identify cause', 'Notify Project Manager'], escalation: 'Project Manager' },
]

const matches = (a: Alert, id: string) => a.rule === id || a.source.includes(id)

interface RunLog {
  id: number
  time: string
  created: number
  by: string
}

export function PlaybooksPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(RULES.map((r) => [r.id, true])))
  const [running, setRunning] = useState(false)
  const [runs, setRuns] = useState<RunLog[]>([])

  const stats = useMemo(
    () =>
      Object.fromEntries(
        RULES.map((r) => {
          const list = state.alerts.filter((a) => matches(a, r.id))
          const last = list.reduce<string | null>((acc, a) => (!acc || a.createdAt > acc ? a.createdAt : acc), null)
          return [r.id, { count: list.length, open: list.filter((a) => a.status !== 'Resolved').length, last, recent: list.slice(0, 2) }]
        }),
      ) as Record<string, { count: number; open: number; last: string | null; recent: Alert[] }>,
    [state.alerts],
  )

  const totalTriggered = RULES.reduce((a, r) => a + stats[r.id].count, 0)
  const totalOpen = RULES.reduce((a, r) => a + stats[r.id].open, 0)
  const activeCount = RULES.filter((r) => enabled[r.id]).length

  const po = state.pos.find((p) => p.id === 'PO-450021')
  const poVar = po ? poVariance(po) : 0

  function runNow() {
    setRunning(true)
    window.setTimeout(() => {
      const n = actions.runRules()
      setRunning(false)
      setRuns((prev) => [{ id: (prev[0]?.id ?? 0) + 1, time: clockLabel(state.clock), created: n, by: 'Manual run' }, ...prev].slice(0, 5))
      actions.toast(
        n > 0
          ? { title: `${n} new alert${n === 1 ? '' : 's'} created`, body: 'Rules evaluated against live records. New alerts are in the Alert Centre.', tone: 'warning' }
          : { title: 'No new alerts', body: 'All active rules evaluated. Existing alerts already cover every breach.', tone: 'success' },
      )
    }, 500)
  }

  function toggle(r: Rule, v: boolean) {
    setEnabled((prev) => ({ ...prev, [r.id]: v }))
    actions.toast({ title: `${r.id} ${v ? 'enabled' : 'paused'}`, body: v ? `${r.area} rule will evaluate on the next run.` : `${r.area} rule paused for this demo session.`, tone: v ? 'success' : 'info' })
  }

  return (
    <div>
      <PageHeader
        title="Operational Playbooks"
        count={RULES.length}
        crumbs={[{ label: 'Platform' }, { label: 'Operational Playbooks' }]}
        subtitle="IF / THEN rules that watch shared records and turn breaches into owned alerts, actions and escalations."
        tag={<DemoTag>Illustrative rules</DemoTag>}
        actions={
          <>
            <Button icon={Bell} onClick={() => navigate('/alerts')}>
              Alert Centre
            </Button>
            <Button variant="primary" icon={Play} onClick={runNow} disabled={running}>
              {running ? 'Evaluating…' : 'Run rules now'}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active rules" value={`${activeCount} / ${RULES.length}`} sub="Toggle per rule below" icon={BookOpen} />
        <Kpi label="Alerts generated" value={totalTriggered} sub="All time, by these rules" icon={Zap} />
        <Kpi label="Open rule alerts" value={totalOpen} sub="Awaiting owner action" icon={Bell} tone={totalOpen > 0 ? 'warn' : 'ok'} to="/alerts" />
        <Kpi label="Last evaluation" value={runs[0]?.time ?? clockLabel(state.clock)} sub={runs[0] ? `${runs[0].created} new alert(s)` : 'Scheduled every 15 minutes'} icon={Play} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {RULES.map((r) => {
          const st = stats[r.id]
          const on = enabled[r.id]
          return (
            <section key={r.id} className={cx('flex flex-col rounded-[12px] border border-line bg-surface transition-opacity', !on && 'opacity-60')}>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <r.icon className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.5} />
                  <h3 className="caps truncate text-[13px] text-ink">{r.area}</h3>
                  <span className="rounded-[6px] border border-line bg-muted px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{r.id}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Pill tone={on ? 'ok' : 'neutral'} dot>
                    {on ? 'Active' : 'Paused'}
                  </Pill>
                  <Switch checked={on} onChange={(v) => toggle(r, v)} label={`${on ? 'Pause' : 'Enable'} rule ${r.id}`} />
                </div>
              </header>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1.2fr]">
                  <div className="rounded-[10px] border border-line bg-muted p-3">
                    <span className="caps inline-block rounded-[4px] bg-shell px-1.5 py-0.5 text-[11px] text-white">If</span>
                    <p className="mt-2 text-[14px] font-medium text-ink">{r.condition}</p>
                  </div>
                  <div className="flex items-center justify-center text-ink-3">
                    <ArrowRight className="size-5 rotate-90 sm:rotate-0 sm:rtl:rotate-180" strokeWidth={1.5} />
                  </div>
                  <div className="rounded-[10px] border border-[#c9d7fb] bg-info-bg p-3">
                    <span className="caps inline-block rounded-[4px] bg-action px-1.5 py-0.5 text-[11px] text-white">Then</span>
                    <ul className="mt-2 space-y-1.5">
                      {r.actions.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-[13px] text-ink">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-action" strokeWidth={1.5} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-[13px]">
                  <div>
                    <div className="text-[12px] text-ink-3">Times triggered</div>
                    <div className="tabular mt-0.5 text-[20px] font-semibold text-ink">{st.count}</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-ink-3">Last triggered</div>
                    <div className="mt-1 font-medium text-ink">{st.last ? fmtDate(st.last) : 'Not yet'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] text-ink-3">Escalates to</div>
                    <div className="mt-1 truncate font-medium text-ink" title={r.escalation}>
                      {r.escalation}
                    </div>
                  </div>
                </div>

                {st.recent.length > 0 ? (
                  <ul className="divide-y divide-line rounded-[10px] border border-line">
                    {st.recent.map((a) => (
                      <li key={a.id}>
                        <button type="button" onClick={() => navigate(a.link ?? '/alerts')} className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-[#f9fafb]">
                          <LevelPill level={a.level} />
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{a.title}</span>
                          <span className="hidden shrink-0 text-[12px] text-ink-3 sm:inline">{a.status}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-[10px] border border-dashed border-line-strong px-3 py-2.5 text-[13px] text-ink-3">No alerts from this rule yet. Run the rules or change a record to trigger it.</p>
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" icon={Bell} onClick={() => navigate('/alerts')}>
                    View alerts ({st.count})
                  </Button>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card title="Test a rule" icon={FlaskConical} subtitle="PR-01 price variance simulator" actions={<DemoTag>Demo simulation</DemoTag>}>
          <p className="text-[13px] text-ink-2">
            Change the vendor unit price on purchase order <span className="font-medium text-ink">PO-450021</span>. Above a 5% variance, rule PR-01 creates an alert, compares alternate vendors and
            notifies the Procurement Head.
          </p>
          {po && (
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-[10px] border border-line p-3 text-[13px]">
              <div>
                <div className="text-[12px] text-ink-3">Original</div>
                <div className="tabular mt-0.5 font-medium text-ink">{sar(po.originalUnitPrice)}</div>
              </div>
              <div>
                <div className="text-[12px] text-ink-3">Current</div>
                <div className="tabular mt-0.5 font-medium text-ink">{sar(po.currentUnitPrice)}</div>
              </div>
              <div>
                <div className="text-[12px] text-ink-3">Variance</div>
                <div className={cx('tabular mt-0.5 font-semibold', poVar > 5 ? 'text-crit' : 'text-ok')}>
                  {poVar > 0 ? '+' : ''}
                  {poVar.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Pill tone={poVar > 5 ? 'crit' : 'ok'} dot>
              {poVar > 5 ? 'Condition met: rule fires' : 'Within 5% tolerance'}
            </Pill>
            <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => navigate('/procurement/pos/PO-450021')}>
              Open price simulator
            </Button>
          </div>
        </Card>

        <Card title="Rule run log" icon={Play} subtitle="This session">
          <DataTable
            dense
            rows={runs}
            rowKey={(r) => String(r.id)}
            columns={[
              { key: 'time', header: 'Time', render: (r) => <span className="tabular">{r.time}</span> },
              { key: 'by', header: 'Trigger', render: (r) => r.by },
              { key: 'rules', header: 'Rules evaluated', render: () => activeCount, align: 'end' },
              {
                key: 'created',
                header: 'New alerts',
                align: 'end',
                render: (r) => <Pill tone={r.created > 0 ? 'warn' : 'ok'}>{r.created}</Pill>,
              },
            ]}
            empty={
              <div className="rounded-[10px] border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-3">
                No manual runs yet. Use <span className="font-medium text-ink">Run rules now</span> to evaluate every rule against live records.
              </div>
            }
          />
          <p className="mt-3 text-[12px] text-ink-3">
            Alerts appear in the{' '}
            <Link to="/alerts" className="font-medium text-action hover:underline">
              Alert Centre
            </Link>{' '}
            with owner, due date and escalation path.
          </p>
        </Card>
      </div>

      <Note className="mt-6">Rules are configurable per client; production rule builder to be configured. Thresholds, owners and escalation paths shown here are illustrative.</Note>
    </div>
  )
}
