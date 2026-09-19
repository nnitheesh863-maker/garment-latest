/**
 * Employee TaskList Page
 * Shop-floor operator interface for tracking daily task assignments and logging completions.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { TASK_STATUS } from '../../utils/constants';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api, { taskApi } from '../../api/axios';

export default function TaskList() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressTask, setProgressTask] = useState(null);

  const loadTasks = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await taskApi.list({ assignedTo: user._id });
      setTasks(res.data?.data || res.data?.tasks || []);
    } catch (e) {
      console.error('Failed to load tasks:', e);
      toast.error('Failed to load tasks from server.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Real-time Socket sync
  useEffect(() => {
    if (!socket) return;
    
    const handleSocketUpdate = () => {
      loadTasks();
    };

    socket.on('taskAssigned', handleSocketUpdate);
    socket.on('taskUpdated', handleSocketUpdate);
    socket.on('qualityApproved', handleSocketUpdate);
    socket.on('reworkRequested', handleSocketUpdate);

    return () => {
      socket.off('taskAssigned', handleSocketUpdate);
      socket.off('taskUpdated', handleSocketUpdate);
      socket.off('qualityApproved', handleSocketUpdate);
      socket.off('reworkRequested', handleSocketUpdate);
    };
  }, [socket, loadTasks]);

  const filteredTasks = tasks.filter((t) => !filterStatus || t.status === filterStatus);

  const handleStatusUpdate = async (task, newStatus) => {
    try {
      await api.put(`/api/tasks/${task._id}/status`, { status: newStatus });
      toast.success(`Task status updated to: ${newStatus.replace(/_/g, ' ')}`);
      loadTasks();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update task status.';
      toast.error(msg);
    }
  };

  const handleProgressUpdate = async () => {
    if (!progressTask) return;
    try {
      await api.post(`/api/tasks/${progressTask._id}/progress`, { produced: parseInt(progressValue) });
      setProgressDialogOpen(false);
      toast.success('Production progress logged.');
      loadTasks();
    } catch (e) {
      toast.error('Failed to update progress.');
    }
  };

  const handleComplete = async (task) => {
    try {
      await api.put(`/api/tasks/${task._id}/status`, { status: 'quality_check' });
      toast.success('Task submitted to Quality Control check.');
      loadTasks();
    } catch (e) {
      toast.error('Failed to submit task.');
    }
  };

  const openProgressDialog = (task) => {
    setProgressTask(task);
    setProgressValue(task.quantity?.produced || 0);
    setProgressDialogOpen(true);
  };

  const getTaskProgress = (task) => {
    const target = task.quantity?.target || 0;
    const produced = task.quantity?.produced || 0;
    return target > 0 ? Math.round((produced / target) * 100) : 0;
  };

  return (
    <Box>
      <PageHeader
        title="Assigned Work Orders & Tasks"
        subtitle="Execute stitching batches, track quantity completion, and dispatch completed bundles to QC."
        badge={`${tasks.filter(t => t.status === 'in_progress').length} In Progress`}
        badgeColor="success"
      />

      <TextField select size="small" label="Filter by Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ mb: 3, minWidth: 200 }}>
        <MenuItem value="">All Tasks</MenuItem>
        {Object.values(TASK_STATUS).map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
      </TextField>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={30} />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircleIcon sx={{ fontSize: 60, color: 'primary.main' }} />}
          title="No Tasks Found"
          description="You currently have no tasks assigned matching this criteria."
        />
      ) : (
        <Grid container spacing={2}>
          {filteredTasks.map((task) => {
            const pct = getTaskProgress(task);
            return (
              <Grid item xs={12} sm={6} md={4} key={task._id}>
                <Card sx={{ borderTop: `4px solid ${getStatusColor(task.priority)}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="subtitle2" fontWeight={600}>{task.title}</Typography>
                      <StatusBadge status={task.status} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>{task.description}</Typography>
                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                      <Chip label={task.priority} size="small" variant="outlined" sx={{ borderColor: getStatusColor(task.priority), color: getStatusColor(task.priority) }} />
                      <Chip label={`Due: ${formatDate(task.timeline?.dueDate || task.dueDate)}`} size="small" variant="outlined" />
                      <Chip label={`${task.quantity?.produced || 0}/${task.quantity?.target || 0}`} size="small" variant="outlined" />
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3 }} color={pct >= 100 ? 'success' : pct >= 50 ? 'primary' : 'warning'} />
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{pct}% complete</Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                    {task.status === 'pending' && (
                      <Button size="small" variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={() => handleStatusUpdate(task, 'accepted')}>Accept</Button>
                    )}
                    {task.status === 'accepted' && (
                      <Button size="small" variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={() => handleStatusUpdate(task, 'in_progress')}>Start</Button>
                    )}
                    {task.status === 'in_progress' && (
                      <>
                        <Button size="small" variant="contained" color="primary" startIcon={<PauseIcon />} onClick={() => handleStatusUpdate(task, 'paused')}>Pause</Button>
                        <Button size="small" variant="outlined" onClick={() => openProgressDialog(task)}>Log Prod</Button>
                        <Button size="small" variant="contained" color="success" onClick={() => handleComplete(task)}>Complete</Button>
                      </>
                    )}
                    {task.status === 'paused' && (
                      <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => handleStatusUpdate(task, 'in_progress')}>Resume</Button>
                    )}
                    {task.status === 'rework' && (
                      <>
                        <Button size="small" variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={() => handleStatusUpdate(task, 'in_progress')}>Start Rework</Button>
                        <Button size="small" variant="outlined" onClick={() => openProgressDialog(task)}>Log Prod</Button>
                      </>
                    )}
                    <Button size="small" variant="text" startIcon={<VisibilityIcon />} onClick={() => { setSelectedTask(task); setDetailOpen(true); }}>Details</Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box mt={1}>
              <Typography variant="h6" mb={1}>{selectedTask.title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>{selectedTask.description}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Order</Typography><Typography variant="body2">{selectedTask.orderId?.orderNumber || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><StatusBadge status={selectedTask.status} size="small" /></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Priority</Typography><Typography variant="body2" textTransform="capitalize">{selectedTask.priority}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="body2">{formatDate(selectedTask.timeline?.dueDate || selectedTask.dueDate)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Target Quantity</Typography><Typography variant="body2">{selectedTask.quantity?.target || 0}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Completed</Typography><Typography variant="body2">{selectedTask.quantity?.produced || 0}</Typography></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Progress</Typography>
                  <LinearProgress variant="determinate" value={getTaskProgress(selectedTask)} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} color="primary" />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Progress</DialogTitle>
        <DialogContent>
          {progressTask && (
            <Box mt={2}>
              <Typography variant="body2" mb={2}>{progressTask.title}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {progressValue} / {progressTask.quantity?.target || 0} units
              </Typography>
              <Slider
                value={progressValue}
                onChange={(_, val) => setProgressValue(val)}
                min={0}
                max={progressTask.quantity?.target || 0}
                step={1}
                valueLabelDisplay="auto"
              />
              <TextField fullWidth size="small" label="Quantity Completed" type="number" value={progressValue} onChange={(e) => setProgressValue(Math.min(Number(e.target.value), progressTask.quantity?.target || 0))} />
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
