import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Compass,
  Info,
  Languages,
  LogOut,
  Menu,
  RotateCcw,
  ShieldOff,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Role } from '../../data/types'
import { useT } from '../../i18n'
import { cx } from '../../lib/format'
import { NAV, canAccess, navForRole } from '../../nav'
import type { CountKey } from '../../nav'
import { ROLES, roleProfile } from '../../store/roles'
import type { AppState } from '../../store/seed'
import { criticalOpen, expiringCount, myApprovals, openNcrs, openAlerts, openObservations, projectById, poVariance } from '../../store/selectors'
import { useStore } from '../../store/store'
import { rfis } from '../../data/quality'
import { AIPanel } from './AIPanel'
import { GlobalSearch } from './GlobalSearch'
import { Avatar, Button, EmptyState, Modal, RagBadge } from '../ui'

function navCounts(s: AppState): Record<CountKey, number> {
  return {
    criticalAlerts: criticalOpen(s).length,
    pendingApprovals: myApprovals(s, s.role).length,
    openNcrs: openNcrs(s).length,
    openObs: openObservations(s).length,
    missingDocs: s.documents.filter((d) => d.status === 'Missing').length,
    expiring: expiringCount(s),
    attentionPOs: s.pos.filter((p) => p.daysLate > 0 || poVariance(p) > 5).length,
    fieldQueue: s.field.queue.length,
    projects: s.projects.length,
    openRfis: rfis.filter((r) => r.status !== 'Closed').length,
    openWOs: s.workOrders.filter((w) => w.status !== 'Completed').length,
  }
}

/* ---------- Sidebar ---------- */

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, actions } = useStore()
  const t = useT()
  const location = useLocation()
  const navigate = useNavigate()
  const sections = navForRole(state.role)
  const counts = navCounts(state)
  const activeSection = sections.find((sec) => sec.items.some((it) => location.pathname === it.path || location.pathname.startsWith(it.path + '/')))?.id
  const [openIds, setOpenIds] = useState<string[]>(() => [sections[0]?.id, activeSection].filter(Boolean) as string[])

  useEffect(() => {
    if (activeSection) setOpenIds((ids) => (ids.includes(activeSection) ? ids : [...ids, activeSection]))
  }, [activeSection])

  const ctxProject = projectById(state, state.projectFilter === 'all' ? 'NPE' : state.projectFilter)

  return (
    <div className="flex h-full flex-col">
      {ctxProject && (
        <div className="px-3 pt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              navigate(`/projects/${ctxProject.id}`)
              onNavigate?.()
            }}
            className="w-full rounded-[10px] bg-muted p-3 text-start hover:bg-[#efefef]"
          >
            <div className="caps text-[10px] text-ink-3">{state.projectFilter === 'all' ? 'Focus project' : 'Selected project'}</div>
            <div className="mt-1 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-ink">{ctxProject.name}</div>
                <div className="truncate text-[12px] text-ink-2">
                  {ctxProject.type} · {ctxProject.code}
                </div>
                <div className="truncate text-[12px] text-ink-3">{ctxProject.location}</div>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-ink-3 rtl:rotate-180" />
            </div>
            <div className="mt-2">
              <RagBadge rag={ctxProject.rag} />
            </div>
          </button>
        </div>
      )}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {sections.map((sec) => {
          const open = openIds.includes(sec.id)
          return (
            <div key={sec.id} className="mt-3">
              <button
                type="button"
                onClick={() => setOpenIds((ids) => (ids.includes(sec.id) ? ids.filter((i) => i !== sec.id) : [...ids, sec.id]))}
                className="caps flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-[11px] text-ink-3 hover:text-ink"
                aria-expanded={open}
              >
                {t(sec.label)}
                <ChevronDown className={cx('size-3.5 transition-transform', !open && '-rotate-90 rtl:rotate-90')} />
              </button>
              {open && (
                <ul className="mt-0.5 space-y-0.5">
                  {sec.items.map((it) => (
                    <li key={it.path + it.label}>
                      <NavLink
                        to={it.path}
                        end={it.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cx('flex items-center gap-3 rounded-[8px] px-2.5 py-2 text-[14px] transition-colors', isActive ? 'bg-navactive font-semibold text-ink' : 'font-medium text-ink hover:bg-[#f4f5f7]')
                        }
                      >
                        <it.icon className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.5} />
                        <span className="min-w-0 flex-1 truncate">{t(it.label)}</span>
                        {it.count && counts[it.count] > 0 && (
                          <span className={cx('tabular text-[12px]', it.count === 'criticalAlerts' || it.count === 'fieldQueue' ? 'rounded-full bg-crit-bg px-1.5 font-semibold text-crit' : 'text-ink-2')}>{counts[it.count]}</span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={() => {
            actions.signOut()
            navigate('/login')
          }}
          className="flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-[14px] font-medium text-ink hover:bg-[#f4f5f7]"
        >
          <LogOut className="size-[18px] text-ink-2 rtl:rotate-180" strokeWidth={1.5} />
          {t('Logout')}
        </button>
      </div>
    </div>
  )
}

/* ---------- Popovers ---------- */

function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', h)
    window.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      window.removeEventListener('keydown', k)
    }
  }, [open])
  return { open, setOpen, ref }
}

function ShellIcon({ icon: Icon, label, onClick, badge, active }: { icon: typeof Bell; label: string; onClick: () => void; badge?: number; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cx('relative flex size-9 items-center justify-center rounded-[6px] text-white/85 hover:bg-white/10 hover:text-white', active && 'bg-white/10 text-white')}>
      <Icon className="size-[19px]" strokeWidth={1.5} />
      {!!badge && badge > 0 && <span className="absolute end-0.5 top-0.5 min-w-[16px] rounded-full bg-[#ef4444] px-1 text-center text-[10px] leading-4 font-semibold text-white">{badge > 99 ? '99+' : badge}</span>}
    </button>
  )
}

function Notifications() {
  const { state } = useStore()
  const navigate = useNavigate()
  const pop = usePopover()
  const items = openAlerts(state).slice(0, 8)
  const crit = criticalOpen(state).length
  return (
    <div ref={pop.ref} className="relative">
      <ShellIcon icon={Bell} label="Notifications" onClick={() => pop.setOpen(!pop.open)} badge={crit} active={pop.open} />
      {pop.open && (
        <div className="anim-pop absolute end-0 top-11 z-50 w-[380px] max-w-[calc(100vw-24px)] rounded-[12px] border border-line bg-surface text-ink shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[14px] font-semibold">Notifications</span>
            <span className="text-[12px] text-ink-3">{crit} critical open</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No alerts" body="Everything is under control." className="m-3 border-0" />
            ) : (
              items.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    pop.setOpen(false)
                    navigate(a.link ?? '/alerts')
                  }}
                  className="flex w-full gap-3 border-b border-line px-4 py-3 text-start last:border-b-0 hover:bg-muted"
                >
                  {a.level === 'critical' ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-crit" /> : a.level === 'warning' ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" /> : <Info className="mt-0.5 size-4 shrink-0 text-info" />}
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[13px] font-medium">{a.title}</div>
                    <div className="mt-0.5 text-[12px] text-ink-3">
                      {projectById(state, a.projectId)?.shortName} · {a.department} · {a.status}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-line p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                pop.setOpen(false)
                navigate('/alerts')
              }}
            >
              Open Alert Centre
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function RoleMenu() {
  const { state, actions } = useStore()
  const t = useT()
  const navigate = useNavigate()
  const pop = usePopover()
  const prof = roleProfile(state.role)
  const switchTo = (r: Role) => {
    pop.setOpen(false)
    actions.setRole(r)
    navigate(roleProfile(r).home)
  }
  return (
    <div ref={pop.ref} className="relative">
      <button type="button" onClick={() => pop.setOpen(!pop.open)} className="flex items-center gap-2.5 rounded-[8px] py-1 ps-1 pe-2 hover:bg-white/10" aria-label="Switch role">
        <Avatar name={prof.name} size={30} />
        <div className="hidden text-start leading-tight lg:block">
          <div className="text-[13px] font-medium text-white">{prof.name}</div>
          <div className="text-[11px] text-white/65">
            {t('View as')}: {state.role}
          </div>
        </div>
        <ChevronDown className="size-4 text-white/70" />
      </button>
      {pop.open && (
        <div className="anim-pop absolute end-0 top-12 z-50 w-[320px] rounded-[12px] border border-line bg-surface p-2 text-ink shadow-xl">
          <div className="caps px-2 pt-1 pb-2 text-[11px] text-ink-3">{t('View as')} (demo role switch)</div>
          {ROLES.map((r) => (
            <button key={r.role} type="button" onClick={() => switchTo(r.role)} className={cx('flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-start hover:bg-muted', r.role === state.role && 'bg-navactive')}>
              <Avatar name={r.name} size={28} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{r.role}</div>
                <div className="truncate text-[12px] text-ink-3">{r.name}</div>
              </div>
              {r.role === state.role && <CheckCircle2 className="size-4 text-ok" />}
            </button>
          ))}
          <div className="mt-1 border-t border-line pt-1">
            <button
              type="button"
              onClick={() => {
                pop.setOpen(false)
                actions.reset()
              }}
              className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-[13px] text-ink-2 hover:bg-muted"
            >
              <RotateCcw className="size-4" /> Reset demo data
            </button>
            <button
              type="button"
              onClick={() => {
                actions.signOut()
                navigate('/login')
              }}
              className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-[13px] text-ink-2 hover:bg-muted"
            >
              <LogOut className="size-4 rtl:rotate-180" /> {t('Logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Demo guide ---------- */

export const DEMO_STEPS = [
  { n: 1, label: 'Portfolio', detail: 'Executive Command Centre: KPIs, attention items, project health', to: '/command', role: 'CEO' as Role },
  { n: 2, label: 'Project', detail: 'North Pipeline Expansion Project Command View', to: '/projects/NPE', role: 'CEO' as Role },
  { n: 3, label: 'QA/QC', detail: 'Failed welding inspection INS-WLD-00428', to: '/quality/inspections/INS-WLD-00428', role: 'CEO' as Role },
  { n: 4, label: 'NCR', detail: 'Raise NCR-00218, run the CAPA workflow', to: '/quality/ncrs', role: 'CEO' as Role },
  { n: 5, label: 'Handover', detail: 'Dossier 68% complete, missing documents', to: '/handover', role: 'CEO' as Role },
  { n: 6, label: 'HSE', detail: 'Suspended load observation with AI hazard analysis', to: '/hse/observations/OBS-1042', role: 'CEO' as Role },
  { n: 7, label: 'Procurement', detail: 'Vendor price +11.5% and recommendation engine', to: '/procurement/pos/PO-450021', role: 'CEO' as Role },
  { n: 8, label: 'Role Switch', detail: 'Switch to QA/QC Manager workspace', to: '/quality', role: 'QA/QC Manager' as Role },
  { n: 9, label: 'Field App', detail: 'Site Engineer: capture offline, sync', to: '/field', role: 'Site Engineer' as Role },
  { n: 10, label: 'AI Assistant', detail: 'Ask SHQ Intelligence', to: '/ai', role: 'CEO' as Role },
]

export function DemoGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const go = (s: (typeof DEMO_STEPS)[number]) => {
    if (state.role !== s.role) actions.setRole(s.role)
    navigate(s.to)
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="SHQ Demo Journey"
      subtitle="Click a step to jump straight to it. Role switches happen automatically."
      width={600}
      footer={
        <>
          <Button
            icon={RotateCcw}
            variant="ghost"
            onClick={() => {
              actions.reset()
              onClose()
              navigate('/command')
            }}
          >
            Reset demo data
          </Button>
          <Button variant="primary" onClick={() => go(DEMO_STEPS[0])}>
            Start from step 1
          </Button>
        </>
      }
    >
      <ol className="space-y-1.5">
        {DEMO_STEPS.map((s) => (
          <li key={s.n}>
            <button type="button" onClick={() => go(s)} className="flex w-full items-center gap-3 rounded-[10px] border border-line px-3 py-2.5 text-start hover:border-line-strong hover:bg-muted">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-shell text-[12px] font-semibold text-white">{s.n}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-ink">{s.label}</div>
                <div className="truncate text-[12px] text-ink-2">{s.detail}</div>
              </div>
              {s.role !== 'CEO' && <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[11px] text-ink-2 sm:inline">as {s.role}</span>}
              <ChevronRight className="size-4 text-ink-3 rtl:rotate-180" />
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-[8px] bg-muted px-3 py-2 text-[12px] text-ink-2">
        Full journey: CEO → North Pipeline → QA/QC → Raise NCR → CAPA → Handover → HSE AI analysis → Procurement → switch to QA/QC Manager → Site Engineer field app → capture offline → sync → back to leadership to see the new alert.
      </p>
    </Modal>
  )
}

/* ---------- Toaster ---------- */

export function Toaster() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed end-4 bottom-4 z-[80] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'warning' ? AlertTriangle : t.tone === 'error' ? XCircle : Info
        const color = t.tone === 'success' ? 'text-ok' : t.tone === 'warning' ? 'text-warn' : t.tone === 'error' ? 'text-crit' : 'text-info'
        return (
          <div key={t.id} className="anim-pop pointer-events-auto flex gap-3 rounded-[10px] border border-line bg-surface p-3.5 shadow-lg">
            <Icon className={cx('mt-0.5 size-5 shrink-0', color)} strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink">{t.title}</div>
              {t.body && <div className="mt-0.5 text-[13px] text-ink-2">{t.body}</div>}
            </div>
            <button type="button" onClick={() => dismissToast(t.id)} className="self-start rounded p-0.5 text-ink-3 hover:text-ink" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Top bar ---------- */

function TopBar({ onMenu, onAi, onGuide }: { onMenu: () => void; onAi: () => void; onGuide: () => void }) {
  const { state, actions } = useStore()
  const t = useT()
  const navigate = useNavigate()
  const approvals = myApprovals(state, state.role).length
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-shell px-3 text-white sm:gap-3 sm:px-4">
      <button type="button" onClick={onMenu} className="flex size-9 items-center justify-center rounded-[6px] hover:bg-white/10 lg:hidden" aria-label="Open navigation">
        <Menu className="size-5" />
      </button>
      <Link to={roleProfile(state.role).home} className="flex shrink-0 items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[7px] bg-white text-[15px] font-bold text-shell">S</span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-[14px] font-semibold tracking-wide">SHQ</span>
          <span className="block text-[10px] tracking-[0.12em] text-white/60 uppercase">Operations Command</span>
        </span>
      </Link>
      <div className="mx-1 hidden h-6 w-px bg-white/15 md:block" />
      <GlobalSearch className="hidden max-w-[520px] min-w-0 flex-1 md:block" />
      <div className="flex-1 md:hidden" />
      <select
        value={state.projectFilter}
        onChange={(e) => actions.setProjectFilter(e.target.value)}
        className="hidden h-9 max-w-[200px] rounded-[6px] border-0 bg-shell-raised px-2.5 text-[13px] text-white outline-none xl:block"
        aria-label="Project selector"
      >
        <option value="all">{t('All Projects ')}</option>
        {state.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.shortName}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={onGuide} className="hidden h-9 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] font-medium text-white/85 hover:bg-white/10 hover:text-white sm:flex" title="Demo Guide">
          <Compass className="size-[18px]" strokeWidth={1.5} />
          <span className="hidden 2xl:inline">{t('Demo Guide')}</span>
        </button>
        <button
          type="button"
          onClick={() => actions.setLang(state.lang === 'en' ? 'ar' : 'en')}
          className="flex h-9 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-white/85 hover:bg-white/10 hover:text-white"
          aria-label="Switch language"
          title="EN | العربية"
        >
          <Languages className="size-[18px] sm:hidden" strokeWidth={1.5} />
          <span className="hidden sm:inline">
            <span className={state.lang === 'en' ? 'text-white' : 'text-white/50'}>EN</span>
            <span className="mx-1 text-white/30">|</span>
            <span className={state.lang === 'ar' ? 'text-white' : 'text-white/50'} style={{ fontFamily: 'var(--font-arabic)' }}>
              العربية
            </span>
          </span>
        </button>
        <ShellIcon icon={Sparkles} label="AI Assistant" onClick={onAi} />
        <ShellIcon icon={CheckSquare} label="Approvals" onClick={() => navigate('/approvals')} badge={approvals} />
        <Notifications />
      </div>
      <div className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />
      <RoleMenu />
    </header>
  )
}

/* ---------- Access guard ---------- */

export function Guard({ children }: { children: ReactNode }) {
  const { state, actions } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  if (canAccess(state.role, location.pathname)) return <>{children}</>
  const allowed = ROLES.filter((r) => canAccess(r.role, location.pathname)).map((r) => r.role)
  return (
    <div className="mx-auto max-w-xl py-16">
      <EmptyState
        icon={ShieldOff}
        title={`Not part of the ${state.role} workspace`}
        body={
          <>
            Role-based views show each user only what they need. This page is visible to: {allowed.join(', ') || 'no demo role'}.<span className="mt-1 block text-ink-3">Demo role switch, not production security.</span>
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => navigate(roleProfile(state.role).home)}>
              Go to my workspace
            </Button>
            {allowed[0] && (
              <Button
                onClick={() => {
                  actions.setRole(allowed[0])
                }}
              >
                View as {allowed[0]}
              </Button>
            )}
          </div>
        }
      />
    </div>
  )
}

/* ---------- Shell ---------- */

export function AppShell() {
  const { state } = useStore()
  const [drawer, setDrawer] = useState(false)
  const [ai, setAi] = useState(false)
  const [guide, setGuide] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawer(false)
  }, [location.pathname])

  useEffect(() => {
    const open = () => setAi(true)
    const g = () => setGuide(true)
    window.addEventListener('shq:open-ai', open)
    window.addEventListener('shq:open-guide', g)
    return () => {
      window.removeEventListener('shq:open-ai', open)
      window.removeEventListener('shq:open-guide', g)
    }
  }, [])

  const sidebarKey = useMemo(() => state.role, [state.role])

  return (
    <div className="flex min-h-full flex-col">
      <TopBar onMenu={() => setDrawer(true)} onAi={() => setAi(true)} onGuide={() => setGuide(true)} />
      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[260px] shrink-0 border-e border-line bg-surface lg:block">
          <Sidebar key={sidebarKey} />
        </aside>
        {drawer && (
          <div className="anim-fade fixed inset-0 z-50 bg-[#0b1530]/40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
            <aside className="anim-slide h-full w-[280px] max-w-[85vw] bg-surface">
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <span className="text-[14px] font-semibold">Navigation</span>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close navigation" className="rounded p-1 hover:bg-muted">
                  <X className="size-5" />
                </button>
              </div>
              <div className="h-[calc(100%-56px)]">
                <Sidebar key={sidebarKey} onNavigate={() => setDrawer(false)} />
              </div>
            </aside>
          </div>
        )}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Guard>
              <Outlet />
            </Guard>
          </div>
        </main>
      </div>
      <button
        type="button"
        onClick={() => setGuide(true)}
        className="fixed start-4 bottom-4 z-40 hidden items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[12px] font-semibold tracking-wide text-ink uppercase shadow-md hover:bg-muted sm:flex"
      >
        <Compass className="size-4 text-action" /> Demo Guide
      </button>
      <AIPanel open={ai} onClose={() => setAi(false)} />
      <DemoGuide open={guide} onClose={() => setGuide(false)} />
      <Toaster />
    </div>
  )
}

export function openAiPanel() {
  window.dispatchEvent(new Event('shq:open-ai'))
}

export const ALL_NAV = NAV
