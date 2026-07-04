export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
};

export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  IN_PRODUCTION: "in_production",
  QUALITY_CHECK: "quality_check",
  COMPLETED: "completed",
  DELIVERED: "delivered",
};

export const TASK_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  COMPLETED: "completed",
  DELAYED: "delayed",
};

export const MACHINE_STATUS = {
  AVAILABLE: "available",
  IN_USE: "in_use",
  MAINTENANCE: "maintenance",
  REPAIR: "repair",
  RETIRED: "retired",
};

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

export const QUALITY_GRADE = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

export const ISSUE_TYPES = {
  MACHINE: "machine",
  MATERIAL: "material",
  QUALITY: "quality",
  OTHER: "other",
};

export const LEAVE_TYPES = {
  SICK: "sick",
  CASUAL: "casual",
  VACATION: "vacation",
  PERSONAL: "personal",
  OTHER: "other",
};

export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const REPORT_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  CUSTOM: "custom",
};

export const INVENTORY_CATEGORIES = [
  "fabric",
  "thread",
  "zipper",
  "button",
  "label",
  "packaging",
];

export const STATUS_COLORS = {
  pending: "#FFA726",
  approved: "#42A5F5",
  in_production: "#AB47BC",
  quality_check: "#26A69A",
  completed: "#66BB6A",
  delivered: "#1E88E5",
  accepted: "#42A5F5",
  in_progress: "#AB47BC",
  paused: "#FFA726",
  delayed: "#EF5350",
  available: "#66BB6A",
  in_use: "#42A5F5",
  maintenance: "#FFA726",
  repair: "#EF5350",
  retired: "#78909C",
  low: "#66BB6A",
  medium: "#FFA726",
  high: "#EF5350",
  urgent: "#D32F2F",
  A: "#66BB6A",
  B: "#42A5F5",
  C: "#FFA726",
  D: "#EF5350",
  active: "#66BB6A",
  inactive: "#78909C",
};

export const NAV_ITEMS = {
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: "Dashboard" },
    { label: "User Management", path: "/admin/users", icon: "People" },
    {
      label: "Production Lines",
      path: "/admin/production-lines",
      icon: "Factory",
    },
    {
      label: "Machines",
      path: "/admin/machines",
      icon: "PrecisionManufacturing",
    },
    { label: "Inventory", path: "/admin/inventory", icon: "Inventory" },
    { label: "Orders", path: "/admin/orders", icon: "ShoppingCart" },
    { label: "Quality", path: "/admin/quality", icon: "Verified" },
    { label: "Analytics", path: "/admin/analytics", icon: "BarChart" },
    { label: "System Settings", path: "/admin/settings", icon: "Settings" },
    { label: "Audit Logs", path: "/admin/audit-logs", icon: "Security" },
  ],
  manager: [
    { label: "Dashboard", path: "/manager/dashboard", icon: "Dashboard" },
    { label: "Orders", path: "/manager/orders", icon: "ShoppingCart" },
    { label: "Tasks", path: "/manager/tasks", icon: "Assignment" },
    { label: "Employees", path: "/manager/employees", icon: "People" },
    {
      label: "Machines",
      path: "/manager/machines",
      icon: "PrecisionManufacturing",
    },
    { label: "Reports", path: "/manager/reports", icon: "BarChart" },
    { label: "Quality Control", path: "/manager/quality", icon: "Verified" },
    {
      label: "Learning Videos",
      path: "/manager/learning-videos",
      icon: "OndemandVideo",
    },
    { label: "Defects", path: "/manager/defects", icon: "ReportProblem" },
  ],
  employee: [
    { label: "Dashboard", path: "/employee/dashboard", icon: "Dashboard" },
    { label: "My Tasks", path: "/employee/tasks", icon: "Assignment" },
    {
      label: "Attendance",
      path: "/employee/attendance",
      icon: "CalendarToday",
    },
    {
      label: "Leave Request",
      path: "/employee/leave-request",
      icon: "ExitToApp",
    },
    { label: "Performance", path: "/employee/performance", icon: "TrendingUp" },
    {
      label: "Report Issue",
      path: "/employee/report-issue",
      icon: "ReportProblem",
    },
    {
      label: "Learning Videos",
      path: "/employee/learning-videos",
      icon: "OndemandVideo",
    },
    {
      label: "Report Defect",
      path: "/employee/report-defect",
      icon: "CameraAlt",
    },
  ],
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
