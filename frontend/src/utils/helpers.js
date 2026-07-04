import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { STATUS_COLORS } from './constants';

export function formatDate(date, fmt = 'MMM dd, yyyy') {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return 'Invalid date';
  }
}

export function formatDateTime(date, fmt = 'MMM dd, yyyy HH:mm') {
  return formatDate(date, fmt);
}

export function getStatusColor(status) {
  return STATUS_COLORS[status] || '#78909C';
}

export function truncateText(text, length = 50) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

export function calculateProgress(target, current) {
  if (!target || target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = typeof date === 'string' ? parseISO(date) : date;
  const mins = differenceInMinutes(now, d);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = differenceInHours(now, d);
  if (hours < 24) return `${hours}h ago`;
  const days = differenceInDays(now, d);
  if (days < 7) return `${days}d ago`;
  return format(d, 'MMM dd');
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function downloadCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
