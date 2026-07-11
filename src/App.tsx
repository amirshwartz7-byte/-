import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
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

function RequireOnboarding({ children }: { children: ReactElement }) {
  const { state } = useApp();
  if (!state.user.onboardingComplete) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
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
          <RequireOnboarding>
            <Profile />
          </RequireOnboarding>
        }
      />
      <Route path="/admin" element={<AdminLayout />}>
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
