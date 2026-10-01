export type RAG = 'GREEN' | 'AMBER' | 'RED'
export type Level = 'critical' | 'warning' | 'info'
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

export type Role =
  | 'CEO'
  | 'Project Director'
  | 'QA/QC Manager'
  | 'HSE Manager'
  | 'Procurement Manager'
  | 'HR Manager'
  | 'Site Engineer'

export type Department =
  | 'Executive'
  | 'Projects'
  | 'QA/QC'
  | 'Handover'
  | 'HSE'
  | 'Procurement'
  | 'HR'
  | 'O&M'
  | 'Compliance'

export interface Base {
  id: string
  projectId: string
  status: string
  owner: string
  createdAt: string
  updatedAt: string
}

export interface Phase {
  name: string
  progress: number
}

export interface Project extends Base {
  code: string
  name: string
  shortName: string
  type: 'Construction' | 'O&M'
  location: string
  client: string
  rag: RAG
  progress: number
  planned: number
  scheduleVarianceDays: number
  budget: number // SAR millions
  actual: number // SAR millions
  quality: number
  hse: number
  workforce: number
  workforcePlanned: number
  openRisks: number
  handover: number
  health: number
  riskScore: number
  manager: string
  startDate: string
  finishDate: string
  phases: Phase[]
  flagship: boolean
}

export interface WorkPackage extends Base {
  name: string
  plannedStart: string
  plannedFinish: string
  actualStart: string | null
  forecastFinish: string
  progress: number
  planned: number
  delayCause?: string
  affected?: string
  action?: string
  actionOwner?: string
  impactDays?: number
}

export interface DPR extends Base {
  date: string
  workPackage: string
  location: string
  weather: string
  manpower: number
  equipment: string
  workCompleted: string
  quantity: string
  issues: string
  delayCause: string
  photos: number
  supervisor: string
  progressDelta: number
  aiSummary: string
}

export interface Inspection extends Base {
  discipline: string
  location: string
  reference: string
  inspector: string
  type: string
  workPackageId: string
  date: string
  findings: string[]
  photos: string[]
  ncrId?: string
  result: 'Passed' | 'Failed' | 'Pending' | 'Re-inspection Requested'
}

export type NcrStage = 'Open' | 'Investigation' | 'CAPA Submitted' | 'Verification' | 'Closed'

export interface NCR extends Base {
  title: string
  severity: 'Minor' | 'Major' | 'Critical'
  source: string
  inspectionId?: string
  discipline: string
  description: string
  rootCause: string
  immediateCorrection: string
  correctiveAction: string
  preventiveAction: string
  responsible: string
  dueDate: string
  detectedAt: string
  slaDays: number
  ageAdjust: number
  status: NcrStage
  capaId?: string
  escalated?: boolean
  costImpact?: number
}

export interface CAPA extends Base {
  ncrId: string
  rootCause: string
  correctiveAction: string
  preventiveAction: string
  dueDate: string
  progress: number
}

export interface Observation extends Base {
  title: string
  category: string
  severity: Severity
  location: string
  description: string
  immediateAction: string
  assignedTo: string
  dueDate: string
  reportedBy: string
  photo?: string
  ai?: {
    detection: string
    confidence: number
    risk: Severity
    recommendation: string
    detected: string[]
    hazards: string[]
    controls: string[]
  }
  source: 'Web' | 'Field App'
  actionIds: string[]
}

export interface Action extends Base {
  title: string
  sourceType: 'Observation' | 'NCR' | 'PO' | 'Document' | 'Alert' | 'Inspection'
  sourceId: string
  department: Department
  dueDate: string
  priority: Severity
}

export interface Vendor {
  id: string
  name: string
  category: string
  rating: RAG
  delivery: number
  quality: number
  priceStability: number
  responsiveness: number
  ncrCount: number
  avgResolutionDays: number
  trend: { month: string; delivery: number; quality: number; price: number }[]
  contact: string
  phone: string
  email: string
  approved: boolean
}

export interface PurchaseOrder extends Base {
  vendorId: string
  material: string
  value: number // SAR
  qty: number
  unit: string
  originalUnitPrice: number
  currentUnitPrice: number
  deliveryDue: string
  daysLate: number
  critical: boolean
  recommendationDismissed?: boolean
  escalated?: boolean
}

export interface Employee extends Base {
  name: string
  trade: string
  employer: string
  skill: 'Foreman' | 'Skilled' | 'Semi-skilled' | 'Supervisor' | 'Engineer'
  nationality: string
  certifications: { name: string; expiry: string }[]
  iqamaExpiry: string
  attendance: number
  deployment: { project: string; from: string; to: string }[]
  utilisation: number
}

export interface Asset extends Base {
  name: string
  tag: string
  type: string
  location: string
  lastMaintenance: string
  nextPM: string
  operatingHours: number
  criticality: 'High' | 'Medium' | 'Low'
  history: { date: string; event: string; by: string }[]
}

export interface WorkOrder extends Base {
  assetId: string
  title: string
  type: 'Corrective' | 'Preventive' | 'Inspection'
  priority: Severity
  dueDate: string
  technician: string
  slaHours: number
  elapsedHours: number
}

export interface PMTask extends Base {
  assetId: string
  maintenanceType: string
  dueDate: string
  lastService: string
  technician: string
}

export type DocStatus =
  | 'Missing'
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Expiring'
  | 'Expired'

export interface DocumentRec extends Base {
  title: string
  docType: string
  category: string
  discipline: string
  department: Department
  revision: string
  status: DocStatus
  submitted: string | null
  approved: string | null
  expiry: string | null
  fileType: 'pdf' | 'sheet' | 'doc' | 'slides' | 'photo'
  linkedTo: string[]
  note?: string
}

export interface MdrCategory {
  name: string
  required: number
  completed: number
  review: number
  expired: number
}

export interface ComplianceItem extends Base {
  item: string
  kind: 'Licence' | 'Permit' | 'Vendor Contract' | 'Equipment Certificate' | 'Warranty' | 'Insurance' | 'Employee Document'
  reference: string
  issuer: string
  expiry: string
  action: string
}

export interface Alert {
  id: string
  level: Level
  title: string
  source: string
  sourceId?: string
  projectId: string
  department: Department
  impact: string
  owner: string
  dueDate: string
  recommendation: string
  escalation: string
  status: 'Open' | 'Acknowledged' | 'Resolved'
  createdAt: string
  rule?: string
  link?: string
}

export interface Approval {
  id: string
  type: 'NCR CAPA' | 'Vendor change' | 'Purchase request' | 'Document approval' | 'HSE corrective action' | 'Project variation'
  title: string
  projectId: string
  requestedBy: string
  approver: Role
  summary: string
  impact: string
  value?: string
  attachments: string[]
  recommendation: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Changes Requested'
  createdAt: string
  decidedAt?: string
  comment?: string
  linkId?: string
}

export interface Activity {
  id: string
  time: string
  text: string
  user: string
  department: Department
  projectId: string
  link?: string
  kind: 'ncr' | 'inspection' | 'po' | 'dpr' | 'hse' | 'doc' | 'approval' | 'alert' | 'field' | 'system'
}

export interface Risk extends Base {
  title: string
  category: string
  probability: number
  impact: number
  mitigation: string
}

export interface FieldRecord {
  id: string
  kind: 'HSE Observation' | 'Daily Progress' | 'Attendance' | 'Inspection' | 'Photo' | 'NCR' | 'Equipment'
  title: string
  summary: string
  savedAt: string
  payload: Record<string, string | number | boolean>
}

export interface Toast {
  id: string
  title: string
  body?: string
  tone: 'success' | 'info' | 'warning' | 'error'
}
