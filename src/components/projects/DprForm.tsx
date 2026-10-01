import { useState } from 'react'
import type { FormEvent } from 'react'
import { Camera, Send, X } from 'lucide-react'
import type { DPR } from '../../data/types'
import { useStore } from '../../store/store'
import { DEMO_TODAY } from '../../lib/format'
import { Button, Field, Input, Modal, Select, SitePhoto, Textarea } from '../ui'

export const DELAY_CAUSES = ['None', 'Inspection waiting', 'Material not available', 'Permit delays', 'Equipment breakdown', 'Weather / heat stop']
const WEATHER = ['Clear, 40°C peak', 'Clear, 44°C peak (heat stress controls)', 'Hazy, 38°C peak', 'Dust / sandstorm, work stopped 2 h', 'Windy, lifting restricted', 'Overcast, 34°C peak']

interface Defaults {
  location: string
  manpower: number
  equipment: string
  workCompleted: string
  quantity: number
  unit: string
  issues: string
  delayCause: string
  supervisor: string
  workPackage?: string
}

const NPE_DEFAULTS: Defaults = {
  workPackage: 'Welding',
  location: 'Spread 2, KP 42+600 to KP 43+400',
  manpower: 324,
  equipment: '6 side booms, 4 welding rigs, 2 excavators, 1 RT crawler',
  workCompleted: '38 joints welded (root, hot pass, cap), 1.4 km pipe strung, 0.8 km lowered-in',
  quantity: 38,
  unit: 'joints',
  issues: 'NDT crew available for half shift only; 6 joints awaiting RT',
  delayCause: 'Inspection waiting',
  supervisor: 'Mahmoud Saleh',
}

function defaultsFor(projectId: string, manager: string, workforce: number): Defaults {
  if (projectId === 'NPE') return NPE_DEFAULTS
  return {
    location: 'Main work area',
    manpower: workforce,
    equipment: '1 mobile crane, 3 welding machines, 1 manlift',
    workCompleted: 'Planned activities progressed per weekly look-ahead',
    quantity: 24,
    unit: 'units',
    issues: '',
    delayCause: 'None',
    supervisor: manager,
  }
}

/** Create Daily Report modal (brief §9). Calls actions.createDPR and returns the new DPR. */
export function DprModal({ open, onClose, defaultProjectId = 'NPE', onCreated }: { open: boolean; onClose: () => void; defaultProjectId?: string; onCreated?: (dpr: DPR) => void }) {
  if (!open) return null
  return <DprModalInner onClose={onClose} defaultProjectId={defaultProjectId} onCreated={onCreated} />
}

function DprModalInner({ onClose, defaultProjectId, onCreated }: { onClose: () => void; defaultProjectId: string; onCreated?: (dpr: DPR) => void }) {
  const { state, actions } = useStore()
  const projects = state.projects.filter((p) => p.type === 'Construction')
  const initialProject = projects.find((p) => p.id === defaultProjectId) ?? projects[0]
  const wpsFor = (pid: string) => state.workPackages.filter((w) => w.projectId === pid).map((w) => w.name)

  const build = (pid: string) => {
    const p = projects.find((x) => x.id === pid) ?? initialProject
    const d = defaultsFor(p.id, p.manager, p.workforce)
    const wps = wpsFor(p.id)
    return {
      projectId: p.id,
      date: DEMO_TODAY,
      workPackage: d.workPackage && wps.includes(d.workPackage) ? d.workPackage : wps.find((n) => state.workPackages.find((w) => w.projectId === p.id && w.name === n && w.progress < 100)) ?? wps[0] ?? '',
      location: d.location,
      weather: WEATHER[0],
      manpower: d.manpower,
      equipment: d.equipment,
      workCompleted: d.workCompleted,
      quantity: d.quantity,
      unit: d.unit,
      issues: d.issues,
      delayCause: d.delayCause,
      photos: 3,
      supervisor: d.supervisor,
    }
  }

  const [f, setF] = useState(() => build(initialProject.id))
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const valid = f.workPackage && f.workCompleted.trim() && f.supervisor.trim() && f.quantity > 0 && f.manpower > 0

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!valid) return
    const dpr = actions.createDPR({
      projectId: f.projectId,
      date: f.date,
      workPackage: f.workPackage,
      location: f.location,
      weather: f.weather,
      manpower: f.manpower,
      equipment: f.equipment,
      workCompleted: f.workCompleted,
      quantity: `${f.quantity} ${f.unit}`.trim(),
      issues: f.issues,
      delayCause: f.delayCause,
      photos: f.photos,
      supervisor: f.supervisor,
      quantityNum: f.quantity,
    })
    onCreated?.(dpr)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      width={720}
      title="Create Daily Report"
      subtitle="Daily progress report (DPR). Submitting updates work package and project progress."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon={Send} onClick={() => submit()} disabled={!valid}>
            Submit report
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Project">
          <Select value={f.projectId} onChange={(e) => setF(build(e.target.value))} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        </Field>
        <Field label="Date">
          <Input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Work package">
          <Select value={f.workPackage} onChange={(e) => set('workPackage', e.target.value)} options={wpsFor(f.projectId)} />
        </Field>
        <Field label="Location">
          <Input value={f.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Weather">
          <Select value={f.weather} onChange={(e) => set('weather', e.target.value)} options={WEATHER} />
        </Field>
        <Field label="Manpower (on site)">
          <Input type="number" min={0} value={f.manpower} onChange={(e) => set('manpower', Number(e.target.value))} />
        </Field>
        <Field label="Equipment" className="sm:col-span-2">
          <Input value={f.equipment} onChange={(e) => set('equipment', e.target.value)} />
        </Field>
        <Field label="Work completed" className="sm:col-span-2">
          <Textarea value={f.workCompleted} onChange={(e) => set('workCompleted', e.target.value)} />
        </Field>
        <Field label="Quantity" hint="Drives the progress update for the selected work package">
          <div className="flex gap-2">
            <Input type="number" min={0} value={f.quantity} onChange={(e) => set('quantity', Number(e.target.value))} className="w-28" />
            <Input value={f.unit} onChange={(e) => set('unit', e.target.value)} placeholder="Unit" aria-label="Unit" />
          </div>
        </Field>
        <Field label="Delay cause">
          <Select value={f.delayCause} onChange={(e) => set('delayCause', e.target.value)} options={DELAY_CAUSES} />
        </Field>
        <Field label="Issues" className="sm:col-span-2">
          <Textarea rows={2} value={f.issues} onChange={(e) => set('issues', e.target.value)} placeholder="Constraints, stoppages, quality holds" />
        </Field>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Photos ({f.photos})</span>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: f.photos }).map((_, i) => (
              <div key={i} className="group relative size-16 overflow-hidden rounded-[8px] border border-line">
                <SitePhoto seed={i + 2} className="h-full w-full" label={`Site photo ${i + 1}`} />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => set('photos', f.photos - 1)}
                  className="absolute end-0.5 top-0.5 rounded-full bg-surface/90 p-0.5 text-ink-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('photos', Math.min(12, f.photos + 1))}
              className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-[8px] border border-dashed border-line-strong bg-muted text-[10px] text-ink-2 hover:border-action hover:text-action"
            >
              <Camera className="size-5" strokeWidth={1.5} />
              Add
            </button>
          </div>
          <span className="mt-1 block text-[11px] text-ink-3">Simulated capture; placeholder imagery only.</span>
        </div>
        <Field label="Supervisor" className="sm:col-span-2">
          <Input value={f.supervisor} onChange={(e) => set('supervisor', e.target.value)} />
        </Field>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
