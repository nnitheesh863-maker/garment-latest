import React, { useState, useEffect } from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import VoiceAssistant from '../components/VoiceAssistant';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role) {
      window.__router = (path) => navigate(path);
    }
  }, [user, navigate]);

  const handleToggleSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      <Header onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant="permanent"
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: '100vh',
          overflow: 'auto',
          bgcolor: '#f1f5f9',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 3 },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3, maxWidth: 'none', width: '100%' }}>
          {children}
        </Box>
      </Box>
      <VoiceAssistant />
    </Box>
  );
}