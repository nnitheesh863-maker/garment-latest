import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as DialogIconButton,
  TextField,
  MenuItem,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import DataTable from "../../components/common/DataTable";
import PerformanceChart from "../../components/charts/PerformanceChart";
import { formatDate } from "../../utils/helpers";
import api from "../../api/axios";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfOpen, setPerfOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: "employee" };
      if (filterDept) params.department = filterDept;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get("/api/employees", { params });
      const data = res.data?.data || res.data?.employees || res.data || [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [filterDept, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  const handleViewProfile = (emp) => {
    setSelectedEmployee(emp);
    setPerfOpen(true);
  };

  const columns = [
    {
      id: "name",
      label: "Employee",
      render: (_, row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              fontSize: 12,
            }}
          >
            {(row.firstName?.[0] || "") + (row.lastName?.[0] || "")}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {row.firstName || ""} {row.lastName || ""}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.position || row.designation || "-"}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: "email",
      label: "Email",
      render: (val) => val || "-",
      sortable: true,
    },
    { id: "department", label: "Department", sortable: true },
    {
      id: "role",
      label: "Role",
      render: (val) => val || "employee",
    },
    {
      id: "status",
      label: "Status",
      render: (val) => (
        <Chip
          label={val || "active"}
          size="small"
          color={(val || "active") === "active" ? "success" : "default"}
        />
      ),
    },
    {
      id: "actions",
      label: "",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <Tooltip title="View Profile">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProfile(row);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const departments = [
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  const activeCount = employees.filter(
    (e) => (e.status || "active") === "active",
  ).length;
  const avgPerformance =
    employees.length > 0
      ? Math.round(
          employees.reduce(
            (s, e) => s + (e.performance || e.performanceScore || 0),
            0,
          ) / employees.length,
        )
      : 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Employee Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Employees
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {employees.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Departments
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {departments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Avg Performance
              </Typography>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {avgPerformance}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search employees by name, email, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            size="small"
            fullWidth
            label="Department"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Employee Data Table */}
      <DataTable
        columns={columns}
        rows={employees}
        loading={loading}
        searchPlaceholder="Search employees..."
      />

      {/* Performance Dialog */}
      <Dialog
        open={perfOpen}
        onClose={() => setPerfOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {selectedEmployee?.firstName || ""}{" "}
            {selectedEmployee?.lastName || ""} - Performance
          </Typography>
          <DialogIconButton onClick={() => setPerfOpen(false)} size="small">
            <CloseIcon />
          </DialogIconButton>
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center" mb={3}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 1,
                      bgcolor: "primary.main",
                      fontSize: 28,
                    }}
                  >
                    {(selectedEmployee.firstName?.[0] || "") +
                      (selectedEmployee.lastName?.[0] || "")}
                  </Avatar>
                  <Typography variant="h6">
                    {selectedEmployee.firstName || ""}{" "}
                    {selectedEmployee.lastName || ""}
                  </Typography>
                  <Chip
                    label={
                      selectedEmployee.position ||
                      selectedEmployee.designation ||
                      "Employee"
                    }
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box>
                  {[
                    {
                      label: "Department",
                      value: selectedEmployee.department || "-",
                    },
                    { label: "Email", value: selectedEmployee.email || "-" },
                    { label: "Role", value: selectedEmployee.role || "-" },
                    {
                      label: "Performance",
                      value: `${
                        selectedEmployee.performance ||
                        selectedEmployee.performanceScore ||
                        0
                      }%`,
                    },
                    {
                      label: "Attendance",
                      value: selectedEmployee.attendance
                        ? `${selectedEmployee.attendance}%`
                        : "-",
                    },
                    {
                      label: "Status",
                      value: selectedEmployee.status || "active",
                    },
                  ].map((f) => (
                    <Box
                      key={f.label}
                      display="flex"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {f.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {f.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Performance Trend
                </Typography>
                <PerformanceChart
                  data={[
                    {
                      label: "Productivity",
                      data: Array.from({ length: 12 }, () =>
                        Math.floor(Math.random() * 40 + 60),
                      ),
                      borderColor: "#3F51B5",
                    },
                    {
                      label: "Quality",
                      data: Array.from({ length: 12 }, () =>
                        Math.floor(Math.random() * 20 + 80),
                      ),
                      borderColor: "#66BB6A",
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
                  height={250}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
