import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, ClipboardList, Eye, FileCheck2, FileSpreadsheet, FileText, FileWarning, Hourglass, LayoutDashboard, ShieldCheck, Truck, Users } from 'lucide-react'
import { Button, DemoTag, Loading, Modal, PageHeader, Pill, RagBadge, StatusPill } from '../ui'
import { useStore } from '../../store/store'
import type { AppState } from '../../store/seed'
import { complianceStatus, handoverPct, inProject, mdrSummary, ncrAge, ncrOverdue, openNcrs, poVariance, projectName } from '../../store/selectors'
import { clockLabel, cx, daysUntil, fmtDate, num, sar, sarM } from '../../lib/format'
import { downloadCsv, Note } from './shared'

type ReportId = 'exec' | 'dpr' | 'qaqc' | 'ncr' | 'hse' | 'manpower' | 'procurement' | 'handover' | 'compliance'

interface ReportDef {
  id: ReportId
  name: string
  description: string
  frequency: string
  lastGenerated: string
  owner: string
  icon: LucideIcon
}

const REPORTS: ReportDef[] = [
  { id: 'exec', name: 'Executive Monthly Report', description: 'Portfolio KPIs, project RAG and progress, top risks and decisions required.', frequency: 'Monthly', lastGenerated: '2026-09-01', owner: 'CEO Office', icon: LayoutDashboard },
  { id: 'dpr', name: 'Project DPR', description: 'Daily progress, manpower, equipment, issues and delay causes per work front.', frequency: 'Daily', lastGenerated: '2026-09-30', owner: 'Project Controls', icon: ClipboardList },
  { id: 'qaqc', name: 'QA/QC Report', description: 'Inspections performed, pass rate, rework and open quality holds.', frequency: 'Weekly', lastGenerated: '2026-09-28', owner: 'QA/QC Manager', icon: BadgeCheck },
  { id: 'ncr', name: 'NCR Register', description: 'All non-conformance reports with severity, age, SLA and responsible party.', frequency: 'Weekly', lastGenerated: '2026-09-28', owner: 'QA/QC Manager', icon: FileWarning },
  { id: 'hse', name: 'HSE Report', description: 'Observations, high-risk items, overdue actions and leading indicators.', frequency: 'Weekly', lastGenerated: '2026-09-28', owner: 'HSE Manager', icon: ShieldCheck },
  { id: 'manpower', name: 'Manpower Report', description: 'Deployed versus planned workforce and utilisation by project.', frequency: 'Weekly', lastGenerated: '2026-09-29', owner: 'HR Manager', icon: Users },
  { id: 'procurement', name: 'Procurement Report', description: 'Purchase order status, delivery delays and price variance exposure.', frequency: 'Weekly', lastGenerated: '2026-09-29', owner: 'Procurement Manager', icon: Truck },
  { id: 'handover', name: 'Handover Readiness Report', description: 'MDR completion by category, missing and expired documents.', frequency: 'Bi-weekly', lastGenerated: '2026-09-24', owner: 'Document Controller', icon: FileCheck2 },
  { id: 'compliance', name: 'Compliance Expiry Report', description: 'Licences, permits, certificates and contracts expiring in the next 60 days.', frequency: 'Weekly', lastGenerated: '2026-09-28', owner: 'Compliance Lead', icon: Hourglass },
]

type Cell = string | number
interface Table {
  headers: string[]
  rows: Cell[][]
}

/** Tabular data per report, shared by preview and CSV export. */
function reportTable(id: ReportId, s: AppState): Table {
  const f = s.projectFilter
  switch (id) {
    case 'exec':
      return {
        headers: ['Project', 'RAG', 'Progress %', 'Planned %', 'Variance (days)', 'Budget', 'Actual', 'Handover %'],
        rows: inProject(s.projects, f).map((p) => [p.shortName, p.rag, p.progress, p.planned, p.scheduleVarianceDays, sarM(p.budget), sarM(p.actual), handoverPct(s, p.id)]),
      }
    case 'dpr':
      return {
        headers: ['Date', 'Project', 'Work package', 'Location', 'Manpower', 'Progress Δ %', 'Delay cause'],
        rows: inProject(s.dprs, f).map((d) => [fmtDate(d.date), projectName(s, d.projectId), d.workPackage, d.location, d.manpower, d.progressDelta, d.delayCause || 'None']),
      }
    case 'qaqc':
      return {
        headers: ['Inspection', 'Date', 'Project', 'Discipline', 'Reference', 'Inspector', 'Result'],
        rows: inProject(s.inspections, f).map((i) => [i.id, fmtDate(i.date), projectName(s, i.projectId), i.discipline, i.reference, i.inspector, i.result]),
      }
    case 'ncr':
      return {
        headers: ['NCR', 'Title', 'Project', 'Severity', 'Status', 'Age (days)', 'SLA (days)', 'Responsible'],
        rows: inProject(s.ncrs, f).map((n) => [n.id, n.title, projectName(s, n.projectId), n.severity, n.status, ncrAge(n), n.slaDays, n.responsible]),
      }
    case 'hse':
      return {
        headers: ['Observation', 'Title', 'Project', 'Severity', 'Status', 'Assigned to', 'Due'],
        rows: inProject(s.observations, f).map((o) => [o.id, o.title, projectName(s, o.projectId), o.severity, o.status, o.assignedTo, fmtDate(o.dueDate)]),
      }
    case 'manpower':
      return {
        headers: ['Project', 'Deployed', 'Planned', 'Gap', 'Fill rate %'],
        rows: inProject(s.projects, f).map((p) => [p.shortName, p.workforce, p.workforcePlanned, p.workforce - p.workforcePlanned, p.workforcePlanned ? Math.round((p.workforce / p.workforcePlanned) * 100) : 100]),
      }
    case 'procurement':
      return {
        headers: ['PO', 'Material', 'Vendor', 'Value', 'Price variance %', 'Days late', 'Status'],
        rows: inProject(s.pos, f).map((p) => [p.id, p.material, s.vendors.find((v) => v.id === p.vendorId)?.name ?? p.vendorId, sar(p.value), Number(poVariance(p).toFixed(1)), p.daysLate, p.status]),
      }
    case 'handover': {
      const pid = f !== 'all' && s.mdr[f] ? f : 'NPE'
      return {
        headers: ['Category', 'Required', 'Completed', 'Under review', 'Expired', 'Missing', 'Complete %'],
        rows: (s.mdr[pid] ?? []).map((c) => [c.name, c.required, c.completed, c.review, c.expired, c.required - c.completed - c.review - c.expired, c.required ? Math.round((c.completed / c.required) * 100) : 0]),
      }
    }
    case 'compliance':
      return {
        headers: ['Item', 'Type', 'Project', 'Reference', 'Expiry', 'Days left', 'Status', 'Owner'],
        rows: inProject(s.compliance, f)
          .filter((c) => daysUntil(c.expiry) <= 60)
          .sort((a, b) => a.expiry.localeCompare(b.expiry))
          .map((c) => [c.item, c.kind, projectName(s, c.projectId), c.reference, fmtDate(c.expiry), daysUntil(c.expiry), complianceStatus(c), c.owner]),
      }
  }
}

function summaryFor(id: ReportId, s: AppState): { label: string; value: string; tone?: 'crit' | 'warn' | 'ok' }[] {
  const f = s.projectFilter
  switch (id) {
    case 'exec': {
      const ps = inProject(s.projects, f)
      return [
        { label: 'Projects', value: String(ps.length) },
        { label: 'At risk (amber/red)', value: String(ps.filter((p) => p.rag !== 'GREEN').length), tone: 'warn' },
        { label: 'Open NCRs', value: String(openNcrs(s, f).length) },
        { label: 'Open critical alerts', value: String(s.alerts.filter((a) => a.level === 'critical' && a.status !== 'Resolved' && (f === 'all' || a.projectId === f)).length), tone: 'crit' },
      ]
    }
    case 'ncr': {
      const ns = inProject(s.ncrs, f)
      return [
        { label: 'Total NCRs', value: String(ns.length) },
        { label: 'Open', value: String(ns.filter((n) => n.status !== 'Closed').length), tone: 'warn' },
        { label: 'Overdue vs SLA', value: String(ns.filter(ncrOverdue).length), tone: 'crit' },
        { label: 'Closed', value: String(ns.filter((n) => n.status === 'Closed').length), tone: 'ok' },
      ]
    }
    case 'handover': {
      const pid = f !== 'all' && s.mdr[f] ? f : 'NPE'
      const m = mdrSummary(s.mdr[pid])
      return [
        { label: 'Required', value: num(m.required) },
        { label: 'Completed', value: `${m.pct}%`, tone: m.pct >= 90 ? 'ok' : 'warn' },
        { label: 'Missing', value: num(m.missing), tone: 'crit' },
        { label: 'Expired', value: num(m.expired), tone: 'warn' },
      ]
    }
    case 'compliance': {
      const cs = inProject(s.compliance, f)
      return [
        { label: 'Tracked items', value: String(cs.length) },
        { label: 'Expiring ≤ 30 days', value: String(cs.filter((c) => complianceStatus(c) === 'Expiring Soon').length), tone: 'warn' },
        { label: 'Expired', value: String(cs.filter((c) => complianceStatus(c) === 'Expired').length), tone: 'crit' },
        { label: 'Renewal in progress', value: String(cs.filter((c) => complianceStatus(c) === 'Renewal In Progress').length) },
      ]
    }
    case 'hse': {
      const os = inProject(s.observations, f)
      return [
        { label: 'Observations', value: String(os.length) },
        { label: 'Open', value: String(os.filter((o) => o.status !== 'Closed').length), tone: 'warn' },
        { label: 'High / critical', value: String(os.filter((o) => o.severity === 'High' || o.severity === 'Critical').length), tone: 'crit' },
        { label: 'Incidents YTD', value: String(s.hseStats.incidents) },
      ]
    }
    case 'procurement': {
      const pos = inProject(s.pos, f)
      return [
        { label: 'Purchase orders', value: String(pos.length) },
        { label: 'Delivering late', value: String(pos.filter((p) => p.daysLate > 0).length), tone: 'warn' },
        { label: 'Price variance > 5%', value: String(pos.filter((p) => poVariance(p) > 5).length), tone: 'crit' },
        { label: 'Critical POs', value: String(pos.filter((p) => p.critical).length) },
      ]
    }
    case 'qaqc': {
      const is = inProject(s.inspections, f)
      return [
        { label: 'Inspections', value: String(is.length) },
        { label: 'Passed', value: String(is.filter((i) => i.result === 'Passed').length), tone: 'ok' },
        { label: 'Failed', value: String(is.filter((i) => i.result === 'Failed').length), tone: 'crit' },
        { label: 'Rework cost', value: sar(s.qaStats.reworkCost, { compact: true }) },
      ]
    }
    case 'manpower': {
      const ps = inProject(s.projects, f)
      const dep = ps.reduce((a, p) => a + p.workforce, 0)
      const plan = ps.reduce((a, p) => a + p.workforcePlanned, 0)
      return [
        { label: 'Deployed', value: num(dep) },
        { label: 'Planned', value: num(plan) },
        { label: 'Gap', value: num(dep - plan), tone: dep < plan ? 'warn' : 'ok' },
        { label: 'Fill rate', value: `${plan ? Math.round((dep / plan) * 100) : 100}%` },
      ]
    }
    case 'dpr': {
      const ds = inProject(s.dprs, f)
      return [
        { label: 'Reports', value: String(ds.length) },
        { label: 'Avg manpower', value: ds.length ? num(Math.round(ds.reduce((a, d) => a + d.manpower, 0) / ds.length)) : '0' },
        { label: 'With delay cause', value: String(ds.filter((d) => d.delayCause && d.delayCause !== 'None').length), tone: 'warn' },
        { label: 'Photos attached', value: String(ds.reduce((a, d) => a + d.photos, 0)) },
      ]
    }
  }
}

function renderCell(header: string, v: Cell) {
  if (header === 'RAG' && (v === 'GREEN' || v === 'AMBER' || v === 'RED')) return <RagBadge rag={v} />
  if (header === 'Status' || header === 'Result') return <StatusPill status={String(v)} />
  return typeof v === 'number' ? <span className="tabular">{num(v)}</span> : v
}

function ReportPreview({ report, state }: { report: ReportDef; state: AppState }) {
  const table = reportTable(report.id, state)
  const summary = summaryFor(report.id, state)
  const scope = state.projectFilter === 'all' ? 'All projects' : projectName(state, state.projectFilter)
  const topRisks = report.id === 'exec' ? [...inProject(state.risks, state.projectFilter)].sort((a, b) => b.probability * b.impact - a.probability * a.impact).slice(0, 4) : []
  const rows = table.rows.slice(0, 15)
  return (
    <div className="rounded-[10px] border border-line">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-muted px-5 py-4">
        <div>
          <div className="caps text-[11px] text-ink-3">SHQ Operations Command</div>
          <div className="mt-1 text-[18px] font-semibold text-ink">{report.name}</div>
          <div className="mt-0.5 text-[12px] text-ink-2">
            {scope} · Period ending {fmtDate('2026-09-30')} · Generated {fmtDate('2026-10-01')} {clockLabel(state.clock)}
          </div>
        </div>
        <DemoTag>Demo data</DemoTag>
      </div>
      <div className="space-y-5 px-5 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((k) => (
            <div key={k.label} className="rounded-[8px] border border-line px-3 py-2.5">
              <div className="text-[11px] text-ink-3">{k.label}</div>
              <div className={cx('tabular mt-1 text-[18px] font-semibold', k.tone === 'crit' ? 'text-crit' : k.tone === 'warn' ? 'text-warn' : k.tone === 'ok' ? 'text-ok' : 'text-ink')}>{k.value}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="caps mb-2 text-[12px] text-ink-2">{report.id === 'exec' ? 'Project status' : 'Detail'}</div>
          {rows.length === 0 ? (
            <p className="rounded-[8px] border border-dashed border-line-strong px-3 py-4 text-center text-[13px] text-ink-3">No records in scope for this report.</p>
          ) : (
            <div className="scrollbar-thin overflow-x-auto rounded-[8px] border border-line">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-line bg-[#fafbfc]">
                    {table.headers.map((h) => (
                      <th key={h} className="caps px-3 py-2 text-start text-[10px] font-medium whitespace-nowrap text-ink-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-line last:border-b-0">
                      {r.map((c, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap text-ink">
                          {renderCell(table.headers[j], c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {table.rows.length > rows.length && <p className="mt-2 text-[12px] text-ink-3">Showing 15 of {table.rows.length} rows. Full detail in the export.</p>}
        </div>

        {topRisks.length > 0 && (
          <div>
            <div className="caps mb-2 text-[12px] text-ink-2">Top risks</div>
            <ul className="divide-y divide-line rounded-[8px] border border-line">
              {topRisks.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{r.title}</span>
                    <span className="block truncate text-[12px] text-ink-3">
                      {projectName(state, r.projectId)} · {r.mitigation}
                    </span>
                  </span>
                  <Pill tone={r.probability * r.impact >= 15 ? 'crit' : r.probability * r.impact >= 8 ? 'warn' : 'neutral'}>Score {r.probability * r.impact}</Pill>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="border-t border-line pt-3 text-[11px] text-ink-3">Generated from live prototype records. Illustrative data, not actual SHQ results. Report layout adapts to the selected client format pack.</p>
      </div>
    </div>
  )
}

function PreviewModal({ report, onClose, onExport, busy }: { report: ReportDef; onClose: () => void; onExport: (r: ReportDef, kind: 'pdf' | 'xlsx') => void; busy: string | null }) {
  const { state } = useStore()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 600)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <Modal
      open
      onClose={onClose}
      width={900}
      title={report.name}
      subtitle={`${report.frequency} · Owner: ${report.owner}`}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button icon={FileSpreadsheet} disabled={busy === `${report.id}-xlsx`} onClick={() => onExport(report, 'xlsx')}>
            {busy === `${report.id}-xlsx` ? 'Generating…' : 'Export Excel'}
          </Button>
          <Button variant="primary" icon={FileText} disabled={busy === `${report.id}-pdf`} onClick={() => onExport(report, 'pdf')}>
            {busy === `${report.id}-pdf` ? 'Generating…' : 'Export PDF'}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="space-y-5 py-2">
          <Loading lines={2} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-[8px]" />
            ))}
          </div>
          <Loading lines={6} />
        </div>
      ) : (
        <ReportPreview report={report} state={state} />
      )}
    </Modal>
  )
}

export function ReportsPage() {
  const { state, actions } = useStore()
  const [preview, setPreview] = useState<ReportDef | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Record<string, string>>({})

  function exportReport(r: ReportDef, kind: 'pdf' | 'xlsx') {
    setBusy(`${r.id}-${kind}`)
    window.setTimeout(() => {
      setBusy(null)
      setGenerated((g) => ({ ...g, [r.id]: `Today ${clockLabel(state.clock)}` }))
      if (kind === 'xlsx') {
        const t = reportTable(r.id, state)
        const ok = downloadCsv(`${r.name}.csv`, t.headers, t.rows)
        actions.toast({ title: `${r.name}.xlsx generated (simulated)`, body: ok ? 'A CSV extract of the same data was downloaded.' : 'Export prepared for download.', tone: 'success' })
      } else {
        actions.toast({ title: `${r.name}.pdf generated (simulated)`, body: 'Formatted with the default report layout.', tone: 'success' })
      }
    }, 800)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        count={REPORTS.length}
        crumbs={[{ label: 'Platform' }, { label: 'Reports' }]}
        subtitle="Standard reports generated from the same live records the dashboards use. Preview before exporting."
        tag={<DemoTag>Simulated export</DemoTag>}
      />
      {state.projectFilter !== 'all' && (
        <Note tone="info" className="mb-4">
          Reports are scoped to <span className="font-medium text-ink">{projectName(state, state.projectFilter)}</span> by the global project filter.
        </Note>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        {REPORTS.map((r) => (
          <section key={r.id} className="flex flex-col rounded-[12px] border border-line bg-surface p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-muted">
                <r.icon className="size-[18px] text-ink-2" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-ink">{r.name}</h3>
                <p className="mt-1 text-[13px] text-ink-2">{r.description}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
              <div>
                <dt className="text-ink-3">Last generated</dt>
                <dd className="mt-0.5 font-medium text-ink">{generated[r.id] ?? fmtDate(r.lastGenerated)}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Frequency</dt>
                <dd className="mt-0.5 font-medium text-ink">{r.frequency}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="primary" icon={Eye} onClick={() => setPreview(r)}>
                Preview
              </Button>
              <Button size="sm" icon={FileText} disabled={busy === `${r.id}-pdf`} onClick={() => exportReport(r, 'pdf')}>
                {busy === `${r.id}-pdf` ? 'Generating…' : 'Export PDF'}
              </Button>
              <Button size="sm" icon={FileSpreadsheet} disabled={busy === `${r.id}-xlsx`} onClick={() => exportReport(r, 'xlsx')}>
                {busy === `${r.id}-xlsx` ? 'Generating…' : 'Export Excel'}
              </Button>
            </div>
          </section>
        ))}
      </div>

      <Note className="mt-6">PDF and Excel exports are simulated in this prototype. Excel export downloads a CSV extract of the live demo data.</Note>

      {preview && <PreviewModal key={preview.id} report={preview} onClose={() => setPreview(null)} onExport={exportReport} busy={busy} />}
    </div>
  )
}
