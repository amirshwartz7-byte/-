import type { ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useApp } from "./store/AppContext";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Checklist from "./pages/Checklist";
import Marketplace from "./pages/Marketplace";
import MarketplaceCategory from "./pages/MarketplaceCategory";
import PackageBuilder from "./pages/PackageBuilder";
import Budget from "./pages/Budget";
import Books from "./pages/Books";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminContent from "./pages/admin/AdminContent";

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse">📦</div>
        <p className="text-sm text-gray-400">טוען...</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { session, dataLoading } = useApp();
  if (!session) return <Navigate to="/" replace />;
  if (dataLoading) return <FullScreenSpinner />;
  return children;
}

function RequireOnboarding({ children }: { children: ReactElement }) {
  const { state, session, dataLoading } = useApp();
  if (!session) return <Navigate to="/" replace />;
  if (dataLoading) return <FullScreenSpinner />;
  if (!state.user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { state, session, dataLoading } = useApp();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/" replace />;
  if (dataLoading) return <FullScreenSpinner />;
  if (!state.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            אין לכם הרשאת גישה
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            עמוד זה מיועד למנהלי מערכת בלבד.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    );
  }
  return children;
}

function LandingOrRedirect() {
  const { state, session, authLoading, dataLoading } = useApp();
  if (authLoading) return <FullScreenSpinner />;
  if (session) {
    if (dataLoading) return <FullScreenSpinner />;
    return (
      <Navigate
        to={state.user.onboardingComplete ? "/dashboard" : "/onboarding"}
        replace
      />
    );
  }
  return <Landing />;
}

function OnboardingGuard() {
  const { state, session, authLoading, dataLoading } = useApp();
  if (authLoading) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/" replace />;
  if (dataLoading) return <FullScreenSpinner />;
  if (state.user.onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Onboarding />;
}

export default function App() {
  const { authLoading } = useApp();
  if (authLoading) return <FullScreenSpinner />;

  return (
    <Routes>
      <Route path="/" element={<LandingOrRedirect />} />
      <Route path="/onboarding" element={<OnboardingGuard />} />
      <Route
        path="/dashboard"
        element={
          <RequireOnboarding>
            <Dashboard />
          </RequireOnboarding>
        }
      />
      <Route
        path="/checklist"
        element={
          <RequireOnboarding>
            <Checklist />
          </RequireOnboarding>
        }
      />
      <Route
        path="/marketplace"
        element={
          <RequireOnboarding>
            <Marketplace />
          </RequireOnboarding>
        }
      />
      <Route
        path="/marketplace/:category"
        element={
          <RequireOnboarding>
            <MarketplaceCategory />
          </RequireOnboarding>
        }
      />
      <Route
        path="/package"
        element={
          <RequireOnboarding>
            <PackageBuilder />
          </RequireOnboarding>
        }
      />
      <Route
        path="/budget"
        element={
          <RequireOnboarding>
            <Budget />
          </RequireOnboarding>
        }
      />
      <Route
        path="/books"
        element={
          <RequireOnboarding>
            <Books />
          </RequireOnboarding>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="providers" element={<AdminProviders />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="content" element={<AdminContent />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
