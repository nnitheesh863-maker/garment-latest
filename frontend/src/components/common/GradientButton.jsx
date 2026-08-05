import React from 'react';
import { Button } from '@mui/material';

export default function GradientButton({
  children,
  variant = 'contained',
  color = 'primary',
  glow = true,
  sx,
  ...props
}) {
  return (
    <Button
      variant={variant}
      color={color}
      sx={{
        ...(variant === 'contained' && color === 'primary'
          ? {
              background: 'linear-gradient(135deg, #59171B 0%, #7A2328 100%)',
              boxShadow: glow ? '0 8px 22px rgba(89,23,27,0.32)' : 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #7A2328 0%, #A45A4A 100%)',
                boxShadow: glow ? '0 12px 32px rgba(122,35,40,0.45)' : 'none',
              },
            }
          : {}),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
