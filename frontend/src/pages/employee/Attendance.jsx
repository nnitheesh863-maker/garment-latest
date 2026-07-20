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
import { formatDate, formatDateTime } from "../../utils/helpers";
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
      if (today) {
        if (today.clockIn) setClockedIn(true);
        if (today.clockOut) setClockedOut(true);
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
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
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
      setClockInTime(now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }));
      toast.success(`Clocked in at ${now.toLocaleTimeString()}`);
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
      setClockOutTime(now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }));
      if (res.data?.data?.workingHours) {
        setWorkingHours(res.data.data.workingHours);
        setBreakTime(res.data.data.breakTime || 0);
        setOvertime(res.data.data.overtime || 0);
        setLateArrival(res.data.data.lateArrival || 0);
        setEarlyLeaving(res.data.data.earlyLeaving || 0);
      }
      toast.success(`Clocked out at ${now.toLocaleTimeString()}`);
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700}>
          Attendance
        </Typography>
        <Typography variant="body1">
          {formatDate(new Date(), "MMMM yyyy")}
        </Typography>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {present}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Present
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={700} color="error.main">
                {absent}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Absent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {late}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Late
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {totalWorkDays - absent - late}/{totalWorkDays}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attendance Rate
              </Typography>
            </CardContent>
          </Card>
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
               })}
             </Typography>
             <Typography variant="body2" color="text.secondary" mb={2}>
               Current Time
             </Typography>
             {(clockedIn || clockInTime) && (
               <Box mb={2}>
                 <Typography variant="body2" fontWeight={500}>
                   {clockedIn || clockInTime
                     ? `Clocked In: ${clockInTime || new Date().toLocaleTimeString([], {
                         hour: "2-digit",
                         minute: "2-digit",
                         hour12: true,
                       })}`
                     : "Not Clocked In"}
                 </Typography>
                 {clockedOut && clockOutTime && (
                   <Box mt={1}>
                     <Typography variant="body2" fontWeight={500}>
                       Clocked Out: {clockOutTime}
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                       Working Hours: {workingHours}h | Break: {breakTime}h | Overtime: {overtime}h
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
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance
                  .filter((a) => a.status !== "weekend")
                  .slice(0, 30)
                  .map((a) => (
                    <TableRow key={a._id || a.date}>
                      <TableCell>
                        {formatDate(a.date, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={a.status}
                          size="small"
                          color={
                            a.status === "present"
                              ? "success"
                              : a.status === "absent"
                                ? "error"
                                : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{a.clockIn || "-"}</TableCell>
                      <TableCell>{a.clockOut || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
