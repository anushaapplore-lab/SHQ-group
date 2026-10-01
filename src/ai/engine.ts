import { manpowerByProject, idleCauses } from '../data/hr'
import type { AppState } from '../store/seed'
import { criticalOpen, mdrSummary, ncrAge, overdueNcrs, pendingApprovals, poVariance, projectName, expiringCount, openObservations } from '../store/selectors'
import { fmtDate } from '../lib/format'

export interface AiSection {
  heading: string
  items: string[]
  ordered?: boolean
}

export interface AiAnswer {
  intro: string[]
  sections: AiSection[]
  links: { label: string; to: string }[]
  rtl?: boolean
}

export const SUGGESTED = [
  'Which projects are behind schedule?',
  'Why is North Pipeline behind?',
  'Which NCRs are overdue?',
  'Which documents are at risk before handover?',
  'Where is manpower underutilised?',
  'Which vendors are causing delays?',
  'What needs management attention today?',
  'Show me the biggest risks across the portfolio.',
]

export const SUGGESTED_AR = ['ما هي المشاريع المتأخرة عن الجدول؟', 'لماذا يتأخر مشروع خط الأنابيب الشمالي؟', 'ما الذي يحتاج إلى اهتمام الإدارة اليوم؟']

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w))

export function answer(question: string, s: AppState): AiAnswer {
  const q = question.toLowerCase().trim()

  // Arabic questions
  if (/[؀-ۿ]/.test(question)) {
    if (has(q, 'الشمالي', 'خط الأنابيب')) {
      return {
        rtl: true,
        intro: ['مشروع توسعة خط الأنابيب الشمالي متأخر حاليًا ٨ أيام عن الخط الأساسي.'],
        sections: [
          { heading: 'المساهمون الرئيسيون:', ordered: true, items: ['تأخر توريد المواد: ٤ أيام', 'توفر فحص الاختبارات غير الإتلافية: يومان', 'إنتاجية اللحام: يومان'] },
          { heading: 'إجراءات الإدارة الموصى بها:', items: ['تصعيد المورد Gulf Industrial Supplies', 'زيادة طاقة فحص الاختبارات غير الإتلافية', 'مراجعة توزيع فرق اللحام'] },
        ],
        links: [{ label: 'فتح المشروع', to: '/projects/NPE' }],
      }
    }
    if (has(q, 'اهتمام', 'اليوم')) {
      const c = criticalOpen(s)
      return {
        rtl: true,
        intro: [`يوجد ${c.length} تنبيهًا حرجًا مفتوحًا و${pendingApprovals(s).length} موافقات معلقة.`],
        sections: [{ heading: 'أهم البنود:', ordered: true, items: c.slice(0, 4).map((a) => `${a.title} (${projectName(s, a.projectId)})`) }],
        links: [{ label: 'التنبيهات والتصعيد', to: '/alerts' }],
      }
    }
    const behind = s.projects.filter((p) => p.scheduleVarianceDays < 0).sort((a, b) => a.scheduleVarianceDays - b.scheduleVarianceDays)
    return {
      rtl: true,
      intro: [`${behind.length} مشاريع متأخرة عن الجدول الزمني الأساسي حاليًا.`],
      sections: [{ heading: 'المشاريع المتأخرة:', ordered: true, items: behind.map((p) => `${p.name}: ${Math.abs(p.scheduleVarianceDays)} أيام تأخير (التقدم ${p.progress}% مقابل ${p.planned}% مخطط)`) }],
      links: [{ label: 'جميع المشاريع', to: '/projects' }],
    }
  }

  if (has(q, 'north', 'pipeline') && has(q, 'behind', 'why', 'delay', 'late')) {
    const ncr = s.ncrs.find((n) => n.id === 'NCR-00218' && n.status !== 'Closed')
    const po = s.pos.find((p) => p.id === 'PO-450021')
    return {
      intro: ['North Pipeline is currently 8 days behind baseline.'],
      sections: [
        { heading: 'Primary contributors:', ordered: true, items: ['Material delivery: 4 days', 'NDT inspection availability: 2 days', 'Welding productivity: 2 days'] },
        {
          heading: 'Recommended management actions:',
          items: ['Escalate Gulf Industrial Supplies', 'Increase NDT inspection capacity', 'Review welding crew allocation'],
        },
        {
          heading: 'Supporting signals:',
          items: [
            po ? `PO-450021: ${po.daysLate} days late, unit price ${poVariance(po) > 0 ? '+' : ''}${poVariance(po).toFixed(1)}% vs PO rate` : '',
            'Welding progress 68% vs 74% planned; 43 weld joints affected by material availability',
            '61 joints awaiting RT/UT; inspection waiting is the top idle cause (420 hours this month)',
            ncr ? `${ncr.id} (${ncr.title}) adds rework exposure on the KP 42 welding front` : '',
          ].filter(Boolean),
        },
      ],
      links: [
        { label: 'Project Command View', to: '/projects/NPE' },
        { label: 'PO-450021', to: '/procurement/pos/PO-450021' },
        { label: 'Welding work package', to: '/projects/NPE?tab=progress' },
      ],
    }
  }

  if (has(q, 'behind', 'schedule', 'late project', 'delayed project')) {
    const behind = s.projects.filter((p) => p.scheduleVarianceDays < 0).sort((a, b) => a.scheduleVarianceDays - b.scheduleVarianceDays)
    return {
      intro: [`${behind.length} of ${s.projects.length} projects are behind their baseline schedule.`],
      sections: [
        {
          heading: 'Behind schedule (largest variance first):',
          ordered: true,
          items: behind.map((p) => `${p.name}: ${Math.abs(p.scheduleVarianceDays)} days behind, ${p.progress}% actual vs ${p.planned}% planned (${p.rag})`),
        },
        { heading: 'Common drivers:', items: ['Late material deliveries (PO-450021, PO-450080)', 'Inspection and NDT availability', 'Manpower shortfall on Khurais Substation'] },
      ],
      links: [
        { label: 'Portfolio', to: '/portfolio' },
        { label: 'Risks & Delays', to: '/projects/risks' },
      ],
    }
  }

  if (has(q, 'ncr', 'non-conform', 'nonconform')) {
    const od = overdueNcrs(s)
    return {
      intro: [od.length ? `${od.length} NCRs have exceeded their closure target.` : 'No NCRs are currently overdue.'],
      sections: od.length
        ? [
            { heading: 'Overdue NCRs:', ordered: true, items: od.map((n) => `${n.id} · ${projectName(s, n.projectId)} · ${n.title} · ${ncrAge(n)} days open (target ${n.slaDays}) · ${n.status}`) },
            { heading: 'Recommended:', items: ['Escalate CAPA owners on Eastern Gas Compression (3 overdue)', 'Hold a closure review board this week', 'Track closure through rule QA-01 escalations'] },
          ]
        : [],
      links: [{ label: 'NCR register', to: '/quality/ncrs' }],
    }
  }

  if (has(q, 'document', 'handover', 'dossier', 'mdr')) {
    const rows = Object.entries(s.mdr).map(([pid, cats]) => ({ pid, sum: mdrSummary(cats), worst: [...cats].sort((a, b) => a.completed / a.required - b.completed / b.required)[0] }))
    return {
      intro: [`Dossier risk is concentrated in as-built drawings and commissioning records. ${expiringCount(s)} documents and certificates expire within 30 days.`],
      sections: [
        {
          heading: 'By project:',
          items: rows.map((r) => `${projectName(s, r.pid)}: ${r.sum.pct.toFixed(0)}% complete, ${r.sum.missing} missing, ${r.sum.expired} expired. Weakest category: ${r.worst.name} (${Math.round((r.worst.completed / r.worst.required) * 100)}%)`),
        },
        { heading: 'Recommended:', items: ['Assign owners to all missing documents', 'Run a weekly dossier review on Refinery Utilities before mechanical completion', 'Renew expiring calibration and crane certificates'] },
      ],
      links: [
        { label: 'Handover Readiness', to: '/handover' },
        { label: 'Missing documents', to: '/handover/missing' },
      ],
    }
  }

  if (has(q, 'manpower', 'idle', 'utilis', 'utiliz', 'workforce')) {
    const low = manpowerByProject.filter((m) => m.utilisation < 88).sort((a, b) => a.utilisation - b.utilisation)
    return {
      intro: ['Portfolio utilisation is 88% with 92 idle workers. 17% idle time on North Pipeline is driven mainly by inspection waiting.'],
      sections: [
        { heading: 'Underutilised projects:', ordered: true, items: low.map((m) => `${projectName(s, m.projectId)}: ${m.utilisation}% utilisation, ${m.idle} idle, ${m.actual}/${m.planned} deployed`) },
        { heading: 'Idle hour causes (month to date):', items: idleCauses.map((c) => `${c.cause}: ${c.hours} h`) },
        { heading: 'Recommended:', items: ['Synchronise inspection planning with construction look-ahead', 'Approve second NDT crew (APR-5102)', 'Redeploy idle crews from North Pipeline to Khurais Substation'] },
      ],
      links: [{ label: 'Utilisation', to: '/hr/utilisation' }],
    }
  }

  if (has(q, 'vendor', 'supplier', 'delivery', 'deliveries')) {
    const late = s.pos.filter((p) => p.daysLate > 0).sort((a, b) => b.daysLate - a.daysLate)
    return {
      intro: [`${late.length} purchase orders are late. Gulf Industrial Supplies has the largest combined schedule and price impact.`],
      sections: [
        {
          heading: 'Late purchase orders:',
          ordered: true,
          items: late.map((p) => `${p.id} · ${s.vendors.find((v) => v.id === p.vendorId)?.name} · ${p.material} · ${p.daysLate} days late${poVariance(p) > 5 ? ` · price +${poVariance(p).toFixed(1)}%` : ''}`),
        },
        { heading: 'Recommended:', items: ['Escalate Gulf Industrial Supplies and enforce price protection', 'Evaluate Desert Pipeline Materials for PO-450021 balance', 'Vendor HQ escalation on transformer PO-450080'] },
      ],
      links: [
        { label: 'Vendors', to: '/procurement/vendors' },
        { label: 'PO-450021', to: '/procurement/pos/PO-450021' },
      ],
    }
  }

  if (has(q, 'attention', 'today', 'management', 'priorit')) {
    const c = criticalOpen(s)
    const ap = pendingApprovals(s)
    return {
      intro: [`${c.length} critical issues are open and ${ap.length} approvals are waiting.`],
      sections: [
        { heading: 'Top critical items:', ordered: true, items: c.slice(0, 5).map((a) => `${a.title} (${projectName(s, a.projectId)}). Owner: ${a.owner}`) },
        { heading: 'Decisions waiting:', items: ap.slice(0, 4).map((a) => `${a.id}: ${a.title}${a.value ? ` (${a.value})` : ''}`) },
      ],
      links: [
        { label: 'Alerts & Escalations', to: '/alerts' },
        { label: 'Approval Centre', to: '/approvals' },
      ],
    }
  }

  if (has(q, 'risk')) {
    const top = [...s.risks].sort((a, b) => b.probability * b.impact - a.probability * a.impact).slice(0, 6)
    return {
      intro: ['The highest-scoring risks across the portfolio (probability × impact):'],
      sections: [
        { heading: 'Top risks:', ordered: true, items: top.map((r) => `${r.title} · ${projectName(s, r.projectId)} · score ${r.probability * r.impact} · owner ${r.owner}`) },
        { heading: 'Mitigations in place:', items: top.slice(0, 3).map((r) => r.mitigation) },
      ],
      links: [{ label: 'Risks & Delays', to: '/projects/risks' }],
    }
  }

  if (has(q, 'hse', 'safety', 'observation', 'incident')) {
    const open = openObservations(s)
    const high = open.filter((o) => o.severity === 'High' || o.severity === 'Critical')
    return {
      intro: [`${open.length} HSE observations are open, ${high.length} of them high severity.`],
      sections: [{ heading: 'High-severity open observations:', ordered: true, items: high.map((o) => `${o.id} · ${o.title} · ${projectName(s, o.projectId)} · due ${fmtDate(o.dueDate)}`) }],
      links: [{ label: 'HSE Command Centre', to: '/hse' }],
    }
  }

  if (has(q, 'price', 'cost', 'procurement', 'po')) {
    const v = s.pos.filter((p) => poVariance(p) > 0).sort((a, b) => poVariance(b) - poVariance(a))
    return {
      intro: ['Purchase orders with unit price movement against the original PO rate:'],
      sections: [{ heading: 'Price variance:', ordered: true, items: v.map((p) => `${p.id} · ${p.material} · +${poVariance(p).toFixed(1)}%`) }],
      links: [{ label: 'Price Variance', to: '/procurement/variance' }],
    }
  }

  return {
    intro: ['I can analyse schedule, quality, HSE, procurement, manpower, handover and compliance using the current demo records. Try one of the suggested questions, or ask about a project, NCR, vendor or document.'],
    sections: [],
    links: [],
  }
}
