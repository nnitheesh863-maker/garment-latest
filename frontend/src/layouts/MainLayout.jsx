import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from '../components/common/Header';
import Sidebar, { DRAWER_WIDTH } from '../components/common/Sidebar';

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
          p: 3,
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
