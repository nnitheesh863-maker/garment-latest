import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Skeleton,
  Avatar,
  IconButton,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FlagIcon from "@mui/icons-material/Flag";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import TimerIcon from "@mui/icons-material/Timer";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import MicIcon from "@mui/icons-material/Mic";
import ScheduleIcon from "@mui/icons-material/Schedule";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAuth } from "../../hooks/useAuth";
import {
  formatDate,
  getStatusColor,
  calculateProgress,
  timeAgo,
} from "../../utils/helpers";
import PerformanceChart from "../../components/charts/PerformanceChart";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { taskApi, employeeApi } from "../../api/axios";

const glassCard = {
  bgcolor: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 3,
  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
  transition: "transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
  },
};

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatGreetingDate(date) {
  const d = date || new Date();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const QUOTES = [
  "Ready to achieve today's production target?",
  "Every stitch counts. Let's make it perfect.",
  "Focus on quality, quantity will follow.",
  "Small progress is still progress. Keep going!",
  "Your precision defines our reputation.",
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [issues, setIssues] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({
    completedToday: 0,
    hoursWorked: 0,
    qualityScore: 0,
  });
  const [notifications, setNotifications] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const [tasksRes, attendanceRes, issuesRes, leavesRes] =
        await Promise.allSettled([
          taskApi.list({ assignedTo: user._id }),
          api.get(`/api/employees/${user._id}/attendance`),
          api.get(`/api/employees/${user._id}/issues`),
          api.get("/api/leaves/my"),
        ]);

      if (tasksRes.status === "fulfilled") {
        const d = tasksRes.value.data;
        setTasks(d?.data || d?.tasks || []);
      }
      if (attendanceRes.status === "fulfilled") {
        const d = attendanceRes.value.data;
        setAttendance(d?.data || d?.attendance || null);
      }
      if (issuesRes.status === "fulfilled") {
        const d = issuesRes.value.data;
        setIssues(d?.data || d?.issues || []);
      }
      if (leavesRes.status === "fulfilled") {
        const d = leavesRes.value.data;
        setLeaves(d?.data || d?.leaves || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter((t) => {
      if (!t.updatedAt) return false;
      return new Date(t.updatedAt) >= todayStart;
    });
    const completedToday = todayTasks.filter((t) => t.status === "completed").length;
    const completionRate =
      tasks.length > 0
        ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)
        : 0;
    setStats({
      completedToday,
      hoursWorked: attendance?.hoursWorked || attendance?.totalHours || 0,
      qualityScore: completionRate,
    });
  }, [tasks, attendance]);

  const isClockedIn = attendance?.clockIn && !attendance?.clockOut;
  const totalTarget = tasks.reduce((s, t) => s + (t.quantityTarget || 0), 0);
  const totalCompleted = tasks.reduce((s, t) => s + (t.quantityCompleted || 0), 0);
  const completionPercent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  const recentIssues = issues.slice(0, 3);
  const recentLeaves = leaves.slice(0, 3);

  const KPI_CARDS = [
    {
      label: "Target", value: `${totalTarget} units`,
      icon: <AssignmentIcon />, color: "#4f46e5", bg: "#eef2ff",
      trend: "+12% vs yesterday",
    },
    {
      label: "Completed", value: `${totalCompleted} units`,
      icon: <CheckCircleIcon />, color: "#16a34a", bg: "#f0fdf4",
      trend: completionPercent >= 50 ? "On track" : "Behind",
    },
    {
      label: "Machine", value: tasks.length > 0 ? `Line ${Math.floor(Math.random() * 8) + 1}` : "--",
      icon: <PrecisionManufacturingIcon />, color: "#ea580c", bg: "#fff7ed",
      trend: "Running",
    },
    {
      label: "Shift", value: attendance?.shift || "Day",
      icon: <GroupsIcon />, color: "#9333ea", bg: "#faf5ff",
      trend: "08:00 - 17:00",
    },
    {
      label: "AI Score", value: `${stats.qualityScore}%`,
      icon: <TrendingUpIcon />, color: "#0891b2", bg: "#ecfeff",
      trend: stats.qualityScore >= 70 ? "Good" : "Needs improvement",
    },
    {
      label: "Hours Worked", value: loading ? "--" : `${stats.hoursWorked}h`,
      icon: <TimerIcon />, color: "#d97706", bg: "#fffbeb",
      trend: "Today",
    },
    {
      label: "Quality Score", value: `${completionPercent}%`,
      icon: <StarIcon />, color: "#2563eb", bg: "#eff6ff",
      trend: completionPercent >= 80 ? "Excellent" : "Improving",
    },
    {
      label: "Attendance", value: isClockedIn ? "Active" : attendance?.clockOut ? "Completed" : "Pending",
      icon: <CalendarTodayIcon />, color: isClockedIn ? "#16a34a" : "#dc2626", bg: isClockedIn ? "#f0fdf4" : "#fef2f2",
      trend: isClockedIn ? "Clocked In" : "Not started",
    },
  ];

  const QUICK_ACTIONS = [
    { label: "Attendance", icon: <CalendarTodayIcon />, path: "/employee/attendance", color: "#4f46e5" },
    { label: "Leave Request", icon: <ExitToAppIcon />, path: "/employee/leave-request", color: "#0891b2" },
    { label: "Report Issue", icon: <FlagIcon />, path: "/employee/report-issue", color: "#ea580c" },
    { label: "Learning Videos", icon: <OndemandVideoIcon />, path: "/employee/learning-videos", color: "#9333ea" },
    { label: "Voice Assistant", icon: <MicIcon />, path: null, color: "#64748b", voice: true },
  ];

  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  return (
    <Box>
      {/* ─── Greeting ─── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
          borderRadius: 3,
          p: 3,
          mb: 3,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.04)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "-30%",
            left: "10%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.03)",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {getGreetingIcon()} {getTimeGreeting()}, {user?.profile?.firstName || user?.firstName || "Employee"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                {formatGreetingDate(new Date())}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.5, opacity: 0.9, fontStyle: "italic", fontWeight: 400, fontSize: 15 }}
              >
                "{quote}"
              </Typography>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                bgcolor: "rgba(255,255,255,0.12)",
                borderRadius: 2,
                px: 1.5,
                py: 0.75,
                backdropFilter: "blur(8px)",
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: isClockedIn ? "#4ade80" : "#fbbf24",
                  animation: isClockedIn ? "pulse 2s infinite" : "none",
                  "@keyframes pulse": {
                    "0%,100%": { opacity: 1 },
                    "50%": { opacity: 0.4 },
                  },
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 12 }}>
                {isClockedIn
                  ? `Active · ${formatDate(attendance?.clockIn, "hh:mm a")}`
                  : attendance?.clockOut
                    ? `Out · ${formatDate(attendance?.clockOut, "hh:mm a")}`
                    : "Not clocked in"}
              </Typography>
            </Box>
          </Box>
          {attendance?.workingHours && (
            <Box display="flex" gap={2.5} mt={1.5} sx={{ opacity: 0.85 }}>
              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 14 }} /> {attendance.workingHours}h worked
              </Typography>
              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <TimerIcon sx={{ fontSize: 14 }} /> {attendance.breakTime || 0}h break
              </Typography>
              {attendance.overtime > 0 && (
                <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#fbbf24" }}>
                  <ArrowUpwardIcon sx={{ fontSize: 14 }} /> {attendance.overtime}h OT
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* ─── KPI Cards ─── */}
      {loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          {KPI_CARDS.map((kpi) => (
            <Card key={kpi.label} sx={glassCard}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: kpi.bg,
                      color: kpi.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {React.cloneElement(kpi.icon, { sx: { fontSize: 20 } })}
                  </Box>
                  <Chip
                    label={kpi.trend}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      bgcolor: "rgba(0,0,0,0.04)",
                      color: "text.secondary",
                      borderRadius: 1,
                    }}
                  />
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ mt: 1.5, color: "#0f172a", lineHeight: 1.1 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: 12 }}>
                  {kpi.label}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ─── Body: 70/30 split ─── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "7fr 3fr" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        {/* ===== LEFT COLUMN (70%) ===== */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Today's Tasks */}
          <Card sx={glassCard}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#0f172a", fontSize: 17 }}>
                  Today's Tasks
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate("/employee/tasks")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 12,
                    color: "#4f46e5",
                    "&:hover": { bgcolor: "rgba(79,70,229,0.08)" },
                    borderRadius: 1.5,
                  }}
                >
                  View All &rarr;
                </Button>
              </Box>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 1, borderRadius: 2 }} />
                ))
              ) : tasks.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <AssignmentIcon sx={{ fontSize: 40, color: "#cbd5e1", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No tasks assigned for today
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1.5, textTransform: "none", borderRadius: 1.5, fontSize: 12 }}
                    onClick={() => navigate("/employee/tasks")}
                  >
                    Browse Tasks
                  </Button>
                </Box>
              ) : (
                <Box>
                  {/* Table header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      bgcolor: "#f8fafc",
                      borderRadius: 1.5,
                      mb: 0.5,
                    }}
                  >
                    {["Task Name", "Priority", "Machine", "Due", "Status"].map((h) => (
                      <Typography
                        key={h}
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}
                      >
                        {h}
                      </Typography>
                    ))}
                  </Box>
                  {/* Rows */}
                  {tasks.slice(0, 5).map((task) => (
                    <Box
                      key={task._id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        borderRadius: 1.5,
                        transition: "background 200ms",
                        "&:hover": { bgcolor: "#f8fafc" },
                      }}
                    >
                      <Box minWidth={0}>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ color: "#0f172a", fontSize: 13 }}>
                          {task.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={PRIORITY_LABELS[task.priority] || task.priority}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 10,
                          fontWeight: 600,
                          width: "fit-content",
                          bgcolor:
                            task.priority === "urgent"
                              ? "#fef2f2"
                              : task.priority === "high"
                                ? "#fff7ed"
                                : task.priority === "medium"
                                  ? "#fffbeb"
                                  : "#f0fdf4",
                          color:
                            task.priority === "urgent"
                              ? "#dc2626"
                              : task.priority === "high"
                                ? "#ea580c"
                                : task.priority === "medium"
                                  ? "#d97706"
                                  : "#16a34a",
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ alignSelf: "center", fontSize: 12 }}
                      >
                        L{Math.floor(Math.random() * 8) + 1}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ alignSelf: "center", fontSize: 12 }}
                      >
                        {formatDate(task.updatedAt || task.createdAt, "hh:mm a")}
                      </Typography>
                      <Chip
                        label={task.status?.replace(/_/g, " ")}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "capitalize",
                          width: "fit-content",
                          bgcolor: `${getStatusColor(task.status)}22`,
                          color: getStatusColor(task.status),
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity + Notifications row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            {/* Recent Activity */}
            <Card sx={glassCard}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", mb: 1.5, fontSize: 14 }}>
                  Recent Activity
                </Typography>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={32} sx={{ mb: 0.5, borderRadius: 1 }} />
                  ))
                ) : recentIssues.length === 0 && recentLeaves.length === 0 ? (
                  <Box textAlign="center" py={1.5}>
                    <EventBusyIcon sx={{ fontSize: 28, color: "#cbd5e1", mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">No recent activity</Typography>
                  </Box>
                ) : (
                  <Box>
                    {recentIssues.map((issue) => (
                      <Box
                        key={issue._id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 0.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <FlagIcon sx={{ fontSize: 16, color: "#ef4444", flexShrink: 0 }} />
                        <Box minWidth={0} flex={1}>
                          <Typography variant="caption" fontWeight={500} noWrap sx={{ fontSize: 12, display: "block" }}>
                            {issue.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                            {timeAgo(issue.createdAt)}
                          </Typography>
                        </Box>
                        <Chip
                          label={issue.status}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: "capitalize",
                            bgcolor:
                              issue.status === "resolved"
                                ? "#dcfce7"
                                : issue.status === "in_progress"
                                  ? "#fef9c3"
                                  : "#fee2e2",
                            color:
                              issue.status === "resolved"
                                ? "#16a34a"
                                : issue.status === "in_progress"
                                  ? "#ca8a04"
                                  : "#dc2626",
                          }}
                        />
                      </Box>
                    ))}
                    {recentLeaves.map((leave) => (
                      <Box
                        key={leave._id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 0.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <ExitToAppIcon sx={{ fontSize: 16, color: "#4f46e5", flexShrink: 0 }} />
                        <Box minWidth={0} flex={1}>
                          <Typography variant="caption" fontWeight={500} noWrap sx={{ fontSize: 12, display: "block" }}>
                            {leave.leaveType} leave
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                            {formatDate(leave.startDate)}
                          </Typography>
                        </Box>
                        <Chip
                          label={leave.status}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: "capitalize",
                            bgcolor:
                              leave.status === "approved"
                                ? "#dcfce7"
                                : leave.status === "pending"
                                  ? "#fef9c3"
                                  : "#fee2e2",
                            color:
                              leave.status === "approved"
                                ? "#16a34a"
                                : leave.status === "pending"
                                  ? "#ca8a04"
                                  : "#dc2626",
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card sx={glassCard}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", fontSize: 14 }}>
                    Notifications
                  </Typography>
                  <IconButton size="small" sx={{ color: "text.secondary" }}>
                    <MoreVertIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={32} sx={{ mb: 0.5, borderRadius: 1 }} />
                  ))
                ) : (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 0.75,
                        px: 1,
                        bgcolor: "rgba(79,70,229,0.06)",
                        borderRadius: 1.5,
                        mb: 0.5,
                      }}
                    >
                      <NotificationsIcon sx={{ fontSize: 16, color: "#4f46e5", flexShrink: 0 }} />
                      <Box minWidth={0} flex={1}>
                        <Typography variant="caption" fontWeight={500} sx={{ fontSize: 11, display: "block" }}>
                          Welcome to the dashboard
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Just now</Typography>
                      </Box>
                    </Box>
                    {tasks.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 0.75,
                          px: 1,
                          borderRadius: 1.5,
                          mb: 0.5,
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                        }}
                      >
                        <AssignmentIcon sx={{ fontSize: 16, color: "#0891b2", flexShrink: 0 }} />
                        <Box minWidth={0} flex={1}>
                          <Typography variant="caption" fontWeight={500} sx={{ fontSize: 11, display: "block" }}>
                            {tasks.length} task(s) pending
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Today</Typography>
                        </Box>
                      </Box>
                    )}
                    {attendance?.clockIn && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 0.75,
                          px: 1,
                          borderRadius: 1.5,
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                        }}
                      >
                        <AccessTimeIcon sx={{ fontSize: 16, color: "#16a34a", flexShrink: 0 }} />
                        <Box minWidth={0} flex={1}>
                          <Typography variant="caption" fontWeight={500} sx={{ fontSize: 11, display: "block" }}>
                            Clocked in {formatDate(attendance.clockIn, "hh:mm a")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Today</Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* ===== RIGHT COLUMN (30%) ===== */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Performance Chart */}
          <Card sx={glassCard}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", fontSize: 14 }}>
                  Performance
                </Typography>
                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                  label={`${stats.qualityScore}%`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: "rgba(79,70,229,0.1)",
                    color: "#4f46e5",
                    borderRadius: 1,
                  }}
                />
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              ) : (
                <PerformanceChart
                  data={[{
                    label: "Performance",
                    data: [65, 70, 75, 72, 80, 85, 82, 88, 90, 87, 92, 95],
                    borderColor: "#4f46e5",
                    backgroundColor: "rgba(79,70,229,0.06)",
                  }]}
                  labels={["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}
                  height={200}
                />
              )}
            </CardContent>
          </Card>

          {/* Attendance Calendar */}
          <Card sx={glassCard}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", fontSize: 14, mb: 1.5 }}>
                Today's Schedule
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.5,
                  textAlign: "center",
                }}
              >
                {["S","M","T","W","T","F","S"].map((d) => (
                  <Typography key={d} variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: 10, py: 0.5 }}>
                    {d}
                  </Typography>
                ))}
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const today = new Date().getDate();
                  return (
                    <Box
                      key={i}
                      sx={{
                        width: 28,
                        height: 28,
                        mx: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 1,
                        fontSize: 11,
                        fontWeight: day === today ? 700 : 400,
                        bgcolor: day === today ? "#4f46e5" : "transparent",
                        color: day === today ? "#fff" : "text.primary",
                        transition: "background 200ms",
                        "&:hover": day !== today ? { bgcolor: "rgba(0,0,0,0.04)" } : {},
                      }}
                    >
                      {day}
                    </Box>
                  );
                })}
              </Box>
              <Box display="flex" gap={1.5} mt={1.5} pt={1.5} sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e" }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Present</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#fbbf24" }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Half-day</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Absent</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={glassCard}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a", fontSize: 14, mb: 1.5 }}>
                Quick Actions
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                }}
              >
                {QUICK_ACTIONS.map((a) => (
                  <Box
                    key={a.label}
                    onClick={() => {
                      if (a.voice) {
                        window.voiceAssistant?.toggle?.();
                      } else {
                        navigate(a.path);
                      }
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.25,
                      py: 1,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      bgcolor: a.voice ? "transparent" : `${a.color}0a`,
                      border: a.voice ? "1px dashed" : "none",
                      borderColor: a.voice ? "#cbd5e1" : "transparent",
                      transition: "all 200ms ease",
                      "&:hover": {
                        bgcolor: `${a.color}14`,
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Box sx={{ color: a.color, display: "flex" }}>
                      {React.cloneElement(a.icon, { sx: { fontSize: 18 } })}
                    </Box>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11, color: "#1e293b" }}>
                      {a.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h < 12) return "☀️";
  if (h < 17) return "⛅";
  return "🌙";
}
