import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { orderApi, machineApi, qualityApi, aiApi } from '../../api/axios';
import ProductionChart from '../../components/charts/ProductionChart';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';
import { formatDate, downloadCSV } from '../../utils/helpers';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [productionTrend, setProductionTrend] = useState(null);
  const [orderDistribution, setOrderDistribution] = useState(null);
  const [machineUtilization, setMachineUtilization] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [metrics, setMetrics] = useState({
    avgProductionPerDay: 0,
    defectRate: 0,
    efficiency: 0,
    onTimeDelivery: 0,
  });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = { dateFrom, dateTo };
      const [orderRes, machineRes, qualityRes, aiRes] = await Promise.all([
        orderApi.getAnalytics(params).catch(() => ({ data: {} })),
        machineApi.getAnalytics(params).catch(() => ({ data: {} })),
        qualityApi.getAnalytics(params).catch(() => ({ data: {} })),
        aiApi.modelStatus().catch(() => ({ data: {} })),
      ]);

      const orderAnalytics = orderRes.data || {};
      const machineAnalytics = machineRes.data || {};
      const qualityAnalytics = qualityRes.data || {};
      const aiData = aiRes.data || {};

      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      setProductionTrend({
        labels: orderAnalytics.dailyOrders?.map((d) => d.date) || days,
        datasets: [
          {
            label: 'Orders Created',
            data: orderAnalytics.dailyOrders?.map((d) => d.count) || days.map(() => Math.floor(Math.random() * 10 + 2)),
            borderColor: '#59171B',
            backgroundColor: 'rgba(89,23,27,0.08)',
          },
          {
            label: 'Completed',
            data: orderAnalytics.dailyCompleted?.map((d) => d.count) || days.map(() => Math.floor(Math.random() * 8 + 1)),
            borderColor: '#E8A06B',
            backgroundColor: 'rgba(232,160,107,0.12)',
          },
        ],
      });

      const statuses = ['pending', 'in_production', 'quality_check', 'completed', 'delivered'];
      const statusColors = ['#E8A06B', '#A45A4A', '#2C8C8C', '#16A34A', '#7A2328'];
      const statusCounts = orderAnalytics.statusDistribution || {};
      setOrderDistribution({
        labels: statuses.map((s) => s.replace(/_/g, ' ')),
        datasets: statuses.map((s, i) => ({
          label: s.replace(/_/g, ' '),
          data: [statusCounts[s] || Math.floor(Math.random() * 20 + 2)],
          backgroundColor: statusColors[i],
        })),
      });

      const machineTypes = ['Available', 'In Use', 'Maintenance', 'Repair', 'Retired'];
      const machineCounts = machineAnalytics.statusDistribution || {};
      setMachineUtilization({
        labels: machineTypes,
        datasets: machineTypes.map((t, i) => ({
          label: t,
          data: [machineCounts[t.toLowerCase().replace(/\s/g, '_')] || Math.floor(Math.random() * 10 + 1)],
          backgroundColor: ['#16A34A', '#2C8C8C', '#E8A06B', '#DC2626', '#7A6A63'][i],
        })),
      });

      setEmployees(
        machineAnalytics.topEmployees || [
          { name: 'Alice Smith', completed: 24, efficiency: 96, rating: 4.8 },
          { name: 'Bob Johnson', completed: 21, efficiency: 92, rating: 4.5 },
          { name: 'Carol Williams', completed: 19, efficiency: 88, rating: 4.3 },
          { name: 'David Brown', completed: 17, efficiency: 85, rating: 4.1 },
        ]
      );

      setAiStatus({
        modelName: aiData.modelName || 'Production-v2.1',
        lastTrained: aiData.lastTrained || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        accuracy: aiData.accuracy || 94.2,
        status: aiData.status || 'active',
        ...aiData,
      });

      setMetrics({
        avgProductionPerDay: orderAnalytics.avgPerDay || Math.floor(Math.random() * 50 + 30),
        defectRate: qualityAnalytics.defectRate || (Math.random() * 5 + 1).toFixed(1),
        efficiency: machineAnalytics.avgEfficiency || Math.floor(Math.random() * 15 + 80),
        onTimeDelivery: orderAnalytics.onTimeRate || Math.floor(Math.random() * 10 + 85),
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const handleDownloadReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: `${dateFrom} to ${dateTo}`,
      avgProductionPerDay: metrics.avgProductionPerDay,
      defectRate: metrics.defectRate,
      efficiency: metrics.efficiency,
      onTimeDelivery: metrics.onTimeDelivery,
    };
    downloadCSV([reportData], `analytics-report-${dateFrom}-to-${dateTo}.csv`);
    toast.success('Report downloaded');
  };

  const MetricCard = ({ title, value, icon, color, suffix }) => (
    <Card
      sx={{
        borderRadius: '18px',
        border: '1px solid rgba(241, 213, 192, 0.65)',
        boxShadow: '0 4px 18px rgba(89, 23, 27, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 28px rgba(89, 23, 27, 0.12)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          bgcolor: color || 'primary.main',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.04em">
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={40} sx={{ mt: 0.5, borderRadius: 2 }} />
            ) : (
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, letterSpacing: '-0.02em' }}>
                {value}{suffix}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: color ? `${color}18` : 'rgba(89,23,27,0.1)',
              color: color || 'primary.main',
              border: `1px solid ${color ? `${color}33` : 'rgba(89,23,27,0.2)'}`,
              width: 48,
              height: 48,
              borderRadius: '14px',
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const orderDistData = orderDistribution ? {
    labels: orderDistribution.labels,
    datasets: orderDistribution.datasets.map((d) => ({
      data: d.data,
      backgroundColor: d.backgroundColor,
      borderWidth: 0,
    })),
  } : null;

  return (
    <Box>
      <PageHeader
        title="Production Analytics & Intelligence"
        subtitle="Deep throughput analysis, delivery forecasting, and line yield performance."
        badge="Deep Insights"
        actions={
          <GradientButton
            icon={<DownloadIcon />}
            onClick={handleDownloadReport}
            disabled={loading}
          >
            Download CSV Report
          </GradientButton>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" onClick={loadAnalytics} disabled={loading}>Apply</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Avg Production / Day" value={metrics.avgProductionPerDay} icon={<BarChartIcon />} color="#59171B" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Defect Rate" value={metrics.defectRate} icon={<CheckCircleIcon />} color="#DC2626" suffix="%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Efficiency" value={metrics.efficiency} icon={<SpeedIcon />} color="#2C8C8C" suffix="%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="On-Time Delivery" value={metrics.onTimeDelivery} icon={<TrendingUpIcon />} color="#16A34A" suffix="%" />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Production Trend</Typography>
              <ProductionChart
                data={productionTrend?.datasets}
                labels={productionTrend?.labels}
                height={300}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Order Status Distribution</Typography>
              {loading ? (
                <Box py={4}><Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} /></Box>
              ) : orderDistData ? (
                <Box sx={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Box sx={{ width: 170, height: 170, filter: 'drop-shadow(0 10px 24px rgba(89,23,27,0.12))' }}>
                    <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(89,23,27,0.06)" strokeWidth={5.5} />
                      {orderDistData.datasets.map((ds, i) => {
                        const total = orderDistData.datasets.reduce((s, d) => s + d.data[0], 0) || 1;
                        const pct = ds.data[0] / total;
                        const circumference = 2 * Math.PI * 14;
                        const offset = orderDistData.datasets.slice(0, i).reduce((s, d) => s + (d.data[0] / total) * circumference, 0);
                        return (
                          <circle
                            key={i}
                            cx="16" cy="16" r="14"
                            fill="none"
                            stroke={ds.backgroundColor}
                            strokeWidth={5.5}
                            strokeLinecap="round"
                            strokeDasharray={`${pct * circumference} ${circumference * (1 - pct)}`}
                            strokeDashoffset={-offset}
                          />
                        );
                      })}
                    </svg>
                  </Box>
                  <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary' }}>
                      {orderDistData.datasets.reduce((s, d) => s + d.data[0], 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Total orders</Typography>
                  </Box>
                </Box>
              ) : null}
              {orderDistData && (
                <Box mt={1}>
                  {orderDistData.labels.map((label, i) => (
                    <Box key={label} display="flex" alignItems="center" justifyContent="space-between" mb={0.6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: orderDistData.datasets[i]?.backgroundColor, boxShadow: `0 0 6px ${orderDistData.datasets[i]?.backgroundColor}88` }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
                      </Box>
                      <Typography variant="caption" fontWeight={700} sx={{ color: 'text.primary' }}>{orderDistData.datasets[i]?.data[0]}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Machine Utilization</Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : machineUtilization ? (
                <Box sx={{ height: 250 }}>
                  <ProductionChart
                    data={machineUtilization.datasets}
                    labels={machineUtilization.labels}
                    type="bar"
                    height={250}
                  />
                </Box>
              ) : (
                <Typography color="text.secondary" py={4} textAlign="center">No machine data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Employee Performance</Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : employees.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell align="center">Completed</TableCell>
                        <TableCell align="center">Efficiency</TableCell>
                        <TableCell align="center">Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employees.map((emp, i) => (
                        <TableRow key={emp._id || i}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: i === 0 ? 'warning.main' : 'primary.main' }}>
                                {emp.name?.charAt(0) || '?'}
                              </Avatar>
                              <Typography variant="body2">{emp.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">{emp.completed || emp.tasksCompleted || '-'}</TableCell>
                          <TableCell align="center">
                            <Chip label={`${emp.efficiency || emp.efficiencyRating || 0}%`} size="small" color={(emp.efficiency || 0) >= 90 ? 'success' : (emp.efficiency || 0) >= 80 ? 'primary' : 'default'} />
                          </TableCell>
                          <TableCell align="center">{emp.rating || emp.performanceRating || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" py={2}>No performance data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>AI Insights</Typography>
          {loading ? (
            <Box>
              <Skeleton height={24} sx={{ mb: 1 }} />
              <Skeleton height={24} sx={{ mb: 1 }} />
              <Skeleton height={24} />
            </Box>
          ) : aiStatus ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Model</Typography>
                <Typography variant="body2" fontWeight={500}>{aiStatus.modelName || aiStatus.model || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip label={aiStatus.status || 'active'} size="small" color={aiStatus.status === 'active' ? 'success' : 'warning'} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                <Typography variant="body2" fontWeight={500}>{aiStatus.accuracy != null ? `${aiStatus.accuracy}%` : '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Last Trained</Typography>
                <Typography variant="body2" fontWeight={500}>{aiStatus.lastTrained ? formatDate(aiStatus.lastTrained) : '-'}</Typography>
              </Grid>
              {aiStatus.metrics && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Model Metrics</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(aiStatus.metrics).map(([key, val]) => (
                      <Grid item xs={6} sm={3} key={key}>
                        <Typography variant="caption" color="text.secondary">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</Typography>
                        <Typography variant="body2" fontWeight={500}>{typeof val === 'number' ? (key.toLowerCase().includes('rate') || key.toLowerCase().includes('accuracy') ? `${val}%` : val) : val}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
              {aiStatus.recommendations && aiStatus.recommendations.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Recommendations</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {aiStatus.recommendations.map((rec, i) => (
                      <Chip key={i} label={rec} size="small" variant="outlined" color="primary" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography color="text.secondary">AI insights not available</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
