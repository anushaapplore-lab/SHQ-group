import { useEffect, useState } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronRight, FileSpreadsheet, FileText, Image as ImageIcon, Inbox, MoreVertical, Presentation, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cx, initials } from '../lib/format'

/* ---------- tone ---------- */

export type Tone = 'ok' | 'warn' | 'crit' | 'info' | 'neutral' | 'brand'

const TONE_PILL: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  crit: 'bg-crit-bg text-crit',
  info: 'bg-info-bg text-info',
  neutral: 'bg-muted text-ink-2',
  brand: 'bg-[var(--badge-bg)] text-[var(--badge-text)]',
}

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  crit: 'text-crit',
  info: 'text-info',
  neutral: 'text-ink-2',
  brand: 'text-shell',
}

const TONE_BAR: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-[#d97706]',
  crit: 'bg-crit',
  info: 'bg-action',
  neutral: 'bg-ink-3',
  brand: 'bg-shell',
}

export function toneFor(status: string): Tone {
  const s = status.toLowerCase()
  if (/(critical|red|failed|overdue|expired|rejected|missing|high|escalated|attention|suspended|critical delay|degraded|discrepancy)/.test(s)) return 'crit'
  if (/(amber|warning|delayed|at risk|expiring|due|investigation|pending|medium|under review|in progress|open|submitted|draft|review required|changes requested|acknowledged|customs|in transit|awaiting|factory test|re-inspection|under maintenance|action assigned|renewal)/.test(s)) return 'warn'
  if (/(green|passed|approved|closed|completed|valid|on track|active|delivered|healthy|operational|verified|current|resolved|configured|connected|synced|low)/.test(s)) return 'ok'
  if (/(info|upcoming|capa submitted|verification|not started|minor)/.test(s)) return 'info'
  return 'neutral'
}

export const toneText = (t: Tone) => TONE_TEXT[t]
export const toneBar = (t: Tone) => TONE_BAR[t]

/* ---------- primitives ---------- */

export function Pill({ children, tone = 'neutral', className, dot }: { children: ReactNode; tone?: Tone; className?: string; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap', TONE_PILL[tone], className)}>
      {dot && <span className={cx('size-1.5 rounded-full', TONE_BAR[tone])} />}
      {children}
    </span>
  )
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <Pill tone={toneFor(status)} className={className} dot>
      {status}
    </Pill>
  )
}

export function RagBadge({ rag }: { rag: 'GREEN' | 'AMBER' | 'RED' }) {
  const tone: Tone = rag === 'GREEN' ? 'ok' : rag === 'AMBER' ? 'warn' : 'crit'
  return (
    <Pill tone={tone} dot className="caps !text-[11px]">
      {rag}
    </Pill>
  )
}

export function LevelPill({ level }: { level: 'critical' | 'warning' | 'info' }) {
  const tone: Tone = level === 'critical' ? 'crit' : level === 'warning' ? 'warn' : 'info'
  return (
    <Pill tone={tone} className="caps !text-[11px]">
      {level}
    </Pill>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

export function Button({
  variant = 'secondary',
  icon: Icon,
  iconRight: IconRight,
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: LucideIcon; iconRight?: LucideIcon; size?: 'sm' | 'md' | 'lg' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-action text-white hover:bg-action-hover border border-action',
    secondary: 'bg-surface text-ink border border-line hover:bg-muted',
    ghost: 'bg-transparent text-ink-2 hover:bg-muted border border-transparent',
    danger: 'bg-surface text-crit border border-[#f3c5c5] hover:bg-crit-bg',
    success: 'bg-ok text-white border border-ok hover:brightness-95',
  }
  const sz = size === 'sm' ? 'h-8 px-3 text-[12px]' : size === 'lg' ? 'h-11 px-5 text-[14px]' : 'h-9 px-3.5 text-[13px]'
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'caps inline-flex items-center justify-center gap-2 rounded-[6px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action whitespace-nowrap',
        v[variant],
        sz,
        className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
      {children}
      {IconRight && <IconRight className="size-4 shrink-0 rtl:rotate-180" strokeWidth={1.75} />}
    </button>
  )
}

export function IconButton({ icon: Icon, label, className, badge, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; badge?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx('relative inline-flex size-9 items-center justify-center rounded-[6px] border border-line bg-surface text-ink-2 hover:bg-muted hover:text-ink', className)}
    >
      <Icon className="size-[18px]" strokeWidth={1.5} />
      {!!badge && badge > 0 && (
        <span className="absolute -end-1.5 -top-1.5 min-w-[18px] rounded-full bg-crit px-1 text-center text-[10px] leading-[18px] font-semibold text-white">{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  )
}

export function Card({ children, className, title, actions, icon: Icon, subtitle, bodyClassName, id }: { children: ReactNode; className?: string; title?: ReactNode; actions?: ReactNode; icon?: LucideIcon; subtitle?: ReactNode; bodyClassName?: string; id?: string }) {
  return (
    <section id={id} className={cx('rounded-[12px] border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && <Icon className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.5} />}
            <div className="min-w-0">
              <h3 className="caps truncate text-[13px] text-ink">{title}</h3>
              {subtitle && <p className="mt-0.5 truncate text-[12px] text-ink-3">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx(bodyClassName ?? 'p-5')}>{children}</div>
    </section>
  )
}

export function ProgressBar({ value, tone = 'info', className, height = 6, marker }: { value: number; tone?: Tone; className?: string; height?: number; marker?: number }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('relative w-full rounded-full bg-[#eef0f3]', className)} style={{ height }}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', TONE_BAR[tone])} style={{ width: `${v}%` }} />
      {marker !== undefined && <div className="absolute -top-1 h-[calc(100%+8px)] w-0.5 rounded bg-ink" style={{ insetInlineStart: `${Math.max(0, Math.min(100, marker))}%` }} title={`Planned ${marker}%`} />}
    </div>
  )
}

export function Kpi({
  label,
  value,
  sub,
  tone,
  icon: Icon,
  to,
  onClick,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
  icon?: LucideIcon
  to?: string
  onClick?: () => void
  className?: string
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] text-ink-2">{label}</span>
        {Icon && <Icon className={cx('size-[18px] shrink-0', tone ? TONE_TEXT[tone] : 'text-ink-3')} strokeWidth={1.5} />}
      </div>
      <div className={cx('tabular mt-2 text-[26px] leading-none font-semibold tracking-tight', tone === 'crit' ? 'text-crit' : 'text-ink')}>{value}</div>
      {sub && <div className="mt-2 text-[12px] text-ink-3">{sub}</div>}
    </>
  )
  const cls = cx('block rounded-[12px] border border-line bg-surface p-4 text-start transition-colors', (to || onClick) && 'hover:border-line-strong hover:bg-[#fcfcfd] cursor-pointer', className)
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    )
  return <div className={cls}>{inner}</div>
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: string; icon?: LucideIcon; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('scrollbar-thin flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] whitespace-nowrap transition-colors',
              active ? 'border-shell font-semibold text-shell' : 'border-transparent text-ink-2 hover:text-ink',
            )}
          >
            {t.icon && <t.icon className="size-4" strokeWidth={1.5} />}
            {t.label}
            {t.count !== undefined && <span className={cx('rounded-full px-1.5 text-[11px] leading-[18px]', active ? 'bg-shell text-white' : 'bg-muted text-ink-2')}>{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented<T extends string>({ options, value, onChange, className }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('inline-flex rounded-[8px] border border-line bg-muted p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cx('rounded-[6px] px-3 py-1.5 text-[12px] font-medium whitespace-nowrap', o.id === value ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--border)]' : 'text-ink-2 hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- overlays ---------- */

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="anim-fade fixed inset-0 z-[60] flex items-end justify-center bg-[#0b1530]/40 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className="anim-pop flex max-h-[92vh] w-full flex-col rounded-t-[14px] border border-line bg-surface sm:rounded-[12px]" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-ink-2">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-[6px] p-1 text-ink-2 hover:bg-muted">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="scrollbar-thin overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function SlideOver({ open, onClose, title, subtitle, children, footer, width = 520 }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="anim-fade fixed inset-0 z-[55] flex justify-end bg-[#0b1530]/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" className="anim-slide flex h-full w-full flex-col border-s border-line bg-surface" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[13px] text-ink-2">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-[6px] p-1 text-ink-2 hover:bg-muted">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </div>
  )
}

/* ---------- layout helpers ---------- */

export function PageHeader({ title, count, subtitle, actions, crumbs, tag }: { title: ReactNode; count?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; crumbs?: { label: string; to?: string }[]; tag?: ReactNode }) {
  return (
    <div className="mb-6">
      {crumbs && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[12px] text-ink-3">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {c.to ? (
                <Link to={c.to} className="hover:text-ink hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink-2">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <ChevronRight className="size-3 rtl:rotate-180" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-ink sm:text-[27px]">
              {title}
              {count !== undefined && <span className="font-normal text-ink-2"> ({count})</span>}
            </h1>
            {tag}
          </div>
          {subtitle && <div className="mt-1.5 text-[14px] text-ink-2">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function SectionTitle({ children, count, actions, className }: { children: ReactNode; count?: number; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx('mb-3 flex flex-wrap items-center justify-between gap-3', className)}>
      <h2 className="text-[19px] font-medium text-ink">
        {children}
        {count !== undefined && <span className="text-ink-2"> ({count})</span>}
      </h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function DemoTag({ children = 'Demo data', icon: Icon = Sparkles, className }: { children?: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border border-dashed border-[#c5b8f0] bg-[#f6f3ff] px-2 py-0.5 text-[11px] font-medium text-[#5b3fb5]', className)}>
      <Icon className="size-3" strokeWidth={2} />
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, body, action, className }: { icon?: LucideIcon; title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-[12px] border border-dashed border-line-strong bg-[#fbfbfc] px-6 py-10 text-center', className)}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-ink-2" strokeWidth={1.5} />
      </div>
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] text-ink-2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} />
}

export function Avatar({ name, size = 28, className }: { name: string; size?: number; className?: string }) {
  const palette = ['#dbe6ff', '#fde2d4', '#d9f4e4', '#efe3ff', '#fff1c2', '#d6f3f8']
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-ink', className)} style={{ width: size, height: size, background: palette[idx], fontSize: size < 30 ? 11 : 13 }}>
      {initials(name) || name[0]}
    </span>
  )
}

/* ---------- data table ---------- */

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
  hideBelow?: 'sm' | 'md' | 'lg'
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty, className, dense, highlight }: { columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; empty?: ReactNode; className?: string; dense?: boolean; highlight?: (r: T) => boolean }) {
  const hide = (h?: 'sm' | 'md' | 'lg') => (h === 'sm' ? 'hidden sm:table-cell' : h === 'md' ? 'hidden md:table-cell' : h === 'lg' ? 'hidden lg:table-cell' : '')
  if (rows.length === 0) return <>{empty ?? <EmptyState title="No records" body="Nothing matches the current filters." />}</>
  return (
    <div className={cx('scrollbar-thin overflow-x-auto', className)}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.key} className={cx('caps px-3 py-2.5 text-[11px] font-medium whitespace-nowrap text-ink-3', c.align === 'end' ? 'text-end' : c.align === 'center' ? 'text-center' : 'text-start', hide(c.hideBelow))}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cx('border-b border-line last:border-b-0', onRowClick && 'cursor-pointer hover:bg-[#f9fafb]', highlight?.(r) && 'bg-[#fffaf0]')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('px-3 align-middle text-ink', dense ? 'py-2' : 'py-3', c.align === 'end' ? 'text-end' : c.align === 'center' ? 'text-center' : 'text-start', hide(c.hideBelow), c.className)}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- forms ---------- */

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[12px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-3">{hint}</span>}
    </label>
  )
}

const inputCls = 'w-full rounded-[6px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-ink-3 focus:border-action focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, 'h-10', props.className)} />
}

export function Select({ options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[] }) {
  return (
    <select {...props} className={cx(inputCls, 'h-10 pe-8', props.className)}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return (
          <option key={v} value={v}>
            {l}
          </option>
        )
      })}
    </select>
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cx(inputCls, 'py-2', props.className)} />
}

/* ---------- design language components ---------- */

export interface Step {
  label: string
  caption?: string
  date?: string
  state: 'done' | 'current' | 'future'
}

const STAGE_FILLS = ['bg-stage-1', 'bg-stage-2', 'bg-stage-3', 'bg-stage-4', 'bg-stage-5', 'bg-stage-6']

/** Chevron workflow stepper (design language 5.2). */
export function ChevronStepper({ steps, className, onStepClick }: { steps: Step[]; className?: string; onStepClick?: (i: number) => void }) {
  return (
    <div className={cx('scrollbar-thin overflow-x-auto', className)}>
      <div className="flex min-w-[640px]">
        {steps.map((s, i) => (
          <div key={s.label} className="min-w-0 flex-1" style={{ marginInlineStart: i === 0 ? 0 : -6 }}>
            <button
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(i)}
              className={cx(
                'flex h-10 w-full items-center justify-center px-5 text-[12px] font-semibold tracking-[0.03em] uppercase text-ink',
                i === 0 ? 'chevron-first' : 'chevron',
                s.state === 'future' ? 'bg-line' : STAGE_FILLS[i % STAGE_FILLS.length],
                onStepClick && 'cursor-pointer hover:brightness-95',
              )}
            >
              <span className={cx('flex items-center gap-1.5 truncate', s.state === 'future' && 'text-ink-3')}>
                {s.state === 'done' && <Check className="size-3.5" strokeWidth={2.5} />}
                {s.state === 'current' && <span className="pulse-soft size-2 rounded-full bg-ink" />}
                {s.label}
              </span>
            </button>
            <div className="mt-2 px-3">
              <div className={cx('text-[13px] font-medium', s.state === 'future' ? 'text-ink-3' : 'text-ink')}>{s.caption ?? (s.state === 'done' ? 'Completed' : s.state === 'current' ? 'Ongoing' : 'Not started')}</div>
              {s.date && <div className="text-[12px] text-ink-3">{s.date}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Key-value list (design language 5.6). */
export function KeyValue({ rows, className }: { rows: { icon?: LucideIcon; label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cx('divide-y divide-line', className)}>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[20px_minmax(110px,40%)_1fr] items-start gap-3 py-2.5">
          <span className="pt-0.5">{r.icon && <r.icon className="size-4 text-ink-3" strokeWidth={1.5} />}</span>
          <dt className="text-[13px] text-ink-2">{r.label}</dt>
          <dd className="min-w-0 text-[14px] break-words text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const FILE_META = {
  pdf: { color: 'var(--file-pdf)', icon: FileText, label: 'PDF' },
  sheet: { color: 'var(--file-sheet)', icon: FileSpreadsheet, label: 'XLSX' },
  doc: { color: 'var(--file-doc)', icon: FileText, label: 'DOCX' },
  slides: { color: 'var(--file-slides)', icon: Presentation, label: 'PPTX' },
  photo: { color: '#0f766e', icon: ImageIcon, label: 'JPG' },
}

/** File tile (design language 5.5). */
export function FileTile({ name, type, onClick, meta, photoSeed }: { name: string; type: keyof typeof FILE_META; onClick?: () => void; meta?: ReactNode; photoSeed?: number }) {
  const m = FILE_META[type]
  return (
    <div className="group min-w-0">
      <button type="button" onClick={onClick} className="relative block aspect-[4/3] w-full overflow-hidden rounded-[8px] bg-muted p-3 text-start hover:ring-2 hover:ring-[#1d4ed8]/20">
        {type === 'photo' ? (
          <SitePhoto seed={photoSeed ?? 1} className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="mx-auto flex h-full w-[70%] flex-col gap-1.5 rounded-[3px] bg-surface p-2.5 shadow-[0_0_0_1px_var(--border)]">
            <span className="h-1.5 w-3/4 rounded bg-[#e6e8ec]" />
            <span className="h-1.5 w-full rounded bg-[#eef0f3]" />
            <span className="h-1.5 w-5/6 rounded bg-[#eef0f3]" />
            <span className="h-1.5 w-2/3 rounded bg-[#eef0f3]" />
            <span className="mt-auto inline-flex w-fit items-center gap-1 rounded px-1 py-0.5 text-[9px] font-bold text-white" style={{ background: m.color }}>
              <m.icon className="size-2.5" />
              {m.label}
            </span>
          </div>
        )}
      </button>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-[12px] text-ink-2" title={name}>
          {name}
        </span>
        <MoreVertical className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
      </div>
      {meta && <div className="text-[11px] text-ink-3">{meta}</div>}
    </div>
  )
}

/** Illustrative site photo placeholder (SVG, no real imagery). */
export function SitePhoto({ seed = 1, className, label }: { seed?: number; className?: string; label?: string }) {
  const sky = ['#cfe3f3', '#dce9f2', '#e8eef3', '#d6e4ee'][seed % 4]
  const ground = ['#d9c39a', '#cdb48a', '#d4bf98', '#c9b089'][seed % 4]
  return (
    <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label ?? 'Site photo placeholder'}>
      <rect width="160" height="120" fill={sky} />
      <rect y="70" width="160" height="50" fill={ground} />
      <path d={`M0 72 Q40 ${62 + (seed % 3) * 3} 80 70 T160 68 V120 H0Z`} fill="#c2a878" opacity=".55" />
      {seed % 2 === 0 ? (
        <g>
          <rect x="18" y="78" width="124" height="9" rx="4.5" fill="#3f4a56" />
          <rect x="18" y="78" width="124" height="3" rx="1.5" fill="#6b7785" />
          <circle cx={60 + (seed % 5) * 8} cy="82.5" r="3" fill="#e0a526" />
        </g>
      ) : (
        <g>
          <rect x="20" y="80" width="56" height="8" rx="4" fill="#3f4a56" />
          <rect x="84" y="80" width="56" height="8" rx="4" fill="#3f4a56" />
          <rect x="74" y="78" width="12" height="12" rx="2" fill="#e0a526" opacity=".85" />
        </g>
      )}
      <rect x={110 - (seed % 4) * 6} y="46" width="22" height="16" rx="2" fill="#f2b705" />
      <rect x={113 - (seed % 4) * 6} y="40" width="10" height="8" rx="1.5" fill="#f2b705" />
      <circle cx={30 + (seed % 3) * 10} cy="62" r="3" fill="#7a5c3c" />
      <rect x={28 + (seed % 3) * 10} y="65" width="4" height="9" rx="1.5" fill="#ff7a1a" />
    </svg>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('my-4 border-line', className)} />
}

export function StatLine({ label, value, tone }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[13px]">
      <span className="text-ink-2">{label}</span>
      <span className={cx('tabular font-medium', tone ? TONE_TEXT[tone] : 'text-ink')}>{value}</span>
    </div>
  )
}

export function Loading({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cx('h-4', i % 3 === 2 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/** Delayed render to show a polished loading state for simulated fetches. */
export function useSimulatedLoad(ms = 450, dep?: unknown) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = window.setTimeout(() => setLoading(false), ms)
    return () => window.clearTimeout(t)
  }, [ms, dep])
  return loading
}

export function FilterChip({ active, children, onClick, count }: { active: boolean; children: ReactNode; onClick: () => void; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium whitespace-nowrap transition-colors', active ? 'border-shell bg-shell text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink')}
    >
      {children}
      {count !== undefined && <span className={cx('rounded-full px-1.5 text-[10px] leading-4', active ? 'bg-white/20' : 'bg-muted')}>{count}</span>}
    </button>
  )
}

export function LinkText({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} onClick={(e) => e.stopPropagation()} className={cx('font-medium text-action hover:underline', className)}>
      {children}
    </Link>
  )
}
