import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import { differenceInDays, parseISO } from "date-fns";
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import DataTable from "../../components/common/DataTable";
import { LEAVE_TYPES, LEAVE_STATUS } from "../../utils/constants";
import { formatDate, getStatusColor } from "../../utils/helpers";

const initialForm = {
  leaveType: "sick",
  startDate: "",
  endDate: "",
  reason: "",
};

export default function LeaveRequest() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/leaves/my");
      setLeaves(res.data?.data || res.data?.leaves || []);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleOpenDialog = () => {
    setFormData(initialForm);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData(initialForm);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/api/leaves", {
        type: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });
      toast.success("Leave request submitted successfully");
      handleCloseDialog();
      fetchLeaves();
    } catch {
      // toast is handled by axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    try {
      const s = typeof start === "string" ? parseISO(start) : start;
      const e = typeof end === "string" ? parseISO(end) : end;
      return differenceInDays(e, s) + 1;
    } catch {
      return 0;
    }
  };

  const totalLeavesThisYear = leaves
    .filter((l) => {
      if (!l.startDate) return false;
      const d =
        typeof l.startDate === "string" ? parseISO(l.startDate) : l.startDate;
      return d.getFullYear() === new Date().getFullYear();
    })
    .reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);

  const pendingCount = leaves.filter(
    (l) => l.status === LEAVE_STATUS.PENDING,
  ).length;
  const approvedCount = leaves.filter(
    (l) => l.status === LEAVE_STATUS.APPROVED,
  ).length;

  const columns = [
    {
      id: "type",
      label: "Type",
      render: (val) => (
        <Chip
          label={val ? val.charAt(0).toUpperCase() + val.slice(1) : "-"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: "startDate",
      label: "Start Date",
      render: (val) => formatDate(val),
    },
    {
      id: "endDate",
      label: "End Date",
      render: (val) => formatDate(val),
    },
    {
      id: "days",
      label: "Days",
      sortable: true,
      render: (_, row) => calculateDays(row.startDate, row.endDate),
    },
    {
      id: "reason",
      label: "Reason",
      render: (val) => val || "-",
    },
    {
      id: "status",
      label: "Status",
      render: (val) => (
        <Chip
          label={val ? val.replace(/_/g, " ") : "unknown"}
          size="small"
          sx={{ bgcolor: getStatusColor(val), color: "#fff", fontWeight: 500 }}
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row) => {
        if (row.status === LEAVE_STATUS.PENDING) {
          return (
            <Chip
              label="Pending approval"
              size="small"
              color="warning"
              variant="outlined"
            />
          );
        }
        return null;
      },
    },
  ];

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700}>
          Leave Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Request Leave
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="primary">
                {totalLeavesThisYear}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Leaves This Year
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {approvedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={leaves}
        loading={loading}
        emptyMessage="No leave requests found"
        searchable
        searchPlaceholder="Search leave requests..."
      />

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Leave Type"
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  required
                >
                  {Object.values(LEAVE_TYPES).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reason"
                  name="reason"
                  multiline
                  rows={4}
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Please provide a reason for your leave..."
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
