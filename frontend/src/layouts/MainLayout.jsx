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
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <div className="app-aurora" aria-hidden="true" />
      <Box sx={{ display: 'flex', width: '100%', position: 'relative', zIndex: 1 }}>
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
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#E0BFA8', borderRadius: 4 },
          }}
        >
          <Toolbar />
          <Box
            sx={{
              p: { xs: 2, sm: 2.5, md: 3.5 },
              maxWidth: 'none',
              width: '100%',
            }}
          >
            {children}
          </Box>
        </Box>
        <VoiceAssistant />
      </Box>
    </Box>
  );
}
