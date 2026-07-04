import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { machineApi } from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { formatDate } from "../../utils/helpers";
import { MACHINE_STATUS } from "../../utils/constants";

const statusColors = {
  available: "success",
  in_use: "info",
  maintenance: "warning",
  repair: "error",
  retired: "default",
};

const emptyForm = {
  machineNumber: "",
  name: "",
  type: "",
  status: "available",
  line: "",
  specifications: "",
};

const machineTypes = [
  "Sewing",
  "Cutting",
  "Embroidery",
  "Knitting",
  "Pressing",
  "Washing",
  "Packing",
];

export default function AdminMachines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLine, setFilterLine] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const loadMachines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await machineApi.list();
      const d = res.data;
      setMachines(d?.data || d?.machines || []);
    } catch {
      setMachines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const lines = [
    ...new Set((machines || []).map((m) => m.line).filter(Boolean)),
  ];

  const filteredMachines = (machines || []).filter((m) => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterLine && m.line !== filterLine) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (machine) => {
    setEditItem(machine);
    setForm({
      machineNumber: machine.machineNumber || "",
      name: machine.name || "",
      type: machine.type || "",
      status: machine.status || "available",
      line: machine.line || "",
      specifications: machine.specifications || "",
    });
    setFormOpen(true);
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFormSubmit = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await machineApi.update(editItem._id, form);
        toast.success("Machine updated");
      } else {
        await machineApi.create(form);
        toast.success("Machine created");
      }
      setFormOpen(false);
      loadMachines();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (machine) => {
    setDeleteItem(machine);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await machineApi.delete(deleteItem._id);
      toast.success("Machine deleted");
      setDeleteOpen(false);
      loadMachines();
    } catch {}
  };

  const handleViewDetail = async (machine) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await machineApi.get(machine._id);
      setDetailData(res.data?.data || res.data?.machine || res.data);
    } catch {
      setDetailData(machine);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePredictFailure = async (machine) => {
    setPredictLoading(true);
    try {
      const res = await machineApi.predict(machine._id);
      const pred = res.data?.prediction || res.data;
      toast.info(
        pred?.risk
          ? `Failure risk: ${pred.risk}% - ${pred.message || ""}`
          : "Prediction completed",
      );
    } catch {
      toast.error("Failed to get prediction");
    } finally {
      setPredictLoading(false);
    }
  };

  const columns = [
    { id: "machineNumber", label: "Machine #", sortable: true },
    { id: "name", label: "Name", sortable: true },
    { id: "type", label: "Type", render: (val) => val || "-" },
    {
      id: "status",
      label: "Status",
      render: (val) => (
        <Chip
          label={val?.replace(/_/g, " ") || "unknown"}
          size="small"
          color={statusColors[val] || "default"}
        />
      ),
    },
    { id: "line", label: "Line", render: (val) => val || "-" },
    {
      id: "efficiency",
      label: "Efficiency",
      render: (val) => (val != null ? `${val}%` : "-"),
    },
    {
      id: "actions",
      label: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleViewDetail(row)}>
              <PrecisionManufacturingIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="AI Prediction">
            <IconButton
              size="small"
              onClick={() => handlePredictFailure(row)}
              disabled={predictLoading}
            >
              <Typography variant="caption" fontWeight={700} color="secondary">
                AI
              </Typography>
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(row)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
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
          Machine Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Add Machine
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            size="small"
            label="Status"
            fullWidth
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All Status</MenuItem>
            {Object.values(MACHINE_STATUS).map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            size="small"
            label="Production Line"
            fullWidth
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value)}
          >
            <MenuItem value="">All Lines</MenuItem>
            {lines.map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={filteredMachines}
        loading={loading}
        searchPlaceholder="Search machines..."
      />

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editItem ? "Edit Machine" : "Add Machine"}
          <IconButton
            onClick={() => setFormOpen(false)}
            size="small"
            sx={{ position: "absolute", right: 16, top: 16 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Machine Number"
                value={form.machineNumber}
                onChange={handleFormChange("machineNumber")}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={form.name}
                onChange={handleFormChange("name")}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Type"
                value={form.type}
                onChange={handleFormChange("type")}
              >
                {machineTypes.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={form.status}
                onChange={handleFormChange("status")}
              >
                {Object.values(MACHINE_STATUS).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Production Line"
                value={form.line}
                onChange={handleFormChange("line")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Specifications"
                multiline
                rows={3}
                value={form.specifications}
                onChange={handleFormChange("specifications")}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Machine Details
          <IconButton
            onClick={() => setDetailOpen(false)}
            size="small"
            sx={{ position: "absolute", right: 16, top: 16 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box py={3}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} height={24} sx={{ mb: 1.5 }} />
              ))}
            </Box>
          ) : detailData ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">
                  {detailData.name || detailData.machineNumber}
                </Typography>
                <Chip
                  label={detailData.status?.replace(/_/g, " ")}
                  size="small"
                  color={statusColors[detailData.status] || "default"}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Machine Number
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.machineNumber || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.type || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Line
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.line || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Efficiency
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.efficiency != null
                    ? `${detailData.efficiency}%`
                    : "-"}
                </Typography>
              </Grid>
              {detailData.specifications && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Specifications
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {detailData.specifications}
                  </Typography>
                </Grid>
              )}
              {detailData.sensors && detailData.sensors.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Sensors
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sensor</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailData.sensors.map((s, i) => (
                          <TableRow key={s._id || i}>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.value}</TableCell>
                            <TableCell>
                              <Chip
                                label={s.status || "normal"}
                                size="small"
                                color={
                                  s.status === "alert" ? "error" : "success"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              {detailData.maintenanceHistory &&
                detailData.maintenanceHistory.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      gutterBottom
                    >
                      Maintenance History
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Technician</TableCell>
                            <TableCell>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detailData.maintenanceHistory.map((m, i) => (
                            <TableRow key={m._id || i}>
                              <TableCell>{formatDate(m.date)}</TableCell>
                              <TableCell>{m.type}</TableCell>
                              <TableCell>{m.technician}</TableCell>
                              <TableCell>{m.notes}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
            </Grid>
          ) : (
            <Typography color="text.secondary">No details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handlePredictFailure(detailData)}
            color="secondary"
            disabled={predictLoading || !detailData}
          >
            {predictLoading ? "Analyzing..." : "AI Failure Prediction"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Machine"
        message={`Are you sure you want to delete ${deleteItem?.name || deleteItem?.machineNumber}? This action cannot be undone.`}
        confirmColor="error"
        confirmText="Delete"
      />
    </Box>
  );
}
