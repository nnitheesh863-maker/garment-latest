import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  TextField,
  MenuItem,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast } from 'react-toastify';
import StatusBadge from '../../components/common/StatusBadge';
import { TASK_STATUS } from '../../utils/constants';
import { calculateProgress, formatDate, getStatusColor } from '../../utils/helpers';

const mockTasks = [
  { _id: 't1', title: 'Cut fabric for Order ORD-001', description: 'Cut 100 pieces of cotton fabric according to pattern', priority: 'high', status: 'in_progress', quantityTarget: 100, quantityCompleted: 45, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), orderId: 'ORD-001' },
  { _id: 't2', title: 'Sew sleeves for Order ORD-002', description: 'Attach sleeves to garment bodies', priority: 'medium', status: 'assigned', quantityTarget: 200, quantityCompleted: 0, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), orderId: 'ORD-002' },
  { _id: 't3', title: 'Quality check batch #5', description: 'Inspect completed garments for defects', priority: 'low', status: 'pending', quantityTarget: 50, quantityCompleted: 0, dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), orderId: 'ORD-003' },
  { _id: 't4', title: 'Embroidery on Premium Order', description: 'Embroidery pattern on jacket back', priority: 'critical', status: 'pending', quantityTarget: 30, quantityCompleted: 0, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), orderId: 'ORD-004' },
  { _id: 't5', title: 'Pack completed shirts', description: 'Fold and pack 80 shirts', priority: 'medium', status: 'completed', quantityTarget: 80, quantityCompleted: 80, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), orderId: 'ORD-002' },
];

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressTask, setProgressTask] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { setTasks(mockTasks); setLoading(false); }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredTasks = tasks.filter((t) => !filterStatus || t.status === filterStatus);

  const handleStatusUpdate = (task, newStatus) => {
    setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, status: newStatus } : t));
    toast.success(`Task ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleProgressUpdate = () => {
    setTasks((prev) => prev.map((t) => t._id === progressTask._id ? { ...t, quantityCompleted: progressValue } : t));
    setProgressDialogOpen(false);
    toast.success('Progress updated');
  };

  const handleComplete = (task) => {
    setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, status: 'completed', quantityCompleted: t.quantityTarget } : t));
    toast.success('Task marked as completed');
  };

  const openProgressDialog = (task) => {
    setProgressTask(task);
    setProgressValue(task.quantityCompleted);
    setProgressDialogOpen(true);
  };

  const progress = (task) => calculateProgress(task.quantityTarget, task.quantityCompleted);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>My Tasks</Typography>

      <TextField select size="small" label="Filter by Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ mb: 3, minWidth: 200 }}>
        <MenuItem value="">All Tasks</MenuItem>
        {Object.values(TASK_STATUS).map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
      </TextField>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card><CardContent sx={{ height: 180 }}></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredTasks.length === 0 ? (
        <Box py={6} textAlign="center"><Typography color="text.secondary">No tasks found</Typography></Box>
      ) : (
        <Grid container spacing={2}>
          {filteredTasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task._id}>
              <Card sx={{ borderTop: `4px solid ${getStatusColor(task.priority)}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="subtitle2" fontWeight={600}>{task.title}</Typography>
                    <StatusBadge status={task.status} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>{task.description}</Typography>
                  <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                    <Chip label={task.priority} size="small" variant="outlined" sx={{ borderColor: getStatusColor(task.priority), color: getStatusColor(task.priority) }} />
                    <Chip label={`Due: ${formatDate(task.dueDate)}`} size="small" variant="outlined" />
                    <Chip label={`${task.quantityCompleted}/${task.quantityTarget}`} size="small" variant="outlined" />
                  </Box>
                  <LinearProgress variant="determinate" value={progress(task)} sx={{ height: 6, borderRadius: 3 }} color={progress(task) >= 100 ? 'success' : progress(task) >= 50 ? 'primary' : 'warning'} />
                  <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{progress(task)}% complete</Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                  {task.status === 'pending' && (
                    <Button size="small" variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={() => handleStatusUpdate(task, 'in_progress')}>Accept</Button>
                  )}
                  {task.status === 'in_progress' && (
                    <>
                      <Button size="small" variant="contained" color="primary" startIcon={<PauseIcon />} onClick={() => handleStatusUpdate(task, 'on_hold')}>Pause</Button>
                      <Button size="small" variant="outlined" onClick={() => openProgressDialog(task)}>Update Progress</Button>
                      <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleComplete(task)}>Complete</Button>
                    </>
                  )}
                  {task.status === 'on_hold' && (
                    <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => handleStatusUpdate(task, 'in_progress')}>Resume</Button>
                  )}
                  {task.status === 'assigned' && (
                    <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => handleStatusUpdate(task, 'in_progress')}>Start</Button>
                  )}
                  <Button size="small" variant="text" startIcon={<VisibilityIcon />} onClick={() => { setSelectedTask(task); setDetailOpen(true); }}>Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              <Typography variant="h6" mb={1}>{selectedTask.title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>{selectedTask.description}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Order</Typography><Typography variant="body2">{selectedTask.orderId}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><StatusBadge status={selectedTask.status} size="small" /></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Priority</Typography><Typography variant="body2" textTransform="capitalize">{selectedTask.priority}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="body2">{formatDate(selectedTask.dueDate)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Target Quantity</Typography><Typography variant="body2">{selectedTask.quantityTarget}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Completed</Typography><Typography variant="body2">{selectedTask.quantityCompleted}</Typography></Grid>
                <Grid item xs={12}><Typography variant="caption" color="text.secondary">Progress</Typography><LinearProgress variant="determinate" value={progress(selectedTask)} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} /></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Progress</DialogTitle>
        <DialogContent>
          {progressTask && (
            <Box mt={2}>
              <Typography variant="body2" mb={2}>{progressTask.title}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {progressValue} / {progressTask.quantityTarget} units
              </Typography>
              <Slider
                value={progressValue}
                onChange={(_, val) => setProgressValue(val)}
                min={0}
                max={progressTask.quantityTarget}
                step={1}
                valueLabelDisplay="auto"
              />
              <TextField full size="small" label="Quantity Completed" type="number" value={progressValue} onChange={(e) => setProgressValue(Math.min(Number(e.target.value), progressTask.quantityTarget))} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProgressUpdate}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
