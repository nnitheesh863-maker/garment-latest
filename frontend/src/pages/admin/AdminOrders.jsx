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
  Card,
  CardContent,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import { orderApi } from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import { formatDate } from '../../utils/helpers';
import { getStatusColor } from '../../utils/helpers';
import { ORDER_STATUS, PRIORITY } from '../../utils/constants';

const priorityColors = { low: 'default', medium: 'warning', high: 'error', urgent: 'error' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProduction: 0, completed: 0, qualityCheck: 0, delivered: 0 });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.list({ limit: 200 });
      const data = res.data?.data || res.data?.orders || [];
      setOrders(data);
      setStats({
        total: data.length,
        pending: data.filter((o) => o.status === 'pending').length,
        inProduction: data.filter((o) => o.status === 'in_production').length,
        qualityCheck: data.filter((o) => o.status === 'quality_check').length,
        completed: data.filter((o) => o.status === 'completed').length,
        delivered: data.filter((o) => o.status === 'delivered').length,
      });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filteredOrders = (orders || []).filter((o) => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterPriority && o.priority !== filterPriority) return false;
    if (dateFrom && new Date(o.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(o.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    if (searchCustomer && !(o.customerName || o.customer || '').toLowerCase().includes(searchCustomer.toLowerCase())) return false;
    return true;
  });

  const handleViewDetail = async (order) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await orderApi.get(order._id);
      setDetailData(res.data?.data || res.data?.order || res.data);
    } catch {
      setDetailData(order);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, { status: newStatus });
      toast.success('Order status updated');
      loadOrders();
      if (detailData?._id === orderId) {
        setDetailData((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch {
    }
  };

  const handlePredict = async (order) => {
    try {
      const res = await orderApi.predict(order._id);
      const pred = res.data?.prediction || res.data;
      toast.info(pred?.estimatedCompletion
        ? `Estimated completion: ${formatDate(pred.estimatedCompletion)}`
        : 'Prediction completed');
    } catch {
      toast.error('Prediction failed');
    }
  };

  const columns = [
    { id: 'orderNumber', label: 'Order #', sortable: true },
    {
      id: 'customerName', label: 'Customer', sortable: true,
      render: (val, row) => val || row.customer?.name || row.customer?.email || '-',
    },
    { id: 'garmentType', label: 'Garment', render: (val) => val || '-' },
    { id: 'quantity', label: 'Qty', sortable: true },
    {
      id: 'status', label: 'Status', render: (val) => (
        <Chip label={val?.replace(/_/g, ' ') || 'unknown'} size="small" sx={{ bgcolor: getStatusColor(val), color: '#fff' }} />
      ),
    },
    {
      id: 'priority', label: 'Priority', render: (val) => (
        <Chip label={val || 'normal'} size="small" color={priorityColors[val] || 'default'} variant="outlined" />
      ),
    },
    { id: 'dueDate', label: 'Due Date', render: (val) => formatDate(val) },
    {
      id: 'actions', label: 'Actions', sortable: false, align: 'right',
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="AI Prediction"><IconButton size="small" onClick={() => handlePredict(row)}><Typography variant="caption" fontWeight={700} color="secondary">AI</Typography></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const StatCard = ({ label, value, color }) => (
    <Card>
      <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Orders Overview</Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2} mb={3}>
          {[...Array(6)].map((_, i) => <Grid key={i} item xs={2}><Skeleton height={72} /></Grid>)}
        </Grid>
      ) : (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Total Orders" value={stats.total} color="primary.main" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Pending" value={stats.pending} color="#E8A06B" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="In Production" value={stats.inProduction} color="#A45A4A" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Quality Check" value={stats.qualityCheck} color="#2C8C8C" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Completed" value={stats.completed} color="#16A34A" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Delivered" value={stats.delivered} color="#7A2328" />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={3}>
          <TextField select size="small" label="Status" fullWidth value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All Status</MenuItem>
            {Object.values(ORDER_STATUS).map((s) => (
              <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField select size="small" label="Priority" fullWidth value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {Object.values(PRIORITY).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth size="small" label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth size="small" label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth size="small" label="Search Customer" value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)} />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={filteredOrders}
        loading={loading}
        onRowClick={handleViewDetail}
        searchPlaceholder="Search orders..."
      />

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details
          <IconButton onClick={() => setDetailOpen(false)} size="small" sx={{ position: 'absolute', right: 16, top: 16 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box py={3}>
              {[...Array(8)].map((_, i) => <Skeleton key={i} height={24} sx={{ mb: 1.5 }} />)}
            </Box>
          ) : detailData ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Order #{detailData.orderNumber}</Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip label={detailData.status?.replace(/_/g, ' ')} size="small" sx={{ bgcolor: getStatusColor(detailData.status), color: '#fff' }} />
                  <Chip label={detailData.priority || 'normal'} size="small" color={priorityColors[detailData.priority] || 'default'} variant="outlined" />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.customerName || detailData.customer || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Garment Type</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.garmentType || '-'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.quantity || '-'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Order Date</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(detailData.createdAt)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Due Date</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(detailData.dueDate)}</Typography>
              </Grid>
              {detailData.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body2" fontWeight={500}>{detailData.description}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box display="flex" gap={1} alignItems="center" mt={1}>
                  <Typography variant="subtitle2" fontWeight={600}>Update Status:</Typography>
                  <TextField select size="small" value={detailData.status} onChange={(e) => handleUpdateStatus(detailData._id, e.target.value)} sx={{ minWidth: 160 }}>
                    {Object.values(ORDER_STATUS).map((s) => (
                      <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Grid>
              {detailData.tasks && detailData.tasks.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Tasks</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Task</TableCell>
                          <TableCell>Assigned To</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailData.tasks.map((t, i) => (
                          <TableRow key={t._id || i}>
                            <TableCell>{t.title}</TableCell>
                            <TableCell>{t.assignedTo?.profile?.firstName || t.assignedTo?.email || '-'}</TableCell>
                            <TableCell><Chip label={t.status} size="small" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              {detailData.qualityChecks && detailData.qualityChecks.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Quality Checks</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Grade</TableCell>
                          <TableCell>Inspector</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailData.qualityChecks.map((q, i) => (
                          <TableRow key={q._id || i}>
                            <TableCell>{q.type}</TableCell>
                            <TableCell><Chip label={q.grade} size="small" /></TableCell>
                            <TableCell>{q.inspector?.profile?.firstName || q.inspector?.email || '-'}</TableCell>
                            <TableCell>{formatDate(q.date)}</TableCell>
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
          <Button color="secondary" onClick={() => handlePredict(detailData)} disabled={!detailData}>
            AI Prediction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
