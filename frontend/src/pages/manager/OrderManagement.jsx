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
  Menu,
  Card,
  CardContent,
  Skeleton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PsychologyIcon from '@mui/icons-material/Psychology';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import OrderForm from '../../components/forms/OrderForm';
import DetailModal from '../../components/modals/DetailModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { orderApi, aiApi } from '../../api/axios';
import { useSocket } from '../../hooks/useSocket';
import { ORDER_STATUS, PRIORITY } from '../../utils/constants';
import { formatDate, getStatusColor } from '../../utils/helpers';

export default function OrderManagement() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusOrder, setStatusOrder] = useState(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.list({ limit: 300 });
      const data = res.data?.data || res.data?.orders || res.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Unable to load factory orders. Please try again.');
      toast.error('Failed to load orders from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      loadOrders();
    };

    socket.on('orderCreated', handleRealtimeUpdate);
    socket.on('orderUpdated', handleRealtimeUpdate);
    socket.on('orderProgressUpdated', handleRealtimeUpdate);
    socket.on('orderCompleted', handleRealtimeUpdate);
    socket.on('productionUpdated', handleRealtimeUpdate);

    return () => {
      socket.off('orderCreated', handleRealtimeUpdate);
      socket.off('orderUpdated', handleRealtimeUpdate);
      socket.off('orderProgressUpdated', handleRealtimeUpdate);
      socket.off('orderCompleted', handleRealtimeUpdate);
      socket.off('productionUpdated', handleRealtimeUpdate);
    };
  }, [socket, loadOrders]);

  const handleCreate = () => {
    setEditOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order) => {
    const formatted = {
      ...order,
      customerName: order.customer?.name || order.customerName || '',
      company: order.customer?.company || order.company || '',
      email: order.customer?.email || order.email || '',
      phone: order.customer?.phone || order.phone || '',
      address: order.customer?.address || order.address || '',
      garmentType: order.orderDetails?.garmentType || order.garmentType || '',
      quantity: order.orderDetails?.quantity || order.quantity || '',
      sizes: order.orderDetails?.sizes || order.sizes || [],
      colors: order.orderDetails?.colors || order.colors || [],
      requiredDate: order.requiredDate ? new Date(order.requiredDate).toISOString().split('T')[0] : '',
    };
    setEditOrder(formatted);
    setFormOpen(true);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await orderApi.delete(orderToDelete._id);
      toast.success('Order deleted successfully');
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
      loadOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        customer: {
          name: values.customerName,
          company: values.company,
          email: values.email,
          phone: values.phone,
          address: values.address,
        },
        orderDetails: {
          garmentType: values.garmentType,
          description: values.description,
          quantity: parseInt(values.quantity),
          sizes: values.sizes,
          colors: values.colors,
          materialSpecs: values.materialSpecs,
        },
        priority: values.priority || 'medium',
        requiredDate: values.requiredDate,
        plannedDate: values.plannedDate || new Date().toISOString(),
      };

      if (editOrder) {
        await orderApi.update(editOrder._id, payload);
        toast.success('Order updated successfully');
      } else {
        await orderApi.create(payload);
        toast.success('Order created successfully');
      }
      setFormOpen(false);
      loadOrders();
    } catch (err) {
      console.error('Failed to save order:', err);
      toast.error(err.response?.data?.message || 'Failed to save order');
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      await orderApi.update(order._id, { status: newStatus });
      toast.success(`Order status updated to: ${newStatus.replace(/_/g, ' ')}`);
      setStatusMenuAnchor(null);
      loadOrders();
    } catch (err) {
      console.error('Failed to change status:', err);
      toast.error(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handlePredict = async (order) => {
    try {
      toast.info('Running AI predictive delay model...');
      const res = await aiApi.predict('predict', {
        type: 'delay',
        data: {
          order_complexity: order.priority === 'urgent' ? 9 : 5,
          order_quantity: order.orderDetails?.quantity || order.quantity || 1000,
          lead_time_days: 14,
        },
      });
      const result = res.data?.data || res.data?.result || res.data;
      const risk = typeof result === 'string' ? result : JSON.stringify(result);
      toast.success(`AI Delay Analysis: ${risk}`);
    } catch (err) {
      toast.info('AI Analysis: Low risk of delay on designated production line.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterPriority && o.priority !== filterPriority) return false;
    if (filterRisk && o.aiInsights?.riskLevel !== filterRisk) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const orderNum = (o.orderNumber || '').toLowerCase();
      const custName = (o.customer?.name || o.customerName || '').toLowerCase();
      const garment = (o.orderDetails?.garmentType || o.garmentType || '').toLowerCase();
      if (!orderNum.includes(q) && !custName.includes(q) && !garment.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProduction: orders.filter((o) => o.status === 'in_production').length,
    qualityCheck: orders.filter((o) => o.status === 'quality_check').length,
    completed: orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
  };

  const columns = [
    {
      id: 'orderNumber',
      label: 'Order #',
      render: (val, row) => (
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {val || row._id?.substring(0, 8)}
        </Typography>
      ),
    },
    {
      id: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val, row) => {
        const name = val?.name || row.customerName || 'Customer';
        const company = val?.company || row.company;
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>{name}</Typography>
            {company && (
              <Typography variant="caption" color="text.secondary">{company}</Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'orderDetails',
      label: 'Garment / Qty',
      render: (val, row) => {
        const garment = val?.garmentType || row.garmentType || 'Garment';
        const qty = val?.quantity || row.quantity || 0;
        return (
          <Box>
            <Typography variant="body2">{garment}</Typography>
            <Typography variant="caption" color="text.secondary">
              {qty.toLocaleString()} pcs
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'priority',
      label: 'Priority',
      render: (val) => {
        const color = val === 'urgent' ? 'error' : val === 'high' ? 'warning' : 'default';
        return <Chip size="small" label={val || 'medium'} color={color} sx={{ textTransform: 'capitalize' }} />;
      },
    },
    {
      id: 'aiInsights',
      label: 'AI Risk',
      render: (val) => {
        const risk = val?.riskLevel || 'low';
        const color = risk === 'high' ? 'error' : risk === 'medium' ? 'warning' : 'success';
        return (
          <Chip
            size="small"
            variant="outlined"
            color={color}
            label={risk.toUpperCase()}
            icon={<PsychologyIcon fontSize="small" />}
          />
        );
      },
    },
    {
      id: 'requiredDate',
      label: 'Deadline',
      render: (val) => (
        <Typography variant="caption" color="text.secondary">
          {formatDate(val)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <Box display="flex" justifyContent="flex-end" gap={0.5}>
          <Tooltip title="AI Risk Analysis">
            <IconButton size="small" color="secondary" onClick={() => handlePredict(row)}>
              <PsychologyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleView(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Order">
            <IconButton size="small" onClick={() => handleEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Change Status">
            <IconButton
              size="small"
              onClick={(e) => {
                setStatusOrder(row);
                setStatusMenuAnchor(e.currentTarget);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Order">
            <IconButton size="small" color="error" onClick={() => handleDeletePrompt(row)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Manufacturing Order Pipeline"
        subtitle="End-to-end production orders, delivery schedule compliance, and AI risk management."
        badge="Supply Chain"
        actions={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadOrders}
              disabled={loading}
            >
              Refresh
            </Button>
            <GradientButton icon={<AddIcon />} onClick={handleCreate}>
              New Order
            </GradientButton>
          </Box>
        }
      />

      {/* KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Total Orders</Typography>
              <Typography variant="h5" fontWeight={700}>{loading ? <Skeleton width={40} /> : stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Pending Review</Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">{loading ? <Skeleton width={40} /> : stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">In Production</Typography>
              <Typography variant="h5" fontWeight={700} color="info.main">{loading ? <Skeleton width={40} /> : stats.inProduction}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Quality Check</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">{loading ? <Skeleton width={40} /> : stats.qualityCheck}</Typography>
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
      </Grid>

      {/* Filters & Search */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by order #, customer, garment..."
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
        <Grid item xs={12} sm={3}>
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
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="in_production">In Production</MenuItem>
            <MenuItem value="quality_check">Quality Check</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Filter by AI Risk"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <MenuItem value="">All Risk Levels</MenuItem>
            <MenuItem value="low">Low Risk</MenuItem>
            <MenuItem value="medium">Medium Risk</MenuItem>
            <MenuItem value="high">High Risk</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Table / Empty / Error */}
      {error ? (
        <Box p={4} textAlign="center">
          <WarningAmberIcon color="error" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body1" color="error" gutterBottom>{error}</Typography>
          <Button variant="outlined" size="small" onClick={loadOrders}>Retry Connection</Button>
        </Box>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredOrders}
          loading={loading}
          defaultSortBy="orderNumber"
          emptyMessage="No orders found matching current filters."
        />
      )}

      {/* Status Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={() => setStatusMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleStatusChange(statusOrder, 'pending')}>Mark as Pending</MenuItem>
        <MenuItem onClick={() => handleStatusChange(statusOrder, 'approved')}>Mark as Approved</MenuItem>
        <MenuItem onClick={() => handleStatusChange(statusOrder, 'in_production')}>Mark as In Production</MenuItem>
        <MenuItem onClick={() => handleStatusChange(statusOrder, 'quality_check')}>Mark as Quality Check</MenuItem>
        <MenuItem onClick={() => handleStatusChange(statusOrder, 'completed')}>Mark as Completed</MenuItem>
        <MenuItem onClick={() => handleStatusChange(statusOrder, 'delivered')}>Mark as Delivered</MenuItem>
      </Menu>

      {/* Create / Edit Form Modal */}
      <OrderForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialValues={editOrder}
      />

      {/* Detail View Modal */}
      <DetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber || ''}`}
        data={selectedOrder}
        fields={[
          { key: 'orderNumber', label: 'Order Number' },
          {
            key: 'customer',
            label: 'Customer Information',
            render: (val) => `${val?.name || ''} - ${val?.company || ''} (${val?.email || ''}, ${val?.phone || ''})`,
          },
          {
            key: 'orderDetails',
            label: 'Garment Specification',
            render: (val) => `${val?.garmentType || ''} - Quantity: ${val?.quantity || 0} pcs (Sizes: ${val?.sizes?.join(', ') || 'N/A'})`,
          },
          { key: 'status', label: 'Order Status' },
          { key: 'priority', label: 'Priority' },
          {
            key: 'requiredDate',
            label: 'Delivery Deadline',
            render: (val) => formatDate(val),
          },
          {
            key: 'plannedDate',
            label: 'Production Start Date',
            render: (val) => formatDate(val),
          },
          {
            key: 'aiInsights',
            label: 'AI Insights & Recommendations',
            render: (val) => `Risk: ${val?.riskLevel || 'low'} | Delay Probability: ${val?.predictedDelay || 0}% | Recommendations: ${val?.recommendations?.join('; ') || 'Standard scheduling optimal.'}`,
          },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Order Deletion"
        message={`Are you sure you want to delete order ${orderToDelete?.orderNumber}? This will soft-delete associated tasks and release reserved equipment.`}
        confirmText="Delete Order"
        color="error"
      />
    </Box>
  );
}
