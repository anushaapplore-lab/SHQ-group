import { useEffect, useState } from 'react'
import { Check, ClipboardCheck, ExternalLink, MessageSquare, Paperclip, Undo2, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Approval } from '../../data/types'
import { cx, fmtDate, fmtShort } from '../../lib/format'
import { myApprovals, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { Avatar, Button, Card, DemoTag, EmptyState, FileTile, KeyValue, Modal, PageHeader, Pill, SlideOver, StatusPill, Tabs, Textarea } from '../../components/ui'

type TabId = 'mine' | 'pending' | 'approved' | 'rejected'

function useIsXl() {
  const q = '(min-width: 1280px)'
  const [xl, setXl] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const h = () => setXl(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return xl
}

function linkFor(linkId?: string): { to: string; label: string } | null {
  if (!linkId) return null
  if (linkId.startsWith('NCR')) return { to: `/quality/ncrs/${linkId}`, label: `Open ${linkId}` }
  if (linkId.startsWith('PO')) return { to: `/procurement/pos/${linkId}`, label: `Open ${linkId}` }
  if (linkId.startsWith('OBS')) return { to: `/hse/observations/${linkId}`, label: `Open ${linkId}` }
  if (linkId.startsWith('DOC')) return { to: `/handover/register?q=${encodeURIComponent(linkId)}`, label: `Open ${linkId}` }
  return { to: `/record/${linkId}`, label: `Open ${linkId}` }
}

function fileType(name: string): 'pdf' | 'sheet' | 'doc' | 'slides' {
  if (name.endsWith('.xlsx')) return 'sheet'
  if (name.endsWith('.docx')) return 'doc'
  if (name.endsWith('.pptx')) return 'slides'
  return 'pdf'
}

export function ApprovalsPage() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const isXl = useIsXl()
  const [tab, setTab] = useState<TabId>('mine')

  const mine = myApprovals(state, state.role)
  const pending = state.approvals.filter((a) => a.status === 'Pending' || a.status === 'Changes Requested')
  const approved = state.approvals.filter((a) => a.status === 'Approved')
  const rejected = state.approvals.filter((a) => a.status === 'Rejected')
  const lists: Record<TabId, Approval[]> = { mine, pending, approved, rejected }
  const rows = lists[tab]

  const paramId = params.get('id')
  const selected = state.approvals.find((a) => a.id === paramId) ?? (isXl ? rows[0] : undefined) ?? null
  const select = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('id', id)
    else next.delete('id')
    setParams(next, { replace: true })
  }

  const empty: Record<TabId, string> = {
    mine: 'No approvals waiting',
    pending: 'No approvals waiting',
    approved: 'No approved items yet',
    rejected: 'No rejected items',
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Approval Centre"
        count={`${mine.length} awaiting you`}
        subtitle="One inbox for NCR CAPA, vendor changes, purchase requests, document approvals, HSE actions and variations."
        crumbs={[{ label: 'Command', to: '/command' }, { label: 'Approvals' }]}
      />

      <Tabs<TabId>
        tabs={[
          { id: 'mine', label: 'My Approvals', count: mine.length },
          { id: 'pending', label: 'Pending', count: pending.length },
          { id: 'approved', label: 'Approved', count: approved.length },
          { id: 'rejected', label: 'Rejected', count: rejected.length },
        ]}
        value={tab}
        onChange={(v) => {
          setTab(v)
          select(null)
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="min-w-0">
          {rows.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title={empty[tab]} body={tab === 'mine' ? `Nothing is assigned to ${state.role} right now.` : 'Items appear here as decisions are made.'} />
          ) : (
            <Card bodyClassName="divide-y divide-line">
              {rows.map((a) => {
                const active = selected?.id === a.id
                return (
                  <button key={a.id} type="button" onClick={() => select(a.id)} className={cx('flex w-full items-start gap-3 border-s-[3px] px-4 py-3.5 text-start hover:bg-[#f9fafb]', active && isXl ? 'border-s-shell bg-navactive' : 'border-s-transparent')}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-3">
                        <span className="font-medium text-ink-2">{a.type}</span>
                        <span>{a.id}</span>
                      </div>
                      <p className="mt-1 text-[14px] font-medium text-ink">{a.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-3">
                        {projectName(state, a.projectId)} · {a.requestedBy} · {fmtShort(a.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {a.value && <span className="tabular text-[13px] font-medium text-ink">{a.value}</span>}
                      <StatusPill status={a.status} />
                    </div>
                  </button>
                )
              })}
            </Card>
          )}
        </div>

        {isXl && (
          <div className="min-w-0">
            {selected ? (
              <Card bodyClassName="p-0">
                <ApprovalDetail key={selected.id} a={selected} />
              </Card>
            ) : (
              <EmptyState icon={ClipboardCheck} title="Select an approval" body="Choose an item on the left to review its summary, impact and attachments." />
            )}
          </div>
        )}
      </div>

      {!isXl && (
        <SlideOver open={!!selected} onClose={() => select(null)} title={selected?.title ?? ''} subtitle={selected ? `${selected.type} · ${selected.id}` : undefined} width={600}>
          {selected && <ApprovalDetail key={selected.id} a={selected} compact />}
        </SlideOver>
      )}
    </div>
  )
}

function ApprovalDetail({ a, compact }: { a: Approval; compact?: boolean }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const link = linkFor(a.linkId)
  const canDecide = a.status === 'Pending'

  const decide = (d: Approval['status']) => {
    actions.decideApproval(a.id, d, comment.trim())
    setComment('')
  }

  return (
    <div className={cx(!compact && 'p-5')}>
      {!compact && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div className="min-w-0">
            <p className="text-[12px] text-ink-3">
              {a.type} · {a.id}
            </p>
            <h2 className="mt-1 text-[19px] font-semibold text-ink">{a.title}</h2>
          </div>
          <StatusPill status={a.status} />
        </div>
      )}
      {compact && (
        <div className="mb-4">
          <StatusPill status={a.status} />
        </div>
      )}

      <KeyValue
        rows={[
          { label: 'Project', value: projectName(state, a.projectId) },
          {
            label: 'Requested by',
            value: (
              <span className="inline-flex items-center gap-2">
                <Avatar name={a.requestedBy} size={22} />
                {a.requestedBy}
              </span>
            ),
          },
          { label: 'Approver role', value: a.approver },
          { label: 'Value', value: a.value ?? 'No direct value' },
          { label: 'Submitted', value: fmtDate(a.createdAt) },
          ...(a.decidedAt ? [{ label: 'Decided', value: `${fmtDate(a.decidedAt)}${a.comment ? ` · “${a.comment}”` : ''}` }] : []),
        ]}
      />

      <div className="mt-5 space-y-4">
        <section>
          <p className="caps text-[12px] text-ink-3">Summary</p>
          <p className="mt-1 text-[14px] text-ink">{a.summary}</p>
        </section>
        <section>
          <p className="caps text-[12px] text-ink-3">Impact</p>
          <p className="mt-1 text-[14px] text-ink">{a.impact}</p>
        </section>
        <section>
          <p className="caps mb-2 flex items-center gap-1.5 text-[12px] text-ink-3">
            <Paperclip className="size-3.5" strokeWidth={1.5} /> Attachments ({a.attachments.length})
          </p>
          {a.attachments.length === 0 ? (
            <p className="text-[13px] text-ink-3">No attachments.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {a.attachments.map((f) => (
                <FileTile key={f} name={f} type={fileType(f)} onClick={() => setPreview(f)} />
              ))}
            </div>
          )}
        </section>
        <section className="rounded-[10px] border border-line bg-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="caps text-[12px] text-ink-3">Recommendation</p>
            <DemoTag>Demo Recommendation</DemoTag>
          </div>
          <p className="mt-1.5 text-[14px] text-ink">{a.recommendation}</p>
        </section>
        {link && (
          <Button icon={ExternalLink} size="sm" onClick={() => navigate(link.to)}>
            {link.label}
          </Button>
        )}
      </div>

      <div className="mt-6 border-t border-line pt-4">
        {canDecide ? (
          <>
            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
              <MessageSquare className="size-3.5" strokeWidth={1.5} /> Comment
            </label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note for the requester (optional)" />
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button icon={Undo2} onClick={() => decide('Changes Requested')}>
                Request Changes
              </Button>
              <Button variant="danger" icon={X} onClick={() => decide('Rejected')}>
                Reject
              </Button>
              <Button variant="success" icon={Check} onClick={() => decide('Approved')}>
                Approve
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
            <Pill tone={a.status === 'Approved' ? 'ok' : a.status === 'Rejected' ? 'crit' : 'warn'} dot>
              {a.status}
            </Pill>
            {a.status === 'Changes Requested' ? 'Returned to requester. Awaiting resubmission.' : `Decision recorded${a.decidedAt ? ` on ${fmtDate(a.decidedAt)}` : ''}. Activity logged and requester notified.`}
          </div>
        )}
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ?? ''}
        subtitle={`${a.id} · ${projectName(state, a.projectId)}`}
        width={640}
        footer={
          <>
            <Button onClick={() => actions.toast({ title: 'Download prepared', body: `${preview} (demo file)`, tone: 'info' })}>Download</Button>
            <Button variant="primary" onClick={() => setPreview(null)}>
              Close
            </Button>
          </>
        }
      >
        {preview && <MockDocument name={preview} a={a} />}
      </Modal>
    </div>
  )
}

function MockDocument({ name, a }: { name: string; a: Approval }) {
  const { state } = useStore()
  const sheet = fileType(name) === 'sheet'
  return (
    <div className="rounded-[8px] bg-muted p-4">
      <div className="mx-auto max-w-[480px] rounded-[4px] bg-surface p-6 shadow-[0_0_0_1px_var(--border)]">
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-3">SHQ GROUP · {projectName(state, a.projectId).toUpperCase()}</p>
            <p className="mt-1 text-[15px] font-semibold text-ink">{name.replace(/\.[a-z]+$/, '')}</p>
          </div>
          <DemoTag>Illustrative Data</DemoTag>
        </div>
        {sheet ? (
          <table className="mt-4 w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-ink-3">
                <th className="py-1.5 text-start font-medium">Item</th>
                <th className="py-1.5 text-end font-medium">Option A</th>
                <th className="py-1.5 text-end font-medium">Option B</th>
              </tr>
            </thead>
            <tbody className="text-ink">
              {[
                ['Unit rate', 'SAR 4,920', 'SAR 4,860'],
                ['Delivery lead time', '21 days', '12 days'],
                ['Quality rating', '88%', '93%'],
                ['Schedule recovery', '1 day', '4 days'],
                ['Total', a.value ?? '—', a.value ?? '—'],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-line last:border-0">
                  <td className="py-1.5">{r[0]}</td>
                  <td className="tabular py-1.5 text-end">{r[1]}</td>
                  <td className="tabular py-1.5 text-end">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-4 space-y-3 text-[12px] leading-relaxed text-ink-2">
            <p>
              <span className="font-semibold text-ink">Subject:</span> {a.title}
            </p>
            <p>{a.summary}</p>
            <p>
              <span className="font-semibold text-ink">Impact:</span> {a.impact}
            </p>
            <div className="space-y-1.5 pt-2">
              <div className="h-1.5 w-full rounded bg-[#eef0f3]" />
              <div className="h-1.5 w-5/6 rounded bg-[#eef0f3]" />
              <div className="h-1.5 w-2/3 rounded bg-[#eef0f3]" />
            </div>
            <p className="pt-2 text-[11px] text-ink-3">Prepared by {a.requestedBy} · {fmtDate(a.createdAt)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
