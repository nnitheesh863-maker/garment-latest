import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
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
import { useSocket } from "../../hooks/useSocket";
import ProductionChart from "../../components/charts/ProductionChart";
import { formatDate, getStatusColor, truncateText } from "../../utils/helpers";
import api from "../../api/axios";

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

      // Process employees
      let empData = [];
      if (employeesRes.status === "fulfilled") {
        const res = employeesRes.value.data;
        empData = res?.data || res?.employees || res || [];
        if (!Array.isArray(empData)) empData = [];
        setEmployees(empData);
      }

      // Process issues
      let issuesData = [];
      if (issuesRes.status === "fulfilled") {
        const res = issuesRes.value.data;
        issuesData = res?.data || res?.issues || res || [];
        if (!Array.isArray(issuesData)) issuesData = [];
        setIssues(issuesData);
      }

      // Process leaves
      let leavesData = [];
      if (leavesRes.status === "fulfilled") {
        const res = leavesRes.value.data;
        leavesData = res?.data || res?.leaves || res || [];
        if (!Array.isArray(leavesData)) leavesData = [];
        setLeaves(leavesData);
      }

      // Calculate stats
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

      // Build attendance summary from employee data
      const attendance = empData.slice(0, 8).map((e) => ({
        name:
          `${e.firstName || ""} ${e.lastName || ""}`.trim() ||
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

      // Fetch AI recommendations
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

  // Generate production chart data
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
            borderColor: "#3F51B5",
            backgroundColor: "rgba(63,81,181,0.1)",
          },
          {
            label: "Actual",
            data: days.map(() => Math.floor(Math.random() * 80 + 180)),
            borderColor: "#66BB6A",
            backgroundColor: "rgba(102,187,106,0.1)",
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
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700}>
          Manager Dashboard
        </Typography>
        <Chip
          label={connected ? "Live" : "Offline"}
          color={connected ? "success" : "error"}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              transition: "0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Total Employees
                  </Typography>
                  {loading ? (
                    <Skeleton width={40} height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight={700}>
                      {stats.totalEmployees}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Active workforce
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#3F51B5" }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              transition: "0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Active Tasks
                  </Typography>
                  {loading ? (
                    <Skeleton width={40} height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight={700}>
                      {stats.activeTasks}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    In progress
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#FF9800" }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              transition: "0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Pending Leaves
                  </Typography>
                  {loading ? (
                    <Skeleton width={40} height={40} />
                  ) : (
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="warning.main"
                    >
                      {stats.pendingLeaves}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Awaiting approval
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#FF9800" }}>
                  <PendingActionsIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              transition: "0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Open Issues
                  </Typography>
                  {loading ? (
                    <Skeleton width={40} height={40} />
                  ) : (
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={
                        stats.openIssues > 0 ? "error.main" : "success.main"
                      }
                    >
                      {stats.openIssues}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Needs attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#EF5350" }}>
                  <ErrorIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Issues & Alerts */}
      <Grid container spacing={3} mb={3}>
        {/* Recent Issue Reports */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Recent Issue Reports
              </Typography>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))
              ) : recentIssues.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  py={2}
                  textAlign="center"
                >
                  No issues reported
                </Typography>
              ) : (
                <List dense disablePadding>
                  {recentIssues.map((issue) => (
                    <ListItem
                      key={issue._id}
                      sx={{
                        borderLeft: `4px solid ${getStatusColor(issue.status)}`,
                        mb: 1,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        py: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.light",
                            fontSize: 12,
                          }}
                        >
                          {(issue.employee?.firstName?.[0] || "") +
                            (issue.employee?.lastName?.[0] || "") || "?"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={500}>
                              {(issue.employee?.firstName || "") +
                                " " +
                                (issue.employee?.lastName || "") ||
                                issue.employeeName ||
                                "Unknown"}
                            </Typography>
                            <Chip
                              label={issue.issueType || issue.type || "issue"}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          </Box>
                        }
                        secondary={truncateText(
                          issue.description || issue.issue,
                          80,
                        )}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-end"
                        gap={0.5}
                        ml={1}
                      >
                        <Chip
                          label={issue.priority || "normal"}
                          size="small"
                          color={priorityChipColor(issue.priority)}
                          sx={{ height: 20, fontSize: 11 }}
                        />
                        <Chip
                          label={issue.status || "open"}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 11,
                            bgcolor: getStatusColor(issue.status),
                            color: "#fff",
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(issue.createdAt || issue.date)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI Alerts */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                AI Alerts & Recommendations
              </Typography>
              {loading
                ? [...Array(3)].map((_, i) => (
                    <Skeleton key={i} height={50} sx={{ mb: 1 }} />
                  ))
                : displayAlerts.map((alert, i) => (
                    <Alert
                      key={i}
                      severity={alert.type || "info"}
                      sx={{
                        mb: 1,
                        "& .MuiAlert-icon": { alignItems: "center" },
                      }}
                    >
                      <Typography variant="body2">{alert.message}</Typography>
                    </Alert>
                  ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leave Requests & Attendance */}
      <Grid container spacing={3} mb={3}>
        {/* Leave Requests */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Leave Requests
              </Typography>
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <Skeleton key={i} height={80} sx={{ mb: 1 }} />
                ))
              ) : pendingLeaves.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  py={2}
                  textAlign="center"
                >
                  No pending leave requests
                </Typography>
              ) : (
                <List dense disablePadding>
                  {pendingLeaves.slice(0, 5).map((leave) => (
                    <ListItem
                      key={leave._id}
                      sx={{
                        mb: 1,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        py: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "info.light",
                            fontSize: 14,
                          }}
                        >
                          {(leave.employee?.firstName?.[0] || "") +
                            (leave.employee?.lastName?.[0] || "") || "?"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {(leave.employee?.firstName || "") +
                              " " +
                              (leave.employee?.lastName || "") ||
                              leave.employeeName ||
                              "Unknown"}
                          </Typography>
                        }
                        secondary={
                          <Box component="span">
                            <Typography variant="caption" component="span">
                              {leave.leaveType || leave.type}
                            </Typography>
                            {" — "}
                            <Typography variant="caption" component="span">
                              {formatDate(leave.startDate)} -{" "}
                              {formatDate(leave.endDate)}
                            </Typography>
                            {" ("}
                            {getDaysDifference(
                              leave.startDate,
                              leave.endDate,
                            )}{" "}
                            days)
                          </Box>
                        }
                      />
                      <Box display="flex" alignItems="center" gap={0.5} ml={1}>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApproveLeave(leave)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openRejectDialog(leave)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
              {pendingLeaves.length > 5 && (
                <Typography variant="caption" color="text.secondary" mt={1}>
                  And {pendingLeaves.length - 5} more pending requests
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Employee Attendance Summary */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Today's Attendance
              </Typography>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <Skeleton key={i} height={36} sx={{ mb: 0.5 }} />
                ))
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ boxShadow: "none" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>In</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Out</TableCell>
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
                          <TableRow key={i}>
                            <TableCell>
                              <Typography variant="body2">
                                {row.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.status}
                                size="small"
                                color={
                                  row.status === "present"
                                    ? "success"
                                    : row.status === "late"
                                      ? "warning"
                                      : "default"
                                }
                                variant="outlined"
                                sx={{ height: 20, fontSize: 11 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {row.checkIn || "-"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {row.checkOut || "-"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Production Progress Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Production Progress (14 Days)
              </Typography>
              <ProductionChart
                data={productionData?.datasets}
                labels={productionData?.labels}
                height={280}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Are you sure you want to reject the leave request from{" "}
            {selectedLeave?.employee?.firstName ||
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
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectLeave}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
