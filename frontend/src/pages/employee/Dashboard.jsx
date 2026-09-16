import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Skeleton,
  LinearProgress,
  Divider,
  Grid,
  Avatar,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
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
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import MicIcon from "@mui/icons-material/Mic";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditIcon from "@mui/icons-material/Edit";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { toast } from "react-toastify";
import {
  formatDate,
  formatTime12,
  formatHoursMinutes,
  getWorkingDuration,
  getStatusColor,
  calculateProgress,
  timeAgo,
  getInitials,
} from "../../utils/helpers";
import PerformanceChart from "../../components/charts/PerformanceChart";
import ProfileSettingsModal from "../../components/modals/ProfileSettingsModal";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { taskApi } from "../../api/axios";

const MAROON = '#59171B';
const MAROON_LIGHT = '#7A2328';
const CREAM = '#FED7B8';
const CREAM_BG = '#FFF8F2';
const BORDER = '#F1D5C0';

const glassCard = {
  bgcolor: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${BORDER}`,
  borderRadius: 3,
  boxShadow: `0 4px 20px rgba(89,23,27,0.06)`,
  transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px rgba(89,23,27,0.1)`,
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

function AnimatedNumber({ value, suffix = '', duration = 1 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (start === end) { setDisplay(end); return; }
    const increment = end / (60 * duration);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{display}{suffix}</>;
}

const MotionCard = motion.create(Card);

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [issues, setIssues] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ completedToday: 0, hoursWorked: 0, qualityScore: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const [tasksRes, attendanceRes, issuesRes, leavesRes] = await Promise.allSettled([
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
        const list = d?.data || d?.attendance || [];
        const todayRec = Array.isArray(list)
          ? list.find(
              (r) =>
                new Date(r.date).toDateString() === new Date().toDateString(),
            )
          : (list && !Array.isArray(list) ? list : null);
        setAttendance(todayRec || (Array.isArray(list) && list.length > 0 ? list[0] : null));
      }
      if (issuesRes.status === "fulfilled") {
        const d = issuesRes.value.data;
        setIssues(d?.data || d?.issues || []);
      }
      if (leavesRes.status === "fulfilled") {
        const d = leavesRes.value.data;
        setLeaves(d?.data || d?.leaves || []);
      }
    } catch { /* fallback */ } finally { setLoading(false); }
  }, [user?._id]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    if (!socket) return;

    const handleSocketSync = () => {
      fetchDashboardData();
    };

    socket.on("taskAssigned", handleSocketSync);
    socket.on("taskUpdated", handleSocketSync);
    socket.on("qualityApproved", handleSocketSync);
    socket.on("reworkRequested", handleSocketSync);
    socket.on("attendance_update", handleSocketSync);

    return () => {
      socket.off("taskAssigned", handleSocketSync);
      socket.off("taskUpdated", handleSocketSync);
      socket.off("qualityApproved", handleSocketSync);
      socket.off("reworkRequested", handleSocketSync);
      socket.off("attendance_update", handleSocketSync);
    };
  }, [socket, fetchDashboardData]);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter((t) => t.updatedAt && new Date(t.updatedAt) >= todayStart);
    const completedToday = todayTasks.filter((t) => t.status === "completed").length;
    const completionRate = tasks.length > 0
      ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)
      : 0;
    setStats({
      completedToday,
      hoursWorked: attendance?.workingHours || attendance?.hoursWorked || attendance?.totalHours || 0,
      qualityScore: completionRate,
    });
  }, [tasks, attendance]);

  const isClockedIn = Boolean(attendance?.clockIn && !attendance?.clockOut);
  const totalTarget = tasks.reduce((s, t) => s + (t.quantityTarget || 0), 0);
  const totalCompleted = tasks.reduce((s, t) => s + (t.quantityCompleted || 0), 0);
  const completionPercent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
  const recentIssues = issues.slice(0, 3);
  const recentLeaves = leaves.slice(0, 3);

  const workingDuration = getWorkingDuration(
    attendance?.clockIn,
    attendance?.clockOut,
    attendance?.workingHours || stats.hoursWorked
  );

  const KPI_CARDS = [
    { label: "Target", value: `${totalTarget}`, suffix: " units", color: MAROON, bg: CREAM_BG, trend: "Today's goal" },
    { label: "Completed", value: `${totalCompleted}`, suffix: " units", color: "#16a34a", bg: "#f0fdf4", trend: completionPercent >= 50 ? "On track" : "Behind" },
    { label: "Machine", value: tasks.length > 0 ? `L${Math.floor(Math.random() * 8) + 1}` : "--", suffix: "", color: MAROON_LIGHT, bg: "#fef2f2", trend: "Operational" },
    { label: "Shift", value: attendance?.shift || "Day", suffix: "", color: "#9333ea", bg: "#faf5ff", trend: "08:00 - 17:00" },
    { label: "AI Score", value: `${stats.qualityScore}`, suffix: "%", color: "#0891b2", bg: "#ecfeff", trend: stats.qualityScore >= 70 ? "Good" : "Needs work" },
    { label: "Hours Worked", value: loading ? "--" : workingDuration.formatted, suffix: "", color: "#d97706", bg: "#fffbeb", trend: isClockedIn ? "Active (Live)" : attendance?.clockOut ? "Completed" : "Today" },
    { label: "Quality", value: `${completionPercent}`, suffix: "%", color: "#2563eb", bg: "#eff6ff", trend: completionPercent >= 80 ? "Excellent" : "Improving" },
    { label: "Attendance", value: isClockedIn ? "Active" : attendance?.clockOut ? "Done" : "---", suffix: "", color: isClockedIn ? "#16a34a" : "#dc2626", bg: isClockedIn ? "#f0fdf4" : "#fef2f2", trend: isClockedIn ? "Clocked In" : "Not started" },
  ];

  const QUICK_ACTIONS = [
    { label: "Profile & Photo", icon: <ManageAccountsIcon />, path: null, color: "#59171B", isProfile: true },
    { label: "Attendance", icon: <CalendarTodayIcon />, path: "/employee/attendance", color: MAROON },
    { label: "Leave Request", icon: <ExitToAppIcon />, path: "/employee/leave-request", color: "#0891b2" },
    { label: "Report Issue", icon: <FlagIcon />, path: "/employee/report-issue", color: "#ea580c" },
    { label: "Learning", icon: <OndemandVideoIcon />, path: "/employee/learning-videos", color: "#9333ea" },
    { label: "Voice", icon: <MicIcon />, path: null, color: "#7A6A63", voice: true },
  ];

  const [logQty, setLogQty] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [voiceListening, setVoiceListening] = useState(false);
  const employeeRecRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setVoiceListening(false);
        try {
          const response = await api.post('/api/voice/process', {
            command: text,
            language: 'en',
          });
          const reply = response.data?.data?.reply || response.data?.reply || 'Processed voice action.';
          setVoiceReply(reply);
          toast.info(reply);
          fetchDashboardData();
        } catch (e) {
          console.error(e);
        }
      };

      rec.onerror = () => setVoiceListening(false);
      rec.onend = () => setVoiceListening(false);
      employeeRecRef.current = rec;
    }
  }, [fetchDashboardData]);

  const handleVoiceTrigger = () => {
    if (!employeeRecRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (voiceListening) {
      employeeRecRef.current.stop();
    } else {
      setVoiceListening(true);
      employeeRecRef.current.start();
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await api.put(`/api/tasks/${taskId}/status`, { status: 'accepted' });
      toast.success('Task accepted!');
      fetchDashboardData();
    } catch (e) {
      toast.error('Failed to accept task.');
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      await api.put(`/api/tasks/${taskId}/status`, { status: 'in_progress' });
      toast.success('Production started!');
      fetchDashboardData();
    } catch (e) {
      toast.error('Failed to start production.');
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await api.put(`/api/tasks/${taskId}/status`, { status: 'paused' });
      toast.info('Production paused.');
      fetchDashboardData();
    } catch (e) {
      toast.error('Failed to pause production.');
    }
  };

  const handleLogProgress = async (taskId) => {
    if (!logQty || isNaN(logQty)) {
      toast.error('Please enter a valid quantity.');
      return;
    }
    try {
      await api.post(`/api/tasks/${taskId}/progress`, { produced: parseInt(logQty) });
      toast.success(`Logged progress: ${logQty} garments.`);
      setLogQty('');
      fetchDashboardData();
    } catch (e) {
      toast.error('Failed to update progress.');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.put(`/api/tasks/${taskId}/status`, { status: 'quality_check' });
      toast.success('Task submitted to Quality Control check.');
      fetchDashboardData();
    } catch (e) {
      toast.error('Failed to submit task.');
    }
  };

  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <Box>
      {/* ─── Greeting ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #59171B 0%, #7A2328 50%, #A45A4A 100%)',
            borderRadius: 3, p: 3, mb: 3, color: '#fff',
            position: 'relative', overflow: 'hidden',
            '&::before': {
              content: '""', position: 'absolute', top: '-60%', right: '-15%',
              width: 450, height: 450, borderRadius: '50%',
              background: 'rgba(254,215,184,0.08)',
            },
            '&::after': {
              content: '""', position: 'absolute', bottom: '-35%', left: '5%',
              width: 350, height: 350, borderRadius: '50%',
              background: 'rgba(254,215,184,0.05)',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={2.5} flexWrap="wrap">
                <Tooltip title="Click to view & edit profile photo" arrow>
                  <Box
                    onClick={() => setProfileModalOpen(true)}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      "&:hover .edit-overlay": { opacity: 1 },
                      "&:hover .avatar-ring": { transform: "scale(1.05)" },
                    }}
                  >
                    <Avatar
                      src={user?.profile?.profileImage || user?.profileImage || undefined}
                      className="avatar-ring"
                      sx={{
                        width: { xs: 58, sm: 70 },
                        height: { xs: 58, sm: 70 },
                        bgcolor: "rgba(254,215,184,0.3)",
                        color: "#FED7B8",
                        fontSize: { xs: 20, sm: 26 },
                        fontWeight: 800,
                        border: "3px solid #FED7B8",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {getInitials(`${user?.profile?.firstName || user?.firstName || "E"} ${user?.profile?.lastName || user?.lastName || ""}`)}
                    </Avatar>
                    <Box
                      className="edit-overlay"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        bgcolor: "rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18, color: "#FED7B8" }} />
                    </Box>
                  </Box>
                </Tooltip>
                <Box>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                      {getTimeGreeting()}, {user?.profile?.firstName || user?.firstName || "Employee"}
                    </Typography>
                    <Chip
                      label="Edit Profile"
                      size="small"
                      icon={<EditIcon sx={{ fontSize: "14px !important", color: "#FED7B8 !important" }} />}
                      onClick={() => setProfileModalOpen(true)}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.18)",
                        color: "#FED7B8",
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: "pointer",
                        border: "1px solid rgba(254,215,184,0.4)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                    {formatGreetingDate(new Date())} &bull; {user?.profile?.position || user?.position || "Sewing Operator"} &bull; {user?.profile?.department || user?.department || "Production"} Dept
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, opacity: 0.85, fontStyle: 'italic', fontWeight: 400, fontSize: 14 }}>
                    "{quote}"
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2,
                  px: 1.5, py: 0.75, backdropFilter: 'blur(8px)',
                }}
              >
                <Box sx={{
                  width: 10, height: 10, borderRadius: '50%',
                  bgcolor: isClockedIn ? '#4ade80' : '#fbbf24',
                  animation: isClockedIn ? 'pulse-glow 2s infinite' : 'none',
                }} />
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 12 }}>
                  {isClockedIn ? `Active \u00B7 In at ${formatTime12(attendance?.clockIn)}`
                    : attendance?.clockOut ? `Out \u00B7 ${formatTime12(attendance?.clockOut)}`
                      : 'Not clocked in'}
                </Typography>
              </Box>
            </Box>
            {(attendance?.clockIn || attendance?.workingHours > 0 || workingDuration.hours > 0 || workingDuration.minutes > 0) && (
              <Box display="flex" gap={2.5} mt={1.5} sx={{ opacity: 0.9, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: isClockedIn ? '#86efac' : '#fff' }}>
                  <AccessTimeIcon sx={{ fontSize: 14 }} /> {workingDuration.detailed} worked {isClockedIn ? '(Active)' : ''}
                </Typography>
                {attendance?.breakTime > 0 && (
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimerIcon sx={{ fontSize: 14 }} /> {formatHoursMinutes(attendance.breakTime, 'short')} break
                  </Typography>
                )}
                {attendance?.overtime > 0 && (
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#fbbf24', fontWeight: 600 }}>
                    <ArrowUpwardIcon sx={{ fontSize: 14 }} /> {formatHoursMinutes(attendance.overtime, 'short')} OT
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* ─── KPI Cards ─── */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show">
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
            {KPI_CARDS.map((kpi) => (
              <MotionCard key={kpi.label} variants={item} sx={glassCard}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 2,
                      background: kpi.bg, color: kpi.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${kpi.color}15`,
                    }}>
                      {React.cloneElement(kpi.icon || <TrendingUpIcon />, { sx: { fontSize: 20 } })}
                    </Box>
                    <Chip label={kpi.trend} size="small" sx={{
                      height: 20, fontSize: 10, fontWeight: 600,
                      bgcolor: 'rgba(0,0,0,0.04)', color: '#7A6A63', borderRadius: 1,
                    }} />
                  </Box>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 1.5, color: '#2C1A1A', lineHeight: 1.1 }}>
                    <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 11, color: '#7A6A63', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {kpi.label}
                  </Typography>
                </CardContent>
              </MotionCard>
            ))}
          </Box>
        </motion.div>
      )}

      {/* ─── Body: 70/30 ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '7fr 3fr' }, gap: 2.5, alignItems: 'start' }}>

          {/* ===== LEFT (70%) ===== */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* AI Active Task Card */}
            {(() => {
              const activeTask = tasks.find((t) => ['pending', 'accepted', 'in_progress', 'paused', 'rework', 'quality_check'].includes(t.status));
              if (!activeTask) return null;

              const pct = activeTask.quantity?.target > 0
                ? Math.round(((activeTask.quantity?.produced || 0) / activeTask.quantity.target) * 100)
                : 0;

              return (
                <Card sx={{ ...glassCard, borderLeft: '5px solid #59171B', bgcolor: 'rgba(89,23,27,0.02)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Chip label="NEW AI-ASSIGNED TASK" size="small" sx={{ mb: 1.5, bgcolor: '#59171B', color: '#FED7B8', fontWeight: 800, fontSize: 10 }} />
                        <Typography variant="h5" fontWeight={800} color="#2C1A1A">
                          {activeTask.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Order ID: {activeTask.orderId?.orderNumber || "ORD-1042"} · Customer: {activeTask.orderId?.customer?.name || "ABC Fashion"}
                        </Typography>
                      </Box>
                      <Chip label={activeTask.status.replace('_', ' ')} size="small" color="primary" sx={{ bgcolor: '#59171B', fontWeight: 700 }} />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2.5} mb={2.5}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Production Line</Typography>
                        <Typography variant="body2" fontWeight={700}>Line 3</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Reserved Machine</Typography>
                        <Typography variant="body2" fontWeight={700}>{activeTask.machineId?.name || "M-12"}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Quantity Target</Typography>
                        <Typography variant="body2" fontWeight={700}>{activeTask.quantity?.target || 625} units</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Quantity Produced</Typography>
                        <Typography variant="body2" fontWeight={700}>{activeTask.quantity?.produced || 0} units</Typography>
                      </Grid>
                    </Grid>

                    <Box mb={2.5}>
                      <Box display="flex" justifyContent="space-between" mb={0.75}>
                        <Typography variant="caption" color="text.secondary">Production Progress</Typography>
                        <Typography variant="caption" fontWeight={700}>{pct}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(89,23,27,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#59171B' } }} />
                    </Box>

                    <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#FFF8F2', border: '1px solid rgba(89,23,27,0.08)', borderRadius: 2, mb: 3 }}>
                      <strong>AI Productivity Tip:</strong> Maintain consistent stitching speed to reduce defect rate and prevent rework.
                    </Typography>

                    {/* Actions */}
                    <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                      {(activeTask.status === 'pending' || activeTask.status === 'rework') && (
                        <Button variant="contained" onClick={() => handleAcceptTask(activeTask._id)} sx={{ bgcolor: '#59171B', '&:hover': { bgcolor: '#7A2328' }, borderRadius: 2, px: 3, py: 1.2 }}>
                          ACCEPT TASK
                        </Button>
                      )}
                      {activeTask.status === 'accepted' && (
                        <Button variant="contained" onClick={() => handleStartTask(activeTask._id)} sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 2, px: 3, py: 1.2 }}>
                          START PRODUCTION
                        </Button>
                      )}
                      {activeTask.status === 'in_progress' && (
                        <>
                          <TextField
                            size="small"
                            placeholder="Enter units completed"
                            value={logQty}
                            onChange={(e) => setLogQty(e.target.value)}
                            sx={{ width: 180 }}
                          />
                          <Button variant="contained" onClick={() => handleLogProgress(activeTask._id)} sx={{ bgcolor: '#59171B', '&:hover': { bgcolor: '#7A2328' }, borderRadius: 2, px: 3 }}>
                            LOG PRODUCTION
                          </Button>
                          <Button variant="outlined" onClick={() => handlePauseTask(activeTask._id)} sx={{ borderColor: 'rgba(89,23,27,0.3)', color: '#59171B', borderRadius: 2, px: 3 }}>
                            PAUSE
                          </Button>
                          <Button variant="contained" color="success" onClick={() => handleCompleteTask(activeTask._id)} sx={{ borderRadius: 2, px: 3 }}>
                            COMPLETE TASK
                          </Button>
                        </>
                      )}
                      {activeTask.status === 'paused' && (
                        <Button variant="contained" onClick={() => handleStartTask(activeTask._id)} sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 2, px: 3 }}>
                          RESUME TASK
                        </Button>
                      )}
                      {activeTask.status === 'quality_check' && (
                        <Typography variant="body2" color="warning.main" fontWeight={700}>
                          Awaiting Quality Control checklist inspection approval...
                        </Typography>
                      )}
                    </Box>

                    {/* Integrated Floor Voice Assistant widget */}
                    <Box sx={{ p: 2, bgcolor: 'rgba(89,23,27,0.03)', borderRadius: 2.5, border: '1px dashed rgba(89,23,27,0.15)' }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <IconButton onClick={handleVoiceTrigger} sx={{ bgcolor: voiceListening ? '#dc2626' : '#59171B', color: '#fff', '&:hover': { bgcolor: voiceListening ? '#b91c1c' : '#7A2328' } }}>
                          <MicIcon />
                        </IconButton>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#59171B">
                            {voiceListening ? 'Listening on factory floor...' : 'Voice Assistant Panel'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Try saying "Start my task", "I completed 100 shirts", or "I need fabric".
                          </Typography>
                        </Box>
                      </Box>
                      {voiceReply && (
                        <Typography variant="body2" sx={{ mt: 1.5, pl: 1, borderLeft: '2px solid #59171B', color: '#59171B', fontWeight: 600 }}>
                          AI Response: "{voiceReply}"
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Today's Tasks */}
            <Card sx={glassCard}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#2C1A1A', fontSize: 17 }}>
                    Today's Tasks
                  </Typography>
                  <Button size="small" onClick={() => navigate('/employee/tasks')}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, color: MAROON, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(89,23,27,0.06)' } }}>
                    View All &rarr;
                  </Button>
                </Box>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 1, borderRadius: 2 }} />)
                ) : tasks.length === 0 ? (
                  <Box textAlign="center" py={3}>
                    <AssignmentIcon sx={{ fontSize: 40, color: BORDER, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#7A6A63' }}>No tasks assigned for today</Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 1.5, textTransform: 'none', borderRadius: 1.5, fontSize: 12, borderColor: BORDER, color: MAROON }}
                      onClick={() => navigate('/employee/tasks')}>Browse Tasks</Button>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', gap: 1, px: 1.5, py: 0.75, bgcolor: CREAM_BG, borderRadius: 1.5, mb: 0.5 }}>
                      {['Task Name', 'Priority', 'Machine', 'Due', 'Status'].map((h) => (
                        <Typography key={h} variant="caption" fontWeight={600} sx={{ color: '#7A6A63', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {h}
                        </Typography>
                      ))}
                    </Box>
                    {tasks.slice(0, 5).map((task) => (
                      <Box key={task._id} sx={{
                        display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', gap: 1,
                        px: 1.5, py: 1, borderRadius: 1.5, transition: 'background 200ms',
                        '&:hover': { bgcolor: CREAM_BG },
                        borderBottom: `1px solid ${BORDER}40`,
                        '&:last-child': { borderBottom: 'none' },
                      }}>
                        <Box minWidth={0}>
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ color: '#2C1A1A', fontSize: 13 }}>
                            {task.title}
                          </Typography>
                        </Box>
                        <Chip label={PRIORITY_LABELS[task.priority] || task.priority} size="small"
                          sx={{
                            height: 22, fontSize: 10, fontWeight: 600, width: 'fit-content',
                            bgcolor: task.priority === 'urgent' ? '#fef2f2' : task.priority === 'high' ? '#fff7ed' : task.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                            color: task.priority === 'urgent' ? '#dc2626' : task.priority === 'high' ? '#ea580c' : task.priority === 'medium' ? '#d97706' : '#16a34a',
                          }} />
                        <Typography variant="caption" sx={{ alignSelf: 'center', fontSize: 12, color: '#7A6A63' }}>
                          L{Math.floor(Math.random() * 8) + 1}
                        </Typography>
                        <Typography variant="caption" sx={{ alignSelf: 'center', fontSize: 12, color: '#7A6A63' }}>
                          {formatDate(task.updatedAt || task.createdAt, 'hh:mm a')}
                        </Typography>
                        <Chip label={task.status?.replace(/_/g, ' ')} size="small"
                          sx={{
                            height: 22, fontSize: 10, fontWeight: 600, textTransform: 'capitalize', width: 'fit-content',
                            bgcolor: `${getStatusColor(task.status)}22`, color: getStatusColor(task.status),
                          }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity + Notifications */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <Card sx={glassCard}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2C1A1A', fontSize: 14, mb: 1.5 }}>
                    Recent Activity
                  </Typography>
                  {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={32} sx={{ mb: 0.5, borderRadius: 1 }} />)
                    : recentIssues.length === 0 && recentLeaves.length === 0 ? (
                      <Box textAlign="center" py={1.5}>
                        <EventBusyIcon sx={{ fontSize: 28, color: BORDER, mb: 0.5 }} />
                        <Typography variant="caption" sx={{ color: '#7A6A63' }}>No recent activity</Typography>
                      </Box>
                    ) : (
                      <Box>
                        {recentIssues.map((issue) => (
                          <Box key={issue._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: `1px solid ${BORDER}40`, '&:last-child': { borderBottom: 'none' } }}>
                            <FlagIcon sx={{ fontSize: 16, color: '#ef4444', flexShrink: 0 }} />
                            <Box minWidth={0} flex={1}>
                              <Typography variant="caption" fontWeight={500} noWrap sx={{ fontSize: 12, color: '#2C1A1A', display: 'block' }}>{issue.description}</Typography>
                              <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 10 }}>{timeAgo(issue.createdAt)}</Typography>
                            </Box>
                            <Chip label={issue.status} size="small" sx={{
                              height: 18, fontSize: 9, fontWeight: 600, textTransform: 'capitalize',
                              bgcolor: issue.status === 'resolved' ? '#dcfce7' : issue.status === 'in_progress' ? '#fef9c3' : '#fee2e2',
                              color: issue.status === 'resolved' ? '#16a34a' : issue.status === 'in_progress' ? '#ca8a04' : '#dc2626',
                            }} />
                          </Box>
                        ))}
                        {recentLeaves.map((leave) => (
                          <Box key={leave._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: `1px solid ${BORDER}40`, '&:last-child': { borderBottom: 'none' } }}>
                            <ExitToAppIcon sx={{ fontSize: 16, color: MAROON, flexShrink: 0 }} />
                            <Box minWidth={0} flex={1}>
                              <Typography variant="caption" fontWeight={500} noWrap sx={{ fontSize: 12, color: '#2C1A1A', display: 'block' }}>{leave.leaveType} leave</Typography>
                              <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 10 }}>{formatDate(leave.startDate)}</Typography>
                            </Box>
                            <Chip label={leave.status} size="small" sx={{
                              height: 18, fontSize: 9, fontWeight: 600, textTransform: 'capitalize',
                              bgcolor: leave.status === 'approved' ? '#dcfce7' : leave.status === 'pending' ? '#fef9c3' : '#fee2e2',
                              color: leave.status === 'approved' ? '#16a34a' : leave.status === 'pending' ? '#ca8a04' : '#dc2626',
                            }} />
                          </Box>
                        ))}
                      </Box>
                    )}
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card sx={glassCard}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2C1A1A', fontSize: 14 }}>
                      Notifications
                    </Typography>
                    <MoreVertIcon sx={{ fontSize: 16, color: '#7A6A63', cursor: 'pointer' }} />
                  </Box>
                  {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={32} sx={{ mb: 0.5, borderRadius: 1 }} />)
                    : (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1, bgcolor: 'rgba(89,23,27,0.04)', borderRadius: 1.5, mb: 0.5 }}>
                          <NotificationsIcon sx={{ fontSize: 16, color: MAROON, flexShrink: 0 }} />
                          <Box minWidth={0} flex={1}>
                            <Typography variant="caption" fontWeight={500} sx={{ fontSize: 11, color: '#2C1A1A', display: 'block' }}>
                              Welcome to the dashboard
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 10 }}>Just now</Typography>
                          </Box>
                        </Box>
                        {tasks.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1, borderRadius: 1.5, mb: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                            <AssignmentIcon sx={{ fontSize: 16, color: '#0891b2', flexShrink: 0 }} />
                            <Box minWidth={0} flex={1}>
                              <Typography variant="caption" fontWeight={500} sx={{ fontSize: 11, color: '#2C1A1A', display: 'block' }}>
                                {tasks.length} task(s) pending
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 10 }}>Today</Typography>
                            </Box>
                          </Box>
                        )}
                        {attendance?.clockIn && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: '#16a34a', flexShrink: 0 }} />
                            <Box minWidth={0} flex={1}>
                              <Typography variant="caption" fontWeight={500} sx={{ fontSize: 11, color: '#2C1A1A', display: 'block' }}>
                                Clocked in at {formatTime12(attendance.clockIn)} {isClockedIn ? `(${workingDuration.formatted})` : ''}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 10 }}>Today</Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* ===== RIGHT (30%) ===== */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Performance */}
            <Card sx={glassCard}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2C1A1A', fontSize: 14 }}>Performance</Typography>
                  <Chip icon={<TrendingUpIcon sx={{ fontSize: 14 }} />} label={`${stats.qualityScore}%`} size="small"
                    sx={{ height: 24, fontSize: 11, fontWeight: 600, bgcolor: 'rgba(89,23,27,0.08)', color: MAROON, borderRadius: 1 }} />
                </Box>
                {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  : <PerformanceChart data={[{ label: 'Performance', data: [65, 70, 75, 72, 80, 85, 82, 88, 90, 87, 92, 95], borderColor: MAROON, backgroundColor: 'rgba(89,23,27,0.06)' }]}
                    labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']} height={200} />}
              </CardContent>
            </Card>

            {/* Attendance Calendar */}
            <Card sx={glassCard}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2C1A1A', fontSize: 14, mb: 1.5 }}>
                  Today's Schedule
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
                    <Typography key={`${d}-${idx}`} variant="caption" fontWeight={600} sx={{ color: '#7A6A63', fontSize: 10, py: 0.5 }}>{d[0]}</Typography>
                  ))}
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    const today = new Date().getDate();
                    return (
                      <Box key={i} sx={{
                        width: 28, height: 28, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 1, fontSize: 11, fontWeight: day === today ? 700 : 400,
                        bgcolor: day === today ? MAROON : 'transparent',
                        color: day === today ? CREAM : '#2C1A1A',
                        transition: 'background 200ms',
                        '&:hover': day !== today ? { bgcolor: CREAM_BG } : {},
                      }}>{day}</Box>
                    );
                  })}
                </Box>
                <Box display="flex" gap={1.5} mt={1.5} pt={1.5} sx={{ borderTop: `1px solid ${BORDER}` }}>
                  {[
                    { color: '#16a34a', label: 'Present' },
                    { color: '#fbbf24', label: 'Half-day' },
                    { color: '#ef4444', label: 'Absent' },
                  ].map((s) => (
                    <Box key={s.label} display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                      <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 10 }}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card sx={glassCard}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2C1A1A', fontSize: 14, mb: 1.5 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {QUICK_ACTIONS.map((a) => (
                    <Box
                      key={a.label}
                      onClick={() => {
                        if (a.isProfile) setProfileModalOpen(true);
                        else if (a.voice) window.voiceAssistant?.toggle?.();
                        else if (a.path) navigate(a.path);
                      }}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1,
                        borderRadius: 1.5, cursor: 'pointer',
                        bgcolor: a.voice ? 'transparent' : `${a.color}06`,
                        border: a.voice ? `1px dashed ${BORDER}` : 'none',
                        transition: 'all 200ms ease',
                        '&:hover': { bgcolor: `${a.color}12`, transform: 'translateY(-1px)' },
                      }}>
                      <Box sx={{ color: a.color, display: 'flex' }}>{React.cloneElement(a.icon, { sx: { fontSize: 18 } })}</Box>
                      <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11, color: '#2C1A1A' }}>{a.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </motion.div>
      <ProfileSettingsModal
        open={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          fetchDashboardData();
        }}
      />
    </Box>
  );
}
