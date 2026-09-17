import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import TaskForm from '../../components/forms/TaskForm';
import DetailModal from '../../components/modals/DetailModal';
import { taskApi } from '../../api/axios';
import { useSocket } from '../../hooks/useSocket';
import { TASK_STATUS, PRIORITY } from '../../utils/constants';
import { calculateProgress, formatDate, getStatusColor } from '../../utils/helpers';

export default function TaskManagement() {
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskApi.list({ limit: 300 });
      const data = res.data?.data || res.data?.tasks || res.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Unable to load factory tasks. Please try again.');
      toast.error('Failed to load tasks from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      loadTasks();
    };

    socket.on('taskAssigned', handleRealtimeUpdate);
    socket.on('taskUpdated', handleRealtimeUpdate);
    socket.on('productionUpdated', handleRealtimeUpdate);
    socket.on('taskCompleted', handleRealtimeUpdate);
    socket.on('qualityApproved', handleRealtimeUpdate);
    socket.on('reworkRequested', handleRealtimeUpdate);
    socket.on('newNotification', handleRealtimeUpdate);

    return () => {
      socket.off('taskAssigned', handleRealtimeUpdate);
      socket.off('taskUpdated', handleRealtimeUpdate);
      socket.off('productionUpdated', handleRealtimeUpdate);
      socket.off('taskCompleted', handleRealtimeUpdate);
      socket.off('qualityApproved', handleRealtimeUpdate);
      socket.off('reworkRequested', handleRealtimeUpdate);
      socket.off('newNotification', handleRealtimeUpdate);
    };
  }, [socket, loadTasks]);

  const handleCreate = () => {
    setEditTask(null);
    setFormOpen(true);
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setFormOpen(true);
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editTask) {
        await taskApi.update(editTask._id, values);
        toast.success('Task updated successfully');
      } else {
        await taskApi.create(values);
        toast.success('Task created successfully');
      }
      setFormOpen(false);
      loadTasks();
    } catch (err) {
      console.error('Failed to save task:', err);
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const taskNum = (t.taskNumber || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const empName = `${t.assignedTo?.profile?.firstName || ''} ${t.assignedTo?.profile?.lastName || ''}`.toLowerCase();
      const empEmail = (t.assignedTo?.email || '').toLowerCase();
      const orderNum = (t.orderId?.orderNumber || '').toLowerCase();
      const lineName = (t.productionLineId?.name || '').toLowerCase();
      const machName = (t.machineId?.name || t.machineId?.machineNumber || '').toLowerCase();
      if (
        !taskNum.includes(q) &&
        !title.includes(q) &&
        !empName.includes(q) &&
        !empEmail.includes(q) &&
        !orderNum.includes(q) &&
        !lineName.includes(q) &&
        !machName.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    qualityCheck: tasks.filter((t) => t.status === 'quality_check').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    rework: tasks.filter((t) => t.status === 'rework' || t.status === 'delayed').length,
  };

  const columns = [
    {
      id: 'taskNumber',
      label: 'Task #',
      render: (val, row) => (
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {val || row._id?.substring(0, 8)}
        </Typography>
      ),
    },
    {
      id: 'title',
      label: 'Operation / Title',
      sortable: true,
      render: (val, row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{val || 'Task'}</Typography>
          {row.orderId && (
            <Typography variant="caption" color="text.secondary">
              Order: {row.orderId?.orderNumber || row.orderId}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'assignedTo',
      label: 'Operator',
      render: (val) => {
        if (!val) return <Chip size="small" label="Unassigned" variant="outlined" />;
        const name = `${val.profile?.firstName || ''} ${val.profile?.lastName || ''}`.trim() || val.email || 'Employee';
        return <Typography variant="body2">{name}</Typography>;
      },
    },
    {
      id: 'productionLineId',
      label: 'Line / Machine',
      render: (_, row) => (
        <Box>
          <Typography variant="body2">{row.productionLineId?.name || '-'}</Typography>
          {row.machineId && (
            <Typography variant="caption" color="text.secondary">
              {row.machineId?.name || row.machineId?.machineNumber || 'Machine'}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'quantity',
      label: 'Progress (Units)',
      align: 'right',
      render: (qty, row) => {
        const target = qty?.target || row.quantityTarget || 0;
        const produced = qty?.produced || row.quantityCompleted || 0;
        const pct = calculateProgress(target, produced);
        return (
          <Box sx={{ minWidth: 120 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={600}>{produced} / {target}</Typography>
              <Typography variant="caption" color="text.secondary">{pct}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(pct, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: pct >= 100 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#2196f3',
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      id: 'priority',
      label: 'Priority',
      render: (val) => {
        const color = val === 'urgent' || val === 'critical' ? 'error' : val === 'high' ? 'warning' : 'default';
        return <Chip size="small" label={val || 'medium'} color={color} sx={{ textTransform: 'capitalize' }} />;
      },
    },
    {
      id: 'timeline',
      label: 'Due Date',
      render: (val, row) => (
        <Typography variant="caption" color="text.secondary">
          {formatDate(val?.dueDate || row.dueDate || row.timeline?.dueDate)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <Box display="flex" justifyContent="flex-end" gap={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleView(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Task">
            <IconButton size="small" onClick={() => handleEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Floor Task Management"
        subtitle="Live shop floor task distribution, operator tracking, and production milestones."
        badge="Manufacturing Execution"
        actions={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadTasks}
              disabled={loading}
            >
              Refresh
            </Button>
            <GradientButton icon={<AddIcon />} onClick={handleCreate}>
              New Task
            </GradientButton>
          </Box>
        }
      />

      {/* KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
              <Typography variant="h5" fontWeight={700}>{loading ? <Skeleton width={40} /> : stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">In Progress</Typography>
              <Typography variant="h5" fontWeight={700} color="info.main">{loading ? <Skeleton width={40} /> : stats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Waiting QC</Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">{loading ? <Skeleton width={40} /> : stats.qualityCheck}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Completed</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">{loading ? <Skeleton width={40} /> : stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Rework / Delayed</Typography>
              <Typography variant="h5" fontWeight={700} color="error.main">{loading ? <Skeleton width={40} /> : stats.rework}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters & Search */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by task #, title, operator, line, order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="accepted">Accepted</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="delayed">Delayed</MenuItem>
            <MenuItem value="quality_check">Quality Check</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="rework">Rework</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Filter by Priority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Table / Empty / Error */}
      {error ? (
        <Box p={4} textAlign="center">
          <WarningAmberIcon color="error" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body1" color="error" gutterBottom>{error}</Typography>
          <Button variant="outlined" size="small" onClick={loadTasks}>Retry Connection</Button>
        </Box>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredTasks}
          loading={loading}
          defaultSortBy="taskNumber"
          emptyMessage="No tasks found matching current filters."
        />
      )}

      {/* Create / Edit Form Modal */}
      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialValues={editTask}
      />

      {/* Detail View Modal */}
      <DetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Task: ${selectedTask?.taskNumber || selectedTask?.title || ''}`}
        data={selectedTask}
        fields={[
          { key: 'taskNumber', label: 'Task Number' },
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description' },
          { key: 'status', label: 'Status' },
          { key: 'priority', label: 'Priority' },
          { key: 'difficulty', label: 'Difficulty' },
          {
            key: 'assignedTo',
            label: 'Assigned Operator',
            render: (val) => val ? `${val.profile?.firstName || ''} ${val.profile?.lastName || ''} (${val.email || ''})` : 'Unassigned',
          },
          {
            key: 'orderId',
            label: 'Associated Order',
            render: (val) => val?.orderNumber || (typeof val === 'string' ? val : 'N/A'),
          },
          {
            key: 'productionLineId',
            label: 'Production Line',
            render: (val) => val?.name || 'N/A',
          },
          {
            key: 'machineId',
            label: 'Assigned Machine',
            render: (val) => val?.name || val?.machineNumber || 'N/A',
          },
          {
            key: 'quantity',
            label: 'Quantity Progress',
            render: (val) => `${val?.produced || 0} produced / ${val?.target || 0} target (Rejected: ${val?.rejected || 0})`,
          },
          {
            key: 'timeline',
            label: 'Due Date',
            render: (val) => formatDate(val?.dueDate),
          },
        ]}
      />
    </Box>
  );
}
