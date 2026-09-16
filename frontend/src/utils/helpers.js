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

export function formatTime12(timeVal) {
  if (!timeVal) return '-';
  try {
    if (typeof timeVal === 'string') {
      const trimmed = timeVal.trim();
      // Match already formatted 12h like "10:50 PM" or "10:50 am"
      const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = match12[2];
        let ampm = match12[3] ? match12[3].toUpperCase() : null;
        if (!ampm) {
          ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
        } else {
          if (h > 12) h = h % 12 || 12;
          if (h === 0) h = 12;
        }
        return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
      }
      const d = parseISO(trimmed);
      if (!isNaN(d.getTime())) {
        return format(d, 'hh:mm a');
      }
    } else if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
      return format(timeVal, 'hh:mm a');
    }
  } catch {
    // fallback
  }
  return '-';
}

export function formatHoursMinutes(hoursDecimalOrMins, unitFormat = 'short') {
  if (hoursDecimalOrMins == null || isNaN(hoursDecimalOrMins)) return unitFormat === 'long' ? '0 hrs 0 mins' : '0h 0m';
  const totalMins = Math.round(Number(hoursDecimalOrMins) * 60);
  const hours = Math.floor(Math.abs(totalMins) / 60);
  const mins = Math.abs(totalMins) % 60;
  
  if (unitFormat === 'long') {
    if (hours === 0) return `${mins} mins`;
    if (mins === 0) return `${hours} hrs`;
    return `${hours} hrs ${mins} mins`;
  }
  return `${hours}h ${mins}m`;
}

export function getWorkingDuration(clockIn, clockOut = null, fallbackHours = null) {
  if (!clockIn) {
    if (fallbackHours != null && fallbackHours > 0) {
      return {
        hours: Math.floor(fallbackHours),
        minutes: Math.round((fallbackHours % 1) * 60),
        formatted: formatHoursMinutes(fallbackHours, 'short'),
        detailed: formatHoursMinutes(fallbackHours, 'long'),
      };
    }
    return { hours: 0, minutes: 0, formatted: '0h 0m', detailed: '0 hrs 0 mins' };
  }
  
  try {
    const start = typeof clockIn === 'string' ? parseISO(clockIn) : new Date(clockIn);
    const end = clockOut ? (typeof clockOut === 'string' ? parseISO(clockOut) : new Date(clockOut)) : new Date();
    
    if (isNaN(start.getTime())) {
      if (fallbackHours != null) {
        return {
          hours: Math.floor(fallbackHours),
          minutes: Math.round((fallbackHours % 1) * 60),
          formatted: formatHoursMinutes(fallbackHours, 'short'),
          detailed: formatHoursMinutes(fallbackHours, 'long'),
        };
      }
      return { hours: 0, minutes: 0, formatted: '0h 0m', detailed: '0 hrs 0 mins' };
    }
    
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const totalMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMins / 60);
    const minutes = totalMins % 60;
    
    return {
      hours,
      minutes,
      formatted: `${hours}h ${minutes}m`,
      detailed: hours === 0 ? `${minutes} mins` : minutes === 0 ? `${hours} hrs` : `${hours} hrs ${minutes} mins`,
    };
  } catch {
    return { hours: 0, minutes: 0, formatted: '0h 0m', detailed: '0 hrs 0 mins' };
  }
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
