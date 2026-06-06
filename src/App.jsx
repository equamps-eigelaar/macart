import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Production
import WorkOrdersPage from './pages/WorkOrders';
import StationLogPage from './pages/StationLog';
import OEEPage from './pages/OEE';
import ProductionSchedulePage from './pages/ProductionSchedule';
import ScrapTrackingPage from './pages/ScrapTracking';
import CustomerOrdersPage from './pages/CustomerOrders';
import OrderStatusDashboardPage from './pages/OrderStatusDashboard';
import DispatchPage from './pages/Dispatch';
import OrderMonitorPage from './pages/OrderMonitor';

// Quality
import NCRPage from './pages/NCR';
import CAPAPage from './pages/CAPA';
import RMInspectionPage from './pages/RMInspection';
import QualityCheckPage from './pages/QualityCheck';
import CalibrationPage from './pages/Calibration';
import CustomerComplaintsPage from './pages/CustomerComplaints';

// Environment & Safety
import HIRAPage from './pages/HIRA';
import IncidentsPage from './pages/Incidents';
import EnvAspectsPage from './pages/EnvAspects';
import EnvObjectivesPage from './pages/EnvObjectives';
import SafetyInspectionsPage from './pages/SafetyInspections';

// IMS Compliance
import StandardsPage from './pages/Standards';
import CompliancePage from './pages/Compliance';
import ComplianceObligationsPage from './pages/ComplianceObligations';
import TrainingPage from './pages/Training';

// Master Data
import ProductsPage from './pages/Products';
import RawMaterialsPage from './pages/RawMaterials';
import RMBatchesPage from './pages/RMBatches';
import FGBatchesPage from './pages/FGBatches';
import CustomersPage from './pages/Customers';
import SuppliersPage from './pages/Suppliers';
import InstrumentsPage from './pages/Instruments';
import DowntimeReasonsPage from './pages/DowntimeReasons';

// Maintenance
import MaintenanceAssetsPage from './pages/MaintenanceAssets';
import MaintenanceRequestsPage from './pages/MaintenanceRequests';
import PMSchedulesPage from './pages/PMSchedules';

// Other
import FeedbackPage from './pages/Feedback';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
      ))}

      {/* Production */}
      <Route path="/WorkOrders" element={<LayoutWrapper currentPageName="WorkOrders"><WorkOrdersPage /></LayoutWrapper>} />
      <Route path="/StationLog" element={<LayoutWrapper currentPageName="StationLog"><StationLogPage /></LayoutWrapper>} />
      <Route path="/OEE" element={<LayoutWrapper currentPageName="OEE"><OEEPage /></LayoutWrapper>} />
      <Route path="/ProductionSchedule" element={<LayoutWrapper currentPageName="ProductionSchedule"><ProductionSchedulePage /></LayoutWrapper>} />
      <Route path="/ScrapTracking" element={<LayoutWrapper currentPageName="ScrapTracking"><ScrapTrackingPage /></LayoutWrapper>} />
      <Route path="/CustomerOrders" element={<LayoutWrapper currentPageName="CustomerOrders"><CustomerOrdersPage /></LayoutWrapper>} />
      <Route path="/OrderStatusDashboard" element={<LayoutWrapper currentPageName="OrderStatusDashboard"><OrderStatusDashboardPage /></LayoutWrapper>} />
      <Route path="/Dispatch" element={<LayoutWrapper currentPageName="Dispatch"><DispatchPage /></LayoutWrapper>} />
      <Route path="/OrderMonitor" element={<LayoutWrapper currentPageName="OrderMonitor"><OrderMonitorPage /></LayoutWrapper>} />

      {/* Quality */}
      <Route path="/NCR" element={<LayoutWrapper currentPageName="NCR"><NCRPage /></LayoutWrapper>} />
      <Route path="/CAPA" element={<LayoutWrapper currentPageName="CAPA"><CAPAPage /></LayoutWrapper>} />
      <Route path="/RMInspection" element={<LayoutWrapper currentPageName="RMInspection"><RMInspectionPage /></LayoutWrapper>} />
      <Route path="/QualityCheck" element={<LayoutWrapper currentPageName="QualityCheck"><QualityCheckPage /></LayoutWrapper>} />
      <Route path="/Calibration" element={<LayoutWrapper currentPageName="Calibration"><CalibrationPage /></LayoutWrapper>} />
      <Route path="/CustomerComplaints" element={<LayoutWrapper currentPageName="CustomerComplaints"><CustomerComplaintsPage /></LayoutWrapper>} />

      {/* Environment & Safety */}
      <Route path="/HIRA" element={<LayoutWrapper currentPageName="HIRA"><HIRAPage /></LayoutWrapper>} />
      <Route path="/Incidents" element={<LayoutWrapper currentPageName="Incidents"><IncidentsPage /></LayoutWrapper>} />
      <Route path="/EnvAspects" element={<LayoutWrapper currentPageName="EnvAspects"><EnvAspectsPage /></LayoutWrapper>} />
      <Route path="/EnvObjectives" element={<LayoutWrapper currentPageName="EnvObjectives"><EnvObjectivesPage /></LayoutWrapper>} />
      <Route path="/SafetyInspections" element={<LayoutWrapper currentPageName="SafetyInspections"><SafetyInspectionsPage /></LayoutWrapper>} />

      {/* IMS Compliance */}
      <Route path="/Standards" element={<LayoutWrapper currentPageName="Standards"><StandardsPage /></LayoutWrapper>} />
      <Route path="/Compliance" element={<LayoutWrapper currentPageName="Compliance"><CompliancePage /></LayoutWrapper>} />
      <Route path="/ComplianceObligations" element={<LayoutWrapper currentPageName="ComplianceObligations"><ComplianceObligationsPage /></LayoutWrapper>} />
      <Route path="/Training" element={<LayoutWrapper currentPageName="Training"><TrainingPage /></LayoutWrapper>} />

      {/* Master Data */}
      <Route path="/Products" element={<LayoutWrapper currentPageName="Products"><ProductsPage /></LayoutWrapper>} />
      <Route path="/RawMaterials" element={<LayoutWrapper currentPageName="RawMaterials"><RawMaterialsPage /></LayoutWrapper>} />
      <Route path="/RMBatches" element={<LayoutWrapper currentPageName="RMBatches"><RMBatchesPage /></LayoutWrapper>} />
      <Route path="/FGBatches" element={<LayoutWrapper currentPageName="FGBatches"><FGBatchesPage /></LayoutWrapper>} />
      <Route path="/Customers" element={<LayoutWrapper currentPageName="Customers"><CustomersPage /></LayoutWrapper>} />
      <Route path="/Suppliers" element={<LayoutWrapper currentPageName="Suppliers"><SuppliersPage /></LayoutWrapper>} />
      <Route path="/Instruments" element={<LayoutWrapper currentPageName="Instruments"><InstrumentsPage /></LayoutWrapper>} />
      <Route path="/DowntimeReasons" element={<LayoutWrapper currentPageName="DowntimeReasons"><DowntimeReasonsPage /></LayoutWrapper>} />

      {/* Maintenance */}
      <Route path="/MaintenanceAssets" element={<LayoutWrapper currentPageName="MaintenanceAssets"><MaintenanceAssetsPage /></LayoutWrapper>} />
      <Route path="/MaintenanceRequests" element={<LayoutWrapper currentPageName="MaintenanceRequests"><MaintenanceRequestsPage /></LayoutWrapper>} />
      <Route path="/PMSchedules" element={<LayoutWrapper currentPageName="PMSchedules"><PMSchedulesPage /></LayoutWrapper>} />

      {/* Other */}
      <Route path="/Feedback" element={<LayoutWrapper currentPageName="Feedback"><FeedbackPage /></LayoutWrapper>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App