import React from "react";
import { Route } from "react-router-dom";
import AdminDashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import SystemSettings from "../pages/admin/SystemSettings";
import AuditLogs from "../pages/admin/AuditLogs";
import ProductionLines from "../pages/admin/ProductionLines";
import AdminMachines from "../pages/admin/AdminMachines";
import AdminInventory from "../pages/admin/AdminInventory";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminQuality from "../pages/admin/AdminQuality";
import AdminAnalytics from "../pages/admin/AdminAnalytics";

export const adminRoutes = [
  { path: "dashboard", element: <AdminDashboard /> },
  { path: "users", element: <UserManagement /> },
  { path: "production-lines", element: <ProductionLines /> },
  { path: "machines", element: <AdminMachines /> },
  { path: "inventory", element: <AdminInventory /> },
  { path: "orders", element: <AdminOrders /> },
  { path: "quality", element: <AdminQuality /> },
  { path: "analytics", element: <AdminAnalytics /> },
  { path: "settings", element: <SystemSettings /> },
  { path: "audit-logs", element: <AuditLogs /> },
];

export const AdminRouteElements = (
  <>
    {adminRoutes.map((route) => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
  </>
);
