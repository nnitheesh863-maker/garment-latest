import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { MACHINE_STATUS } from '../../utils/constants';
import { getStatusColor } from '../../utils/helpers';

const mockMachines = Array.from({ length: 15 }, (_, i) => ({
  _id: `mach${i}`,
  machineId: `M-${String(100 + i)}`,
  name: ['Sewing Machine', 'Cutting Machine', 'Embroidery Machine', 'Ironing Press', 'Labeling Machine'][Math.floor(Math.random() * 5)],
  model: `Model-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 1000)}`,
  line: `Line-${Math.floor(Math.random() * 4 + 1)}`,
  status: Object.values(MACHINE_STATUS)[Math.floor(Math.random() * 4)],
  efficiency: Math.floor(Math.random() * 30 + 70),
  utilization: Math.floor(Math.random() * 40 + 60),
  lastMaintenance: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
  nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

export default function MachineManagement() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({ name: '', model: '', line: '' });
  const [filterLine, setFilterLine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setMachines(mockMachines); setLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleAdd = () => {
    const m = { _id: `mach${Date.now()}`, machineId: `M-${Math.floor(Math.random() * 900 + 100)}`, ...newMachine, status: 'available', efficiency: 100, utilization: 0, lastMaintenance: new Date().toISOString(), nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
    setMachines((prev) => [...prev, m]);
    setAddDialogOpen(false);
    setNewMachine({ name: '', model: '', line: '' });
    toast.success('Machine added');
  };

  const handleStatusUpdate = (machine, newStatus) => {
    setMachines((prev) => prev.map((m) => m._id === machine._id ? { ...m, status: newStatus } : m));
    toast.success(`Machine ${machine.machineId} status: ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleMaintenance = (machine) => {
    setMachines((prev) => prev.map((m) => m._id === machine._id ? { ...m, status: 'maintenance', lastMaintenance: new Date().toISOString(), nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : m));
    toast.success(`Maintenance scheduled for ${machine.machineId}`);
  };

  const handlePredict = (machine) => {
    toast.info(`AI Prediction: ${machine.name} has 87% chance of failure within 30 days. Recommend maintenance.`);
  };

  const filtered = machines.filter((m) => {
    if (filterLine && m.line !== filterLine) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    return true;
  });

  const columns = [
    { id: 'machineId', label: 'Machine ID' },
    { id: 'name', label: 'Name', sortable: true },
    { id: 'model', label: 'Model' },
    { id: 'line', label: 'Line' },
    { id: 'efficiency', label: 'Efficiency', render: (val) => (
      <Box display="flex" alignItems="center" gap={1}>
        <LinearProgress variant="determinate" value={val} sx={{ flex: 1, height: 6, borderRadius: 3 }} color={val >= 85 ? 'success' : val >= 70 ? 'warning' : 'error'} />
        <Typography variant="caption">{val}%</Typography>
      </Box>
    ) },
    { id: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    {
      id: 'actions', label: '', sortable: false, align: 'right',
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="AI Prediction">
            <IconButton size="small" onClick={() => handlePredict(row)}><PsychologyIcon fontSize="small" color="primary" /></IconButton>
          </Tooltip>
          <Tooltip title="Schedule Maintenance">
            <IconButton size="small" onClick={() => handleMaintenance(row)}><BuildIcon fontSize="small" /></IconButton>
          </Tooltip>
          {row.status !== 'available' && row.status !== 'retired' && (
            <Button size="small" variant="outlined" color="success" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row, 'available'); }}>
              Set Available
            </Button>
          )}
        </Box>
      ),
    },
  ];

  const uniqueLines = [...new Set(machines.map((m) => m.line))];

  return (
    <Box>
      <PageHeader
        title="Machine Telemetry & Fleet"
        subtitle="Manage equipment line assignments, efficiency utilization, and scheduled maintenance."
        badge="IoT Fleet"
        actions={
          <GradientButton icon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
            Add Machine
          </GradientButton>
        }
      />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={3}>
          <TextField select size="small" label="Production Line" fullWidth value={filterLine} onChange={(e) => setFilterLine(e.target.value)}>
            <MenuItem value="">All Lines</MenuItem>
            {uniqueLines.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField select size="small" label="Status" fullWidth value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(MACHINE_STATUS).map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <DataTable columns={columns} rows={filtered} loading={loading} searchPlaceholder="Search machines..." />

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Machine</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Machine Name" value={newMachine.name} onChange={(e) => setNewMachine((p) => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Model" value={newMachine.model} onChange={(e) => setNewMachine((p) => ({ ...p, model: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Production Line" value={newMachine.line} onChange={(e) => setNewMachine((p) => ({ ...p, line: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add Machine</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
