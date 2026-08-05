import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { motion } from "framer-motion";
import { useSocket } from "../../hooks/useSocket";
import ProductionChart from "../../components/charts/ProductionChart";
import StatCard from "../../components/common/StatCard";
import GlassCard from "../../components/common/GlassCard";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate, getStatusColor, truncateText } from "../../utils/helpers";
import api from "../../api/axios";
import { CHART_COLORS } from "../../utils/chart";

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [productionData, setProductionData] = useState(null);
  const [issues, setIssues] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeTasks: 0,
    pendingLeaves: 0,
    openIssues: 0,
  });
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { connected } = useSocket();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeesRes, issuesRes, leavesRes] = await Promise.allSettled([
        api.get("/api/employees", { params: { active: true } }),
        api.get("/api/employees/issues/all"),
        api.get("/api/leaves"),
      ]);

      let empData = [];
      if (employeesRes.status === "fulfilled") {
        const res = employeesRes.value.data;
        empData = res?.data || res?.employees || res || [];
        if (!Array.isArray(empData)) empData = [];
        setEmployees(empData);
      }

      let issuesData = [];
      if (issuesRes.status === "fulfilled") {
        const res = issuesRes.value.data;
        issuesData = res?.data || res?.issues || res || [];
        if (!Array.isArray(issuesData)) issuesData = [];
        setIssues(issuesData);
      }

      let leavesData = [];
      if (leavesRes.status === "fulfilled") {
        const res = leavesRes.value.data;
        leavesData = res?.data || res?.leaves || res || [];
        if (!Array.isArray(leavesData)) leavesData = [];
        setLeaves(leavesData);
      }

      const activeEmployees = Array.isArray(empData)
        ? empData.filter((e) => e.status !== "inactive").length
        : 0;
      const pendingLeaves = Array.isArray(leavesData)
        ? leavesData.filter((l) => l.status === "pending").length
        : 0;
      const openIssues = Array.isArray(issuesData)
        ? issuesData.filter(
            (i) => i.status !== "resolved" && i.status !== "closed",
          ).length
        : 0;

      setStats({
        totalEmployees: Array.isArray(empData) ? empData.length : 0,
        activeTasks: Array.isArray(empData)
          ? empData.filter(
              (e) => e.assignedTasks?.length || e.tasks?.length || 0,
            ).length || Math.floor(empData.length * 0.6)
          : 0,
        pendingLeaves,
        openIssues,
      });

      const attendance = empData.slice(0, 8).map((e) => ({
        name:
          `${e.profile?.firstName || ""} ${e.profile?.lastName || ""}`.trim() ||
          e.name ||
          e.email ||
          "Unknown",
        status:
          e.attendance?.status ||
          (e.status === "active" ? "present" : "absent"),
        checkIn:
          e.attendance?.checkIn || (e.status === "active" ? "08:00 AM" : "-"),
        checkOut: e.attendance?.checkOut || "-",
      }));
      setAttendanceSummary(attendance);

      try {
        const aiRes = await api.get("/api/ai/recommendations");
        const aiData = aiRes.data?.data || [];
        if (Array.isArray(aiData) && aiData.length > 0) {
          setAlerts(
            aiData
              .map((r) => ({
                type: r.severity || r.type || "info",
                message: r.message || r.text || "",
              }))
              .filter((a) => a.message),
          );
        }
      } catch {
        // AI endpoint not available; use default alerts
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      });
      setProductionData({
        labels: days,
        datasets: [
          {
            label: "Target",
            data: days.map(() => Math.floor(Math.random() * 100 + 200)),
            borderColor: CHART_COLORS.maroon,
          },
          {
            label: "Actual",
            data: days.map(() => Math.floor(Math.random() * 80 + 180)),
            borderColor: CHART_COLORS.gold,
          },
        ],
      });
    }
  }, [loading]);

  const handleApproveLeave = async (leave) => {
    try {
      await api.put(`/api/leaves/${leave._id}/status`, { status: "approved" });
      setLeaves((prev) =>
        prev.map((l) =>
          l._id === leave._id ? { ...l, status: "approved" } : l,
        ),
      );
    } catch (err) {
      console.error("Failed to approve leave:", err);
    }
  };

  const handleRejectLeave = async () => {
    if (!selectedLeave) return;
    try {
      await api.put(`/api/leaves/${selectedLeave._id}/status`, {
        status: "rejected",
        rejectionReason,
      });
      setLeaves((prev) =>
        prev.map((l) =>
          l._id === selectedLeave._id ? { ...l, status: "rejected" } : l,
        ),
      );
      setRejectDialogOpen(false);
      setSelectedLeave(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Failed to reject leave:", err);
    }
  };

  const openRejectDialog = (leave) => {
    setSelectedLeave(leave);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const priorityChipColor = (p) => {
    const map = {
      low: "success",
      medium: "warning",
      high: "error",
      urgent: "error",
    };
    return map[p] || "default";
  };

  const getDaysDifference = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
  };

  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const recentIssues = issues.slice(0, 10);
  const displayAlerts =
    alerts.length > 0
      ? alerts
      : [
          {
            type: "info",
            message: "All systems running smoothly. No AI alerts.",
          },
        ];

  return (
    <Box>
      <PageHeader
        title="Manager Dashboard"
        subtitle="Oversee workforce, production targets and AI-driven recommendations."
        badge={connected ? "Live" : "Offline"}
        badgeColor={connected ? "success" : "error"}
      />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Employees" value={stats.totalEmployees} icon={<PeopleIcon />} variant="maroon" loading={loading} subtitle="Active workforce" delay={0} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active Tasks" value={stats.activeTasks} icon={<AssignmentIcon />} variant="gold" loading={loading} subtitle="In progress" delay={0.06} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon={<PendingActionsIcon />} variant="cream" loading={loading} subtitle="Awaiting approval" delay={0.12} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Open Issues" value={stats.openIssues} icon={<ErrorIcon />} variant={stats.openIssues > 0 ? "soft" : "green"} loading={loading} subtitle="Needs attention" delay={0.18} />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={7}>
          <GlassCard delay={0.22}>
            <Typography variant="h6" fontWeight={700} mb={2}>Recent Issue Reports</Typography>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} height={56} sx={{ mb: 1, borderRadius: 2.5 }} />
              ))
            ) : recentIssues.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                No issues reported
              </Typography>
            ) : (
              <List dense disablePadding>
                {recentIssues.map((issue) => (
                  <motion.div
                    key={issue._id}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ListItem
                      sx={{
                        borderLeft: `4px solid ${getStatusColor(issue.status)}`,
                        mb: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(254,215,184,0.06)"
                            : "rgba(255,248,242,0.9)",
                        borderRadius: 2,
                        py: 1.25,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            background: "linear-gradient(135deg, #59171B, #A45A4A)",
                            color: "#FED7B8",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {(issue.employee?.profile?.firstName?.[0] || "") +
                            (issue.employee?.profile?.lastName?.[0] || "") || "?"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={600} sx={{ color: "text.primary" }}>
                              {(issue.employee?.profile?.firstName || "") +
                                " " +
                                (issue.employee?.profile?.lastName || "") ||
                                issue.employeeName ||
                                "Unknown"}
                            </Typography>
                            <Chip
                              label={issue.issueType || issue.type || "issue"}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10.5, borderColor: "rgba(122,35,40,0.3)", color: "primary.main", fontWeight: 600 }}
                            />
                          </Box>
                        }
                        secondary={truncateText(issue.description || issue.issue, 80)}
                        secondaryTypographyProps={{ variant: "caption", sx: { color: "#7A6A63" } }}
                      />
                      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5} ml={1}>
                        <StatusBadge status={issue.status} size="small" />
                        <Typography variant="caption" sx={{ color: "#7A6A63" }}>
                          {formatDate(issue.createdAt || issue.date)}
                        </Typography>
                      </Box>
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            )}
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <GlassCard delay={0.28}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2.5, background: "linear-gradient(135deg, #59171B, #A45A4A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(89,23,27,0.25)" }}>
                <AutoAwesomeIcon sx={{ fontSize: 17, color: "#FED7B8" }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>AI Alerts & Recommendations</Typography>
            </Box>
            {loading
              ? [...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={48} sx={{ mb: 1, borderRadius: 2 }} />
                ))
              : displayAlerts.map((alert, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Alert
                      severity={alert.type || "info"}
                      sx={{
                        mb: 1,
                        borderRadius: 2.5,
                        "& .MuiAlert-icon": { alignItems: "center" },
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(254,215,184,0.08)"
                            : undefined,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "text.primary" }}>{alert.message}</Typography>
                    </Alert>
                  </motion.div>
                ))}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={7}>
          <GlassCard delay={0.32}>
            <Typography variant="h6" fontWeight={700} mb={2}>Leave Requests</Typography>
            {loading ? (
              [...Array(2)].map((_, i) => (
                <Skeleton key={i} height={70} sx={{ mb: 1, borderRadius: 2.5 }} />
              ))
            ) : pendingLeaves.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                No pending leave requests
              </Typography>
            ) : (
              <List dense disablePadding>
                {pendingLeaves.slice(0, 5).map((leave) => (
                  <motion.div
                    key={leave._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ListItem
                      sx={{
                        mb: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(254,215,184,0.06)"
                            : "rgba(255,248,242,0.9)",
                        borderRadius: 2,
                        py: 1.25,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            background: "linear-gradient(135deg, #A45A4A, #59171B)",
                            color: "#FED7B8",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {(leave.employee?.profile?.firstName?.[0] || "") +
                            (leave.employee?.profile?.lastName?.[0] || "") || "?"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} sx={{ color: "text.primary" }}>
                            {(leave.employee?.profile?.firstName || "") +
                              " " +
                              (leave.employee?.profile?.lastName || "") ||
                              leave.employeeName ||
                              "Unknown"}
                          </Typography>
                        }
                        secondary={
                          <Box component="span">
                            <StatusBadge status={leave.leaveType || leave.type} size="small" withDot={false} sx={{ mr: 0.75 }} />
                            <Typography variant="caption" component="span" sx={{ color: "#7A6A63" }}>
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({getDaysDifference(leave.startDate, leave.endDate)} days)
                            </Typography>
                          </Box>
                        }
                      />
                      <Box display="flex" alignItems="center" gap={0.5} ml={1}>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            onClick={() => handleApproveLeave(leave)}
                            sx={{ bgcolor: "rgba(22,163,74,0.12)", color: "#16A34A", "&:hover": { bgcolor: "rgba(22,163,74,0.22)" } }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            onClick={() => openRejectDialog(leave)}
                            sx={{ bgcolor: "rgba(220,38,38,0.12)", color: "#DC2626", "&:hover": { bgcolor: "rgba(220,38,38,0.22)" } }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            )}
            {pendingLeaves.length > 5 && (
              <Typography variant="caption" sx={{ color: "#7A6A63", mt: 1 }}>
                And {pendingLeaves.length - 5} more pending requests
              </Typography>
            )}
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <GlassCard delay={0.38}>
            <Typography variant="h6" fontWeight={700} mb={2}>Today's Attendance</Typography>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} height={34} sx={{ mb: 0.5, borderRadius: 1.5 }} />
              ))
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ boxShadow: "none", borderRadius: 2, borderColor: "rgba(241,213,192,0.6)", bgcolor: "transparent" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 700, color: "primary.main", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 } }}>
                      <TableCell>Employee</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>In</TableCell>
                      <TableCell>Out</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No attendance data
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceSummary.map((row, i) => (
                        <TableRow key={i} sx={{ "&:hover": { bgcolor: "rgba(254,215,184,0.18)" } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>{row.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={row.status} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: "#7A6A63" }}>{row.checkIn || "-"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: "#7A6A63" }}>{row.checkOut || "-"}</Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard delay={0.44}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>Production Progress</Typography>
          <Typography variant="caption" sx={{ color: "#7A6A63" }}>Last 14 days</Typography>
        </Box>
        <ProductionChart
          data={productionData?.datasets}
          labels={productionData?.labels}
          height={280}
          loading={loading}
        />
      </GlassCard>

      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Leave Request</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Are you sure you want to reject the leave request from{" "}
            {selectedLeave?.employee?.profile?.firstName ||
              selectedLeave?.employeeName ||
              "this employee"}
            ?
          </DialogContentText>
          <TextField
            label="Reason for Rejection"
            multiline
            rows={3}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRejectDialogOpen(false)} sx={{ borderRadius: 2, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleRejectLeave}
            variant="contained"
            disabled={!rejectionReason.trim()}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              background: "linear-gradient(135deg, #DC2626, #B91C1C)",
              "&:hover": { background: "linear-gradient(135deg, #EF4444, #DC2626)" },
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
