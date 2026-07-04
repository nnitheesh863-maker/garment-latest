import React from 'react';
import Chip from '@mui/material/Chip';
import { getStatusColor } from '../../utils/helpers';

export default function StatusBadge({ status, size = 'small', ...props }) {
  const color = getStatusColor(status);
  return (
    <Chip
      label={status ? status.replace(/_/g, ' ') : 'Unknown'}
      size={size}
      sx={{
        backgroundColor: color,
        color: '#fff',
        fontWeight: 500,
        textTransform: 'capitalize',
      }}
      {...props}
    />
  );
}
