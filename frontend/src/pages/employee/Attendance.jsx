import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { toast } from "react-toastify";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import GradientButton from "../../components/common/GradientButton";
import GlassCard from "../../components/common/GlassCard";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate, formatDateTime, formatTime12, formatHoursMinutes, getWorkingDuration } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import api, { employeeApi } from "../../api/axios";

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockedOut, setClockedOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [workingHours, setWorkingHours] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [lateArrival, setLateArrival] = useState(0);
  const [earlyLeaving, setEarlyLeaving] = useState(0);
  const [shift] = useState('general');
  const [timezone] = useState('IST');

  const loadAttendance = useCallback(async () => {
    if (!user?._id) return;
    try {
      const startDate = new Date(currentYear, currentMonth, 1).toISOString();
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString();
      const res = await api.get(`/api/employees/${user._id}/attendance`, {
        params: { startDate, endDate },
      });
      const records = res.data?.data || res.data?.attendance || [];
      setAttendance(records);

      const today = Array.isArray(records)
        ? records.find(
            (r) =>
              new Date(r.date).toDateString() === new Date().toDateString(),
          )
        : null;
      setTodayRecord(today);
      if (today) {
        if (today.clockIn) {
          setClockedIn(true);
          setClockInTime(formatTime12(today.clockInTime || today.clockIn));
        }
        if (today.clockOut) {
          setClockedOut(true);
          setClockOutTime(formatTime12(today.clockOutTime || today.clockOut));
        }
        if (today.workingHours != null) setWorkingHours(today.workingHours);
        if (today.breakTime != null) setBreakTime(today.breakTime);
        if (today.overtime != null) setOvertime(today.overtime);
        if (today.lateArrival != null) setLateArrival(today.lateArrival);
        if (today.earlyLeaving != null) setEarlyLeaving(today.earlyLeaving);
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAttendance();
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, [loadAttendance]);

  const handleClockIn = async () => {
    try {
      const now = new Date();
      const res = await employeeApi.attendance(user._id, {
        date: now.toISOString().split('T')[0],
        clockIn: now.toISOString(),
        shift: 'general',
        timezone: 'IST',
        deviceTime: now.toISOString(),
      });
      setClockedIn(true);
      setClockInTime(formatTime12(now));
      toast.success(`Clocked in at ${formatTime12(now)}`);
      loadAttendance();
    } catch (err) {
      toast.error("Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    try {
      const now = new Date();
      const res = await employeeApi.attendance(user._id, {
        date: now.toISOString().split('T')[0],
        clockOut: now.toISOString(),
      });
      setClockedOut(true);
      setClockOutTime(formatTime12(now));
      if (res.data?.data?.workingHours) {
        setWorkingHours(res.data.data.workingHours);
        setBreakTime(res.data.data.breakTime || 0);
        setOvertime(res.data.data.overtime || 0);
        setLateArrival(res.data.data.lateArrival || 0);
        setEarlyLeaving(res.data.data.earlyLeaving || 0);
      }
      toast.success(`Clocked out at ${formatTime12(now)}`);
      loadAttendance();
    } catch (err) {
      toast.error("Failed to clock out");
    }
  };

  const present = attendance.filter((a) => a.status === "present").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const late = attendance.filter((a) => a.status === "late").length;
  const weekends = attendance.filter((a) => a.status === "weekend").length;
  const totalWorkDays = daysInMonth - weekends;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box>
      <PageHeader
        title="Attendance & Timecard"
        subtitle={`Live clock logs and monthly schedule tracker for ${formatDate(new Date(), "MMMM yyyy")}.`}
        badge={clockedIn && !clockedOut ? "On Duty" : clockedOut ? "Shift Completed" : "Not Clocked In"}
        badgeColor={clockedIn && !clockedOut ? "success" : clockedOut ? "info" : "default"}
      />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Present Days"
            value={present}
            icon={<CheckCircleIcon />}
            variant="green"
            loading={loading}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Absent Days"
            value={absent}
            icon={<CancelIcon />}
            variant={absent > 0 ? "maroon" : "soft"}
            loading={loading}
            subtitle="Unplanned leaves"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Late Check-ins"
            value={late}
            icon={<AccessTimeIcon />}
            variant="gold"
            loading={loading}
            subtitle="Grace threshold exceeded"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Attendance Rate"
            value={`${totalWorkDays > 0 ? Math.round(((totalWorkDays - absent) / totalWorkDays) * 100) : 100}%`}
            icon={<CheckCircleIcon />}
            variant="cream"
            loading={loading}
            subtitle={`${totalWorkDays - absent}/${totalWorkDays} workdays`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <AccessTimeIcon
                sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
              />
              <Typography variant="h5" fontWeight={600}>
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Current Time
              </Typography>
              {(clockedIn || clockInTime) && (
                <Box mb={2}>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    Clocked In: {clockInTime || formatTime12(todayRecord?.clockIn)}
                  </Typography>
                  {clockedOut && clockOutTime ? (
                    <Box mt={1}>
                      <Typography variant="body2" fontWeight={600} color="secondary.main">
                        Clocked Out: {clockOutTime || formatTime12(todayRecord?.clockOut)}
                      </Typography>
                      <Typography variant="body2" color="text.primary" fontWeight={600} mt={0.5}>
                        Total Worked: {getWorkingDuration(todayRecord?.clockIn, todayRecord?.clockOut, workingHours).detailed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Break: {formatHoursMinutes(breakTime, 'short')} | Overtime: {formatHoursMinutes(overtime, 'short')}
                      </Typography>
                    </Box>
                  ) : (
                    <Box mt={1}>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        Working: {getWorkingDuration(todayRecord?.clockIn || new Date()).detailed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Shift: {todayRecord?.shift || shift || 'General'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={clockedIn ? "outlined" : "contained"}
                    color="primary"
                    onClick={handleClockIn}
                    disabled={clockedIn}
                  >
                    {clockedIn ? "Clocked In" : "Clock In"}
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={clockedOut ? "outlined" : "contained"}
                    color="secondary"
                    onClick={handleClockOut}
                    disabled={clockedOut || !clockedIn}
                  >
                    {clockedOut ? "Clocked Out" : "Clock Out"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Monthly Calendar
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.5,
                }}
              >
                {weekDays.map((d) => (
                  <Box key={d} textAlign="center" py={0.5}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                    >
                      {d}
                    </Typography>
                  </Box>
                ))}
                {Array.from(
                  { length: new Date(currentYear, currentMonth, 1).getDay() },
                  (_, i) => (
                    <Box key={`empty-${i}`} />
                  ),
                )}
                {(() => {
                  const attendanceMap = new Map();
                  attendance.forEach((a) => {
                    const day = new Date(a.date).getDate();
                    attendanceMap.set(day, a);
                  });
                  return Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const a = attendanceMap.get(day);
                    const today = new Date();
                    const isToday =
                      today.getDate() === day &&
                      today.getMonth() === currentMonth &&
                      today.getFullYear() === currentYear;
                    return (
                      <Box
                        key={day}
                        sx={{
                          textAlign: "center",
                          py: 1,
                          borderRadius: 1,
                          bgcolor: a
                            ? a.status === "present"
                              ? "success.light"
                              : a.status === "absent"
                                ? "error.light"
                                : a.status === "late"
                                  ? "warning.light"
                                  : "action.hover"
                            : isToday
                              ? "primary.light"
                              : "transparent",
                          color: a
                            ? a.status !== "weekend"
                              ? "#fff"
                              : "text.disabled"
                            : isToday
                              ? "#fff"
                              : "text.primary",
                          fontSize: 13,
                          fontWeight: isToday ? 700 : 400,
                          border: isToday ? "2px solid" : "none",
                          borderColor: "primary.main",
                        }}
                      >
                        {day}
                      </Box>
                    );
                  });
                })()}
              </Box>
              <Box display="flex" gap={2} mt={2} justifyContent="center">
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Present"
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<CancelIcon />}
                  label="Absent"
                  color="error"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<AccessTimeIcon />}
                  label="Late"
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Attendance History
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Working Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance
                  .filter((a) => a.status !== "weekend")
                  .slice(0, 30)
                  .map((a) => {
                    const rowDuration = a.workingHours != null && a.workingHours > 0
                      ? formatHoursMinutes(a.workingHours, 'long')
                      : (a.clockIn && a.clockOut ? getWorkingDuration(a.clockIn, a.clockOut).detailed : '-');
                    return (
                      <TableRow key={a._id || a.date}>
                        <TableCell>
                          {formatDate(a.date, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={a.status}
                            size="small"
                            color={
                              a.status === "present" || a.status === "working"
                                ? "success"
                                : a.status === "absent"
                                  ? "error"
                                  : "warning"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {formatTime12(a.clockIn || a.clockInTime)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {formatTime12(a.clockOut || a.clockOutTime)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {rowDuration}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
