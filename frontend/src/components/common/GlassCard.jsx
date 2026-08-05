import React from 'react';
import { Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

export default function GlassCard({
  children,
  delay = 0,
  sx,
  cardContentSx,
  whileHover = { y: -6 },
  ...props
}) {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={whileHover}
      sx={{
        borderRadius: 5,
        boxShadow: (theme) =>
          theme.palette.mode === 'light'
            ? '0 6px 28px rgba(89,23,27,0.07)'
            : '0 6px 28px rgba(0,0,0,0.4)',
        ...sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, ...cardContentSx }}>
        {children}
      </CardContent>
    </MotionCard>
  );
}
