import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import EditIcon from "@mui/icons-material/Edit";
import TimerIcon from "@mui/icons-material/Timer";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import BlockIcon from "@mui/icons-material/Block";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import api from "../../api/axios";
import {
  formatDate,
  formatTime12,
  formatHoursMinutes,
  getWorkingDuration,
} from "../../utils/helpers";
import GradientButton from "../common/GradientButton";

const MAROON = "#59171B";
const CREAM_BG = "#FFF8F2";
const BORDER = "#F1D5C0";

export default function EmployeeDetailModal({
  open,
  onClose,
  user: initialUser,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);

  const userId = initialUser?._id || initialUser?.id;

  useEffect(() => {
    if (!open || !userId) {
      setEmployeeDetails(null);
      setAttendanceRecords([]);
      setTodayAttendance(null);
      setTasks([]);
      setPerformanceStats(null);
      setTabIndex(0);
      return;
    }

    let isMounted = true;
    const fetchAllDetails = async () => {
      setLoading(true);
      try {
        const [empRes, attRes, tasksRes, perfRes] = await Promise.allSettled([
          api.get(`/api/employees/${userId}`),
          api.get(`/api/employees/${userId}/attendance`),
          api.get(`/api/employees/${userId}/tasks`),
          api.get(`/api/employees/${userId}/performance`),
        ]);

        if (!isMounted) return;

        if (empRes.status === "fulfilled") {
          setEmployeeDetails(empRes.value.data?.data || empRes.value.data || initialUser);
        } else {
          setEmployeeDetails(initialUser);
        }

        if (attRes.status === "fulfilled") {
          const records =
            attRes.value.data?.data ||
            attRes.value.data?.attendance ||
            attRes.value.data ||
            [];
          const list = Array.isArray(records) ? records : [];
          setAttendanceRecords(list);

          const today = list.find(
            (r) =>
              new Date(r.date).toDateString() === new Date().toDateString()
          );
          setTodayAttendance(today || null);
        }

        if (tasksRes.status === "fulfilled") {
          const tList =
            tasksRes.value.data?.data ||
            tasksRes.value.data?.tasks ||
            tasksRes.value.data ||
            [];
          setTasks(Array.isArray(tList) ? tList : []);
        }

        if (perfRes.status === "fulfilled") {
          setPerformanceStats(perfRes.value.data?.data || null);
        }
      } catch (err) {
        console.error("Failed to fetch employee details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllDetails();

    return () => {
      isMounted = false;
    };
  }, [open, userId, initialUser]);

  if (!initialUser && !employeeDetails) return null;

  const currentEmp = employeeDetails || initialUser;
  const firstName =
    currentEmp?.firstName ||
    currentEmp?.profile?.firstName ||
    "";
  const lastName =
    currentEmp?.lastName ||
    currentEmp?.profile?.lastName ||
    "";
  const fullName = `${firstName} ${lastName}`.trim() || currentEmp?.email || "Employee";
  const role = currentEmp?.role || "employee";
  const status = currentEmp?.status || "active";
  const department =
    currentEmp?.department ||
    currentEmp?.profile?.department ||
    "-";
  const position =
    currentEmp?.position ||
    currentEmp?.designation ||
    currentEmp?.profile?.position ||
    "Staff";
  const email = currentEmp?.email || "-";
  const phone =
    currentEmp?.phone ||
    currentEmp?.phoneNumber ||
    currentEmp?.profile?.phoneNumber ||
    "-";
  const joinedDate = currentEmp?.createdAt
    ? formatDate(currentEmp.createdAt)
    : "-";

  const isClockedIn = Boolean(
    todayAttendance?.clockIn && !todayAttendance?.clockOut
  );
  const todayDuration = getWorkingDuration(
    todayAttendance?.clockIn,
    todayAttendance?.clockOut,
    todayAttendance?.workingHours
  );
  const profileImage = currentEmp?.profile?.profileImage || currentEmp?.profileImage;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
        },
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #59171B 0%, #7A2328 60%, #A45A4A 100%)",
          color: "#fff",
          p: 3,
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "rgba(255,255,255,0.85)",
            "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.15)" },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box display="flex" alignItems="center" gap={2.5} flexWrap="wrap">
          <Avatar
            src={profileImage || undefined}
            sx={{
              width: 72,
              height: 72,
              bgcolor: "rgba(254,215,184,0.3)",
              color: "#FED7B8",
              fontSize: 26,
              fontWeight: 700,
              border: "2px solid rgba(254,215,184,0.6)",
            }}
          >
            {(firstName[0] || "") + (lastName[0] || "")}
          </Avatar>
          <Box flex={1} minWidth={200}>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Typography variant="h5" fontWeight={700}>
                {fullName}
              </Typography>
              <Chip
                label={role.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 11,
                }}
              />
              <Chip
                label={status.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: status === "active" ? "#16a34a" : "#dc2626",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 11,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              {position} &bull; {department} Department
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75, display: "block", mt: 0.25 }}>
              Member since {joinedDate}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Profile & Attendance" sx={{ fontWeight: 600 }} />
          <Tab label={`Assigned Tasks (${tasks.length})`} sx={{ fontWeight: 600 }} />
          <Tab label="Performance & Quality" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            {/* Tab 0: Profile & Attendance */}
            {tabIndex === 0 && (
              <Grid container spacing={3}>
                {/* Today's Live Attendance Status Card */}
                <Grid item xs={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      borderColor: isClockedIn ? "#86efac" : BORDER,
                      bgcolor: isClockedIn ? "rgba(240,253,244,0.6)" : CREAM_BG,
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1.5}
                        flexWrap="wrap"
                        gap={1}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon
                            sx={{
                              color: isClockedIn ? "success.main" : MAROON,
                              fontSize: 22,
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight={700}>
                            Today's Attendance Status
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            isClockedIn
                              ? "Currently Working"
                              : todayAttendance?.clockOut
                              ? "Clocked Out"
                              : "Not Clocked In Today"
                          }
                          color={
                            isClockedIn
                              ? "success"
                              : todayAttendance?.clockOut
                              ? "primary"
                              : "default"
                          }
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Clock In (12h)
                          </Typography>
                          <Typography variant="body1" fontWeight={600} color="primary.main">
                            {formatTime12(
                              todayAttendance?.clockIn || todayAttendance?.clockInTime
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Clock Out (12h)
                          </Typography>
                          <Typography variant="body1" fontWeight={600} color="secondary.main">
                            {formatTime12(
                              todayAttendance?.clockOut || todayAttendance?.clockOutTime
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Working Duration
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="success.dark">
                            {todayAttendance?.clockIn
                              ? todayDuration.detailed
                              : "-"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Shift / Timezone
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {todayAttendance?.shift || "General"} ({todayAttendance?.timezone || "IST"})
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Personal & Employment Info */}
                <Grid item xs={12} md={5}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, height: "100%" }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">
                        EMPLOYEE INFORMATION
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <EmailIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Email
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <PhoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Phone
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {phone}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <BusinessIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Department
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {department}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <BadgeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Designation / Line
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {position} {currentEmp?.assignedLine?.name ? `(${currentEmp.assignedLine.name})` : ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recent Attendance Log (12-hour formatted) */}
                <Grid item xs={12} md={7}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, height: "100%" }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">
                        RECENT ATTENDANCE LOG (12-HOUR FORMAT)
                      </Typography>
                      {attendanceRecords.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" py={2}>
                          No attendance records found.
                        </Typography>
                      ) : (
                        <TableContainer sx={{ maxHeight: 240 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Clock In</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Clock Out</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {attendanceRecords.slice(0, 8).map((a) => {
                                const rowHours =
                                  a.workingHours != null && a.workingHours > 0
                                    ? formatHoursMinutes(a.workingHours, "short")
                                    : a.clockIn && a.clockOut
                                    ? getWorkingDuration(a.clockIn, a.clockOut).formatted
                                    : "-";
                                return (
                                  <TableRow key={a._id || a.date}>
                                    <TableCell>{formatDate(a.date, "MMM dd")}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={a.status || "present"}
                                        size="small"
                                        color={
                                          a.status === "present" || a.status === "working"
                                            ? "success"
                                            : a.status === "absent"
                                            ? "error"
                                            : "warning"
                                        }
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: 10 }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                      {formatTime12(a.clockIn || a.clockInTime)}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                      {formatTime12(a.clockOut || a.clockOutTime)}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                                      {rowHours}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Tab 1: Assigned Tasks */}
            {tabIndex === 1 && (
              <Box>
                {tasks.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <AssignmentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No tasks assigned to this employee yet.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Task / Order</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Stage / Machine</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Target</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Produced</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Quality</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tasks.map((t) => (
                          <TableRow key={t._id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {t.title || t.orderId?.orderNumber || "Task"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(t.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {t.machineId?.name || t.stage || "-"}
                            </TableCell>
                            <TableCell>{t.quantity?.target || t.quantityTarget || 0}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: "success.main" }}>
                              {t.quantity?.produced || t.quantityCompleted || 0}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={t.status || "pending"}
                                size="small"
                                color={
                                  t.status === "completed"
                                    ? "success"
                                    : t.status === "in_progress"
                                    ? "primary"
                                    : "default"
                                }
                                sx={{ height: 22, fontSize: 11 }}
                              />
                            </TableCell>
                            <TableCell>
                              {t.qualityGrade ? (
                                <Chip
                                  label={`Grade ${t.qualityGrade}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: 10 }}
                                />
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* Tab 2: Performance & Stats */}
            {tabIndex === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: "center", p: 2 }}>
                    <Typography variant="h3" fontWeight={700} color="primary.main">
                      {performanceStats?.completionRate || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Task Completion Rate
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: "center", p: 2 }}>
                    <Typography variant="h3" fontWeight={700} color="success.main">
                      {performanceStats?.qualityRate || 100}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Quality Pass Rate
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: "center", p: 2 }}>
                    <Typography variant="h3" fontWeight={700} color="secondary.main">
                      {tasks.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Total Assigned Tasks
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                      Production Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Total Target Units</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {performanceStats?.taskStats?.totalTarget || tasks.reduce((s, t) => s + (t.quantity?.target || 0), 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Total Produced Units</Typography>
                        <Typography variant="h6" fontWeight={600} color="success.main">
                          {performanceStats?.taskStats?.totalProduced || tasks.reduce((s, t) => s + (t.quantity?.produced || 0), 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Total Rejected Units</Typography>
                        <Typography variant="h6" fontWeight={600} color="error.main">
                          {performanceStats?.taskStats?.totalRejected || tasks.reduce((s, t) => s + (t.quantity?.rejected || 0), 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Total Attendance Records</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {attendanceRecords.length} days
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: CREAM_BG, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box display="flex" gap={1} flexWrap="wrap">
          {onEdit && (
            <GradientButton
              variant="maroon"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit(currentEmp)}
              sx={{ px: 2, py: 0.6 }}
            >
              Edit User
            </GradientButton>
          )}
          {onToggleStatus && (
            <Button
              variant="outlined"
              size="small"
              startIcon={status === "active" ? <BlockIcon /> : <CheckCircleIcon />}
              onClick={() => onToggleStatus(currentEmp)}
              color={status === "active" ? "warning" : "success"}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {status === "active" ? "Disable User" : "Enable User"}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DeleteForeverIcon />}
              onClick={() => onDelete(currentEmp)}
              color="error"
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Delete User
            </Button>
          )}
        </Box>
        <Button variant="outlined" onClick={onClose} color="inherit" sx={{ minWidth: 90, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
