import type { Asset, PMTask, WorkOrder } from './types'

const asset = (
  id: string,
  projectId: string,
  name: string,
  tag: string,
  type: string,
  location: string,
  status: string,
  lastMaintenance: string,
  nextPM: string,
  operatingHours: number,
  criticality: Asset['criticality'],
): Asset => ({
  id,
  projectId,
  status,
  owner: 'Hassan Al-Amri',
  createdAt: '2024-04-01',
  updatedAt: '2026-10-01',
  name,
  tag,
  type,
  location,
  lastMaintenance,
  nextPM,
  operatingHours,
  criticality,
  history: [
    { date: lastMaintenance, event: 'Preventive maintenance completed', by: 'Vijay Kumar' },
    { date: '2026-07-14', event: 'Vibration analysis: within limits', by: 'Condition Monitoring' },
    { date: '2026-05-03', event: 'Corrective: seal replacement', by: 'Vijay Kumar' },
    { date: '2026-03-20', event: 'Quarterly inspection', by: 'Hassan Al-Amri' },
  ],
})

export const assets: Asset[] = [
  asset('CP-042', 'OMC', 'Compressor CP-042', 'CP-042', 'Reciprocating compressor', 'Eastern Gas Compression', 'Operational', '2026-09-20', '2026-10-20', 8420, 'High'),
  asset('CP-043', 'OMC', 'Compressor CP-043', 'CP-043', 'Reciprocating compressor', 'Eastern Gas Compression', 'Operational', '2026-09-02', '2026-10-02', 9105, 'High'),
  asset('GT-101', 'IMF', 'Gas Turbine Generator GT-101', 'GT-101', 'Gas turbine', 'Jubail Unit 10', 'Operational', '2026-08-28', '2026-11-28', 15220, 'High'),
  asset('P-2201B', 'IMF', 'Feed Pump P-2201B', 'P-2201B', 'Centrifugal pump', 'Jubail Unit 22', 'Degraded', '2026-09-10', '2026-09-28', 22410, 'High'),
  asset('HX-310', 'IMF', 'Heat Exchanger HX-310', 'HX-310', 'Shell and tube exchanger', 'Jubail Unit 31', 'Operational', '2026-07-30', '2026-10-30', 30100, 'Medium'),
  asset('CT-02', 'UOM', 'Cooling Tower Cell CT-02', 'CT-02', 'Cooling tower', 'Rabigh Utilities', 'Operational', '2026-09-15', '2026-10-15', 12780, 'Medium'),
  asset('AC-07', 'UOM', 'Instrument Air Compressor AC-07', 'AC-07', 'Screw compressor', 'Rabigh Utilities', 'Under Maintenance', '2026-09-29', '2026-12-29', 18450, 'High'),
  asset('BL-01', 'UOM', 'Package Boiler BL-01', 'BL-01', 'Steam boiler', 'Rabigh Utilities', 'Operational', '2026-08-18', '2026-10-18', 20330, 'High'),
  asset('PIG-L3', 'PIM', 'Pig Launcher L-3', 'PIG-L3', 'Pig launcher', 'KP 0 station', 'Operational', '2026-09-05', '2026-12-05', 1840, 'Medium'),
  asset('CPR-11', 'PIM', 'CP Rectifier CPR-11', 'CPR-11', 'Cathodic protection rectifier', 'KP 24', 'Operational', '2026-09-12', '2026-10-12', 26200, 'Low'),
]

const wo = (
  id: string,
  assetId: string,
  projectId: string,
  title: string,
  type: WorkOrder['type'],
  priority: WorkOrder['priority'],
  status: string,
  dueDate: string,
  technician: string,
  slaHours: number,
  elapsedHours: number,
): WorkOrder => ({
  id,
  projectId,
  status,
  owner: technician,
  createdAt: '2026-09-28',
  updatedAt: '2026-10-01',
  assetId,
  title,
  type,
  priority,
  dueDate,
  technician,
  slaHours,
  elapsedHours,
})

export const workOrders: WorkOrder[] = [
  wo('WO-77120', 'CP-042', 'OMC', 'High discharge temperature, stage 2', 'Corrective', 'High', 'In Progress', '2026-10-02', 'Vijay Kumar', 24, 18),
  wo('WO-77124', 'CP-042', 'OMC', 'Replace valve plates, cylinder 3', 'Corrective', 'Medium', 'Open', '2026-10-05', 'Vijay Kumar', 72, 20),
  wo('WO-77131', 'P-2201B', 'IMF', 'Mechanical seal leak', 'Corrective', 'High', 'In Progress', '2026-10-01', 'Vijay Kumar', 24, 30),
  wo('WO-77133', 'AC-07', 'UOM', 'Air end overhaul', 'Corrective', 'High', 'In Progress', '2026-10-03', 'Ahmed Fathy', 72, 40),
  wo('WO-77140', 'HX-310', 'IMF', 'Tube bundle eddy current inspection', 'Inspection', 'Medium', 'Open', '2026-10-15', 'Condition Monitoring', 168, 12),
  wo('WO-77144', 'CT-02', 'UOM', 'Fan gearbox oil analysis', 'Preventive', 'Low', 'Open', '2026-10-10', 'Ahmed Fathy', 168, 8),
  wo('WO-77149', 'GT-101', 'IMF', 'Borescope inspection', 'Inspection', 'Medium', 'Open', '2026-10-20', 'Turbine OEM Rep', 240, 4),
  wo('WO-77152', 'CPR-11', 'PIM', 'Rectifier output low', 'Corrective', 'Medium', 'Completed', '2026-09-30', 'Ziad Haddad', 48, 22),
  wo('WO-77155', 'BL-01', 'UOM', 'Burner management system fault', 'Corrective', 'High', 'Open', '2026-10-01', 'Ahmed Fathy', 12, 14),
]

const pm = (id: string, assetId: string, projectId: string, maintenanceType: string, dueDate: string, lastService: string, status: string, technician: string): PMTask => ({
  id,
  projectId,
  status,
  owner: technician,
  createdAt: '2026-01-01',
  updatedAt: '2026-10-01',
  assetId,
  maintenanceType,
  dueDate,
  lastService,
  technician,
})

export const pmTasks: PMTask[] = [
  pm('PM-5501', 'CP-042', 'OMC', '4,000 h service', '2026-10-20', '2026-09-20', 'Upcoming', 'Vijay Kumar'),
  pm('PM-5502', 'CP-043', 'OMC', 'Monthly inspection', '2026-10-02', '2026-09-02', 'Due', 'Vijay Kumar'),
  pm('PM-5503', 'P-2201B', 'IMF', 'Monthly vibration and alignment', '2026-09-28', '2026-08-28', 'Overdue', 'Vijay Kumar'),
  pm('PM-5504', 'GT-101', 'IMF', 'Quarterly combustion inspection', '2026-11-28', '2026-08-28', 'Upcoming', 'Turbine OEM Rep'),
  pm('PM-5505', 'HX-310', 'IMF', 'Quarterly performance check', '2026-10-30', '2026-07-30', 'Upcoming', 'Condition Monitoring'),
  pm('PM-5506', 'CT-02', 'UOM', 'Monthly fan and drift eliminator check', '2026-10-15', '2026-09-15', 'Upcoming', 'Ahmed Fathy'),
  pm('PM-5507', 'BL-01', 'UOM', 'Safety valve test', '2026-09-25', '2026-03-25', 'Overdue', 'Ahmed Fathy'),
  pm('PM-5508', 'AC-07', 'UOM', 'Filter replacement', '2026-09-29', '2026-06-29', 'Completed', 'Ahmed Fathy'),
  pm('PM-5509', 'CPR-11', 'PIM', 'Monthly rectifier readings', '2026-10-12', '2026-09-12', 'Upcoming', 'Ziad Haddad'),
  pm('PM-5510', 'PIG-L3', 'PIM', 'Quarterly door seal inspection', '2026-10-01', '2026-07-01', 'Due', 'Ziad Haddad'),
]

export const omContracts = [
  { id: 'OMC-2024-003', projectId: 'IMF', client: 'Petrochemical Client (fictional)', scope: 'Mechanical and rotating equipment maintenance', value: 34, start: '2024-04-01', end: '2027-03-31', sla: 96.2, status: 'Active' },
  { id: 'OMC-2025-007', projectId: 'OMC', client: 'Gas Processing Client (fictional)', scope: 'Compression station O&M', value: 9, start: '2025-06-01', end: '2028-05-31', sla: 94.8, status: 'Active' },
  { id: 'OMC-2025-011', projectId: 'UOM', client: 'Petrochemical Client (fictional)', scope: 'Utilities O&M services', value: 6, start: '2025-09-01', end: '2027-08-31', sla: 89.5, status: 'Active' },
  { id: 'OMC-2026-001', projectId: 'PIM', client: 'Pipeline Operator (fictional)', scope: 'Pipeline integrity monitoring', value: 4, start: '2026-05-01', end: '2029-04-30', sla: 97.1, status: 'Active' },
]

export const slaTrend = [
  { month: 'Apr', sla: 93.1, pm: 91 },
  { month: 'May', sla: 94.0, pm: 92 },
  { month: 'Jun', sla: 92.6, pm: 90 },
  { month: 'Jul', sla: 93.8, pm: 93 },
  { month: 'Aug', sla: 94.9, pm: 94 },
  { month: 'Sep', sla: 94.4, pm: 92 },
]
