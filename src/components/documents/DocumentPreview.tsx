import { useNavigate } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import { useStore } from '../../store/store'
import { projectName } from '../../store/selectors'
import type { DocumentRec } from '../../data/types'
import { daysUntil, fmtDate } from '../../lib/format'
import { DemoTag, KeyValue, Modal, Pill, SitePhoto, StatusPill } from '../ui'
import { daysLabel, expiryTone, linkFor, linkLabel } from './docShared'
import type { DocWorkflow } from './useDocWorkflow'
import { DocActions } from './DocActions'

function MockPage({ doc }: { doc: DocumentRec }) {
  const approved = doc.status === 'Approved' || doc.status === 'Expiring'
  const rejected = doc.status === 'Rejected'
  return (
    <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[4px] bg-surface p-5 shadow-[0_0_0_1px_var(--border)]">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <div className="caps text-[9px] text-ink-3">SHQ Group · Controlled document</div>
          <div className="mt-1 text-[12px] leading-snug font-semibold text-ink">{doc.title}</div>
        </div>
        <div className="shrink-0 rounded border border-line px-1.5 py-1 text-center text-[9px] text-ink-2">
          <div>REV</div>
          <div className="text-[13px] font-semibold text-ink">{doc.revision}</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-ink-2">
        <span>Doc no. {doc.id}</span>
        <span>Project {doc.projectId}</span>
        <span>Discipline {doc.discipline}</span>
        <span>Type {doc.docType}</span>
      </div>
      {doc.fileType === 'photo' ? (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <SitePhoto key={s} seed={s + 2} className="aspect-[4/3] w-full rounded-[3px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-11/12 rounded bg-[#eef0f3]" />
            <div className="h-1.5 w-full rounded bg-[#eef0f3]" />
            <div className="h-1.5 w-4/5 rounded bg-[#eef0f3]" />
          </div>
          <div className="mt-3 overflow-hidden rounded-[3px] border border-line">
            {[0, 1, 2, 3, 4].map((r) => (
              <div key={r} className={`grid grid-cols-4 gap-1 px-1.5 py-1 ${r === 0 ? 'bg-muted' : 'border-t border-line'}`}>
                {[0, 1, 2, 3].map((c) => (
                  <div key={c} className={`h-1.5 rounded ${r === 0 ? 'bg-[#d9dce2]' : 'bg-[#eef0f3]'}`} style={{ width: `${55 + ((r * 7 + c * 13) % 40)}%` }} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded bg-[#eef0f3]" />
            <div className="h-1.5 w-2/3 rounded bg-[#eef0f3]" />
          </div>
        </>
      )}
      <div className="mt-4 flex items-end justify-between text-[9px] text-ink-3">
        <div>
          <div>Prepared: {doc.owner}</div>
          <div>Submitted: {fmtDate(doc.submitted)}</div>
        </div>
        {approved && (
          <div className="-rotate-6 rounded border-2 border-ok px-2 py-1 text-center text-ok">
            <div className="text-[10px] font-bold tracking-wider">APPROVED</div>
            <div className="text-[8px]">{fmtDate(doc.approved)}</div>
          </div>
        )}
        {rejected && (
          <div className="-rotate-6 rounded border-2 border-crit px-2 py-1 text-center text-crit">
            <div className="text-[10px] font-bold tracking-wider">REJECTED</div>
            <div className="text-[8px]">Returned to owner</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function DocumentPreview({ docId, onClose, wf }: { docId: string | null; onClose: () => void; wf: DocWorkflow }) {
  const { state } = useStore()
  const navigate = useNavigate()
  if (!docId) return null
  const doc = state.documents.find((d) => d.id === docId)
  if (!doc) return null
  const et = expiryTone(doc.expiry)
  return (
    <Modal
      open
      onClose={onClose}
      width={880}
      title={doc.title}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {doc.id} · Rev {doc.revision} <StatusPill status={doc.status} />
        </span>
      }
      footer={<DocActions doc={doc} wf={wf} hidePreview />}
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[10px] bg-muted p-4">
          <MockPage doc={doc} />
          <div className="mt-3 flex justify-center">
            <DemoTag>Illustrative preview</DemoTag>
          </div>
        </div>
        <div className="min-w-0">
          <KeyValue
            rows={[
              { label: 'Project', value: `${doc.projectId} · ${projectName(state, doc.projectId)}` },
              { label: 'Document type', value: doc.docType },
              { label: 'Dossier category', value: doc.category },
              { label: 'Discipline', value: doc.discipline },
              { label: 'Department', value: doc.department },
              { label: 'Owner', value: doc.owner },
              { label: 'Submitted', value: fmtDate(doc.submitted) },
              { label: 'Approved', value: fmtDate(doc.approved) },
              {
                label: 'Expiry',
                value: doc.expiry ? (
                  <span className="flex flex-wrap items-center gap-2">
                    {fmtDate(doc.expiry)}
                    {et && <Pill tone={et}>{daysLabel(daysUntil(doc.expiry))}</Pill>}
                  </span>
                ) : (
                  'No expiry'
                ),
              },
              ...(doc.note ? [{ label: 'Latest note', value: doc.note }] : []),
            ]}
          />
          <div className="mt-4">
            <div className="caps mb-2 flex items-center gap-1.5 text-[11px] text-ink-3">
              <Link2 className="size-3.5" strokeWidth={1.5} /> Linked records
            </div>
            {doc.linkedTo.length === 0 ? (
              <p className="text-[13px] text-ink-3">No linked records. Documents link to inspections, NCRs, POs and weld records when raised from those workflows.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {doc.linkedTo.map((l) => {
                  const to = linkFor(l)
                  return (
                    <button
                      key={l}
                      type="button"
                      disabled={!to}
                      onClick={() => {
                        if (!to) return
                        onClose()
                        navigate(to)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink hover:border-action hover:text-action disabled:cursor-default"
                    >
                      <span className="text-ink-3">{linkLabel(l)}</span>
                      <span className="font-medium">{l}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(`/handover/register?category=${encodeURIComponent(doc.category)}&project=${doc.projectId}`)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink hover:border-action hover:text-action"
                >
                  <span className="text-ink-3">Dossier</span>
                  <span className="font-medium">{doc.category}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
