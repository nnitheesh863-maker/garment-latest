import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import PerformanceChart from '../../components/charts/PerformanceChart';
import GlassCard from '../../components/common/GlassCard';
import api from '../../api/axios';
import { QUALITY_GRADE } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export default function QualityControl() {
  const [checks, setChecks] = useState([]);
  const [tasksAwaiting, setTasksAwaiting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reworkReason, setReworkReason] = useState('Loose thread detected.');
  const [newCheck, setNewCheck] = useState({ productType: '', quantityChecked: '', passed: '', failed: '', inspector: '', notes: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const qcRes = await api.get('/api/quality');
      const qcs = qcRes.data?.data || qcRes.data || [];
      if (Array.isArray(qcs)) setChecks(qcs);

      const tasksRes = await api.get('/api/tasks', { params: { status: 'quality_check' } });
      const tasks = tasksRes.data?.data || tasksRes.data?.tasks || [];
      if (Array.isArray(tasks)) setTasksAwaiting(tasks);
    } catch (e) {
      console.error('Failed to load quality control data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCheck = async () => {
    try {
      const qc = {
        ...newCheck,
        quantityChecked: Number(newCheck.quantityChecked),
        passed: Number(newCheck.passed),
        failed: Number(newCheck.failed),
        grade: Number(newCheck.passed) / Number(newCheck.quantityChecked) >= 0.95 ? 'A' : 'B',
      };
      await api.post('/api/quality', qc);
      toast.success('Quality check recorded');
      setAddDialogOpen(false);
      setNewCheck({ productType: '', quantityChecked: '', passed: '', failed: '', inspector: '', notes: '' });
      loadData();
    } catch (e) {
      toast.error('Failed to record quality check');
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      await api.post(`/api/quality/${taskId}/approve`);
      toast.success('Task approved. Order metrics updated.');
      loadData();
    } catch (e) {
      toast.error('Failed to approve quality.');
    }
  };

  const openReworkDialog = (task) => {
    setSelectedTask(task);
    setReworkReason('Loose thread detected.');
    setReworkDialogOpen(true);
  };

  const handleReworkSubmit = async () => {
    if (!selectedTask) return;
    try {
      await api.post(`/api/quality/${selectedTask._id}/rework`, { reason: reworkReason });
      toast.info('Rework task returned to employee dashboard.');
      setReworkDialogOpen(false);
      setSelectedTask(null);
      loadData();
    } catch (e) {
      toast.error('Failed to submit rework request.');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      await api.post(`/api/quality/${taskId}/reject`);
      toast.warn('Task inspection rejected. Task status returned to pending.');
      loadData();
    } catch (e) {
      toast.error('Failed to reject quality check.');
    }
  };

  const filtered = checks.filter((c) => !gradeFilter || c.grade === gradeFilter);

  const avgGrade = checks.length > 0 ? Math.round(checks.reduce((s, c) => {
    const vals = { A: 95, B: 85, C: 70, reject: 40 };
    return s + (vals[c.grade] || 0);
  }, 0) / checks.length) : 89;

  const columns = [
    { id: 'inspectionNumber', label: 'Check ID' },
    { id: 'notes', label: 'Inspector Notes' },
    { id: 'results.totalInspected', label: 'Checked', align: 'right', render: (_, row) => row.results?.totalInspected || 0 },
    { id: 'results.passed', label: 'Passed', align: 'right', render: (_, row) => row.results?.passed || 0 },
    { id: 'results.failedItems', label: 'Failed', align: 'right', render: (_, row) => row.results?.failedItems || 0 },
    { id: 'grade', label: 'Grade', render: (val) => <StatusBadge status={val || 'A'} /> },
    { id: 'inspector.email', label: 'Inspector', render: (_, row) => row.inspector?.email || 'System' },
    { id: 'createdAt', label: 'Date', render: (val) => formatDate(val) },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700} color="#59171B">Quality Control Hub</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)} sx={{ bgcolor: '#59171B', '&:hover': { bgcolor: '#7A2328' } }}>New Check</Button>
      </Box>

      {/* Awaiting Inspection Section */}
      {tasksAwaiting.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight={800} color="#59171B" mb={2}>
            🔴 TASKS AWAITING INSPECTION ({tasksAwaiting.length})
          </Typography>
          <Grid container spacing={3}>
            {tasksAwaiting.map((task) => (
              <Grid item xs={12} md={6} key={task._id}>
                <GlassCard sx={{ borderLeft: '4px solid #DC2626' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="primary" mb={0.5}>
                    Task: {task.taskNumber} — {task.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Order: {task.orderId?.orderNumber} · Quantity Produced: {task.quantity?.produced} units · Machine: {task.machineId?.name || 'M-12'}
                  </Typography>
                  <Box display="flex" gap={1.5}>
                    <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => handleApproveTask(task._id)}>
                      Approve Quality
                    </Button>
                    <Button variant="outlined" color="warning" size="small" startIcon={<AutorenewIcon />} onClick={() => openReworkDialog(task)}>
                      Rework
                    </Button>
                    <Button variant="outlined" color="error" size="small" startIcon={<ErrorOutlineIcon />} onClick={() => handleRejectTask(task._id)}>
                      Reject
                    </Button>
                  </Box>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(89, 23, 27, 0.02)' }}><CardContent>
            <Typography variant="body2" color="text.secondary">Total Checks</Typography>
            <Typography variant="h4" fontWeight={700}>{checks.length}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(89, 23, 27, 0.02)' }}><CardContent>
            <Typography variant="body2" color="text.secondary">Avg Quality Score</Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">{avgGrade}%</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(89, 23, 27, 0.02)' }}><CardContent>
            <Typography variant="body2" color="text.secondary">Grade A Items</Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">{checks.filter((c) => c.grade === 'A').length}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(89, 23, 27, 0.02)' }}><CardContent>
            <Typography variant="body2" color="text.secondary">Total Inspections</Typography>
            <Typography variant="h4" fontWeight={700} color="info.main">{checks.length}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField select size="small" label="Grade" fullWidth value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <MenuItem value="">All Grades</MenuItem>
            {Object.values(QUALITY_GRADE).map((g) => <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <DataTable columns={columns} rows={filtered} loading={loading} searchPlaceholder="Search quality checks..." />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Quality Trend</Typography>
              <PerformanceChart
                data={[{ label: 'Quality Score', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + 88)), borderColor: '#59171B', backgroundColor: 'rgba(89,23,27,0.08)' }]}
                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                height={200}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rework dialog popup */}
      <Dialog open={reworkDialogOpen} onClose={() => setReworkDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request Quality Rework</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            State the defects found. The operator will receive this description on their dashboard.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rework Reason"
            value={reworkReason}
            onChange={(e) => setReworkReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReworkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleReworkSubmit}>Send to Operator</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Quality Check</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField select fullWidth size="small" label="Product Type" value={newCheck.productType} onChange={(e) => setNewCheck((p) => ({ ...p, productType: e.target.value }))}>
                <MenuItem value="T-Shirt">T-Shirt</MenuItem>
                <MenuItem value="Shirt">Shirt</MenuItem>
                <MenuItem value="Pant">Pant</MenuItem>
                <MenuItem value="Jacket">Jacket</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Quantity Checked" type="number" value={newCheck.quantityChecked} onChange={(e) => setNewCheck((p) => ({ ...p, quantityChecked: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Passed" type="number" value={newCheck.passed} onChange={(e) => setNewCheck((p) => ({ ...p, passed: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Failed" type="number" value={newCheck.failed} onChange={(e) => setNewCheck((p) => ({ ...p, failed: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Inspector" value={newCheck.inspector} onChange={(e) => setNewCheck((p) => ({ ...p, inspector: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Notes" value={newCheck.notes} onChange={(e) => setNewCheck((p) => ({ ...p, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCheck}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
