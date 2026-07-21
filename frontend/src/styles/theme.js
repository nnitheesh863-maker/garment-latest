import { createTheme } from '@mui/material/styles';

const MAROON = '#59171B';
const MAROON_LIGHT = '#7A2328';
const CREAM = '#FED7B8';
const CREAM_LIGHT = '#FFF8F2';
const BORDER = '#F1D5C0';
const TEXT_PRIMARY = '#2C1A1A';
const TEXT_SECONDARY = '#7A6A63';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: MAROON, light: MAROON_LIGHT, dark: '#3D0F12' },
          secondary: { main: MAROON_LIGHT, light: '#8E3036', dark: '#59171B' },
          accent: { main: CREAM, light: '#FFE8D4', dark: '#F5C4A0' },
          error: { main: '#dc2626' },
          warning: { main: '#f59e0b' },
          info: { main: '#3b82f6' },
          success: { main: '#16a34a' },
          background: { default: CREAM_LIGHT, paper: '#FFFFFF' },
          text: { primary: TEXT_PRIMARY, secondary: TEXT_SECONDARY },
          divider: BORDER,
        }
      : {
          primary: { main: '#A45A4A', light: '#C47A6A', dark: MAROON },
          secondary: { main: CREAM, light: '#FFE8D4', dark: '#D4B098' },
          error: { main: '#ef5350' },
          warning: { main: '#fbbf24' },
          info: { main: '#60a5fa' },
          success: { main: '#4ade80' },
          background: { default: '#1a1212', paper: '#2c1a1a' },
          text: { primary: '#f5e6dc', secondary: '#b8a69c' },
          divider: '#3d2a22',
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.25rem' },
    h2: { fontWeight: 600, fontSize: '1.875rem' },
    h3: { fontWeight: 600, fontSize: '1.5rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.1rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 18,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: mode === 'light'
            ? '0 4px 20px rgba(89,23,27,0.06)'
            : '0 4px 20px rgba(0,0,0,0.3)',
          border: mode === 'light' ? `1px solid ${BORDER}` : '1px solid #3d2a22',
          transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: mode === 'light'
              ? '0 12px 40px rgba(89,23,27,0.1)'
              : '0 12px 40px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 200ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(180deg, ${MAROON}, ${MAROON_LIGHT})`,
          boxShadow: `0 4px 14px rgba(89,23,27,0.3)`,
          color: '#fff',
          '&:hover': {
            background: `linear-gradient(180deg, ${MAROON_LIGHT}, ${MAROON})`,
            boxShadow: `0 6px 20px rgba(89,23,27,0.4)`,
          },
        },
        containedSecondary: {
          background: CREAM,
          color: MAROON,
          boxShadow: `0 2px 8px rgba(89,23,27,0.1)`,
          '&:hover': {
            background: '#FFE8D4',
            boxShadow: `0 4px 12px rgba(89,23,27,0.15)`,
          },
        },
        outlined: {
          borderColor: BORDER,
          color: MAROON,
          '&:hover': {
            borderColor: MAROON,
            bgcolor: 'rgba(89,23,27,0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': { borderColor: BORDER },
            '&:hover fieldset': { borderColor: MAROON_LIGHT },
            '&.Mui-focused fieldset': { borderColor: MAROON },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            backgroundColor: CREAM_LIGHT,
            color: TEXT_PRIMARY,
            borderBottom: `2px solid ${BORDER}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(254,215,184,0.15)',
          },
          '&:hover': {
            backgroundColor: 'rgba(254,215,184,0.25) !important',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,248,242,0.8)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: BORDER,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export function createAppTheme(mode) {
  return createTheme(getDesignTokens(mode));
}
