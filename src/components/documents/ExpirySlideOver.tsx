import { useNavigate } from 'react-router-dom'
import { CalendarClock, CircleCheck, CloudUpload, Eye, FileText, RotateCcw } from 'lucide-react'
import { useStore } from '../../store/store'
import { complianceStatus, projectName } from '../../store/selectors'
import type { ComplianceItem } from '../../data/types'
import { daysUntil, fmtDate } from '../../lib/format'
import { Button, KeyValue, Pill, SlideOver, StatusPill } from '../ui'
import type { Tone } from '../ui'
import { daysLabel } from './docShared'
import type { DocWorkflow } from './useDocWorkflow'

export type ExpiryRef = { kind: 'compliance' | 'doc'; id: string }

export function daysTone(d: number): Tone {
  return d < 0 ? 'crit' : d <= 30 ? 'warn' : 'ok'
}

/** Row-level compliance action: renew → mark renewed. */
export function ComplianceAction({ c, size = 'sm' }: { c: ComplianceItem; size?: 'sm' | 'md' }) {
  const { actions } = useStore()
  const st = complianceStatus(c)
  if (st === 'Renewal In Progress')
    return (
      <Button
        size={size}
        variant="success"
        icon={CircleCheck}
        onClick={(e) => {
          e.stopPropagation()
          actions.completeRenewal(c.id)
        }}
      >
        Mark renewed
      </Button>
    )
  if (st === 'Valid')
    return (
      <Button
        size={size}
        variant="ghost"
        icon={RotateCcw}
        onClick={(e) => {
          e.stopPropagation()
          actions.renewCompliance(c.id)
        }}
      >
        Start renewal
      </Button>
    )
  return (
    <Button
      size={size}
      variant="primary"
      icon={RotateCcw}
      onClick={(e) => {
        e.stopPropagation()
        actions.renewCompliance(c.id)
      }}
    >
      {c.action && c.action !== 'None' ? c.action : 'Renew'}
    </Button>
  )
}

export function ExpirySlideOver({ item, onClose, wf }: { item: ExpiryRef | null; onClose: () => void; wf: DocWorkflow }) {
  const { state } = useStore()
  const navigate = useNavigate()
  if (!item) return null
  if (item.kind === 'compliance') {
    const c = state.compliance.find((x) => x.id === item.id)
    if (!c) return null
    const st = complianceStatus(c)
    const d = daysUntil(c.expiry)
    return (
      <SlideOver open onClose={onClose} title={c.item} subtitle={`${c.kind} · ${c.reference}`} footer={<ComplianceAction c={c} size="md" />}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill status={st} />
          <Pill tone={daysTone(d)}>{daysLabel(d)}</Pill>
        </div>
        <KeyValue
          rows={[
            { icon: CalendarClock, label: 'Expiry', value: fmtDate(c.expiry) },
            { label: 'Project', value: `${c.projectId} · ${projectName(state, c.projectId)}` },
            { label: 'Issuer', value: c.issuer },
            { label: 'Owner', value: c.owner },
            { label: 'Required action', value: c.action },
            { label: 'Last updated', value: fmtDate(c.updatedAt) },
          ]}
        />
        <div className="mt-5 rounded-[10px] border border-line bg-muted p-3 text-[13px] text-ink-2">
          {st === 'Renewal In Progress'
            ? 'Renewal is in progress. Mark it renewed when the new certificate is received; the expiry moves 12 months and related alerts resolve.'
            : st === 'Valid'
              ? 'This item is valid. The expiry engine raises an alert 30 days before expiry.'
              : 'Starting the renewal notifies the owner, acknowledges open alerts and tracks the item until the new certificate is uploaded.'}
        </div>
      </SlideOver>
    )
  }
  const doc = state.documents.find((x) => x.id === item.id)
  if (!doc) return null
  const d = doc.expiry ? daysUntil(doc.expiry) : null
  return (
    <SlideOver
      open
      onClose={onClose}
      title={doc.title}
      subtitle={`${doc.docType} · ${doc.id}`}
      footer={
        <>
          {doc.status !== 'Missing' && (
            <Button icon={Eye} onClick={() => wf.preview(doc.id)}>
              Preview
            </Button>
          )}
          {(doc.status === 'Expiring' || doc.status === 'Expired') && (
            <Button variant="primary" icon={CloudUpload} onClick={() => wf.renew(doc)}>
              Upload renewal
            </Button>
          )}
          {doc.status === 'Missing' && (
            <Button variant="primary" icon={CloudUpload} onClick={() => wf.upload(doc)}>
              Upload
            </Button>
          )}
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill status={doc.status} />
        {d !== null && <Pill tone={daysTone(d)}>{daysLabel(d)}</Pill>}
      </div>
      <KeyValue
        rows={[
          { icon: CalendarClock, label: 'Expiry', value: fmtDate(doc.expiry) },
          { icon: FileText, label: 'Revision', value: doc.revision },
          { label: 'Project', value: `${doc.projectId} · ${projectName(state, doc.projectId)}` },
          { label: 'Department', value: doc.department },
          { label: 'Owner', value: doc.owner },
          { label: 'Dossier category', value: doc.category },
        ]}
      />
      <button
        type="button"
        onClick={() => {
          onClose()
          navigate(`/handover/register?q=${encodeURIComponent(doc.id)}&project=${doc.projectId}`)
        }}
        className="mt-4 text-[13px] font-medium text-action hover:underline"
      >
        Open in document register
      </button>
    </SlideOver>
  )
}
