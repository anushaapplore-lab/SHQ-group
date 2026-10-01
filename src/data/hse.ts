import type { Action, Observation } from './types'

export const hseCategories = [
  'Line of Fire',
  'Suspended Load',
  'Dropped Objects',
  'Confined Space',
  'Working at Height',
  'Excavation',
  'Hot Work',
  'Electrical',
  'Vehicle Movement',
  'PPE',
]

const obs = (
  id: string,
  projectId: string,
  title: string,
  category: string,
  severity: Observation['severity'],
  status: string,
  location: string,
  reportedBy: string,
  createdAt: string,
  assignedTo: string,
  dueDate: string,
  extra: Partial<Observation> = {},
): Observation => ({
  id,
  projectId,
  status,
  owner: assignedTo,
  createdAt,
  updatedAt: createdAt,
  title,
  category,
  severity,
  location,
  description: title,
  immediateAction: 'Supervisor informed and area made safe.',
  assignedTo,
  dueDate,
  reportedBy,
  source: 'Web',
  actionIds: [],
  ...extra,
})

export const observations: Observation[] = [
  obs('OBS-1042', 'NPE', 'Worker operating beneath suspended load', 'Suspended Load', 'High', 'Open', 'KP 42+450, pipe stringing area', 'Faisal Al-Qahtani', '2026-10-01', 'Lifting Supervisor', '2026-10-01', {
    description: 'During pipe stringing, a pipe handler was observed guiding a 24" joint from directly beneath the load while the side boom was lifting. No exclusion zone barriers were visible.',
    immediateAction: 'Lifting stopped by supervisor. Awaiting exclusion zone set-up.',
    photo: 'suspended-load',
    source: 'Field App',
    ai: {
      detection: 'Potential suspended-load exposure detected.',
      confidence: 94,
      risk: 'High',
      recommendation: 'Stop activity and establish exclusion zone before resuming lifting operation.',
      detected: ['Worker', 'Crane hook', 'Suspended load', 'Exclusion zone not visible'],
      hazards: ['Suspended load', 'Line-of-fire exposure', 'Inadequate exclusion zone'],
      controls: ['Establish exclusion zone', 'Assign spotter', 'Stop work until control is verified'],
    },
  }),
  obs('OBS-1041', 'NPE', 'Excavation edge without hard barricade, KP 33', 'Excavation', 'High', 'Open', 'KP 33+080', 'Sami Al-Otaibi', '2026-09-30', 'Civil Superintendent', '2026-10-01'),
  obs('OBS-1040', 'EGC', 'Hot work without fire watch at spool shop', 'Hot Work', 'High', 'Open', 'Fabrication shop bay 2', 'Tariq Al-Shehri', '2026-09-30', 'Fabrication Foreman', '2026-10-01'),
  obs('OBS-1039', 'RUU', 'Scaffold tag expired, pipe rack PR-3', 'Working at Height', 'High', 'In Progress', 'Pipe rack PR-3', 'Hamad Al-Rashid', '2026-09-30', 'Scaffolding Supervisor', '2026-10-02'),
  obs('OBS-1038', 'NPE', 'Missing face shield during grinding', 'PPE', 'Medium', 'Open', 'KP 41+900', 'Faisal Al-Qahtani', '2026-09-29', 'Welding Foreman', '2026-10-03'),
  obs('OBS-1037', 'KSS', 'Unlocked isolation on MCC panel', 'Electrical', 'High', 'Open', 'Substation building', 'Hamad Al-Rashid', '2026-09-29', 'Electrical Supervisor', '2026-09-30'),
  obs('OBS-1036', 'EGC', 'Reversing truck without banksman', 'Vehicle Movement', 'Medium', 'In Progress', 'Laydown area', 'Tariq Al-Shehri', '2026-09-29', 'Logistics Supervisor', '2026-10-02'),
  obs('OBS-1035', 'NPE', 'Hand tools unsecured at height on pipe rack', 'Dropped Objects', 'Medium', 'Open', 'Block valve station 2', 'Faisal Al-Qahtani', '2026-09-28', 'Mechanical Foreman', '2026-10-02'),
  obs('OBS-1034', 'EGC', 'Gas test not recorded before vessel entry', 'Confined Space', 'High', 'Open', 'Scrubber V-201', 'Tariq Al-Shehri', '2026-09-28', 'Mechanical Supervisor', '2026-09-29'),
  obs('OBS-1033', 'RUU', 'Pinch point during flange alignment', 'Line of Fire', 'Medium', 'Open', 'Steam header', 'Hamad Al-Rashid', '2026-09-28', 'Mechanical Foreman', '2026-10-04'),
  obs('OBS-1032', 'JTF', 'Good practice: tool tethering on tank roof', 'Dropped Objects', 'Low', 'Closed', 'Tank T-104 roof', 'Hamad Al-Rashid', '2026-09-27', 'Mechanical Foreman', '2026-09-28'),
  obs('OBS-1031', 'NPE', 'Spotter not assigned during lowering-in', 'Suspended Load', 'High', 'Closed', 'KP 40+100', 'Faisal Al-Qahtani', '2026-09-27', 'Lifting Supervisor', '2026-09-28'),
  obs('OBS-1030', 'IMF', 'Oil spill near pump P-2201B', 'Line of Fire', 'Low', 'Closed', 'Unit 22', 'Hassan Al-Amri', '2026-09-26', 'O&M Supervisor', '2026-09-27'),
  obs('OBS-1029', 'NPE', 'Hydration station empty at Spread 2', 'PPE', 'Medium', 'Closed', 'KP 44 camp', 'Faisal Al-Qahtani', '2026-09-26', 'Camp Boss', '2026-09-26'),
  obs('OBS-1028', 'EGC', 'Missing toe board on platform', 'Working at Height', 'Medium', 'Closed', 'Compressor platform', 'Tariq Al-Shehri', '2026-09-25', 'Scaffolding Supervisor', '2026-09-27'),
  obs('OBS-1027', 'RUU', 'Cable reel blocking escape route', 'Electrical', 'Low', 'Closed', 'MCC room', 'Hamad Al-Rashid', '2026-09-25', 'E&I Supervisor', '2026-09-26'),
]

export const hseActions: Action[] = [
  { id: 'ACT-3301', projectId: 'NPE', status: 'Open', owner: 'Civil Superintendent', createdAt: '2026-09-30', updatedAt: '2026-09-30', title: 'Install hard barricade along open trench KP 33', sourceType: 'Observation', sourceId: 'OBS-1041', department: 'HSE', dueDate: '2026-10-01', priority: 'High' },
  { id: 'ACT-3302', projectId: 'EGC', status: 'Open', owner: 'Fabrication Foreman', createdAt: '2026-09-30', updatedAt: '2026-09-30', title: 'Assign trained fire watch for all hot work in bay 2', sourceType: 'Observation', sourceId: 'OBS-1040', department: 'HSE', dueDate: '2026-10-01', priority: 'High' },
  { id: 'ACT-3297', projectId: 'RUU', status: 'In Progress', owner: 'Scaffolding Supervisor', createdAt: '2026-09-30', updatedAt: '2026-09-30', title: 'Re-inspect and re-tag scaffold PR-3', sourceType: 'Observation', sourceId: 'OBS-1039', department: 'HSE', dueDate: '2026-10-02', priority: 'High' },
  { id: 'ACT-3290', projectId: 'KSS', status: 'Overdue', owner: 'Electrical Supervisor', createdAt: '2026-09-29', updatedAt: '2026-09-29', title: 'Apply LOTO and verify isolation on MCC panel', sourceType: 'Observation', sourceId: 'OBS-1037', department: 'HSE', dueDate: '2026-09-30', priority: 'High' },
  { id: 'ACT-3288', projectId: 'EGC', status: 'Overdue', owner: 'Mechanical Supervisor', createdAt: '2026-09-28', updatedAt: '2026-09-28', title: 'Retrain entry team on gas testing records', sourceType: 'Observation', sourceId: 'OBS-1034', department: 'HSE', dueDate: '2026-09-29', priority: 'High' },
]

export const incidents = [
  { id: 'INC-0077', projectId: 'EGC', title: 'Hand laceration during gasket handling', type: 'First Aid', date: '2026-09-24', status: 'Closed', investigator: 'Tariq Al-Shehri' },
  { id: 'INC-0078', projectId: 'NPE', title: 'Side boom contact with marker post', type: 'Property Damage', date: '2026-09-26', status: 'Investigation', investigator: 'Faisal Al-Qahtani' },
  { id: 'INC-0079', projectId: 'RUU', title: 'Dropped spanner from 4 m, no injury', type: 'Near Miss', date: '2026-09-27', status: 'Investigation', investigator: 'Hamad Al-Rashid' },
  { id: 'INC-0080', projectId: 'NPE', title: 'Heat exhaustion symptoms, worker rested and recovered', type: 'First Aid', date: '2026-09-29', status: 'Closed', investigator: 'Faisal Al-Qahtani' },
  { id: 'INC-0081', projectId: 'KSS', title: 'Vehicle reversing near pedestrian route', type: 'Near Miss', date: '2026-09-30', status: 'Open', investigator: 'Hamad Al-Rashid' },
]

export const permits = [
  { id: 'PTW-NPE-2291', projectId: 'NPE', type: 'Hot Work', location: 'KP 42+600 tie-in', issuer: 'Area Authority', valid: '2026-10-01 06:00 to 18:00', status: 'Active' },
  { id: 'PTW-NPE-2292', projectId: 'NPE', type: 'Lifting (Critical)', location: 'KP 42+450', issuer: 'Area Authority', valid: '2026-10-01 06:00 to 18:00', status: 'Suspended' },
  { id: 'PTW-NPE-2293', projectId: 'NPE', type: 'Excavation', location: 'KP 33+000 to 34+000', issuer: 'Area Authority', valid: '2026-10-01 05:00 to 17:00', status: 'Active' },
  { id: 'PTW-EGC-1180', projectId: 'EGC', type: 'Confined Space', location: 'Scrubber V-201', issuer: 'Operator', valid: '2026-10-01 07:00 to 15:00', status: 'Active' },
  { id: 'PTW-EGC-1181', projectId: 'EGC', type: 'Electrical Isolation', location: 'MCC-2', issuer: 'Operator', valid: '2026-10-01 07:00 to 19:00', status: 'Active' },
  { id: 'PTW-RUU-0840', projectId: 'RUU', type: 'Hot Work', location: 'Steam header', issuer: 'Refinery Ops', valid: '2026-10-01 06:00 to 14:00', status: 'Pending' },
  { id: 'PTW-RUU-0841', projectId: 'RUU', type: 'Working at Height', location: 'Pipe rack PR-3', issuer: 'Refinery Ops', valid: '2026-10-01 06:00 to 18:00', status: 'Active' },
]

export const riskAssessments = [
  { id: 'JSA-NPE-041', projectId: 'NPE', activity: 'Pipe stringing and side boom lifting', residual: 'Medium', reviewed: '2026-09-15', owner: 'Lifting Supervisor', status: 'Review Required' },
  { id: 'JSA-NPE-042', projectId: 'NPE', activity: 'Manual welding at tie-ins', residual: 'Low', reviewed: '2026-09-20', owner: 'Welding Foreman', status: 'Current' },
  { id: 'JSA-NPE-043', projectId: 'NPE', activity: 'Radiography (NDT) operations', residual: 'Medium', reviewed: '2026-09-10', owner: 'NDT Lead', status: 'Current' },
  { id: 'JSA-EGC-018', projectId: 'EGC', activity: 'Confined space entry in scrubbers', residual: 'Medium', reviewed: '2026-09-18', owner: 'Mechanical Supervisor', status: 'Current' },
  { id: 'JSA-RUU-022', projectId: 'RUU', activity: 'Hot work in live plant', residual: 'High', reviewed: '2026-08-30', owner: 'HSE Manager', status: 'Review Required' },
]

export const heatStress = [
  { hour: '05:00', index: 28 },
  { hour: '07:00', index: 31 },
  { hour: '09:00', index: 35 },
  { hour: '11:00', index: 39 },
  { hour: '13:00', index: 42 },
  { hour: '15:00', index: 40 },
  { hour: '17:00', index: 36 },
]
