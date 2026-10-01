import { useState } from 'react'
import { Building2, Settings2 } from 'lucide-react'
import { Button, Card, DemoTag, Field, Input, Modal, PageHeader, Pill, ProgressBar, Select } from '../ui'
import { useStore } from '../../store/store'
import { Note } from './shared'

const CLIENTS = ['Aramco', 'SABIC', 'SEC'] as const
type Client = (typeof CLIENTS)[number]

const ITEMS = ['Inspection checklist', 'HSE format', 'DPR format', 'Handover requirements', 'Document naming rules', 'Report format'] as const
type Item = (typeof ITEMS)[number]

interface PackConfig {
  configured: boolean
  template: string
  version: string
  base: string
  mapping: Record<string, string>
}

const MAPPING_FIELDS: Record<Item, string[]> = {
  'Inspection checklist': ['Inspection reference', 'Discipline', 'Acceptance criteria', 'Inspector signature'],
  'HSE format': ['Observation category', 'Severity scale', 'Corrective action', 'Close-out evidence'],
  'DPR format': ['Work package', 'Manpower', 'Quantity completed', 'Delay cause'],
  'Handover requirements': ['MDR category', 'Document type', 'Approval status', 'Turnover package'],
  'Document naming rules': ['Project code', 'Discipline code', 'Document type code', 'Sequence / revision'],
  'Report format': ['Report header', 'KPI block', 'Period', 'Distribution list'],
}

const BASES = ['SHQ standard template', 'Blank template', 'Copy from another client pack']

const INITIAL: Record<Client, Item[]> = {
  Aramco: ['Inspection checklist', 'HSE format', 'Handover requirements'],
  SABIC: ['DPR format', 'Report format'],
  SEC: ['Inspection checklist'],
}

function initial(): Record<string, PackConfig> {
  const out: Record<string, PackConfig> = {}
  CLIENTS.forEach((c) =>
    ITEMS.forEach((i) => {
      const on = INITIAL[c].includes(i)
      out[`${c}|${i}`] = {
        configured: on,
        template: on ? `${c} ${i} (placeholder)` : '',
        version: on ? 'v0.1 draft' : '',
        base: BASES[0],
        mapping: Object.fromEntries(MAPPING_FIELDS[i].map((f) => [f, on ? f : ''])),
      }
    }),
  )
  return out
}

export function FormatPacksPage() {
  const { actions } = useStore()
  const [packs, setPacks] = useState<Record<string, PackConfig>>(initial)
  const [editing, setEditing] = useState<{ client: Client; item: Item } | null>(null)
  const [draft, setDraft] = useState<PackConfig | null>(null)

  function open(client: Client, item: Item) {
    const cur = packs[`${client}|${item}`]
    setEditing({ client, item })
    setDraft({
      ...cur,
      template: cur.template || `${client} ${item} (placeholder)`,
      version: cur.version || 'v0.1 draft',
      mapping: { ...cur.mapping },
    })
  }

  function close() {
    setEditing(null)
    setDraft(null)
  }

  function save() {
    if (!editing || !draft) return
    setPacks((p) => ({ ...p, [`${editing.client}|${editing.item}`]: { ...draft, configured: true } }))
    actions.toast({ title: `${editing.client}: ${editing.item} configured`, body: `${draft.template} ${draft.version} saved as a placeholder mapping.`, tone: 'success' })
    close()
  }

  function clear() {
    if (!editing) return
    setPacks((p) => ({ ...p, [`${editing.client}|${editing.item}`]: { ...p[`${editing.client}|${editing.item}`], configured: false } }))
    actions.toast({ title: `${editing.client}: ${editing.item} set to not configured`, tone: 'info' })
    close()
  }

  return (
    <div>
      <PageHeader
        title="Format Packs"
        crumbs={[{ label: 'Settings' }, { label: 'Format Packs' }]}
        subtitle="Map platform records to each client's inspection, HSE, DPR, handover, naming and report formats."
        tag={<DemoTag>Placeholder formats</DemoTag>}
      />

      <Note tone="warn" className="mb-6">
        <span className="font-medium text-ink">Client format packs are placeholders.</span> Actual client requirements have not been provided or verified. Each pack must be configured from the
        client's issued documents during rollout.
      </Note>

      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        {CLIENTS.map((c) => {
          const done = ITEMS.filter((i) => packs[`${c}|${i}`].configured).length
          return (
            <Card key={c} title={c} icon={Building2} subtitle="Client format pack" actions={<span className="tabular text-[12px] text-ink-2">{done} of {ITEMS.length} configured</span>} bodyClassName="p-0">
              <div className="px-5 pt-4 pb-2">
                <ProgressBar value={(done / ITEMS.length) * 100} tone={done === ITEMS.length ? 'ok' : 'info'} />
              </div>
              <ul className="divide-y divide-line">
                {ITEMS.map((i) => {
                  const p = packs[`${c}|${i}`]
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] text-ink">{i}</div>
                        <div className="mt-0.5 truncate text-[12px] text-ink-3">{p.configured ? `${p.template} · ${p.version}` : 'No template mapped'}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Pill tone={p.configured ? 'ok' : 'neutral'} dot>
                          {p.configured ? 'Configured' : 'Not configured'}
                        </Pill>
                        <Button size="sm" variant="ghost" icon={Settings2} onClick={() => open(c, i)} aria-label={`Configure ${c} ${i}`}>
                          <span className="hidden sm:inline">Configure</span>
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>

      {editing && draft && (
        <Modal
          open
          onClose={close}
          title={`Configure ${editing.item}`}
          subtitle={`${editing.client} format pack · placeholder mapping`}
          width={620}
          footer={
            <>
              {packs[`${editing.client}|${editing.item}`].configured && (
                <Button variant="danger" onClick={clear} className="me-auto">
                  Mark not configured
                </Button>
              )}
              <Button onClick={close}>Cancel</Button>
              <Button variant="primary" onClick={save} disabled={!draft.template.trim()}>
                Save configuration
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template name">
                <Input value={draft.template} onChange={(e) => setDraft({ ...draft, template: e.target.value })} />
              </Field>
              <Field label="Version">
                <Input value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
              </Field>
            </div>
            <Field label="Start from">
              <Select options={BASES} value={draft.base} onChange={(e) => setDraft({ ...draft, base: e.target.value })} />
            </Field>
            <div>
              <div className="caps mb-2 text-[12px] text-ink-2">Field mapping</div>
              <div className="divide-y divide-line rounded-[10px] border border-line">
                <div className="grid grid-cols-2 gap-3 bg-muted px-3 py-2 text-[11px] font-medium text-ink-3">
                  <span>Platform field</span>
                  <span>Client form field</span>
                </div>
                {MAPPING_FIELDS[editing.item].map((f) => (
                  <div key={f} className="grid grid-cols-2 items-center gap-3 px-3 py-2">
                    <span className="truncate text-[13px] text-ink">{f}</span>
                    <Input value={draft.mapping[f] ?? ''} placeholder="Client field name" className="!h-9 text-[13px]" onChange={(e) => setDraft({ ...draft, mapping: { ...draft.mapping, [f]: e.target.value } })} />
                  </div>
                ))}
              </div>
            </div>
            <Note>Placeholder only. Field names must be confirmed against the client's issued format before use on a live project.</Note>
          </div>
        </Modal>
      )}
    </div>
  )
}
