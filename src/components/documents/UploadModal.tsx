import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { CloudUpload, FileText } from 'lucide-react'
import { useStore } from '../../store/store'
import type { Department, DocumentRec } from '../../data/types'
import { Button, DemoTag, Field, Input, Modal, ProgressBar, Select, StatusPill, Textarea } from '../ui'
import { MDR_PROJECTS, fileTypeFor } from './docShared'
import { cx } from '../../lib/format'

export type UploadTarget =
  | { mode: 'existing'; docId: string }
  | { mode: 'renewal'; docId: string }
  | { mode: 'new'; projectId?: string; category?: string }

const CATEGORIES = [
  'Material Certificates',
  'Welding Records',
  'NDT Reports',
  'Hydrotest Reports',
  'Inspection Records',
  'Calibration Certificates',
  'Equipment Records',
  'As-Built Drawings',
  'Commissioning Records',
  'Punch Closure',
  'Client Approvals',
]
const DEPARTMENTS: Department[] = ['QA/QC', 'Handover', 'HSE', 'Projects', 'Procurement', 'HR', 'O&M', 'Compliance']
const DISCIPLINES = ['Welding', 'Material', 'Hydrotest', 'Civil', 'Mechanical', 'Electrical', 'Lifting', 'Quality', 'HSE', 'Planning']

function nextRev(r: string): string {
  if (r === '-' || !r) return 'A'
  const n = parseInt(r, 10)
  if (!Number.isNaN(n)) return String(n + 1)
  return String.fromCharCode(r.charCodeAt(0) + 1)
}

export function UploadModal({ target, onClose, onDone }: { target: UploadTarget | null; onClose: () => void; onDone?: (doc: { id: string; projectId: string }) => void }) {
  const { state, actions } = useStore()
  const doc: DocumentRec | undefined = target && target.mode !== 'new' ? state.documents.find((d) => d.id === target.docId) : undefined
  const [fileName, setFileName] = useState('')
  const [revision, setRevision] = useState('A')
  const [comment, setComment] = useState('')
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(0)
  // new-document fields
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('NPE')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [docType, setDocType] = useState('Test Report')
  const [discipline, setDiscipline] = useState('Welding')
  const [department, setDepartment] = useState<Department>('QA/QC')
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)

  const key = target ? `${target.mode}-${target.mode === 'new' ? '' : target.docId}` : ''
  useEffect(() => {
    if (!target) return
    setBusy(0)
    setComment('')
    setDrag(false)
    if (target.mode === 'new') {
      const pf = state.projectFilter !== 'all' ? state.projectFilter : 'NPE'
      setProjectId(target.projectId ?? pf)
      setCategory(target.category ?? CATEGORIES[0])
      setTitle('')
      setFileName('')
      setRevision('A')
    } else if (doc) {
      const rev = target.mode === 'renewal' ? nextRev(doc.revision) : doc.revision === '-' ? 'A' : nextRev(doc.revision)
      setRevision(rev)
      setFileName(`${doc.id}_Rev${rev}.${doc.fileType === 'sheet' ? 'xlsx' : doc.fileType === 'doc' ? 'docx' : doc.fileType === 'slides' ? 'pptx' : doc.fileType === 'photo' ? 'jpg' : 'pdf'}`)
    }
  }, [key])
  useEffect(() => () => window.clearInterval(timer.current), [])

  if (!target) return null
  const isNew = target.mode === 'new'
  const valid = fileName.trim().length > 0 && (!isNew || title.trim().length > 2)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files?.[0]
    setFileName(f ? f.name : `${isNew ? 'Upload' : doc?.id}_dropped.pdf`)
  }

  const submit = () => {
    if (!valid || busy) return
    setBusy(8)
    timer.current = window.setInterval(() => {
      setBusy((b) => {
        if (b >= 100) return b
        return Math.min(100, b + 23)
      })
    }, 120)
    window.setTimeout(() => {
      window.clearInterval(timer.current)
      if (isNew) {
        const id = actions.addDocument({
          projectId,
          title: title.trim(),
          docType,
          category,
          discipline,
          department,
          fileType: fileTypeFor(fileName),
        })
        onDone?.({ id, projectId })
      } else if (doc) {
        if (target.mode === 'renewal') actions.setDocStatus(doc.id, 'Approved', comment || `Renewal uploaded: ${fileName}`)
        else actions.setDocStatus(doc.id, 'Under Review', comment || `Uploaded ${fileName}, rev ${revision}`)
        onDone?.({ id: doc.id, projectId: doc.projectId })
      }
      onClose()
    }, 650)
  }

  const heading = isNew ? 'Upload document' : target.mode === 'renewal' ? 'Upload renewal' : 'Upload document'
  return (
    <Modal
      open
      onClose={onClose}
      title={heading}
      subtitle={doc ? `${doc.id} · ${doc.title}` : 'New document routed to the review workflow'}
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon={CloudUpload} disabled={!valid || busy > 0} onClick={submit}>
            {target.mode === 'renewal' ? 'Upload renewal' : 'Upload & submit'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {doc && (
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
            Current status <StatusPill status={doc.status} />
            <span className="text-ink-3">· Owner {doc.owner}</span>
          </div>
        )}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className={cx(
            'flex cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed px-4 py-7 text-center transition-colors',
            drag ? 'border-action bg-info-bg' : 'border-line-strong bg-[#fbfbfc] hover:bg-muted',
          )}
        >
          <CloudUpload className="mb-2 size-7 text-ink-2" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-ink">Drag and drop a file here, or click to browse</p>
          <p className="mt-1 text-[12px] text-ink-3">PDF, DOCX, XLSX, JPG up to 50 MB. The file is not stored; upload is simulated.</p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setFileName(f.name)
            }}
          />
        </div>
        {fileName && (
          <div className="flex items-center gap-3 rounded-[8px] border border-line bg-muted px-3 py-2.5">
            <FileText className="size-5 shrink-0 text-ink-2" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-ink">{fileName}</div>
              {busy > 0 ? <ProgressBar value={busy} className="mt-1.5" /> : <div className="text-[11px] text-ink-3">Ready to upload</div>}
            </div>
          </div>
        )}
        {isNew && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Document title" className="sm:col-span-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hydrotest report TS-06" />
            </Field>
            <Field label="Project">
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={state.projects.filter((p) => p.type === 'Construction' || MDR_PROJECTS.includes(p.id)).map((p) => ({ value: p.id, label: `${p.id} · ${p.shortName}` }))}
              />
            </Field>
            <Field label="Dossier category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORIES} />
            </Field>
            <Field label="Document type">
              <Input value={docType} onChange={(e) => setDocType(e.target.value)} />
            </Field>
            <Field label="Discipline">
              <Select value={discipline} onChange={(e) => setDiscipline(e.target.value)} options={DISCIPLINES} />
            </Field>
            <Field label="Department">
              <Select value={department} onChange={(e) => setDepartment(e.target.value as Department)} options={DEPARTMENTS} />
            </Field>
            <Field label="File name">
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Choose or type a file name" />
            </Field>
          </div>
        )}
        {!isNew && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="File name">
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
            </Field>
            <Field label="Revision">
              <Input value={revision} onChange={(e) => setRevision(e.target.value)} />
            </Field>
          </div>
        )}
        <Field label="Transmittal comment (optional)">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={target.mode === 'renewal' ? 'e.g. Renewed by third-party inspection body' : 'e.g. Issued for review, addresses client comments'} />
        </Field>
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
          <DemoTag>Simulated upload</DemoTag>
          {target.mode === 'renewal' ? 'Renewal is approved on upload and the expiry date is extended 12 months.' : 'Document is routed to Under Review and the dossier count updates live.'}
        </div>
      </div>
    </Modal>
  )
}
