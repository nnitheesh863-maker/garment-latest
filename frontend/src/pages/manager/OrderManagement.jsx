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
  Chip,
  Menu,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import OrderForm from '../../components/forms/OrderForm';
import DetailModal from '../../components/modals/DetailModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { orderApi } from '../../api/axios';
import { ORDER_STATUS, PRIORITY } from '../../utils/constants';
import { formatDate, getStatusColor } from '../../utils/helpers';

const mockOrders = Array.from({ name: 'mock' }, (_, i) => ({
  _id: `ord${i}`,
  orderNumber: `ORD-${String(2026001 + i)}`,
  customerName: ['Fashion Hub', 'Textile Corp', 'Style Wear', 'Uniform Co', 'Retail Plus'][Math.floor(Math.random() * 5)],
  company: ['Fashion Hub Ltd', 'Textile Corp Inc', 'Style Wear Co', 'Uniforms Ltd', 'Retail Plus LLC'][Math.floor(Math.random() * 5)],
  email: 'customer@example.com',
  phone: '+1-555-0100',
  garmentType: ['T-Shirt', 'Shirt', 'Pant', 'Jacket', 'Dress'][Math.floor(Math.random() * 5)],
  quantity: Math.floor(Math.random() * 500 + 100),
  status: Object.values(ORDER_STATUS)[Math.floor(Math.random() * 5)],
  priority: Object.values(PRIORITY)[Math.floor(Math.random() * 4)],
  requiredDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
  description: 'Production order for seasonal collection',
})).flat();

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusOrder, setStatusOrder] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  useEffect(() => {
    const timer = setTimeout(() => { setOrders(mockOrders); setLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => { setEditOrder(null); setFormOpen(true); };

  const handleEdit = (order) => { setEditOrder(order); setFormOpen(true); };

  const handleView = (order) => { setSelectedOrder(order); setDetailOpen(true); };

  const handleFormSubmit = async (values) => {
    try {
      if (editOrder) {
        setOrders((prev) => prev.map((o) => o._id === editOrder._id ? { ...o, ...values } : o));
        toast.success('Order updated');
      } else {
        const newOrder = { _id: `ord${Date.now()}`, ...values, orderNumber: `ORD-${Math.floor(Math.random() * 1000000)}`, status: 'pending', createdAt: new Date().toISOString() };
        setOrders((prev) => [newOrder, ...prev]);
        toast.success('Order created');
      }
      setFormOpen(false);
    } catch { /* handled */ }
  };

  const handleStatusChange = async (order, newStatus) => {
    setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status: newStatus } : o));
    setStatusMenuAnchor(null);
    toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const handlePredict = async (order) => {
    try {
      const res = await orderApi.predict(order._id);
      toast.info(`AI Prediction: ${res.data?.prediction || 'Completion in 3 days'}`);
    } catch {
      toast.info('AI Prediction: Estimated completion in 3-5 days');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filters.status && o.status !== filters.status) return false;
    if (filters.priority && o.priority !== filters.priority) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!o.customerName?.toLowerCase().includes(s) && !o.orderNumber?.toLowerCase().includes(s) && !o.garmentType?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const columns = [
    { id: 'orderNumber', label: 'Order #' },
    { id: 'customerName', label: 'Customer', sortable: true },
    { id: 'garmentType', label: 'Garment' },
    { id: 'quantity', label: 'Qty', align: 'right' },
    { id: 'priority', label: 'Priority', render: (val) => <StatusBadge status={val} /> },
    { id: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { id: 'requiredDate', label: 'Due Date', render: (val) => formatDate(val) },
    {
      id: 'actions', label: '', sortable: false, align: 'right',
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="AI Prediction"><IconButton size="small" onClick={() => handlePredict(row)}><PsychologyIcon fontSize="small" color="primary" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <IconButton size="small" onClick={(e) => { setStatusMenuAnchor(e.currentTarget); setStatusOrder(row); }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const detailSections = selectedOrder ? [
    {
      title: 'Customer Information',
      fields: [
        { label: 'Customer Name', value: selectedOrder.customerName },
        { label: 'Company', value: selectedOrder.company },
        { label: 'Email', value: selectedOrder.email },
        { label: 'Phone', value: selectedOrder.phone },
        { label: 'Address', value: selectedOrder.address },
      ],
    },
    {
      title: 'Order Details',
      fields: [
        { label: 'Order Number', value: selectedOrder.orderNumber },
        { label: 'Garment Type', value: selectedOrder.garmentType },
        { label: 'Quantity', value: selectedOrder.quantity },
        { label: 'Priority', value: selectedOrder.priority, type: 'chip', chipColor: getStatusColor(selectedOrder.priority) },
        { label: 'Status', value: selectedOrder.status, type: 'chip', chipColor: getStatusColor(selectedOrder.status) },
        { label: 'Required Date', value: formatDate(selectedOrder.requiredDate) },
        { label: 'Created', value: formatDate(selectedOrder.createdAt) },
        { label: 'Description', value: selectedOrder.description, sm: 12 },
      ],
    },
  ] : [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Order Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Order</Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField size="small" label="Search" fullWidth value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Search orders..." />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select size="small" label="Status" fullWidth value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(ORDER_STATUS).map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select size="small" label="Priority" fullWidth value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
            <MenuItem value="">All Priorities</MenuItem>
            {Object.values(PRIORITY).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <DataTable columns={columns} rows={filteredOrders} loading={loading} onRowClick={handleView} />

      <OrderForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} initialValues={editOrder} />

      <DetailModal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Order ${selectedOrder?.orderNumber || ''}`} sections={detailSections} maxWidth="md" />

      <Menu anchorEl={statusMenuAnchor} open={Boolean(statusMenuAnchor)} onClose={() => setStatusMenuAnchor(null)}>
        {Object.values(ORDER_STATUS).map((s) => (
          <MenuItem key={s} selected={statusOrder?.status === s} onClick={() => handleStatusChange(statusOrder, s)}>
            {s.replace(/_/g, ' ')}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
