import { activities, alerts, approvals } from '../data/alerts'
import { complianceItems, documents, mdrCategories } from '../data/documents'
import { hseActions, observations } from '../data/hse'
import { employees } from '../data/hr'
import { assets, pmTasks, workOrders } from '../data/om'
import { purchaseOrders, vendors } from '../data/procurement'
import { projects, risks, workPackages } from '../data/projects'
import { capas, inspections, ncrs } from '../data/quality'
import type {
  Action,
  Activity,
  Alert,
  Approval,
  Asset,
  CAPA,
  ComplianceItem,
  DPR,
  DocumentRec,
  Employee,
  FieldRecord,
  Inspection,
  MdrCategory,
  NCR,
  Observation,
  PMTask,
  Project,
  PurchaseOrder,
  Risk,
  Role,
  Vendor,
  WorkOrder,
  WorkPackage,
} from '../data/types'

export interface AppState {
  version: number
  signedIn: boolean
  role: Role
  lang: 'en' | 'ar'
  projectFilter: string
  clock: number
  projects: Project[]
  workPackages: WorkPackage[]
  risks: Risk[]
  dprs: DPR[]
  inspections: Inspection[]
  ncrs: NCR[]
  capas: CAPA[]
  observations: Observation[]
  actions: Action[]
  vendors: Vendor[]
  pos: PurchaseOrder[]
  employees: Employee[]
  assets: Asset[]
  workOrders: WorkOrder[]
  pmTasks: PMTask[]
  documents: DocumentRec[]
  mdr: Record<string, MdrCategory[]>
  compliance: ComplianceItem[]
  alerts: Alert[]
  approvals: Approval[]
  activities: Activity[]
  hseStats: { totalObs: number; incidents: number; nearMisses: number; highRiskActivities: number; activePermits: number; heatIndex: number }
  qaStats: { inspectionsToday: number; passed: number; reworkCost: number }
  field: {
    online: boolean
    failNextSync: boolean
    queue: FieldRecord[]
    synced: FieldRecord[]
    lastSync: string
    attendanceMarked: boolean
    tasksDone: string[]
  }
  aiDprGenerated: boolean
  lastRefresh: string
}

export const STATE_VERSION = 3

const seededDprs: DPR[] = [
  {
    id: 'DPR-NPE-0930',
    projectId: 'NPE',
    status: 'Approved',
    owner: 'Faisal Al-Qahtani',
    createdAt: '2026-09-30',
    updatedAt: '2026-09-30',
    date: '2026-09-30',
    workPackage: 'Welding',
    location: 'Spread 2, KP 41+800 to KP 42+600',
    weather: 'Clear, 41°C peak',
    manpower: 318,
    equipment: '6 side booms, 4 welding rigs, 2 excavators',
    workCompleted: '38 joints welded, 1.6 km pipe strung, 0.9 km lowered-in',
    quantity: '38 joints',
    issues: 'NDT crew available for half shift only',
    delayCause: 'Inspection waiting',
    photos: 6,
    supervisor: 'Mahmoud Saleh',
    progressDelta: 2.1,
    aiSummary: 'Construction progressed by 2.1% against 2.6% planned. Welding output was constrained by NDT availability on Spread 2.',
  },
  {
    id: 'DPR-NPE-0929',
    projectId: 'NPE',
    status: 'Approved',
    owner: 'Faisal Al-Qahtani',
    createdAt: '2026-09-29',
    updatedAt: '2026-09-29',
    date: '2026-09-29',
    workPackage: 'Pipe Laying',
    location: 'Spread 2, KP 40+500 to KP 41+800',
    weather: 'Clear, 42°C peak',
    manpower: 321,
    equipment: '6 side booms, 4 welding rigs, 3 excavators',
    workCompleted: '1.3 km lowered-in, 41 joints welded',
    quantity: '1.3 km',
    issues: 'Heat stop 12:00 to 14:00',
    delayCause: 'Weather / heat stop',
    photos: 4,
    supervisor: 'Mahmoud Saleh',
    progressDelta: 2.6,
    aiSummary: 'Construction progressed by 2.6% against 2.7% planned. Pipe laying on schedule; heat stop reduced welding hours.',
  },
  {
    id: 'DPR-EGC-0930',
    projectId: 'EGC',
    status: 'Approved',
    owner: 'Arjun Nair',
    createdAt: '2026-09-30',
    updatedAt: '2026-09-30',
    date: '2026-09-30',
    workPackage: 'Piping Installation',
    location: 'Compressor train B',
    weather: 'Clear, 40°C peak',
    manpower: 279,
    equipment: '2 mobile cranes, 6 welding rigs',
    workCompleted: '14 spools erected, 22 joints welded',
    quantity: '14 spools',
    issues: 'Spool B14 rejected at PT',
    delayCause: 'Quality hold',
    photos: 5,
    supervisor: 'Omar Al-Ghamdi',
    progressDelta: 1.4,
    aiSummary: 'Progress of 1.4% against 1.7% planned. Spool B14 quality hold affecting train B piping.',
  },
]

export function createSeed(): AppState {
  const clone = <T,>(x: T): T => structuredClone(x)
  return {
    version: STATE_VERSION,
    signedIn: false,
    role: 'CEO',
    lang: 'en',
    projectFilter: 'all',
    clock: 10 * 60 + 40,
    projects: clone(projects),
    workPackages: clone(workPackages),
    risks: clone(risks),
    dprs: clone(seededDprs),
    inspections: clone(inspections),
    ncrs: clone(ncrs),
    capas: clone(capas),
    observations: clone(observations),
    actions: clone(hseActions),
    vendors: clone(vendors),
    pos: clone(purchaseOrders),
    employees: clone(employees),
    assets: clone(assets),
    workOrders: clone(workOrders),
    pmTasks: clone(pmTasks),
    documents: clone(documents),
    mdr: clone(mdrCategories),
    compliance: clone(complianceItems),
    alerts: clone(alerts),
    approvals: clone(approvals),
    activities: clone(activities),
    hseStats: { totalObs: 186, incidents: 3, nearMisses: 9, highRiskActivities: 14, activePermits: 37, heatIndex: 42 },
    qaStats: { inspectionsToday: 42, passed: 395, reworkCost: 1_200_000 },
    field: {
      online: false,
      failNextSync: false,
      queue: [
        {
          id: 'FLD-0001',
          kind: 'Daily Progress',
          title: 'Welding progress KP 42+600 to KP 42+900',
          summary: '12 joints welded, crew W-2',
          savedAt: '09:12',
          payload: { workPackage: 'Welding', quantity: 12 },
        },
        {
          id: 'FLD-0002',
          kind: 'Attendance',
          title: 'Spread 2 morning attendance',
          summary: '86 present, 3 absent',
          savedAt: '06:05',
          payload: { present: 86, absent: 3 },
        },
      ],
      synced: [],
      lastSync: 'Today 08:58',
      attendanceMarked: false,
      tasksDone: [],
    },
    aiDprGenerated: false,
    lastRefresh: 'Today 10:40',
  }
}
