import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import AnimatedNumber from './AnimatedNumber';

const VARIANT_COLORS = {
  maroon: '#59171B',
  gold: '#E8A06B',
  soft: '#A45A4A',
  teal: '#2C8C8C',
  green: '#16A34A',
  cream: '#C27A63',
  danger: '#DC2626',
};

export default function StatCard({
  title,
  value,
  icon,
  color = '#59171B',
  variant,
  loading = false,
  subtitle,
  trend,
  trendDirection = 'up',
  gradient = false,
  suffix = '',
  prefix = '',
  sx,
}) {
  if (variant) color = VARIANT_COLORS[variant] || color;

  const isPositive = trendDirection === 'up';
  const isNegative = trendDirection === 'down';

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        background: gradient
          ? 'linear-gradient(135deg, #59171B 0%, #7A2328 55%, #A45A4A 100%)'
          : (theme) => (theme.palette.mode === 'light' ? '#FFFFFF' : '#25171B'),
        border: (theme) =>
          gradient
            ? 'none'
            : theme.palette.mode === 'light'
            ? '1px solid rgba(241, 213, 192, 0.7)'
            : '1px solid #3A262B',
        boxShadow: gradient
          ? '0 10px 30px rgba(89, 23, 27, 0.25)'
          : '0 4px 16px rgba(89, 23, 27, 0.05)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: gradient
            ? '0 14px 36px rgba(89, 23, 27, 0.35)'
            : '0 8px 24px rgba(89, 23, 27, 0.1)',
        },
        '&::after': gradient
          ? {
              content: '""',
              position: 'absolute',
              top: '-60%',
              right: '-20%',
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254, 215, 184, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }
          : {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${color}, ${color}66, transparent)`,
            },
        ...sx,
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1, '&:last-child': { pb: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Box minWidth={0} flex={1}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: gradient ? 'rgba(255, 248, 242, 0.8)' : 'text.secondary',
              }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={100} height={44} sx={{ mt: 0.5, borderRadius: 2 }} />
            ) : (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                  lineHeight: 1.15,
                  mt: 0.5,
                  color: gradient ? '#FFF8F2' : 'text.primary',
                }}
              >
                <AnimatedNumber value={value} suffix={suffix} prefix={prefix} />
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: gradient ? 'rgba(255, 248, 242, 0.75)' : 'text.secondary',
                  mt: 0.5,
                  display: 'block',
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: gradient ? 'rgba(255, 248, 242, 0.16)' : `${color}14`,
              border: gradient ? '1px solid rgba(255, 248, 242, 0.25)' : `1px solid ${color}33`,
              color: gradient ? '#FED7B8' : color,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.08) rotate(4deg)',
              },
            }}
          >
            {React.isValidElement(icon) ? (
              React.cloneElement(icon, { sx: { fontSize: 26 } })
            ) : (
              icon
            )}
          </Box>
        </Box>
        {trend && (
          <Box mt={2} display="flex" alignItems="center" gap={1}>
            <Chip
              icon={
                isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: '15px !important', color: gradient ? '#FED7B8 !important' : '#16A34A !important' }} />
                ) : isNegative ? (
                  <TrendingDownIcon sx={{ fontSize: '15px !important', color: gradient ? '#FED7B8 !important' : '#DC2626 !important' }} />
                ) : (
                  <RemoveIcon sx={{ fontSize: '15px !important' }} />
                )
              }
              label={trend}
              size="small"
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: '8px',
                bgcolor: gradient
                  ? 'rgba(255, 248, 242, 0.18)'
                  : isPositive
                  ? 'rgba(22, 163, 74, 0.12)'
                  : 'rgba(220, 38, 38, 0.12)',
                color: gradient ? '#FFF8F2' : isPositive ? '#16A34A' : '#DC2626',
                border: gradient ? '1px solid rgba(255, 248, 242, 0.2)' : 'none',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: gradient ? 'rgba(255, 248, 242, 0.7)' : 'text.secondary',
                fontSize: 11,
              }}
            >
              vs previous cycle
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
