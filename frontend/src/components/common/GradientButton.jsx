import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

const MotionButton = motion.create(Button);

const GRADIENT_PRESETS = {
  primary: {
    bg: 'linear-gradient(135deg, #59171B 0%, #7A2328 60%, #A45A4A 100%)',
    hoverBg: 'linear-gradient(135deg, #7A2328 0%, #A45A4A 60%, #C27A63 100%)',
    shadow: '0 8px 24px rgba(89, 23, 27, 0.32)',
    hoverShadow: '0 12px 32px rgba(122, 35, 40, 0.45)',
    color: '#FFF8F2',
  },
  gold: {
    bg: 'linear-gradient(135deg, #E8A06B 0%, #FED7B8 100%)',
    hoverBg: 'linear-gradient(135deg, #D98E57 0%, #F5C49E 100%)',
    shadow: '0 8px 24px rgba(232, 160, 107, 0.35)',
    hoverShadow: '0 12px 32px rgba(232, 160, 107, 0.5)',
    color: '#3A0D10',
  },
  success: {
    bg: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
    hoverBg: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
    shadow: '0 8px 24px rgba(22, 163, 74, 0.32)',
    hoverShadow: '0 12px 32px rgba(22, 163, 74, 0.45)',
    color: '#FFFFFF',
  },
  danger: {
    bg: 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)',
    hoverBg: 'linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)',
    shadow: '0 8px 24px rgba(220, 38, 38, 0.32)',
    hoverShadow: '0 12px 32px rgba(220, 38, 38, 0.45)',
    color: '#FFFFFF',
  },
};

export default function GradientButton({
  children,
  variant = 'contained',
  preset = 'primary',
  glow = true,
  loading = false,
  disabled = false,
  icon,
  sx,
  ...props
}) {
  const currentPreset = GRADIENT_PRESETS[preset] || GRADIENT_PRESETS.primary;

  return (
    <MotionButton
      whileHover={!disabled && !loading ? { scale: 1.025 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      variant={variant}
      disabled={disabled || loading}
      sx={{
        borderRadius: '12px',
        fontWeight: 700,
        textTransform: 'none',
        letterSpacing: '0.02em',
        px: 3,
        py: 1.25,
        position: 'relative',
        overflow: 'hidden',
        background: currentPreset.bg,
        color: currentPreset.color,
        boxShadow: glow ? currentPreset.shadow : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          background: currentPreset.hoverBg,
          boxShadow: glow ? currentPreset.hoverShadow : 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
          transform: 'skewX(-25deg)',
          transition: 'left 0.65s ease',
        },
        '&:hover::after': {
          left: '180%',
        },
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <CircularProgress size={20} sx={{ color: currentPreset.color, mr: 1 }} />
      ) : icon ? (
        React.cloneElement(icon, { style: { marginRight: 8, fontSize: 18 } })
      ) : null}
      {children}
    </MotionButton>
  );
}
