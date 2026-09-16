import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { SocketProvider } from "./context/SocketContext";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";

import AdminLayout from "./layouts/AdminLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

import { AdminRouteElements } from "./routes/adminRoutes";
import { ManagerRouteElements } from "./routes/managerRoutes";
import { EmployeeRouteElements } from "./routes/employeeRoutes";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LandingPage from "./pages/LandingPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect =
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "manager"
          ? "/manager/dashboard"
          : "/employee/dashboard";
    return <Navigate to={redirect} replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}

function ManagerRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      {children}
    </ProtectedRoute>
  );
}

function EmployeeRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={["employee", "manager", "admin"]}>
      {children}
    </ProtectedRoute>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) {
    const redirect =
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "manager"
          ? "/manager/dashboard"
          : "/employee/dashboard";
    return <Navigate to={redirect} replace />;
  }
  return children;
}

export default function App() {
  return (
    <SocketProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {AdminRouteElements}
        </Route>

        <Route
          path="/manager"
          element={
            <ManagerRoute>
              <ManagerLayout />
            </ManagerRoute>
          }
        >
          {ManagerRouteElements}
        </Route>

        <Route
          path="/employee"
          element={
            <EmployeeRoute>
              <EmployeeLayout />
            </EmployeeRoute>
          }
        >
          {EmployeeRouteElements}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </SocketProvider>
  );
}
