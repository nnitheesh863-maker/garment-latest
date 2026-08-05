import React from 'react';
import { Box, Typography } from '@mui/material';

export default function LoadingSpinner({ fullPage = true, message = 'Loading...', size = 40 }) {
  if (!fullPage) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4} gap={1.5}>
        <Box className="ai-orb" sx={{ width: size * 1.6, height: size * 1.6 }}>
          <Box sx={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', bgcolor: '#FED7B8' }} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2.5}
      sx={{ background: 'linear-gradient(135deg, #FFF8F2 0%, #FFE8D4 100%)' }}
    >
      <Box className="ai-orb" sx={{ width: 88, height: 88 }}>
        <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#FED7B8' }} />
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ color: '#59171B' }}>
        GarmentOS
      </Typography>
      <Box className="loading-dots">
        <span /><span /><span />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
