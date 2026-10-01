import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, ExternalLink, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SUGGESTED, SUGGESTED_AR, answer } from '../../ai/engine'
import type { AiAnswer } from '../../ai/engine'
import { useT } from '../../i18n'
import { cx } from '../../lib/format'
import { useStore } from '../../store/store'
import { DemoTag } from '../ui'

interface Msg {
  id: number
  role: 'user' | 'ai'
  text?: string
  answer?: AiAnswer
}

export function AiAnswerView({ a, onNavigate }: { a: AiAnswer; onNavigate?: () => void }) {
  return (
    <div dir={a.rtl ? 'rtl' : undefined} className="space-y-3 text-[14px] leading-relaxed text-ink">
      {a.intro.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {a.sections.map((sec) => (
        <div key={sec.heading}>
          <p className="font-semibold">{sec.heading}</p>
          {sec.ordered ? (
            <ol className="mt-1 list-decimal space-y-1 ps-5">
              {sec.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ol>
          ) : (
            <ul className="mt-1 list-disc space-y-1 ps-5">
              {sec.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {a.links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {a.links.map((l) => (
            <Link key={l.to} to={l.to} onClick={onNavigate} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-action hover:bg-muted">
              {l.label}
              <ExternalLink className="size-3" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AiChat({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { state } = useStore()
  const t = useT()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const seq = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, thinking])

  const ask = (q: string) => {
    const text = q.trim()
    if (!text || thinking) return
    seq.current += 1
    setMsgs((m) => [...m, { id: seq.current, role: 'user', text }])
    setInput('')
    setThinking(true)
    window.setTimeout(() => {
      seq.current += 1
      const id = seq.current
      setMsgs((m) => [...m, { id, role: 'ai', answer: answer(text, stateRef.current) }])
      setThinking(false)
    }, 650)
  }

  const suggestions = state.lang === 'ar' ? [...SUGGESTED_AR, ...SUGGESTED.slice(0, 4)] : SUGGESTED

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <div>
            <div className="mb-4 rounded-[10px] bg-muted p-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Sparkles className="size-4 text-[#5b3fb5]" /> {t('SHQ Intelligence')}
              </div>
              <p className="mt-1 text-[13px] text-ink-2">Ask about schedule, quality, HSE, procurement, manpower or handover. Answers are deterministic and drawn from the shared demo record store.</p>
            </div>
            <p className="caps mb-2 text-[11px] text-ink-3">{t('Suggested questions')}</p>
            <div className={cx('grid gap-2', !compact && 'sm:grid-cols-2')}>
              {suggestions.map((q) => (
                <button key={q} type="button" onClick={() => ask(q)} dir={/[؀-ۿ]/.test(q) ? 'rtl' : undefined} className="rounded-[8px] border border-line bg-surface px-3 py-2.5 text-start text-[13px] text-ink hover:border-line-strong hover:bg-muted">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div dir={/[؀-ۿ]/.test(m.text ?? '') ? 'rtl' : undefined} className="max-w-[85%] rounded-[12px] rounded-ee-[4px] bg-shell px-3.5 py-2.5 text-[14px] text-white">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#efe9ff]">
                <Bot className="size-4 text-[#5b3fb5]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1 rounded-[12px] border border-line bg-surface p-3.5">
                {m.answer && <AiAnswerView a={m.answer} onNavigate={onNavigate} />}
                <div className="mt-3 border-t border-line pt-2">
                  <DemoTag>{t('AI-generated analysis based on current demo data.')}</DemoTag>
                </div>
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-2 text-[13px] text-ink-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-[#efe9ff]">
              <Bot className="size-4 text-[#5b3fb5]" />
            </div>
            <span className="pulse-soft">Analysing portfolio records…</span>
          </div>
        )}
        {msgs.length > 0 && !thinking && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions
              .filter((q) => !msgs.some((m) => m.text === q))
              .slice(0, 3)
              .map((q) => (
                <button key={q} type="button" onClick={() => ask(q)} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-2 hover:text-ink">
                  {q}
                </button>
              ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form
        className="border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <div className="flex items-center gap-2 rounded-[10px] border border-line bg-surface p-1.5 ps-3 focus-within:border-action">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('Ask SHQ Intelligence…')} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3" aria-label="Ask SHQ Intelligence" />
          <button type="submit" disabled={!input.trim() || thinking} aria-label="Send" className="flex size-8 items-center justify-center rounded-[8px] bg-action text-white disabled:opacity-40">
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-ink-3">Simulated assistant. No live AI model is connected.</p>
      </form>
    </div>
  )
}

export function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="anim-fade fixed inset-0 z-[55] flex justify-end bg-[#0b1530]/25" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="anim-slide flex h-full w-full max-w-[460px] flex-col border-s border-line bg-[#fbfbfc]">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-[8px] bg-[#efe9ff]">
              <Sparkles className="size-4 text-[#5b3fb5]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">{t('SHQ Intelligence')}</p>
              <p className="text-[12px] text-ink-3">AI Command Assistant · demo mode</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close assistant" className="rounded-[6px] p-1 text-ink-2 hover:bg-muted">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <AiChat compact onNavigate={onClose} />
      </aside>
    </div>
  )
}
