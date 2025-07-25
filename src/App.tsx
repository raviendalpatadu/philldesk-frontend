/**
 * Main App Component for PhillDesk
 *
 * This is the root component that handles routing, authentication checks,
 * and layout rendering based on user roles.
 */

import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout, Spin } from "antd";
import { useAuthStore } from "@store/authStore";

// Components
import LoginPage from "@pages/auth/LoginPage";
import RegisterPage from "@pages/auth/RegisterPage";
import AdminDashboard from "@pages/admin/AdminDashboard";
import PharmacistDashboard from "@pages/pharmacist/PharmacistDashboard";
import CustomerDashboard from "@pages/customer/CustomerDashboard";
import AppLayout from "@components/layout/AppLayout";
import ProtectedRoute from "@components/auth/ProtectedRoute";
import PublicRoute from "@components/auth/PublicRoute";
import NotFoundPage from "@pages/error/NotFoundPage";
import UnauthorizedPage from "@pages/error/UnauthorizedPage";

// Lazy load components for better performance
const PrescriptionManagement = React.lazy(
  () => import("@pages/pharmacist/PrescriptionManagement")
);
const InventoryManagement = React.lazy(
  () => import("@pages/admin/InventoryManagement")
);
const PharmacistInventoryManagement = React.lazy(
  () => import("@pages/pharmacist/InventoryManagement")
);
const ReorderManagement = React.lazy(
  () => import("@pages/pharmacist/ReorderManagement")
);
const BillingManagement = React.lazy(
  () => import("@pages/pharmacist/BillingManagement")
);
const ManualBilling = React.lazy(
  () => import("@pages/pharmacist/ManualBilling")
);
const ReportsPage = React.lazy(() => import("@pages/admin/ReportsPage"));
const CustomerPrescriptions = React.lazy(
  () => import("@pages/customer/CustomerPrescriptions").then(module => ({ default: module.default }))
);
const UploadPrescription = React.lazy(
  () => import("@pages/customer/UploadPrescription")
);
const PendingPrescriptions = React.lazy(
  () => import("@pages/customer/PendingPrescriptions")
);
const OrdersPage = React.lazy(() => import("@pages/customer/OrdersPage"));
const CustomerBills = React.lazy(() => import("@/pages/customer/CustomerBillsPage"));
const UserManagement = React.lazy(() => import("@pages/admin/UserManagement"));
const ProfilePage = React.lazy(() => import("@pages/common/ProfilePage"));
const SettingsPage = React.lazy(() => import("@pages/admin/SettingsPage"));
const AnalyticsDashboard = React.lazy(() => import("@pages/admin/AnalyticsDashboard"));

const { Content } = Layout;

/**
 * Main App Component
 */
const App: React.FC = () => {
  const { isLoading, checkAuth } = useAuthStore();

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Layout className="full-height">
        <Content className="flex-center">
          <Spin size="large" tip="Loading PhillDesk..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="full-height">
      <Routes>
        {/* Public Routes - accessible without authentication */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes - require authentication */}
        <Route
          path="/"
          element={
           <ProtectedRoute>
              <AppLayout />
           </ProtectedRoute>
          }
        >
          {/* Dashboard Routes */}
          <Route index element={<DashboardRedirect />} />

          {/* Admin Routes */}
          <Route
            path="admin/*"
            element={
            <ProtectedRoute requiredRoles={["ADMIN"]}>
                <React.Suspense fallback={<PageLoadingSpinner />}>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="inventory" element={<InventoryManagement />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Routes>
                </React.Suspense>
               </ProtectedRoute>
            }
          />

          {/* Pharmacist Routes */}
          <Route
            path="pharmacist/*"
            element={
              <ProtectedRoute requiredRoles={["PHARMACIST", "ADMIN"]}>
                <React.Suspense fallback={<PageLoadingSpinner />}>
                  <Routes>
                    <Route index element={<PharmacistDashboard />} />
                    <Route path="dashboard" element={<PharmacistDashboard />} />
                    <Route
                      path="prescriptions"
                      element={<PrescriptionManagement />}
                    />
                    <Route path="inventory" element={<PharmacistInventoryManagement />} />
                    <Route path="reorder-management" element={<ReorderManagement />} />
                    <Route path="billing" element={<BillingManagement />} />
                    <Route path="manual-billing" element={<ManualBilling />} />
                  </Routes>
                </React.Suspense>
             </ProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path="customer/*"
            element={
                <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <React.Suspense fallback={<PageLoadingSpinner />}>
                <Routes>
                  <Route index element={<CustomerDashboard />} />
                  <Route path="dashboard" element={<CustomerDashboard />} />
                  <Route
                    path="prescriptions"
                    element={<CustomerPrescriptions />}
                  />
                  <Route
                    path="upload"
                    element={<UploadPrescription />}
                  />
                  <Route
                    path="pending"
                    element={<PendingPrescriptions />}
                  />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="billing" element={<CustomerBills />} />
                  <Route path="bills" element={<CustomerBills />} />
                </Routes>
              </React.Suspense>
                 </ProtectedRoute>
            }
          />

          {/* Common Routes - accessible by all authenticated users */}
          <Route
            path="profile"
            element={
              <React.Suspense fallback={<PageLoadingSpinner />}>
                <ProfilePage />
              </React.Suspense>
            }
          />
        </Route>

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Layout>
  );
};

/**
 * Component to redirect users to their appropriate dashboard
 */
const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!user || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/admin/dashboard" replace />;
    case "PHARMACIST":
      return <Navigate to="/pharmacist/dashboard" replace />;
    case "CUSTOMER":
      return <Navigate to="/customer/dashboard" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

/**
 * Loading spinner component for lazy-loaded pages
 */
const PageLoadingSpinner: React.FC = () => (
  <div className="loading-container">
    <Spin size="large" tip="Loading page..." />
  </div>
);

export default App;
