/**
 * AuditLogs Page
 * Comprehensive security and operational event log with IP tracking and user attribution.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';
import DetailModal from '../../components/modals/DetailModal';
import { adminDashboardApi } from '../../api/axios';
import { useSocket } from '../../hooks/useSocket';
import { formatDateTime, downloadCSV } from '../../utils/helpers';

const actionTypes = [
  'LOGIN',
  'ORDER_CREATED',
  'ORDER_UPDATED',
  'ORDER_DELETED',
  'TASK_ASSIGNED',
  'TASK_UPDATED',
  'PRODUCTION_LOGGED',
  'QC_APPROVED',
  'QC_REWORK',
  'MACHINE_STATUS_CHANGED',
  'INVENTORY_UPDATED',
  'USER_CREATED',
  'USER_ROLE_CHANGED',
  'AI_COMMAND_EXECUTED',
  'VOICE_COMMAND_EXECUTED',
];

const entityTypes = [
  'User',
  'Order',
  'Task',
  'Machine',
  'Inventory',
  'Quality',
  'Leave',
  'Issue',
  'AI',
  'Voice',
  'System',
];

const severityColors = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'error',
};

export default function AuditLogs() {
  const { socket } = useSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: 100,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        severity: severityFilter || undefined,
        user: userFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: searchTerm || undefined,
      };
      const res = await adminDashboardApi.getAuditLogs(params);
      const data = res.data?.data || res.data?.logs || res.data || [];
      const total = res.data?.pagination?.total || data.length;
      setLogs(Array.isArray(data) ? data : []);
      setTotalCount(total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Unable to load security audit logs. Please try again.');
      toast.error('Failed to load audit logs from server');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, severityFilter, userFilter, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Real-time Socket.IO synchronization on new audit events
  useEffect(() => {
    if (!socket) return;

    const handleNewAuditEvent = (newEvent) => {
      setLogs((prev) => [newEvent, ...prev].slice(0, 100));
      setTotalCount((c) => c + 1);
    };

    socket.on('newAuditEvent', handleNewAuditEvent);

    return () => {
      socket.off('newAuditEvent', handleNewAuditEvent);
    };
  }, [socket]);

  const handleView = (log) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const columns = [
    {
      id: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      render: (val) => (
        <Typography variant="caption" fontWeight={500}>
          {formatDateTime(val, 'MMM dd, yyyy HH:mm:ss')}
        </Typography>
      ),
    },
    {
      id: 'userName',
      label: 'User / Actor',
      render: (val, row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{val || 'System'}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {row.userRole || 'System'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'action',
      label: 'Security Action',
      sortable: true,
      render: (val, row) => (
        <Chip
          size="small"
          label={val?.replace(/_/g, ' ') || 'ACTION'}
          color={severityColors[row.severity] || 'default'}
          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
        />
      ),
    },
    {
      id: 'entityType',
      label: 'Entity Target',
      render: (val, row) => (
        <Box>
          <Typography variant="body2">{val || 'System'}</Typography>
          {row.entityId && (
            <Typography variant="caption" color="text.secondary">
              ID: {String(row.entityId).substring(0, 12)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'description',
      label: 'Audit Description',
      render: (val) => (
        <Typography variant="body2" sx={{ maxWidth: 360, wordBreak: 'break-word' }}>
          {val}
        </Typography>
      ),
    },
    {
      id: 'ipAddress',
      label: 'IP Address',
      render: (val) => (
        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
          {val || '127.0.0.1'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <Tooltip title="View Detailed Audit Payload">
          <IconButton size="small" onClick={() => handleView(row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="System Security & Compliance Audit Trail"
        subtitle="Immutable transaction logging, operator changes, AI executions, and access records."
        badge="Enterprise Security"
        actions={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadLogs}
              disabled={loading}
            >
              Refresh
            </Button>
            <GradientButton
              icon={<DownloadIcon />}
              onClick={() => downloadCSV(logs, 'audit-trail.csv')}
              disabled={logs.length === 0}
            >
              Export CSV
            </GradientButton>
          </Box>
        }
      />

      {/* KPI Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Total Recorded Events</Typography>
              <Typography variant="h5" fontWeight={700}>{loading ? <Skeleton width={50} /> : totalCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Informational Logins</Typography>
              <Typography variant="h5" fontWeight={700} color="info.main">
                {loading ? <Skeleton width={50} /> : logs.filter((l) => l.action === 'LOGIN').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Production Modifications</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {loading ? <Skeleton width={50} /> : logs.filter((l) => l.action.includes('ORDER') || l.action.includes('TASK')).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Security Warnings</Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">
                {loading ? <Skeleton width={50} /> : logs.filter((l) => l.severity === 'warning' || l.severity === 'critical').length}
              </Typography>
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
            placeholder="Search action, description, user, ID..."
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
        <Grid item xs={12} sm={2.25}>
          <TextField
            select
            fullWidth
            size="small"
            label="Action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="">All Actions</MenuItem>
            {actionTypes.map((a) => (
              <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2.25}>
          <TextField
            select
            fullWidth
            size="small"
            label="Entity"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <MenuItem value="">All Entities</MenuItem>
            {entityTypes.map((e) => (
              <MenuItem key={e} value={e}>{e}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2.25}>
          <TextField
            fullWidth
            size="small"
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={2.25}>
          <TextField
            fullWidth
            size="small"
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      {/* Table / Empty / Error */}
      {error ? (
        <Box p={4} textAlign="center">
          <WarningAmberIcon color="error" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body1" color="error" gutterBottom>{error}</Typography>
          <Button variant="outlined" size="small" onClick={loadLogs}>Retry Connection</Button>
        </Box>
      ) : (
        <DataTable
          columns={columns}
          rows={logs}
          loading={loading}
          defaultSortBy="createdAt"
          emptyMessage="Audit history begins from system logging activation. No audit events match current filters."
        />
      )}

      {/* Detail Modal */}
      <DetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Audit Event: ${selectedLog?.action || ''}`}
        data={selectedLog}
        fields={[
          {
            key: 'createdAt',
            label: 'Timestamp',
            render: (val) => formatDateTime(val, 'yyyy-MM-dd HH:mm:ss.SSS'),
          },
          { key: 'userName', label: 'User Name' },
          { key: 'userRole', label: 'User Role' },
          { key: 'action', label: 'Action Type' },
          { key: 'entityType', label: 'Entity Type' },
          { key: 'entityId', label: 'Entity ID' },
          { key: 'description', label: 'Description' },
          { key: 'severity', label: 'Severity Level' },
          { key: 'ipAddress', label: 'IP Address' },
          {
            key: 'metadata',
            label: 'Sanitized Transaction Metadata',
            render: (val) => val && Object.keys(val).length > 0 ? JSON.stringify(val, null, 2) : 'No extra metadata',
          },
        ]}
      />
    </Box>
  );
}
