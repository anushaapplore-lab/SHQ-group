import { Smartphone } from 'lucide-react'
import { Pill } from '../ui'

export function FieldAppPill() {
  return (
    <Pill tone="info" className="!px-2 !text-[11px]">
      <Smartphone className="size-3" strokeWidth={1.75} /> Field App
    </Pill>
  )
}
