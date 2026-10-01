import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell, Guard, Toaster } from './components/layout/AppShell'
import { roleProfile } from './store/roles'
import { StoreProvider, useStore } from './store/store'
import { LoginPage } from './pages/Login'
import { ExecutiveDashboard } from './pages/command/ExecutiveDashboard'
import { Portfolio } from './pages/command/Portfolio'
import { AlertsPage } from './pages/command/Alerts'
import { ApprovalsPage } from './pages/command/Approvals'
import { AiPage } from './pages/ai/AiPage'
import { ProjectsList } from './pages/projects/ProjectsList'
import { ProjectDetail } from './pages/projects/ProjectDetail'
import { SchedulePage } from './pages/projects/Schedule'
import { DailyReportsPage } from './pages/projects/DailyReports'
import { ProjectManpowerPage } from './pages/projects/ProjectManpower'
import { RisksPage } from './pages/projects/Risks'
import { QualityDashboard } from './pages/quality/QualityDashboard'
import { InspectionDetail, InspectionsList } from './pages/quality/Inspections'
import { NcrDetail, NcrList } from './pages/quality/Ncrs'
import { CalibrationPage, CapaList, InspectionPlansPage, MtrPage, PunchListPage, RfiList } from './pages/quality/QualityRegisters'
import { HandoverDashboard, MdrPage, SubmissionReadiness } from './pages/handover/Handover'
import { DocumentRegister } from './pages/handover/DocumentRegister'
import { DocumentCentre } from './pages/documents/DocumentCentre'
import { ComplianceDashboard, ComplianceList, ExpiryCalendar } from './pages/compliance/Compliance'
import { Record360 } from './pages/platform/Record360'
import { HseDashboard } from './pages/hse/HseDashboard'
import { ObservationDetail, ObservationsList } from './pages/hse/Observations'
import { HeatStressPage, HseCertificatesPage, HseInspectionsPage, IncidentsPage, PermitsPage, RiskAssessmentsPage } from './pages/hse/HseRegisters'
import { FieldApp } from './pages/field/FieldApp'
import { DeliveriesPage, PoDetail, PoList, ProcurementDashboard, RecommendationsPage, VariancePage, VendorIssuesPage } from './pages/procurement/Procurement'
import { VendorDetail, VendorsPage } from './pages/procurement/Vendors'
import { AttendancePage, CompetencyPage, HrCertificatesPage, HrDashboard, HrExpiryPage, IqamaPage, ManpowerPage, UtilisationPage, WorkerProfile } from './pages/hr/Hr'
import { AssetDetail, AssetHistoryPage, AssetsPage, OmContractsPage, OmDashboard, PmPage, SlaPage, WorkOrdersPage } from './pages/om/Om'
import { AdminPage, EfficiencyPage, FormatPacksPage, IntegrationsPage, PlaybooksPage, ReportsPage } from './pages/platform/Platform'
import { NotFound } from './pages/NotFound'

function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const location = useLocation()
  if (!state.signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function Home() {
  const { state } = useStore()
  if (!state.signedIn) return <Navigate to="/login" replace />
  return <Navigate to={roleProfile(state.role).home} replace />
}

function FieldRoute() {
  return (
    <RequireAuth>
      <Guard>
        <FieldApp />
      </Guard>
      <Toaster />
    </RequireAuth>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/field/*" element={<FieldRoute />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/command" element={<ExecutiveDashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/ai" element={<AiPage />} />

        <Route path="/projects" element={<ProjectsList variant="all" />} />
        <Route path="/projects/construction" element={<ProjectsList variant="construction" />} />
        <Route path="/projects/schedule" element={<SchedulePage />} />
        <Route path="/projects/dpr" element={<DailyReportsPage />} />
        <Route path="/projects/manpower" element={<ProjectManpowerPage />} />
        <Route path="/projects/risks" element={<RisksPage />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        <Route path="/quality" element={<QualityDashboard />} />
        <Route path="/quality/plans" element={<InspectionPlansPage />} />
        <Route path="/quality/inspections" element={<InspectionsList />} />
        <Route path="/quality/inspections/:id" element={<InspectionDetail />} />
        <Route path="/quality/rfis" element={<RfiList />} />
        <Route path="/quality/ncrs" element={<NcrList />} />
        <Route path="/quality/ncrs/:id" element={<NcrDetail />} />
        <Route path="/quality/capa" element={<CapaList />} />
        <Route path="/quality/punch" element={<PunchListPage />} />
        <Route path="/quality/calibration" element={<CalibrationPage />} />
        <Route path="/quality/mtr" element={<MtrPage />} />

        <Route path="/handover" element={<HandoverDashboard />} />
        <Route path="/handover/mdr" element={<MdrPage />} />
        <Route path="/handover/register" element={<DocumentRegister preset="all" />} />
        <Route path="/handover/missing" element={<DocumentRegister preset="missing" />} />
        <Route path="/handover/expiring" element={<DocumentRegister preset="expiring" />} />
        <Route path="/handover/readiness" element={<SubmissionReadiness />} />

        <Route path="/hse" element={<HseDashboard />} />
        <Route path="/hse/observations" element={<ObservationsList />} />
        <Route path="/hse/observations/:id" element={<ObservationDetail />} />
        <Route path="/hse/incidents" element={<IncidentsPage />} />
        <Route path="/hse/permits" element={<PermitsPage />} />
        <Route path="/hse/inspections" element={<HseInspectionsPage />} />
        <Route path="/hse/risk-assessments" element={<RiskAssessmentsPage />} />
        <Route path="/hse/certificates" element={<HseCertificatesPage />} />
        <Route path="/hse/heat" element={<HeatStressPage />} />

        <Route path="/procurement" element={<ProcurementDashboard />} />
        <Route path="/procurement/pos" element={<PoList />} />
        <Route path="/procurement/pos/:id" element={<PoDetail />} />
        <Route path="/procurement/vendors" element={<VendorsPage />} />
        <Route path="/procurement/vendors/:id" element={<VendorDetail />} />
        <Route path="/procurement/deliveries" element={<DeliveriesPage />} />
        <Route path="/procurement/variance" element={<VariancePage />} />
        <Route path="/procurement/issues" element={<VendorIssuesPage />} />
        <Route path="/procurement/recommendations" element={<RecommendationsPage />} />

        <Route path="/hr" element={<HrDashboard />} />
        <Route path="/hr/manpower" element={<ManpowerPage />} />
        <Route path="/hr/attendance" element={<AttendancePage />} />
        <Route path="/hr/utilisation" element={<UtilisationPage />} />
        <Route path="/hr/competency" element={<CompetencyPage />} />
        <Route path="/hr/certificates" element={<HrCertificatesPage />} />
        <Route path="/hr/iqama" element={<IqamaPage />} />
        <Route path="/hr/expiry" element={<HrExpiryPage />} />
        <Route path="/hr/workers/:id" element={<WorkerProfile />} />

        <Route path="/om" element={<OmDashboard />} />
        <Route path="/om/assets" element={<AssetsPage />} />
        <Route path="/om/assets/:id" element={<AssetDetail />} />
        <Route path="/om/pm" element={<PmPage />} />
        <Route path="/om/work-orders" element={<WorkOrdersPage />} />
        <Route path="/om/sla" element={<SlaPage />} />
        <Route path="/om/contracts" element={<OmContractsPage />} />
        <Route path="/om/history" element={<AssetHistoryPage />} />

        <Route path="/compliance" element={<ComplianceDashboard />} />
        <Route path="/compliance/licences" element={<ComplianceList title="Licences" kinds={['Licence']} />} />
        <Route path="/compliance/permits" element={<ComplianceList title="Permits" kinds={['Permit']} />} />
        <Route path="/compliance/contracts" element={<ComplianceList title="Contracts" kinds={['Vendor Contract', 'Insurance']} />} />
        <Route path="/compliance/equipment" element={<ComplianceList title="Equipment Certificates" kinds={['Equipment Certificate']} />} />
        <Route path="/compliance/warranties" element={<ComplianceList title="Warranties" kinds={['Warranty']} />} />
        <Route path="/compliance/calendar" element={<ExpiryCalendar />} />

        <Route path="/documents" element={<DocumentCentre preset="all" />} />
        <Route path="/documents/recent" element={<DocumentCentre preset="recent" />} />
        <Route path="/documents/expiring" element={<DocumentCentre preset="expiring" />} />
        <Route path="/documents/missing" element={<DocumentCentre preset="missing" />} />
        <Route path="/documents/project" element={<DocumentCentre preset="project" />} />

        <Route path="/record/:id" element={<Record360 />} />
        <Route path="/efficiency" element={<EfficiencyPage />} />
        <Route path="/playbooks" element={<PlaybooksPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<FormatPacksPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  )
}
