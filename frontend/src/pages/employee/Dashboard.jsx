import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Avatar,
  Skeleton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FlagIcon from "@mui/icons-material/Flag";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
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
      // Fallback to empty state on error
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate dashboard stats from real data
  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTasks = tasks.filter((t) => {
      if (!t.updatedAt) return false;
      const d = new Date(t.updatedAt);
      return d >= todayStart;
    });
    const completedToday = todayTasks.filter(
      (t) => t.status === "completed",
    ).length;

    const qualityScore =
      tasks.length > 0
        ? Math.round(
            (tasks.filter((t) => t.status === "completed").length /
              tasks.length) *
              100,
          )
        : 0;

    setStats({
      completedToday,
      hoursWorked: attendance?.hoursWorked || attendance?.totalHours || 0,
      qualityScore,
    });
  }, [tasks, attendance]);

  const isClockedIn = attendance?.clockIn && !attendance?.clockOut;

  const recentIssues = issues.slice(0, 3);
  const recentLeaves = leaves.slice(0, 3);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Welcome back, {user?.profile?.firstName || user?.firstName || "Employee"}!
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {formatDate(new Date(), "EEEE, MMMM do, yyyy")}
      </Typography>

      {/* Attendance Status */}
      {!loading && attendance && (
        <Card sx={{ mb: 3, bgcolor: isClockedIn ? "#E8F5E9" : "#FFF3E0" }}>
          <CardContent
            sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}
          >
            <AccessTimeIcon color={isClockedIn ? "success" : "warning"} />
            <Typography variant="body1" fontWeight={500}>
              {isClockedIn
                ? `Clocked in at ${formatDate(attendance.clockIn, "hh:mm a")}`
                : attendance.clockOut
                  ? `Last clocked out at ${formatDate(attendance.clockOut, "hh:mm a")}`
                  : "Not clocked in today"}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#66BB6A", width: 48, height: 48 }}>
                <CheckCircleIcon />
              </Avatar>
              <Box>
                {loading ? (
                  <Skeleton width={60} height={36} />
                ) : (
                  <Typography variant="h4" fontWeight={700}>
                    {stats.completedToday}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Tasks Completed Today
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#FF9800", width: 48, height: 48 }}>
                <AccessTimeIcon />
              </Avatar>
              <Box>
                {loading ? (
                  <Skeleton width={60} height={36} />
                ) : (
                  <Typography variant="h4" fontWeight={700}>
                    {stats.hoursWorked}h
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Hours Worked
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#3F51B5", width: 48, height: 48 }}>
                <StarIcon />
              </Avatar>
              <Box>
                {loading ? (
                  <Skeleton width={60} height={36} />
                ) : (
                  <Typography variant="h4" fontWeight={700}>
                    {stats.qualityScore}%
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Quality Score
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" fontWeight={600}>
                  Today's Tasks
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate("/employee/tasks")}
                >
                  View All
                </Button>
              </Box>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))
              ) : tasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary" py={2}>
                  No tasks for today
                </Typography>
              ) : (
                <List dense disablePadding>
                  {tasks.slice(0, 5).map((task) => (
                    <ListItem
                      key={task._id}
                      sx={{
                        borderLeft: `4px solid ${getStatusColor(task.priority)}`,
                        mb: 1,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        display: "block",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <ListItemText
                          primary={task.title}
                          secondary={`${task.quantityCompleted || 0}/${task.quantityTarget || 0} units`}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 500,
                          }}
                        />
                        <Chip
                          label={task.status?.replace(/_/g, " ")}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(task.status),
                            color: "#fff",
                            ml: 1,
                          }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={calculateProgress(
                          task.quantityTarget,
                          task.quantityCompleted,
                        )}
                        sx={{ height: 5, borderRadius: 3, mt: 1 }}
                        color={
                          calculateProgress(
                            task.quantityTarget,
                            task.quantityCompleted,
                          ) >= 75
                            ? "success"
                            : "primary"
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Recent Issues & Leave Requests */}
          {!loading && (recentIssues.length > 0 || recentLeaves.length > 0) && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Recent Activity
                </Typography>
                {recentIssues.length > 0 && (
                  <Box mb={recentLeaves.length > 0 ? 2 : 0}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      mb={1}
                    >
                      Recent Issues
                    </Typography>
                    <List dense disablePadding>
                      {recentIssues.map((issue) => (
                        <ListItem key={issue._id} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FlagIcon fontSize="small" color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary={issue.description}
                            secondary={timeAgo(issue.createdAt)}
                            primaryTypographyProps={{
                              variant: "body2",
                              noWrap: true,
                            }}
                          />
                          <Chip
                            label={issue.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(issue.status),
                              color: "#fff",
                              fontSize: 11,
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                {recentLeaves.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      mb={1}
                    >
                      Leave Requests
                    </Typography>
                    <List dense disablePadding>
                      {recentLeaves.map((leave) => (
                        <ListItem key={leave._id} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <ExitToAppIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${leave.leaveType ? leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) : "Leave"} - ${formatDate(leave.startDate)}`}
                            secondary={leave.reason}
                            primaryTypographyProps={{
                              variant: "body2",
                              noWrap: true,
                            }}
                            secondaryTypographyProps={{ noWrap: true }}
                          />
                          <Chip
                            label={leave.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(leave.status),
                              color: "#fff",
                              fontSize: 11,
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                My Performance
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <PerformanceChart
                  data={[
                    {
                      label: "My Performance",
                      data: [65, 70, 75, 72, 80, 85, 82, 88, 90, 87, 92, 95],
                      borderColor: "#3F51B5",
                      backgroundColor: "rgba(63,81,181,0.1)",
                    },
                  ]}
                  labels={[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ]}
                  height={200}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation Cards */}
          <Box mt={2} display="flex" flexDirection="column" gap={1.5}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalendarTodayIcon />}
              fullWidth
              onClick={() => navigate("/employee/attendance")}
              sx={{ py: 1.2 }}
            >
              Attendance
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<FlagIcon />}
              fullWidth
              onClick={() => navigate("/employee/report-issue")}
              sx={{ py: 1.2 }}
            >
              Report Issue
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<ExitToAppIcon />}
              fullWidth
              onClick={() => navigate("/employee/leave-request")}
              sx={{ py: 1.2 }}
            >
              Leave Request
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
