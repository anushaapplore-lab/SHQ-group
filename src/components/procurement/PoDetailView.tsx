import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Coins,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Package,
  Scale,
  Send,
  ShieldAlert,
  Sparkles,
  Truck,
  TrendingUp,
  Undo2,
  XCircle,
} from 'lucide-react'
import { deliveries, vendorIssues } from '../../data/procurement'
import { mtrs } from '../../data/quality'
import { fmtDate, num, sar } from '../../lib/format'
import { poExposure, poVariance, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { Button, Card, DataTable, DemoTag, EmptyState, Field, Input, KeyValue, LinkText, Modal, PageHeader, Pill, RagBadge, Select, StatusPill } from '../ui'
import { DeliveryText, SUGGESTED_ACTIONS, VENDOR_COMPARE, VarianceText, sarCompact, varianceTone } from './common'

export function PoDetailView() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useStore()
  const po = state.pos.find((p) => p.id === id)
  const [actionOpen, setActionOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [actionTitle, setActionTitle] = useState(SUGGESTED_ACTIONS[0])
  const [customTitle, setCustomTitle] = useState('')
  const [priceInput, setPriceInput] = useState('')

  if (!po) {
    return (
      <EmptyState
        title="Purchase order not found"
        body={`No purchase order with reference "${id}" exists in this demo dataset.`}
        action={
          <Button icon={ArrowLeft} onClick={() => navigate('/procurement/pos')}>
            Back to purchase orders
          </Button>
        }
      />
    )
  }

  const vendor = state.vendors.find((v) => v.id === po.vendorId)
  const v = poVariance(po)
  const showAlert = v > 5 && !po.recommendationDismissed
  const dismissed = v > 5 && po.recommendationDismissed
  const poDeliveries = deliveries.filter((d) => d.po === po.id)
  const issues = vendorIssues.filter((i) => i.vendorId === po.vendorId && (i.projectId === po.projectId || i.issue.includes(po.id)))
  const ncrIds = Array.from(new Set(issues.flatMap((i) => i.issue.match(/NCR-\d{5}/g) ?? [])))
  const relatedNcrs = ncrIds.map((nid) => state.ncrs.find((n) => n.id === nid)).filter((n) => !!n)
  const poMtrs = mtrs.filter((m) => m.po === po.id)
  const poActions = state.actions.filter((a) => a.sourceType === 'PO' && a.sourceId === po.id)
  const activity = state.activities.filter((a) => a.text.includes(po.id))
  const priceAlert = state.alerts.find((a) => a.sourceId === po.id && a.rule === 'PR-01')
  const approval = state.approvals.find((a) => a.linkId === po.id && a.status === 'Pending')

  const applyPrice = () => {
    const price = Number(priceInput)
    if (!(price > 0)) {
      actions.toast({ title: 'Enter a valid unit price', body: 'The price must be a positive number in SAR.', tone: 'error' })
      return
    }
    const nv = ((price - po.originalUnitPrice) / po.originalUnitPrice) * 100
    actions.updatePOPrice(po.id, price)
    actions.toast(
      nv > 5
        ? { title: `Rule PR-01 fired on ${po.id}`, body: `Variance now ${nv > 0 ? '+' : ''}${nv.toFixed(1)}%. Alert and recommendation updated.`, tone: 'warning' }
        : { title: 'Within 5% tolerance', body: `Variance now ${nv > 0 ? '+' : ''}${nv.toFixed(1)}%. Price alert resolved.`, tone: 'success' },
    )
    setPriceInput('')
  }

  const createAction = () => {
    const title = actionTitle === '__custom' ? customTitle.trim() : actionTitle.replace(/\.$/, '')
    if (!title) return
    actions.createVendorAction(po.id, `${title} (${vendor?.name ?? po.vendorId})`)
    setActionOpen(false)
    setCustomTitle('')
  }

  const isLinePipe = /pipe/i.test(po.material)

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Procurement', to: '/procurement' }, { label: 'Purchase orders', to: '/procurement/pos' }, { label: po.id }]}
        title={po.id}
        count={po.material}
        tag={<StatusPill status={po.status} />}
        subtitle={
          <span>
            {vendor ? <LinkText to={`/procurement/vendors/${vendor.id}`}>{vendor.name}</LinkText> : po.vendorId} · <LinkText to={`/projects/${po.projectId}`}>{projectName(state, po.projectId)}</LinkText> · Buyer {po.owner}
          </span>
        }
        actions={
          <>
            <Button icon={ClipboardList} variant="primary" onClick={() => setActionOpen(true)}>
              Create Vendor Action
            </Button>
            <Button icon={Scale} onClick={() => setCompareOpen(true)}>
              Compare Vendors
            </Button>
          </>
        }
      />

      <div className="grid [&>*]:min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          {showAlert && (
            <section className="rounded-[12px] border border-[#f3c5c5] bg-crit-bg/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-crit-bg">
                    <AlertTriangle className="size-[18px] text-crit" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <div className="caps text-[12px] text-crit">Automated Alert</div>
                    <p className="mt-1 text-[16px] font-semibold text-ink">Vendor price increased {v.toFixed(1)}% while PO remains active.</p>
                    <p className="mt-1 text-[13px] text-ink-2">
                      Rule PR-01 (vendor price change &gt; 5%) · Exposure {sar(poExposure(po))} on {num(po.qty)} {po.unit}s
                      {priceAlert && <> · {priceAlert.id} {priceAlert.status.toLowerCase()}</>}
                    </p>
                  </div>
                </div>
                {po.escalated && <Pill tone="crit">Escalated to Procurement Head</Pill>}
              </div>
            </section>
          )}

          {showAlert && (
            <Card
              title="Suggested Actions"
              icon={Sparkles}
              actions={<DemoTag>Demo Recommendation</DemoTag>}
            >
              <ol className="space-y-2.5">
                {SUGGESTED_ACTIONS.map((a, i) => (
                  <li key={a} className="flex items-start gap-3">
                    <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-ink">{i + 1}</span>
                    <span className="pt-0.5 text-[14px] text-ink">{a}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-dashed border-line-strong bg-[#fbfbfc] px-3 py-2.5 text-[13px] text-ink-2">
                <ShieldAlert className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                <span>
                  <span className="font-medium text-ink">Recommendation only: management approval required.</span> No commercial change is made until approved.
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" icon={ClipboardList} onClick={() => setActionOpen(true)}>
                  Create Vendor Action
                </Button>
                <Button icon={Scale} onClick={() => setCompareOpen(true)}>
                  Compare Vendors
                </Button>
                {po.escalated ? (
                  <Button icon={CheckCircle2} onClick={() => navigate('/approvals')}>
                    Escalated · view approval
                  </Button>
                ) : (
                  <Button variant="danger" icon={TrendingUp} onClick={() => actions.escalatePO(po.id)}>
                    Escalate
                  </Button>
                )}
                <Button variant="ghost" icon={XCircle} onClick={() => actions.dismissRecommendation(po.id)}>
                  Dismiss
                </Button>
              </div>
              {po.escalated && (
                <p className="mt-3 text-[13px] text-ink-2">
                  Decision request {approval ? <span className="font-medium text-ink">{approval.id}</span> : null} routed to the Approval Centre. <LinkText to="/approvals">Open Approval Centre</LinkText>
                </p>
              )}
            </Card>
          )}

          {dismissed && (
            <Card title="Recommendation dismissed" icon={XCircle}>
              <p className="text-[14px] text-ink-2">
                The PR-01 recommendation for a {v.toFixed(1)}% price increase was dismissed and the alert acknowledged. The rule re-fires if the vendor price changes.
              </p>
              <div className="mt-4">
                <Button icon={Undo2} onClick={() => actions.updatePOPrice(po.id, po.currentUnitPrice)}>
                  Restore
                </Button>
              </div>
            </Card>
          )}

          {v <= 5 && (
            <div className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-5 py-4">
              <CheckCircle2 className="size-[18px] shrink-0 text-ok" strokeWidth={1.5} />
              <p className="text-[14px] text-ink-2">
                Vendor price within the 5% PR-01 tolerance (<VarianceText value={v} />). No automated recommendation active.
              </p>
            </div>
          )}

          <Card title="Purchase order" icon={FileText}>
            <KeyValue
              rows={[
                { icon: Building2, label: 'Vendor', value: vendor ? <LinkText to={`/procurement/vendors/${vendor.id}`}>{vendor.name}</LinkText> : po.vendorId },
                { icon: Package, label: 'Material', value: po.material },
                { icon: Package, label: 'Quantity', value: `${num(po.qty)} ${po.unit}${po.qty === 1 ? '' : 's'}` },
                { icon: Coins, label: 'PO value', value: sarCompact(po.value) },
                { icon: Coins, label: 'Original unit price', value: sar(po.originalUnitPrice) },
                { icon: Coins, label: 'Current vendor price', value: sar(po.currentUnitPrice) },
                { icon: TrendingUp, label: 'Variance', value: <VarianceText value={v} /> },
                { icon: Gauge, label: 'Cost exposure', value: <span className={varianceTone(v) === 'crit' ? 'font-medium text-crit' : ''}>{sar(poExposure(po))}</span> },
                { icon: CalendarClock, label: 'Delivery due', value: fmtDate(po.deliveryDue) },
                { icon: Truck, label: 'Days late', value: <DeliveryText daysLate={po.daysLate} status={po.status} /> },
                { icon: ClipboardList, label: 'Status', value: <StatusPill status={po.status} /> },
                { icon: FolderKanban, label: 'Project', value: <LinkText to={`/projects/${po.projectId}`}>{projectName(state, po.projectId)}</LinkText> },
              ]}
            />
          </Card>

          <Card title="Linked records" icon={FolderKanban} bodyClassName="divide-y divide-line">
            <div className="p-5">
              <h4 className="caps mb-2 text-[12px] text-ink-3">Deliveries</h4>
              {poDeliveries.length === 0 ? (
                <p className="text-[13px] text-ink-3">No shipments booked against this PO yet.</p>
              ) : (
                <DataTable
                  dense
                  rows={poDeliveries}
                  rowKey={(d) => d.id}
                  onRowClick={() => navigate('/procurement/deliveries')}
                  columns={[
                    { key: 'id', header: 'Delivery', render: (d) => <span className="font-medium">{d.id}</span> },
                    { key: 'items', header: 'Items', render: (d) => d.items },
                    { key: 'eta', header: 'ETA', render: (d) => fmtDate(d.eta) },
                    { key: 'st', header: 'Status', render: (d) => <StatusPill status={d.status} /> },
                  ]}
                />
              )}
            </div>
            <div className="p-5">
              <h4 className="caps mb-2 text-[12px] text-ink-3">Vendor issues</h4>
              {issues.length === 0 ? (
                <p className="text-[13px] text-ink-3">No open vendor issues on this project.</p>
              ) : (
                <ul className="space-y-2">
                  {issues.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                      <span className="min-w-0">
                        <span className="font-medium text-ink">{i.id}</span> <span className="text-ink-2">{i.issue}</span>
                      </span>
                      <StatusPill status={i.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-5">
              <h4 className="caps mb-2 text-[12px] text-ink-3">Related NCRs</h4>
              {relatedNcrs.length === 0 ? (
                <p className="text-[13px] text-ink-3">No NCRs linked to this PO.</p>
              ) : (
                <ul className="space-y-2">
                  {relatedNcrs.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                      <span className="min-w-0">
                        <LinkText to={`/quality/ncrs/${n.id}`}>{n.id}</LinkText> <span className="text-ink-2">{n.title}</span>
                      </span>
                      <StatusPill status={n.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-5">
              <h4 className="caps mb-2 text-[12px] text-ink-3">Mill test reports</h4>
              {poMtrs.length === 0 ? (
                <p className="text-[13px] text-ink-3">No MTRs received against this PO.</p>
              ) : (
                <ul className="space-y-2">
                  {poMtrs.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                      <span className="min-w-0">
                        <span className="font-medium text-ink">{m.id}</span> <span className="text-ink-2">Heat {m.heat} · {fmtDate(m.date)}</span>
                      </span>
                      <StatusPill status={m.verified} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-5">
              <h4 className="caps mb-2 text-[12px] text-ink-3">Schedule impact</h4>
              {po.id === 'PO-450021' ? (
                <p className="text-[14px] text-ink-2">
                  <span className="font-medium text-ink">Welding work package</span>: 43 joints waiting on batch 3 line pipe on Spread 2.{' '}
                  <LinkText to="/projects/NPE?tab=progress">View project progress</LinkText>
                </p>
              ) : po.daysLate > 0 ? (
                <p className="text-[14px] text-ink-2">
                  {po.daysLate}-day delivery slip may affect the dependent work package.{' '}
                  <LinkText to={`/projects/${po.projectId}?tab=progress`}>View project progress</LinkText>
                </p>
              ) : (
                <p className="text-[13px] text-ink-3">No schedule impact forecast.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Price change simulator" icon={Gauge} actions={<DemoTag>State behaviour demo</DemoTag>}>
            <p className="text-[13px] text-ink-2">
              Simulate a vendor price notice. Variance recalculates, rule PR-01 raises, updates or resolves the alert, and the recommendation appears above 5%.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[8px] bg-muted px-3 py-2">
                <div className="text-[12px] text-ink-2">PO rate</div>
                <div className="tabular text-[15px] font-semibold text-ink">{sar(po.originalUnitPrice)}</div>
              </div>
              <div className="rounded-[8px] bg-muted px-3 py-2">
                <div className="text-[12px] text-ink-2">Current</div>
                <div className="tabular text-[15px] font-semibold text-ink">
                  {sar(po.currentUnitPrice)} <VarianceText value={v} className="text-[13px]" />
                </div>
              </div>
            </div>
            <form
              className="mt-4 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                applyPrice()
              }}
            >
              <Field label="New vendor unit price (SAR)" className="min-w-0 flex-1">
                <Input type="number" min={1} inputMode="decimal" placeholder={String(po.currentUnitPrice)} value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
              </Field>
              <Button type="submit" variant="primary" className="h-10">
                Apply
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPriceInput(String(po.originalUnitPrice))}>
                Reset to PO rate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPriceInput(String(Math.round(po.originalUnitPrice * 1.115)))}>
                +11.5%
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPriceInput(String(Math.round(po.originalUnitPrice * 1.03)))}>
                +3%
              </Button>
            </div>
          </Card>

          <Card title="Vendor actions" icon={ClipboardList} subtitle={`${poActions.length} on this PO`}>
            {poActions.length === 0 ? (
              <p className="text-[13px] text-ink-3">No vendor actions yet. Use Create Vendor Action to assign one.</p>
            ) : (
              <ul className="space-y-3">
                {poActions.map((a) => (
                  <li key={a.id} className="text-[14px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{a.id}</span>
                      <StatusPill status={a.status} />
                    </div>
                    <div className="text-ink-2">{a.title}</div>
                    <div className="text-[12px] text-ink-3">
                      {a.owner} · due {fmtDate(a.dueDate)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="PO activity" icon={History}>
            {activity.length === 0 ? (
              <p className="text-[13px] text-ink-3">No activity recorded.</p>
            ) : (
              <ol className="relative space-y-4 border-s border-line ps-5">
                {activity.slice(0, 10).map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -start-[25px] top-1.5 size-2.5 rounded-full bg-action ring-4 ring-surface" />
                    <div className="text-[14px] text-ink">{a.text}</div>
                    <div className="mt-0.5 text-[12px] text-ink-3">
                      {a.time} · {a.user}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        title="Create vendor action"
        subtitle={`${po.id} · ${vendor?.name ?? ''}`}
        footer={
          <>
            <Button onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Send} disabled={actionTitle === '__custom' && !customTitle.trim()} onClick={createAction}>
              Create action
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Action">
            <Select
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              options={[...SUGGESTED_ACTIONS.map((a) => ({ value: a, label: a.replace(/\.$/, '') })), { value: '__custom', label: 'Custom action…' }]}
            />
          </Field>
          {actionTitle === '__custom' && (
            <Field label="Describe the action">
              <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. Request revised Incoterms (DAP Dammam)" />
            </Field>
          )}
          <p className="text-[13px] text-ink-2">Assigned to Procurement Manager, due in 3 days, priority High. The action is logged on the PO and appears in the action tracker.</p>
        </div>
      </Modal>

      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        width={860}
        title="Compare vendors"
        subtitle={`${po.material} · ${num(po.qty)} ${po.unit}s`}
        footer={
          <>
            <DemoTag className="me-auto">Illustrative Data</DemoTag>
            <Button onClick={() => setCompareOpen(false)}>Close</Button>
          </>
        }
      >
        <DataTable
          rows={state.vendors}
          rowKey={(x) => x.id}
          highlight={(x) => x.id === 'V-DPM'}
          columns={[
            {
              key: 'v',
              header: 'Vendor',
              render: (x) => (
                <div className="min-w-[170px]">
                  <div className="flex flex-wrap items-center gap-1.5 font-medium">
                    {x.name}
                    {x.id === 'V-DPM' && <Pill tone="ok">Recommended</Pill>}
                  </div>
                  <div className="text-[12px] text-ink-3">{VENDOR_COMPARE[x.id]?.note}</div>
                </div>
              ),
            },
            {
              key: 'p',
              header: 'Unit price est.',
              align: 'end',
              render: (x) => {
                const c = VENDOR_COMPARE[x.id]
                const price = !c || c.factor === 0 || x.id === po.vendorId ? po.currentUnitPrice : Math.round(po.originalUnitPrice * (isLinePipe ? c.factor : c.factor - 0.01))
                return <span className="tabular">{sar(price)}</span>
              },
            },
            { key: 'l', header: 'Lead time', align: 'end', render: (x) => <span className="tabular">{VENDOR_COMPARE[x.id]?.lead ?? 30} d</span> },
            { key: 'd', header: 'Delivery', align: 'end', render: (x) => <span className="tabular">{x.delivery}%</span> },
            { key: 'q', header: 'Quality', align: 'end', render: (x) => <span className="tabular">{x.quality}%</span> },
            { key: 's', header: 'Price stability', align: 'end', render: (x) => <span className="tabular">{x.priceStability}%</span> },
            { key: 'r', header: 'Status', render: (x) => <RagBadge rag={x.rating} /> },
            { key: 'a', header: 'Approved', render: (x) => (x.approved ? <Pill tone="ok">Approved</Pill> : <Pill>Not approved</Pill>) },
            {
              key: 'act',
              header: '',
              render: (x) =>
                x.id === po.vendorId ? (
                  <span className="text-[12px] text-ink-3">Current</span>
                ) : (
                  <Button size="sm" onClick={() => actions.toast({ title: 'Quotation requested', body: `RFQ for ${po.material} sent to ${x.name} (simulated).`, tone: 'success' })}>
                    Request quotation
                  </Button>
                ),
            },
          ]}
        />
        <p className="mt-3 text-[13px] text-ink-2">
          Desert Pipeline Materials offers the best combined lead time and price stability with stock at Dammam. Any re-award needs Procurement Head approval. <Link to="/procurement/vendors/V-DPM" className="font-medium text-action hover:underline">View scorecard</Link>
        </p>
      </Modal>
    </div>
  )
}
