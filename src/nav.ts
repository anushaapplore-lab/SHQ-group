import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Briefcase,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  CloudOff,
  Cog,
  FileSearch,
  FileText,
  FileWarning,
  FolderOpen,
  Gauge,
  GitBranch,
  HardHat,
  LayoutDashboard,
  Layers,
  ListChecks,
  Network,
  Package,
  PieChart,
  Plug,
  RefreshCw,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Thermometer,
  Truck,
  Users,
  Wrench,
  Camera,
  TrendingUp,
  Scale,
  Building2,
  FileCheck2,
  Hourglass,
  IdCard,
  Factory,
  History,
} from 'lucide-react'
import type { Role } from './data/types'
import { roleProfile } from './store/roles'

export type CountKey =
  | 'criticalAlerts'
  | 'pendingApprovals'
  | 'openNcrs'
  | 'openObs'
  | 'missingDocs'
  | 'expiring'
  | 'attentionPOs'
  | 'fieldQueue'
  | 'projects'
  | 'openRfis'
  | 'openWOs'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  count?: CountKey
  end?: boolean
}

export interface NavSection {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    id: 'command',
    label: 'COMMAND',
    icon: Gauge,
    items: [
      { label: 'Executive Dashboard', path: '/command', icon: LayoutDashboard },
      { label: 'Portfolio', path: '/portfolio', icon: PieChart },
      { label: 'Projects', path: '/projects', icon: Briefcase, count: 'projects', end: true },
      { label: 'Alerts & Escalations', path: '/alerts', icon: Bell, count: 'criticalAlerts' },
      { label: 'Approvals', path: '/approvals', icon: CheckSquare, count: 'pendingApprovals' },
      { label: 'AI Command Assistant', path: '/ai', icon: Sparkles },
    ],
  },
  {
    id: 'workspace',
    label: 'MY WORKSPACE',
    icon: Gauge,
    items: [
      { label: 'Alerts & Escalations', path: '/alerts', icon: Bell, count: 'criticalAlerts' },
      { label: 'Approvals', path: '/approvals', icon: CheckSquare, count: 'pendingApprovals' },
      { label: 'AI Command Assistant', path: '/ai', icon: Sparkles },
    ],
  },
  {
    id: 'site',
    label: 'SITE WORK',
    icon: HardHat,
    items: [
      { label: 'Mobile Field App', path: '/field', icon: Smartphone },
      { label: 'Schedule & Progress', path: '/projects/schedule', icon: CalendarClock },
      { label: 'Daily Reports', path: '/projects/dpr', icon: ClipboardList },
      { label: 'Inspections', path: '/quality/inspections', icon: ClipboardCheck },
      { label: 'Observations', path: '/hse/observations', icon: ShieldAlert, count: 'openObs' },
      { label: 'Project Documents', path: '/documents/project', icon: Camera },
    ],
  },
  {
    id: 'projects',
    label: 'PROJECTS',
    icon: Briefcase,
    items: [
      { label: 'All Projects', path: '/projects', icon: Briefcase, count: 'projects', end: true },
      { label: 'Construction', path: '/projects/construction', icon: Building2 },
      { label: 'Schedule & Progress', path: '/projects/schedule', icon: CalendarClock },
      { label: 'Daily Reports', path: '/projects/dpr', icon: ClipboardList },
      { label: 'Manpower', path: '/projects/manpower', icon: Users },
      { label: 'Risks & Delays', path: '/projects/risks', icon: AlertTriangle },
    ],
  },
  {
    id: 'quality',
    label: 'QA/QC',
    icon: BadgeCheck,
    items: [
      { label: 'QA/QC Dashboard', path: '/quality', icon: LayoutDashboard, end: true },
      { label: 'Inspection Plans', path: '/quality/plans', icon: ListChecks },
      { label: 'Inspections', path: '/quality/inspections', icon: ClipboardCheck },
      { label: 'RFIs', path: '/quality/rfis', icon: FileSearch, count: 'openRfis' },
      { label: 'NCRs', path: '/quality/ncrs', icon: FileWarning, count: 'openNcrs' },
      { label: 'CAPA', path: '/quality/capa', icon: GitBranch },
      { label: 'Punch List', path: '/quality/punch', icon: CheckSquare },
      { label: 'Calibration', path: '/quality/calibration', icon: Ruler },
      { label: 'Material / MTR Records', path: '/quality/mtr', icon: Package },
    ],
  },
  {
    id: 'handover',
    label: 'HANDOVER',
    icon: FileCheck2,
    items: [
      { label: 'Handover Dashboard', path: '/handover', icon: LayoutDashboard, end: true },
      { label: 'MDR / Dossier', path: '/handover/mdr', icon: Layers },
      { label: 'Document Register', path: '/handover/register', icon: FileText },
      { label: 'Missing Documents', path: '/handover/missing', icon: FileWarning, count: 'missingDocs' },
      { label: 'Expiring Documents', path: '/handover/expiring', icon: Hourglass },
      { label: 'Submission Readiness', path: '/handover/readiness', icon: BadgeCheck },
    ],
  },
  {
    id: 'hse',
    label: 'HSE',
    icon: ShieldCheck,
    items: [
      { label: 'HSE Dashboard', path: '/hse', icon: LayoutDashboard, end: true },
      { label: 'Observations', path: '/hse/observations', icon: ShieldAlert, count: 'openObs' },
      { label: 'Incidents', path: '/hse/incidents', icon: AlertTriangle },
      { label: 'Permits', path: '/hse/permits', icon: FileCheck2 },
      { label: 'Inspections', path: '/hse/inspections', icon: ClipboardCheck },
      { label: 'Risk Assessments', path: '/hse/risk-assessments', icon: Scale },
      { label: 'Certificates', path: '/hse/certificates', icon: BadgeCheck },
      { label: 'Heat Stress', path: '/hse/heat', icon: Thermometer },
    ],
  },
  {
    id: 'procurement',
    label: 'PROCUREMENT',
    icon: Truck,
    items: [
      { label: 'Procurement Dashboard', path: '/procurement', icon: LayoutDashboard, end: true },
      { label: 'Purchase Orders', path: '/procurement/pos', icon: FileText, count: 'attentionPOs' },
      { label: 'Vendors', path: '/procurement/vendors', icon: Factory },
      { label: 'Deliveries', path: '/procurement/deliveries', icon: Truck },
      { label: 'Price Variance', path: '/procurement/variance', icon: TrendingUp },
      { label: 'Vendor Issues', path: '/procurement/issues', icon: AlertTriangle },
      { label: 'Recommendations', path: '/procurement/recommendations', icon: Sparkles },
    ],
  },
  {
    id: 'hr',
    label: 'HR / MANPOWER',
    icon: Users,
    items: [
      { label: 'Workforce Dashboard', path: '/hr', icon: LayoutDashboard, end: true },
      { label: 'Manpower', path: '/hr/manpower', icon: Users },
      { label: 'Attendance', path: '/hr/attendance', icon: CalendarClock },
      { label: 'Utilisation', path: '/hr/utilisation', icon: Activity },
      { label: 'Competency', path: '/hr/competency', icon: BadgeCheck },
      { label: 'Certificates', path: '/hr/certificates', icon: FileCheck2 },
      { label: 'Iqama / Visa', path: '/hr/iqama', icon: IdCard },
      { label: 'Expiry Alerts', path: '/hr/expiry', icon: Hourglass },
    ],
  },
  {
    id: 'om',
    label: 'O&M',
    icon: Wrench,
    items: [
      { label: 'O&M Dashboard', path: '/om', icon: LayoutDashboard, end: true },
      { label: 'Assets', path: '/om/assets', icon: Boxes },
      { label: 'Preventive Maintenance', path: '/om/pm', icon: CalendarClock },
      { label: 'Work Orders', path: '/om/work-orders', icon: Wrench, count: 'openWOs' },
      { label: 'SLA', path: '/om/sla', icon: Gauge },
      { label: 'Contracts', path: '/om/contracts', icon: FileText },
      { label: 'Asset History', path: '/om/history', icon: History },
    ],
  },
  {
    id: 'compliance',
    label: 'COMPLIANCE',
    icon: ShieldCheck,
    items: [
      { label: 'Compliance Dashboard', path: '/compliance', icon: LayoutDashboard, end: true },
      { label: 'Licences', path: '/compliance/licences', icon: IdCard },
      { label: 'Permits', path: '/compliance/permits', icon: FileCheck2 },
      { label: 'Contracts', path: '/compliance/contracts', icon: FileText },
      { label: 'Equipment Certificates', path: '/compliance/equipment', icon: BadgeCheck },
      { label: 'Warranties', path: '/compliance/warranties', icon: ShieldCheck },
      { label: 'Expiry Calendar', path: '/compliance/calendar', icon: CalendarClock, count: 'expiring' },
    ],
  },
  {
    id: 'documents',
    label: 'DOCUMENTS',
    icon: FolderOpen,
    items: [
      { label: 'Document Centre', path: '/documents', icon: FolderOpen, end: true },
      { label: 'Recent', path: '/documents/recent', icon: History },
      { label: 'Expiring', path: '/documents/expiring', icon: Hourglass },
      { label: 'Missing', path: '/documents/missing', icon: FileWarning },
      { label: 'Project Documents', path: '/documents/project', icon: Briefcase },
    ],
  },
  {
    id: 'field',
    label: 'FIELD',
    icon: HardHat,
    items: [
      { label: 'Mobile Field App', path: '/field', icon: Smartphone, end: true },
      { label: 'My Tasks', path: '/field/tasks', icon: ListChecks },
      { label: 'Site Capture', path: '/field/capture', icon: Camera },
      { label: 'Offline Queue', path: '/field/queue', icon: CloudOff, count: 'fieldQueue' },
      { label: 'Sync Status', path: '/field/sync', icon: RefreshCw },
    ],
  },
  {
    id: 'platform',
    label: 'PLATFORM',
    icon: Cog,
    items: [
      { label: 'Operational Efficiency', path: '/efficiency', icon: BarChart3 },
      { label: 'Operational Playbooks', path: '/playbooks', icon: BookOpen },
      { label: 'Record 360°', path: '/record/W-00428', icon: Network },
      { label: 'Reports', path: '/reports', icon: FileText },
      { label: 'Format Packs', path: '/settings', icon: Sun },
      { label: 'Integrations', path: '/integrations', icon: Plug },
      { label: 'Administration', path: '/admin', icon: Cog },
    ],
  },
]

export function navForRole(role: Role): NavSection[] {
  const sections = roleProfile(role).sections
  return sections.map((id) => NAV.find((s) => s.id === id)).filter((s): s is NavSection => !!s)
}

const PREFIX: [string, string[]][] = [
  ['/command', ['command']],
  ['/portfolio', ['command']],
  ['/alerts', ['command', 'workspace']],
  ['/approvals', ['command', 'workspace']],
  ['/ai', ['command', 'workspace', 'site']],
  ['/projects/schedule', ['projects', 'site']],
  ['/projects/dpr', ['projects', 'site']],
  ['/projects/NPE', ['projects', 'command', 'site']],
  ['/projects', ['projects', 'command']],
  ['/quality/inspections', ['quality', 'site']],
  ['/quality', ['quality']],
  ['/handover', ['handover']],
  ['/hse/observations', ['hse', 'site']],
  ['/hse', ['hse']],
  ['/procurement', ['procurement']],
  ['/hr', ['hr']],
  ['/om', ['om']],
  ['/compliance', ['compliance']],
  ['/documents/project', ['documents', 'site']],
  ['/documents', ['documents']],
  ['/field', ['field', 'site']],
  ['/record', ['platform', 'quality']],
  ['/efficiency', ['platform']],
  ['/playbooks', ['platform']],
  ['/reports', ['platform']],
  ['/settings', ['platform']],
  ['/integrations', ['platform']],
  ['/admin', ['platform']],
]

export function canAccess(role: Role, path: string): boolean {
  const sections = roleProfile(role).sections
  const match = PREFIX.find(([p]) => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'))
  if (!match) return true
  return match[1].some((s) => sections.includes(s))
}
