import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  ArrowDown,
  ArrowRight,
  Building2,
  CalendarClock,
  Camera,
  ClipboardCheck,
  FileText,
  FileWarning,
  FolderKanban,
  History,
  Network,
  Radiation,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  Wallet,
  Wrench,
} from 'lucide-react'
import { Button, Card, DemoTag, EmptyState, FileTile, LinkText, PageHeader, Pill, ProgressBar, SitePhoto, StatLine, StatusPill, toneFor } from '../../components/ui'
import type { Tone } from '../../components/ui'
import { cx, fmtDate, fmtShort, sar } from '../../lib/format'
import { mdrSummary, ncrAge } from '../../store/selectors'
import { useStore } from '../../store/store'

const RECORD_ID = 'W-00428'
const INSPECTION_ID = 'INS-WLD-00428'
const PO_ID = 'PO-450021'
const VENDOR_ID = 'V-GIS'

interface ChainNode {
  key: string
  icon: LucideIcon
  label: string
  title: string
  status: string
  tone: Tone
  meta: string
  to?: string
  action?: ReactNode
}

export function Record360() {
  const { id = '' } = useParams()
  const { state, actions } = useStore()
  const navigate = useNavigate()

  if (id !== RECORD_ID) {
    return (
      <div>
        <PageHeader title="Record 360°" count={id} crumbs={[{ label: 'Platform' }, { label: 'Record 360°' }]} />
        <EmptyState
          icon={Network}
          title={`No connected record for ${id}`}
          body="Record 360° is configured in this demo for weld W-00428 on North Pipeline Expansion."
          action={
            <Button variant="primary" icon={Network} onClick={() => navigate(`/record/${RECORD_ID}`)}>
              Open Record 360° for W-00428
            </Button>
          }
        />
      </div>
    )
  }

  const ins = state.inspections.find((i) => i.id === INSPECTION_ID)
  const project = state.projects.find((p) => p.id === 'NPE')
  const wp = state.workPackages.find((w) => w.id === (ins?.workPackageId ?? 'NPE-WP04'))
  const ncr = ins?.ncrId ? state.ncrs.find((n) => n.id === ins.ncrId) : undefined
  const capa = ncr?.capaId ? state.capas.find((c) => c.id === ncr.capaId) : undefined
  const approval = ncr ? state.approvals.find((a) => a.linkId === ncr.id && a.type === 'NCR CAPA') : undefined
  const docs = state.documents.filter((d) => d.linkedTo.includes(RECORD_ID))
  const rtDoc = state.documents.find((d) => d.id === 'DOC-NPE-RT-00428')
  const photoDoc = state.documents.find((d) => d.id === 'DOC-NPE-PH-00428')
  const mtrDoc = state.documents.find((d) => d.id === 'DOC-NPE-MTR-2231')
  const certDoc = state.documents.find((d) => d.id === 'DOC-NPE-ASNT-0418')
  const vendor = state.vendors.find((v) => v.id === VENDOR_ID)
  const po = state.pos.find((p) => p.id === PO_ID)
  const dpr = state.dprs.find((d) => d.id === 'DPR-NPE-0930')
  const weldingCat = state.mdr.NPE?.find((c) => c.name === 'Welding Records')
  const dossier = mdrSummary(state.mdr.NPE)
  const ncrOpen = !ncr || ncr.status !== 'Closed'
  const failed = ins?.result === 'Failed' || ins?.result === 'Re-inspection Requested'
  const blocked = failed && ncrOpen

  const keys = [INSPECTION_ID, RECORD_ID, PO_ID, ncr?.id, capa?.id].filter(Boolean) as string[]
  const activity = state.activities.filter((a) => keys.some((k) => a.text.includes(k)))

  const nodes: ChainNode[] = [
    {
      key: 'field',
      icon: Smartphone,
      label: 'Field capture',
      title: 'Joint welded, crew W-2',
      status: 'Captured',
      tone: 'ok',
      meta: dpr ? `28 Sep field app · logged in ${dpr.id}` : '28 Sep · field app',
      to: '/projects/dpr',
    },
    {
      key: 'ins',
      icon: ClipboardCheck,
      label: 'Inspection',
      title: INSPECTION_ID,
      status: ins?.result ?? 'Unknown',
      tone: toneFor(ins?.result ?? ''),
      meta: ins ? `${ins.type} · ${ins.inspector}` : '',
      to: `/quality/inspections/${INSPECTION_ID}`,
    },
    {
      key: 'photos',
      icon: Camera,
      label: 'Photo set',
      title: `${ins?.photos.length ?? 0} photos`,
      status: photoDoc?.status ?? 'Submitted',
      tone: toneFor(photoDoc?.status ?? 'Submitted'),
      meta: 'DOC-NPE-PH-00428',
      to: `/quality/inspections/${INSPECTION_ID}`,
    },
    ncr
      ? {
          key: 'ncr',
          icon: FileWarning,
          label: 'NCR',
          title: ncr.id,
          status: ncr.status,
          tone: toneFor(ncr.status),
          meta: `Age ${ncrAge(ncr)}d of ${ncr.slaDays}d SLA`,
          to: `/quality/ncrs/${ncr.id}`,
        }
      : {
          key: 'ncr',
          icon: FileWarning,
          label: 'NCR',
          title: 'Not raised yet',
          status: 'Action required',
          tone: 'crit',
          meta: 'Failed weld needs disposition',
          action: (
            <Button size="sm" variant="primary" className="mt-2 w-full" onClick={() => navigate(`/quality/inspections/${INSPECTION_ID}`)}>
              Go to inspection
            </Button>
          ),
        },
    capa
      ? {
          key: 'capa',
          icon: ShieldCheck,
          label: 'CAPA',
          title: capa.id,
          status: capa.status,
          tone: toneFor(capa.status),
          meta: `${capa.progress}% · due ${fmtShort(capa.dueDate)}`,
          to: ncr ? `/quality/ncrs/${ncr.id}` : '/quality/capa',
        }
      : {
          key: 'capa',
          icon: ShieldCheck,
          label: 'CAPA',
          title: ncr ? 'Not created' : 'Waiting for NCR',
          status: ncr ? 'At CAPA Submitted' : 'Not started',
          tone: 'neutral',
          meta: ncr ? `NCR is at ${ncr.status}` : 'Created from the NCR workflow',
          to: ncr ? `/quality/ncrs/${ncr.id}` : undefined,
        },
    {
      key: 'mtr',
      icon: FileText,
      label: 'Material (MTR)',
      title: 'MTR-CS-2231',
      status: mtrDoc?.status === 'Approved' ? 'Verified' : (mtrDoc?.status ?? 'Verified'),
      tone: 'ok',
      meta: `Heat 7741-B · ${vendor?.name ?? 'Gulf Industrial Supplies'} · ${PO_ID}`,
      to: '/quality/mtr',
    },
    {
      key: 'project',
      icon: FolderKanban,
      label: 'Project',
      title: project?.name ?? 'North Pipeline Expansion',
      status: project?.rag ?? 'AMBER',
      tone: project?.rag === 'GREEN' ? 'ok' : project?.rag === 'RED' ? 'crit' : 'warn',
      meta: project ? `${project.progress}% complete vs ${project.planned}% planned` : '',
      to: '/projects/NPE',
    },
    {
      key: 'handover',
      icon: Archive,
      label: 'Handover dossier',
      title: 'Welding Records',
      status: blocked ? 'Blocked' : 'Ready to file',
      tone: blocked ? 'crit' : 'ok',
      meta: weldingCat ? `${weldingCat.completed} of ${weldingCat.required} records complete` : '',
      to: '/handover',
    },
  ]

  const affected = [
    { label: 'Projects', to: '/projects/NPE' },
    { label: 'QA/QC', to: '/quality' },
    { label: 'Documents', to: '/documents' },
    { label: 'Procurement', to: `/procurement/pos/${PO_ID}` },
    { label: 'Handover', to: '/handover' },
    { label: 'Alerts', to: '/alerts' },
  ]

  return (
    <div>
      <PageHeader
        title="Record 360°: Weld W-00428"
        crumbs={[{ label: 'Platform' }, { label: 'Record 360°' }, { label: RECORD_ID }]}
        tag={<Pill tone={blocked ? 'crit' : ins?.result === 'Passed' ? 'ok' : 'warn'} dot>{blocked ? 'Quality hold' : ins?.result === 'Passed' ? 'Accepted' : 'In progress'}</Pill>}
        subtitle="One record, many workflows, one source of truth. Every module below reads and writes the same weld record."
        actions={
          <>
            <Button icon={ClipboardCheck} onClick={() => navigate(`/quality/inspections/${INSPECTION_ID}`)}>
              Inspection
            </Button>
            {ncr ? (
              <Button variant="primary" icon={FileWarning} onClick={() => navigate(`/quality/ncrs/${ncr.id}`)}>
                Open {ncr.id}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={FileWarning}
                onClick={() => {
                  const nid = actions.raiseNCR(INSPECTION_ID)
                  if (nid) navigate(`/quality/ncrs/${nid}`)
                }}
              >
                Raise NCR
              </Button>
            )}
          </>
        }
      />

      <Card title="Connected lifecycle" icon={Network} subtitle="Field to dossier, live status from each workflow" className="mb-4">
        <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch md:gap-y-4">
          {nodes.map((n, i) => (
            <Fragment key={n.key}>
              <li className="md:w-[168px]">
                <ChainCard node={n} index={i + 1} />
              </li>
              {i < nodes.length - 1 && (
                <li aria-hidden className="flex items-center justify-center text-ink-3">
                  <ArrowDown className="size-4 md:hidden" strokeWidth={1.5} />
                  <ArrowRight className="hidden size-4 md:block rtl:rotate-180" strokeWidth={1.5} />
                </li>
              )}
            </Fragment>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[12px] text-ink-2">
          <span>Workflows reading this record:</span>
          {affected.map((a) => (
            <Link key={a.label} to={a.to} className="rounded-full border border-line px-2.5 py-0.5 text-ink-2 hover:border-line-strong hover:text-ink">
              {a.label}
            </Link>
          ))}
        </div>
      </Card>

      {blocked && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#f3c5c5] bg-crit-bg px-4 py-3 text-[13px] text-crit">
          <Archive className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            Weld records for W-00428 cannot enter the handover dossier until {ncr ? `${ncr.id} is closed` : 'an NCR is raised and closed'}. Repair, repeat RT and verification are required.
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        <Card title="Project" icon={FolderKanban}>
          {project && (
            <>
              <div className="flex items-center justify-between gap-2">
                <LinkText to="/projects/NPE">{project.name}</LinkText>
                <StatusPill status={project.rag} />
              </div>
              <StatLine label="Client" value={project.client} />
              <StatLine label="Location" value="Spread 2, KP 42+600" />
              <StatLine label="Overall progress" value={`${project.progress}% vs ${project.planned}%`} tone={project.progress < project.planned ? 'warn' : 'ok'} />
              <StatLine label="Project manager" value={project.manager} />
            </>
          )}
        </Card>

        <Card title="Work package" icon={Wrench}>
          {wp ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <LinkText to="/projects/NPE?tab=progress">
                  {wp.id} {wp.name}
                </LinkText>
                <StatusPill status={wp.status} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[13px]">
                <ProgressBar value={wp.progress} marker={wp.planned} tone="warn" className="flex-1" height={8} />
                <span className="tabular whitespace-nowrap text-ink">
                  {wp.progress}% <span className="text-ink-3">vs {wp.planned}%</span>
                </span>
              </div>
              <StatLine label="Forecast finish" value={fmtDate(wp.forecastFinish)} />
              <StatLine label="Delay cause" value={wp.delayCause ?? 'None'} />
              <StatLine label="Owner" value={wp.owner} />
            </>
          ) : (
            <p className="text-[13px] text-ink-3">Work package not found.</p>
          )}
        </Card>

        <Card title="Inspection" icon={ClipboardCheck}>
          {ins && (
            <>
              <div className="flex items-center justify-between gap-2">
                <LinkText to={`/quality/inspections/${ins.id}`}>{ins.id}</LinkText>
                <StatusPill status={ins.result} />
              </div>
              <StatLine label="Type" value={ins.type} />
              <StatLine label="Date" value={fmtDate(ins.date)} />
              <StatLine label="Findings" value={ins.findings.slice(0, 2).join(', ') || 'None'} tone={ins.findings.length ? 'crit' : undefined} />
              <StatLine label="ITP step" value="3.2 Visual, 4.1 RT (hold)" />
            </>
          )}
        </Card>

        <Card title="Inspector" icon={User}>
          <div className="text-[14px] font-medium text-ink">{ins?.inspector ?? 'Mohammed Al-Harbi'}</div>
          <div className="text-[12px] text-ink-3">QA/QC Welding Inspector, Spread 2</div>
          <StatLine label="Qualification" value="CSWIP 3.1, ASNT Level II RT" />
          <StatLine label="RT certificate expiry" value={certDoc?.expiry ? fmtDate(certDoc.expiry) : '22 Oct 2026'} tone="warn" />
          <StatLine label="Inspections this week" value="27" />
        </Card>

        <Card title="NDT result" icon={Radiation} actions={<DemoTag>Illustrative Data</DemoTag>}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium text-ink">RT-00428</span>
            <Pill tone="crit" dot>
              Reject
            </Pill>
          </div>
          <StatLine label="Indication" value="Incomplete penetration, 38 mm" tone="crit" />
          <StatLine label="Acceptance limit" value="25 mm (API 1104)" />
          <StatLine label="Technique" value="Gamma Ir-192, DWSI" />
          <StatLine label="Report" value={rtDoc ? rtDoc.status : 'Under Review'} tone={rtDoc ? (toneFor(rtDoc.status) === 'ok' ? 'ok' : 'warn') : 'warn'} />
        </Card>

        <Card title="NCR" icon={FileWarning}>
          {ncr ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <LinkText to={`/quality/ncrs/${ncr.id}`}>{ncr.id}</LinkText>
                <StatusPill status={ncr.status} />
              </div>
              <div className="mt-1 text-[13px] text-ink-2">{ncr.title}</div>
              <StatLine label="Severity" value={ncr.severity} tone="warn" />
              <StatLine label="Age / SLA" value={`${ncrAge(ncr)}d / ${ncr.slaDays}d`} tone={ncr.status !== 'Closed' && ncrAge(ncr) > ncr.slaDays ? 'crit' : undefined} />
              <StatLine label="Responsible" value={ncr.responsible} />
            </>
          ) : (
            <EmptyState
              icon={FileWarning}
              title="NCR not raised yet"
              body="The failed inspection has no non-conformance report. Raising it updates the register, project KPIs and leadership alerts."
              action={
                <Button size="sm" variant="primary" onClick={() => navigate(`/quality/inspections/${INSPECTION_ID}`)}>
                  Open inspection
                </Button>
              }
            />
          )}
        </Card>

        <Card title="CAPA" icon={ShieldCheck}>
          {capa ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-medium text-ink">{capa.id}</span>
                <StatusPill status={capa.status} />
              </div>
              <p className="mt-1 text-[13px] text-ink-2">{capa.correctiveAction}</p>
              <div className="mt-3 flex items-center gap-2">
                <ProgressBar value={capa.progress} className="flex-1" />
                <span className="tabular text-[12px] text-ink-2">{capa.progress}%</span>
              </div>
              <StatLine label="Owner" value={capa.owner} />
              <StatLine label="Due" value={fmtDate(capa.dueDate)} />
              <StatLine label="Approval" value={approval?.status ?? 'Not routed'} tone={approval?.status === 'Approved' ? 'ok' : 'warn'} />
            </>
          ) : (
            <p className="text-[13px] text-ink-3">{ncr ? `CAPA is created when ${ncr.id} reaches CAPA Submitted.` : 'CAPA follows once an NCR is raised.'}</p>
          )}
        </Card>

        <Card title="Vendor" icon={Truck}>
          {vendor && (
            <>
              <div className="flex items-center justify-between gap-2">
                <LinkText to={`/procurement/vendors/${vendor.id}`}>{vendor.name}</LinkText>
                <StatusPill status={vendor.rating} />
              </div>
              <StatLine label="Material" value='24" API 5L X65, heat 7741-B' />
              <StatLine label="Purchase order" value={<LinkText to={`/procurement/pos/${PO_ID}`}>{PO_ID}</LinkText>} />
              {po && <StatLine label="Delivery" value={po.daysLate > 0 ? `${po.daysLate} days late` : 'On time'} tone={po.daysLate > 0 ? 'warn' : 'ok'} />}
              <StatLine label="Vendor quality score" value={`${vendor.quality}%`} />
            </>
          )}
        </Card>

        <Card title="Schedule impact" icon={CalendarClock}>
          <div className="tabular text-[22px] font-semibold text-warn">2 days</div>
          <div className="text-[13px] text-ink-2">on the KP 42 welding front, Spread 2</div>
          <StatLine label="Repair weld" value="0.5 day" />
          <StatLine label="Repeat RT and interpretation" value="1 day" />
          <StatLine label="Crew W-2 parameter verification" value="0.5 day" />
        </Card>

        <Card title="Cost impact" icon={Wallet}>
          <div className="tabular text-[22px] font-semibold text-ink">{sar(ncr?.costImpact ?? 18400)}</div>
          <div className="text-[13px] text-ink-2">rework incl. repeat NDT</div>
          <StatLine label="Cut-out and repair welding" value={sar(7200)} />
          <StatLine label="Repeat RT" value={sar(3400)} />
          <StatLine label="Crew and equipment standby" value={sar(6300)} />
          <StatLine label="QA/QC administration" value={sar(1500)} />
        </Card>

        <Card title="Handover status" icon={Archive}>
          {weldingCat ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-medium text-ink">Welding Records</span>
                <Pill tone={blocked ? 'crit' : 'ok'} dot>{blocked ? 'Blocked until NCR closed' : 'Ready to file'}</Pill>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ProgressBar value={(weldingCat.completed / weldingCat.required) * 100} tone="info" className="flex-1" />
                <span className="tabular text-[12px] text-ink-2">
                  {weldingCat.completed}/{weldingCat.required}
                </span>
              </div>
              <StatLine label="Under review" value={weldingCat.review} />
              <StatLine label="Project dossier" value={`${dossier.pct}% complete`} />
              <div className="mt-2">
                <LinkText to="/handover" className="text-[12px]">
                  Open handover dossier
                </LinkText>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-ink-3">No dossier configured.</p>
          )}
        </Card>

        <Card title="Photos" icon={Camera} actions={<DemoTag>Sample image placeholder</DemoTag>} className="md:col-span-2 xl:col-span-1">
          {ins && ins.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {ins.photos.map((p, i) => (
                <figure key={p} className="min-w-0">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] bg-muted">
                    <SitePhoto seed={i + 2} className="absolute inset-0 h-full w-full" label={p} />
                  </div>
                  <figcaption className="mt-1 truncate text-[11px] text-ink-2" title={p}>
                    {p}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-3">No photos.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card title="Documents" icon={FileText} subtitle={`${docs.length} linked to ${RECORD_ID}`} className="xl:col-span-2">
          {docs.length === 0 ? (
            <EmptyState icon={FileText} title="No documents linked" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {docs.map((d, i) => (
                <FileTile
                  key={d.id}
                  name={d.title}
                  type={d.fileType}
                  photoSeed={i + 4}
                  meta={
                    <span className={cx(toneFor(d.status) === 'ok' ? 'text-ok' : toneFor(d.status) === 'crit' ? 'text-crit' : 'text-warn')}>
                      Rev {d.revision} · {d.status}
                    </span>
                  }
                  onClick={() => navigate('/documents')}
                />
              ))}
            </div>
          )}
        </Card>

        <Card title="Activity history" icon={History}>
          {activity.length === 0 ? (
            <p className="text-[13px] text-ink-3">No activity recorded.</p>
          ) : (
            <ol className="relative space-y-4 border-s border-line ps-4">
              {activity.slice(0, 12).map((a) => (
                <li key={a.id} className="relative">
                  <span className={cx('absolute -start-[21px] top-1.5 size-2.5 rounded-full border-2 border-surface', a.kind === 'alert' ? 'bg-crit' : a.kind === 'ncr' ? 'bg-[#d97706]' : a.kind === 'po' ? 'bg-action' : 'bg-ink-3')} />
                  {a.link ? (
                    <Link to={a.link} className="text-[13px] text-ink hover:text-action hover:underline">
                      {a.text}
                    </Link>
                  ) : (
                    <div className="text-[13px] text-ink">{a.text}</div>
                  )}
                  <div className="text-[12px] text-ink-3">
                    {a.time} · {a.user} · {a.department}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
        <Building2 className="size-4" strokeWidth={1.5} />
        Record keys: {RECORD_ID}, {INSPECTION_ID}, {ncr?.id ?? 'NCR pending'}, {capa?.id ?? 'CAPA pending'}, MTR-CS-2231, {PO_ID}
      </div>
    </div>
  )
}

function ChainCard({ node, index }: { node: ChainNode; index: number }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-3">
          <span className="tabular flex size-4 items-center justify-center rounded-full bg-muted text-[10px] text-ink-2">{index}</span>
          {node.label}
        </span>
        <node.icon className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
      </div>
      <div className="mt-1.5 truncate text-[13px] font-semibold text-ink" title={node.title}>
        {node.title}
      </div>
      <div className="mt-1">
        <Pill tone={node.tone} dot className="!text-[11px]">
          {node.status}
        </Pill>
      </div>
      <div className="mt-1.5 line-clamp-2 text-[11px] text-ink-3">{node.meta}</div>
    </>
  )
  const cls = cx(
    'block h-full rounded-[8px] border bg-surface p-3 text-start',
    node.tone === 'crit' ? 'border-[#f3c5c5] bg-crit-bg/40' : 'border-line',
    node.to && 'hover:border-line-strong',
  )
  if (node.to)
    return (
      <Link to={node.to} className={cls}>
        {body}
      </Link>
    )
  return (
    <div className={cls}>
      {body}
      {node.action}
    </div>
  )
}
