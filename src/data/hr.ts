import type { Employee } from './types'

const emp = (
  n: number,
  name: string,
  trade: string,
  projectId: string,
  employer: string,
  skill: Employee['skill'],
  nationality: string,
  certs: [string, string][],
  iqamaExpiry: string,
  attendance: number,
  utilisation: number,
  status = 'Deployed',
): Employee => ({
  id: `EMP-${String(n).padStart(5, '0')}`,
  projectId,
  status,
  owner: 'HR Manager',
  createdAt: '2025-03-01',
  updatedAt: '2026-10-01',
  name,
  trade,
  employer,
  skill,
  nationality,
  certifications: certs.map(([c, e]) => ({ name: c, expiry: e })),
  iqamaExpiry,
  attendance,
  utilisation,
  deployment: [
    { project: projectId, from: '2026-02-01', to: 'Present' },
    { project: projectId === 'NPE' ? 'RWI' : 'NPE', from: '2025-06-01', to: '2026-01-31' },
  ],
})

export const employees: Employee[] = [
  emp(10231, 'Faisal Al-Qahtani', 'Site Engineer', 'NPE', 'SHQ Group', 'Engineer', 'Saudi', [['NEBOSH IGC', '2028-03-01'], ['First Aid', '2026-12-04']], '2030-01-01', 98, 96),
  emp(10418, 'Mohammed Al-Harbi', 'QA/QC Inspector', 'NPE', 'SHQ Group', 'Engineer', 'Saudi', [['CSWIP 3.1 Welding Inspector', '2027-05-14'], ['ASNT Level II RT', '2026-10-22']], '2030-01-01', 97, 94),
  emp(11502, 'Rakesh Menon', 'QA/QC Inspector', 'NPE', 'SHQ Group', 'Engineer', 'Indian', [['CSWIP 3.1 Welding Inspector', '2027-02-10'], ['API 1104', '2026-10-28']], '2026-10-19', 96, 92),
  emp(12044, 'Anwar Hussain', 'Coating Inspector', 'NPE', 'SHQ Group', 'Supervisor', 'Pakistani', [['NACE CIP Level 2', '2027-08-01']], '2027-01-09', 95, 90),
  emp(13377, 'Ramon Dela Cruz', 'Welder', 'NPE', 'SHQ Group', 'Skilled', 'Filipino', [['6G SMAW Qualification WQ-118', '2026-10-12'], ['H2S Awareness', '2027-03-01']], '2026-10-14', 93, 81),
  emp(13380, 'Suresh Kumar', 'Welder', 'NPE', 'SHQ Group', 'Skilled', 'Indian', [['6G SMAW Qualification WQ-121', '2027-04-02']], '2027-06-30', 97, 84),
  emp(13391, 'Imran Qureshi', 'Pipe Fitter', 'NPE', 'SHQ Group', 'Skilled', 'Pakistani', [['Pipe Fitter Trade Test', '2028-01-15']], '2027-02-11', 94, 79),
  emp(13402, 'Bikash Thapa', 'Rigger', 'NPE', 'Partner Manpower Co. (fictional)', 'Skilled', 'Nepali', [['Rigger Level II', '2026-10-09'], ['Banksman', '2027-01-20']], '2026-10-25', 91, 76),
  emp(13415, 'Joseph Mathew', 'Electrician', 'EGC', 'SHQ Group', 'Skilled', 'Indian', [['Electrical Competency Card', '2027-09-30']], '2027-03-03', 96, 88),
  emp(13427, 'Arjun Nair', 'QA/QC Inspector', 'EGC', 'SHQ Group', 'Engineer', 'Indian', [['CSWIP 3.1 Welding Inspector', '2027-11-05']], '2027-05-21', 98, 95),
  emp(13433, 'Ziad Haddad', 'Instrument Technician', 'EGC', 'SHQ Group', 'Skilled', 'Jordanian', [['Instrument Loop Check', '2027-07-07']], '2026-10-30', 95, 87),
  emp(13448, 'Tariq Al-Shehri', 'HSE Officer', 'EGC', 'SHQ Group', 'Engineer', 'Saudi', [['NEBOSH IGC', '2027-10-10'], ['Confined Space Supervisor', '2026-10-17']], '2030-01-01', 99, 97),
  emp(13452, 'Hamad Al-Rashid', 'HSE Officer', 'RUU', 'SHQ Group', 'Engineer', 'Saudi', [['NEBOSH IGC', '2028-02-02']], '2030-01-01', 98, 95),
  emp(13460, 'Bilal Ahmed', 'QA/QC Inspector', 'RUU', 'SHQ Group', 'Engineer', 'Pakistani', [['ACI Concrete Field Testing', '2027-04-18']], '2027-04-01', 96, 91),
  emp(13471, 'Ernesto Villanueva', 'Scaffolder', 'RUU', 'Partner Manpower Co. (fictional)', 'Skilled', 'Filipino', [['CISRS Advanced Scaffolder', '2026-10-27']], '2026-11-02', 92, 74),
  emp(13488, 'Dinesh Patel', 'Pipe Fitter', 'RUU', 'SHQ Group', 'Skilled', 'Indian', [['Pipe Fitter Trade Test', '2027-12-12']], '2027-08-15', 95, 86),
  emp(13495, 'Mahmoud Saleh', 'Foreman', 'NPE', 'SHQ Group', 'Foreman', 'Egyptian', [['Supervisory Safety', '2027-06-06']], '2027-01-27', 97, 89),
  emp(13502, 'Ravi Shankar', 'Electrician', 'KSS', 'SHQ Group', 'Skilled', 'Indian', [['Electrical Competency Card', '2026-10-05']], '2026-12-12', 90, 72),
  emp(13510, 'Krishna Bahadur', 'Rigger', 'EGC', 'Partner Manpower Co. (fictional)', 'Semi-skilled', 'Nepali', [['Rigger Level I', '2027-02-14']], '2027-09-09', 94, 77),
  emp(13521, 'Sami Al-Otaibi', 'Civil Inspector', 'NPE', 'SHQ Group', 'Engineer', 'Saudi', [['Civil QC Certification', '2027-12-01']], '2030-01-01', 97, 90),
  emp(13530, 'Pradeep Rai', 'Welder', 'EGC', 'SHQ Group', 'Skilled', 'Nepali', [['6G GTAW Qualification WQ-207', '2026-10-21']], '2027-02-28', 93, 82),
  emp(13544, 'Ahmed Fathy', 'Instrument Technician', 'RUU', 'SHQ Group', 'Skilled', 'Egyptian', [['Instrument Loop Check', '2027-05-05']], '2026-10-11', 96, 85),
  emp(13552, 'Hassan Al-Amri', 'O&M Manager', 'IMF', 'SHQ Group', 'Engineer', 'Saudi', [['Reliability Engineer CRE', '2028-01-01']], '2030-01-01', 99, 96),
  emp(13560, 'Vijay Kumar', 'Mechanical Technician', 'IMF', 'SHQ Group', 'Skilled', 'Indian', [['Rotating Equipment Technician', '2027-03-15']], '2027-07-20', 97, 91),
]

export const manpowerByProject = [
  { projectId: 'NPE', planned: 350, actual: 324, utilisation: 83, idle: 38, overtime: 1840 },
  { projectId: 'EGC', planned: 300, actual: 286, utilisation: 87, idle: 22, overtime: 1320 },
  { projectId: 'RUU', planned: 205, actual: 198, utilisation: 91, idle: 9, overtime: 760 },
  { projectId: 'JTF', planned: 96, actual: 96, utilisation: 92, idle: 4, overtime: 310 },
  { projectId: 'YFL', planned: 66, actual: 64, utilisation: 90, idle: 3, overtime: 180 },
  { projectId: 'KSS', planned: 70, actual: 52, utilisation: 74, idle: 9, overtime: 520 },
  { projectId: 'RWI', planned: 75, actual: 74, utilisation: 93, idle: 2, overtime: 240 },
  { projectId: 'DCP', planned: 30, actual: 30, utilisation: 95, idle: 0, overtime: 60 },
  { projectId: 'IMF', planned: 90, actual: 88, utilisation: 94, idle: 2, overtime: 290 },
  { projectId: 'OMC', planned: 42, actual: 40, utilisation: 92, idle: 2, overtime: 110 },
  { projectId: 'UOM', planned: 22, actual: 18, utilisation: 88, idle: 1, overtime: 70 },
  { projectId: 'PIM', planned: 14, actual: 14, utilisation: 90, idle: 0, overtime: 30 },
]

export const competency = [
  { trade: 'Welder', required: 148, available: 139, certified: 131, expiring: 9 },
  { trade: 'Pipe Fitter', required: 112, available: 108, certified: 104, expiring: 3 },
  { trade: 'Rigger', required: 64, available: 58, certified: 52, expiring: 6 },
  { trade: 'Electrician', required: 96, available: 78, certified: 74, expiring: 4 },
  { trade: 'Instrument Technician', required: 54, available: 49, certified: 47, expiring: 2 },
  { trade: 'Scaffolder', required: 58, available: 60, certified: 55, expiring: 1 },
  { trade: 'HSE Officer', required: 32, available: 30, certified: 30, expiring: 1 },
  { trade: 'QA/QC Inspector', required: 41, available: 36, certified: 36, expiring: 1 },
]

export const attendanceWeek = [
  { day: 'Thu 24', present: 1251, absent: 33 },
  { day: 'Sat 26', present: 1238, absent: 46 },
  { day: 'Sun 27', present: 1262, absent: 22 },
  { day: 'Mon 28', present: 1259, absent: 25 },
  { day: 'Tue 29', present: 1248, absent: 36 },
  { day: 'Wed 30', present: 1266, absent: 18 },
  { day: 'Thu 1', present: 1257, absent: 27 },
]

export const idleCauses = [
  { cause: 'Inspection waiting', hours: 420 },
  { cause: 'Material not available', hours: 310 },
  { cause: 'Permit delays', hours: 205 },
  { cause: 'Equipment breakdown', hours: 160 },
  { cause: 'Weather / heat stop', hours: 145 },
]
