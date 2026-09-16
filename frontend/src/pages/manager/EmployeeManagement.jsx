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
  TextField,
  MenuItem,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import DataTable from "../../components/common/DataTable";
import EmployeeDetailModal from "../../components/modals/EmployeeDetailModal";
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
      render: (_, row) => {
        const img = row.profile?.profileImage || row.profileImage;
        const first = row.firstName || row.profile?.firstName || "";
        const last = row.lastName || row.profile?.lastName || "";
        const fullName = `${first} ${last}`.trim() || row.email || "Employee";
        return (
          <Box display="flex" alignItems="center" gap={1.25}>
            <Avatar
              src={img || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {(first[0] || "") + (last[0] || "")}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.position || row.designation || row.profile?.position || "-"}
              </Typography>
            </Box>
          </Box>
        );
      },
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
        onRowClick={(row) => handleViewProfile(row)}
      />

      {/* Employee Details Modal */}
      <EmployeeDetailModal
        open={perfOpen}
        onClose={() => setPerfOpen(false)}
        user={selectedEmployee}
      />
    </Box>
  );
}
