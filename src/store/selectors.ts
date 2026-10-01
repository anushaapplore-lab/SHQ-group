import type { ComplianceItem, DocumentRec, MdrCategory, NCR, PurchaseOrder, Role } from '../data/types'
import { DEMO_TODAY, daysBetween, daysUntil } from '../lib/format'
import type { AppState } from './seed'

export const ncrAge = (n: NCR) => daysBetween(n.detectedAt, DEMO_TODAY) + n.ageAdjust
export const ncrOverdue = (n: NCR) => n.status !== 'Closed' && ncrAge(n) > n.slaDays
export const openNcrs = (s: AppState, projectId?: string) =>
  s.ncrs.filter((n) => n.status !== 'Closed' && (!projectId || projectId === 'all' || n.projectId === projectId))
export const overdueNcrs = (s: AppState, projectId?: string) => openNcrs(s, projectId).filter(ncrOverdue)

export const openAlerts = (s: AppState) => s.alerts.filter((a) => a.status !== 'Resolved')
export const criticalOpen = (s: AppState) => openAlerts(s).filter((a) => a.level === 'critical')

export const pendingApprovals = (s: AppState) => s.approvals.filter((a) => a.status === 'Pending')
export const myApprovals = (s: AppState, role: Role) =>
  pendingApprovals(s).filter((a) => role === 'CEO' || a.approver === role)

export const poVariance = (po: PurchaseOrder) => ((po.currentUnitPrice - po.originalUnitPrice) / po.originalUnitPrice) * 100
export const poExposure = (po: PurchaseOrder) => Math.round((po.currentUnitPrice - po.originalUnitPrice) * po.qty)

export function complianceStatus(c: ComplianceItem): 'Valid' | 'Expiring Soon' | 'Expired' | 'Renewal In Progress' {
  if (c.status === 'Renewal In Progress') return 'Renewal In Progress'
  const d = daysUntil(c.expiry)
  if (d < 0) return 'Expired'
  if (d <= 30) return 'Expiring Soon'
  return 'Valid'
}

export const docExpiringSoon = (d: DocumentRec) => !!d.expiry && daysUntil(d.expiry) >= 0 && daysUntil(d.expiry) <= 30 && d.status !== 'Approved'

export const expiringCount = (s: AppState) =>
  s.compliance.filter((c) => complianceStatus(c) === 'Expiring Soon').length + s.documents.filter(docExpiringSoon).length

export function mdrSummary(cats: MdrCategory[] | undefined) {
  const list = cats ?? []
  const required = list.reduce((a, c) => a + c.required, 0)
  const completed = list.reduce((a, c) => a + c.completed, 0)
  const review = list.reduce((a, c) => a + c.review, 0)
  const expired = list.reduce((a, c) => a + c.expired, 0)
  const missing = required - completed - review - expired
  const pctComplete = required ? Math.round((completed / required) * 1000) / 10 : 0
  return { required, completed, review, expired, missing, pct: pctComplete }
}

export const projectById = (s: AppState, id: string) => s.projects.find((p) => p.id === id)
export const projectName = (s: AppState, id: string) => s.projects.find((p) => p.id === id)?.name ?? id

export const handoverPct = (s: AppState, projectId: string) => {
  const cats = s.mdr[projectId]
  if (cats) return Math.round(mdrSummary(cats).pct)
  return projectById(s, projectId)?.handover ?? 0
}

export const overallHealth = (s: AppState) => Math.round(s.projects.reduce((a, p) => a + p.health, 0) / s.projects.length)
export const totalWorkforce = (s: AppState) => s.projects.reduce((a, p) => a + p.workforce, 0)
export const portfolioValue = (s: AppState) => s.projects.reduce((a, p) => a + p.budget, 0)

export const openObservations = (s: AppState, projectId?: string) =>
  s.observations.filter((o) => o.status !== 'Closed' && (!projectId || projectId === 'all' || o.projectId === projectId))

export const inProject = <T extends { projectId: string }>(list: T[], filter: string) =>
  filter === 'all' ? list : list.filter((x) => x.projectId === filter)

export const attentionProjects = (s: AppState) => s.projects.filter((p) => p.rag !== 'GREEN')
