import type { LucideIcon } from 'lucide-react'
import { BellRing, ClipboardCheck, Database, FolderCheck, Layers, Package, ShieldAlert, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useT } from '../../i18n'
import { openAlerts, openNcrs, openObservations } from '../../store/selectors'
import { useStore } from '../../store/store'
import { Card, DemoTag, PageHeader } from '../../components/ui'
import { AiChat } from '../../components/layout/AIPanel'

export function AiPage() {
  const { state } = useStore()
  const t = useT()

  const sources: { icon: LucideIcon; label: string; count: number; detail: string; to: string }[] = [
    { icon: Layers, label: 'Projects', count: state.projects.length, detail: 'Progress, plan, cost, RAG, risks', to: '/portfolio' },
    { icon: ClipboardCheck, label: 'NCRs', count: openNcrs(state).length, detail: 'Open non-conformances, SLA ageing', to: '/quality/ncrs' },
    { icon: Package, label: 'Purchase orders', count: state.pos.length, detail: 'Price variance, late deliveries, vendors', to: '/procurement/pos' },
    { icon: FolderCheck, label: 'Documents', count: state.documents.length, detail: 'MDR status, missing and expiring', to: '/handover/register' },
    { icon: BellRing, label: 'Alerts', count: openAlerts(state).length, detail: 'Rule-driven escalations', to: '/alerts' },
    { icon: ShieldAlert, label: 'HSE observations', count: openObservations(state).length, detail: 'Open observations and actions', to: '/hse/observations' },
    { icon: Users, label: 'Workforce', count: state.employees.length, detail: 'Utilisation, idle causes, certificates', to: '/hr' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('SHQ Intelligence')}
        subtitle={t('AI Command Assistant')}
        crumbs={[{ label: 'Command', to: '/command' }, { label: t('AI Command Assistant') }]}
        tag={<DemoTag>Demo AI Analysis</DemoTag>}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card bodyClassName="p-0" className="flex h-[calc(100vh-220px)] min-h-[520px] min-w-0 flex-col overflow-hidden [&>div]:flex [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col">
          <AiChat />
        </Card>

        <div className="space-y-4">
          <Card title="Data sources" icon={Database} subtitle="Answers read the live demo record store">
            <ul className="-my-1 divide-y divide-line">
              {sources.map((s) => (
                <li key={s.label}>
                  <Link to={s.to} className="flex items-center gap-3 py-2.5 hover:text-action">
                    <s.icon className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{s.label}</p>
                      <p className="truncate text-[12px] text-ink-3">{s.detail}</p>
                    </div>
                    <span className="tabular text-[13px] text-ink-2">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="How it works">
            <div className="space-y-3 text-[13px] text-ink-2">
              <p>{t('AI-generated analysis based on current demo data.')}</p>
              <p>Responses are deterministic and computed from the same records every module uses, so they change as you raise NCRs, sync field observations or decide approvals.</p>
              <p>Arabic questions are supported. Switch the language in the top bar to see Arabic suggestions.</p>
              <p className="text-ink-3">No live AI model is connected in this prototype. Production integration configurable.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
