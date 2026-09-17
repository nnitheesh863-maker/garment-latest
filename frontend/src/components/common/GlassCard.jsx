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
  whileTap,
  ...props
}) {
  const hoverProps = interactive
    ? whileHover || { y: -4, transition: { type: 'spring', stiffness: 380, damping: 28 } }
    : undefined;

  const tapProps = interactive
    ? whileTap || { scale: 0.992, transition: { duration: 0.1 } }
    : undefined;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hoverProps}
      whileTap={tapProps}
      sx={{
        position: 'relative',
        borderRadius: '22px',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(241, 213, 192, 0.75)'
            : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: (theme) =>
          glow
            ? '0 14px 40px rgba(122, 35, 40, 0.22)'
            : theme.palette.mode === 'light'
            ? '0 6px 24px rgba(89, 23, 27, 0.06)'
            : '0 6px 24px rgba(0, 0, 0, 0.5)',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease',
        '&:hover': {
          borderColor: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(164, 90, 74, 0.55)' : 'rgba(254, 215, 184, 0.4)',
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 14px 36px rgba(89, 23, 27, 0.12)'
              : '0 14px 36px rgba(0, 0, 0, 0.65)',
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
            background: 'linear-gradient(90deg, #59171b 0%, #7a2328 35%, #a88362 70%, #fed7b8 100%)',
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
