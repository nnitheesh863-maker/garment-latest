import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';

export default function PageHeader({
  title,
  subtitle,
  badge,
  badgeColor = 'default',
  actions,
  gradient = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                fontSize: { xs: '1.5rem', md: '1.9rem' },
                letterSpacing: '-0.02em',
                color: 'text.primary',
              }}
            >
              {gradient ? <span className="gradient-text">{title}</span> : title}
            </Typography>
            {badge && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 1,
                  bgcolor: badgeColor === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(89,23,27,0.08)',
                  color: badgeColor === 'success' ? '#16A34A' : 'primary.main',
                }}
              />
            )}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 620 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
            {actions}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}
