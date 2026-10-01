import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Info } from 'lucide-react'
import { cx } from '../../lib/format'

export const CHART = {
  primary: '#1d4ed8',
  compare: '#94a3b8',
  ok: '#15803d',
  warn: '#d97706',
  crit: '#b91c1c',
  grid: '#eef0f3',
  tick: { fontSize: 12, fill: '#7b7d81' },
  tooltip: { borderRadius: 8, border: '1px solid #e8eaee', fontSize: 12 },
}

/** Accessible on/off switch. */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50',
        checked ? 'bg-action' : 'bg-line-strong',
      )}
    >
      <span className={cx('inline-block size-4 rounded-full bg-white transition-transform', checked ? 'translate-x-[18px] rtl:-translate-x-[18px]' : 'translate-x-0.5 rtl:-translate-x-0.5')} />
    </button>
  )
}

/** Neutral information banner (no colour unless it is a status). */
export function Note({ children, icon: Icon = Info, tone = 'neutral', className }: { children: ReactNode; icon?: LucideIcon; tone?: 'neutral' | 'info' | 'warn'; className?: string }) {
  const t = tone === 'info' ? 'border-[#c9d7fb] bg-info-bg text-ink' : tone === 'warn' ? 'border-[#f5d9a8] bg-warn-bg text-ink' : 'border-line bg-muted text-ink-2'
  return (
    <div className={cx('flex items-start gap-2.5 rounded-[10px] border px-4 py-3 text-[13px]', t, className)}>
      <Icon className={cx('mt-0.5 size-4 shrink-0', tone === 'warn' ? 'text-warn' : tone === 'info' ? 'text-info' : 'text-ink-3')} strokeWidth={1.5} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Format minutes-of-day as "10:42 AM". */
export function ampm(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

/** Download a CSV built from headers and rows. Returns false if the browser blocks it. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): boolean {
  try {
    const esc = (v: string | number) => {
      const s = String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    return false
  }
}
