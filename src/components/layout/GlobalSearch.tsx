import { useEffect, useMemo, useRef, useState } from 'react'
import { Boxes, Briefcase, ChevronDown, ClipboardCheck, Factory, FileText, FileWarning, GitBranch, Search, ShieldAlert, Truck, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n'
import { cx } from '../../lib/format'
import type { AppState } from '../../store/seed'
import { useStore } from '../../store/store'

interface Hit {
  type: string
  id: string
  title: string
  sub: string
  to: string
  icon: LucideIcon
  related?: boolean
}

const SCOPES = ['All', 'Project', 'NCR', 'PO', 'Employee', 'Document', 'Asset', 'Inspection', 'Vendor'] as const
type Scope = (typeof SCOPES)[number]

function buildIndex(s: AppState): Hit[] {
  const pn = (id: string) => s.projects.find((p) => p.id === id)?.shortName ?? id
  return [
    ...s.projects.map((p) => ({ type: 'Project', id: p.code, title: p.name, sub: `${p.code} · ${p.type} · ${p.location}`, to: `/projects/${p.id}`, icon: Briefcase })),
    ...s.ncrs.map((n) => ({ type: 'NCR', id: n.id, title: `${n.id} ${n.title}`, sub: `${pn(n.projectId)} · ${n.severity} · ${n.status}`, to: `/quality/ncrs/${n.id}`, icon: FileWarning })),
    ...s.capas.map((c) => ({ type: 'CAPA', id: c.id, title: `${c.id} for ${c.ncrId}`, sub: `${pn(c.projectId)} · ${c.status} · owner ${c.owner}`, to: `/quality/ncrs/${c.ncrId}`, icon: GitBranch })),
    ...s.pos.map((p) => ({ type: 'PO', id: p.id, title: `${p.id} ${p.material}`, sub: `${s.vendors.find((v) => v.id === p.vendorId)?.name} · ${p.status}`, to: `/procurement/pos/${p.id}`, icon: Truck })),
    ...s.employees.map((e) => ({ type: 'Employee', id: e.id, title: e.name, sub: `${e.id} · ${e.trade} · ${pn(e.projectId)}`, to: `/hr/workers/${e.id}`, icon: User })),
    ...s.documents.map((d) => ({ type: 'Document', id: d.id, title: d.title, sub: `${d.id} · ${d.status} · ${pn(d.projectId)}`, to: `/handover/register?q=${encodeURIComponent(d.id)}`, icon: FileText })),
    ...s.assets.map((a) => ({ type: 'Asset', id: a.id, title: a.name, sub: `${a.type} · ${a.location} · ${a.status}`, to: `/om/assets/${a.id}`, icon: Boxes })),
    ...s.inspections.map((i) => ({ type: 'Inspection', id: i.id, title: `${i.id} ${i.discipline} at ${i.location}`, sub: `${pn(i.projectId)} · ${i.reference} · ${i.status}`, to: `/quality/inspections/${i.id}`, icon: ClipboardCheck })),
    ...s.vendors.map((v) => ({ type: 'Vendor', id: v.id, title: v.name, sub: `${v.category} · ${v.rating}`, to: `/procurement/vendors/${v.id}`, icon: Factory })),
    ...s.observations.map((o) => ({ type: 'Observation', id: o.id, title: `${o.id} ${o.title}`, sub: `${pn(o.projectId)} · ${o.severity} · ${o.status}`, to: `/hse/observations/${o.id}`, icon: ShieldAlert })),
  ]
}

/** Records connected to an exact-match record (the "one record" principle). */
function related(s: AppState, q: string): Hit[] {
  const up = q.toUpperCase()
  const ncr = s.ncrs.find((n) => n.id === up)
  if (!ncr) return []
  const out: Hit[] = []
  const ins = s.inspections.find((i) => i.id === ncr.inspectionId)
  if (ins) out.push({ type: 'Inspection', id: ins.id, title: `${ins.id} ${ins.discipline} at ${ins.location}`, sub: `Source of ${ncr.id} · ${ins.status}`, to: `/quality/inspections/${ins.id}`, icon: ClipboardCheck, related: true })
  const capa = s.capas.find((c) => c.ncrId === ncr.id)
  if (capa) out.push({ type: 'CAPA', id: capa.id, title: `${capa.id} for ${ncr.id}`, sub: `${capa.status} · due ${capa.dueDate}`, to: `/quality/ncrs/${ncr.id}`, icon: GitBranch, related: true })
  else out.push({ type: 'CAPA', id: `${ncr.id}-capa`, title: 'CAPA not yet submitted', sub: `Created when ${ncr.id} reaches CAPA Submitted`, to: `/quality/ncrs/${ncr.id}`, icon: GitBranch, related: true })
  const p = s.projects.find((x) => x.id === ncr.projectId)
  if (p) out.push({ type: 'Project', id: p.code, title: p.name, sub: `${p.code} · project of ${ncr.id}`, to: `/projects/${p.id}`, icon: Briefcase, related: true })
  const docs = s.documents.filter((d) => ins && (d.linkedTo.includes(ins.id) || d.linkedTo.includes(ins.reference)))
  docs.forEach((d) => out.push({ type: 'Document', id: d.id, title: d.title, sub: `${d.id} · ${d.status}`, to: `/handover/register?q=${encodeURIComponent(d.id)}`, icon: FileText, related: true }))
  if (ins?.reference === 'W-00428') out.push({ type: 'Record 360°', id: 'W-00428', title: 'Weld W-00428: full connected record', sub: 'Inspection → NCR → CAPA → documents → vendor → handover', to: '/record/W-00428', icon: GitBranch, related: true })
  return out
}

export function GlobalSearch({ className }: { className?: string }) {
  const { state } = useStore()
  const t = useT()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('All')
  const [open, setOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const index = useMemo(() => buildIndex(state), [state])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const direct = index.filter((h) => (scope === 'All' || h.type === scope) && (h.title.toLowerCase().includes(term) || h.id.toLowerCase().includes(term) || h.sub.toLowerCase().includes(term))).slice(0, 12)
    const rel = scope === 'All' || scope === 'NCR' ? related(state, term) : []
    const seen = new Set(direct.map((d) => d.type + d.id))
    return [...direct, ...rel.filter((r) => !seen.has(r.type + r.id))]
  }, [q, scope, index, state])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setScopeOpen(false)
      }
    }
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('mousedown', h)
    window.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      window.removeEventListener('keydown', k)
    }
  }, [])

  useEffect(() => setCursor(0), [q, scope])

  const go = (h: Hit) => {
    navigate(h.to)
    setOpen(false)
    setQ('')
  }

  return (
    <div ref={ref} className={cx('relative', className)}>
      <div className="flex h-9 items-center rounded-[6px] bg-shell-raised text-white">
        <button type="button" onClick={() => setScopeOpen((v) => !v)} className="flex h-full shrink-0 items-center gap-1 border-e border-white/10 px-3 text-[12px] text-white/85 hover:text-white" aria-label="Search scope">
          {scope}
          <ChevronDown className="size-3.5" />
        </button>
        <Search className="ms-3 size-4 shrink-0 text-white/60" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setCursor((c) => Math.min(results.length - 1, c + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((c) => Math.max(0, c - 1))
            } else if (e.key === 'Enter' && results[cursor]) {
              go(results[cursor])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder={t('Search projects, NCRs, POs, people…')}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-[13px] text-white outline-none placeholder:text-white/50"
          aria-label="Global search"
        />
        <kbd className="me-2 hidden rounded border border-white/15 px-1.5 text-[10px] text-white/50 xl:block">Ctrl K</kbd>
      </div>
      {scopeOpen && (
        <div className="anim-pop absolute start-0 top-11 z-50 w-44 rounded-[8px] border border-line bg-surface py-1 text-ink shadow-lg">
          {SCOPES.map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => {
                setScope(sc)
                setScopeOpen(false)
                inputRef.current?.focus()
              }}
              className={cx('block w-full px-3 py-1.5 text-start text-[13px] hover:bg-muted', sc === scope && 'font-semibold')}
            >
              {sc}
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && (
        <div className="anim-pop absolute inset-x-0 top-11 z-50 max-h-[70vh] overflow-y-auto rounded-[10px] border border-line bg-surface py-1.5 text-ink shadow-xl">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-ink-2">
              No records match “{q}”. Try <button type="button" className="font-medium text-action" onClick={() => setQ('NCR-00218')}>NCR-00218</button>, <button type="button" className="font-medium text-action" onClick={() => setQ('PO-450021')}>PO-450021</button> or <button type="button" className="font-medium text-action" onClick={() => setQ('CP-042')}>CP-042</button>.
            </div>
          ) : (
            results.map((h, i) => {
              const showRelHeader = h.related && (i === 0 || !results[i - 1].related)
              return (
                <div key={h.type + h.id + i}>
                  {showRelHeader && <div className="caps mt-1 border-t border-line px-4 pt-2.5 pb-1 text-[10px] text-ink-3">Connected records</div>}
                  <button type="button" onMouseEnter={() => setCursor(i)} onClick={() => go(h)} className={cx('flex w-full items-center gap-3 px-4 py-2 text-start', i === cursor && 'bg-muted')}>
                    <h.icon className="size-4 shrink-0 text-ink-2" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{h.title}</div>
                      <div className="truncate text-[12px] text-ink-3">{h.sub}</div>
                    </div>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-2">{h.type}</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
