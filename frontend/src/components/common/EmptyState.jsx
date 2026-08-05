import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion } from 'framer-motion';

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  message = 'There is no data to display right now.',
  actionLabel,
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        textAlign="center"
        py={6}
        px={3}
        sx={{
          position: 'relative',
          borderRadius: 4,
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(180deg, rgba(254,215,184,0.22) 0%, rgba(255,248,242,0) 100%)'
              : 'linear-gradient(180deg, rgba(164,90,74,0.14) 0%, rgba(26,16,18,0) 100%)',
        }}
      >
        <Box
          sx={{
            width: 84,
            height: 84,
            mx: 'auto',
            mb: 2.5,
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #59171B, #7A2328, #A45A4A)',
            color: '#FED7B8',
            boxShadow: '0 14px 40px rgba(89,23,27,0.3)',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: -8,
              borderRadius: 6,
              border: '1.5px dashed rgba(89,23,27,0.25)',
              animation: 'spinSlow 22s linear infinite',
            }}
          />
          {React.cloneElement(icon || <AutoAwesomeIcon />, { sx: { fontSize: 40 } })}
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mt: 0.75, mb: 2.5 }}>
          {message}
        </Typography>
        {actionLabel && (
          <Button variant="contained" color="primary" onClick={onAction} sx={{ px: 4 }}>
            {actionLabel}
          </Button>
        )}
      </Box>
    </motion.div>
  );
}
