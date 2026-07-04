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

  render() {
    if (this.state.hasError) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
          <Paper sx={{ p: 4, maxWidth: 600 }}>
            <Typography variant="h5" color="error" gutterBottom fontWeight={700}>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </Typography>
            <Button variant="contained" onClick={() => { this.setState({ hasError: false }); window.location.href = '/login'; }}>
              Go to Login
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
