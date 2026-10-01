import { Link } from 'react-router-dom'
import { AlertTriangle, CheckSquare, ClipboardCheck, ClipboardList, FileText, HardHat, PackageSearch, Settings2, ShieldAlert, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Activity } from '../../data/types'
import { cx } from '../../lib/format'
import { Avatar, EmptyState } from '../ui'

const KIND_ICON: Record<Activity['kind'], LucideIcon> = {
  ncr: ShieldAlert,
  inspection: ClipboardCheck,
  po: PackageSearch,
  dpr: ClipboardList,
  hse: HardHat,
  doc: FileText,
  approval: CheckSquare,
  alert: AlertTriangle,
  field: Smartphone,
  system: Settings2,
}

const timeOnly = (t: string) => t.replace(/^Today\s+/, '')

/** Project activity stream (brief §43). */
export function ActivityTimeline({ items, compact }: { items: Activity[]; compact?: boolean }) {
  if (items.length === 0) return <EmptyState title="No activity yet" body="Events from QA/QC, HSE, procurement and the field app will appear here." />
  return (
    <ol className="relative">
      {items.map((a, i) => {
        const Icon = KIND_ICON[a.kind] ?? Settings2
        const body = (
          <div className={cx('flex gap-3 rounded-[8px] px-2', compact ? 'py-2' : 'py-3', a.link && 'hover:bg-[#f9fafb]')}>
            <div className="w-[68px] shrink-0 pt-0.5 text-end text-[12px] text-ink-3 tabular">{timeOnly(a.time)}</div>
            <div className="relative flex flex-col items-center">
              <span className="z-[1] flex size-7 items-center justify-center rounded-full border border-line bg-surface">
                <Icon className="size-3.5 text-ink-2" strokeWidth={1.5} />
              </span>
              {i < items.length - 1 && <span className="absolute top-7 -bottom-3 w-px bg-line" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cx('text-[13px] text-ink', a.link && 'group-hover:text-action')}>{a.text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
                <Avatar name={a.user} size={18} />
                <span className="text-ink-2">{a.user}</span>
                <span>·</span>
                <span>{a.department}</span>
              </div>
            </div>
          </div>
        )
        return (
          <li key={a.id}>
            {a.link ? (
              <Link to={a.link} className="group block">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        )
      })}
    </ol>
  )
}
