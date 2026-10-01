import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../../store/store'
import { mdrSummary } from '../../store/selectors'
import type { DocumentRec } from '../../data/types'
import { Button, Field, Modal, Textarea } from '../ui'
import { UploadModal } from './UploadModal'
import type { UploadTarget } from './UploadModal'
import { DocumentPreview } from './DocumentPreview'

export interface DocWorkflow {
  preview: (id: string) => void
  upload: (doc: DocumentRec) => void
  renew: (doc: DocumentRec) => void
  uploadNew: (opts?: { projectId?: string; category?: string }) => void
  approve: (doc: DocumentRec) => void
  reject: (doc: DocumentRec) => void
  requestRevision: (doc: DocumentRec) => void
  modals: ReactNode
}

/** Shared document workflow: preview, simulated upload, approve/reject/revise, with live dossier-impact toasts. */
export function useDocWorkflow(): DocWorkflow {
  const { state, actions } = useStore()
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [upload, setUpload] = useState<UploadTarget | null>(null)
  const [revDoc, setRevDoc] = useState<DocumentRec | null>(null)
  const [revNote, setRevNote] = useState('')

  const impact = useCallback(
    (projectId: string) => {
      const before = mdrSummary(stateRef.current.mdr[projectId]).pct
      if (!stateRef.current.mdr[projectId]) return
      window.setTimeout(() => {
        const after = mdrSummary(stateRef.current.mdr[projectId]).pct
        if (after === before) return
        actions.toast({
          title: `Dossier impact: ${projectId} now ${after.toFixed(1)}%`,
          body: `Handover completeness moved from ${before.toFixed(1)}% to ${after.toFixed(1)}%.`,
          tone: after > before ? 'success' : 'info',
        })
      }, 80)
    },
    [actions],
  )

  const wfBase = useMemo(
    () => ({
      preview: (id: string) => setPreviewId(id),
      upload: (doc: DocumentRec) => setUpload({ mode: 'existing', docId: doc.id }),
      renew: (doc: DocumentRec) => setUpload({ mode: 'renewal', docId: doc.id }),
      uploadNew: (opts?: { projectId?: string; category?: string }) => setUpload({ mode: 'new', ...opts }),
      approve: (doc: DocumentRec) => {
        impact(doc.projectId)
        actions.setDocStatus(doc.id, 'Approved')
      },
      reject: (doc: DocumentRec) => {
        impact(doc.projectId)
        actions.setDocStatus(doc.id, 'Rejected', 'Rejected at review: does not meet ITP acceptance criteria')
      },
      requestRevision: (doc: DocumentRec) => {
        setRevNote('Please revise to address reviewer comments and resubmit.')
        setRevDoc(doc)
      },
    }),
    [actions, impact],
  )

  const modals = (
    <>
      <DocumentPreview docId={previewId} onClose={() => setPreviewId(null)} wf={{ ...wfBase, modals: null }} />
      <UploadModal target={upload} onClose={() => setUpload(null)} onDone={({ projectId }) => impact(projectId)} />
      <Modal
        open={!!revDoc}
        onClose={() => setRevDoc(null)}
        title="Request revision"
        subtitle={revDoc ? `${revDoc.id} · ${revDoc.title}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={revNote.trim().length < 3}
              onClick={() => {
                if (!revDoc) return
                impact(revDoc.projectId)
                actions.setDocStatus(revDoc.id, 'Draft', revNote.trim())
                setRevDoc(null)
              }}
            >
              Send to owner
            </Button>
          </>
        }
      >
        <Field label="Revision note to document owner" hint={revDoc ? `Notified: ${revDoc.owner}` : undefined}>
          <Textarea value={revNote} onChange={(e) => setRevNote(e.target.value)} />
        </Field>
      </Modal>
    </>
  )

  return { ...wfBase, modals }
}
