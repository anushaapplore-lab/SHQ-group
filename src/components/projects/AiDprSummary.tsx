import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react'
import { useStore } from '../../store/store'
import { Button, Card, DemoTag, Loading } from '../ui'

export const AI_DPR_TEXT =
  'North Pipeline Expansion achieved 2.4% progress today against a planned 2.8%. Pipe laying remained on schedule, while welding productivity was 11% below target due to inspection waiting time. Two work fronts remain at risk of affecting the weekly look-ahead.'
const RISKS = ['Inspection bottleneck', 'Welding productivity below target', 'Potential 2-day impact']
const ACTIONS = ['Increase NDT inspection availability', 'Review welding crew allocation', 'Re-sequence affected work front']

/** "Generate AI DPR Summary" block (brief §10). Simulated and deterministic. */
export function AiDprSummary({ className }: { className?: string }) {
  const { state, actions } = useStore()
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>(state.aiDprGenerated ? 'done' : 'idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const generate = () => {
    setPhase('loading')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setPhase('done')
      actions.setAiDprGenerated()
    }, 900)
  }

  return (
    <Card
      className={className}
      title="AI Daily Progress Summary"
      icon={Sparkles}
      subtitle="North Pipeline Expansion · 1 Oct 2026"
      actions={
        phase === 'done' ? (
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={generate}>
            Regenerate
          </Button>
        ) : (
          <Button size="sm" variant="primary" icon={Sparkles} onClick={generate} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Generating…' : 'Generate AI DPR Summary'}
          </Button>
        )
      }
    >
      {phase === 'idle' && (
        <p className="text-[13px] text-ink-2">
          Consolidates today's DPRs, inspection results and crew productivity into a management summary with detected risks and suggested actions.
        </p>
      )}
      {phase === 'loading' && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-[13px] text-ink-2">
            <Sparkles className="pulse-soft size-4 text-[#5b3fb5]" strokeWidth={1.5} />
            Generating… reading 6 DPRs, 14 inspections and crew timesheets
          </p>
          <Loading lines={4} />
        </div>
      )}
      {phase === 'done' && (
        <div className="anim-fade">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-semibold text-ink">AI Generated Summary</h4>
            <DemoTag>Demo AI Analysis</DemoTag>
          </div>
          <p className="rounded-[8px] bg-muted px-4 py-3 text-[14px] leading-relaxed text-ink">{AI_DPR_TEXT}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h5 className="caps mb-2 text-[12px] text-ink-3">Detected risks</h5>
              <ul className="space-y-2">
                {RISKS.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-[13px] text-ink">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" strokeWidth={1.5} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="caps mb-2 text-[12px] text-ink-3">Suggested actions</h5>
              <ul className="space-y-2">
                {ACTIONS.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-[13px] text-ink">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={1.5} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => actions.toast({ title: 'Summary shared', body: 'AI DPR summary sent to Project Director and QA/QC Manager (demo).', tone: 'success' })}
            >
              Share with leadership
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.dispatchEvent(new Event('shq:open-ai'))}>
              Ask AI follow-up
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
