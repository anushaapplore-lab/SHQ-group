import { useState } from 'react'
import { Camera, RefreshCw, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { hseCategories } from '../../data/hse'
import type { Severity } from '../../data/types'
import { DEMO_TODAY, addDays, cx } from '../../lib/format'
import { roleProfile } from '../../store/roles'
import { useStore } from '../../store/store'
import { Button, DemoTag, Field, Input, Modal, Segmented, Select, Textarea } from '../ui'
import { ObservationPhoto } from './HazardPhoto'

export const HSE_ASSIGNEES = ['Lifting Supervisor', 'HSE Officer', 'Civil Superintendent', 'Welding Foreman', 'Site Supervisor', 'Mechanical Foreman', 'Electrical Supervisor', 'Scaffolding Supervisor']

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical']

interface FormState {
  projectId: string
  title: string
  location: string
  category: string
  severity: Severity
  description: string
  immediateAction: string
  assignedTo: string
  dueDate: string
  photo: string | null
  withAi: boolean
}

const initial = (projectId: string): FormState => ({
  projectId,
  title: '',
  location: '',
  category: 'Suspended Load',
  severity: 'High',
  description: '',
  immediateAction: '',
  assignedTo: 'Lifting Supervisor',
  dueDate: addDays(DEMO_TODAY, 1),
  photo: null,
  withAi: true,
})

/** Desktop "New Observation" modal (brief §18 fields). */
export function NewObservationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const defaultProject = state.projectFilter !== 'all' ? state.projectFilter : 'NPE'
  const [f, setF] = useState<FormState>(() => initial(defaultProject))
  const [tried, setTried] = useState(false)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }))

  const close = () => {
    setF(initial(defaultProject))
    setTried(false)
    onClose()
  }

  const attachPhoto = () => {
    if (f.category === 'Suspended Load') set('photo', 'suspended-load')
    else set('photo', `site-${(hseCategories.indexOf(f.category) % 4) + 1}`)
  }

  const valid = f.location.trim().length > 1 && f.description.trim().length > 3
  const submit = () => {
    setTried(true)
    if (!valid) return
    const title = f.title.trim() || `${f.category}: ${f.description.trim().slice(0, 60)}`
    const id = actions.createObservation({
      projectId: f.projectId,
      title,
      category: f.category,
      severity: f.severity,
      location: f.location.trim(),
      description: f.description.trim(),
      immediateAction: f.immediateAction.trim(),
      assignedTo: f.assignedTo,
      dueDate: f.dueDate,
      reportedBy: roleProfile(state.role).name,
      source: 'Web',
      photo: f.photo ?? undefined,
      withAi: f.withAi && !!f.photo,
    })
    close()
    navigate(`/hse/observations/${id}`)
  }

  const canAi = f.category === 'Suspended Load' && !!f.photo

  return (
    <Modal
      open={open}
      onClose={close}
      title="New observation"
      subtitle="Raise an HSE observation. High severity escalates automatically to the HSE Manager."
      width={680}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Submit observation
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Photo</span>
          {f.photo ? (
            <div className="overflow-hidden rounded-[8px] border border-line">
              <ObservationPhoto photo={f.photo} className="aspect-[4/3] w-full" />
              <div className="flex items-center justify-between gap-2 border-t border-line bg-muted px-2.5 py-1.5">
                <span className="truncate text-[12px] text-ink-2">IMG_2026-10-01.jpg</span>
                <button type="button" onClick={() => set('photo', null)} className="text-[12px] font-medium text-action hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={attachPhoto}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-line-strong bg-muted text-ink-2 hover:border-action hover:text-action"
            >
              <Camera className="size-6" strokeWidth={1.5} />
              <span className="text-[13px] font-medium">Attach photo</span>
              <span className="text-[11px] text-ink-3">Simulated capture</span>
            </button>
          )}
          {canAi && (
            <label className="mt-3 flex items-start gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={f.withAi} onChange={(e) => set('withAi', e.target.checked)} className="mt-0.5 size-4 accent-[#1d4ed8]" />
              <span>
                Run demo hazard analysis
                <DemoTag className="mt-1 flex w-fit" icon={Sparkles}>
                  Demo AI Analysis
                </DemoTag>
              </span>
            </label>
          )}
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Field label="Project">
            <Select value={f.projectId} onChange={(e) => set('projectId', e.target.value)} options={state.projects.filter((p) => p.type === 'Construction').map((p) => ({ value: p.id, label: p.name }))} />
          </Field>
          <Field label="Location">
            <Input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. KP 42+450" className={cx(tried && f.location.trim().length < 2 && 'border-crit')} />
          </Field>
          <Field label="Category">
            <Select value={f.category} onChange={(e) => set('category', e.target.value)} options={hseCategories} />
          </Field>
          <Field label="Severity">
            <Segmented options={SEVERITIES.map((s) => ({ id: s, label: s }))} value={f.severity} onChange={(v) => set('severity', v)} className="w-full [&>button]:flex-1" />
          </Field>
          <Field label="Title (optional)" className="sm:col-span-2">
            <Input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Short summary, generated from the description if blank" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="What did you observe?" className={cx(tried && f.description.trim().length < 4 && 'border-crit')} />
          </Field>
          <Field label="Immediate action" className="sm:col-span-2">
            <Input value={f.immediateAction} onChange={(e) => set('immediateAction', e.target.value)} placeholder="e.g. Work stopped and area barricaded" />
          </Field>
          <Field label="Assigned to">
            <Select value={f.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} options={HSE_ASSIGNEES} />
          </Field>
          <Field label="Due date">
            <Input type="date" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
        </div>
      </div>
      {tried && !valid && <p className="mt-3 text-[13px] text-crit">Location and description are required.</p>}
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-3">
        <RefreshCw className="size-3.5" strokeWidth={1.5} /> Submitting creates an action, logs activity and, for High or Critical, raises a leadership alert.
      </p>
    </Modal>
  )
}
