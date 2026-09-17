import React from 'react';
import { Card, CardContent, Box } from '@mui/material';

export default function GlassCard({
  children,
  gradientBar = false,
  interactive = true,
  glow = false,
  sx,
  cardContentSx,
  ...props
}) {
  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(241, 213, 192, 0.75)'
            : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: (theme) =>
          glow
            ? '0 8px 24px rgba(122, 35, 40, 0.15)'
            : theme.palette.mode === 'light'
            ? '0 4px 16px rgba(89, 23, 27, 0.05)'
            : '0 4px 16px rgba(0, 0, 0, 0.5)',
        transition: interactive ? 'transform 0.15s ease, box-shadow 0.15s ease' : 'none',
        '&:hover': interactive
          ? {
              transform: 'translateY(-2px)',
              boxShadow: (theme) =>
                theme.palette.mode === 'light'
                  ? '0 8px 24px rgba(89, 23, 27, 0.1)'
                  : '0 8px 24px rgba(0, 0, 0, 0.65)',
            }
          : undefined,
        ...sx,
      }}
      {...props}
    >
      {gradientBar && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #59171b 0%, #7a2328 35%, #a88362 70%, #fed7b8 100%)',
            zIndex: 1,
          }}
        />
      )}
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, ...cardContentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}
