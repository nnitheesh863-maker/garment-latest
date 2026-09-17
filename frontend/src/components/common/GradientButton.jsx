import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

const MotionButton = motion.create(Button);

const GRADIENT_PRESETS = {
  primary: {
    bg: 'linear-gradient(135deg, #59171B 0%, #7A2328 55%, #A45A4A 100%)',
    hoverBg: 'linear-gradient(135deg, #7A2328 0%, #943A40 55%, #B86B5A 100%)',
    shadow: '0 8px 24px rgba(89, 23, 27, 0.35)',
    hoverShadow: '0 14px 36px rgba(122, 35, 40, 0.52)',
    color: '#FFF8F2',
  },
  luxuryGold: {
    bg: 'linear-gradient(135deg, #A88362 0%, #C49E7C 50%, #E8C4A2 100%)',
    hoverBg: 'linear-gradient(135deg, #926F50 0%, #B58F6D 50%, #DCB794 100%)',
    shadow: '0 8px 24px rgba(168, 131, 98, 0.38)',
    hoverShadow: '0 14px 36px rgba(168, 131, 98, 0.55)',
    color: '#1A1412',
  },
  gold: {
    bg: 'linear-gradient(135deg, #E8A06B 0%, #FED7B8 100%)',
    hoverBg: 'linear-gradient(135deg, #D98E57 0%, #F5C49E 100%)',
    shadow: '0 8px 24px rgba(232, 160, 107, 0.35)',
    hoverShadow: '0 14px 36px rgba(232, 160, 107, 0.5)',
    color: '#3A0D10',
  },
  glassMaroon: {
    bg: 'linear-gradient(135deg, rgba(89, 23, 27, 0.12) 0%, rgba(254, 215, 184, 0.18) 100%)',
    hoverBg: 'linear-gradient(135deg, rgba(89, 23, 27, 0.22) 0%, rgba(254, 215, 184, 0.3) 100%)',
    shadow: '0 6px 20px rgba(89, 23, 27, 0.15)',
    hoverShadow: '0 10px 28px rgba(89, 23, 27, 0.25)',
    border: '1.5px solid rgba(89, 23, 27, 0.25)',
    color: '#59171B',
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
      whileHover={!disabled && !loading ? { scale: 1.03, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.94, filter: 'brightness(1.15)' } : {}}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      variant={variant}
      disabled={disabled || loading}
      sx={{
        borderRadius: '14px',
        fontWeight: 750,
        textTransform: 'none',
        letterSpacing: '0.025em',
        px: 3.2,
        py: 1.3,
        position: 'relative',
        overflow: 'hidden',
        background: currentPreset.bg,
        color: currentPreset.color,
        border: currentPreset.border || 'none',
        boxShadow: glow ? currentPreset.shadow : 'none',
        transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        '&:hover': {
          background: currentPreset.hoverBg,
          boxShadow: glow ? currentPreset.hoverShadow : 'none',
          borderColor: 'rgba(89, 23, 27, 0.45)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '60%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          transform: 'skewX(-25deg)',
          transition: 'left 0.75s ease',
        },
        '&:hover::after': {
          left: '200%',
        },
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <CircularProgress size={20} sx={{ color: currentPreset.color, mr: 1 }} />
      ) : icon ? (
        React.cloneElement(icon, { style: { marginRight: 8, fontSize: 19 } })
      ) : null}
      {children}
    </MotionButton>
  );
}
