import React from 'react';
import { Box } from '@mui/material';
import { getStatusColor } from '../../utils/helpers';

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
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: size === 'small' ? 1.25 : 1.75,
        py: size === 'small' ? 0.35 : 0.55,
        borderRadius: 999,
        fontSize: size === 'small' ? 11 : 12.5,
        fontWeight: 700,
        lineHeight: 1.4,
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
        color: color,
        background: `${color}18`,
        border: `1px solid ${color}38`,
        backdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'scale(1.04)',
          boxShadow: `0 2px 10px ${color}30`,
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
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: color,
            flexShrink: 0,
            boxShadow: `0 0 8px ${color}99`,
            ...(isPulsing && {
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                border: `1.5px solid ${color}`,
                animation: 'pulseRing 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
                opacity: 0.75,
              },
            }),
          }}
        />
      )}
      {status ? String(status).replace(/_/g, ' ') : 'Unknown'}
    </Box>
  );
}
