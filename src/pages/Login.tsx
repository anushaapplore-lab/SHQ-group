import { useState } from 'react'
import { ArrowRight, ChevronRight, Gauge, Layers, Lock, Mail, Smartphone, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Role } from '../data/types'
import { cx } from '../lib/format'
import { ROLES, roleProfile } from '../store/roles'
import { useStore } from '../store/store'
import { Avatar, Button, Field, Input } from '../components/ui'

const LAYERS = [
  { icon: Gauge, name: 'Command', text: 'Portfolio health, cost, progress, risks, alerts and approvals for leadership.' },
  { icon: Layers, name: 'Department Workspaces', text: 'Projects, QA/QC, Handover, HSE, Procurement, Manpower, O&M and Compliance.' },
  { icon: Smartphone, name: 'Field Operations', text: 'Mobile capture of progress, inspections, observations and photos, offline first.' },
]

export function LoginPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [showRoles, setShowRoles] = useState(false)
  const [email, setEmail] = useState('saleh@shq-demo.example')
  const [password, setPassword] = useState('demo-password')

  const enter = (role: Role) => {
    actions.signIn(role)
    navigate(roleProfile(role).home)
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* Brand panel */}
      <aside className="relative flex flex-col justify-between bg-[var(--brand-shell)] px-6 py-8 text-white sm:px-10 lg:w-[46%] lg:px-14 lg:py-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[10px] border border-white/15 bg-[var(--brand-shell-raised)] text-[15px] font-semibold tracking-tight">SHQ</div>
            <div>
              <p className="text-[15px] font-semibold">SHQ Group</p>
              <p className="text-[12px] text-white/60">Operations Command</p>
            </div>
          </div>
          <h1 className="mt-10 text-[30px] leading-tight font-semibold tracking-tight sm:text-[36px] lg:mt-20">SHQ Operations Command</h1>
          <p className="mt-3 max-w-md text-[17px] text-white/85">One operational record. Every project. Every department.</p>
          <p className="mt-2 text-[13px] text-white/55">Virtual PMO for Industrial, Oil &amp; Gas &amp; EPC Contractors</p>
        </div>

        <ul className="mt-10 space-y-5 lg:mt-0">
          {LAYERS.map((l, i) => (
            <li key={l.name} className="flex gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/5">
                <l.icon className="size-[18px] text-white/80" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium">
                  <span className="me-2 text-white/40 tabular">0{i + 1}</span>
                  {l.name}
                </p>
                <p className="mt-0.5 text-[13px] text-white/60">{l.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 hidden text-[12px] text-white/40 lg:block">Capture data once at the source and reuse it across the organisation.</p>
      </aside>

      {/* Sign-in panel */}
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-10 lg:py-12">
        <div className="flex justify-end">
          <div className="inline-flex rounded-[8px] border border-line bg-surface p-0.5 text-[12px] font-medium">
            <button type="button" onClick={() => actions.setLang('en')} className={cx('rounded-[6px] px-3 py-1.5', state.lang === 'en' ? 'bg-shell text-white' : 'text-ink-2 hover:text-ink')}>
              EN
            </button>
            <button type="button" onClick={() => actions.setLang('ar')} className={cx('rounded-[6px] px-3 py-1.5', state.lang === 'ar' ? 'bg-shell text-white' : 'text-ink-2 hover:text-ink')}>
              العربية
            </button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center py-8">
          <div className="rounded-[12px] border border-line bg-surface p-6 sm:p-8">
            <p className="caps text-[12px] text-ink-3">Demo sign in</p>
            <h2 className="mt-1 text-[22px] font-semibold text-ink">Welcome back</h2>
            <p className="mt-1 text-[14px] text-ink-2">Sign in to the shared operational record for all SHQ projects.</p>
            {state.signedIn && (
              <p className="mt-3 rounded-[8px] bg-muted px-3 py-2 text-[13px] text-ink-2">
                Currently signed in as <span className="font-medium text-ink">{roleProfile(state.role).name}</span> ({state.role}). Choose a role to switch.
              </p>
            )}

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                enter('CEO')
              }}
            >
              <Field label="Email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ps-9" autoComplete="username" />
                </div>
              </Field>
              <Field label="Password" hint="Demo login. Any credentials are accepted.">
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ps-9" autoComplete="current-password" />
                </div>
              </Field>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button type="submit" variant="primary" size="lg" iconRight={ArrowRight} className="flex-1">
                  Enter Demo
                </Button>
                <Button size="lg" icon={Users} onClick={() => setShowRoles((v) => !v)} className="flex-1" aria-expanded={showRoles}>
                  Choose Demo Role
                </Button>
              </div>
            </form>

            {showRoles && (
              <div className="anim-fade mt-6 border-t border-line pt-5">
                <p className="caps mb-3 text-[12px] text-ink-3">View the platform as</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => enter(r.role)}
                      className={cx(
                        'group flex min-w-0 items-start gap-3 rounded-[10px] border p-3 text-start transition-colors hover:border-line-strong hover:bg-muted',
                        state.signedIn && state.role === r.role ? 'border-shell' : 'border-line',
                      )}
                    >
                      <Avatar name={r.name} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center justify-between gap-2 text-[14px] font-medium text-ink">
                          <span className="truncate">{r.role}</span>
                          <ChevronRight className="size-4 shrink-0 text-ink-3 group-hover:text-ink rtl:rotate-180" strokeWidth={1.5} />
                        </p>
                        <p className="truncate text-[12px] text-ink-2">
                          {r.name} · {r.title}
                        </p>
                        <p className="mt-1 text-[12px] leading-snug text-ink-3">{r.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[12px] text-ink-3">Demo prototype. Fictional data. No real SHQ, client or ERP data.</p>
      </main>
    </div>
  )
}
