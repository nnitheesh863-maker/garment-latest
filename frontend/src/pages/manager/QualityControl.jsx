import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import PerformanceChart from '../../components/charts/PerformanceChart';
import { qualityApi } from '../../api/axios';
import { QUALITY_GRADE } from '../../utils/constants';
import { formatDate, getStatusColor } from '../../utils/helpers';

const mockChecks = Array.from({ length: 25 }, (_, i) => ({
  _id: `qc${i}`,
  checkId: `QC-${String(2026001 + i)}`,
  orderId: `ord${Math.floor(Math.random() * 10)}`,
  productType: ['T-Shirt', 'Shirt', 'Pant', 'Jacket'][Math.floor(Math.random() * 4)],
  quantityChecked: Math.floor(Math.random() * 100 + 20),
  passed: Math.floor(Math.random() * 80 + 10),
  failed: Math.floor(Math.random() * 10),
  grade: Object.values(QUALITY_GRADE)[Math.floor(Math.random() * 4)],
  inspector: ['Alice Smith', 'Bob Johnson', 'Carol Williams'][Math.floor(Math.random() * 3)],
  notes: Math.random() > 0.5 ? 'Minor stitching issues found' : 'All good',
  checkedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
}));

export default function QualityControl() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCheck, setNewCheck] = useState({ productType: '', quantityChecked: '', passed: '', failed: '', inspector: '', notes: '' });

  useEffect(() => {
    const timer = setTimeout(() => { setChecks(mockChecks); setLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleAddCheck = () => {
    const qc = {
      _id: `qc${Date.now()}`,
      checkId: `QC-${Math.floor(Math.random() * 1000000)}`,
      ...newCheck,
      quantityChecked: Number(newCheck.quantityChecked),
      passed: Number(newCheck.passed),
      failed: Number(newCheck.failed),
      grade: Number(newCheck.passed) / Number(newCheck.quantityChecked) >= 0.95 ? 'A' : Number(newCheck.passed) / Number(newCheck.quantityChecked) >= 0.85 ? 'B' : Number(newCheck.passed) / Number(newCheck.quantityChecked) >= 0.7 ? 'C' : 'reject',
      checkedAt: new Date().toISOString(),
    };
    setChecks((prev) => [qc, ...prev]);
    setAddDialogOpen(false);
    setNewCheck({ productType: '', quantityChecked: '', passed: '', failed: '', inspector: '', notes: '' });
    toast.success('Quality check recorded');
  };

  const filtered = checks.filter((c) => !gradeFilter || c.grade === gradeFilter);

  const avgGrade = checks.length > 0 ? Math.round(checks.reduce((s, c) => {
    const vals = { A: 95, B: 85, C: 70, reject: 40 };
    return s + (vals[c.grade] || 0);
  }, 0) / checks.length) : 0;

  const columns = [
    { id: 'checkId', label: 'Check ID' },
    { id: 'productType', label: 'Product' },
    { id: 'quantityChecked', label: 'Checked', align: 'right' },
    { id: 'passed', label: 'Passed', align: 'right' },
    { id: 'failed', label: 'Failed', align: 'right' },
    { id: 'grade', label: 'Grade', render: (val) => <StatusBadge status={val} /> },
    { id: 'inspector', label: 'Inspector' },
    { id: 'checkedAt', label: 'Date', render: (val) => formatDate(val) },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Quality Control</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>New Check</Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Total Checks</Typography>
            <Typography variant="h4" fontWeight={700}>{checks.length}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Avg Quality Score</Typography>
            <Typography variant="h4" fontWeight={700} color={avgGrade >= 85 ? 'success.main' : avgGrade >= 70 ? 'warning.main' : 'error.main'}>{avgGrade}%</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Grade A</Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">{checks.filter((c) => c.grade === 'A').length}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Rejected</Typography>
            <Typography variant="h4" fontWeight={700} color="error.main">{checks.filter((c) => c.grade === 'reject').length}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField select size="small" label="Grade" fullWidth value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <MenuItem value="">All Grades</MenuItem>
            {Object.values(QUALITY_GRADE).map((g) => <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <DataTable columns={columns} rows={filtered} loading={loading} searchPlaceholder="Search quality checks..." />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Quality Trend</Typography>
              <PerformanceChart
                data={[{ label: 'Quality Score', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + 82)), borderColor: '#3F51B5', backgroundColor: 'rgba(63,81,181,0.1)' }]}
                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                height={200}
              />
              <Box mt={2}>
                <Typography variant="subtitle2" mb={1}>Grade Distribution</Typography>
                {['A', 'B', 'C', 'reject'].map((grade) => {
                  const count = checks.filter((c) => c.grade === grade).length;
                  const pct = checks.length > 0 ? (count / checks.length) * 100 : 0;
                  return (
                    <Box key={grade} mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption">{grade === 'reject' ? 'Reject' : `Grade ${grade}`}</Typography>
                        <Typography variant="caption">{count} ({Math.round(pct)}%)</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3 }} color={grade === 'A' ? 'success' : grade === 'B' ? 'primary' : grade === 'C' ? 'warning' : 'error'} />
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Quality Check</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField select full size="small" label="Product Type" value={newCheck.productType} onChange={(e) => setNewCheck((p) => ({ ...p, productType: e.target.value }))}>
                <MenuItem value="T-Shirt">T-Shirt</MenuItem>
                <MenuItem value="Shirt">Shirt</MenuItem>
                <MenuItem value="Pant">Pant</MenuItem>
                <MenuItem value="Jacket">Jacket</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField full size="small" label="Quantity Checked" type="number" value={newCheck.quantityChecked} onChange={(e) => setNewCheck((p) => ({ ...p, quantityChecked: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField full size="small" label="Passed" type="number" value={newCheck.passed} onChange={(e) => setNewCheck((p) => ({ ...p, passed: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField full size="small" label="Failed" type="number" value={newCheck.failed} onChange={(e) => setNewCheck((p) => ({ ...p, failed: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField full size="small" label="Inspector" value={newCheck.inspector} onChange={(e) => setNewCheck((p) => ({ ...p, inspector: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField full size="small" label="Notes" value={newCheck.notes} onChange={(e) => setNewCheck((p) => ({ ...p, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCheck}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
