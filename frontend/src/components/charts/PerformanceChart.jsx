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
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { premiumOptions, withGradient, getThemeMode, CHART_COLORS } from '../../utils/chart';
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
  Filler,
  RadialLinearScale
);

export default function PerformanceChart({
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
        <LoadingSpinner fullPage={false} message="Analyzing workforce performance..." size={30} />
      </Box>
    );
  }

  if (!data || !labels || labels.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={height}>
        <Typography color="text.secondary" variant="body2" fontWeight={500}>
          No performance analytics recorded
        </Typography>
      </Box>
    );
  }

  const datasets = Array.isArray(data)
    ? data
    : [{ label: 'Efficiency Index', data, borderColor: CHART_COLORS.maroon }];

  const chartData = {
    labels,
    datasets: datasets.map((ds) =>
      type === 'radar'
        ? {
            ...ds,
            fill: true,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            backgroundColor: 'rgba(89,23,27,0.18)',
            borderColor: ds.borderColor || CHART_COLORS.maroon,
            pointBackgroundColor: ds.borderColor || CHART_COLORS.maroon,
          }
        : withGradient(
            {
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointRadius: 3,
              pointHoverRadius: 6,
              ...ds,
            },
            isDark
          )
    ),
  };

  let ChartComponent;
  if (type === 'radar') ChartComponent = Radar;
  else if (type === 'bar') ChartComponent = Bar;
  else ChartComponent = Line;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          color: isDark ? '#C4B0A4' : '#7A6A63',
          font: { family: 'Inter', size: 12, weight: 600 },
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(26,16,18,0.95)' : 'rgba(44,26,26,0.94)',
        titleColor: '#FED7B8',
        bodyColor: '#FFF8F2',
        padding: 14,
        cornerRadius: 12,
        usePointStyle: true,
      },
    },
    scales: {
      r: {
        angleLines: { color: isDark ? 'rgba(254,215,184,0.14)' : 'rgba(89,23,27,0.1)' },
        grid: { color: isDark ? 'rgba(254,215,184,0.14)' : 'rgba(89,23,27,0.1)' },
        pointLabels: {
          color: isDark ? '#C4B0A4' : '#7A6A63',
          font: { family: 'Inter', size: 11.5, weight: 600 },
        },
        ticks: {
          color: isDark ? '#8A7A6E' : '#B39A8C',
          backdropColor: 'transparent',
          font: { family: 'Inter', size: 10 },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ height, position: 'relative', width: '100%' }}>
        <ChartComponent
          data={chartData}
          options={type === 'radar' ? radarOptions : premiumOptions(options, isDark)}
        />
      </Box>
    </motion.div>
  );
}
