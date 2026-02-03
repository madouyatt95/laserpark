import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useParkStore } from './stores/parkStore';

// Layout
import AppShell from './components/layout/AppShell';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CaissePage from './pages/CaissePage';
import StocksPage from './pages/StocksPage';
import RapportsPage from './pages/RapportsPage';
import ParametresPage from './pages/ParametresPage';
import ClosurePage from './pages/ClosurePage';
import PlanningPage from './pages/PlanningPage';
import AuditPage from './pages/AuditPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ShortcutsPage from './pages/ShortcutsPage';
import CategoriesPage from './pages/CategoriesPage';
import SignupPage from './pages/SignupPage';

// Styles
import './styles/variables.css';
import './styles/components.css';
import './styles/layout.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App Component
const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { selectedParkId, selectPark } = useParkStore();

  // Auto-select park for managers
  React.useEffect(() => {
    if (isAuthenticated && user?.park_id && !selectedParkId) {
      selectPark(user.park_id);
    }
  }, [isAuthenticated, user, selectedParkId, selectPark]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        {/* Signup Route */}
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/caisse" element={<CaissePage />} />
          <Route path="/stocks" element={<StocksPage />} />
          <Route path="/rapports" element={<RapportsPage />} />
          <Route path="/parametres" element={<ParametresPage />} />
          <Route path="/cloture" element={<ClosurePage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/raccourcis" element={<ShortcutsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
