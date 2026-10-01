import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  CloudCheck,
  CloudOff,
  CloudUpload,
  FileWarning,
  HardHat,
  House,
  Languages,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Sun,
  Thermometer,
  TrendingUp,
  Truck,
  User,
  UserCheck,
  Wifi,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { hseCategories } from '../../data/hse'
import type { FieldRecord, Severity } from '../../data/types'
import { DEMO_TODAY, addDays, cx, daysUntil, fmtDate } from '../../lib/format'
import { useStore } from '../../store/store'
import { Avatar, DemoTag } from '../../components/ui'
import {
  BigButton,
  BigInput,
  BigSelect,
  BottomNav,
  CameraTile,
  CheckRow,
  Chips,
  MCard,
  MLabel,
  PhoneFrame,
  ScreenTitle,
  Segment,
  Stepper,
} from '../../components/mobile/MobileKit'

/* ---------------- constants ---------------- */

const SITE = 'North Pipeline · Spread 2 · KP 38-46'
const USER = 'Faisal Al-Qahtani'

const FIELD_TASKS = [
  { id: 'FT-01', title: 'Deliver toolbox talk: lifting operations and exclusion zones', time: '06:30', where: 'KP 42 muster point' },
  { id: 'FT-02', title: 'Inspect lifting gear and slings for side booms SB-03 and SB-07', time: '07:00', where: 'Stringing area KP 42' },
  { id: 'FT-03', title: 'Weld visual inspection at KP 42+600, joints 412 to 424', time: '09:00', where: 'KP 42+600 tie-in' },
  { id: 'FT-04', title: 'Renew hot work permit PTW-NPE-2291 for afternoon shift', time: '11:30', where: 'Area Authority office' },
  { id: 'FT-05', title: 'Check hydration stations and shade shelters, KP 38 to 46', time: '12:00', where: 'Spread 2' },
  { id: 'FT-06', title: 'Submit daily progress report for Spread 2', time: '16:30', where: 'Site office' },
]

const LOCATIONS = ['KP 42+450, pipe stringing area', 'KP 42+600 tie-in', 'KP 41+900', 'KP 38+200', 'KP 44 camp', 'KP 46+000 laydown']
const ASSIGNEES = ['Lifting Supervisor', 'HSE Officer', 'Site Supervisor', 'Welding Foreman', 'Civil Superintendent']
const IMMEDIATE = ['Stopped work', 'Barricaded area', 'Informed supervisor']

type TabId = 'home' | 'capture' | 'tasks' | 'sync' | 'profile'
type FormKind = 'hse' | 'progress' | 'attendance' | 'inspection' | 'photo' | 'ncr' | 'equipment'

const CAPTURE_MENU: { id: FormKind; kind: FieldRecord['kind']; label: string; hint: string; icon: LucideIcon; accent?: boolean }[] = [
  { id: 'hse', kind: 'HSE Observation', label: 'HSE Observation', hint: 'Hazard, unsafe act or condition', icon: ShieldAlert, accent: true },
  { id: 'progress', kind: 'Daily Progress', label: 'Daily Progress', hint: 'Quantities by work package', icon: TrendingUp },
  { id: 'attendance', kind: 'Attendance', label: 'Attendance', hint: 'Crew headcount', icon: UserCheck },
  { id: 'inspection', kind: 'Inspection', label: 'Inspection', hint: 'Checklist with pass or fail', icon: ClipboardCheck },
  { id: 'photo', kind: 'Photo', label: 'Photo', hint: 'Tagged site photo', icon: Camera },
  { id: 'ncr', kind: 'NCR', label: 'NCR', hint: 'Non-conformance', icon: FileWarning },
  { id: 'equipment', kind: 'Equipment', label: 'Equipment', hint: 'Hours and readings', icon: Truck },
]

const KIND_ICON: Record<FieldRecord['kind'], LucideIcon> = {
  'HSE Observation': ShieldAlert,
  'Daily Progress': TrendingUp,
  Attendance: UserCheck,
  Inspection: ClipboardCheck,
  Photo: Camera,
  NCR: FileWarning,
  Equipment: Truck,
}

/* ---------------- shell ---------------- */

function useIsWide() {
  const q = '(min-width: 640px)'
  const [wide, setWide] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : true))
  useEffect(() => {
    const m = window.matchMedia(q)
    const h = () => setWide(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return wide
}

function useLeadership() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  return (to = '/command') => {
    if (state.role === 'Site Engineer') actions.setRole('CEO')
    navigate(to)
  }
}

export function FieldApp() {
  const wide = useIsWide()
  const { state } = useStore()
  const leadership = useLeadership()

  if (!wide)
    return (
      <div className="h-[100dvh] bg-canvas">
        <MobileApp />
      </div>
    )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#e9ecf1] p-6 lg:flex-row lg:gap-12">
      <div className="flex w-full max-w-[390px] items-center justify-between lg:hidden">
        <button type="button" onClick={() => leadership()} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-action hover:underline">
          <ArrowLeft className="size-4 rtl:rotate-180" strokeWidth={1.75} /> Back to leadership view
        </button>
        <DemoTag>Field app demo</DemoTag>
      </div>
      <aside className="hidden w-[340px] shrink-0 lg:block">
        <DemoTag>Field app demo</DemoTag>
        <h2 className="mt-3 text-[24px] font-semibold tracking-tight text-ink">SHQ Field</h2>
        <p className="mt-2 text-[14px] text-ink-2">
          A dedicated mobile app for site engineers, HSE officers and supervisors. Capture once at the source; after sync every department and leadership see the same record.
        </p>
        <ol className="mt-5 space-y-3">
          {[
            ['Offline on site', 'The amber banner shows records are saved on the device. Tap it to toggle connectivity.'],
            ['Capture an HSE observation', 'Capture → HSE Observation. Fields are prefilled; take the photo and save.'],
            ['Sync', `Sync → Sync Now. Pending records go from ${Math.max(state.field.queue.length, 3)} to 0.`],
            ['Return to leadership', 'The new alert, action and risk score are already in the command view.'],
          ].map(([t, b], i) => (
            <li key={t} className="flex gap-3">
              <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-shell text-[12px] font-semibold text-white">{i + 1}</span>
              <span>
                <span className="block text-[14px] font-medium text-ink">{t}</span>
                <span className="block text-[13px] text-ink-2">{b}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium', state.field.online ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn')}>
            {state.field.online ? <Wifi className="size-3.5" /> : <CloudOff className="size-3.5" />}
            {state.field.online ? 'Online' : 'Offline'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-ink-2">
            <CloudUpload className="size-3.5" /> Pending sync: {state.field.queue.length}
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={() => leadership()} className="caps inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-action px-5 text-[13px] text-white hover:bg-action-hover">
            <LayoutDashboard className="size-4" strokeWidth={1.75} /> Back to leadership view
          </button>
          <button type="button" onClick={() => leadership('/hse')} className="caps inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-line bg-surface px-5 text-[13px] text-ink hover:bg-muted">
            <ShieldAlert className="size-4" strokeWidth={1.75} /> Open HSE dashboard
          </button>
        </div>
        <p className="mt-4 text-[12px] text-ink-3">Offline storage and sync are simulated for the demo. No data leaves this browser.</p>
      </aside>
      <PhoneFrame online={state.field.online}>
        <MobileApp />
      </PhoneFrame>
    </div>
  )
}

function tabFromPath(path: string): TabId {
  const seg = path.replace(/^\/field\/?/, '').split('/')[0]
  if (seg === 'capture') return 'capture'
  if (seg === 'tasks') return 'tasks'
  if (seg === 'sync' || seg === 'queue') return 'sync'
  if (seg === 'profile') return 'profile'
  return 'home'
}

function MobileApp() {
  const { state, actions } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const tab = tabFromPath(location.pathname)
  const online = state.field.online
  const go = (t: string) => navigate(t === 'home' ? '/field' : `/field/${t}`)

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 bg-shell px-4 pt-3 pb-3 text-white">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-shell-raised">
            <HardHat className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] leading-tight font-semibold">SHQ Field</div>
            <div className="truncate text-[12px] text-white/70">{SITE}</div>
          </div>
          <button type="button" onClick={() => go('profile')} aria-label={USER} className="rounded-full ring-2 ring-white/20">
            <Avatar name={USER} size={34} />
          </button>
        </div>
      </header>
      <button
        type="button"
        onClick={() => {
          actions.setOnline(!online)
        }}
        className={cx('flex shrink-0 items-center gap-2 px-4 py-2.5 text-start text-[13px] font-medium', online ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-[#92400e]')}
        aria-label={online ? 'Online. Tap to simulate offline' : 'Offline. Tap to go online'}
      >
        {online ? <Wifi className="size-4 shrink-0" strokeWidth={2} /> : <CloudOff className="size-4 shrink-0" strokeWidth={2} />}
        <span className="min-w-0 flex-1">{online ? `Online · last sync ${state.field.lastSync.replace('Today ', '')}` : 'Offline mode: records are saved locally'}</span>
        <span className="shrink-0 text-[11px] font-semibold uppercase opacity-80">{online ? 'Go offline' : 'Go online'}</span>
      </button>
      <main key={tab} className="scrollbar-thin anim-fade min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {tab === 'home' && <HomeScreen go={go} />}
        {tab === 'capture' && <CaptureScreen go={go} />}
        {tab === 'tasks' && <TasksScreen />}
        {tab === 'sync' && <SyncScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </main>
      <BottomNav
        active={tab}
        onChange={go}
        tabs={[
          { id: 'home', label: 'Home', icon: House },
          { id: 'capture', label: 'Capture', icon: Camera },
          { id: 'tasks', label: 'Tasks', icon: ListChecks, badge: FIELD_TASKS.length - state.field.tasksDone.length },
          { id: 'sync', label: 'Sync', icon: RefreshCw, badge: state.field.queue.length },
          { id: 'profile', label: 'Profile', icon: User },
        ]}
      />
    </div>
  )
}

/* ---------------- Home ---------------- */

function HomeScreen({ go }: { go: (t: string) => void }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const wp = state.workPackages.find((w) => w.projectId === 'NPE' && w.name === 'Welding')
  const openActs = state.actions.filter((a) => a.projectId === 'NPE' && a.status !== 'Closed').slice(0, 3)
  const pending = state.field.queue.length
  const done = state.field.tasksDone

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] text-ink-3">{fmtDate(DEMO_TODAY)}</div>
          <h1 className="text-[20px] font-semibold text-ink">Good morning, Faisal</h1>
        </div>
        {pending > 0 && (
          <button type="button" onClick={() => go('sync')} className="mt-1 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full whitespace-nowrap bg-warn-bg px-3 text-[12px] font-semibold text-[#92400e]">
            <CloudUpload className="size-4" strokeWidth={2} /> Pending sync {pending}
          </button>
        )}
      </div>

      <button type="button" onClick={() => navigate('/field/capture?form=hse')} className="flex min-h-16 w-full items-center gap-3 rounded-[14px] bg-shell px-4 py-3 text-start text-white active:opacity-90">
        <ShieldAlert className="size-7 shrink-0" strokeWidth={1.5} />
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold">Report HSE observation</span>
          <span className="block text-[12px] text-white/70">Photo, category, severity. Under 30 seconds.</span>
        </span>
        <ChevronRight className="size-5 rtl:rotate-180" />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <MCard>
          <MLabel>Weather</MLabel>
          <div className="flex items-center gap-2">
            <Sun className="size-6 text-[#d97706]" strokeWidth={1.5} />
            <span className="tabular text-[24px] font-semibold text-ink">41°C</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-2">
            <Wind className="size-3.5" /> NW 14 km/h
          </div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-warn-bg px-2 py-0.5 text-[11px] font-semibold text-[#92400e]">
            <Thermometer className="size-3" /> Heat stress caution
          </div>
        </MCard>
        <MCard>
          <MLabel>Attendance</MLabel>
          {state.field.attendanceMarked ? (
            <div>
              <div className="flex items-center gap-1.5 text-[15px] font-semibold text-ok">
                <BadgeCheck className="size-5" strokeWidth={1.75} /> Clocked in
              </div>
              <div className="mt-1 text-[12px] text-ink-2">06:02 · KP 42 muster point</div>
              <div className="mt-1 text-[12px] text-ink-3">GPS verified</div>
            </div>
          ) : (
            <div>
              <div className="text-[12px] text-ink-2">Not marked today</div>
              <button
                type="button"
                onClick={() => {
                  actions.markAttendance()
                  actions.toast({ title: 'Attendance marked', body: 'Clocked in at KP 42 muster point.', tone: 'success' })
                }}
                className="caps mt-2 min-h-11 w-full rounded-[10px] bg-action text-[12px] text-white"
              >
                Mark attendance
              </button>
            </div>
          )}
        </MCard>
      </div>

      <MCard>
        <div className="flex items-center justify-between">
          <MLabel className="mb-0">Spread 2 welding progress</MLabel>
          <span className="text-[12px] text-ink-3">Planned {wp?.planned ?? 74}%</span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="tabular text-[28px] leading-none font-semibold text-ink">{wp?.progress ?? 68}%</span>
          <span className="mb-0.5 text-[13px] font-medium text-warn">{(wp?.progress ?? 68) - (wp?.planned ?? 74)} pts vs plan</span>
        </div>
        <div className="relative mt-3 h-2.5 rounded-full bg-[#eef0f3]">
          <div className="h-full rounded-full bg-[#d97706]" style={{ width: `${wp?.progress ?? 68}%` }} />
          <div className="absolute -top-1 h-[18px] w-0.5 bg-ink" style={{ insetInlineStart: `${wp?.planned ?? 74}%` }} />
        </div>
      </MCard>

      <MCard className="!p-0">
        <div className="flex items-center justify-between px-4 pt-4">
          <MLabel className="mb-0">Today's tasks</MLabel>
          <button type="button" onClick={() => go('tasks')} className="min-h-9 px-1 text-[13px] font-semibold text-action">
            {done.length}/{FIELD_TASKS.length} done
          </button>
        </div>
        <div className="divide-y divide-line px-3 pb-1">
          {FIELD_TASKS.slice(0, 5).map((t) => (
            <CheckRow key={t.id} label={t.title} sub={`${t.time} · ${t.where}`} checked={done.includes(t.id)} onChange={() => actions.toggleFieldTask(t.id)} />
          ))}
        </div>
      </MCard>

      <MCard className="!p-0">
        <div className="px-4 pt-4">
          <MLabel className="mb-0">Open actions on my site</MLabel>
        </div>
        {openActs.length === 0 ? (
          <p className="px-4 py-4 text-[14px] text-ink-2">No open actions. Good work.</p>
        ) : (
          <ul className="divide-y divide-line">
            {openActs.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cx('size-2.5 shrink-0 rounded-full', a.priority === 'High' || a.priority === 'Critical' ? 'bg-crit' : 'bg-[#d97706]')} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-ink">{a.title}</span>
                  <span className="block text-[12px] text-ink-3">
                    {a.id} · {a.owner} · {daysUntil(a.dueDate) <= 0 ? 'Due today' : `Due in ${daysUntil(a.dueDate)}d`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    actions.setActionStatus(a.id, 'Closed')
                    actions.toast({ title: `${a.id} marked done`, tone: 'success' })
                  }}
                  className="min-h-10 shrink-0 rounded-[10px] border border-line px-3 text-[12px] font-semibold text-ink active:bg-muted"
                >
                  Done
                </button>
              </li>
            ))}
          </ul>
        )}
      </MCard>
    </div>
  )
}

/* ---------------- Tasks ---------------- */

function TasksScreen() {
  const { state, actions } = useStore()
  const done = state.field.tasksDone
  const pct = Math.round((done.length / FIELD_TASKS.length) * 100)
  return (
    <div>
      <ScreenTitle title="My tasks" right={<span className="text-[13px] font-medium text-ink-2">{done.length}/{FIELD_TASKS.length}</span>} />
      <div className="mb-4 h-2 rounded-full bg-[#eef0f3]">
        <div className="h-full rounded-full bg-ok transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <MCard className="!px-3 !py-1">
        <div className="divide-y divide-line">
          {FIELD_TASKS.map((t) => (
            <CheckRow key={t.id} label={t.title} sub={`${t.time} · ${t.where}`} checked={done.includes(t.id)} onChange={() => actions.toggleFieldTask(t.id)} />
          ))}
        </div>
      </MCard>
      {done.length === FIELD_TASKS.length && (
        <div className="anim-pop mt-4 flex items-center gap-2 rounded-[12px] bg-ok-bg px-4 py-3 text-[14px] font-medium text-ok">
          <BadgeCheck className="size-5" /> All tasks complete for today
        </div>
      )}
    </div>
  )
}

/* ---------------- Capture ---------------- */

type Result = { status: 'queued' | 'synced'; kind: FieldRecord['kind'] }

function CaptureScreen({ go }: { go: (t: string) => void }) {
  const [params, setParams] = useSearchParams()
  const form = params.get('form') as FormKind | null
  const [result, setResult] = useState<Result | null>(null)
  const item = CAPTURE_MENU.find((m) => m.id === form)

  const back = () => {
    setResult(null)
    setParams({}, { replace: true })
  }

  if (result) return <ResultScreen result={result} go={go} again={back} />
  if (item) return <CaptureForm item={item} onBack={back} onSaved={setResult} />

  return (
    <div>
      <ScreenTitle title="Capture" />
      <p className="-mt-2 mb-4 text-[14px] text-ink-2">What do you want to record?</p>
      <div className="grid grid-cols-2 gap-3">
        {CAPTURE_MENU.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setParams({ form: m.id })}
            className={cx(
              'flex min-h-[112px] flex-col items-start justify-between rounded-[14px] border p-4 text-start active:scale-[.98]',
              m.accent ? 'col-span-2 min-h-[96px] border-shell bg-shell text-white' : 'border-line bg-surface text-ink',
            )}
          >
            <m.icon className={cx('size-7', m.accent ? 'text-white' : 'text-shell')} strokeWidth={1.5} />
            <span>
              <span className="block text-[16px] font-semibold">{m.label}</span>
              <span className={cx('block text-[12px]', m.accent ? 'text-white/70' : 'text-ink-3')}>{m.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultScreen({ result, go, again }: { result: Result; go: (t: string) => void; again: () => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const pending = state.field.queue.length
  const latestObs = state.observations[0]
  if (result.status === 'queued')
    return (
      <div className="anim-pop flex flex-col items-center pt-8 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-warn-bg text-[#b45309]">
          <CloudOff className="size-10" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 text-[24px] font-semibold text-ink">Saved locally</h1>
        <p className="mt-2 max-w-[280px] text-[14px] text-ink-2">{result.kind} stored safely on this device. It will sync when you are back online.</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-[15px] font-semibold text-ink">
          <CloudUpload className="size-5 text-[#b45309]" strokeWidth={1.75} /> Pending sync: {pending} record{pending === 1 ? '' : 's'}
        </div>
        <div className="mt-8 w-full space-y-3">
          <BigButton icon={RefreshCw} onClick={() => go('sync')}>
            Go to Sync
          </BigButton>
          <BigButton variant="secondary" onClick={again}>
            Capture another
          </BigButton>
        </div>
      </div>
    )
  return (
    <div className="anim-pop flex flex-col items-center pt-8 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-ok-bg text-ok">
        <CloudCheck className="size-10" strokeWidth={1.5} />
      </span>
      <h1 className="mt-5 text-[24px] font-semibold text-ink">Submitted and synchronised</h1>
      <p className="mt-2 max-w-[290px] text-[14px] text-ink-2">
        {result.kind === 'HSE Observation' && latestObs ? `${latestObs.id} is now live in the HSE dashboard with an assigned action.` : `${result.kind} is now visible to the project team.`}
      </p>
      <div className="mt-8 w-full space-y-3">
        {result.kind === 'HSE Observation' && latestObs && (
          <BigButton icon={ShieldAlert} onClick={() => navigate(`/hse/observations/${latestObs.id}`)}>
            View observation
          </BigButton>
        )}
        <BigButton variant="secondary" onClick={() => go('home')}>
          Back to Home
        </BigButton>
        <BigButton variant="secondary" onClick={again}>
          Capture another
        </BigButton>
      </div>
    </div>
  )
}

function CaptureForm({ item, onBack, onSaved }: { item: (typeof CAPTURE_MENU)[number]; onBack: () => void; onSaved: (r: Result) => void }) {
  const { actions } = useStore()
  const [photo, setPhoto] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)

  // HSE observation
  const [location, setLocation] = useState(LOCATIONS[0])
  const [category, setCategory] = useState('Suspended Load')
  const [severity, setSeverity] = useState<Severity>('High')
  const [description, setDescription] = useState('')
  const [immediate, setImmediate] = useState<string[]>(['Stopped work'])
  const [assignedTo, setAssignedTo] = useState('Lifting Supervisor')
  const [due, setDue] = useState<'Today' | 'Tomorrow'>('Today')
  // Progress
  const [wpName, setWpName] = useState('Welding')
  const [qty, setQty] = useState(12)
  const [delay, setDelay] = useState<string[]>([])
  // Attendance
  const [present, setPresent] = useState(86)
  const [absent, setAbsent] = useState(3)
  const [crew, setCrew] = useState('Welding crew W-2')
  // Inspection
  const [inspType, setInspType] = useState('Weld visual')
  const [checks, setChecks] = useState<string[]>([])
  const [inspResult, setInspResult] = useState<'Pass' | 'Fail'>('Pass')
  // Photo
  const [tag, setTag] = useState<string[]>(['Progress'])
  // NCR
  const [ncrTitle, setNcrTitle] = useState('Weld undercut beyond acceptance at joint 418')
  const [ncrSev, setNcrSev] = useState<'Minor' | 'Major' | 'Critical'>('Major')
  const [discipline, setDiscipline] = useState('Welding')
  // Equipment
  const [equipment, setEquipment] = useState('Side boom SB-07')
  const [hours, setHours] = useState(9)
  const [reading, setReading] = useState(62)
  const [condition, setCondition] = useState<string[]>(['Serviceable'])

  const INSP_ITEMS: Record<string, string[]> = {
    'Weld visual': ['Profile and reinforcement acceptable', 'No visible cracks or porosity', 'Undercut within limits', 'Joint number stencilled'],
    'Lifting gear pre-use': ['Slings tagged and in date', 'Shackles and hooks undamaged', 'Safe working load marked', 'Load test certificate on file'],
    'Excavation': ['Edge protection installed', 'Safe access provided', 'Spoil set back 1 m', 'Daily inspection tag displayed'],
  }

  const capture = () => {
    setCapturing(true)
    window.setTimeout(() => {
      setCapturing(false)
      setPhoto(item.id === 'hse' && category === 'Suspended Load' ? 'suspended-load' : `site-${item.id === 'photo' ? 4 : item.id === 'ncr' ? 3 : 2}`)
    }, 650)
  }

  const save = () => {
    const kind = item.kind
    let title = ''
    let summary = ''
    let payload: FieldRecord['payload'] = {}
    switch (item.id) {
      case 'hse': {
        title = category === 'Suspended Load' ? 'Worker beneath suspended load during pipe lifting' : `${category} hazard at ${location.split(',')[0]}`
        const immediateAction = immediate.length ? `${immediate.join(', ')}.` : 'Supervisor informed.'
        summary = `${severity} · ${category} · ${location.split(',')[0]}`
        payload = {
          projectId: 'NPE',
          title,
          category,
          severity,
          location,
          description: description.trim() || `${title} at ${location}. Reported from the field app.`,
          immediateAction,
          assignedTo,
          dueDate: due === 'Today' ? DEMO_TODAY : addDays(DEMO_TODAY, 1),
        }
        if (photo) payload.photo = photo
        break
      }
      case 'progress':
        title = `${wpName} progress ${location.split(',')[0]}`
        summary = `${qty} ${wpName === 'Welding' ? 'joints' : 'm'}${delay.length ? ` · ${delay.join(', ')}` : ''}`
        payload = { workPackage: wpName, quantity: qty, location }
        break
      case 'attendance':
        title = `${crew} attendance`
        summary = `${present} present, ${absent} absent`
        payload = { present, absent, crew }
        break
      case 'inspection': {
        const items = INSP_ITEMS[inspType]
        title = `${inspType} inspection, ${location.split(',')[0]}`
        summary = `${inspResult} · ${checks.length}/${items.length} checks confirmed`
        payload = { type: inspType, result: inspResult, location, checks: checks.length }
        break
      }
      case 'photo':
        title = `${tag.join(', ')} photo, ${location.split(',')[0]}`
        summary = photo ? '1 photo, GPS tagged' : 'Photo pending'
        payload = { tag: tag.join(', '), location, photo: photo ?? '' }
        break
      case 'ncr':
        title = ncrTitle.trim() || 'Field non-conformance'
        summary = `${ncrSev} · ${discipline}`
        payload = { title, severity: ncrSev, discipline, description: description.trim() || `${title}. Raised from the field app at ${location}.` }
        break
      case 'equipment':
        title = `${equipment} daily reading`
        summary = `${hours} h · fuel ${reading}% · ${condition.join(', ')}`
        payload = { equipment, hours, reading, condition: condition.join(', ') }
        break
    }
    const status = actions.fieldCapture({ kind, title, summary, payload })
    onSaved({ status, kind })
  }

  const sevTone = (s: string) => (s === 'High' || s === 'Critical' || s === 'Major' ? 'bg-crit text-white' : s === 'Medium' || s === 'Minor' ? 'bg-[#d97706] text-white' : 'bg-ok text-white')

  let body: ReactNode = null
  if (item.id === 'hse')
    body = (
      <>
        <CameraTile photo={photo} capturing={capturing} onCapture={capture} onClear={() => setPhoto(null)} />
        <BigSelect label="Location" value={location} onChange={setLocation} options={LOCATIONS} />
        <Chips label="Category" options={hseCategories} value={[category]} onChange={(v) => setCategory(v[0] ?? category)} />
        <Segment label="Severity" options={['Low', 'Medium', 'High'] as Severity[]} value={severity} onChange={setSeverity} tone={sevTone} />
        <BigInput label="Description (optional)" value={description} onChange={setDescription} placeholder="Short note, e.g. pipe handler under joint" />
        <Chips label="Immediate action" options={IMMEDIATE} value={immediate} onChange={setImmediate} multi />
        <BigSelect label="Assigned to" value={assignedTo} onChange={setAssignedTo} options={ASSIGNEES} />
        <Segment label="Due date" options={['Today', 'Tomorrow'] as ('Today' | 'Tomorrow')[]} value={due} onChange={setDue} />
      </>
    )
  else if (item.id === 'progress')
    body = (
      <>
        <BigSelect label="Work package" value={wpName} onChange={setWpName} options={['Welding', 'Pipe Laying', 'Lowering-in', 'Coating']} />
        <BigSelect label="Location" value={location} onChange={setLocation} options={LOCATIONS} />
        <Stepper label={wpName === 'Welding' ? 'Joints completed' : 'Metres completed'} value={qty} onChange={setQty} step={wpName === 'Welding' ? 1 : 50} unit={wpName === 'Welding' ? 'joints' : 'm'} />
        <Chips label="Delay causes (if any)" options={['Inspection waiting', 'Heat stop', 'Equipment breakdown', 'Material shortage']} value={delay} onChange={setDelay} multi />
        <CameraTile photo={photo} capturing={capturing} onCapture={capture} onClear={() => setPhoto(null)} />
      </>
    )
  else if (item.id === 'attendance')
    body = (
      <>
        <BigSelect label="Crew" value={crew} onChange={setCrew} options={['Welding crew W-2', 'Stringing crew S-1', 'Lowering-in crew L-1', 'Civil crew C-3']} />
        <Stepper label="Present" value={present} onChange={setPresent} unit="workers" />
        <Stepper label="Absent" value={absent} onChange={setAbsent} unit="workers" />
      </>
    )
  else if (item.id === 'inspection')
    body = (
      <>
        <BigSelect label="Inspection type" value={inspType} onChange={(v) => { setInspType(v); setChecks([]) }} options={Object.keys(INSP_ITEMS)} />
        <BigSelect label="Location" value={location} onChange={setLocation} options={LOCATIONS} />
        <MCard className="!px-3 !py-1">
          <div className="divide-y divide-line">
            {INSP_ITEMS[inspType].map((c) => (
              <CheckRow key={c} label={c} checked={checks.includes(c)} onChange={() => setChecks((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))} />
            ))}
          </div>
        </MCard>
        <Segment label="Result" options={['Pass', 'Fail'] as ('Pass' | 'Fail')[]} value={inspResult} onChange={setInspResult} tone={(o) => (o === 'Pass' ? 'bg-ok text-white' : 'bg-crit text-white')} />
        <CameraTile photo={photo} capturing={capturing} onCapture={capture} onClear={() => setPhoto(null)} />
      </>
    )
  else if (item.id === 'photo')
    body = (
      <>
        <CameraTile photo={photo} capturing={capturing} onCapture={capture} onClear={() => setPhoto(null)} />
        <Chips label="Tag" options={['Progress', 'HSE', 'Quality', 'Handover']} value={tag} onChange={(v) => setTag(v.length ? v : tag)} multi />
        <BigSelect label="Location" value={location} onChange={setLocation} options={LOCATIONS} />
      </>
    )
  else if (item.id === 'ncr')
    body = (
      <>
        <CameraTile photo={photo} capturing={capturing} onCapture={capture} onClear={() => setPhoto(null)} />
        <BigInput label="Title" value={ncrTitle} onChange={setNcrTitle} />
        <Segment label="Severity" options={['Minor', 'Major', 'Critical'] as ('Minor' | 'Major' | 'Critical')[]} value={ncrSev} onChange={setNcrSev} tone={sevTone} />
        <BigSelect label="Discipline" value={discipline} onChange={setDiscipline} options={['Welding', 'Coating', 'Civil', 'Mechanical', 'Electrical']} />
        <BigSelect label="Location" value={location} onChange={setLocation} options={LOCATIONS} />
        <BigInput label="Description (optional)" value={description} onChange={setDescription} placeholder="What is non-conforming?" />
      </>
    )
  else if (item.id === 'equipment')
    body = (
      <>
        <BigSelect label="Equipment" value={equipment} onChange={setEquipment} options={['Side boom SB-07', 'Side boom SB-03', 'Welding rig WR-04', 'Excavator EX-12', 'Generator G-3']} />
        <Stepper label="Operating hours today" value={hours} onChange={setHours} unit="h" />
        <Stepper label="Fuel level" value={reading} onChange={(v) => setReading(Math.min(100, v))} step={5} unit="%" />
        <Chips label="Condition" options={['Serviceable', 'Minor defect', 'Out of service']} value={condition} onChange={(v) => setCondition(v.length ? [v[v.length - 1]] : condition)} />
      </>
    )

  return (
    <div>
      <ScreenTitle title={item.label} onBack={onBack} />
      {item.id === 'hse' && <p className="-mt-2 mb-4 text-[13px] text-ink-3">Prefilled from your location and last lift plan. Adjust only what differs.</p>}
      <div className="space-y-5">{body}</div>
      <div className="sticky -bottom-6 -mx-4 mt-6 border-t border-line bg-canvas px-4 pt-3 pb-6">
        <BigButton icon={Check} onClick={save}>
          Save {item.id === 'hse' ? 'observation' : 'record'}
        </BigButton>
      </div>
    </div>
  )
}

/* ---------------- Sync ---------------- */

type Phase = 'idle' | 'syncing' | 'failed' | 'synced' | 'done'

interface Snapshot {
  records: FieldRecord[]
  obsIds: string[]
  ncrIds: string[]
}

function SyncScreen() {
  const { state, actions } = useStore()
  const leadership = useLeadership()
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const queue = state.field.queue
  const total = snap?.records.length ?? queue.length

  useEffect(() => {
    if (phase !== 'syncing' || !snap) return
    const n = snap.records.length
    const failAt = Math.max(1, Math.ceil(n / 2))
    if (state.field.failNextSync && progress >= failAt) {
      const t = window.setTimeout(() => {
        actions.syncQueue()
        setPhase('failed')
      }, 450)
      return () => window.clearTimeout(t)
    }
    if (progress >= n) {
      const t = window.setTimeout(() => {
        const ok = actions.syncQueue()
        setPhase(ok ? 'synced' : 'failed')
      }, 350)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setProgress((p) => p + 1), 500)
    return () => window.clearTimeout(t)
  }, [phase, progress, snap, state.field.failNextSync, actions])

  useEffect(() => {
    if (phase !== 'synced') return
    const t = window.setTimeout(() => setPhase('done'), 1000)
    return () => window.clearTimeout(t)
  }, [phase])

  const start = () => {
    if (!queue.length) return
    setSnap({ records: [...queue], obsIds: state.observations.map((o) => o.id), ncrIds: state.ncrs.map((n) => n.id) })
    setProgress(0)
    setPhase('syncing')
  }

  const effects = useMemo(() => {
    if (!snap || (phase !== 'done' && phase !== 'synced')) return []
    const newObs = state.observations.filter((o) => !snap.obsIds.includes(o.id))
    const newNcrs = state.ncrs.filter((n) => !snap.ncrIds.includes(n.id))
    const npe = state.projects.find((p) => p.id === 'NPE')
    const out: { icon: LucideIcon; text: string; tone: 'ok' | 'warn' | 'crit' | 'info' }[] = []
    newObs.forEach((o) => {
      out.push({ icon: ShieldAlert, text: `${o.id} created in HSE dashboard`, tone: 'info' })
      if (o.actionIds[0]) out.push({ icon: ClipboardList, text: `Action ${o.actionIds[0]} assigned to ${o.assignedTo}`, tone: 'info' })
      if (o.severity === 'High' || o.severity === 'Critical') {
        out.push({ icon: CircleAlert, text: 'Escalated to HSE Manager and Project Director', tone: 'warn' })
        out.push({ icon: Bell, text: 'Leadership alert raised in Alert Centre', tone: 'crit' })
        if (npe) out.push({ icon: TrendingUp, text: `Project risk score updated: North Pipeline now ${npe.riskScore}`, tone: 'crit' })
      }
    })
    snap.records.forEach((r) => {
      if (r.kind === 'Daily Progress') out.push({ icon: TrendingUp, text: `${String(r.payload.workPackage ?? 'Welding')} progress posted to project schedule`, tone: 'ok' })
      if (r.kind === 'Attendance') out.push({ icon: UserCheck, text: `Attendance posted to HR manpower (${r.summary})`, tone: 'ok' })
      if (r.kind === 'Inspection' || r.kind === 'Photo' || r.kind === 'Equipment') out.push({ icon: KIND_ICON[r.kind], text: `${r.kind} filed to project records`, tone: 'ok' })
    })
    newNcrs.forEach((n) => out.push({ icon: FileWarning, text: `${n.id} raised in QA/QC`, tone: 'warn' }))
    out.push({ icon: ListChecks, text: 'Activity timeline updated', tone: 'ok' })
    return out
  }, [snap, phase, state.observations, state.ncrs, state.projects])

  const hasHse = snap?.records.some((r) => r.kind === 'HSE Observation')

  if (phase === 'syncing')
    return (
      <div className="flex flex-col items-center pt-10 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-info-bg text-action">
          <LoaderCircle className="size-10 animate-spin" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 text-[24px] font-semibold text-ink">Syncing...</h1>
        <p className="tabular mt-2 text-[16px] font-medium text-ink-2">
          {Math.min(progress + 1, total)}/{total} records
        </p>
        <div className="mt-5 h-2.5 w-full rounded-full bg-[#eef0f3]">
          <div className="h-full rounded-full bg-action transition-[width] duration-500" style={{ width: `${(progress / Math.max(1, total)) * 100}%` }} />
        </div>
        <ul className="mt-6 w-full space-y-2 text-start">
          {snap?.records.map((r, i) => {
            const Icon = KIND_ICON[r.kind]
            const st = i < progress ? 'done' : i === progress ? 'now' : 'wait'
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3 py-3">
                <Icon className="size-5 shrink-0 text-ink-2" strokeWidth={1.5} />
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{r.title}</span>
                {st === 'done' ? <Check className="size-5 text-ok" strokeWidth={2.25} /> : st === 'now' ? <LoaderCircle className="size-5 animate-spin text-action" /> : <span className="text-[12px] text-ink-3">Queued</span>}
              </li>
            )
          })}
        </ul>
      </div>
    )

  if (phase === 'failed')
    return (
      <div className="anim-pop flex flex-col items-center pt-10 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-crit-bg text-crit">
          <CloudOff className="size-10" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 text-[22px] font-semibold text-ink">Sync failed: records kept safely on device</h1>
        <p className="mt-2 max-w-[290px] text-[14px] text-ink-2">The connection dropped at {progress}/{total}. Nothing was lost. {queue.length} records are still stored locally and will retry.</p>
        <div className="mt-8 w-full space-y-3">
          <BigButton icon={RefreshCw} onClick={start}>
            Retry
          </BigButton>
          <BigButton variant="secondary" onClick={() => setPhase('idle')}>
            Later
          </BigButton>
        </div>
      </div>
    )

  if (phase === 'synced' || phase === 'done')
    return (
      <div className="flex flex-col items-center pt-6 text-center">
        <span className="anim-pop flex size-20 items-center justify-center rounded-full bg-ok-bg text-ok">
          <CloudCheck className="size-10" strokeWidth={1.5} />
        </span>
        <p className="tabular mt-4 text-[16px] font-semibold text-ok">
          {total}/{total} synced
        </p>
        {phase === 'done' && (
          <div className="anim-fade w-full">
            <h1 className="mt-1 text-[22px] font-semibold text-ink">All site records synchronised.</h1>
            <p className="mt-1 text-[13px] text-ink-3">Last sync {state.field.lastSync}</p>
            <MCard className="mt-5 !p-0 text-start">
              <div className="px-4 pt-4">
                <MLabel className="mb-0">What happened centrally</MLabel>
              </div>
              <ul className="divide-y divide-line">
                {effects.map((e, i) => (
                  <li key={i} className="anim-fade flex items-center gap-3 px-4 py-3" style={{ animationDelay: `${i * 90}ms`, animationFillMode: 'both' }}>
                    <span className={cx('flex size-8 shrink-0 items-center justify-center rounded-full', e.tone === 'crit' ? 'bg-crit-bg text-crit' : e.tone === 'warn' ? 'bg-warn-bg text-[#b45309]' : e.tone === 'info' ? 'bg-info-bg text-action' : 'bg-ok-bg text-ok')}>
                      <e.icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="text-[14px] text-ink">{e.text}</span>
                  </li>
                ))}
              </ul>
            </MCard>
            <div className="mt-5 space-y-3">
              {hasHse && (
                <BigButton icon={ShieldAlert} onClick={() => leadership('/hse')}>
                  View in HSE dashboard
                </BigButton>
              )}
              <BigButton variant={hasHse ? 'secondary' : 'primary'} icon={LayoutDashboard} onClick={() => leadership('/command')}>
                Back to leadership view
              </BigButton>
              <button type="button" onClick={() => setPhase('idle')} className="min-h-11 w-full text-[14px] font-semibold text-action">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    )

  return (
    <div>
      <ScreenTitle title="Sync" />
      <MCard>
        <div className="flex items-center gap-4">
          <span className={cx('flex size-14 shrink-0 items-center justify-center rounded-full', queue.length ? 'bg-warn-bg text-[#b45309]' : 'bg-ok-bg text-ok')}>
            {queue.length ? <CloudUpload className="size-7" strokeWidth={1.5} /> : <CloudCheck className="size-7" strokeWidth={1.5} />}
          </span>
          <div>
            <div className="tabular text-[22px] font-semibold text-ink">Pending: {queue.length} record{queue.length === 1 ? '' : 's'}</div>
            <div className="text-[13px] text-ink-3">Last sync {state.field.lastSync}</div>
          </div>
        </div>
      </MCard>

      {queue.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-[14px] border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
          <CloudCheck className="size-10 text-ok" strokeWidth={1.5} />
          <p className="mt-3 text-[16px] font-semibold text-ink">Everything is synchronised</p>
          <p className="mt-1 text-[13px] text-ink-2">New captures {state.field.online ? 'sync instantly while online' : 'are queued here until you sync'}.</p>
        </div>
      ) : (
        <>
          <MLabel className="mt-5">Saved on this device</MLabel>
          <ul className="space-y-2">
            {queue.map((r) => {
              const Icon = KIND_ICON[r.kind]
              return (
                <li key={r.id} className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted">
                    <Icon className="size-5 text-shell" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-ink-3">
                      {r.kind} · saved {r.savedAt}
                    </span>
                    <span className="block truncate text-[14px] text-ink">{r.title}</span>
                    <span className="block truncate text-[12px] text-ink-3">{r.summary}</span>
                  </span>
                  <CloudOff className="size-4 shrink-0 text-[#b45309]" strokeWidth={1.75} />
                </li>
              )
            })}
          </ul>
        </>
      )}

      <button type="button" role="switch" aria-checked={state.field.failNextSync} onClick={() => actions.setFailNextSync(!state.field.failNextSync)} className="mt-5 flex min-h-14 w-full items-center gap-3 rounded-[12px] border border-line bg-surface px-4 text-start">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-ink">Simulate failed sync</span>
          <span className="block text-[12px] text-ink-3">Demo the poor-connectivity path</span>
        </span>
        <span className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', state.field.failNextSync ? 'bg-crit' : 'bg-line-strong')}>
          <span className={cx('absolute top-1 size-5 rounded-full bg-white transition-all', state.field.failNextSync ? 'start-6' : 'start-1')} />
        </span>
      </button>

      <div className="mt-5">
        <BigButton icon={RefreshCw} onClick={start} disabled={queue.length === 0}>
          Sync Now
        </BigButton>
      </div>
    </div>
  )
}

/* ---------------- Profile ---------------- */

function ProfileScreen() {
  const { state, actions } = useStore()
  const leadership = useLeadership()
  const me = state.employees.find((e) => e.id === 'EMP-10231')
  const status = (exp: string) => {
    const d = daysUntil(exp)
    return d < 0 ? { t: 'Expired', c: 'bg-crit-bg text-crit' } : d <= 90 ? { t: `Expires in ${d} days`, c: 'bg-warn-bg text-[#92400e]' } : { t: 'Valid', c: 'bg-ok-bg text-ok' }
  }
  return (
    <div className="space-y-4">
      <MCard>
        <div className="flex items-center gap-4">
          <Avatar name={USER} size={56} />
          <div className="min-w-0">
            <div className="text-[18px] font-semibold text-ink">{USER}</div>
            <div className="text-[13px] text-ink-2">Site Engineer, North Pipeline Spread 2</div>
            <div className="text-[12px] text-ink-3">{me?.id ?? 'EMP-10231'} · {me?.employer ?? 'SHQ Group'}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
          <div className="rounded-[10px] bg-muted px-3 py-2">
            <div className="text-ink-3">Role</div>
            <div className="font-medium text-ink">Site Engineer</div>
          </div>
          <div className="rounded-[10px] bg-muted px-3 py-2">
            <div className="text-ink-3">Attendance</div>
            <div className="font-medium text-ink">{me?.attendance ?? 98}% this month</div>
          </div>
        </div>
      </MCard>

      <MCard className="!p-0">
        <div className="px-4 pt-4">
          <MLabel className="mb-0">Certifications</MLabel>
        </div>
        <ul className="divide-y divide-line">
          {(me?.certifications ?? []).map((c) => {
            const s = status(c.expiry)
            return (
              <li key={c.name} className="flex items-center gap-3 px-4 py-3">
                <BadgeCheck className="size-5 shrink-0 text-shell" strokeWidth={1.5} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-ink">{c.name}</span>
                  <span className="block text-[12px] text-ink-3">Expires {fmtDate(c.expiry)}</span>
                </span>
                <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold', s.c)}>{s.t}</span>
              </li>
            )
          })}
        </ul>
      </MCard>

      <MCard>
        <MLabel>Device</MLabel>
        <ul className="space-y-2 text-[14px]">
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-2">
              <Smartphone className="size-4" /> Handset
            </span>
            <span className="text-ink">FH-2207 · app 2.4 (demo)</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-2">{state.field.online ? <Wifi className="size-4" /> : <CloudOff className="size-4" />} Connectivity</span>
            <span className={state.field.online ? 'font-medium text-ok' : 'font-medium text-warn'}>{state.field.online ? 'Online' : 'Offline'}</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-2">
              <CloudUpload className="size-4" /> Records on device
            </span>
            <span className="text-ink">{state.field.queue.length}</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-2">
              <MapPin className="size-4" /> Location
            </span>
            <span className="text-ink">KP 42+450 (GPS)</span>
          </li>
        </ul>
      </MCard>

      <MCard>
        <MLabel>
          <span className="inline-flex items-center gap-1.5">
            <Languages className="size-3.5" /> Language
          </span>
        </MLabel>
        <div className="flex rounded-[12px] border border-line bg-muted p-1">
          {(
            [
              ['en', 'English'],
              ['ar', 'العربية'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" onClick={() => actions.setLang(id)} className={cx('min-h-12 flex-1 rounded-[9px] text-[15px] font-semibold', state.lang === id ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--border)]' : 'text-ink-2')}>
              {label}
            </button>
          ))}
        </div>
      </MCard>

      <BigButton icon={LayoutDashboard} onClick={() => leadership('/command')}>
        Switch to leadership view
      </BigButton>
    </div>
  )
}
