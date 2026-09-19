/**
 * StatusBadge Component
 * Displays normalized status indicators with high-contrast color tokens and ARIA labels.
 */
import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { getStatusColor } from '../../utils/helpers';

const MotionBox = motion.create(Box);

export default function StatusBadge({
  status,
  size = 'small',
  withDot = true,
  pulse = false,
  icon: Icon,
  sx,
  ...props
}) {
  const color = getStatusColor(status);
  const isPulsing =
    pulse ||
    ['in_progress', 'active', 'working', 'pending', 'quality_check'].includes(
      String(status).toLowerCase()
    );

  return (
    <MotionBox
      component="span"
      whileHover={{ scale: 1.06, y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.8,
        px: size === 'small' ? 1.35 : 1.85,
        py: size === 'small' ? 0.4 : 0.6,
        borderRadius: 999,
        fontSize: size === 'small' ? 11 : 12.5,
        fontWeight: 750,
        lineHeight: 1.4,
        textTransform: 'capitalize',
        letterSpacing: '0.025em',
        color: color,
        background: `${color}1A`,
        border: `1.5px solid ${color}40`,
        backdropFilter: 'blur(10px)',
        whiteSpace: 'nowrap',
        cursor: 'default',
        boxShadow: `0 2px 8px ${color}1F`,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
        '&:hover': {
          boxShadow: `0 4px 14px ${color}45`,
          background: `${color}28`,
          borderColor: color,
        },
        ...sx,
      }}
      {...props}
    >
      {Icon && <Icon size={size === 'small' ? 13 : 15} style={{ flexShrink: 0 }} />}
      {withDot && (
        <Box
          sx={{
            position: 'relative',
            width: 7.5,
            height: 7.5,
            borderRadius: '50%',
            bgcolor: color,
            flexShrink: 0,
            boxShadow: `0 0 10px ${color}`,
            ...(isPulsing && {
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -3.5,
                borderRadius: '50%',
                border: `1.5px solid ${color}`,
                animation: 'pulseRing 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
                opacity: 0.8,
              },
            }),
          }}
        />
      )}
      {status ? String(status).replace(/_/g, ' ') : 'Unknown'}
    </MotionBox>
  );
}
