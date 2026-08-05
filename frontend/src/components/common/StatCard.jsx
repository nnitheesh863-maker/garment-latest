import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

const MotionCard = motion(Card);

const VARIANT_COLORS = {
  maroon: '#59171B',
  gold: '#E8A06B',
  soft: '#A45A4A',
  teal: '#2C8C8C',
  green: '#16A34A',
  cream: '#C27A63',
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
  delay = 0,
  suffix = '',
  prefix = '',
  sx,
}) {
  if (variant) color = VARIANT_COLORS[variant] || color;
  return (
    <MotionCard
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      sx={{
        borderRadius: 5,
        position: 'relative',
        overflow: 'hidden',
        background: gradient
          ? 'linear-gradient(135deg, #59171B 0%, #7A2328 55%, #A45A4A 100%)'
          : (theme) => (theme.palette.mode === 'light' ? '#FFFFFF' : '#25171B'),
        border: (theme) =>
          gradient
            ? 'none'
            : theme.palette.mode === 'light'
              ? '1px solid #F1D5C099'
              : '1px solid #3A262B',
        boxShadow: gradient
          ? '0 16px 44px rgba(89,23,27,0.35)'
          : '0 6px 26px rgba(89,23,27,0.07)',
        '&::after': gradient
          ? {
              content: '""',
              position: 'absolute',
              top: '-60%',
              right: '-20%',
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(254,215,184,0.14)',
            }
          : {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${color}, ${color}66, transparent)`,
            },
        ...sx,
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1, '&:last-child': { pb: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box minWidth={0}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: gradient ? 'rgba(255,248,242,0.75)' : 'text.secondary',
              }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={90} height={42} sx={{ mt: 0.5 }} />
            ) : (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: '2rem',
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
                sx={{ color: gradient ? 'rgba(255,248,242,0.7)' : 'text.secondary', mt: 0.5, display: 'block' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: gradient ? 'rgba(255,248,242,0.16)' : `${color}14`,
              border: gradient ? '1px solid rgba(255,248,242,0.22)' : `1px solid ${color}33`,
              color: gradient ? '#FED7B8' : color,
              boxShadow: gradient ? 'inset 0 1px 0 rgba(255,255,255,0.18)' : 'none',
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 26 } })}
          </Box>
        </Box>
        {trend && (
          <Box mt={1.5} display="flex" alignItems="center" gap={1}>
            <Chip
              label={trend}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 1,
                bgcolor: gradient ? 'rgba(255,248,242,0.18)' : 'rgba(22,163,74,0.12)',
                color: gradient ? '#FFF8F2' : '#16A34A',
              }}
            />
            {trendDirection === 'up' && (
              <Typography variant="caption" sx={{ color: gradient ? 'rgba(255,248,242,0.7)' : 'text.secondary' }}>
                vs last period
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </MotionCard>
  );
}
