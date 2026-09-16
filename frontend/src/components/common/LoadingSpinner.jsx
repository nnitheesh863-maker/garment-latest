import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function LoadingSpinner({
  fullPage = true,
  message = 'Loading factory intelligence...',
  size = 40,
}) {
  if (!fullPage) {
    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        py={4}
        gap={1.5}
      >
        <Box
          className="ai-orb"
          sx={{
            width: size * 1.5,
            height: size * 1.5,
            animation: 'pulseRing 2s ease-out infinite',
          }}
        >
          <Box
            sx={{
              width: size * 0.45,
              height: size * 0.45,
              borderRadius: '50%',
              bgcolor: '#FED7B8',
              boxShadow: '0 0 12px rgba(254, 215, 184, 0.8)',
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: 'text.secondary',
          }}
        >
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
      sx={{
        background: 'radial-gradient(circle at 50% 40%, #FFF8F2 0%, #FFEAD7 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        className="ai-orb"
        sx={{
          width: 96,
          height: 96,
          boxShadow: '0 12px 40px rgba(89, 23, 27, 0.35)',
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: '#FED7B8',
            boxShadow: '0 0 16px #FED7B8',
            animation: 'floatGentle 3s ease-in-out infinite',
          }}
        />
      </Box>
      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          background: 'linear-gradient(135deg, #59171B, #A45A4A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
          mt: 1,
        }}
      >
        Couture Intelligence
      </Typography>
      <Box className="loading-dots">
        <span />
        <span />
        <span />
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          maxWidth: 280,
          textAlign: 'center',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}
