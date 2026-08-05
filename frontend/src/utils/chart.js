const MAROON = '#59171B';

export const CHART_COLORS = {
  maroon: '#59171B',
  maroonLight: '#7A2328',
  maroonSoft: '#A45A4A',
  cream: '#FED7B8',
  gold: '#E8A06B',
  teal: '#2C8C8C',
  green: '#16A34A',
};

export function getThemeMode() {
  if (typeof window === 'undefined') return 'light';
  return document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function withGradient(ds, isDark) {
  if (ds._noGradient) return ds;
  const color = ds.borderColor || MAROON;
  const alpha = ds._fillAlpha ?? 0.18;
  return {
    ...ds,
    backgroundColor: (context) => {
      const { ctx, chartArea } = context.chart;
      if (!chartArea) return hexToRgba(color, alpha);
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, hexToRgba(color, alpha));
      gradient.addColorStop(1, hexToRgba(color, 0.01));
      return gradient;
    },
  };
}

export function premiumOptions(options = {}, isDark = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    ...options,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 18,
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
        boxPadding: 6,
        usePointStyle: true,
        borderColor: 'rgba(254,215,184,0.25)',
        borderWidth: 1,
        titleFont: { family: 'Inter', weight: 700, size: 13 },
        bodyFont: { family: 'Inter', size: 12.5 },
      },
      ...(options.plugins || {}),
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? 'rgba(254,215,184,0.06)' : 'rgba(89,23,27,0.05)', drawBorder: false },
        border: { display: false },
        ticks: {
          color: isDark ? '#8A7A6E' : '#B39A8C',
          font: { family: 'Inter', size: 11 },
          padding: 8,
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: isDark ? '#8A7A6E' : '#B39A8C',
          font: { family: 'Inter', size: 11 },
        },
      },
      ...(options.scales || {}),
    },
  };
}

export function lineDataset(label, data, { color = MAROON, dash = false, fill = true, width = 2.5 } = {}) {
  return {
    label,
    data,
    borderColor: color,
    borderWidth: width,
    borderDash: dash ? [6, 6] : undefined,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointBackgroundColor: color,
    pointBorderColor: '#FFFFFF',
    pointBorderWidth: 2,
    tension: 0.45,
    fill,
  };
}
