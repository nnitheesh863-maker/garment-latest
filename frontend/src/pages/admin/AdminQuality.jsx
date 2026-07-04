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
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import { toast } from 'react-toastify';
import { qualityApi } from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import ProductionChart from '../../components/charts/ProductionChart';
import { formatDate } from '../../utils/helpers';
import { getStatusColor } from '../../utils/helpers';
import { QUALITY_GRADE } from '../../utils/constants';

const gradeColors = { A: 'success', B: 'info', C: 'warning', D: 'error' };

const inspectionTypes = ['incoming', 'in_process', 'final'];

const emptyForm = {
  order: '',
  type: 'incoming',
  inspector: '',
  grade: 'A',
  notes: '',
  defects: '',
};

export default function AdminQuality() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, pending: 0, passRate: 0 });
  const [filterType, setFilterType] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [trendData, setTrendData] = useState(null);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, analyticsRes] = await Promise.all([
        qualityApi.list(),
        qualityApi.getAnalytics(),
      ]);

      const data = listRes.data?.data || listRes.data?.quality || [];
      setInspections(data);

      const passed = data.filter((q) => q.grade === 'A' || q.grade === 'B').length;
      const failed = data.filter((q) => q.grade === 'D').length;
      const pending = data.filter((q) => !q.grade).length;
      setStats({
        total: data.length,
        passed,
        failed,
        pending,
        passRate: data.length > 0 ? Math.round((passed / data.length) * 100) : 0,
      });

      const analytics = analyticsRes.data || {};
      if (analytics.dailyRates || analytics.trend) {
        const trend = analytics.dailyRates || analytics.trend || [];
        setTrendData({
          labels: trend.map((t) => t.date),
          datasets: [
            {
              label: 'Pass Rate %',
              data: trend.map((t) => t.rate),
              borderColor: '#66BB6A',
              backgroundColor: 'rgba(102,187,106,0.1)',
            },
          ],
        });
      }
    } catch {
      setInspections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInspections(); }, [loadInspections]);

  const filteredInspections = (inspections || []).filter((q) => {
    if (filterType && q.type !== filterType) return false;
    if (filterGrade && q.grade !== filterGrade) return false;
    if (dateFrom && new Date(q.date || q.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(q.date || q.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const handleViewDetail = async (inspection) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await qualityApi.get(inspection._id);
      setDetailData(res.data?.data || res.data?.quality || res.data);
    } catch {
      setDetailData(inspection);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenForm = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFormSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        defects: form.defects ? form.defects.split('\n').filter(Boolean).map((d) => ({ description: d })) : [],
      };
      await qualityApi.create(payload);
      toast.success('Inspection recorded');
      setFormOpen(false);
      loadInspections();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const StatCard = ({ label, value, color, subtitle }) => (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );

  const columns = [
    { id: 'inspectionNumber', label: 'Inspection #', sortable: true, render: (val, row) => val || row._id?.slice(-6) || '-' },
    { id: 'order', label: 'Order', render: (val, row) => val?.orderNumber || val || '-' },
    {
      id: 'type', label: 'Type', render: (val) => (
        <Chip label={val?.replace(/_/g, ' ') || '-'} size="small" variant="outlined" />
      ),
    },
    { id: 'inspector', label: 'Inspector', render: (val) => val || '-' },
    {
      id: 'grade', label: 'Grade', render: (val) => val ? (
        <Chip label={val} size="small" color={gradeColors[val] || 'default'} />
      ) : (
        <Chip label="Pending" size="small" variant="outlined" />
      ),
    },
    { id: 'date', label: 'Date', render: (val, row) => formatDate(val || row.createdAt) },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Quality Control</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenForm}>New Inspection</Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Inspections" value={loading ? '-' : stats.total} color="primary.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Pass Rate" value={loading ? '-' : `${stats.passRate}%`} color="success.main" subtitle={`${stats.passed} passed`} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Fail Rate" value={loading ? '-' : `${stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%`} color="error.main" subtitle={`${stats.failed} failed`} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Pending" value={loading ? '-' : stats.pending} color="warning.main" />
        </Grid>
      </Grid>

      {trendData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>Quality Trends</Typography>
            <ProductionChart
              data={trendData.datasets}
              labels={trendData.labels}
              type="line"
              height={200}
            />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={3}>
          <TextField select size="small" label="Type" fullWidth value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">All Types</MenuItem>
            {inspectionTypes.map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField select size="small" label="Grade" fullWidth value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
            <MenuItem value="">All Grades</MenuItem>
            {Object.values(QUALITY_GRADE).map((g) => <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
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
        rows={filteredInspections}
        loading={loading}
        onRowClick={handleViewDetail}
        searchPlaceholder="Search inspections..."
      />

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Inspection Details
          <IconButton onClick={() => setDetailOpen(false)} size="small" sx={{ position: 'absolute', right: 16, top: 16 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box py={3}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} height={24} sx={{ mb: 1.5 }} />)}
            </Box>
          ) : detailData ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Inspection #{detailData.inspectionNumber || detailData._id?.slice(-6)}</Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip label={detailData.type?.replace(/_/g, ' ')} size="small" variant="outlined" />
                  {detailData.grade && (
                    <Chip label={`Grade ${detailData.grade}`} size="small" color={gradeColors[detailData.grade] || 'default'} />
                  )}
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Order</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.order?.orderNumber || detailData.order || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Inspector</Typography>
                <Typography variant="body2" fontWeight={500}>{detailData.inspector || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(detailData.date || detailData.createdAt)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Result</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.grade
                    ? ['A', 'B'].includes(detailData.grade) ? 'Passed' : 'Failed'
                    : 'Pending'}
                </Typography>
              </Grid>
              {detailData.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" fontWeight={500}>{detailData.notes}</Typography>
                </Grid>
              )}
              {detailData.defects && detailData.defects.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Defects</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Severity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailData.defects.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>{d.description || d.name || '-'}</TableCell>
                            <TableCell>
                              {d.severity && (
                                <Chip label={d.severity} size="small" color={d.severity === 'critical' ? 'error' : d.severity === 'major' ? 'warning' : 'default'} />
                              )}
                            </TableCell>
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
      </Dialog>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          New Inspection
          <IconButton onClick={() => setFormOpen(false)} size="small" sx={{ position: 'absolute', right: 16, top: 16 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField full size="small" label="Order ID" value={form.order} onChange={handleFormChange('order')} />
            </Grid>
            <Grid item xs={6}>
              <TextField select full size="small" label="Type" value={form.type} onChange={handleFormChange('type')}>
                {inspectionTypes.map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField full size="small" label="Inspector" value={form.inspector} onChange={handleFormChange('inspector')} />
            </Grid>
            <Grid item xs={6}>
              <TextField select full size="small" label="Grade" value={form.grade} onChange={handleFormChange('grade')}>
                {Object.values(QUALITY_GRADE).map((g) => <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField full size="small" label="Notes" multiline rows={2} value={form.notes} onChange={handleFormChange('notes')} />
            </Grid>
            <Grid item xs={12}>
              <TextField full size="small" label="Defects (one per line)" multiline rows={3} value={form.defects} onChange={handleFormChange('defects')} placeholder="Defect description 1&#10;Defect description 2" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Record Inspection'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
