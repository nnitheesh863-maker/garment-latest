import React from "react";
import { Route } from "react-router-dom";
import EmployeeDashboard from "../pages/employee/Dashboard";
import TaskList from "../pages/employee/TaskList";
import Attendance from "../pages/employee/Attendance";
import Performance from "../pages/employee/Performance";
import IssueReporting from "../pages/employee/IssueReporting";
import LeaveRequest from "../pages/employee/LeaveRequest";
import LearningVideos from "../pages/employee/LearningVideos";
import DefectReporting from "../pages/employee/DefectReporting";

export const employeeRoutes = [
  { path: "dashboard", element: <EmployeeDashboard /> },
  { path: "tasks", element: <TaskList /> },
  { path: "attendance", element: <Attendance /> },
  { path: "performance", element: <Performance /> },
  { path: "report-issue", element: <IssueReporting /> },
  { path: "leave-request", element: <LeaveRequest /> },
  { path: "learning-videos", element: <LearningVideos /> },
  { path: "report-defect", element: <DefectReporting /> },
];

export const EmployeeRouteElements = (
  <>
    {employeeRoutes.map((route) => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
  </>
);
