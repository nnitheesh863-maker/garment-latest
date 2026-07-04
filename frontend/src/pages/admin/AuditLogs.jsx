import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DataTable from '../../components/common/DataTable';
import { formatDateTime, downloadCSV } from '../../utils/helpers';

const mockLogs = Array.from({ length: 50 }, (_, i) => ({
  _id: `log${i}`,
  user: ['Admin User', 'Manager User', 'Employee User'][Math.floor(Math.random() * 3)],
  action: ['login', 'logout', 'create_order', 'update_order', 'delete_order', 'create_task', 'update_task', 'update_settings', 'user_create', 'user_update'][Math.floor(Math.random() * 10)],
  resource: ['User', 'Order', 'Task', 'Machine', 'Inventory', 'Settings', 'Quality'][Math.floor(Math.random() * 7)],
  details: `Performed ${['create', 'update', 'delete', 'view'][Math.floor(Math.random() * 4)]} operation`,
  ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

const actionTypes = ['login', 'logout', 'create', 'update', 'delete', 'view'];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (userFilter && !log.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
    if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (dateFrom && new Date(log.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(log.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const columns = [
    { id: 'createdAt', label: 'Timestamp', render: (val) => formatDateTime(val, 'MMM dd, yyyy HH:mm:ss') },
    { id: 'user', label: 'User' },
    { id: 'action', label: 'Action', render: (val) => val.replace(/_/g, ' ') },
    { id: 'resource', label: 'Resource' },
    { id: 'details', label: 'Details' },
    { id: 'ip', label: 'IP Address' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Audit Logs</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => downloadCSV(filteredLogs, 'audit-logs.csv')}
          disabled={filteredLogs.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={3}>
          <TextField full size="small" label="User" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField select full size="small" label="Action Type" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <MenuItem value="">All Actions</MenuItem>
            {actionTypes.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField full size="small" label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField full size="small" label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={filteredLogs}
        loading={loading}
        defaultSortBy="createdAt"
        defaultSortDir="desc"
        searchPlaceholder="Search logs..."
      />
    </Box>
  );
}
