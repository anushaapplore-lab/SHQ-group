import { Link, useNavigate, useParams } from 'react-router-dom'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Building2, ClipboardList, Copy, FileWarning, Mail, Phone, ShieldCheck, Tag, TrendingUp, User } from 'lucide-react'
import { vendorIssues } from '../../data/procurement'
import { fmtDate } from '../../lib/format'
import { poExposure, poVariance, projectName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { Button, Card, DataTable, EmptyState, KeyValue, PageHeader, Pill, RagBadge, StatusPill } from '../../components/ui'
import { CHART, DeliveryText, MiniStat, ScoreBar, VarianceText, sarCompact } from '../../components/procurement/common'

const ragLabel = { GREEN: 'Green', AMBER: 'Amber', RED: 'Red' } as const

export function VendorsPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: 'Procurement', to: '/procurement' }, { label: 'Vendors' }]} title="Vendor scorecards" count={state.vendors.length} subtitle="Delivery, quality, price stability and responsiveness over the last six months." />
      <div className="grid [&>*]:min-w-0 gap-4 md:grid-cols-2">
        {state.vendors.map((v) => {
          const pos = state.pos.filter((p) => p.vendorId === v.id)
          const open = pos.filter((p) => p.status !== 'Delivered')
          return (
            <button key={v.id} type="button" onClick={() => navigate(`/procurement/vendors/${v.id}`)} className="rounded-[12px] border border-line bg-surface p-5 text-start transition-colors hover:border-line-strong hover:bg-[#fcfcfd]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-semibold text-ink">{v.name}</div>
                  <div className="truncate text-[13px] text-ink-2">{v.category}</div>
                </div>
                <RagBadge rag={v.rating} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ScoreBar label="Delivery performance" value={v.delivery} />
                <ScoreBar label="Quality" value={v.quality} />
                <ScoreBar label="Price stability" value={v.priceStability} />
                <ScoreBar label="Responsiveness" value={v.responsiveness} />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-3">
                <span>{open.length} open POs</span>
                <span>{v.ncrCount} NCRs</span>
                <span>Avg resolution {v.avgResolutionDays} d</span>
                {v.approved && <span className="text-ok">Approved vendor</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function VendorDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useStore()
  const v = state.vendors.find((x) => x.id === id)
  if (!v) {
    return (
      <EmptyState
        title="Vendor not found"
        body={`No vendor with reference "${id}" exists in this demo dataset.`}
        action={
          <Button icon={ArrowLeft} onClick={() => navigate('/procurement/vendors')}>
            Back to vendors
          </Button>
        }
      />
    )
  }
  const pos = state.pos.filter((p) => p.vendorId === v.id)
  const issues = vendorIssues.filter((i) => i.vendorId === v.id)
  const overall = Math.round((v.delivery + v.quality + v.priceStability + v.responsiveness) / 4)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(v.email)
      actions.toast({ title: 'Email copied', body: v.email, tone: 'success' })
    } catch {
      actions.toast({ title: 'Copy not available', body: 'Clipboard access is blocked in this browser.', tone: 'warning' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Procurement', to: '/procurement' }, { label: 'Vendors', to: '/procurement/vendors' }, { label: v.name }]}
        title={v.name}
        count={v.id}
        tag={<RagBadge rag={v.rating} />}
        subtitle={`${v.category} · Overall vendor status ${ragLabel[v.rating]}`}
        actions={
          <Button icon={ClipboardList} onClick={() => actions.toast({ title: 'Performance review scheduled', body: `Quarterly review meeting with ${v.contact} proposed for 8 Oct 2026.`, tone: 'success' })}>
            Schedule review
          </Button>
        }
      />

      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Overall score" value={`${overall}%`} sub={`Status ${ragLabel[v.rating]}`} />
        <MiniStat label="NCR count" value={v.ncrCount} sub="Last 12 months" />
        <MiniStat label="Average resolution time" value={`${v.avgResolutionDays} days`} sub="NCR and issue closure" />
        <MiniStat label="Active POs" value={pos.filter((p) => p.status !== 'Delivered').length} sub={sarCompact(pos.reduce((a, p) => a + p.value, 0)) + ' total value'} />
      </div>

      <div className="grid [&>*]:min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card title="Scorecard" icon={ShieldCheck}>
            <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
              <ScoreBar label="Delivery performance" value={v.delivery} />
              <ScoreBar label="Quality" value={v.quality} />
              <ScoreBar label="Price stability" value={v.priceStability} />
              <ScoreBar label="Responsiveness" value={v.responsiveness} />
            </div>
          </Card>
          <Card title="Historical trend" icon={TrendingUp} subtitle="Apr to Sep 2026">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={v.trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="month" tick={CHART.tick} />
                  <YAxis tick={CHART.tick} domain={[50, 100]} unit="%" />
                  <Tooltip contentStyle={CHART.tooltip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="delivery" name="Delivery" stroke={CHART.primary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="quality" name="Quality" stroke={CHART.ok} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="price" name="Price stability" stroke={CHART.warn} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Purchase orders" icon={ClipboardList} bodyClassName="p-0">
            <DataTable
              rows={pos}
              rowKey={(p) => p.id}
              onRowClick={(p) => navigate(`/procurement/pos/${p.id}`)}
              highlight={(p) => poVariance(p) > 5}
              empty={<EmptyState className="m-5" title="No POs with this vendor" />}
              columns={[
                { key: 'id', header: 'PO', render: (p) => <span className="font-medium">{p.id}</span> },
                { key: 'm', header: 'Material', render: (p) => <span className="block max-w-[200px] truncate">{p.material}</span>, hideBelow: 'sm' },
                { key: 'p', header: 'Project', render: (p) => <span className="whitespace-nowrap text-ink-2">{projectName(state, p.projectId)}</span>, hideBelow: 'lg' },
                { key: 'v', header: 'Value', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sarCompact(p.value)}</span> },
                { key: 'var', header: 'Variance', align: 'end', render: (p) => <VarianceText po={p} /> },
                { key: 'e', header: 'Exposure', align: 'end', render: (p) => <span className="tabular whitespace-nowrap">{sarCompact(poExposure(p))}</span>, hideBelow: 'md' },
                { key: 'd', header: 'Delivery', render: (p) => <span className="whitespace-nowrap"><DeliveryText daysLate={p.daysLate} status={p.status} /></span>, hideBelow: 'sm' },
                { key: 's', header: 'Status', render: (p) => <StatusPill status={p.status} /> },
              ]}
            />
          </Card>
        </div>
        <div className="min-w-0 space-y-6">
          <Card title="Contact" icon={User}>
            <KeyValue
              rows={[
                { icon: User, label: 'Account contact', value: v.contact },
                {
                  icon: Phone,
                  label: 'Phone',
                  value: (
                    <a href={`tel:${v.phone.replace(/\s/g, '')}`} title="Tap to call" className="tabular underline decoration-ink-3 decoration-dotted underline-offset-4 hover:text-action">
                      {v.phone}
                    </a>
                  ),
                },
                {
                  icon: Mail,
                  label: 'Email',
                  value: (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted py-0.5 ps-2.5 pe-1 text-[13px]">
                      <a href={`mailto:${v.email}`} className="min-w-0 truncate hover:text-action">
                        {v.email}
                      </a>
                      <button type="button" onClick={copyEmail} aria-label="Copy email" className="shrink-0 rounded-full p-1 text-ink-2 hover:bg-surface hover:text-ink">
                        <Copy className="size-3.5" strokeWidth={1.5} />
                      </button>
                    </span>
                  ),
                },
                { icon: Tag, label: 'Category', value: v.category },
                { icon: Building2, label: 'Approved vendor list', value: v.approved ? <Pill tone="ok">Approved</Pill> : <Pill>Not approved</Pill> },
              ]}
            />
          </Card>
          <Card title="Issues" icon={FileWarning} subtitle={`${issues.filter((i) => i.status !== 'Resolved').length} open`}>
            {issues.length === 0 ? (
              <p className="text-[13px] text-ink-3">No issues raised against this vendor.</p>
            ) : (
              <ul className="space-y-3">
                {issues.map((i) => (
                  <li key={i.id} className="text-[14px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-ink-3">
                        {i.id} · {i.type} · {fmtDate(i.raised)}
                      </span>
                      <StatusPill status={i.status} />
                    </div>
                    <div className="text-ink">{i.issue}</div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/procurement/issues" className="mt-3 inline-block text-[13px] font-medium text-action hover:underline">
              All vendor issues
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
