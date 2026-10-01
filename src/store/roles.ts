import type { Role } from '../data/types'

export interface RoleProfile {
  role: Role
  name: string
  firstName: string
  title: string
  home: string
  email: string
  sections: string[]
  description: string
}

export const ROLES: RoleProfile[] = [
  {
    role: 'CEO',
    name: 'Saleh Al-Rashidi',
    firstName: 'Saleh',
    title: 'Chief Executive Officer',
    home: '/command',
    email: 'saleh@shq-demo.example',
    sections: ['command', 'projects', 'quality', 'handover', 'hse', 'procurement', 'hr', 'om', 'compliance', 'documents', 'field', 'platform'],
    description: 'Full portfolio visibility, every department, every approval.',
  },
  {
    role: 'Project Director',
    name: 'Khalid Al-Dossary',
    firstName: 'Khalid',
    title: 'Project Director',
    home: '/command',
    email: 'khalid@shq-demo.example',
    sections: ['command', 'projects', 'quality', 'hse', 'procurement', 'hr', 'documents', 'platform'],
    description: 'Projects, quality, HSE, procurement, manpower, documents and risks.',
  },
  {
    role: 'QA/QC Manager',
    name: 'Imran Siddiqui',
    firstName: 'Imran',
    title: 'QA/QC Manager',
    home: '/quality',
    email: 'imran@shq-demo.example',
    sections: ['workspace', 'quality', 'handover', 'documents', 'projects'],
    description: 'Inspections, NCRs, CAPA, handover dossier and documents.',
  },
  {
    role: 'HSE Manager',
    name: 'Tariq Al-Shehri',
    firstName: 'Tariq',
    title: 'HSE Manager',
    home: '/hse',
    email: 'tariq@shq-demo.example',
    sections: ['workspace', 'hse', 'projects', 'documents'],
    description: 'Observations, incidents, permits, actions and site risk.',
  },
  {
    role: 'Procurement Manager',
    name: 'Nasser Al-Otaibi',
    firstName: 'Nasser',
    title: 'Procurement Manager',
    home: '/procurement',
    email: 'nasser@shq-demo.example',
    sections: ['workspace', 'procurement', 'projects', 'documents'],
    description: 'Purchase orders, vendors, deliveries and price variance.',
  },
  {
    role: 'HR Manager',
    name: 'Huda Al-Zahrani',
    firstName: 'Huda',
    title: 'HR Manager',
    home: '/hr',
    email: 'huda@shq-demo.example',
    sections: ['workspace', 'hr', 'compliance', 'documents'],
    description: 'Workforce, utilisation, competency, certificates and Iqama.',
  },
  {
    role: 'Site Engineer',
    name: 'Faisal Al-Qahtani',
    firstName: 'Faisal',
    title: 'Site Engineer, North Pipeline Spread 2',
    home: '/field',
    email: 'faisal@shq-demo.example',
    sections: ['field', 'site'],
    description: 'Field app: tasks, progress, inspections, observations and photos.',
  },
]

export const roleProfile = (role: Role): RoleProfile => ROLES.find((r) => r.role === role) ?? ROLES[0]
