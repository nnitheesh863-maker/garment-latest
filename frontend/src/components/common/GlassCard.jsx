import React from 'react';
import { Card, CardContent, Box } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

export default function GlassCard({
  children,
  delay = 0,
  gradientBar = false,
  interactive = true,
  glow = false,
  sx,
  cardContentSx,
  whileHover,
  ...props
}) {
  const hoverProps = interactive
    ? whileHover || { y: -6, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }
    : undefined;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hoverProps}
      sx={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(241, 213, 192, 0.65)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: (theme) =>
          glow
            ? '0 12px 36px rgba(122, 35, 40, 0.18)'
            : theme.palette.mode === 'light'
            ? '0 6px 28px rgba(89, 23, 27, 0.07)'
            : '0 6px 28px rgba(0, 0, 0, 0.45)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          borderColor: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(164, 90, 74, 0.45)' : 'rgba(254, 215, 184, 0.3)',
        },
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
            background: 'linear-gradient(90deg, #59171b, #7a2328, #a45a4a, #fed7b8)',
            zIndex: 1,
          }}
        />
      )}
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, ...cardContentSx }}>
        {children}
      </CardContent>
    </MotionCard>
  );
}
