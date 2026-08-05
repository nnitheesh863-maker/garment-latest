import React from 'react';
import { Box } from '@mui/material';
import { getStatusColor } from '../../utils/helpers';

export default function StatusBadge({ status, size = 'small', withDot = true, sx, ...props }) {
  const color = getStatusColor(status);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: size === 'small' ? 1.25 : 1.5,
        py: size === 'small' ? 0.35 : 0.5,
        borderRadius: 999,
        fontSize: size === 'small' ? 11 : 12.5,
        fontWeight: 700,
        lineHeight: 1.4,
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
        color: color,
        background: `${color}1A`,
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap',
        ...sx,
      }}
      {...props}
    >
      {withDot && (
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: color,
            boxShadow: `0 0 8px ${color}88`,
            flexShrink: 0,
          }}
        />
      )}
      {status ? String(status).replace(/_/g, ' ') : 'Unknown'}
    </Box>
  );
}
