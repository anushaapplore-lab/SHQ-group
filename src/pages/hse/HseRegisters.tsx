import { useState } from 'react'
import { AlertTriangle, BadgeCheck, Check, ClipboardCheck, Droplets, FileCheck2, Plus, Scale, Siren, Thermometer, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { heatStress, incidents, permits, riskAssessments } from '../../data/hse'
import { DEMO_TODAY, cx, daysUntil, fmtDate, fmtShort } from '../../lib/format'
import { complianceStatus, inProject, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import {
  Button,
  Card,
  DataTable,
  DemoTag,
  EmptyState,
  Field,
  Input,
  Kpi,
  KeyValue,
  LinkText,
  Modal,
  PageHeader,
  Pill,
  ProgressBar,
  Select,
  SlideOver,
  StatusPill,
} from '../../components/ui'
import type { Column } from '../../components/ui'

const hseCrumbs = (label: string) => [{ label: 'HSE', to: '/hse' }, { label }]

function FilterNote() {
  const { state } = useStore()
  if (state.projectFilter === 'all') return null
  return <Pill tone="info">{projectName(state, state.projectFilter)}</Pill>
}

/* ======================= Incidents ======================= */

type Incident = (typeof incidents)[number]

const INVESTIGATION: Record<string, { cause: string; actions: string[] }> = {
  'INC-0077': { cause: 'Cut-resistant gloves not worn while handling spiral-wound gaskets.', actions: ['Glove standard reissued to bay 2', 'Toolbox talk on hand protection'] },
  'INC-0078': { cause: 'Side boom travel path not marked; operator visibility limited by stacked pipe.', actions: ['Mark travel lanes at stringing area', 'Assign banksman for all side boom travel'] },
  'INC-0079': { cause: 'Tool not tethered while working on pipe rack at 4 m.', actions: ['Tool tethering mandatory above 2 m', 'Drop zone barricade below work at height'] },
  'INC-0080': { cause: 'Work/rest regime not followed during 13:00 peak WBGT.', actions: ['Supervisor heat stress briefing', 'Extra hydration station at KP 42'] },
  'INC-0081': { cause: 'Pedestrian route crossing vehicle reversing area without segregation.', actions: ['Install hard barrier between routes', 'Reversing only with banksman'] },
}

function incidentSteps(status: string) {
  const stages = ['Reported', 'Immediate response', 'Investigation', 'Corrective actions', 'Closed']
  const at = status === 'Closed' ? 5 : status === 'Investigation' ? 2 : status === 'Corrective Actions' ? 3 : 1
  return stages.map((s, i) => ({ label: s, state: i < at ? 'done' : i === at ? 'current' : 'future' }) as const)
}

export function IncidentsPage() {
  const { state, actions } = useStore()
  const [sel, setSel] = useState<Incident | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const statusOf = (i: Incident) => overrides[i.id] ?? i.status
  const rows = inProject(incidents, state.projectFilter)
  const count = (t: string) => rows.filter((r) => r.type === t).length

  const advance = (i: Incident) => {
    const cur = statusOf(i)
    const next = cur === 'Open' ? 'Investigation' : cur === 'Investigation' ? 'Corrective Actions' : 'Closed'
    setOverrides((o) => ({ ...o, [i.id]: next }))
    actions.toast({ title: `${i.id} moved to ${next}`, body: next === 'Closed' ? 'Lessons learned shared with all projects.' : undefined, tone: 'success' })
  }

  const cols: Column<Incident>[] = [
    { key: 'id', header: 'ID', render: (i) => <span className="font-medium whitespace-nowrap">{i.id}</span> },
    { key: 'title', header: 'Incident', render: (i) => <span className="block min-w-[200px]">{i.title}</span> },
    { key: 'type', header: 'Type', render: (i) => <Pill tone={i.type === 'Near Miss' ? 'info' : i.type === 'First Aid' ? 'warn' : 'neutral'}>{i.type}</Pill> },
    { key: 'proj', header: 'Project', render: (i) => <span className="text-ink-2">{i.projectId}</span>, hideBelow: 'md' },
    { key: 'date', header: 'Date', render: (i) => <span className="whitespace-nowrap text-ink-2">{fmtShort(i.date)}</span>, hideBelow: 'sm' },
    { key: 'inv', header: 'Investigator', render: (i) => <span className="whitespace-nowrap text-ink-2">{i.investigator}</span>, hideBelow: 'lg' },
    { key: 'status', header: 'Status', render: (i) => <StatusPill status={statusOf(i)} /> },
  ]

  const selStatus = sel ? statusOf(sel) : ''
  return (
    <div>
      <PageHeader title="Incidents" count={rows.length} crumbs={hseCrumbs('Incidents')} subtitle="First aid cases, near misses and property damage with investigation status." tag={<FilterNote />} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Lost time injuries" value={0} sub="Year to date" tone="ok" icon={BadgeCheck} />
        <Kpi label="First aid cases" value={count('First Aid')} icon={AlertTriangle} />
        <Kpi label="Near misses" value={count('Near Miss')} icon={Siren} />
        <Kpi label="Property damage" value={count('Property Damage')} icon={X} />
      </div>
      <Card bodyClassName="p-0">
        <DataTable columns={cols} rows={rows} rowKey={(i) => i.id} onRowClick={setSel} empty={<div className="p-5"><EmptyState title="No incidents for this project" /></div>} />
      </Card>
      <SlideOver
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.title ?? ''}
        subtitle={sel ? `${sel.id} · ${sel.type} · ${projectName(state, sel.projectId)}` : ''}
        footer={
          sel && selStatus !== 'Closed' ? (
            <>
              <Button onClick={() => actions.toast({ title: 'Investigation pack requested', body: `${sel.investigator} notified to upload statements and photos.`, tone: 'info' })}>Request evidence</Button>
              <Button variant="primary" onClick={() => advance(sel)}>
                {selStatus === 'Open' ? 'Start investigation' : selStatus === 'Investigation' ? 'Approve root cause' : 'Close incident'}
              </Button>
            </>
          ) : undefined
        }
      >
        {sel && (
          <div className="space-y-5">
            <KeyValue
              rows={[
                { label: 'Date', value: fmtDate(sel.date) },
                { label: 'Type', value: sel.type },
                { label: 'Investigator', value: sel.investigator },
                { label: 'Status', value: <StatusPill status={selStatus} /> },
              ]}
            />
            <div>
              <div className="caps mb-2 text-[11px] text-ink-3">Investigation steps</div>
              <ol className="space-y-0">
                {incidentSteps(selStatus).map((s, i, arr) => (
                  <li key={s.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={cx('flex size-6 items-center justify-center rounded-full text-[11px] font-semibold', s.state === 'done' ? 'bg-ok text-white' : s.state === 'current' ? 'bg-action text-white' : 'border border-line bg-surface text-ink-3')}>
                        {s.state === 'done' ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
                      </span>
                      {i < arr.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                    </div>
                    <div className="pb-4">
                      <div className={cx('text-[14px]', s.state === 'future' ? 'text-ink-3' : 'font-medium text-ink')}>{s.label}</div>
                      <div className="text-[12px] text-ink-3">{s.state === 'done' ? 'Completed' : s.state === 'current' ? 'In progress' : 'Not started'}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <div className="caps mb-1.5 text-[11px] text-ink-3">Root cause (draft)</div>
              <p className="text-[14px] text-ink">{INVESTIGATION[sel.id]?.cause}</p>
            </div>
            <div>
              <div className="caps mb-1.5 text-[11px] text-ink-3">Corrective actions</div>
              <ul className="space-y-1">
                {INVESTIGATION[sel.id]?.actions.map((a) => (
                  <li key={a} className="flex gap-2 text-[14px] text-ink">
                    <Check className="mt-0.5 size-4 text-ok" strokeWidth={2} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

/* ======================= Permits ======================= */

type Permit = (typeof permits)[number]

export function PermitsPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [sel, setSel] = useState<Permit | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const statusOf = (p: Permit) => overrides[p.id] ?? p.status
  const rows = inProject(permits, state.projectFilter)
  const by = (s: string) => rows.filter((p) => statusOf(p) === s).length
  const obs1042 = state.observations.find((o) => o.id === 'OBS-1042')

  const setStatus = (p: Permit, status: string, msg: string) => {
    setOverrides((o) => ({ ...o, [p.id]: status }))
    actions.toast({ title: `${p.id} ${status.toLowerCase()}`, body: msg, tone: status === 'Suspended' ? 'warning' : 'success' })
  }

  const cols: Column<Permit>[] = [
    { key: 'id', header: 'Permit', render: (p) => <span className="font-medium whitespace-nowrap">{p.id}</span> },
    { key: 'type', header: 'Type', render: (p) => <span className="whitespace-nowrap">{p.type}</span> },
    { key: 'loc', header: 'Location', render: (p) => <span className="whitespace-nowrap text-ink-2">{p.location}</span>, hideBelow: 'sm' },
    { key: 'iss', header: 'Issuing authority', render: (p) => <span className="text-ink-2">{p.issuer}</span>, hideBelow: 'lg' },
    { key: 'valid', header: 'Validity', render: (p) => <span className="whitespace-nowrap text-ink-2">{p.valid}</span>, hideBelow: 'md' },
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={statusOf(p)} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Permits to Work"
        count={rows.length}
        crumbs={hseCrumbs('Permits')}
        subtitle="Live PTW status for hot work, critical lifts, excavation, confined space and isolation (LOTO)."
        tag={<FilterNote />}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => actions.toast({ title: 'PTW request drafted', body: 'Sent to the Area Authority for issue. JSA and gas test attachments required.', tone: 'info' })}>
            Request permit
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Active" value={by('Active')} tone="ok" icon={FileCheck2} />
        <Kpi label="Suspended" value={by('Suspended')} tone={by('Suspended') ? 'crit' : 'ok'} icon={Siren} />
        <Kpi label="Pending issue" value={by('Pending')} tone="warn" icon={ClipboardCheck} />
      </div>
      {statusOf(permits[1]) === 'Suspended' && (state.projectFilter === 'all' || state.projectFilter === 'NPE') && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#f3c5c5] bg-crit-bg px-4 py-3 text-[14px] text-crit">
          <Siren className="size-5 shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            PTW-NPE-2292 critical lift suspended after OBS-1042: worker beneath suspended load at KP 42+450.
          </span>
          <LinkText to="/hse/observations/OBS-1042">Open observation</LinkText>
        </div>
      )}
      <Card bodyClassName="p-0">
        <DataTable columns={cols} rows={rows} rowKey={(p) => p.id} onRowClick={setSel} highlight={(p) => statusOf(p) === 'Suspended'} />
      </Card>
      <SlideOver
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel ? `${sel.id} · ${sel.type}` : ''}
        subtitle={sel ? projectName(state, sel.projectId) : ''}
        footer={
          sel ? (
            statusOf(sel) === 'Suspended' ? (
              <Button variant="primary" onClick={() => setStatus(sel, 'Active', 'Exclusion zone and banksman verified by Area Authority. Lifting may resume.')}>
                Reinstate permit
              </Button>
            ) : statusOf(sel) === 'Pending' ? (
              <Button variant="primary" onClick={() => setStatus(sel, 'Active', 'Permit issued after joint site inspection.')}>
                Issue permit
              </Button>
            ) : (
              <>
                <Button onClick={() => actions.toast({ title: `${sel.id} extension requested`, body: 'Revalidation sent to the issuing authority for the next shift.', tone: 'info' })}>Request extension</Button>
                <Button variant="danger" onClick={() => setStatus(sel, 'Suspended', 'All work under this permit stopped until controls are verified.')}>
                  Suspend
                </Button>
              </>
            )
          ) : undefined
        }
      >
        {sel && (
          <div className="space-y-4">
            <KeyValue
              rows={[
                { label: 'Type', value: sel.type },
                { label: 'Location', value: sel.location },
                { label: 'Issuing authority', value: sel.issuer },
                { label: 'Validity', value: sel.valid },
                { label: 'Status', value: <StatusPill status={statusOf(sel)} /> },
                { label: 'Linked JSA', value: sel.id === 'PTW-NPE-2292' ? 'JSA-NPE-041 (review required)' : 'Current JSA on file' },
              ]}
            />
            {sel.id === 'PTW-NPE-2292' && statusOf(sel) === 'Suspended' && (
              <div className="rounded-[8px] bg-crit-bg p-3 text-[13px] text-crit">
                Suspended because of OBS-1042 ({obs1042?.status ?? 'Open'}). Reinstate only after the exclusion zone is established, a banksman is assigned and the lift plan is re-briefed.
                <button type="button" onClick={() => navigate('/hse/observations/OBS-1042')} className="mt-2 block font-semibold underline">
                  View OBS-1042
                </button>
              </div>
            )}
            <div>
              <div className="caps mb-1.5 text-[11px] text-ink-3">Pre-issue checks</div>
              <ul className="space-y-1 text-[14px] text-ink">
                {['JSA reviewed with crew', 'Toolbox talk signed', sel.type.includes('Hot') || sel.type.includes('Confined') ? 'Gas test recorded' : 'Equipment certificates valid', sel.type.includes('Isolation') ? 'LOTO applied and verified' : 'Barricades and signage in place'].map((c) => (
                  <li key={c} className="flex gap-2">
                    <Check className="mt-0.5 size-4 text-ok" strokeWidth={2} /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

/* ======================= HSE Inspections ======================= */

interface HseInspection {
  id: string
  projectId: string
  title: string
  area: string
  inspector: string
  date: string
  checks: { item: string; ok: boolean }[]
}

const CHECK_ITEMS: Record<string, string[]> = {
  'Weekly site walkdown': ['Housekeeping and access routes clear', 'Barricades and signage in place', 'PPE compliance', 'Fire extinguishers inspected', 'Welfare and hydration stations stocked', 'Emergency muster point marked'],
  'Lifting equipment': ['Lift plan available and briefed', 'Exclusion zone established', 'Banksman / signaller assigned', 'Slings and shackles colour-coded', 'Load test certificate valid', 'Wind speed within limits'],
  'Excavation': ['Edge protection installed', 'Shoring or benching adequate', 'Means of access every 7.5 m', 'Spoil set back from edge', 'Buried services marked', 'Daily inspection tag'],
  'Hot work': ['PTW displayed at location', 'Gas test recorded', 'Fire watch assigned', 'Combustibles removed or covered', 'Fire extinguisher at work point', 'Welding screens in place'],
}

const seedInspections: HseInspection[] = [
  { id: 'HSI-0412', projectId: 'NPE', title: 'Weekly site walkdown', area: 'Spread 2, KP 38 to 46', inspector: 'Faisal Al-Qahtani', date: '2026-09-30', checks: CHECK_ITEMS['Weekly site walkdown'].map((item, i) => ({ item, ok: i !== 4 })) },
  { id: 'HSI-0411', projectId: 'NPE', title: 'Lifting equipment', area: 'Stringing area KP 42', inspector: 'Faisal Al-Qahtani', date: '2026-09-29', checks: CHECK_ITEMS['Lifting equipment'].map((item, i) => ({ item, ok: i !== 1 && i !== 2 })) },
  { id: 'HSI-0410', projectId: 'EGC', title: 'Hot work', area: 'Fabrication shop bay 2', inspector: 'Tariq Al-Shehri', date: '2026-09-29', checks: CHECK_ITEMS['Hot work'].map((item, i) => ({ item, ok: i !== 2 })) },
  { id: 'HSI-0409', projectId: 'RUU', title: 'Weekly site walkdown', area: 'Unit 300 pipe racks', inspector: 'Hamad Al-Rashid', date: '2026-09-28', checks: CHECK_ITEMS['Weekly site walkdown'].map((item) => ({ item, ok: true })) },
  { id: 'HSI-0408', projectId: 'NPE', title: 'Excavation', area: 'KP 33 open trench', inspector: 'Sami Al-Otaibi', date: '2026-09-28', checks: CHECK_ITEMS['Excavation'].map((item, i) => ({ item, ok: i !== 0 })) },
  { id: 'HSI-0407', projectId: 'KSS', title: 'Weekly site walkdown', area: 'Substation building', inspector: 'Hamad Al-Rashid', date: '2026-09-27', checks: CHECK_ITEMS['Weekly site walkdown'].map((item, i) => ({ item, ok: i % 3 !== 0 })) },
]

const scoreOf = (i: HseInspection) => Math.round((i.checks.filter((c) => c.ok).length / i.checks.length) * 100)

export function HseInspectionsPage() {
  const { state, actions } = useStore()
  const [list, setList] = useState<HseInspection[]>(seedInspections)
  const [sel, setSel] = useState<HseInspection | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ projectId: 'NPE', title: 'Weekly site walkdown', area: '', inspector: 'Faisal Al-Qahtani', fails: [] as string[] })
  const rows = inProject(list, state.projectFilter)
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + scoreOf(r), 0) / rows.length) : 0

  const create = () => {
    const id = `HSI-0${413 + list.length - seedInspections.length}`
    const rec: HseInspection = {
      id,
      projectId: form.projectId,
      title: form.title,
      area: form.area.trim() || 'General site',
      inspector: form.inspector,
      date: DEMO_TODAY,
      checks: CHECK_ITEMS[form.title].map((item) => ({ item, ok: !form.fails.includes(item) })),
    }
    setList((l) => [rec, ...l])
    setOpen(false)
    setForm((f) => ({ ...f, area: '', fails: [] }))
    actions.toast({ title: `${id} recorded`, body: `Score ${scoreOf(rec)}%. ${rec.checks.filter((c) => !c.ok).length} findings to close out.`, tone: 'success' })
  }

  const cols: Column<HseInspection>[] = [
    { key: 'id', header: 'ID', render: (i) => <span className="font-medium">{i.id}</span> },
    { key: 'title', header: 'Checklist', render: (i) => <div className="min-w-[180px]"><div>{i.title}</div><div className="text-[12px] text-ink-3">{i.area}</div></div> },
    { key: 'proj', header: 'Project', render: (i) => <span className="text-ink-2">{i.projectId}</span>, hideBelow: 'md' },
    { key: 'insp', header: 'Inspector', render: (i) => <span className="whitespace-nowrap text-ink-2">{i.inspector}</span>, hideBelow: 'lg' },
    { key: 'date', header: 'Date', render: (i) => <span className="whitespace-nowrap text-ink-2">{fmtShort(i.date)}</span>, hideBelow: 'sm' },
    {
      key: 'score',
      header: 'Score',
      render: (i) => {
        const s = scoreOf(i)
        return (
          <div className="flex min-w-[110px] items-center gap-2">
            <ProgressBar value={s} tone={s >= 90 ? 'ok' : s >= 75 ? 'warn' : 'crit'} className="flex-1" />
            <span className="tabular w-9 text-end text-[13px] font-medium">{s}%</span>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="HSE Inspections"
        count={rows.length}
        crumbs={hseCrumbs('Inspections')}
        subtitle="Weekly checklists for site walkdowns, lifting, excavation and hot work."
        tag={<><DemoTag>Illustrative Data</DemoTag><FilterNote /></>}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
            New inspection
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Inspections this week" value={rows.length} icon={ClipboardCheck} />
        <Kpi label="Average score" value={`${avg}%`} tone={avg >= 90 ? 'ok' : 'warn'} icon={BadgeCheck} />
        <Kpi label="Open findings" value={rows.reduce((a, r) => a + r.checks.filter((c) => !c.ok).length, 0)} tone="warn" icon={AlertTriangle} />
      </div>
      <Card bodyClassName="p-0">
        <DataTable columns={cols} rows={rows} rowKey={(i) => i.id} onRowClick={setSel} empty={<div className="p-5"><EmptyState title="No inspections for this project" /></div>} />
      </Card>

      <SlideOver open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.id} · ${sel.title}` : ''} subtitle={sel ? `${sel.area} · ${sel.inspector} · ${fmtDate(sel.date)}` : ''}>
        {sel && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <ProgressBar value={scoreOf(sel)} tone={scoreOf(sel) >= 90 ? 'ok' : scoreOf(sel) >= 75 ? 'warn' : 'crit'} height={8} className="flex-1" />
              <span className="tabular text-[18px] font-semibold">{scoreOf(sel)}%</span>
            </div>
            <ul className="divide-y divide-line">
              {sel.checks.map((c) => (
                <li key={c.item} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[14px] text-ink">{c.item}</span>
                  <Pill tone={c.ok ? 'ok' : 'crit'} dot>
                    {c.ok ? 'Compliant' : 'Finding'}
                  </Pill>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SlideOver>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New HSE inspection"
        subtitle="Untick any item that is not compliant to raise a finding."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={create}>
              Save inspection
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project">
            <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} options={state.projects.filter((p) => p.type === 'Construction').map((p) => ({ value: p.id, label: p.name }))} />
          </Field>
          <Field label="Checklist">
            <Select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, fails: [] })} options={Object.keys(CHECK_ITEMS)} />
          </Field>
          <Field label="Area">
            <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. KP 42 stringing area" />
          </Field>
          <Field label="Inspector">
            <Select value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} options={['Faisal Al-Qahtani', 'Tariq Al-Shehri', 'Hamad Al-Rashid', 'Sami Al-Otaibi']} />
          </Field>
        </div>
        <div className="mt-4 space-y-1">
          {CHECK_ITEMS[form.title].map((item) => {
            const ok = !form.fails.includes(item)
            return (
              <label key={item} className="flex cursor-pointer items-center gap-3 rounded-[6px] px-2 py-2 hover:bg-muted">
                <input
                  type="checkbox"
                  checked={ok}
                  onChange={() => setForm({ ...form, fails: ok ? [...form.fails, item] : form.fails.filter((x) => x !== item) })}
                  className="size-4 accent-[#15803d]"
                />
                <span className="flex-1 text-[14px] text-ink">{item}</span>
                {!ok && <Pill tone="crit">Finding</Pill>}
              </label>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

/* ======================= Risk assessments ======================= */

type Jsa = (typeof riskAssessments)[number]

const JSA_STEPS: Record<string, { step: string; hazard: string; control: string }[]> = {
  'JSA-NPE-041': [
    { step: 'Pre-lift briefing', hazard: 'Crew unaware of lift plan and signals', control: 'Lift plan briefed at toolbox talk; signaller identified' },
    { step: 'Rig 24" joint with slings', hazard: 'Pinch points, sling failure', control: 'Colour-coded slings, tag lines, inspected shackles' },
    { step: 'Side boom lift and travel', hazard: 'Suspended load, line of fire', control: 'Exclusion zone barricaded; no one beneath load; banksman in control' },
    { step: 'Set joint on skids', hazard: 'Crush injury', control: 'Tag lines only, hands-off placement' },
  ],
}

export function RiskAssessmentsPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [sel, setSel] = useState<Jsa | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const statusOf = (j: Jsa) => overrides[j.id] ?? j.status
  const rows = inProject(riskAssessments, state.projectFilter)
  const review = rows.filter((j) => statusOf(j) === 'Review Required').length

  const cols: Column<Jsa>[] = [
    { key: 'id', header: 'JSA', render: (j) => <span className="font-medium whitespace-nowrap">{j.id}</span> },
    { key: 'act', header: 'Activity', render: (j) => <span className="block min-w-[200px]">{j.activity}</span> },
    { key: 'res', header: 'Residual risk', render: (j) => <StatusPill status={j.residual} /> },
    { key: 'own', header: 'Owner', render: (j) => <span className="whitespace-nowrap text-ink-2">{j.owner}</span>, hideBelow: 'md' },
    { key: 'rev', header: 'Last reviewed', render: (j) => <span className="whitespace-nowrap text-ink-2">{fmtShort(overrides[j.id] ? DEMO_TODAY : j.reviewed)}</span>, hideBelow: 'sm' },
    { key: 'status', header: 'Status', render: (j) => <StatusPill status={statusOf(j)} /> },
  ]

  return (
    <div>
      <PageHeader title="Risk Assessments" count={rows.length} crumbs={hseCrumbs('Risk Assessments')} subtitle="Job safety analyses (JSA) for high-risk activities, with review status." tag={<FilterNote />} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Active JSAs" value={rows.length} icon={Scale} />
        <Kpi label="Review required" value={review} tone={review ? 'warn' : 'ok'} icon={AlertTriangle} />
        <Kpi label="High residual risk" value={rows.filter((j) => j.residual === 'High').length} tone="crit" icon={Siren} />
      </div>
      <Card bodyClassName="p-0">
        <DataTable columns={cols} rows={rows} rowKey={(j) => j.id} onRowClick={setSel} highlight={(j) => statusOf(j) === 'Review Required'} />
      </Card>
      <SlideOver
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel ? sel.activity : ''}
        subtitle={sel ? `${sel.id} · ${projectName(state, sel.projectId)}` : ''}
        footer={
          sel && statusOf(sel) === 'Review Required' ? (
            <Button
              variant="primary"
              onClick={() => {
                setOverrides((o) => ({ ...o, [sel.id]: 'Current' }))
                actions.toast({ title: `${sel.id} reviewed`, body: 'Revision issued and re-briefed to the crew.', tone: 'success' })
              }}
            >
              Mark reviewed
            </Button>
          ) : undefined
        }
      >
        {sel && (
          <div className="space-y-4">
            <KeyValue
              rows={[
                { label: 'Owner', value: sel.owner },
                { label: 'Residual risk', value: <StatusPill status={sel.residual} /> },
                { label: 'Status', value: <StatusPill status={statusOf(sel)} /> },
              ]}
            />
            {sel.id === 'JSA-NPE-041' && statusOf(sel) === 'Review Required' && (
              <div className="rounded-[8px] bg-warn-bg p-3 text-[13px] text-[#7c2d12]">
                Review triggered by OBS-1042 (worker beneath suspended load). Add explicit exclusion zone and banksman controls.{' '}
                <button type="button" className="font-semibold underline" onClick={() => navigate('/hse/observations/OBS-1042')}>
                  View observation
                </button>
              </div>
            )}
            <div>
              <div className="caps mb-2 text-[11px] text-ink-3">Job steps</div>
              <ol className="space-y-3">
                {(JSA_STEPS[sel.id] ?? [
                  { step: 'Prepare work area', hazard: 'Uncontrolled access', control: 'Barricade and sign the work area' },
                  { step: 'Perform task', hazard: sel.activity, control: 'Competent crew, PTW in place, supervisor present' },
                  { step: 'Reinstate', hazard: 'Housekeeping', control: 'Area inspected and handed back' },
                ]).map((s, i) => (
                  <li key={s.step} className="rounded-[8px] border border-line p-3">
                    <div className="text-[14px] font-medium text-ink">
                      {i + 1}. {s.step}
                    </div>
                    <div className="mt-1 text-[13px] text-ink-2">Hazard: {s.hazard}</div>
                    <div className="text-[13px] text-ink-2">Control: {s.control}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

/* ======================= Certificates ======================= */

const HSE_CERT_RE = /NEBOSH|Confined|First Aid|H2S|Rigger|Banksman|Scaffold|Safety/i
const HSE_ITEM_RE = /crane|side boom|fire|confined|hot work|camp|boiler|pressure|scaffold|medical/i

function certStatus(expiry: string) {
  const d = daysUntil(expiry)
  if (d < 0) return 'Expired'
  if (d <= 30) return 'Expiring Soon'
  return 'Valid'
}

export function HseCertificatesPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const items = inProject(state.compliance, state.projectFilter).filter((c) => HSE_ITEM_RE.test(c.item))
  const people = inProject(state.employees, state.projectFilter).flatMap((e) =>
    e.certifications.filter((c) => HSE_CERT_RE.test(c.name)).map((c) => ({ key: `${e.id}-${c.name}`, emp: e, cert: c.name, expiry: c.expiry })),
  )
  people.sort((a, b) => a.expiry.localeCompare(b.expiry))
  const expiring = items.filter((c) => complianceStatus(c) !== 'Valid').length + people.filter((p) => certStatus(p.expiry) !== 'Valid').length

  return (
    <div>
      <PageHeader title="HSE Certificates" crumbs={hseCrumbs('Certificates')} subtitle="Equipment, permit and personnel certificates that keep HSE-critical work legal." tag={<FilterNote />} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Equipment and site certificates" value={items.length} icon={FileCheck2} />
        <Kpi label="Personnel HSE certificates" value={people.length} icon={Users} />
        <Kpi label="Expiring or expired" value={expiring} tone={expiring ? 'warn' : 'ok'} icon={AlertTriangle} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <Card title="Equipment and site certificates" icon={FileCheck2} bodyClassName="p-0">
          <DataTable
            dense
            rows={items}
            rowKey={(c) => c.id}
            columns={[
              { key: 'item', header: 'Item', render: (c) => <div className="min-w-[160px]"><div>{c.item}</div><div className="text-[12px] text-ink-3">{c.reference} · {c.projectId}</div></div> },
              { key: 'exp', header: 'Expiry', render: (c) => <span className="whitespace-nowrap text-ink-2">{fmtShort(c.expiry)}</span> },
              { key: 'st', header: 'Status', render: (c) => <StatusPill status={complianceStatus(c)} /> },
              {
                key: 'act',
                header: '',
                align: 'end',
                render: (c) =>
                  complianceStatus(c) === 'Valid' || complianceStatus(c) === 'Renewal In Progress' ? null : (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        actions.renewCompliance(c.id)
                      }}
                    >
                      Renew
                    </Button>
                  ),
              },
            ]}
            empty={<div className="p-5"><EmptyState title="No HSE certificates for this project" /></div>}
          />
        </Card>
        <Card title="Personnel HSE certificates" icon={Users} bodyClassName="p-0">
          <DataTable
            dense
            rows={people}
            rowKey={(p) => p.key}
            onRowClick={(p) => navigate(`/hr/workers/${p.emp.id}`)}
            columns={[
              { key: 'name', header: 'Employee', render: (p) => <div className="min-w-[140px]"><div>{p.emp.name}</div><div className="text-[12px] text-ink-3">{p.emp.trade} · {p.emp.projectId}</div></div> },
              { key: 'cert', header: 'Certificate', render: (p) => <span className="text-ink-2">{p.cert}</span> },
              { key: 'exp', header: 'Expiry', render: (p) => <span className="whitespace-nowrap text-ink-2">{fmtShort(p.expiry)}</span>, hideBelow: 'sm' },
              { key: 'st', header: 'Status', render: (p) => <StatusPill status={certStatus(p.expiry)} /> },
            ]}
            empty={<div className="p-5"><EmptyState title="No personnel certificates for this project" /></div>}
          />
        </Card>
      </div>
    </div>
  )
}

/* ======================= Heat stress ======================= */

const REGIME = [
  { band: 'Below 29°C', level: 'Normal', work: 'Continuous work', rest: 'Normal breaks', water: '0.5 L per hour' },
  { band: '29 to 31°C', level: 'Caution', work: '45 min per hour', rest: '15 min in shade', water: '0.75 L per hour' },
  { band: '31 to 33°C', level: 'High', work: '30 min per hour', rest: '30 min in shade', water: '1 L per hour' },
  { band: 'Above 33°C', level: 'Extreme caution', work: '15 min per hour, critical tasks only', rest: '45 min in cooled shelter', water: '1 L per hour plus electrolytes' },
]

const STATIONS = [
  { id: 'HS-01', location: 'KP 38 muster point', status: 'Stocked', refilled: '09:40' },
  { id: 'HS-02', location: 'KP 42 stringing area', status: 'Stocked', refilled: '10:15' },
  { id: 'HS-03', location: 'KP 42+600 tie-in', status: 'Low', refilled: '08:05' },
  { id: 'HS-04', location: 'KP 44 camp', status: 'Stocked', refilled: '10:30' },
  { id: 'HS-05', location: 'KP 46 laydown', status: 'Stocked', refilled: '09:55' },
]

export function HeatStressPage() {
  const { actions } = useStore()
  const [issued, setIssued] = useState(false)
  const [refilled, setRefilled] = useState<string[]>([])
  const color = (v: number) => (v > 33 ? '#b91c1c' : v > 29 ? '#d97706' : '#15803d')

  return (
    <div>
      <PageHeader
        title="Heat Stress"
        crumbs={hseCrumbs('Heat Stress')}
        subtitle="WBGT forecast, work/rest regime and hydration for North Pipeline Spread 2."
        tag={<DemoTag>Illustrative Data</DemoTag>}
        actions={
          <Button
            variant={issued ? 'secondary' : 'danger'}
            icon={issued ? Check : Siren}
            onClick={() => {
              setIssued(true)
              actions.toast({ title: 'Heat alert issued', body: 'Extreme caution regime from 11:00 to 15:00. Supervisors notified on the field app.', tone: 'warning' })
            }}
          >
            {issued ? 'Heat alert issued' : 'Issue heat alert'}
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Today's index (WBGT peak)" value="42°C" sub="Extreme caution at 13:00" tone="crit" icon={Thermometer} />
        <Kpi label="Current reading 10:40" value="37°C" sub="High, rising" tone="warn" icon={Thermometer} />
        <Kpi label="Heat-related first aid" value={1} sub="INC-0080, this week" icon={AlertTriangle} to="/hse/incidents" />
        <Kpi label="Hydration stations" value={`${STATIONS.length - STATIONS.filter((s) => s.status === 'Low' && !refilled.includes(s.id)).length} / ${STATIONS.length}`} sub="Stocked" icon={Droplets} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card title="Hourly heat index forecast" icon={Thermometer} subtitle="°C, Spread 2">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatStress} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="#eef0f3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#7b7d81' }} axisLine={false} tickLine={false} />
                <YAxis domain={[20, 45]} tick={{ fontSize: 12, fill: '#7b7d81' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 }} formatter={(v) => [`${v}°C`, 'Heat index']} />
                <ReferenceLine y={33} stroke="#b91c1c" strokeDasharray="4 4" label={{ value: 'Extreme caution', position: 'insideTopLeft', fontSize: 11, fill: '#b91c1c' }} />
                <ReferenceLine y={29} stroke="#d97706" strokeDasharray="4 4" />
                <Bar dataKey="index" radius={[4, 4, 0, 0]} barSize={28}>
                  {heatStress.map((h) => (
                    <Cell key={h.hour} fill={color(h.index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Hydration stations" icon={Droplets} bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {STATIONS.map((s) => {
              const low = s.status === 'Low' && !refilled.includes(s.id)
              return (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-ink">{s.location}</div>
                    <div className="text-[12px] text-ink-3">
                      {s.id} · Refilled {refilled.includes(s.id) ? '10:42' : s.refilled}
                    </div>
                  </div>
                  <Pill tone={low ? 'warn' : 'ok'} dot>
                    {low ? 'Low' : 'Stocked'}
                  </Pill>
                  {low && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setRefilled((r) => [...r, s.id])
                        actions.toast({ title: `${s.id} refill dispatched`, body: 'Water truck WT-02 en route, ETA 15 min.', tone: 'success' })
                      }}
                    >
                      Refill
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
      <Card title="Work / rest regime by WBGT band" icon={Thermometer} className="mt-4" subtitle="Illustrative regime; apply the client heat stress programme on site" bodyClassName="p-0">
        <DataTable
          rows={REGIME}
          rowKey={(r) => r.band}
          highlight={(r) => r.level === 'Extreme caution'}
          columns={[
            { key: 'band', header: 'WBGT band', render: (r) => <span className="font-medium whitespace-nowrap">{r.band}</span> },
            { key: 'level', header: 'Level', render: (r) => <Pill tone={r.level === 'Normal' ? 'ok' : r.level === 'Caution' ? 'warn' : 'crit'} dot>{r.level}</Pill> },
            { key: 'work', header: 'Work', render: (r) => <span className="text-ink-2">{r.work}</span> },
            { key: 'rest', header: 'Rest', render: (r) => <span className="text-ink-2">{r.rest}</span>, hideBelow: 'sm' },
            { key: 'water', header: 'Water', render: (r) => <span className="text-ink-2">{r.water}</span>, hideBelow: 'md' },
          ]}
        />
      </Card>
    </div>
  )
}
