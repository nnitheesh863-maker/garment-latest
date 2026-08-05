import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  MenuItem,
  TextField,
  LinearProgress,
  Chip,
  Avatar,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PerformanceChart from '../../components/charts/PerformanceChart';

export default function Performance() {
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('monthly');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const performanceData = {
    daily: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [78, 85, 82, 90, 88, 75, 70],
    },
    weekly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [82, 86, 84, 90],
    },
    monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [70, 73, 78, 75, 80, 82, 85, 83, 87, 90, 88, 92],
    },
  };

  const currentData = performanceData[viewType] || performanceData.monthly;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>My Performance</Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#59171B', width: 48, height: 48, mx: 'auto', mb: 1 }}><StarIcon /></Avatar>
              <Typography variant="h4" fontWeight={700}>92%</Typography>
              <Typography variant="body2" color="text.secondary">Performance Score</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#16A34A', width: 48, height: 48, mx: 'auto', mb: 1 }}><CheckCircleIcon /></Avatar>
              <Typography variant="h4" fontWeight={700}>95%</Typography>
              <Typography variant="body2" color="text.secondary">Quality Score</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#E8A06B', width: 48, height: 48, mx: 'auto', mb: 1 }}><SpeedIcon /></Avatar>
              <Typography variant="h4" fontWeight={700}>88%</Typography>
              <Typography variant="body2" color="text.secondary">Efficiency</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#2C8C8C', width: 48, height: 48, mx: 'auto', mb: 1 }}><TrendingUpIcon /></Avatar>
              <Typography variant="h4" fontWeight={700}>+5%</Typography>
              <Typography variant="body2" color="text.secondary">Last Month Growth</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Production Trend</Typography>
                <TextField select size="small" value={viewType} onChange={(e) => setViewType(e.target.value)} sx={{ minWidth: 120 }}>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </TextField>
              </Box>
              <PerformanceChart
                data={[{ label: 'My Performance', data: currentData.data, borderColor: '#59171B', backgroundColor: 'rgba(89,23,27,0.08)' }]}
                labels={currentData.labels}
                height={280}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Skill Proficiency</Typography>
              {[
                { skill: 'Cutting', level: 95 },
                { skill: 'Sewing', level: 88 },
                { skill: 'Embroidery', level: 72 },
                { skill: 'Quality Inspection', level: 90 },
                { skill: 'Packaging', level: 85 },
              ].map((s) => (
                <Box key={s.skill} mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">{s.skill}</Typography>
                    <Typography variant="body2" fontWeight={600}>{s.level}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={s.level} sx={{ height: 8, borderRadius: 4 }} color={s.level >= 85 ? 'success' : s.level >= 70 ? 'primary' : 'warning'} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Task Completion Rate</Typography>
              <PerformanceChart
                type="bar"
                data={[
                  { label: 'Completed', data: [18, 22, 20, 25, 28, 24, 30], backgroundColor: '#16A34A' },
                  { label: 'Assigned', data: [20, 25, 22, 28, 30, 26, 32], backgroundColor: '#59171B' },
                ]}
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                height={200}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Quality Trend</Typography>
              <PerformanceChart
                data={[{ label: 'Quality Score', data: [88, 90, 87, 92, 94, 91, 95, 93, 96, 94, 97, 95], borderColor: '#E8A06B', backgroundColor: 'rgba(232,160,107,0.12)' }]}
                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                height={200}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
