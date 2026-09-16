import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
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
import SendIcon from "@mui/icons-material/Send";
import { toast } from "react-toastify";
import PageHeader from "../../components/common/PageHeader";
import GradientButton from "../../components/common/GradientButton";
import GlassCard from "../../components/common/GlassCard";
import StatusBadge from "../../components/common/StatusBadge";
import { ISSUE_TYPES, PRIORITY } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import api, { employeeApi } from "../../api/axios";

export default function IssueReporting() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "machine",
    description: "",
    priority: "medium",
    machine: "",
    attachment: null,
  });

  const loadIssues = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/api/employees/${user._id}/issues`);
      setIssues(res.data?.data || res.data?.issues || []);
    } catch (err) {
      console.error("Failed to load issues:", err);
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    setSubmitting(true);
    try {
      await employeeApi.reportIssue(user._id, {
        type: formData.type,
        description: formData.description,
        priority: formData.priority,
        machine: formData.machine,
      });
      setFormData({
        type: "machine",
        description: "",
        priority: "medium",
        machine: "",
        attachment: null,
      });
      toast.success("Issue reported successfully");
      loadIssues();
    } catch (err) {
      toast.error("Failed to report issue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Incident & Equipment Issue Log"
        subtitle="Flag mechanical malfunctions, safety hazards, and supply shortages directly to line managers."
        badge="Safety & Ops"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                New Issue
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Issue Type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, type: e.target.value }))
                      }
                    >
                      {Object.values(ISSUE_TYPES).map((t) => (
                        <MenuItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the issue in detail..."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Priority"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, priority: e.target.value }))
                      }
                    >
                      {Object.values(PRIORITY).map((p) => (
                        <MenuItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Machine (if applicable)"
                      value={formData.machine}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, machine: e.target.value }))
                      }
                      placeholder="e.g., M-104"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="outlined" component="label" fullWidth>
                      {formData.attachment
                        ? formData.attachment.name
                        : "Attach File (optional)"}
                      <input
                        type="file"
                        hidden
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            attachment: e.target.files[0],
                          }))
                        }
                      />
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      startIcon={<SendIcon />}
                      size="large"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Issue"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Issue History
              </Typography>
              {loading ? (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">Loading...</Typography>
                </Box>
              ) : issues.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">
                    No issues reported
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {issues.map((issue) => (
                        <TableRow key={issue._id}>
                          <TableCell>
                            <Chip
                              label={issue.type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{issue.description}</TableCell>
                          <TableCell>
                            <StatusBadge status={issue.priority} size="small" />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={issue.status} size="small" />
                          </TableCell>
                          <TableCell>{formatDate(issue.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
