import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function PredictionChart({ actual, predicted, labels, type = 'line', options, loading = false, height = 300 }) {
  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />;
  }

  if (!labels || labels.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={height}>
        <Typography color="text.secondary">No prediction data</Typography>
      </Box>
    );
  }

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { drawBorder: false } },
      x: { grid: { display: false } },
    },
    ...options,
  };

  const datasets = [];
  if (actual) {
    datasets.push({
      label: 'Actual',
      data: actual,
      borderColor: '#3F51B5',
      backgroundColor: 'rgba(63,81,181,0.1)',
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.4,
      fill: true,
    });
  }
  if (predicted) {
    datasets.push({
      label: 'Predicted',
      data: predicted,
      borderColor: '#FF9800',
      backgroundColor: 'rgba(255,152,0,0.1)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 3,
      tension: 0.4,
      fill: true,
    });
  }

  const chartData = { labels, datasets };

  const ChartComponent = type === 'bar' ? Bar : Line;

  return (
    <Box sx={{ height, position: 'relative' }}>
      <ChartComponent data={chartData} options={defaultOptions} />
    </Box>
  );
}
