import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale } from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale);

export default function PerformanceChart({ data, labels, type = 'line', options, loading = false, height = 300 }) {
  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />;
  }

  if (!data || !labels || labels.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={height}>
        <Typography color="text.secondary">No performance data</Typography>
      </Box>
    );
  }

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      y: { beginAtZero: true, grid: { drawBorder: false } },
      x: { grid: { display: false } },
    },
    ...options,
  };

  const datasets = Array.isArray(data) ? data : [{ label: 'Performance', data, borderColor: '#3F51B5', backgroundColor: 'rgba(63,81,181,0.1)' }];

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

  let ChartComponent;
  if (type === 'radar') ChartComponent = Radar;
  else if (type === 'bar') ChartComponent = Bar;
  else ChartComponent = Line;

  return (
    <Box sx={{ height, position: 'relative' }}>
      <ChartComponent data={chartData} options={type === 'radar' ? { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } : defaultOptions} />
    </Box>
  );
}
