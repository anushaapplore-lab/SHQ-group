import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Banknote, Briefcase, CalendarClock, Database, FolderOpen, Mail, Plug, RefreshCw, ShoppingCart, Users, Wallet } from 'lucide-react'
import { Button, Card, DataTable, DemoTag, Kpi, PageHeader, Pill, Skeleton, StatusPill } from '../ui'
import { useStore } from '../../store/store'
import { num } from '../../lib/format'
import { ampm, Note } from './shared'

interface Source {
  name: string
  icon: LucideIcon
  records: number
  entities: string
}

const SOURCES: Source[] = [
  { name: 'Finance', icon: Banknote, records: 612, entities: 'Cost codes, budgets, commitments' },
  { name: 'Procurement', icon: ShoppingCart, records: 538, entities: 'Purchase orders, vendors, receipts' },
  { name: 'HR', icon: Users, records: 497, entities: 'Employees, trades, certificates' },
  { name: 'Payroll', icon: Wallet, records: 421, entities: 'Timesheets, overtime, allowances' },
  { name: 'Projects', icon: Briefcase, records: 413, entities: 'Projects, WBS, cost centres' },
]

interface LogRow {
  id: number
  time: string
  source: string
  records: number
  duration: string
  result: 'Success' | 'Warning'
  note: string
}

const START = 10 * 60 + 42

const INITIAL_LOG: LogRow[] = [
  { id: 6, time: 'Today 10:42 AM', source: 'All sources (5)', records: 2481, duration: '41 s', result: 'Success', note: 'Scheduled sync' },
  { id: 5, time: 'Today 10:42 AM', source: 'HR', records: 497, duration: '9 s', result: 'Warning', note: '3 HR records skipped: missing employee ID' },
  { id: 4, time: 'Today 06:00 AM', source: 'Payroll', records: 421, duration: '12 s', result: 'Success', note: 'Daily timesheet import' },
  { id: 3, time: 'Today 06:00 AM', source: 'Procurement', records: 538, duration: '10 s', result: 'Success', note: '2 PO price changes detected, rule PR-01 evaluated' },
  { id: 2, time: 'Yesterday 10:40 PM', source: 'Finance', records: 612, duration: '14 s', result: 'Success', note: 'Nightly commitments refresh' },
  { id: 1, time: 'Yesterday 10:40 PM', source: 'Projects', records: 413, duration: '7 s', result: 'Success', note: 'WBS and cost centres' },
]

interface Connector {
  name: string
  icon: LucideIcon
  status: string
  description: string
  cta: string
}

const OTHER: Connector[] = [
  { name: 'P6 schedule import', icon: CalendarClock, status: 'Not connected', description: 'Import baseline and update schedules (XER / XML) into Schedule & Progress.', cta: 'Request setup' },
  { name: 'Document management system', icon: FolderOpen, status: 'Not connected', description: 'Link approved documents and transmittals to MDR categories.', cta: 'Request setup' },
  { name: 'Email / notifications', icon: Mail, status: 'Simulated', description: 'Alert, escalation and approval notifications to owners.', cta: 'Send test' },
]

export function IntegrationsPage() {
  const { actions } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [log, setLog] = useState<LogRow[]>(INITIAL_LOG)
  const [syncCount, setSyncCount] = useState(0)
  const [lastSync, setLastSync] = useState(ampm(START))
  const [records, setRecords] = useState(2481)
  const [sourceSync, setSourceSync] = useState<Record<string, string>>(() => Object.fromEntries(SOURCES.map((s) => [s.name, 'Today 10:42 AM'])))

  function syncNow() {
    setSyncing(true)
    window.setTimeout(() => {
      const n = syncCount + 1
      const t = ampm(START + n * 4)
      const added = 3 + ((n * 7) % 9)
      setSyncCount(n)
      setLastSync(t)
      setRecords((r) => r + added)
      setSourceSync(Object.fromEntries(SOURCES.map((s) => [s.name, `Today ${t}`])))
      setLog((prev) => [
        { id: (prev[0]?.id ?? 0) + 1, time: `Today ${t}`, source: 'All sources (5)', records: 2481 + added, duration: `${36 + (n % 5)} s`, result: 'Success', note: `Manual sync, ${added} new or changed records` },
        ...prev,
      ])
      setSyncing(false)
      actions.toast({ title: 'Simulated ERP sync complete', body: `${num(2481 + added)} records processed from 5 sources.`, tone: 'success' })
    }, 1200)
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        crumbs={[{ label: 'Platform' }, { label: 'Integrations' }]}
        subtitle="ERP and system connectors that keep the shared record store current."
        tag={<DemoTag icon={RefreshCw}>Simulated ERP Sync</DemoTag>}
        actions={
          <Button variant="primary" icon={RefreshCw} onClick={syncNow} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        }
      />

      <Note tone="info" className="mb-6">
        <span className="font-medium text-ink">Demo integration: production connector to be configured based on SHQ ERP.</span>
      </Note>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="ERP" value={<span className="text-[20px]">Connected / Simulated</span>} sub="Demo connector" icon={Database} />
        <Kpi label="Last Sync" value={syncing ? <Skeleton className="h-6 w-24" /> : lastSync} sub="Auto-sync every 4 hours" icon={RefreshCw} />
        <Kpi label="Records" value={syncing ? <Skeleton className="h-6 w-20" /> : num(records)} sub="Across 5 data sources" icon={Database} />
        <Kpi label="Status" value={<span className="text-ok">Healthy</span>} sub="1 warning in last 24 h" icon={Plug} tone="ok" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
        <Card title="ERP data sources" icon={Database} actions={<DemoTag>Simulated</DemoTag>} bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-3 text-start hover:bg-[#f9fafb]"
                  onClick={() => actions.toast({ title: `${s.name} source`, body: `${num(s.records)} records: ${s.entities}. Last sync ${sourceSync[s.name]}.`, tone: 'info' })}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-muted">
                    <s.icon className="size-[18px] text-ink-2" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-ink">{s.name}</span>
                    <span className="block truncate text-[12px] text-ink-3">{s.entities}</span>
                  </span>
                  <span className="shrink-0 text-end">
                    {syncing ? <Skeleton className="ms-auto h-5 w-16" /> : <StatusPill status="Healthy" />}
                    <span className="mt-1 block text-[11px] text-ink-3">
                      {num(s.records)} · {sourceSync[s.name].replace('Today ', '')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Sync log" icon={RefreshCw} subtitle={`${log.length} entries`} bodyClassName="p-0">
          {syncing && (
            <div className="flex items-center gap-3 border-b border-line bg-info-bg px-5 py-2.5 text-[13px] text-ink">
              <RefreshCw className="size-4 animate-spin text-info" strokeWidth={1.5} />
              Syncing Finance, Procurement, HR, Payroll and Projects…
            </div>
          )}
          <DataTable
            dense
            rows={log}
            rowKey={(r) => String(r.id)}
            onRowClick={(r) => actions.toast({ title: `${r.source}: ${r.result}`, body: r.note, tone: r.result === 'Warning' ? 'warning' : 'info' })}
            highlight={(r) => r.result === 'Warning'}
            columns={[
              { key: 'time', header: 'Timestamp', render: (r) => <span className="whitespace-nowrap">{r.time}</span> },
              { key: 'source', header: 'Source', render: (r) => <span className="whitespace-nowrap">{r.source}</span> },
              { key: 'records', header: 'Records', align: 'end', render: (r) => <span className="tabular">{num(r.records)}</span> },
              { key: 'duration', header: 'Duration', align: 'end', hideBelow: 'sm', render: (r) => <span className="tabular">{r.duration}</span> },
              { key: 'result', header: 'Result', render: (r) => <Pill tone={r.result === 'Warning' ? 'warn' : 'ok'} dot>{r.result}</Pill> },
              { key: 'note', header: 'Detail', hideBelow: 'md', render: (r) => <span className="text-ink-2">{r.note}</span> },
            ]}
          />
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-[19px] font-medium text-ink">Other connectors</h2>
      <div className="grid gap-4 md:grid-cols-3 [&>*]:min-w-0">
        {OTHER.map((c) => (
          <section key={c.name} className="flex flex-col rounded-[12px] border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-9 items-center justify-center rounded-[8px] bg-muted">
                <c.icon className="size-[18px] text-ink-2" strokeWidth={1.5} />
              </span>
              <Pill tone={c.status === 'Simulated' ? 'info' : 'neutral'} dot>
                {c.status}
              </Pill>
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-ink">{c.name}</h3>
            <p className="mt-1 flex-1 text-[13px] text-ink-2">{c.description}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <DemoTag icon={Plug}>Production integration configurable</DemoTag>
              <Button
                size="sm"
                onClick={() =>
                  actions.toast(
                    c.cta === 'Send test'
                      ? { title: 'Test notification sent (simulated)', body: 'Delivered to the demo inbox of the current role.', tone: 'success' }
                      : { title: `${c.name}: setup requested`, body: 'Logged for the integration rollout plan.', tone: 'info' },
                  )
                }
              >
                {c.cta}
              </Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
