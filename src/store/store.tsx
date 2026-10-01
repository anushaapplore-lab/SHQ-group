import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import type {
  Activity,
  Alert,
  Approval,
  DPR,
  DocumentRec,
  FieldRecord,
  NCR,
  Observation,
  Role,
  Severity,
  Toast,
} from '../data/types'
import { DEMO_TODAY, addDays, clockLabel } from '../lib/format'
import { roleProfile } from './roles'
import type { AppState } from './seed'
import { STATE_VERSION, createSeed } from './seed'
import { ncrOverdue, poVariance, poExposure, complianceStatus } from './selectors'

const STORAGE_KEY = 'shq-ops-command-demo'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && parsed.version === STATE_VERSION) return parsed
    }
  } catch {
    /* storage unavailable: fall back to seed */
  }
  return createSeed()
}

type Draft = AppState

/* ---------- pure helpers that operate on a draft ---------- */

function tick(s: Draft): string {
  s.clock += 2
  return `Today ${clockLabel(s.clock)}`
}

function nextId(existing: string[], prefix: string, start: number, pad = 4): string {
  let max = start
  existing.forEach((id) => {
    if (id.startsWith(prefix)) {
      const n = parseInt(id.slice(prefix.length), 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  })
  return `${prefix}${String(max + 1).padStart(pad, '0')}`
}

function logActivity(s: Draft, a: Omit<Activity, 'id' | 'time'>, time?: string) {
  s.activities.unshift({ ...a, id: `ACV-${s.activities.length + 1}-${s.clock}`, time: time ?? tick(s) })
}

function addAlert(s: Draft, a: Omit<Alert, 'id' | 'status' | 'createdAt'>): Alert {
  const alert: Alert = { ...a, id: nextId(s.alerts.map((x) => x.id), 'ALR-', 9300), status: 'Open', createdAt: DEMO_TODAY }
  s.alerts.unshift(alert)
  return alert
}

function userOf(s: Draft) {
  return roleProfile(s.role).name
}

function applyNcrSla(s: Draft, n: NCR) {
  if (!ncrOverdue(n) || n.escalated) return
  const exists = s.alerts.some((a) => a.sourceId === n.id && a.rule === 'QA-01' && a.status !== 'Resolved')
  n.escalated = true
  if (exists) return
  addAlert(s, {
    level: 'critical',
    title: `${n.id} has exceeded its closure SLA.`,
    source: 'Quality rule QA-01',
    sourceId: n.id,
    projectId: n.projectId,
    department: 'QA/QC',
    impact: `${n.title}. Closure target ${n.slaDays} days exceeded.`,
    owner: 'QA/QC Manager',
    dueDate: addDays(DEMO_TODAY, 1),
    recommendation: 'Escalate CAPA owner and hold closure review within 24 hours.',
    escalation: 'Project Director',
    rule: 'QA-01',
    link: `/quality/ncrs/${n.id}`,
  })
  logActivity(s, { text: `${n.id} escalated to Project Director: closure SLA exceeded`, user: 'System rule QA-01', department: 'QA/QC', projectId: n.projectId, link: `/quality/ncrs/${n.id}`, kind: 'alert' })
}

function applyMdrDelta(s: Draft, doc: DocumentRec, from: DocumentRec['status'], to: DocumentRec['status']) {
  const cats = s.mdr[doc.projectId]
  if (!cats) return
  const cat = cats.find((c) => c.name === doc.category)
  if (!cat) return
  const bucket = (st: DocumentRec['status']) =>
    st === 'Approved' ? 'completed' : st === 'Submitted' || st === 'Under Review' ? 'review' : st === 'Expired' ? 'expired' : st === 'Expiring' ? 'completed' : 'missing'
  const b1 = bucket(from)
  const b2 = bucket(to)
  if (b1 === b2) return
  if (b1 !== 'missing') cat[b1] = Math.max(0, cat[b1] - 1)
  if (b2 !== 'missing') cat[b2] += 1
}

function syncProjectHandover(s: Draft, projectId: string) {
  const cats = s.mdr[projectId]
  const p = s.projects.find((x) => x.id === projectId)
  if (!cats || !p) return
  const req = cats.reduce((a, c) => a + c.required, 0)
  const comp = cats.reduce((a, c) => a + c.completed, 0)
  p.handover = Math.round((comp / req) * 100)
}

function createObservationDraft(
  s: Draft,
  input: {
    projectId: string
    title: string
    category: string
    severity: Severity
    location: string
    description: string
    immediateAction: string
    assignedTo: string
    dueDate: string
    reportedBy: string
    source: Observation['source']
    photo?: string
    withAi?: boolean
  },
): Observation {
  const id = nextId(s.observations.map((o) => o.id), 'OBS-', 1042)
  const high = input.severity === 'High' || input.severity === 'Critical'
  const obs: Observation = {
    id,
    projectId: input.projectId,
    status: 'Open',
    owner: input.assignedTo,
    createdAt: DEMO_TODAY,
    updatedAt: DEMO_TODAY,
    title: input.title,
    category: input.category,
    severity: input.severity,
    location: input.location,
    description: input.description,
    immediateAction: input.immediateAction,
    assignedTo: input.assignedTo,
    dueDate: input.dueDate,
    reportedBy: input.reportedBy,
    photo: input.photo,
    source: input.source,
    actionIds: [],
    ai:
      input.withAi && input.category === 'Suspended Load'
        ? {
            detection: 'Potential suspended-load exposure detected.',
            confidence: 94,
            risk: 'High',
            recommendation: 'Stop activity and establish exclusion zone before resuming lifting operation.',
            detected: ['Worker', 'Crane hook', 'Suspended load', 'Exclusion zone not visible'],
            hazards: ['Suspended load', 'Line-of-fire exposure', 'Inadequate exclusion zone'],
            controls: ['Establish exclusion zone', 'Assign spotter', 'Stop work until control is verified'],
          }
        : undefined,
  }
  s.observations.unshift(obs)
  s.hseStats.totalObs += 1

  // 1. Observation creates an action
  const actId = nextId(s.actions.map((a) => a.id), 'ACT-', 3302)
  s.actions.unshift({
    id: actId,
    projectId: obs.projectId,
    status: 'Open',
    owner: obs.assignedTo,
    createdAt: DEMO_TODAY,
    updatedAt: DEMO_TODAY,
    title: obs.immediateAction && obs.immediateAction.length > 4 ? `Verify: ${obs.immediateAction}` : `Close out observation ${obs.id}`,
    sourceType: 'Observation',
    sourceId: obs.id,
    department: 'HSE',
    dueDate: obs.dueDate,
    priority: obs.severity,
  })
  obs.actionIds.push(actId)

  const time = tick(s)
  logActivity(s, { text: `HSE observation ${obs.id} raised (${obs.severity}): ${obs.title}`, user: obs.reportedBy, department: 'HSE', projectId: obs.projectId, link: `/hse/observations/${obs.id}`, kind: obs.source === 'Field App' ? 'field' : 'hse' }, time)

  // 2. High severity escalates and updates project risk
  if (high) {
    addAlert(s, {
      level: 'critical',
      title: `High-risk HSE observation ${obs.id}: ${obs.title}`,
      source: obs.source === 'Field App' ? 'Field App → HSE rule HSE-02' : 'HSE rule HSE-02',
      sourceId: obs.id,
      projectId: obs.projectId,
      department: 'HSE',
      impact: `${obs.category} exposure at ${obs.location}`,
      owner: 'HSE Manager',
      dueDate: DEMO_TODAY,
      recommendation: input.category === 'Suspended Load' ? 'Stop activity and establish exclusion zone before resuming lifting operation.' : 'Stop work in the affected area until controls are verified.',
      escalation: 'Project Director',
      rule: 'HSE-02',
      link: `/hse/observations/${obs.id}`,
    })
    const p = s.projects.find((x) => x.id === obs.projectId)
    if (p) {
      p.riskScore = Math.min(100, p.riskScore + 6)
      p.hse = Math.max(0, p.hse - 1)
      p.health = Math.max(0, p.health - 2)
    }
    logActivity(s, { text: `Escalation: ${obs.id} notified to HSE Manager and Project Director. Project risk score updated.`, user: 'System rule HSE-02', department: 'HSE', projectId: obs.projectId, link: '/alerts', kind: 'alert' })
  }
  return obs
}

function applyFieldRecord(s: Draft, r: FieldRecord) {
  const p = r.payload
  switch (r.kind) {
    case 'HSE Observation':
      createObservationDraft(s, {
        projectId: String(p.projectId ?? 'NPE'),
        title: String(p.title ?? r.title),
        category: String(p.category ?? 'PPE'),
        severity: (p.severity as Severity) ?? 'Medium',
        location: String(p.location ?? 'Spread 2'),
        description: String(p.description ?? r.summary),
        immediateAction: String(p.immediateAction ?? ''),
        assignedTo: String(p.assignedTo ?? 'HSE Officer'),
        dueDate: String(p.dueDate ?? DEMO_TODAY),
        reportedBy: 'Faisal Al-Qahtani',
        source: 'Field App',
        photo: p.photo ? String(p.photo) : undefined,
        withAi: !!p.photo,
      })
      break
    case 'Daily Progress': {
      const wp = s.workPackages.find((w) => w.projectId === 'NPE' && w.name === String(p.workPackage ?? 'Welding'))
      if (wp) wp.progress = Math.min(100, wp.progress + 1)
      logActivity(s, { text: `Field progress synced: ${r.title}`, user: 'Faisal Al-Qahtani', department: 'Projects', projectId: 'NPE', link: '/projects/NPE?tab=progress', kind: 'field' })
      break
    }
    case 'Attendance':
      logActivity(s, { text: `Attendance synced: ${r.summary}`, user: 'Faisal Al-Qahtani', department: 'HR', projectId: 'NPE', link: '/hr/attendance', kind: 'field' })
      break
    case 'NCR': {
      const id = nextId(s.ncrs.map((n) => n.id), 'NCR-', 217, 5)
      s.ncrs.unshift({
        id,
        projectId: 'NPE',
        status: 'Open',
        owner: 'QA/QC Manager',
        createdAt: DEMO_TODAY,
        updatedAt: DEMO_TODAY,
        title: String(p.title ?? r.title),
        severity: (p.severity as NCR['severity']) ?? 'Minor',
        source: 'Field App',
        discipline: String(p.discipline ?? 'Welding'),
        description: String(p.description ?? r.summary),
        rootCause: '',
        immediateCorrection: 'Area tagged from field.',
        correctiveAction: '',
        preventiveAction: '',
        responsible: 'QA/QC Manager',
        dueDate: addDays(DEMO_TODAY, 14),
        detectedAt: DEMO_TODAY,
        slaDays: 14,
        ageAdjust: 0,
      })
      logActivity(s, { text: `${id} raised from field app: ${r.title}`, user: 'Faisal Al-Qahtani', department: 'QA/QC', projectId: 'NPE', link: `/quality/ncrs/${id}`, kind: 'ncr' })
      break
    }
    default:
      logActivity(s, { text: `Field ${r.kind.toLowerCase()} synced: ${r.title}`, user: 'Faisal Al-Qahtani', department: 'Projects', projectId: 'NPE', kind: 'field' })
  }
}

/* ---------- context ---------- */

type Mutator = (s: Draft) => void

function useActions(setState: (fn: (prev: AppState) => AppState) => void, stateRef: RefObject<AppState>, pushToast: (t: Omit<Toast, 'id'>) => void) {
  return useMemo(() => {
    const mutate = (fn: Mutator) =>
      setState((prev) => {
        const draft = structuredClone(prev)
        fn(draft)
        return draft
      })
    const get = () => stateRef.current

    return {
      toast: pushToast,
      signIn(role: Role) {
        mutate((s) => {
          s.signedIn = true
          s.role = role
        })
      },
      signOut() {
        mutate((s) => {
          s.signedIn = false
        })
      },
      setRole(role: Role) {
        mutate((s) => {
          s.role = role
        })
        pushToast({ title: `Viewing as ${role}`, body: roleProfile(role).description, tone: 'info' })
      },
      setLang(lang: 'en' | 'ar') {
        mutate((s) => {
          s.lang = lang
        })
      },
      setProjectFilter(id: string) {
        mutate((s) => {
          s.projectFilter = id
        })
      },
      refresh() {
        mutate((s) => {
          s.lastRefresh = tick(s)
        })
        pushToast({ title: 'Data refreshed', body: 'All modules re-synchronised from the shared record store.', tone: 'success' })
      },
      reset() {
        const role = get().role
        const lang = get().lang
        setState(() => ({ ...createSeed(), signedIn: true, role, lang }))
        pushToast({ title: 'Demo data reset', body: 'All records restored to the seeded baseline.', tone: 'info' })
      },

      /* ----- Quality ----- */
      raiseNCR(inspectionId: string): string {
        const s0 = get()
        const ins = s0.inspections.find((i) => i.id === inspectionId)
        if (!ins) return ''
        if (ins.ncrId) return ins.ncrId
        const id = nextId(s0.ncrs.map((n) => n.id), 'NCR-', 217, 5)
        mutate((s) => {
          const i = s.inspections.find((x) => x.id === inspectionId)
          if (!i || i.ncrId) return
          const isDemo = i.id === 'INS-WLD-00428'
          const ncr: NCR = {
            id,
            projectId: i.projectId,
            status: 'Open',
            owner: 'QA/QC Manager',
            createdAt: DEMO_TODAY,
            updatedAt: DEMO_TODAY,
            title: isDemo ? 'Welding defect at KP 42+600' : `${i.discipline} non-conformance at ${i.location}`,
            severity: 'Major',
            source: `Inspection ${i.id}`,
            inspectionId: i.id,
            discipline: i.discipline,
            description: isDemo
              ? 'Weld W-00428 failed visual and radiographic inspection. Undercut at the 4 o\'clock position and incomplete penetration over 38 mm of the root, exceeding API 1104 acceptance criteria.'
              : `${i.reference} failed ${i.type.toLowerCase()}: ${i.findings.join(', ').toLowerCase()}.`,
            rootCause: '',
            immediateCorrection: isDemo ? 'Joint tagged and quarantined. Welder W-2 crew paused on similar joints pending parameter check.' : 'Item tagged and quarantined.',
            correctiveAction: '',
            preventiveAction: '',
            responsible: 'Construction Manager',
            dueDate: addDays(i.date, 5),
            detectedAt: i.date,
            slaDays: 5,
            ageAdjust: 0,
            costImpact: isDemo ? 18400 : 9000,
          }
          s.ncrs.unshift(ncr)
          i.ncrId = id
          i.status = 'Failed, NCR Raised'
          const p = s.projects.find((x) => x.id === i.projectId)
          if (p) p.riskScore = Math.min(100, p.riskScore + 3)
          addAlert(s, {
            level: 'warning',
            title: `Quality alert: ${id} raised on ${p?.shortName ?? i.projectId} (${ncr.title})`,
            source: `Inspection ${i.id}`,
            sourceId: id,
            projectId: i.projectId,
            department: 'QA/QC',
            impact: isDemo ? 'Weld W-00428 requires repair and repeat NDT. 2-day impact on welding front at KP 42.' : 'Rework required.',
            owner: 'QA/QC Manager',
            dueDate: ncr.dueDate,
            recommendation: 'Assign CAPA owner and verify welding parameters on active crews.',
            escalation: 'Project Director',
            link: `/quality/ncrs/${id}`,
          })
          logActivity(s, { text: `${id} raised: ${ncr.title}`, user: userOf(s), department: 'QA/QC', projectId: i.projectId, link: `/quality/ncrs/${id}`, kind: 'ncr' })
          applyNcrSla(s, ncr)
        })
        pushToast({ title: `${id} raised`, body: 'NCR register, project quality KPIs and leadership alerts updated.', tone: 'success' })
        return id
      },
      requestReinspection(inspectionId: string) {
        mutate((s) => {
          const i = s.inspections.find((x) => x.id === inspectionId)
          if (!i) return
          i.result = 'Re-inspection Requested'
          i.status = i.ncrId ? 'Re-inspection Requested (NCR open)' : 'Re-inspection Requested'
          logActivity(s, { text: `Re-inspection requested for ${i.reference} (${i.id})`, user: userOf(s), department: 'QA/QC', projectId: i.projectId, link: `/quality/inspections/${i.id}`, kind: 'inspection' })
        })
        pushToast({ title: 'Re-inspection requested', body: 'Inspector notified. Slot proposed for tomorrow 07:30.', tone: 'success' })
      },
      addInspectionNote(inspectionId: string, note: string) {
        mutate((s) => {
          const i = s.inspections.find((x) => x.id === inspectionId)
          if (!i) return
          i.findings.push(note)
          logActivity(s, { text: `Observation added to ${i.id}: ${note}`, user: userOf(s), department: 'QA/QC', projectId: i.projectId, link: `/quality/inspections/${i.id}`, kind: 'inspection' })
        })
        pushToast({ title: 'Observation added', tone: 'success' })
      },
      updateNCR(id: string, patch: Partial<NCR>) {
        mutate((s) => {
          const n = s.ncrs.find((x) => x.id === id)
          if (n) Object.assign(n, patch, { updatedAt: DEMO_TODAY })
        })
      },
      advanceNCR(id: string) {
        const order: NCR['status'][] = ['Open', 'Investigation', 'CAPA Submitted', 'Verification', 'Closed']
        const cur = get().ncrs.find((x) => x.id === id)
        if (!cur || cur.status === 'Closed') return
        const next = order[order.indexOf(cur.status) + 1]
        mutate((s) => {
          const n = s.ncrs.find((x) => x.id === id)
          if (!n || n.status === 'Closed') return
          n.status = next
          n.updatedAt = DEMO_TODAY
          const user = userOf(s)
          if (next === 'Investigation') {
            if (!n.rootCause && n.id === 'NCR-00218') n.rootCause = 'Incorrect welding parameter configuration.'
          }
          if (next === 'CAPA Submitted') {
            const isDemo = n.inspectionId === 'INS-WLD-00428'
            if (!n.rootCause) n.rootCause = isDemo ? 'Incorrect welding parameter configuration.' : 'Procedure not followed at work front.'
            if (!n.correctiveAction) n.correctiveAction = isDemo ? 'Rework affected joint and perform repeat NDT.' : 'Rework affected item and re-inspect.'
            if (!n.preventiveAction) n.preventiveAction = isDemo ? 'Introduce parameter verification checklist before welding.' : 'Toolbox talk and supervisor verification.'
            if (!n.capaId) {
              const capaId = nextId(s.capas.map((c) => c.id), 'CAPA-', 91, 5)
              s.capas.unshift({
                id: capaId,
                projectId: n.projectId,
                status: 'In Progress',
                owner: n.responsible || 'Construction Manager',
                createdAt: DEMO_TODAY,
                updatedAt: DEMO_TODAY,
                ncrId: n.id,
                rootCause: n.rootCause,
                correctiveAction: n.correctiveAction,
                preventiveAction: n.preventiveAction,
                dueDate: isDemo ? '2026-10-12' : addDays(DEMO_TODAY, 10),
                progress: 20,
              })
              n.capaId = capaId
              s.approvals.unshift({
                id: nextId(s.approvals.map((a) => a.id), 'APR-', 5107),
                type: 'NCR CAPA',
                title: `${capaId} for ${n.id}: ${n.title}`,
                projectId: n.projectId,
                requestedBy: n.responsible || 'Construction Manager',
                approver: 'QA/QC Manager',
                summary: `Root cause: ${n.rootCause} Corrective: ${n.correctiveAction} Preventive: ${n.preventiveAction}`,
                impact: isDemo ? 'Releases weld W-00428 for repair. Prevents recurrence across 4 welding crews.' : 'Allows NCR to proceed to verification.',
                attachments: isDemo ? ['RT-00428 radiograph.pdf', 'WPS-012 parameters.pdf', 'Parameter checklist draft.docx'] : ['CAPA form.pdf'],
                recommendation: 'Approve CAPA and proceed to verification after repair.',
                status: 'Pending',
                createdAt: DEMO_TODAY,
                linkId: n.id,
              })
              logActivity(s, { text: `${capaId} submitted for ${n.id} and sent for approval`, user, department: 'QA/QC', projectId: n.projectId, link: `/quality/ncrs/${n.id}`, kind: 'ncr' })
            }
          } else if (next === 'Closed') {
            const capa = s.capas.find((c) => c.id === n.capaId)
            if (capa) {
              capa.status = 'Closed'
              capa.progress = 100
            }
            s.alerts.forEach((a) => {
              if (a.sourceId === n.id && a.status !== 'Resolved') a.status = 'Resolved'
            })
            const ins = s.inspections.find((x) => x.id === n.inspectionId)
            if (ins) {
              ins.result = 'Passed'
              ins.status = 'Passed after repair'
            }
            logActivity(s, { text: `${n.id} verified and closed`, user, department: 'QA/QC', projectId: n.projectId, link: `/quality/ncrs/${n.id}`, kind: 'ncr' })
          } else {
            logActivity(s, { text: `${n.id} moved to ${next}`, user, department: 'QA/QC', projectId: n.projectId, link: `/quality/ncrs/${n.id}`, kind: 'ncr' })
          }
        })
        pushToast({ title: `${id} → ${next}`, body: next === 'CAPA Submitted' ? 'CAPA created and routed to Approval Centre.' : next === 'Closed' ? 'Open NCR count and alerts updated.' : undefined, tone: 'success' })
      },
      simulateNcrAgeing(id: string, days: number) {
        mutate((s) => {
          const n = s.ncrs.find((x) => x.id === id)
          if (!n) return
          n.ageAdjust += days
          applyNcrSla(s, n)
        })
        const n = get().ncrs.find((x) => x.id === id)
        pushToast({ title: `Simulated +${days} days`, body: n ? `${id} age is now beyond its ${n.slaDays}-day closure target. Escalation rule QA-01 evaluated.` : undefined, tone: 'warning' })
      },
      updateCapaProgress(id: string, progress: number) {
        mutate((s) => {
          const c = s.capas.find((x) => x.id === id)
          if (c) {
            c.progress = progress
            c.updatedAt = DEMO_TODAY
          }
        })
      },

      /* ----- HSE ----- */
      createObservation(input: Parameters<typeof createObservationDraft>[1]): string {
        const id = nextId(get().observations.map((o) => o.id), 'OBS-', 1042)
        mutate((s) => {
          createObservationDraft(s, input)
        })
        const high = input.severity === 'High' || input.severity === 'Critical'
        pushToast({ title: `${id} submitted`, body: high ? 'Action created, HSE Manager alerted and project risk score updated.' : 'Action created and assigned.', tone: high ? 'warning' : 'success' })
        return id
      },
      acceptRecommendation(obsId: string) {
        mutate((s) => {
          const o = s.observations.find((x) => x.id === obsId)
          if (!o) return
          o.status = 'Action Assigned'
          const actId = nextId(s.actions.map((a) => a.id), 'ACT-', 3302)
          s.actions.unshift({
            id: actId,
            projectId: o.projectId,
            status: 'Open',
            owner: o.assignedTo,
            createdAt: DEMO_TODAY,
            updatedAt: DEMO_TODAY,
            title: o.ai?.recommendation ?? 'Implement recommended control',
            sourceType: 'Observation',
            sourceId: o.id,
            department: 'HSE',
            dueDate: DEMO_TODAY,
            priority: o.severity,
          })
          o.actionIds.push(actId)
          const permit = s.alerts.find((a) => a.sourceId === o.id && a.status === 'Open')
          if (permit) permit.status = 'Acknowledged'
          logActivity(s, { text: `Recommendation accepted for ${o.id}: lifting stopped, exclusion zone action ${actId} issued`, user: userOf(s), department: 'HSE', projectId: o.projectId, link: `/hse/observations/${o.id}`, kind: 'hse' })
        })
        pushToast({ title: 'Recommendation accepted', body: 'Stop-work action issued to the lifting supervisor.', tone: 'success' })
      },
      createObsAction(obsId: string, title: string, owner: string, dueDate: string) {
        mutate((s) => {
          const o = s.observations.find((x) => x.id === obsId)
          if (!o) return
          const actId = nextId(s.actions.map((a) => a.id), 'ACT-', 3302)
          s.actions.unshift({ id: actId, projectId: o.projectId, status: 'Open', owner, createdAt: DEMO_TODAY, updatedAt: DEMO_TODAY, title, sourceType: 'Observation', sourceId: o.id, department: 'HSE', dueDate, priority: o.severity })
          o.actionIds.push(actId)
          if (o.status === 'Open') o.status = 'Action Assigned'
          logActivity(s, { text: `Action ${actId} created for ${o.id}: ${title}`, user: userOf(s), department: 'HSE', projectId: o.projectId, link: `/hse/observations/${o.id}`, kind: 'hse' })
        })
        pushToast({ title: 'Action created', body: `Assigned to ${owner}`, tone: 'success' })
      },
      escalateObservation(obsId: string) {
        mutate((s) => {
          const o = s.observations.find((x) => x.id === obsId)
          if (!o) return
          o.status = 'Escalated'
          const exists = s.alerts.find((a) => a.sourceId === o.id && a.status !== 'Resolved')
          if (exists) {
            exists.level = 'critical'
            exists.escalation = 'Project Director'
            exists.status = 'Open'
          } else {
            addAlert(s, {
              level: 'critical',
              title: `Escalated: ${o.title}`,
              source: 'Manual escalation',
              sourceId: o.id,
              projectId: o.projectId,
              department: 'HSE',
              impact: `${o.category} at ${o.location}`,
              owner: 'HSE Manager',
              dueDate: DEMO_TODAY,
              recommendation: o.ai?.recommendation ?? 'Stop work until controls verified.',
              escalation: 'Project Director',
              link: `/hse/observations/${o.id}`,
            })
          }
          logActivity(s, { text: `${o.id} escalated to HSE Manager and Project Director`, user: userOf(s), department: 'HSE', projectId: o.projectId, link: '/alerts', kind: 'alert' })
        })
        pushToast({ title: 'Escalated', body: 'HSE Manager and Project Director notified.', tone: 'warning' })
      },
      closeObservation(obsId: string) {
        mutate((s) => {
          const o = s.observations.find((x) => x.id === obsId)
          if (!o) return
          o.status = 'Closed'
          s.actions.forEach((a) => {
            if (a.sourceId === o.id) a.status = 'Closed'
          })
          s.alerts.forEach((a) => {
            if (a.sourceId === o.id) a.status = 'Resolved'
          })
          logActivity(s, { text: `HSE observation ${o.id} closed`, user: userOf(s), department: 'HSE', projectId: o.projectId, link: `/hse/observations/${o.id}`, kind: 'hse' })
        })
        pushToast({ title: `${obsId} closed`, tone: 'success' })
      },
      setActionStatus(actionId: string, status: string) {
        mutate((s) => {
          const a = s.actions.find((x) => x.id === actionId)
          if (a) {
            a.status = status
            a.updatedAt = DEMO_TODAY
          }
        })
      },

      /* ----- Procurement ----- */
      updatePOPrice(poId: string, price: number) {
        mutate((s) => {
          const po = s.pos.find((x) => x.id === poId)
          if (!po || !(price > 0)) return
          po.currentUnitPrice = price
          const v = poVariance(po)
          const existing = s.alerts.find((a) => a.sourceId === po.id && a.rule === 'PR-01' && a.status !== 'Resolved')
          if (v > 5) {
            po.recommendationDismissed = false
            const vendor = s.vendors.find((x) => x.id === po.vendorId)
            const title = `${po.id} vendor price increased ${v.toFixed(1)}% on active PO`
            if (existing) {
              existing.title = title
              existing.level = v > 10 ? 'critical' : 'warning'
              existing.impact = `SAR ${poExposure(po).toLocaleString('en-US')} cost exposure on PO quantity`
            } else {
              addAlert(s, {
                level: v > 10 ? 'critical' : 'warning',
                title,
                source: 'Procurement rule PR-01',
                sourceId: po.id,
                projectId: po.projectId,
                department: 'Procurement',
                impact: `SAR ${poExposure(po).toLocaleString('en-US')} cost exposure on PO quantity`,
                owner: 'Procurement Manager',
                dueDate: addDays(DEMO_TODAY, 3),
                recommendation: 'Review contractual price protection and compare approved alternate vendors.',
                escalation: 'Procurement Head',
                rule: 'PR-01',
                link: `/procurement/pos/${po.id}`,
              })
            }
            po.status = 'Attention Required'
            logActivity(s, { text: `${po.id} unit price changed to SAR ${price.toLocaleString('en-US')} (${v > 0 ? '+' : ''}${v.toFixed(1)}%) by ${vendor?.name ?? 'vendor'}. Rule PR-01 fired.`, user: userOf(s), department: 'Procurement', projectId: po.projectId, link: `/procurement/pos/${po.id}`, kind: 'po' })
          } else {
            if (existing) existing.status = 'Resolved'
            if (po.status === 'Attention Required') po.status = po.daysLate > 0 ? 'Delayed' : 'On Track'
            logActivity(s, { text: `${po.id} unit price changed to SAR ${price.toLocaleString('en-US')} (${v > 0 ? '+' : ''}${v.toFixed(1)}%). Within 5% tolerance.`, user: userOf(s), department: 'Procurement', projectId: po.projectId, link: `/procurement/pos/${po.id}`, kind: 'po' })
          }
        })
      },
      createVendorAction(poId: string, title: string) {
        mutate((s) => {
          const po = s.pos.find((x) => x.id === poId)
          if (!po) return
          const actId = nextId(s.actions.map((a) => a.id), 'ACT-', 3302)
          s.actions.unshift({ id: actId, projectId: po.projectId, status: 'Open', owner: 'Procurement Manager', createdAt: DEMO_TODAY, updatedAt: DEMO_TODAY, title, sourceType: 'PO', sourceId: po.id, department: 'Procurement', dueDate: addDays(DEMO_TODAY, 3), priority: 'High' })
          logActivity(s, { text: `Vendor action ${actId} created on ${po.id}: ${title}`, user: userOf(s), department: 'Procurement', projectId: po.projectId, link: `/procurement/pos/${po.id}`, kind: 'po' })
        })
        pushToast({ title: 'Vendor action created', body: title, tone: 'success' })
      },
      escalatePO(poId: string) {
        mutate((s) => {
          const po = s.pos.find((x) => x.id === poId)
          if (!po || po.escalated) return
          po.escalated = true
          const a = s.alerts.find((x) => x.sourceId === po.id && x.status !== 'Resolved')
          if (a) {
            a.escalation = 'Procurement Head (escalated)'
            a.level = 'critical'
          }
          const vendor = s.vendors.find((x) => x.id === po.vendorId)
          s.approvals.unshift({
            id: nextId(s.approvals.map((x) => x.id), 'APR-', 5107),
            type: 'Vendor change',
            title: `Commercial decision on ${po.id} (${vendor?.name ?? ''})`,
            projectId: po.projectId,
            requestedBy: userOf(s),
            approver: 'CEO',
            summary: `Vendor price ${poVariance(po).toFixed(1)}% above PO rate and ${po.daysLate} days late. Options: enforce price protection, partial re-award, or accept increase.`,
            impact: `SAR ${poExposure(po).toLocaleString('en-US')} exposure. Schedule impact up to ${Math.max(2, Math.round(po.daysLate / 3))} days.`,
            value: `SAR ${(po.value / 1e6).toFixed(1)}M PO`,
            attachments: ['Vendor comparison.xlsx', 'Contract price clause 14.2.pdf'],
            recommendation: 'Enforce price protection clause and partially re-award balance to approved alternate vendor.',
            status: 'Pending',
            createdAt: DEMO_TODAY,
            linkId: po.id,
          })
          logActivity(s, { text: `${po.id} escalated to Procurement Head; decision routed to Approval Centre`, user: userOf(s), department: 'Procurement', projectId: po.projectId, link: '/approvals', kind: 'approval' })
        })
        pushToast({ title: 'Escalated to Procurement Head', body: 'Decision request added to the Approval Centre.', tone: 'warning' })
      },
      dismissRecommendation(poId: string) {
        mutate((s) => {
          const po = s.pos.find((x) => x.id === poId)
          if (!po) return
          po.recommendationDismissed = true
          s.alerts.forEach((a) => {
            if (a.sourceId === po.id && a.status === 'Open') a.status = 'Acknowledged'
          })
          logActivity(s, { text: `Recommendation on ${po.id} dismissed (alert acknowledged)`, user: userOf(s), department: 'Procurement', projectId: po.projectId, link: `/procurement/pos/${po.id}`, kind: 'po' })
        })
        pushToast({ title: 'Recommendation dismissed', body: 'Alert acknowledged. Rule will re-fire if the variance changes.', tone: 'info' })
      },

      /* ----- Documents / Handover ----- */
      setDocStatus(docId: string, to: DocumentRec['status'], note?: string) {
        const d0 = get().documents.find((d) => d.id === docId)
        mutate((s) => {
          const d = s.documents.find((x) => x.id === docId)
          if (!d) return
          const from = d.status
          applyMdrDelta(s, d, from, to)
          d.status = to
          d.updatedAt = DEMO_TODAY
          if (note) d.note = note
          if (to === 'Submitted' || to === 'Under Review') {
            d.submitted = DEMO_TODAY
            if (d.revision === '-') d.revision = 'A'
          }
          if (to === 'Approved') {
            d.approved = DEMO_TODAY
            if (from === 'Expiring' || from === 'Expired') {
              d.expiry = addDays(DEMO_TODAY, 365)
              d.revision = String((parseInt(d.revision, 10) || 0) + 1)
            }
          }
          syncProjectHandover(s, d.projectId)
          const verb = to === 'Approved' ? 'approved' : to === 'Rejected' ? 'rejected' : to === 'Draft' ? 'returned for revision' : to === 'Under Review' || to === 'Submitted' ? 'uploaded for review' : `set to ${to}`
          logActivity(s, { text: `${d.title} ${verb}`, user: userOf(s), department: d.department, projectId: d.projectId, link: '/handover/register', kind: 'doc' })
        })
        if (d0) {
          const msg: Record<string, string> = {
            Approved: 'Dossier completion recalculated.',
            Rejected: 'Returned to owner. Dossier count updated.',
            Draft: 'Revision requested from document owner.',
            'Under Review': 'Document uploaded (simulated) and routed for review.',
            Submitted: 'Document uploaded (simulated).',
          }
          pushToast({ title: `${d0.id}: ${to === 'Draft' ? 'Revision requested' : to}`, body: msg[to], tone: to === 'Rejected' ? 'warning' : 'success' })
        }
      },
      addDocument(input: Pick<DocumentRec, 'projectId' | 'title' | 'docType' | 'category' | 'discipline' | 'department' | 'fileType'> & { linkedTo?: string[] }): string {
        const id = `DOC-${input.projectId}-U${String(get().documents.length + 1).padStart(3, '0')}`
        mutate((s) => {
          const d: DocumentRec = {
            id,
            projectId: input.projectId,
            status: 'Under Review',
            owner: userOf(s),
            createdAt: DEMO_TODAY,
            updatedAt: DEMO_TODAY,
            title: input.title,
            docType: input.docType,
            category: input.category,
            discipline: input.discipline,
            department: input.department,
            revision: 'A',
            submitted: DEMO_TODAY,
            approved: null,
            expiry: null,
            fileType: input.fileType,
            linkedTo: input.linkedTo ?? [],
          }
          s.documents.unshift(d)
          const cat = s.mdr[d.projectId]?.find((c) => c.name === d.category)
          if (cat) cat.review += 1
          syncProjectHandover(s, d.projectId)
          logActivity(s, { text: `${d.title} uploaded for review`, user: userOf(s), department: d.department, projectId: d.projectId, link: '/handover/register', kind: 'doc' })
        })
        pushToast({ title: 'Upload complete (simulated)', body: `${id} routed for review.`, tone: 'success' })
        return id
      },

      /* ----- Approvals / Alerts ----- */
      decideApproval(id: string, decision: Approval['status'], comment: string) {
        mutate((s) => {
          const a = s.approvals.find((x) => x.id === id)
          if (!a || a.status !== 'Pending') return
          a.status = decision
          a.decidedAt = DEMO_TODAY
          a.comment = comment
          if (decision === 'Approved' && a.type === 'NCR CAPA' && a.linkId) {
            const n = s.ncrs.find((x) => x.id === a.linkId)
            const capa = n ? s.capas.find((c) => c.id === n.capaId) : undefined
            if (capa) {
              capa.status = 'Approved'
              capa.progress = Math.max(capa.progress, 40)
            }
          }
          if (decision === 'Approved' && a.type === 'Document approval' && a.linkId) {
            const d = s.documents.find((x) => x.id === a.linkId)
            if (d && d.status !== 'Approved') {
              applyMdrDelta(s, d, d.status, 'Approved')
              d.status = 'Approved'
              d.approved = DEMO_TODAY
              syncProjectHandover(s, d.projectId)
            }
          }
          if (decision === 'Approved' && a.type === 'HSE corrective action' && a.linkId) {
            const o = s.observations.find((x) => x.id === a.linkId)
            if (o && o.status === 'Open') o.status = 'Action Assigned'
          }
          logActivity(s, { text: `Approval ${a.id} ${decision.toLowerCase()}: ${a.title}${comment ? ` (“${comment}”)` : ''}`, user: userOf(s), department: 'Executive', projectId: a.projectId, link: '/approvals', kind: 'approval' })
        })
        pushToast({ title: `${id} ${decision.toLowerCase()}`, body: 'Status updated, activity recorded, requester notified.', tone: decision === 'Approved' ? 'success' : decision === 'Rejected' ? 'error' : 'info' })
      },
      setAlertStatus(id: string, status: Alert['status']) {
        mutate((s) => {
          const a = s.alerts.find((x) => x.id === id)
          if (!a) return
          a.status = status
          logActivity(s, { text: `Alert ${a.id} ${status.toLowerCase()}: ${a.title}`, user: userOf(s), department: a.department, projectId: a.projectId, link: '/alerts', kind: 'alert' })
        })
        pushToast({ title: `Alert ${status.toLowerCase()}`, tone: status === 'Resolved' ? 'success' : 'info' })
      },
      runRules(): number {
        const rulesFn = (s: Draft) => {
          s.ncrs.forEach((n) => applyNcrSla(s, n))
          s.pos.forEach((po) => {
            const v = poVariance(po)
            if (v > 5 && !s.alerts.some((a) => a.sourceId === po.id && a.rule === 'PR-01')) {
              addAlert(s, {
                level: v > 10 ? 'critical' : 'warning',
                title: `${po.id} vendor price increased ${v.toFixed(1)}% on active PO`,
                source: 'Procurement rule PR-01',
                sourceId: po.id,
                projectId: po.projectId,
                department: 'Procurement',
                impact: `SAR ${poExposure(po).toLocaleString('en-US')} cost exposure`,
                owner: 'Procurement Manager',
                dueDate: addDays(DEMO_TODAY, 3),
                recommendation: 'Request commercial justification and compare alternate vendors.',
                escalation: 'Procurement Head',
                rule: 'PR-01',
                link: `/procurement/pos/${po.id}`,
              })
            }
          })
          s.compliance.forEach((c) => {
            if (complianceStatus(c) === 'Expired' && !s.alerts.some((a) => a.sourceId === c.id)) {
              addAlert(s, {
                level: 'warning',
                title: `${c.item} expired on ${c.expiry}`,
                source: 'Compliance engine',
                sourceId: c.id,
                projectId: c.projectId,
                department: 'Compliance',
                impact: 'Activity using this item must stop until renewed',
                owner: c.owner,
                dueDate: addDays(DEMO_TODAY, 2),
                recommendation: c.action,
                escalation: 'Project Director',
                link: '/compliance',
              })
            }
          })
          s.projects.forEach((p) => {
            const util = p.workforcePlanned ? (p.workforce / p.workforcePlanned) * 100 : 100
            if (util < 75 && !s.alerts.some((a) => a.sourceId === `${p.id}-UTIL`)) {
              addAlert(s, {
                level: 'warning',
                title: `Utilisation ${Math.round(util)}% on ${p.shortName}: idle workforce flagged`,
                source: 'Manpower rule HR-01',
                sourceId: `${p.id}-UTIL`,
                projectId: p.id,
                department: 'HR',
                impact: 'Labour cost without matching progress',
                owner: 'Project Manager',
                dueDate: addDays(DEMO_TODAY, 3),
                recommendation: 'Identify cause and reallocate crews.',
                escalation: 'Project Director',
                rule: 'HR-01',
                link: '/hr/utilisation',
              })
            }
          })
        }
        const preview = structuredClone(get())
        const before = preview.alerts.length
        rulesFn(preview)
        const created = preview.alerts.length - before
        mutate(rulesFn)
        return created
      },

      /* ----- Projects ----- */
      createDPR(input: Omit<DPR, 'id' | 'status' | 'owner' | 'createdAt' | 'updatedAt' | 'aiSummary' | 'progressDelta'> & { quantityNum: number }): DPR {
        const s0 = get()
        const project = s0.projects.find((p) => p.id === input.projectId)
        const delta = Math.round(Math.min(3.2, Math.max(0.6, input.quantityNum / 16)) * 10) / 10
        const planned = 2.8
        const id = `DPR-${input.projectId}-${String(s0.dprs.length + 1).padStart(4, '0')}`
        const slow = input.delayCause && input.delayCause !== 'None'
        const aiSummary = `Construction progressed by ${delta}% today against ${planned}% planned on ${project?.shortName ?? input.projectId}. ${input.workPackage} ${slow ? `remained below planned output due to ${input.delayCause.toLowerCase()}.` : 'progressed in line with plan.'}${input.issues ? ` Reported issue: ${input.issues}.` : ''}`
        const { quantityNum: _q, ...rest } = input
        void _q
        const dpr: DPR = { ...rest, id, status: 'Submitted', owner: input.supervisor, createdAt: DEMO_TODAY, updatedAt: DEMO_TODAY, progressDelta: delta, aiSummary }
        mutate((s) => {
          s.dprs.unshift(dpr)
          const wp = s.workPackages.find((w) => w.projectId === input.projectId && w.name === input.workPackage)
          if (wp) {
            wp.progress = Math.min(100, Math.round((wp.progress + delta) * 10) / 10)
            const v = wp.progress - wp.planned
            wp.status = wp.progress >= 100 ? 'Completed' : v <= -5 ? 'Delayed' : v < 0 ? 'At Risk' : 'On Track'
          }
          const p = s.projects.find((x) => x.id === input.projectId)
          if (p) p.progress = Math.min(100, Math.round((p.progress + delta / 10) * 10) / 10)
          logActivity(s, { text: `Daily progress report ${id} submitted: ${input.workCompleted}`, user: input.supervisor, department: 'Projects', projectId: input.projectId, link: `/projects/${input.projectId}?tab=progress`, kind: 'dpr' })
        })
        pushToast({ title: 'Daily report submitted', body: `Progress updated (+${delta}%) and AI summary generated (demo).`, tone: 'success' })
        return dpr
      },
      setAiDprGenerated() {
        mutate((s) => {
          s.aiDprGenerated = true
        })
      },

      /* ----- Compliance / O&M / HR ----- */
      renewCompliance(id: string) {
        mutate((s) => {
          const c = s.compliance.find((x) => x.id === id)
          if (!c) return
          c.status = 'Renewal In Progress'
          c.updatedAt = DEMO_TODAY
          s.alerts.forEach((a) => {
            if (a.sourceId === c.id && a.status === 'Open') a.status = 'Acknowledged'
          })
          logActivity(s, { text: `Renewal initiated: ${c.item} (${c.reference})`, user: userOf(s), department: 'Compliance', projectId: c.projectId, link: '/compliance', kind: 'doc' })
        })
        pushToast({ title: 'Renewal initiated', body: 'Owner notified and tracked until new certificate is uploaded.', tone: 'success' })
      },
      completeRenewal(id: string) {
        mutate((s) => {
          const c = s.compliance.find((x) => x.id === id)
          if (!c) return
          c.status = 'Valid'
          c.expiry = addDays(c.expiry < DEMO_TODAY ? DEMO_TODAY : c.expiry, 365)
          s.alerts.forEach((a) => {
            if (a.sourceId === c.id) a.status = 'Resolved'
          })
          logActivity(s, { text: `Renewed: ${c.item}, new expiry ${c.expiry}`, user: userOf(s), department: 'Compliance', projectId: c.projectId, link: '/compliance', kind: 'doc' })
        })
        pushToast({ title: 'Certificate renewed', body: 'Expiry calendar and alerts updated.', tone: 'success' })
      },
      setWorkOrderStatus(id: string, status: string) {
        mutate((s) => {
          const w = s.workOrders.find((x) => x.id === id)
          if (!w) return
          w.status = status
          w.updatedAt = DEMO_TODAY
          if (status === 'Completed') {
            const asset = s.assets.find((a) => a.id === w.assetId)
            if (asset) {
              asset.history.unshift({ date: DEMO_TODAY, event: `${w.id} completed: ${w.title}`, by: w.technician })
              if (asset.status === 'Degraded' || asset.status === 'Under Maintenance') asset.status = 'Operational'
            }
            s.alerts.forEach((a) => {
              if (a.sourceId === w.id) a.status = 'Resolved'
            })
          }
          logActivity(s, { text: `Work order ${w.id} ${status.toLowerCase()}: ${w.title}`, user: userOf(s), department: 'O&M', projectId: w.projectId, link: `/om/assets/${w.assetId}`, kind: 'system' })
        })
        pushToast({ title: `${id} ${status.toLowerCase()}`, tone: 'success' })
      },
      completePM(id: string) {
        mutate((s) => {
          const t = s.pmTasks.find((x) => x.id === id)
          if (!t) return
          t.status = 'Completed'
          t.lastService = DEMO_TODAY
          const asset = s.assets.find((a) => a.id === t.assetId)
          if (asset) {
            asset.lastMaintenance = DEMO_TODAY
            asset.history.unshift({ date: DEMO_TODAY, event: `${t.maintenanceType} completed (${t.id})`, by: t.technician })
          }
          logActivity(s, { text: `PM ${t.id} completed: ${t.maintenanceType} on ${t.assetId}`, user: userOf(s), department: 'O&M', projectId: t.projectId, link: '/om/pm', kind: 'system' })
        })
        pushToast({ title: 'Preventive maintenance completed', body: 'PM compliance updated.', tone: 'success' })
      },

      /* ----- Field ----- */
      setOnline(online: boolean) {
        mutate((s) => {
          s.field.online = online
        })
      },
      setFailNextSync(v: boolean) {
        mutate((s) => {
          s.field.failNextSync = v
        })
      },
      fieldCapture(record: Omit<FieldRecord, 'id' | 'savedAt'>): 'queued' | 'synced' {
        const online = get().field.online
        mutate((s) => {
          const time = clockLabel(s.clock + 2)
          const r: FieldRecord = { ...record, id: `FLD-${String(s.field.queue.length + s.field.synced.length + 1).padStart(4, '0')}-${s.clock}`, savedAt: time }
          if (s.field.online) {
            applyFieldRecord(s, r)
            s.field.synced.unshift(r)
          } else {
            s.field.queue.push(r)
            s.clock += 2
          }
        })
        return online ? 'synced' : 'queued'
      },
      syncQueue(): boolean {
        const s0 = get()
        if (s0.field.failNextSync) {
          mutate((s) => {
            s.field.failNextSync = false
          })
          return false
        }
        mutate((s) => {
          const q = s.field.queue
          q.forEach((r) => applyFieldRecord(s, r))
          s.field.synced = [...q, ...s.field.synced]
          s.field.queue = []
          s.field.online = true
          s.field.lastSync = `Today ${clockLabel(s.clock)}`
          if (q.length) logActivity(s, { text: `Field app synchronised ${q.length} site record${q.length > 1 ? 's' : ''} from Spread 2`, user: 'Faisal Al-Qahtani', department: 'Projects', projectId: 'NPE', kind: 'field' })
        })
        return true
      },
      markAttendance() {
        mutate((s) => {
          s.field.attendanceMarked = true
        })
      },
      toggleFieldTask(id: string) {
        mutate((s) => {
          const i = s.field.tasksDone.indexOf(id)
          if (i >= 0) s.field.tasksDone.splice(i, 1)
          else s.field.tasksDone.push(id)
        })
      },
    }
  }, [setState, stateRef, pushToast])
}

export type Actions = ReturnType<typeof useActions>

interface StoreValue {
  state: AppState
  actions: Actions
  toasts: Toast[]
  dismissToast: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(loadState)
  const stateRef = useRef(state)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastSeq = useRef(0)

  const setState = useCallback((fn: (prev: AppState) => AppState) => {
    setStateRaw((prev) => {
      const next = fn(prev)
      stateRef.current = next
      return next
    })
  }, [])

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    toastSeq.current += 1
    const id = `T${toastSeq.current}`
    setToasts((prev) => [...prev.slice(-3), { ...t, id }])
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((x) => x.id !== id)), [])

  const actions = useActions(setState, stateRef, pushToast)

  useEffect(() => {
    stateRef.current = state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota or privacy mode */
    }
  }, [state])

  useEffect(() => {
    document.documentElement.lang = state.lang
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr'
  }, [state.lang])

  const value = useMemo(() => ({ state, actions, toasts, dismissToast }), [state, actions, toasts, dismissToast])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
