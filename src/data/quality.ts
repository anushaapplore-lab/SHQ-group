import type { CAPA, Inspection, NCR } from './types'

const ins = (
  id: string,
  projectId: string,
  discipline: string,
  location: string,
  reference: string,
  inspector: string,
  type: string,
  workPackageId: string,
  date: string,
  result: Inspection['result'],
  findings: string[] = [],
): Inspection => ({
  id,
  projectId,
  status: result,
  owner: inspector,
  createdAt: date,
  updatedAt: date,
  discipline,
  location,
  reference,
  inspector,
  type,
  workPackageId,
  date,
  findings,
  photos: [],
  result,
})

export const inspections: Inspection[] = [
  {
    ...ins('INS-WLD-00428', 'NPE', 'Welding', 'KP 42+600', 'W-00428', 'Mohammed Al-Harbi', 'Visual + NDT', 'NPE-WP04', '2026-09-28', 'Failed', ['Undercut', 'Incomplete penetration']),
    photos: ['Weld cap, 12 o\'clock position', 'Root profile, radiograph film RT-00428', 'Undercut close-up, 4 o\'clock', 'Joint marking and heat number'],
  },
  ins('INS-WLD-00427', 'NPE', 'Welding', 'KP 42+588', 'W-00427', 'Mohammed Al-Harbi', 'Visual + NDT', 'NPE-WP04', '2026-09-28', 'Passed'),
  ins('INS-WLD-00426', 'NPE', 'Welding', 'KP 42+576', 'W-00426', 'Mohammed Al-Harbi', 'Visual + NDT', 'NPE-WP04', '2026-09-28', 'Passed'),
  ins('INS-WLD-00425', 'NPE', 'Welding', 'KP 42+564', 'W-00425', 'Rakesh Menon', 'Visual', 'NPE-WP04', '2026-09-27', 'Passed'),
  ins('INS-NDT-00311', 'NPE', 'Pipeline Integrity', 'KP 41+900', 'RT batch B-31', 'Rakesh Menon', 'Radiography review', 'NPE-WP05', '2026-09-27', 'Passed'),
  ins('INS-COT-00174', 'NPE', 'Coating', 'KP 39+200', 'Field joint FJ-0391', 'Anwar Hussain', 'Holiday test', 'NPE-WP06', '2026-09-30', 'Passed'),
  ins('INS-COT-00175', 'NPE', 'Coating', 'KP 39+212', 'Field joint FJ-0392', 'Anwar Hussain', 'DFT + holiday test', 'NPE-WP06', '2026-09-30', 'Pending'),
  ins('INS-CIV-00092', 'NPE', 'Civil', 'KP 33+100', 'Trench section T-33', 'Sami Al-Otaibi', 'Trench depth and padding', 'NPE-WP02', '2026-09-30', 'Passed'),
  ins('INS-MAT-00058', 'NPE', 'Material', 'Laydown Yard 2', 'Heat 7741-B', 'Rakesh Menon', 'Material receiving + MTR', 'NPE-WP03', '2026-09-29', 'Passed'),
  ins('INS-HYD-00014', 'NPE', 'Hydrotest', 'Test section TS-03', 'TS-03', 'Mohammed Al-Harbi', 'Hydrotest witness', 'NPE-WP07', '2026-09-26', 'Passed'),
  ins('INS-WLD-00611', 'EGC', 'Welding', 'Compressor train B, spool 14', 'W-B14-07', 'Arjun Nair', 'Visual + PT', 'EGC-WP04', '2026-09-30', 'Failed', ['Porosity']),
  ins('INS-EI-00133', 'EGC', 'E&I', 'MCC room', 'Cable tray CT-08', 'Ziad Haddad', 'Cable termination check', 'EGC-WP06', '2026-09-30', 'Passed'),
  ins('INS-MAT-00121', 'EGC', 'Material', 'Warehouse W1', 'Flange lot FL-221', 'Arjun Nair', 'PMI', 'EGC-WP04', '2026-09-29', 'Passed'),
  ins('INS-CIV-00140', 'RUU', 'Civil', 'Cooling tower basin', 'Pour CT-B-05', 'Bilal Ahmed', 'Pre-pour inspection', 'RUU-WP01', '2026-09-30', 'Passed'),
  ins('INS-COT-00201', 'RUU', 'Coating', 'Pipe rack PR-3', 'Steel members PR3-22', 'Bilal Ahmed', 'DFT', 'RUU-WP07', '2026-09-29', 'Failed', ['Low dry film thickness']),
  ins('INS-HYD-00030', 'RUU', 'Hydrotest', 'Steam header', 'HT-SH-02', 'Ziad Haddad', 'Hydrotest witness', 'RUU-WP08', '2026-09-28', 'Passed'),
  ins('INS-EI-00098', 'JTF', 'E&I', 'Tank T-104', 'Level transmitter LT-104', 'Ziad Haddad', 'Loop check', 'JTF-WP06', '2026-09-30', 'Passed'),
  ins('INS-WLD-00702', 'JTF', 'Welding', 'Tank T-104 shell', 'Seam S-12', 'Arjun Nair', 'Vacuum box test', 'JTF-WP04', '2026-09-29', 'Passed'),
]

const AGE_REF = '2026-10-01'
const daysBefore = (n: number) => {
  const d = new Date(AGE_REF + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

const ncr = (
  n: number,
  projectId: string,
  title: string,
  severity: NCR['severity'],
  discipline: string,
  status: NCR['status'],
  ageDays: number,
  slaDays: number,
  responsible: string,
  source = 'Inspection',
): NCR => {
  const detectedAt = daysBefore(ageDays)
  const due = new Date(detectedAt + 'T00:00:00Z')
  due.setUTCDate(due.getUTCDate() + slaDays)
  return {
    id: `NCR-${String(n).padStart(5, '0')}`,
    projectId,
    status,
    owner: 'QA/QC Manager',
    createdAt: detectedAt,
    updatedAt: AGE_REF,
    title,
    severity,
    source,
    discipline,
    description: `${title}. Identified during ${source.toLowerCase()} and recorded against the project quality plan.`,
    rootCause: status === 'Open' ? '' : 'Under investigation by discipline lead.',
    immediateCorrection: 'Area segregated and tagged as non-conforming.',
    correctiveAction: '',
    preventiveAction: '',
    responsible,
    dueDate: due.toISOString().slice(0, 10),
    detectedAt,
    slaDays,
    ageAdjust: 0,
    costImpact: severity === 'Major' ? 24000 : 6500,
  }
}

export const ncrs: NCR[] = [
  // North Pipeline Expansion: 7 open
  ncr(200, 'NPE', 'Coating holiday at field joint FJ-0377', 'Minor', 'Coating', 'Investigation', 6, 14, 'Coating Supervisor'),
  ncr(203, 'NPE', 'Trench padding thickness below specification KP 29', 'Minor', 'Civil', 'Open', 4, 14, 'Civil Superintendent'),
  ncr(205, 'NPE', 'Welder qualification record missing for WQ-118', 'Major', 'Welding', 'CAPA Submitted', 8, 10, 'Welding Superintendent', 'Document audit'),
  ncr(207, 'NPE', 'Bevel angle out of tolerance on 6 joints', 'Minor', 'Welding', 'Investigation', 5, 14, 'Welding Superintendent'),
  ncr(209, 'NPE', 'MTR heat number mismatch, lot 7741-C', 'Major', 'Material', 'Verification', 13, 10, 'QA/QC Manager', 'Material receiving'),
  ncr(212, 'NPE', 'Hydrotest gauge calibration expired at TS-02', 'Minor', 'Hydrotest', 'Open', 2, 14, 'Testing Engineer'),
  ncr(215, 'NPE', 'Holiday detector voltage not recorded', 'Minor', 'Coating', 'Open', 1, 14, 'Coating Supervisor', 'Surveillance'),
  // Eastern Gas Compression: 6 open
  ncr(201, 'EGC', 'Spool dimensional deviation, train B', 'Major', 'Welding', 'Investigation', 16, 10, 'Piping Superintendent'),
  ncr(204, 'EGC', 'Porosity on PT-inspected welds W-B14', 'Major', 'Welding', 'Open', 12, 10, 'Welding Superintendent'),
  ncr(206, 'EGC', 'Anchor bolt projection out of tolerance', 'Minor', 'Civil', 'CAPA Submitted', 19, 14, 'Civil Superintendent'),
  ncr(210, 'EGC', 'Instrument tubing support spacing', 'Minor', 'E&I', 'Investigation', 7, 14, 'E&I Supervisor'),
  ncr(213, 'EGC', 'Gasket material substitution without approval', 'Major', 'Material', 'Open', 3, 10, 'Procurement Manager', 'Material receiving'),
  ncr(216, 'EGC', 'Cable gland IP rating mismatch', 'Minor', 'E&I', 'Open', 2, 14, 'E&I Supervisor'),
  // Refinery Utilities: 4 open
  ncr(202, 'RUU', 'Low DFT on pipe rack PR-3 members', 'Minor', 'Coating', 'Investigation', 17, 14, 'Painting Supervisor'),
  ncr(208, 'RUU', 'Concrete cube strength below 28-day target', 'Major', 'Civil', 'Verification', 9, 10, 'Civil Superintendent'),
  ncr(211, 'RUU', 'Steam trap orientation incorrect', 'Minor', 'Mechanical', 'Open', 5, 14, 'Mechanical Supervisor'),
  ncr(214, 'RUU', 'Missing calibration sticker on torque wrench TW-12', 'Minor', 'Calibration', 'Open', 3, 14, 'QA/QC Inspector', 'Surveillance'),
  // Industrial Maintenance Framework: 1 open
  ncr(217, 'IMF', 'Pump alignment record incomplete P-2201B', 'Minor', 'Mechanical', 'Open', 4, 14, 'O&M Supervisor', 'Work order review'),
  // Closed, for history
  { ...ncr(196, 'NPE', 'Incorrect electrode batch issued, Spread 1', 'Major', 'Welding', 'Closed', 34, 10, 'Welding Superintendent'), updatedAt: '2026-09-12' },
  { ...ncr(197, 'EGC', 'Flange face damage on delivery', 'Minor', 'Material', 'Closed', 28, 14, 'QA/QC Inspector'), updatedAt: '2026-09-18' },
  { ...ncr(198, 'RUU', 'Grout curing record missing', 'Minor', 'Civil', 'Closed', 25, 14, 'Civil Superintendent'), updatedAt: '2026-09-20' },
  { ...ncr(199, 'NPE', 'Lowering-in sling damage to coating', 'Minor', 'Coating', 'Closed', 22, 14, 'Coating Supervisor'), updatedAt: '2026-09-21' },
]

export const capas: CAPA[] = [
  {
    id: 'CAPA-00091',
    projectId: 'NPE',
    status: 'In Progress',
    owner: 'Welding Superintendent',
    createdAt: '2026-09-27',
    updatedAt: '2026-09-30',
    ncrId: 'NCR-00205',
    rootCause: 'Welder qualification records not uploaded after re-test.',
    correctiveAction: 'Upload WQ-118 record and verify all active welders against WQT log.',
    preventiveAction: 'Weekly WQT register reconciliation by QA/QC.',
    dueDate: '2026-10-04',
    progress: 60,
  },
  {
    id: 'CAPA-00088',
    projectId: 'EGC',
    status: 'Overdue',
    owner: 'Civil Superintendent',
    createdAt: '2026-09-20',
    updatedAt: '2026-09-28',
    ncrId: 'NCR-00206',
    rootCause: 'Template misalignment during anchor bolt casting.',
    correctiveAction: 'Engineering assessment and grout pad adjustment.',
    preventiveAction: 'Survey check of templates prior to pour.',
    dueDate: '2026-09-29',
    progress: 45,
  },
  {
    id: 'CAPA-00085',
    projectId: 'RUU',
    status: 'In Progress',
    owner: 'Civil Superintendent',
    createdAt: '2026-09-24',
    updatedAt: '2026-09-30',
    ncrId: 'NCR-00208',
    rootCause: 'Water-cement ratio exceeded due to site addition of water.',
    correctiveAction: 'Core testing of affected pour and structural assessment.',
    preventiveAction: 'Batch plant slump control and no-site-water rule.',
    dueDate: '2026-10-06',
    progress: 70,
  },
  {
    id: 'CAPA-00083',
    projectId: 'NPE',
    status: 'In Progress',
    owner: 'QA/QC Manager',
    createdAt: '2026-09-21',
    updatedAt: '2026-09-30',
    ncrId: 'NCR-00209',
    rootCause: 'Heat number transcription error at vendor dispatch.',
    correctiveAction: 'Obtain corrected MTR from Gulf Industrial Supplies and re-verify heat 7741-C.',
    preventiveAction: 'Barcode scan of heat numbers at receiving.',
    dueDate: '2026-10-03',
    progress: 80,
  },
]

export const rfis = [
  { id: 'RFI-0412', projectId: 'NPE', title: 'Crossing detail at KP 58 wadi', discipline: 'Civil', raisedBy: 'Faisal Al-Qahtani', to: 'Client Engineering', raised: '2026-09-22', due: '2026-10-02', status: 'Open' },
  { id: 'RFI-0415', projectId: 'NPE', title: 'Alternate coating repair material approval', discipline: 'Coating', raisedBy: 'Anwar Hussain', to: 'Client Engineering', raised: '2026-09-25', due: '2026-10-05', status: 'Open' },
  { id: 'RFI-0418', projectId: 'NPE', title: 'Tie-in location TP-3 elevation clash', discipline: 'Piping', raisedBy: 'Faisal Al-Qahtani', to: 'Design Consultant', raised: '2026-09-28', due: '2026-10-08', status: 'Open' },
  { id: 'RFI-0420', projectId: 'NPE', title: 'Cathodic protection test post spacing', discipline: 'E&I', raisedBy: 'Ziad Haddad', to: 'Client Engineering', raised: '2026-09-29', due: '2026-10-09', status: 'Open' },
  { id: 'RFI-0331', projectId: 'EGC', title: 'Compressor skid grouting procedure', discipline: 'Mechanical', raisedBy: 'Arjun Nair', to: 'Vendor', raised: '2026-09-12', due: '2026-09-22', status: 'Overdue' },
  { id: 'RFI-0336', projectId: 'EGC', title: 'Anti-surge valve orientation', discipline: 'Piping', raisedBy: 'Arjun Nair', to: 'Design Consultant', raised: '2026-09-18', due: '2026-09-28', status: 'Overdue' },
  { id: 'RFI-0341', projectId: 'EGC', title: 'Cable route through existing trench', discipline: 'E&I', raisedBy: 'Ziad Haddad', to: 'Client Engineering', raised: '2026-09-24', due: '2026-10-04', status: 'Open' },
  { id: 'RFI-0344', projectId: 'EGC', title: 'Firewater ring main tie-in', discipline: 'Piping', raisedBy: 'Arjun Nair', to: 'Client Engineering', raised: '2026-09-27', due: '2026-10-07', status: 'Open' },
  { id: 'RFI-0347', projectId: 'EGC', title: 'Lube oil console foundation', discipline: 'Civil', raisedBy: 'Bilal Ahmed', to: 'Design Consultant', raised: '2026-09-30', due: '2026-10-10', status: 'Open' },
  { id: 'RFI-0219', projectId: 'RUU', title: 'Cooling tower fill material substitution', discipline: 'Mechanical', raisedBy: 'Bilal Ahmed', to: 'Client Engineering', raised: '2026-09-20', due: '2026-09-30', status: 'Open' },
  { id: 'RFI-0222', projectId: 'RUU', title: 'Steam header support detail', discipline: 'Piping', raisedBy: 'Ziad Haddad', to: 'Design Consultant', raised: '2026-09-26', due: '2026-10-06', status: 'Open' },
  { id: 'RFI-0225', projectId: 'RUU', title: 'Instrument air dryer location', discipline: 'E&I', raisedBy: 'Ziad Haddad', to: 'Client Engineering', raised: '2026-09-29', due: '2026-10-09', status: 'Open' },
  { id: 'RFI-0108', projectId: 'JTF', title: 'Tank roof seal type', discipline: 'Mechanical', raisedBy: 'Arjun Nair', to: 'Client Engineering', raised: '2026-09-23', due: '2026-10-03', status: 'Open' },
  { id: 'RFI-0399', projectId: 'NPE', title: 'Marker post spacing in urban section', discipline: 'Civil', raisedBy: 'Sami Al-Otaibi', to: 'Client Engineering', raised: '2026-09-01', due: '2026-09-11', status: 'Closed' },
]

export const punchItems = [
  { id: 'PL-NPE-0142', projectId: 'NPE', item: 'Missing marker tape at KP 12+300', category: 'B', discipline: 'Civil', owner: 'Civil Superintendent', due: '2026-10-15', status: 'Open' },
  { id: 'PL-NPE-0147', projectId: 'NPE', item: 'Coating touch-up at launcher barrel', category: 'A', discipline: 'Coating', owner: 'Coating Supervisor', due: '2026-10-08', status: 'Open' },
  { id: 'PL-NPE-0151', projectId: 'NPE', item: 'Valve tag plates not installed SDV-104', category: 'B', discipline: 'Mechanical', owner: 'Mechanical Superintendent', due: '2026-10-20', status: 'Open' },
  { id: 'PL-NPE-0155', projectId: 'NPE', item: 'Fence earthing at block valve station 2', category: 'A', discipline: 'E&I', owner: 'E&I Supervisor', due: '2026-10-10', status: 'In Progress' },
  { id: 'PL-EGC-0088', projectId: 'EGC', item: 'Handrail gap at compressor platform', category: 'A', discipline: 'Structural', owner: 'Structural Supervisor', due: '2026-10-06', status: 'Open' },
  { id: 'PL-EGC-0091', projectId: 'EGC', item: 'Insulation cladding damaged on line 6"-PG-0142', category: 'B', discipline: 'Insulation', owner: 'Insulation Foreman', due: '2026-10-18', status: 'Open' },
  { id: 'PL-RUU-0203', projectId: 'RUU', item: 'Missing bolts at steam trap station ST-14', category: 'A', discipline: 'Mechanical', owner: 'Mechanical Supervisor', due: '2026-10-05', status: 'Open' },
  { id: 'PL-RUU-0207', projectId: 'RUU', item: 'Cable tray cover missing at rack PR-2', category: 'B', discipline: 'E&I', owner: 'E&I Supervisor', due: '2026-10-12', status: 'Closed' },
]

export const punchCounts: Record<string, number> = { NPE: 31, EGC: 22, RUU: 17, JTF: 4, KSS: 2 }

export const calibration = [
  { id: 'CAL-0091', projectId: 'NPE', instrument: 'Pressure gauge 0 to 250 bar', tag: 'PG-HT-07', lastCal: '2026-04-02', due: '2026-10-02', status: 'Due' },
  { id: 'CAL-0094', projectId: 'NPE', instrument: 'Holiday detector', tag: 'HD-03', lastCal: '2026-07-14', due: '2027-01-14', status: 'Valid' },
  { id: 'CAL-0097', projectId: 'NPE', instrument: 'Welding machine ammeter', tag: 'WM-22', lastCal: '2026-03-20', due: '2026-09-20', status: 'Expired' },
  { id: 'CAL-0102', projectId: 'NPE', instrument: 'DFT gauge', tag: 'DFT-05', lastCal: '2026-08-01', due: '2027-02-01', status: 'Valid' },
  { id: 'CAL-0110', projectId: 'EGC', instrument: 'Torque wrench 200 to 1000 Nm', tag: 'TW-12', lastCal: '2026-03-28', due: '2026-09-28', status: 'Expired' },
  { id: 'CAL-0113', projectId: 'EGC', instrument: 'Multimeter', tag: 'MM-09', lastCal: '2026-06-10', due: '2026-12-10', status: 'Valid' },
  { id: 'CAL-0118', projectId: 'RUU', instrument: 'Chart recorder', tag: 'CR-02', lastCal: '2026-04-15', due: '2026-10-15', status: 'Due' },
  { id: 'CAL-0120', projectId: 'RUU', instrument: 'Dead weight tester', tag: 'DWT-01', lastCal: '2026-05-05', due: '2026-11-05', status: 'Valid' },
]

export const mtrs = [
  { id: 'MTR-CS-2231', projectId: 'NPE', material: '24" API 5L X65 line pipe', heat: '7741-B', vendor: 'Gulf Industrial Supplies', po: 'PO-450021', verified: 'Verified', date: '2026-09-29' },
  { id: 'MTR-CS-2232', projectId: 'NPE', material: '24" API 5L X65 line pipe', heat: '7741-C', vendor: 'Gulf Industrial Supplies', po: 'PO-450021', verified: 'Discrepancy', date: '2026-09-18' },
  { id: 'MTR-FT-0418', projectId: 'NPE', material: 'Induction bends 24" 3D', heat: 'B-2209', vendor: 'Desert Pipeline Materials', po: 'PO-450037', verified: 'Verified', date: '2026-09-10' },
  { id: 'MTR-WC-0077', projectId: 'NPE', material: 'E8010-P1 electrodes', heat: 'Lot 55-17', vendor: 'Al Noor Engineering', po: 'PO-450044', verified: 'Verified', date: '2026-09-03' },
  { id: 'MTR-FL-1120', projectId: 'EGC', material: 'Flanges ASTM A105 600#', heat: 'FL-221', vendor: 'Al Noor Engineering', po: 'PO-450052', verified: 'Verified', date: '2026-09-29' },
  { id: 'MTR-GK-0031', projectId: 'EGC', material: 'Spiral wound gaskets', heat: 'GK-31', vendor: 'Horizon Technical Services', po: 'PO-450061', verified: 'Pending', date: '2026-09-30' },
]

export const inspectionPlans = [
  { id: 'ITP-NPE-WLD', projectId: 'NPE', title: 'ITP Pipeline Welding and NDT', discipline: 'Welding', activities: 18, hold: 6, witness: 8, rev: 'Rev 3', status: 'Approved' },
  { id: 'ITP-NPE-COT', projectId: 'NPE', title: 'ITP Field Joint Coating', discipline: 'Coating', activities: 11, hold: 3, witness: 5, rev: 'Rev 2', status: 'Approved' },
  { id: 'ITP-NPE-CIV', projectId: 'NPE', title: 'ITP Trenching, Lowering and Backfill', discipline: 'Civil', activities: 14, hold: 4, witness: 6, rev: 'Rev 2', status: 'Approved' },
  { id: 'ITP-NPE-HYD', projectId: 'NPE', title: 'ITP Hydrostatic Testing', discipline: 'Hydrotest', activities: 9, hold: 5, witness: 3, rev: 'Rev 1', status: 'Approved' },
  { id: 'ITP-EGC-MEC', projectId: 'EGC', title: 'ITP Rotating Equipment Installation', discipline: 'Mechanical', activities: 22, hold: 7, witness: 9, rev: 'Rev 1', status: 'Under Review' },
  { id: 'ITP-EGC-EI', projectId: 'EGC', title: 'ITP E&I Installation and Loop Check', discipline: 'E&I', activities: 16, hold: 4, witness: 7, rev: 'Rev 2', status: 'Approved' },
  { id: 'ITP-RUU-CIV', projectId: 'RUU', title: 'ITP Concrete Works', discipline: 'Civil', activities: 12, hold: 4, witness: 5, rev: 'Rev 3', status: 'Approved' },
]
