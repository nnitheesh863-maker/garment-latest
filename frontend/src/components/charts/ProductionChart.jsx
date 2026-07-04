import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function ProductionChart({ data, labels, type = 'line', options, loading = false, height = 300 }) {
  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />;
  }

  if (!data || !labels || labels.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={height}>
        <Typography color="text.secondary">No data available</Typography>
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

  const datasets = Array.isArray(data) ? data : [{ label: 'Production', data }];

  const chartData = {
    labels,
    datasets: datasets.map((ds) => ({
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      ...ds,
    })),
  };

  const ChartComponent = type === 'bar' ? Bar : Line;

  return (
    <Box sx={{ height, position: 'relative' }}>
      <ChartComponent data={chartData} options={defaultOptions} />
    </Box>
  );
}
