import React from 'react';
import { Box, Typography, Chip, Breadcrumbs, Link } from '@mui/material';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  badge,
  badgeColor = 'default',
  breadcrumbs = [],
  actions,
  gradient = true,
  live = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box mb={3.5}>
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<ChevronRight size={14} style={{ opacity: 0.5 }} />}
            sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.8rem', fontWeight: 500 } }}
          >
            {breadcrumbs.map((crumb, idx) =>
              crumb.href ? (
                <Link
                  key={idx}
                  underline="hover"
                  color="text.secondary"
                  href={crumb.href}
                  sx={{ transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={idx} color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {crumb.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.1rem' },
                  letterSpacing: '-0.025em',
                  color: 'text.primary',
                  lineHeight: 1.2,
                }}
              >
                {gradient ? <span className="gradient-text">{title}</span> : title}
              </Typography>

              {live && (
                <Chip
                  icon={<span className="live-dot active" style={{ marginLeft: 6 }} />}
                  label="LIVE"
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: 10.5,
                    fontWeight: 800,
                    borderRadius: '8px',
                    bgcolor: 'rgba(22, 163, 74, 0.12)',
                    color: '#16A34A',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                    letterSpacing: '0.05em',
                  }}
                />
              )}

              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: '8px',
                    bgcolor:
                      badgeColor === 'success'
                        ? 'rgba(22, 163, 74, 0.12)'
                        : badgeColor === 'warning'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(89, 23, 27, 0.08)',
                    color:
                      badgeColor === 'success'
                        ? '#16A34A'
                        : badgeColor === 'warning'
                        ? '#F59E0B'
                        : 'primary.main',
                    border: '1px solid rgba(241, 213, 192, 0.5)',
                  }}
                />
              )}
            </Box>

            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: 680, lineHeight: 1.6, fontSize: '0.925rem' }}
              >
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
      </Box>
    </motion.div>
  );
}
