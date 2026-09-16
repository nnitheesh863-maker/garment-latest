import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';
import StatusBadge from '../../components/common/StatusBadge';
import TaskForm from '../../components/forms/TaskForm';
import DetailModal from '../../components/modals/DetailModal';
import { TASK_STATUS, PRIORITY } from '../../utils/constants';
import { calculateProgress, formatDate, getStatusColor } from '../../utils/helpers';

const mockTasks = Array.from({ length: 30 }, (_, i) => ({
  _id: `task${i}`,
  title: ['Cut fabric', 'Sew sleeves', 'Attach buttons', 'Quality check', 'Package', 'Ironing', 'Embroidery', 'Label attachment'][Math.floor(Math.random() * 8)],
  description: 'Production task for current order batch',
  orderId: `ord${Math.floor(Math.random() * 10)}`,
  assignedTo: ['emp1', 'emp2', 'emp3', 'emp4', 'emp5'][Math.floor(Math.random() * 5)],
  assignedToName: ['Alice Smith', 'Bob Johnson', 'Carol Williams', 'David Brown', 'Eve Davis'][Math.floor(Math.random() * 5)],
  quantityTarget: Math.floor(Math.random() * 200 + 50),
  quantityCompleted: Math.floor(Math.random() * 150),
  status: Object.values(TASK_STATUS)[Math.floor(Math.random() * 5)],
  priority: Object.values(PRIORITY)[Math.floor(Math.random() * 4)],
  difficulty: ['easy', 'medium', 'hard', 'expert'][Math.floor(Math.random() * 4)],
  dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
}));

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', assignedTo: '' });

  useEffect(() => {
    const timer = setTimeout(() => { setTasks(mockTasks); setLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => { setEditTask(null); setFormOpen(true); };
  const handleEdit = (task) => { setEditTask(task); setFormOpen(true); };
  const handleView = (task) => { setSelectedTask(task); setDetailOpen(true); };

  const handleFormSubmit = (values) => {
    if (editTask) {
      setTasks((prev) => prev.map((t) => t._id === editTask._id ? { ...t, ...values } : t));
      toast.success('Task updated');
    } else {
      const newTask = { _id: `task${Date.now()}`, ...values, status: 'pending', quantityCompleted: 0, createdAt: new Date().toISOString() };
      setTasks((prev) => [newTask, ...prev]);
      toast.success('Task created');
    }
    setFormOpen(false);
  };

  const handleAssign = (task) => {
    const employees = ['Alice Smith', 'Bob Johnson', 'Carol Williams', 'David Brown', 'Eve Davis'];
    const newEmp = employees[Math.floor(Math.random() * employees.length)];
    setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, assignedToName: newEmp, status: 'assigned' } : t));
    toast.success(`Task assigned to ${newEmp}`);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.assignedTo && t.assignedToName !== filters.assignedTo) return false;
    return true;
  });

  const columns = [
    { id: 'title', label: 'Task', sortable: true },
    { id: 'assignedToName', label: 'Assigned To' },
    { id: 'quantityTarget', label: 'Target', align: 'right' },
    {
      id: 'progress', label: 'Progress', render: (_, row) => {
        const pct = calculateProgress(row.quantityTarget, row.quantityCompleted);
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
            <Typography variant="caption">{pct}%</Typography>
          </Box>
        );
      },
    },
    { id: 'priority', label: 'Priority', render: (val) => <StatusBadge status={val} /> },
    { id: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { id: 'dueDate', label: 'Due', render: (val) => formatDate(val) },
    {
      id: 'actions', label: '', sortable: false, align: 'right',
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View"><IconButton size="small" onClick={() => handleView(row)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          {row.status === 'pending' && (
            <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); handleAssign(row); }}>Assign</Button>
          )}
        </Box>
      ),
    },
  ];

  const detailSections = selectedTask ? [
    {
      title: 'Task Information',
      fields: [
        { label: 'Title', value: selectedTask.title, sm: 12 },
        { label: 'Description', value: selectedTask.description, sm: 12 },
        { label: 'Status', value: selectedTask.status, type: 'chip', chipColor: getStatusColor(selectedTask.status) },
        { label: 'Priority', value: selectedTask.priority, type: 'chip', chipColor: getStatusColor(selectedTask.priority) },
        { label: 'Difficulty', value: selectedTask.difficulty },
        { label: 'Assigned To', value: selectedTask.assignedToName },
        { label: 'Target', value: selectedTask.quantityTarget },
        { label: 'Completed', value: selectedTask.quantityCompleted },
        { label: 'Due Date', value: formatDate(selectedTask.dueDate) },
        { label: 'Progress', value: `${calculateProgress(selectedTask.quantityTarget, selectedTask.quantityCompleted)}%`, sm: 12 },
      ],
      custom: (
        <Box mt={1}>
          <LinearProgress variant="determinate" value={calculateProgress(selectedTask.quantityTarget, selectedTask.quantityCompleted)} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
      ),
    },
  ] : [];

  const uniqueEmployees = [...new Set(tasks.map((t) => t.assignedToName).filter(Boolean))];

  return (
    <Box>
      <PageHeader
        title="Task Allocation & Progress"
        subtitle="Live tracking of line operator tasks, piece counts, milestones, and status transitions."
        badge="Floor Live"
        actions={
          <GradientButton icon={<AddIcon />} onClick={handleCreate}>
            New Task
          </GradientButton>
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField select size="small" label="Status" fullWidth value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(TASK_STATUS).map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select size="small" label="Assigned To" fullWidth value={filters.assignedTo} onChange={(e) => setFilters((p) => ({ ...p, assignedTo: e.target.value }))}>
            <MenuItem value="">All</MenuItem>
            {uniqueEmployees.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <DataTable columns={columns} rows={filteredTasks} loading={loading} onRowClick={handleView} />

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} initialValues={editTask} />

      <DetailModal open={detailOpen} onClose={() => setDetailOpen(false)} title={selectedTask?.title || 'Task Details'} sections={detailSections} maxWidth="sm" />
    </Box>
  );
}
