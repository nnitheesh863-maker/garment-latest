import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { toast } from 'react-toastify';
import { defectApi } from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import { formatDate, formatDateTime, timeAgo } from '../../utils/helpers';

const STATUS_COLORS = {
  pending: 'warning',
  reviewed: 'info',
  resolved: 'success',
};

export default function Defects() {
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoDialog, setPhotoDialog] = useState({ open: false, url: '' });
  const [statusUpdating, setStatusUpdating] = useState(null);

  const fetchDefects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await defectApi.getAll();
      setDefects(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to fetch defects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const handleUpdateStatus = async (id, status) => {
    setStatusUpdating(`${id}-${status}`);
    try {
      await defectApi.updateStatus(id, { status });
      toast.success(`Defect marked as ${status}`);
      fetchDefects();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const getEmployeeName = (row) => {
    const emp = row.employee;
    if (emp?.profile?.firstName) {
      return `${emp.profile.firstName} ${emp.profile.lastName || ''}`.trim();
    }
    return emp?.email || 'Unknown';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = [
    {
      id: 'employee',
      label: 'Employee Name',
      render: (val, row) => {
        const name = getEmployeeName(row);
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
              {getInitials(name)}
            </Avatar>
            <Typography variant="body2">{name}</Typography>
          </Box>
        );
      },
    },
    { id: 'garmentType', label: 'Garment Type' },
    {
      id: 'description',
      label: 'Description',
      render: (val) => {
        const text = val || '-';
        const truncated =
          text.length > 60 ? text.substring(0, 60) + '...' : text;
        return (
          <Tooltip title={text}>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 280,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {truncated}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      id: 'photo',
      label: 'Photo',
      render: (val) => {
        if (!val) {
          return (
            <Typography variant="body2" color="text.disabled">
              No photo
            </Typography>
          );
        }
        return (
          <Box
            component="img"
            src={val}
            alt="Defect"
            onClick={() => setPhotoDialog({ open: true, url: val })}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              objectFit: 'cover',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { opacity: 0.8 },
            }}
          />
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (val) => (
        <Chip
          label={val ? val.charAt(0).toUpperCase() + val.slice(1) : 'Unknown'}
          color={STATUS_COLORS[val] || 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Date/Time',
      render: (val) => (
        <Tooltip title={formatDateTime(val)}>
          <Typography variant="body2">{timeAgo(val)}</Typography>
        </Tooltip>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (val, row) => (
        <Box display="flex" gap={0.5}>
          {row.status !== 'reviewed' && row.status !== 'resolved' && (
            <Button
              size="small"
              variant="outlined"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(row._id, 'reviewed');
              }}
              disabled={statusUpdating === `${row._id}-reviewed`}
            >
              Mark Reviewed
            </Button>
          )}
          {row.status !== 'resolved' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(row._id, 'resolved');
              }}
              disabled={statusUpdating === `${row._id}-resolved`}
            >
              Mark Resolved
            </Button>
          )}
          {row.status === 'resolved' && (
            <Chip label="Resolved" color="success" size="small" variant="outlined" />
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Defect Reports & Resolution"
        subtitle="Floor operator issue logs, photo attachments, and quality manager resolution statuses."
        badge="Quality Assurance"
      />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Reports
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {defects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {defects.filter((d) => d.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Reviewed
              </Typography>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {defects.filter((d) => d.status === 'reviewed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Resolved
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {defects.filter((d) => d.status === 'resolved').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={defects}
        loading={loading}
        searchPlaceholder="Search defects..."
      />

      <Dialog
        open={photoDialog.open}
        onClose={() => setPhotoDialog({ open: false, url: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Defect Photo
          <IconButton
            onClick={() => setPhotoDialog({ open: false, url: '' })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            size="small"
          >
            &times;
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="img"
            src={photoDialog.url}
            alt="Full size defect"
            sx={{
              width: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialog({ open: false, url: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
