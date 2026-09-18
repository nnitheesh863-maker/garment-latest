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
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { formatDate } from '../../utils/helpers';

const productionLineApi = {
  list: (params) => api.get('/api/production-lines', { params }),
  get: (id) => api.get(`/api/production-lines/${id}`),
  create: (data) => api.post('/api/production-lines', data),
  update: (id, data) => api.put(`/api/production-lines/${id}`, data),
  getAnalytics: (params) => api.get('/api/production-lines/analytics', { params }),
};

const statusColors = { active: 'success', inactive: 'default', maintenance: 'warning' };

const emptyForm = { name: '', code: '', capacityDaily: '', capacityHourly: '', location: '', description: '' };

export default function ProductionLines() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadLines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productionLineApi.list();
      const d = res.data;
      setLines(d?.data || d?.productionLines || []);
    } catch {
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLines(); }, [loadLines]);

  const handleOpenCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (line) => {
    setEditItem(line);
    setForm({
      name: line.name || '',
      code: line.code || '',
      capacityDaily: line.capacityDaily || '',
      capacityHourly: line.capacityHourly || '',
      location: line.location || '',
      description: line.description || '',
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
        await productionLineApi.update(editItem._id, form);
        toast.success('Production line updated');
      } else {
        await productionLineApi.create(form);
        toast.success('Production line created');
      }
      setFormOpen(false);
      loadLines();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (line) => {
    setSelectedLine(line);
    setConfirmOpen(true);
  };

  const confirmToggleStatus = async () => {
    try {
      const newStatus = selectedLine.status === 'active' ? 'inactive' : 'active';
      await productionLineApi.update(selectedLine._id, { status: newStatus });
      toast.success(`Line ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setConfirmOpen(false);
      loadLines();
    } catch {
    }
  };

  const handleViewDetail = async (line) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await productionLineApi.get(line._id);
      setDetailData(res.data?.data || res.data?.productionLine || res.data);
    } catch {
      setDetailData(line);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'code', label: 'Code', sortable: true },
    {
      id: 'status', label: 'Status', render: (val) => (
        <Chip label={val || 'unknown'} size="small" color={statusColors[val] || 'default'} />
      ),
    },
    {
      id: 'supervisor',
      label: 'Supervisor',
      render: (val) =>
        typeof val === 'object' && val !== null
          ? `${val?.profile?.firstName || ''} ${val?.profile?.lastName || ''}`.trim() || val?.email || '-'
          : val || '-',
    },
    {
      id: 'capacityDaily',
      label: 'Daily Capacity',
      render: (val, row) => (row.capacity?.daily || val ? `${row.capacity?.daily || val} units` : '-'),
    },
    {
      id: 'efficiency',
      label: 'Efficiency',
      render: (val, row) => (row.metrics?.efficiency != null ? `${row.metrics.efficiency}%` : val != null ? `${val}%` : '-'),
    },
    {
      id: 'actions', label: 'Actions', sortable: false, align: 'right',
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Details"><IconButton size="small" onClick={() => handleViewDetail(row)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" onClick={() => handleToggleStatus(row)}>
              {row.status === 'active' ? <BlockIcon fontSize="small" color="error" /> : <CheckCircleIcon fontSize="small" color="success" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Production Lines"
        subtitle="Manage factory floor line capacities, supervisors, and real-time efficiency telemetry."
        badge="Industry 4.0"
        actions={
          <GradientButton icon={<AddIcon />} onClick={handleOpenCreate}>
            Create Line
          </GradientButton>
        }
      />

      <DataTable
        columns={columns}
        rows={lines}
        loading={loading}
        searchPlaceholder="Search production lines..."
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editItem ? 'Edit Production Line' : 'Create Production Line'}
          <IconButton onClick={() => setFormOpen(false)} size="small" sx={{ position: 'absolute', right: 16, top: 16 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Name" value={form.name} onChange={handleFormChange('name')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Code" value={form.code} onChange={handleFormChange('code')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Daily Capacity" type="number" value={form.capacityDaily} onChange={handleFormChange('capacityDaily')} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Hourly Capacity" type="number" value={form.capacityHourly} onChange={handleFormChange('capacityHourly')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Location" value={form.location} onChange={handleFormChange('location')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={3} value={form.description} onChange={handleFormChange('description')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Line Details
          <IconButton onClick={() => setDetailOpen(false)} size="small" sx={{ position: 'absolute', right: 16, top: 16 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box py={3}>
              <Skeleton height={30} width="60%" sx={{ mb: 2 }} />
              <Skeleton height={20} sx={{ mb: 1 }} />
              <Skeleton height={20} sx={{ mb: 1 }} />
              <Skeleton height={200} />
            </Box>
          ) : detailData ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">{detailData.name}</Typography>
                <Chip label={detailData.status} size="small" color={statusColors[detailData.status] || 'default'} sx={{ mt: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Code</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.code || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Supervisor</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {typeof detailData.supervisor === 'object' && detailData.supervisor !== null
                    ? `${detailData.supervisor?.profile?.firstName || ''} ${detailData.supervisor?.profile?.lastName || ''}`.trim() || detailData.supervisor?.email || '-'
                    : detailData.supervisor || '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Daily Capacity</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.capacity?.daily || detailData.capacityDaily ? `${detailData.capacity?.daily || detailData.capacityDaily} units` : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Efficiency</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.metrics?.efficiency != null ? `${detailData.metrics.efficiency}%` : detailData.efficiency != null ? `${detailData.efficiency}%` : '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {typeof detailData.location === 'object' && detailData.location !== null
                    ? `${detailData.location.floor || ''} ${detailData.location.section || ''}`.trim() || '-'
                    : detailData.location || '-'}
                </Typography>
              </Grid>
              {detailData.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body2" fontWeight={500}>{detailData.description}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Assigned Machines</Typography>
                {detailData.machines && detailData.machines.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Machine</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailData.machines.map((m, i) => (
                          <TableRow key={m._id || i}>
                            <TableCell>{m.name || m.machineNumber}</TableCell>
                            <TableCell>{m.type}</TableCell>
                            <TableCell><Chip label={m.status} size="small" color={statusColors[m.status] || 'default'} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">No machines assigned</Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Active Orders</Typography>
                {detailData.orders && detailData.orders.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Due Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailData.orders.map((o, i) => (
                          <TableRow key={o._id || i}>
                            <TableCell>{o.orderNumber}</TableCell>
                            <TableCell><Chip label={o.status} size="small" /></TableCell>
                            <TableCell>{formatDate(o.dueDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">No active orders</Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Output Today</Typography>
                        <Typography variant="h6" fontWeight={600}>{detailData.outputToday ?? '-'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Utilization</Typography>
                        <Typography variant="h6" fontWeight={600}>{detailData.utilization != null ? `${detailData.utilization}%` : '-'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Downtime</Typography>
                        <Typography variant="h6" fontWeight={600}>{detailData.downtime ? `${detailData.downtime}h` : '-'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">No details available</Typography>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmToggleStatus}
        title={selectedLine?.status === 'active' ? 'Deactivate Line' : 'Activate Line'}
        message={`Are you sure you want to ${selectedLine?.status === 'active' ? 'deactivate' : 'activate'} ${selectedLine?.name}?`}
        confirmColor={selectedLine?.status === 'active' ? 'error' : 'success'}
        confirmText={selectedLine?.status === 'active' ? 'Deactivate' : 'Activate'}
      />
    </Box>
  );
}
