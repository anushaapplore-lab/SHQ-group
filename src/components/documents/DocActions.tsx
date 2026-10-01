import type { MouseEvent } from 'react'
import { Check, CloudUpload, Eye, RotateCcw, X } from 'lucide-react'
import type { DocumentRec } from '../../data/types'
import { Button } from '../ui'
import type { DocWorkflow } from './useDocWorkflow'

type WfLike = Omit<DocWorkflow, 'modals'>

/** Status-dependent document actions (register rows, preview footer). */
export function DocActions({ doc, wf, hidePreview, compact }: { doc: DocumentRec; wf: WfLike; hidePreview?: boolean; compact?: boolean }) {
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    fn()
  }
  const s = doc.status
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(s === 'Missing' || s === 'Draft' || s === 'Rejected') && (
        <Button size="sm" variant="primary" icon={CloudUpload} onClick={stop(() => wf.upload(doc))}>
          Upload
        </Button>
      )}
      {(s === 'Submitted' || s === 'Under Review') && (
        <>
          <Button size="sm" variant="success" icon={Check} onClick={stop(() => wf.approve(doc))}>
            Approve
          </Button>
          <Button size="sm" variant="danger" icon={X} onClick={stop(() => wf.reject(doc))}>
            Reject
          </Button>
          {!compact && (
            <Button size="sm" icon={RotateCcw} onClick={stop(() => wf.requestRevision(doc))}>
              Request revision
            </Button>
          )}
        </>
      )}
      {(s === 'Expiring' || s === 'Expired') && (
        <Button size="sm" variant="primary" icon={CloudUpload} onClick={stop(() => wf.renew(doc))}>
          Upload renewal
        </Button>
      )}
      {!hidePreview && s !== 'Missing' && (
        <Button size="sm" variant="ghost" icon={Eye} onClick={stop(() => wf.preview(doc.id))}>
          Preview
        </Button>
      )}
    </div>
  )
}
