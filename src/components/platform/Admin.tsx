import { useState } from 'react'
import { Bell, Check, Globe, History, Minus, RotateCcw, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, DataTable, DemoTag, Modal, PageHeader, Pill, Segmented } from '../ui'
import { useStore } from '../../store/store'
import { ROLES } from '../../store/roles'
import { NAV } from '../../nav'
import type { Role } from '../../data/types'
import { cx } from '../../lib/format'
import { Note, Switch } from './shared'

const SECTION_LABEL = (id: string) => {
  const s = NAV.find((n) => n.id === id)
  if (!s) return id
  return s.label.charAt(0) + s.label.slice(1).toLowerCase().replace('qa/qc', 'QA/QC').replace('hse', 'HSE').replace('hr /', 'HR /').replace('o&m', 'O&M')
}

const NOTIFS = [
  { id: 'critical', label: 'Critical alerts', hint: 'Rule breaches marked critical' },
  { id: 'approvals', label: 'Approvals assigned to me', hint: 'CAPA, vendor change, documents' },
  { id: 'escalations', label: 'Escalations', hint: 'Overdue NCRs and HSE actions' },
  { id: 'expiry', label: 'Expiry reminders', hint: 'Licences, permits, certificates' },
  { id: 'digest', label: 'Daily digest', hint: 'Summary at 06:30 every working day' },
] as const

type Channel = 'inApp' | 'email' | 'sms'

export function AdminPage() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, Record<Channel, boolean>>>(() =>
    Object.fromEntries(NOTIFS.map((n) => [n.id, { inApp: true, email: n.id === 'approvals' || n.id === 'expiry' || n.id === 'digest', sms: n.id === 'critical' }])),
  )

  function setPref(id: string, ch: Channel, v: boolean) {
    setPrefs((p) => ({ ...p, [id]: { ...p[id], [ch]: v } }))
    const label = NOTIFS.find((n) => n.id === id)?.label ?? id
    actions.toast({ title: 'Notification preference saved', body: `${label}: ${ch === 'inApp' ? 'in-app' : ch === 'sms' ? 'SMS' : 'email'} ${v ? 'on' : 'off'}`, tone: 'success' })
  }

  function switchRole(role: Role) {
    actions.setRole(role)
    const home = ROLES.find((r) => r.role === role)?.home
    if (home && !ROLES.find((r) => r.role === role)?.sections.includes('platform')) navigate(home)
  }

  const sectionIds = NAV.map((n) => n.id)
  const audit = state.activities.slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Administration"
        crumbs={[{ label: 'Platform' }, { label: 'Administration' }]}
        subtitle="Users, roles, language, notifications and audit trail for the demo environment."
        tag={<DemoTag icon={ShieldCheck}>Demo role switch, not production security</DemoTag>}
        actions={
          <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>
            Reset demo data
          </Button>
        }
      />

      <div className="space-y-4">
        <Card title="Users & roles" icon={Users} subtitle={`${ROLES.length} demo users`} actions={<DemoTag>Demo role switch, not production security</DemoTag>} bodyClassName="p-0">
          <DataTable
            rows={ROLES}
            rowKey={(r) => r.role}
            highlight={(r) => r.role === state.role}
            columns={[
              {
                key: 'user',
                header: 'User',
                render: (r) => (
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={r.name} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{r.name}</span>
                      <span className="block truncate text-[12px] text-ink-3">{r.email}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'role', header: 'Role', render: (r) => <span className="whitespace-nowrap">{r.role}</span> },
              { key: 'scope', header: 'Access', hideBelow: 'lg', render: (r) => <span className="text-ink-2">{r.description}</span> },
              { key: 'home', header: 'Landing page', hideBelow: 'md', render: (r) => <span className="font-mono text-[12px] text-ink-2">{r.home}</span> },
              {
                key: 'act',
                header: '',
                align: 'end',
                render: (r) =>
                  r.role === state.role ? (
                    <Pill tone="ok" dot>
                      Current
                    </Pill>
                  ) : (
                    <Button size="sm" onClick={() => switchRole(r.role)}>
                      View as
                    </Button>
                  ),
              },
            ]}
          />
        </Card>

        <Card title="Role permissions" icon={ShieldCheck} subtitle="Navigation sections visible per role" bodyClassName="p-0">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="caps sticky start-0 bg-surface px-4 py-2.5 text-start text-[11px] font-medium text-ink-3">Section</th>
                  {ROLES.map((r) => (
                    <th key={r.role} className={cx('px-3 py-2.5 text-center text-[11px] font-medium whitespace-nowrap', r.role === state.role ? 'text-ink' : 'text-ink-3')}>
                      {r.role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectionIds.map((id) => (
                  <tr key={id} className="border-b border-line last:border-b-0">
                    <td className="sticky start-0 bg-surface px-4 py-2 whitespace-nowrap text-ink">{SECTION_LABEL(id)}</td>
                    {ROLES.map((r) => {
                      const on = r.sections.includes(id)
                      return (
                        <td key={r.role} className={cx('px-3 py-2 text-center', r.role === state.role && 'bg-[#f9fafb]')}>
                          {on ? (
                            <Check className="mx-auto size-4 text-ok" strokeWidth={2} aria-label="Visible" />
                          ) : (
                            <Minus className="mx-auto size-4 text-line-strong" strokeWidth={2} aria-label="Hidden" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          <Card title="Language" icon={Globe}>
            <p className="text-[13px] text-ink-2">Interface language. Arabic mirrors the full layout right to left.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Segmented
                options={[
                  { id: 'en', label: 'English' },
                  { id: 'ar', label: 'العربية' },
                ]}
                value={state.lang}
                onChange={(v) => {
                  actions.setLang(v)
                  actions.toast({ title: v === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language set to English', tone: 'info' })
                }}
              />
              <span className="text-[12px] text-ink-3">Current: {state.lang === 'ar' ? 'Arabic (RTL)' : 'English (LTR)'}</span>
            </div>
          </Card>

          <Card title="Notification preferences" icon={Bell} subtitle="Applies to the current demo user" bodyClassName="p-0">
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="caps px-4 py-2.5 text-start text-[11px] font-medium text-ink-3">Event</th>
                    <th className="caps px-3 py-2.5 text-center text-[11px] font-medium text-ink-3">In-app</th>
                    <th className="caps px-3 py-2.5 text-center text-[11px] font-medium text-ink-3">Email</th>
                    <th className="caps px-3 py-2.5 text-center text-[11px] font-medium text-ink-3">SMS</th>
                  </tr>
                </thead>
                <tbody>
                  {NOTIFS.map((n) => (
                    <tr key={n.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-2.5">
                        <div className="text-ink">{n.label}</div>
                        <div className="text-[12px] text-ink-3">{n.hint}</div>
                      </td>
                      {(['inApp', 'email', 'sms'] as Channel[]).map((ch) => (
                        <td key={ch} className="px-3 py-2.5 text-center">
                          <span className="inline-flex">
                            <Switch checked={prefs[n.id][ch]} onChange={(v) => setPref(n.id, ch, v)} label={`${n.label} ${ch}`} />
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card title="Audit trail" icon={History} subtitle="Latest 10 actions across all modules" bodyClassName="p-0">
          <DataTable
            dense
            rows={audit}
            rowKey={(a) => a.id}
            onRowClick={(a) => a.link && navigate(a.link)}
            columns={[
              { key: 'time', header: 'Time', render: (a) => <span className="whitespace-nowrap text-ink-2">{a.time}</span> },
              { key: 'user', header: 'User', hideBelow: 'sm', render: (a) => <span className="whitespace-nowrap">{a.user}</span> },
              { key: 'text', header: 'Action', render: (a) => <span className="line-clamp-2 min-w-[200px]">{a.text}</span> },
              { key: 'dept', header: 'Department', hideBelow: 'md', render: (a) => <Pill>{a.department}</Pill> },
            ]}
            empty={<p className="px-5 py-6 text-center text-[13px] text-ink-3">No activity recorded yet.</p>}
          />
        </Card>

        <Note>Roles in this prototype are a demo switch to show role-based views. Production access control, SSO and audit retention are to be configured.</Note>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        subtitle="All records return to the seeded baseline."
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              icon={RotateCcw}
              onClick={() => {
                actions.reset()
                setConfirmReset(false)
              }}
            >
              Reset demo data
            </Button>
          </>
        }
      >
        <p className="text-[14px] text-ink-2">NCRs, observations, alerts, approvals, documents and field queue changes made in this session will be discarded. Your current role and language are kept.</p>
      </Modal>
    </div>
  )
}
