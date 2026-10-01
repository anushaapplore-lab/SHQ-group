import type { ReactNode } from 'react'
import { BatteryMedium, Camera, Check, ChevronLeft, Minus, Plus, RefreshCw, Signal, Wifi } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '../../lib/format'
import { HazardPhoto } from '../hse/HazardPhoto'
import { SitePhoto } from '../ui'

/** Device frame used on tablet/desktop viewports. */
export function PhoneFrame({ children, online }: { children: ReactNode; online: boolean }) {
  return (
    <div
      className="relative flex shrink-0 flex-col overflow-hidden rounded-[40px] border-[10px] border-[#1b2333] bg-[#1b2333]"
      style={{ width: 390, height: 'min(844px, calc(100dvh - 48px))', boxShadow: '0 30px 60px -30px rgba(11,21,48,.45)' }}
    >
      <div className="flex h-9 shrink-0 items-center justify-between bg-shell px-6 text-[12px] font-semibold text-white">
        <span className="tabular">10:42</span>
        <span className="absolute start-1/2 top-2 h-[22px] w-[96px] -translate-x-1/2 rounded-full bg-[#0b0f18] rtl:translate-x-1/2" />
        <span className="flex items-center gap-1.5">
          <Signal className="size-3.5" strokeWidth={2} />
          {online && <Wifi className="size-3.5" strokeWidth={2} />}
          <BatteryMedium className="size-4" strokeWidth={2} />
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-[30px] bg-canvas">{children}</div>
    </div>
  )
}

export interface NavTab {
  id: string
  label: string
  icon: LucideIcon
  badge?: number
}

export function BottomNav({ tabs, active, onChange }: { tabs: NavTab[]; active: string; onChange: (id: string) => void }) {
  return (
    <nav className="flex shrink-0 border-t border-line bg-surface pb-[max(env(safe-area-inset-bottom),6px)]" aria-label="Field app">
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-current={on ? 'page' : undefined}
            className={cx('relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium', on ? 'text-shell' : 'text-ink-3')}
          >
            {on && <span className="absolute top-0 h-[3px] w-10 rounded-b-full bg-shell" />}
            <span className="relative">
              <t.icon className="size-6" strokeWidth={on ? 2 : 1.5} />
              {!!t.badge && t.badge > 0 && (
                <span className="absolute -end-2.5 -top-1.5 min-w-[18px] rounded-full bg-[#d97706] px-1 text-center text-[10px] leading-[18px] font-bold text-white">{t.badge}</span>
              )}
            </span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

export function ScreenTitle({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Back" className="-ms-2 flex size-11 items-center justify-center rounded-full text-ink hover:bg-muted">
          <ChevronLeft className="size-6 rtl:rotate-180" strokeWidth={1.75} />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-[20px] font-semibold text-ink">{title}</h1>
      {right}
    </div>
  )
}

export function MCard({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = cx('rounded-[14px] border border-line bg-surface p-4', onClick && 'w-full text-start active:bg-muted', className)
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children}
      </button>
    )
  return <div className={cls}>{children}</div>
}

export function MLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('caps mb-2 text-[11px] text-ink-3', className)}>{children}</div>
}

export function Stepper({ label, value, onChange, step = 1, min = 0, unit }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; unit?: string }) {
  return (
    <div>
      <MLabel>{label}</MLabel>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - step))} className="flex size-14 items-center justify-center rounded-[12px] border border-line bg-surface text-ink active:bg-muted">
          <Minus className="size-6" strokeWidth={1.75} />
        </button>
        <div className="flex h-14 flex-1 items-center justify-center rounded-[12px] border border-line bg-surface">
          <span className="tabular text-[24px] font-semibold text-ink">{value}</span>
          {unit && <span className="ms-1.5 text-[14px] text-ink-3">{unit}</span>}
        </div>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + step)} className="flex size-14 items-center justify-center rounded-[12px] border border-line bg-surface text-ink active:bg-muted">
          <Plus className="size-6" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

export function Chips<T extends string>({ label, options, value, onChange, multi, tone }: { label: string; options: T[]; value: T[]; onChange: (v: T[]) => void; multi?: boolean; tone?: (o: T) => string }) {
  return (
    <div>
      <MLabel>{label}</MLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o)
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
              className={cx(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium',
                on ? (tone ? tone(o) : 'border-shell bg-shell text-white') : 'border-line bg-surface text-ink-2 active:bg-muted',
              )}
            >
              {on && multi && <Check className="size-4" strokeWidth={2.25} />}
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Segment<T extends string>({ label, options, value, onChange, tone }: { label: string; options: T[]; value: T; onChange: (v: T) => void; tone?: (o: T) => string }) {
  return (
    <div>
      <MLabel>{label}</MLabel>
      <div className="flex rounded-[12px] border border-line bg-muted p-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={o === value}
            onClick={() => onChange(o)}
            className={cx('min-h-12 flex-1 rounded-[9px] text-[15px] font-semibold', o === value ? (tone ? tone(o) : 'bg-surface text-ink shadow-[0_0_0_1px_var(--border)]') : 'text-ink-2')}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BigSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <MLabel>{label}</MLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-14 w-full rounded-[12px] border border-line bg-surface px-4 text-[16px] text-ink focus:border-action focus:outline-none">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function BigInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <MLabel>{label}</MLabel>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-14 w-full rounded-[12px] border border-line bg-surface px-4 text-[16px] text-ink placeholder:text-ink-3 focus:border-action focus:outline-none" />
    </label>
  )
}

export function CheckRow({ label, checked, onChange, sub }: { label: string; checked: boolean; onChange: () => void; sub?: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange} className="flex min-h-14 w-full items-center gap-3 px-1 py-2 text-start">
      <span className={cx('flex size-7 shrink-0 items-center justify-center rounded-[8px] border-2', checked ? 'border-ok bg-ok text-white' : 'border-line-strong bg-surface')}>
        {checked && <Check className="size-4.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx('block text-[15px]', checked ? 'text-ink-3 line-through' : 'text-ink')}>{label}</span>
        {sub && <span className="block text-[12px] text-ink-3">{sub}</span>}
      </span>
    </button>
  )
}

/** Camera placeholder tile. `photo` is the captured key or null. */
export function CameraTile({ photo, onCapture, onClear, capturing }: { photo: string | null; onCapture: () => void; onClear: () => void; capturing?: boolean }) {
  if (photo)
    return (
      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        {photo === 'suspended-load' ? <HazardPhoto className="aspect-[16/10] w-full" /> : <SitePhoto seed={parseInt(photo.replace(/\D/g, ''), 10) || 2} className="aspect-[16/10] w-full" />}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="flex items-center gap-1.5 text-[13px] text-ok">
            <Check className="size-4" strokeWidth={2.25} /> Photo captured · GPS tagged
          </span>
          <button type="button" onClick={onClear} className="flex min-h-10 items-center gap-1 px-2 text-[13px] font-semibold text-action">
            <RefreshCw className="size-3.5" strokeWidth={2} /> Retake
          </button>
        </div>
      </div>
    )
  return (
    <button type="button" onClick={onCapture} disabled={capturing} className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-line-strong bg-surface text-ink-2 active:bg-muted">
      <span className={cx('flex size-14 items-center justify-center rounded-full bg-shell text-white', capturing && 'pulse-soft')}>
        <Camera className="size-7" strokeWidth={1.75} />
      </span>
      <span className="text-[15px] font-semibold text-ink">{capturing ? 'Capturing…' : 'Tap to take photo'}</span>
      <span className="text-[12px] text-ink-3">Camera placeholder</span>
    </button>
  )
}

export function BigButton({ children, onClick, variant = 'primary', icon: Icon, disabled, className }: { children: ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' | 'success' | 'danger'; icon?: LucideIcon; disabled?: boolean; className?: string }) {
  const v = {
    primary: 'bg-action text-white active:bg-action-hover',
    secondary: 'border border-line bg-surface text-ink active:bg-muted',
    success: 'bg-ok text-white',
    danger: 'border border-[#f3c5c5] bg-surface text-crit',
  }[variant]
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cx('caps flex min-h-14 w-full items-center justify-center gap-2 rounded-[12px] px-4 text-[15px] disabled:opacity-50', v, className)}>
      {Icon && <Icon className="size-5" strokeWidth={1.75} />}
      {children}
    </button>
  )
}
