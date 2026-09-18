import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Button,
  Skeleton,
  Divider,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedIcon from '@mui/icons-material/Verified';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import FactoryIcon from '@mui/icons-material/Factory';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useSocket } from '../../hooks/useSocket';
import { adminDashboardApi } from '../../api/axios';
import ProductionChart from '../../components/charts/ProductionChart';
import StatCard from '../../components/common/StatCard';
import GlassCard from '../../components/common/GlassCard';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import { timeAgo } from '../../utils/helpers';
import { CHART_COLORS } from '../../utils/chart';
import AiCommandCenter from '../../components/admin/AiCommandCenter';

const ORDER_COLORS = ['#E8A06B', '#A45A4A', '#7A2328', '#59171B', '#16A34A', '#2C8C8C'];
const MACHINE_COLORS = {
  available: '#16A34A',
  in_use: '#2C8C8C',
  maintenance: '#E8A06B',
  repair: '#DC2626',
  retired: '#9CA3AF',
};
const SEVERITY_TONE = {
  info: { color: '#2C8C8C', bg: 'rgba(44,140,140,0.12)' },
  warning: { color: '#E8A06B', bg: 'rgba(232,160,107,0.14)' },
  critical: { color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
};

function getHealthColor(score) {
  if (score >= 85) return '#16A34A';
  if (score >= 70) return '#2C8C8C';
  if (score >= 55) return '#E8A06B';
  return '#DC2626';
}

function HealthGauge({ score, grade, label, generatedAt }) {
  const color = getHealthColor(score);
  const pct = Math.max(0, Math.min(100, score || 0));
  const r = 76;
  const circumference = 2 * Math.PI * r;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" py={1}>
      <Box sx={{ position: 'relative', width: 180, height: 180, mb: 2, flexShrink: 0 }}>
        <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(89,23,27,0.06)" strokeWidth={12} />
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease',
              filter: `drop-shadow(0 4px 12px ${color}44)`,
            }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1, color: 'text.primary', letterSpacing: '-0.02em' }}>
            <AnimatedNumber value={score} />
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em', mt: 0.5, fontSize: 10 }}>
            FACTORY HEALTH
          </Typography>
          <Chip
            label={`Grade ${grade} · ${label}`}
            size="small"
            sx={{
              mt: 0.75,
              height: 22,
              fontSize: 11,
              fontWeight: 800,
              bgcolor: `${color}1F`,
              color,
              border: `1px solid ${color}33`,
            }}
          />
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320, fontSize: 12.5, lineHeight: 1.4 }}>
        Computed from live IoT machinery, quality defect rates, inventory levels, and workforce telemetry.
      </Typography>

      {generatedAt && (
        <Box mt={1.5} display="flex" alignItems="center" gap={1}>
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: 9 }} />}
            label={`Synced ${timeAgo(generatedAt)}`}
            size="small"
            sx={{ height: 20, fontSize: 10.5, fontWeight: 600, bgcolor: 'rgba(44,140,140,0.1)', color: '#2C8C8C' }}
          />
          <Chip label="AI Diagnostic" size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 600, bgcolor: 'rgba(89,23,27,0.06)', color: 'primary.main' }} />
        </Box>
      )}
    </Box>
  );
}

function ComponentBars({ componentScores }) {
  return (
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      {componentScores.map((c) => (
        <Box key={c.key} mb={1.4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12 }}>{c.label}</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ color: getHealthColor(c.score), fontSize: 12 }}>{c.score}%</Typography>
          </Box>
          <Box sx={{ height: 7, borderRadius: 3.5, bgcolor: 'rgba(89,23,27,0.06)', overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${c.score}%`,
                height: '100%',
                borderRadius: 3.5,
                background: `linear-gradient(90deg, ${getHealthColor(c.score)}99, ${getHealthColor(c.score)})`,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function StatusDonut({ items, labels, center, centerLabel }) {
  const total = items.reduce((s, d) => s + d, 0) || 1;
  const circumference = 2 * Math.PI * 14;
  return (
    <Box>
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Box sx={{ width: 170, height: 170, filter: 'drop-shadow(0 10px 24px rgba(89,23,27,0.12))' }}>
          <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(89,23,27,0.06)" strokeWidth={5.5} />
            {items.map((val, i) => {
              const pct = val / total;
              const offset = items.slice(0, i).reduce((s, d) => s + (d / total) * circumference, 0);
              return (
                <circle
                  key={i}
                  cx="16" cy="16" r="14"
                  fill="none"
                  stroke={labels[i]?.color || '#A45A4A'}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  strokeDasharray={`${pct * circumference} ${circumference * (1 - pct)}`}
                  strokeDashoffset={-offset}
                />
              );
            })}
          </svg>
        </Box>
        <Box sx={{ position: 'absolute', textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary' }}>
            <AnimatedNumber value={center} />
          </Typography>
          <Typography variant="caption" color="text.secondary">{centerLabel}</Typography>
        </Box>
      </Box>
      <Box mt={1.5}>
        {items.map((val, i) => (
          <Box key={i} display="flex" alignItems="center" justifyContent="space-between" mb={0.6}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: labels[i]?.color, boxShadow: `0 0 6px ${labels[i]?.color}88` }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{labels[i]?.label}</Typography>
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: 'text.primary' }}>{val}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function SectionTitle({ icon, title, action, color = '#59171B' }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.25}>
      <Box display="flex" alignItems="center" gap={1.25}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FED7B8',
            boxShadow: `0 6px 16px ${color}33`,
            transition: 'transform 0.25s ease',
            '&:hover': {
              transform: 'scale(1.08) rotate(4deg)',
            },
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.01em', fontSize: '1.05rem' }}>
          {title}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

function buildStreamEvent(type, data, idx) {
  const base = {
    id: `${type}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    time: new Date().toISOString(),
    severity: 'info',
  };
  switch (type) {
    case 'orderUpdated':
      return { ...base, title: `Order ${data?.action || 'updated'}`, description: `${data?.order?.orderNumber || data?.orderId || 'Order'} ${data?.action || 'updated'}` };
    case 'taskUpdated':
      return { ...base, title: `Task ${data?.action || 'updated'}`, description: data?.task?.title || `${data?.taskId || 'Task'} ${data?.action || 'updated'}` };
    case 'machineStatusChanged':
      return { ...base, severity: ['maintenance', 'repair'].includes(data?.status) ? 'warning' : 'info', title: 'Machine status change', description: `${data?.machine?.name || data?.machineName || 'Machine'} → ${data?.status || data?.action || 'changed'}` };
    case 'qualityAlert':
      return { ...base, severity: 'warning', title: 'Quality alert', description: data?.message || 'Defect rate threshold exceeded' };
    case 'employee_activity':
      return { ...base, title: `${data?.employeeName || 'Employee'} · ${data?.action || 'activity'}`, description: 'Live floor activity' };
    case 'newNotification':
      return { ...base, title: data?.title || 'Notification', description: data?.message || '' };
    case 'factoryHealthUpdated':
      return {
        ...base,
        severity: data?.health?.score >= 70 ? 'info' : 'warning',
        title: `Health check-in — ${data?.health?.score} (Grade ${data?.health?.grade})`,
        description: data?.health?.summary || 'Factory health assessment refreshed',
      };
    default:
      return { ...base, title: type, description: '' };
  }
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [stream, setStream] = useState([]);
  const { socket, connected } = useSocket();
  const refreshTimer = useRef(null);
  const refreshCount = useRef(0);

  const load = useCallback(async ({ background = false } = {}) => {
    if (!background) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await adminDashboardApi.summary({ days: 14, stream: '1' });
      setData(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ background: true }), 60000);
    return () => clearInterval(interval);
  }, [load]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshCount.current += 1;
      load({ background: true });
    }, 1400);
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const types = ['orderUpdated', 'taskUpdated', 'machineStatusChanged', 'qualityAlert', 'employee_activity', 'newNotification', 'factoryHealthUpdated'];
    const handler = (evtData) => {
      setStream((prev) => [
        buildStreamEvent(evtData.type, evtData.data, refreshCount.current),
        ...prev,
      ].slice(0, 40));
      if (evtData.type !== 'factoryHealthUpdated') scheduleRefresh();
    };
    types.forEach((t) => socket.on(t, (d) => handler({ type: t, data: d })));
    return () => {
      types.forEach((t) => socket.off(t));
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [socket, scheduleRefresh]);

  const handleRefresh = () => load({ background: true });

  const kpis = data?.kpis || null;
  const machines = data?.machines || null;
  const inventory = data?.inventory || null;
  const quality = data?.quality || null;
  const lines = data?.lines || [];
  const workforce = data?.workforce || null;
  const health = data?.health || null;
  const trend = data?.productionTrend || null;
  const notifications = data?.notifications || [];

  const orderDonut = kpis
    ? {
        labels: kpis.ordersByStatus.map((o, i) => ({ label: o.status.replace('_', ' '), color: ORDER_COLORS[i % ORDER_COLORS.length] })),
        items: kpis.ordersByStatus.map((o) => o.count),
        center: kpis.ordersTotal,
        centerLabel: 'Total orders',
      }
    : null;

  const trendAllZero = trend && trend.unitsProduced.every((v) => v === 0) && trend.ordersCreated.every((v) => v === 0);

  return (
    <Box>
      <PageHeader
        title="AI Factory Command Center"
        subtitle="Executive overview of live factory operations — production, quality, machines, materials, workforce and AI recommendations."
        badge={connected ? 'Live' : 'Offline'}
        badgeColor={connected ? 'success' : 'error'}
        actions={
          <>
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
              label={connected ? 'Socket Connected' : 'Reconnecting…'}
              sx={{
                color: connected ? '#16A34A' : '#DC2626',
                bgcolor: connected ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                fontWeight: 600,
                borderRadius: 2,
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={handleRefresh}
              sx={{ borderRadius: 2.5, px: 2.5 }}
            >
              Refresh
            </Button>
          </>
        }
      />

      <AiCommandCenter onOrderCreated={handleRefresh} />

      {error && (
        <Box mb={3}>
          <EmptyState
            icon={<WarningAmberIcon />}
            title="Dashboard failed to load"
            message={error}
            actionLabel="Retry"
            onAction={handleRefresh}
          />
        </Box>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <GlassCard delay={0} sx={{ height: '100%' }} cardContentSx={{ p: { xs: 2.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <SectionTitle icon={<SpeedIcon sx={{ fontSize: 18, color: '#FED7B8' }} />} title="Factory Health Score" color="#59171B" />
            {loading && !data ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Skeleton variant="circular" width={160} height={160} />
                <Skeleton width="60%" height={24} sx={{ mt: 2 }} />
              </Box>
            ) : health ? (
              <HealthGauge score={health.score} grade={health.grade} label={health.label} generatedAt={health.generatedAt} />
            ) : (
              <EmptyState icon={<SpeedIcon />} title="No health data" message="Factory health will appear here once telemetry is available." />
            )}
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <GlassCard delay={0.05} sx={{ height: '100%' }} cardContentSx={{ p: { xs: 2.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SectionTitle icon={<AutoAwesomeIcon sx={{ fontSize: 18, color: '#FED7B8' }} />} title="Operational Health" color="#A45A4A" />
            {loading && !data ? (
              <Box py={2}>{[...Array(6)].map((_, i) => <Skeleton key={i} height={26} sx={{ mb: 1.4 }} />)}</Box>
            ) : health?.componentScores?.length ? (
              <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
                <ComponentBars componentScores={health.componentScores} />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" py={4} textAlign="center">No operational metrics available.</Typography>
            )}
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <GlassCard delay={0.1} sx={{ height: '100%' }} cardContentSx={{ p: { xs: 2.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SectionTitle
              icon={<AutoAwesomeIcon sx={{ fontSize: 18, color: '#FED7B8' }} />}
              title="AI Recommendations"
              color="#2C8C8C"
              action={
                health?.recommendations?.length > 0 && (
                  <Chip
                    label={`${health.recommendations.length} Active`}
                    size="small"
                    sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: 'rgba(44,140,140,0.12)', color: '#2C8C8C' }}
                  />
                )
              }
            />
            {loading && !data ? (
              <Box py={1}>{[...Array(3)].map((_, i) => <Skeleton key={i} height={56} sx={{ mb: 1.2, borderRadius: 2 }} />)}</Box>
            ) : health?.recommendations?.length ? (
              <Box flex={1} display="flex" flexDirection="column" gap={1.2} sx={{ maxHeight: 290, overflowY: 'auto', pr: 0.5 }}>
                {health.recommendations.map((rec) => {
                  const tone = SEVERITY_TONE[rec.severity] || SEVERITY_TONE.info;
                  return (
                    <Box
                      key={rec.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(255,255,255,0.75)',
                        border: '1px solid rgba(89,23,27,0.06)',
                        borderLeft: `3.5px solid ${tone.color}`,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateX(2px)',
                          boxShadow: '0 4px 12px rgba(89,23,27,0.06)',
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.4}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary', fontSize: 12.5 }} noWrap>
                          {rec.title}
                        </Typography>
                        <Chip
                          label={rec.severity || 'info'}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 9.5,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            bgcolor: tone.bg,
                            color: tone.color,
                            flexShrink: 0,
                            ml: 1,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.35 }}>
                        {rec.description}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" py={4} textAlign="center">All factory operations within optimal thresholds.</Typography>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Orders" value={kpis?.activeOrders ?? 0} icon={<ShoppingCartIcon />} variant="maroon" loading={loading && !data} delay={0.1} subtitle={`${kpis?.ordersTotal ?? 0} total · ${(kpis?.unitsInProduction ?? 0).toLocaleString()} units in production`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Units Produced" value={kpis?.unitsProducedTotal ?? 0} icon={<FactoryIcon />} variant="gold" loading={loading && !data} delay={0.15} subtitle={`${kpis?.unitsRejectedTotal ?? 0} rejected / scrapped`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Machines Active" value={(machines?.byStatus?.in_use ?? 0) + (machines?.byStatus?.available ?? 0)} icon={<PrecisionManufacturingIcon />} variant="soft" loading={loading && !data} delay={0.2} subtitle={`${machines?.total ?? 0} total · ${machines?.byStatus?.maintenance ?? 0} in maintenance`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Low Stock Items" value={inventory?.lowStockCount ?? 0} icon={<InventoryIcon />} variant="teal" loading={loading && !data} delay={0.25} subtitle={`${inventory?.totalItems ?? 0} materials · ${(inventory?.totalValue ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} value`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Employees Present" value={workforce?.attendanceToday?.present ?? 0} icon={<PeopleIcon />} variant="green" loading={loading && !data} delay={0.3} subtitle={`${workforce?.totalEmployees ?? 0} staff · ${workforce?.attendanceToday?.absent ?? 0} absent today`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avg Defect Rate" value={quality?.overall?.avgDefectRate ?? 0} suffix="%" icon={<VerifiedIcon />} variant="gold" loading={loading && !data} delay={0.35} subtitle={`${quality?.overall?.totalInspected?.toLocaleString() ?? 0} units inspected`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Open Issues" value={workforce?.openIssues ?? 0} icon={<ReportProblemIcon />} variant="soft" loading={loading && !data} delay={0.4} subtitle={`${workforce?.openDefects ?? 0} defect reports open`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Leaves" value={workforce?.pendingLeaves ?? 0} icon={<EventBusyIcon />} variant="maroon" loading={loading && !data} delay={0.45} subtitle="Awaiting approval" />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3.5}>
        <Grid item xs={12} md={8}>
          <GlassCard delay={0.08}>
            <SectionTitle
              icon={<FactoryIcon sx={{ fontSize: 17, color: '#FED7B8' }} />}
              title="Production Trend"
              color="#59171B"
              action={<Typography variant="caption" color="text.secondary">Last 14 days · real task & order data</Typography>}
            />
            {loading && !data ? (
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            ) : trendAllZero ? (
              <EmptyState icon={<FactoryIcon />} title="No production activity yet" message="Orders and tasks will appear here as they are created and progressed." />
            ) : (
              <ProductionChart
                data={[
                  { label: 'Units Produced', data: trend.unitsProduced, borderColor: CHART_COLORS.maroon },
                  { label: 'Orders Created', data: trend.ordersCreated, borderColor: CHART_COLORS.gold, _noGradient: true, fill: false, borderDash: [6, 6] },
                ]}
                labels={trend.labels}
                height={300}
              />
            )}
          </GlassCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <GlassCard delay={0.1}>
            <SectionTitle icon={<ShoppingCartIcon sx={{ fontSize: 17, color: '#FED7B8' }} />} title="Order Status" color="#A45A4A" />
            {loading && !data ? (
              <Skeleton variant="circular" width={170} height={170} sx={{ mx: 'auto', my: 2 }} />
            ) : orderDonut && orderDonut.center > 0 ? (
              <StatusDonut {...orderDonut} />
            ) : (
              <EmptyState icon={<ShoppingCartIcon />} title="No orders yet" message="Orders created by management will be visualized here." />
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3.5}>
        <Grid item xs={12} md={8}>
          <GlassCard delay={0.12}>
            <SectionTitle
              icon={<FactoryIcon sx={{ fontSize: 17, color: '#FED7B8' }} />}
              title="Production Lines"
              color="#2C8C8C"
              action={<Chip label={`${lines.length} active lines`} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: 'rgba(44,140,140,0.12)', color: '#2C8C8C' }} />}
            />
            {loading && !data ? (
              <Box>{[...Array(2)].map((_, i) => <Skeleton key={i} height={90} sx={{ mb: 1.5 }} />)}</Box>
            ) : lines.length === 0 ? (
              <EmptyState icon={<FactoryIcon />} title="No production lines" message="Create production lines to see throughput here." />
            ) : (
              <Box>
                {lines.map((l) => (
                  <Box key={l._id} mb={1.75}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>{l.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.code} · {l.status} · {l.location?.floor ? `Floor ${l.location.floor} ${l.location.section || ''}` : 'No location'}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" fontWeight={800} sx={{ color: 'primary.main', display: 'block' }}>{l.activeOrders} orders · {(l.orderUnits || 0).toLocaleString()} units</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{(l.totalProduced || 0).toLocaleString()} produced</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" gap={2} alignItems="center">
                      <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" mb={0.25}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Efficiency</Typography>
                          <Typography variant="caption" fontWeight={700}>{l.efficiency}%</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(89,23,27,0.07)', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, width: `${Math.min(100, l.efficiency)}%`, background: 'linear-gradient(90deg, #2C8C8C, #16A34A)' }} />
                        </Box>
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" mb={0.25}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Utilization</Typography>
                          <Typography variant="caption" fontWeight={700}>{l.utilization}%</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(89,23,27,0.07)', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, width: `${Math.min(100, l.utilization)}%`, background: 'linear-gradient(90deg, #E8A06B, #A45A4A)' }} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </GlassCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <GlassCard delay={0.14}>
            <SectionTitle icon={<PrecisionManufacturingIcon sx={{ fontSize: 17, color: '#FED7B8' }} />} title="Machine Health" color="#7A2328" />
            {loading && !data ? (
              <Box>{[...Array(5)].map((_, i) => <Skeleton key={i} height={24} sx={{ mb: 1.4 }} />)}</Box>
            ) : machines && machines.total > 0 ? (
              <>
                <Box mb={1}>
                  {Object.entries(machines.byStatus).map(([status, count]) => (
                    <Box key={status} display="flex" alignItems="center" justifyContent="space-between" mb={0.9}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: MACHINE_COLORS[status] || '#9CA3AF' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</Typography>
                      </Box>
                      <Typography variant="caption" fontWeight={800}>{count}</Typography>
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight={800}><AnimatedNumber value={machines.avgEfficiency} />%</Typography>
                    <Typography variant="caption" color="text.secondary">Avg efficiency</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h6" fontWeight={800} sx={{ color: machines.maintenanceDue > 0 ? '#E8A06B' : '#16A34A' }}><AnimatedNumber value={machines.maintenanceDue} /></Typography>
                    <Typography variant="caption" color="text.secondary">Maintenance due (7d)</Typography>
                  </Box>
                </Box>
                {machines.maintenanceQueue.length > 0 && (
                  <Box mt={1.5}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary' }}>Due for service</Typography>
                    {machines.maintenanceQueue.slice(0, 3).map((m) => (
                      <Typography key={m._id} variant="caption" sx={{ color: 'text.primary', display: 'block', mt: 0.5 }}>
                        • {m.name} — {new Date(m.nextServiceDate).toLocaleDateString()}
                      </Typography>
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <EmptyState icon={<PrecisionManufacturingIcon />} title="No machines" message="Machines will appear here once registered." />
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3.5}>
        <Grid item xs={12} md={4}>
          <GlassCard delay={0.16}>
            <SectionTitle icon={<InventoryIcon sx={{ fontSize: 17, color: '#FED7B8' }} />} title="Material Alerts" color="#A45A4A" />
            {loading && !data ? (
              <Box>{[...Array(3)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}</Box>
            ) : inventory?.lowStockItems?.length ? (
              <Box>
                {inventory.lowStockItems.slice(0, 6).map((item) => (
                  <Box key={item._id} display="flex" alignItems="center" justifyContent="space-between" gap={1} py={0.8}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary', fontSize: 13 }} noWrap>{item.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{item.category} · {item.current} {item.unitOfMeasure} / reorder at {item.reorderPoint}</Typography>
                    </Box>
                    <Chip
                      label={item.current === 0 ? 'Out' : 'Low'}
                      size="small"
                      sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: item.current === 0 ? 'rgba(220,38,38,0.12)' : 'rgba(232,160,107,0.16)', color: item.current === 0 ? '#DC2626' : '#B45309', flexShrink: 0 }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState icon={<CheckCircleIcon />} title="Stock levels healthy" message="No materials are currently below their reorder point." />
            )}
          </GlassCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <GlassCard delay={0.18}>
            <SectionTitle icon={<VerifiedIcon sx={{ fontSize: 17, color: '#FED7B8' }} />} title="Quality Snapshot" color="#2C8C8C" />
            {loading && !data ? (
              <Box>{[...Array(4)].map((_, i) => <Skeleton key={i} height={26} sx={{ mb: 1.5 }} />)}</Box>
            ) : quality?.overall?.totalInspections > 0 ? (
              <>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Box><Typography variant="h6" fontWeight={800}><AnimatedNumber value={quality.overall.totalInspections} /></Typography><Typography variant="caption" color="text.secondary">Inspections</Typography></Box>
                  <Box><Typography variant="h6" fontWeight={800}><AnimatedNumber value={quality.overall.passRate} suffix="%" /></Typography><Typography variant="caption" color="text.secondary">Pass rate</Typography></Box>
                  <Box textAlign="right"><Typography variant="h6" fontWeight={800} sx={{ color: quality.overall.avgDefectRate > 5 ? '#DC2626' : '#16A34A' }}><AnimatedNumber value={quality.overall.avgDefectRate} suffix="%" /></Typography><Typography variant="caption" color="text.secondary">Defect rate</Typography></Box>
                </Box>
                <Box mt={1}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary' }}>Grade distribution</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    {quality.gradeDistribution.map((g) => (
                      <Chip key={g.grade} label={`Grade ${g.grade} · ${g.count}`} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: 'rgba(89,23,27,0.08)', color: 'text.primary' }} />
                    ))}
                    {quality.gradeDistribution.length === 0 && <Typography variant="caption" color="text.secondary">No grades recorded yet.</Typography>}
                  </Box>
                </Box>
                <Box mt={1.5}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary' }}>Pass / Fail units</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.75}>
                    <Box flex={1} sx={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', bgcolor: 'rgba(220,38,38,0.1)' }}>
                      <Box sx={{ width: `${quality.overall.passRate}%`, bgcolor: '#16A34A' }} />
                    </Box>
                    <Typography variant="caption" fontWeight={700}>{quality.passFail.totalPassed} / {quality.passFail.totalFailed}</Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <EmptyState icon={<VerifiedIcon />} title="No inspections yet" message="Quality inspection data will appear here." />
            )}
          </GlassCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <GlassCard delay={0.2}>
            <SectionTitle icon={<PeopleIcon sx={{ fontSize: 17, color: '#FED7B8' }} />} title="Workforce" color="#59171B" />
            {loading && !data ? (
              <Box>{[...Array(4)].map((_, i) => <Skeleton key={i} height={26} sx={{ mb: 1.5 }} />)}</Box>
            ) : workforce ? (
              <>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Box><Typography variant="h6" fontWeight={800}><AnimatedNumber value={workforce.attendanceToday.present} /></Typography><Typography variant="caption" color="text.secondary">Present today</Typography></Box>
                  <Box><Typography variant="h6" fontWeight={800} sx={{ color: '#DC2626' }}><AnimatedNumber value={workforce.attendanceToday.absent} /></Typography><Typography variant="caption" color="text.secondary">Absent</Typography></Box>
                  <Box textAlign="right"><Typography variant="h6" fontWeight={800}><AnimatedNumber value={workforce.totalEmployees} /></Typography><Typography variant="caption" color="text.secondary">Staff</Typography></Box>
                </Box>
                {workforce.byDepartment.length > 0 && (
                  <Box mt={1}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary' }}>Departments</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.75} mt={0.75}>
                      {workforce.byDepartment.map((d) => (
                        <Chip key={d.department} label={`${d.department} · ${d.count}`} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: 'rgba(254,215,184,0.3)', color: 'text.primary' }} />
                      ))}
                    </Box>
                  </Box>
                )}
                <Divider sx={{ my: 1.5 }} />
                <Box display="flex" gap={2}>
                  <Box flex={1}><Typography variant="body2" fontWeight={700} sx={{ color: workforce.pendingLeaves > 0 ? '#E8A06B' : '#16A34A' }}>{workforce.pendingLeaves}</Typography><Typography variant="caption" color="text.secondary">Pending leaves</Typography></Box>
                  <Box flex={1}><Typography variant="body2" fontWeight={700} sx={{ color: workforce.openIssues > 0 ? '#E8A06B' : '#16A34A' }}>{workforce.openIssues}</Typography><Typography variant="caption" color="text.secondary">Open issues</Typography></Box>
                  <Box flex={1}><Typography variant="body2" fontWeight={700} sx={{ color: workforce.openDefects > 0 ? '#E8A06B' : '#16A34A' }}>{workforce.openDefects}</Typography><Typography variant="caption" color="text.secondary">Defect reports</Typography></Box>
                </Box>
              </>
            ) : (
              <EmptyState icon={<PeopleIcon />} title="No workforce data" message="Employee and attendance data will appear here." />
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3.5}>
        <Grid item xs={12}>
          <GlassCard sx={{ border: '1px solid rgba(89,23,27,0.1)' }}>
            <SectionTitle
              icon={<NotificationsActiveIcon sx={{ fontSize: 17, color: '#FED7B8' }} />}
              title="Live Decision Stream"
              color="#59171B"
              action={
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
                    label={connected ? 'Live' : 'Buffering'}
                    size="small"
                    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: connected ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)', color: connected ? '#16A34A' : '#DC2626' }}
                  />
                  <Button size="small" color="primary" endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />} onClick={() => { /* quick nav to analytics */ window.__router && window.__router('/admin/analytics'); }} sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Deep analytics
                  </Button>
                </Box>
              }
            />
            {loading && !data ? (
              <Box>{[...Array(3)].map((_, i) => <Skeleton key={i} height={44} sx={{ mb: 1 }} />)}</Box>
            ) : stream.length === 0 && notifications.length === 0 ? (
              <EmptyState icon={<NotificationsActiveIcon />} title="No live events yet" message="Order, task, machine, quality and employee events will stream here in real time over Socket.IO." />
            ) : (
              <>
                {stream.map((e, i) => {
                  const tone = SEVERITY_TONE[e.severity] || SEVERITY_TONE.info;
                  return (
                    <Box key={e.id}>
                      <Box display="flex" alignItems="center" gap={1.5} py={0.8}>
                        <Box sx={{ width: 26, height: 26, borderRadius: 2, bgcolor: tone.bg, color: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {e.severity === 'critical' ? <WarningAmberIcon sx={{ fontSize: 15 }} /> : <FiberManualRecordIcon sx={{ fontSize: 12 }} />}
                        </Box>
                        <Box minWidth={0} flex={1}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary', fontSize: 13 }}>{e.title}</Typography>
                          {e.description && <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{e.description}</Typography>}
                        </Box>
                        <Chip label={e.type.replace(/_/g, ' ')} size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: 'rgba(89,23,27,0.06)', color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', width: 74, textAlign: 'right', flexShrink: 0 }}>{timeAgo(e.time)}</Typography>
                      </Box>
                      {i < stream.length - 1 && <Divider sx={{ borderColor: 'rgba(89,23,27,0.06)' }} />}
                    </Box>
                  );
                })}
                {stream.length === 0 && notifications.length > 0 && (
                  <Typography variant="body2" color="text.secondary" py={2}>
                    Recent notifications will stream live as events occur. Showing {notifications.length} recent notification(s) from the system.
                  </Typography>
                )}
              </>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
