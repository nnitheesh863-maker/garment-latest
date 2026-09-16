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
import {
  premiumOptions,
  withGradient,
  getThemeMode,
  lineDataset,
  CHART_COLORS,
} from '../../utils/chart';
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

export default function PredictionChart({
  actual,
  predicted,
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
        <LoadingSpinner fullPage={false} message="Calculating AI forecasting models..." size={30} />
      </Box>
    );
  }

  if (!labels || labels.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={height}>
        <Typography color="text.secondary" variant="body2" fontWeight={500}>
          No prediction models generated yet
        </Typography>
      </Box>
    );
  }

  const datasets = [];
  if (actual) {
    datasets.push(
      lineDataset('Actual Output', actual, { color: CHART_COLORS.maroon, width: 2.5 })
    );
  }
  if (predicted) {
    datasets.push(
      lineDataset('AI Predicted Forecast', predicted, {
        color: CHART_COLORS.gold,
        dash: true,
        width: 2.5,
      })
    );
  }

  const chartData = {
    labels,
    datasets: datasets.map((ds) => withGradient(ds, isDark)),
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
