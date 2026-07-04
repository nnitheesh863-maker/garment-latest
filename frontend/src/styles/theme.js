import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#3F51B5', light: '#7986CB', dark: '#303F9F' },
          secondary: { main: '#0097A7', light: '#4DD0E1', dark: '#006064' },
          error: { main: '#f44336' },
          warning: { main: '#ff9800' },
          info: { main: '#2196f3' },
          success: { main: '#4caf50' },
          background: { default: '#f5f5f5', paper: '#ffffff' },
        }
      : {
          primary: { main: '#7986CB', light: '#9FA8DA', dark: '#3F51B5' },
          secondary: { main: '#4DD0E1', light: '#80DEEA', dark: '#0097A7' },
          error: { main: '#ef5350' },
          warning: { main: '#ffa726' },
          info: { main: '#42a5f5' },
          success: { main: '#66bb6a' },
          background: { default: '#121212', paper: '#1e1e1e' },
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
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light'
            ? '0 2px 8px rgba(0,0,0,0.08)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            backgroundColor: mode === 'light' ? '#fafafa' : '#2c2c2c',
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
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
  },
});

export function createAppTheme(mode) {
  return createTheme(getDesignTokens(mode));
}
