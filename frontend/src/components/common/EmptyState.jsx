import React from 'react';
import { Box, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion } from 'framer-motion';
import GradientButton from './GradientButton';

export default function EmptyState({
  icon,
  title = 'No records found',
  message = 'There is currently no activity or data matching this query.',
  actionLabel,
  onAction,
  actionIcon,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        textAlign="center"
        py={7}
        px={3}
        sx={{
          position: 'relative',
          borderRadius: '24px',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px dashed rgba(241, 213, 192, 0.8)'
              : '1px dashed rgba(255, 255, 255, 0.12)',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(180deg, rgba(254, 215, 184, 0.18) 0%, rgba(255, 248, 242, 0.05) 100%)'
              : 'linear-gradient(180deg, rgba(164, 90, 74, 0.1) 0%, rgba(26, 16, 18, 0) 100%)',
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            mx: 'auto',
            mb: 2.5,
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #59171B, #7A2328, #A45A4A)',
            color: '#FED7B8',
            boxShadow: '0 16px 36px rgba(89, 23, 27, 0.28)',
            position: 'relative',
            animation: 'floatGentle 4s ease-in-out infinite',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: -8,
              borderRadius: '28px',
              border: '1.5px dashed rgba(164, 90, 74, 0.35)',
              animation: 'spinSlow 26s linear infinite',
            }}
          />
          {icon ? (
            React.isValidElement(icon) ? (
              React.cloneElement(icon, { sx: { fontSize: 40 } })
            ) : (
              icon
            )
          ) : (
            <AutoAwesomeIcon sx={{ fontSize: 40 }} />
          )}
        </Box>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: 'text.primary', letterSpacing: '-0.01em' }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 440, mx: 'auto', mt: 0.75, mb: actionLabel ? 3 : 0, lineHeight: 1.6 }}
        >
          {message}
        </Typography>
        {actionLabel && (
          <GradientButton onClick={onAction} icon={actionIcon} sx={{ px: 4 }}>
            {actionLabel}
          </GradientButton>
        )}
      </Box>
    </motion.div>
  );
}
