import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { premiumOptions, withGradient, getThemeMode } from '../../utils/chart';
import LoadingSpinner from '../common/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProductionChart({
  data,
  labels,
  type = 'line',
  options,
  loading = false,
  height = 300,
}) {
  const isDark = getThemeMode();

  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner fullPage={false} message="Rendering telemetry graphs..." size={30} />
      </Box>
    );
  }

  if (!data || !labels || labels.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={height}>
        <Typography color="text.secondary" variant="body2" fontWeight={500}>
          No historical telemetry data available
        </Typography>
      </Box>
    );
  }

  const datasets = Array.isArray(data) ? data : [{ label: 'Production Units', data }];

  const chartData = {
    labels,
    datasets: datasets.map((ds) => {
      const color = ds.borderColor || '#59171B';
      return withGradient(
        {
          ...ds,
          fill: ds.fill ?? true,
          tension: 0.45,
          borderWidth: ds.borderWidth || 2.5,
          pointRadius: ds.pointRadius ?? 0,
          pointHoverRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: isDark ? '#1A1012' : '#FFFFFF',
          pointBorderWidth: 2,
          ...(type === 'bar'
            ? { borderRadius: 8, maxBarThickness: 28, borderSkipped: false }
            : {}),
        },
        isDark
      );
    }),
  };

  const ChartComponent = type === 'bar' ? Bar : Line;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ height, position: 'relative', width: '100%' }}>
        <ChartComponent data={chartData} options={premiumOptions(options, isDark)} />
      </Box>
    </motion.div>
  );
}
