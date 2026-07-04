import React from "react";
import { Route } from "react-router-dom";
import ManagerDashboard from "../pages/manager/Dashboard";
import OrderManagement from "../pages/manager/OrderManagement";
import TaskManagement from "../pages/manager/TaskManagement";
import EmployeeManagement from "../pages/manager/EmployeeManagement";
import MachineManagement from "../pages/manager/MachineManagement";
import Reporting from "../pages/manager/Reporting";
import QualityControl from "../pages/manager/QualityControl";
import LearningVideos from "../pages/manager/LearningVideos";
import Defects from "../pages/manager/Defects";

export const managerRoutes = [
  { path: "dashboard", element: <ManagerDashboard /> },
  { path: "orders", element: <OrderManagement /> },
  { path: "tasks", element: <TaskManagement /> },
  { path: "employees", element: <EmployeeManagement /> },
  { path: "machines", element: <MachineManagement /> },
  { path: "reports", element: <Reporting /> },
  { path: "quality", element: <QualityControl /> },
  { path: "learning-videos", element: <LearningVideos /> },
  { path: "defects", element: <Defects /> },
];

export const ManagerRouteElements = (
  <>
    {managerRoutes.map((route) => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
  </>
);
