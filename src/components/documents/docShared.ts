import type { DocStatus, DocumentRec } from '../../data/types'
import { daysUntil } from '../../lib/format'
import type { Tone } from '../ui'

export const DOC_STATUSES: DocStatus[] = ['Missing', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Expiring', 'Expired']

export const MDR_PROJECTS = ['NPE', 'EGC', 'RUU']

/** Route for a linked record id (INS-*, NCR-*, PO-*, W-*). Returns null when there is no detail page. */
export function linkFor(id: string): string | null {
  if (id.startsWith('INS-')) return `/quality/inspections/${id}`
  if (id.startsWith('NCR-')) return `/quality/ncrs/${id}`
  if (id.startsWith('PO-')) return `/procurement/pos/${id}`
  if (id.startsWith('W-')) return `/record/${id}`
  return null
}

export function linkLabel(id: string): string {
  if (id.startsWith('INS-')) return 'Inspection'
  if (id.startsWith('NCR-')) return 'NCR'
  if (id.startsWith('PO-')) return 'Purchase order'
  if (id.startsWith('W-')) return 'Weld record'
  if (id.startsWith('DOC-')) return 'Document'
  return 'Record'
}

export function expiryTone(expiry: string | null): Tone | null {
  if (!expiry) return null
  const d = daysUntil(expiry)
  if (d < 0) return 'crit'
  if (d <= 30) return 'warn'
  return null
}

export function daysLabel(d: number): string {
  if (d < 0) return `${Math.abs(d)} days overdue`
  if (d === 0) return 'Today'
  if (d === 1) return '1 day'
  return `${d} days`
}

export const fileTypeFor = (t: string): DocumentRec['fileType'] => {
  const x = t.toLowerCase()
  if (x.endsWith('.xlsx') || x.endsWith('.xls') || x.endsWith('.csv')) return 'sheet'
  if (x.endsWith('.docx') || x.endsWith('.doc') || x.endsWith('.dwg')) return 'doc'
  if (x.endsWith('.pptx')) return 'slides'
  if (x.endsWith('.jpg') || x.endsWith('.jpeg') || x.endsWith('.png')) return 'photo'
  return 'pdf'
}
