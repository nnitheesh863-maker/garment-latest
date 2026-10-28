import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleResetAndLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={3}
          sx={{
            background: 'linear-gradient(135deg, #FFF8F2 0%, #FED7B8 100%)',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              maxWidth: 580,
              borderRadius: 3.5,
              border: '1px solid #F1D5C0',
              boxShadow: '0 16px 48px rgba(89,23,27,0.14)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'rgba(220, 38, 38, 0.1)',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                fontSize: 28,
              }}
            >
              ⚠️
            </Box>
            <Typography variant="h5" sx={{ color: '#59171B', fontWeight: 800, mb: 1 }}>
              Application Encountered an Error
            </Typography>
            <Typography variant="body2" sx={{ color: '#7A6A63', mb: 2 }}>
              A client-side error occurred while rendering this page. You can reload or reset your local session.
            </Typography>
            {this.state.error && (
              <Box
                sx={{
                  p: 1.5,
                  mb: 3,
                  bgcolor: '#FAF4EF',
                  border: '1px solid #E8CFBB',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: '#8A2D33',
                  textAlign: 'left',
                  maxHeight: 140,
                  overflow: 'auto',
                }}
              >
                {this.state.error.toString()}
              </Box>
            )}
            <Box display="flex" gap={1.5} justifyContent="center" flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{
                  borderRadius: 2,
                  borderColor: '#59171B',
                  color: '#59171B',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2.5,
                }}
              >
                Reload Page
              </Button>
              <Button
                variant="contained"
                onClick={this.handleResetAndLogin}
                sx={{
                  borderRadius: 2,
                  bgcolor: '#59171B',
                  '&:hover': { bgcolor: '#7A2328' },
                  color: '#FED7B8',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2.5,
                }}
              >
                Clear Cache & Login
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
