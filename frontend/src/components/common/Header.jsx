import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';
import { getInitials } from '../../utils/helpers';
import NotificationBell from './NotificationBell';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
  const { user, logout, isAdmin, isManager } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleClose();
    const base = isAdmin ? '/admin' : isManager ? '/manager' : '/employee';
    navigate(`${base}/dashboard`);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const isLight = mode === 'light';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: isLight ? 'rgba(255,248,242,0.72)' : 'rgba(26,18,18,0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: isLight ? '1px solid rgba(241,213,192,0.5)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Toolbar sx={{ px: { xs: 1.5, md: 3 } }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onToggleSidebar}
          sx={{ mr: 1, display: { md: 'none' }, color: '#59171B' }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{ height: 30, width: 30, mr: 1.5, display: { xs: 'none', sm: 'block' }, borderRadius: 1 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            flexGrow: 1,
            background: 'linear-gradient(135deg, #59171B, #A45A4A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GarmentOS
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{
                color: '#7A6A63',
                bgcolor: isLight ? 'rgba(241,213,192,0.3)' : 'rgba(255,255,255,0.06)',
                borderRadius: 1.5,
                '&:hover': { bgcolor: isLight ? 'rgba(241,213,192,0.5)' : 'rgba(255,255,255,0.1)' },
              }}
            >
              {mode === 'light' ? <DarkModeIcon sx={{ fontSize: 20 }} /> : <LightModeIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
          <NotificationBell />
          <IconButton
            onClick={handleMenu}
            size="small"
            sx={{
              ml: 0.5,
              border: '2px solid',
              borderColor: '#F1D5C0',
              borderRadius: 1.5,
              p: 0.5,
              '&:hover': { borderColor: '#59171B' },
            }}
          >
            <Avatar sx={{
              width: 30, height: 30,
              bgcolor: '#59171B',
              fontSize: 12,
              fontWeight: 700,
              color: '#FED7B8',
            }}>
              {user ? getInitials(`${user.profile?.firstName || user.firstName} ${user.profile?.lastName || user.lastName}`) : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 8px 30px rgba(89,23,27,0.1)',
                border: '1px solid #F1D5C0',
                mt: 0.5,
              },
            }}
          >
            <Box px={2} py={1} sx={{ borderBottom: '1px solid #F1D5C0' }}>
              <Typography variant="subtitle2" sx={{ color: '#2C1A1A' }}>
                {user?.profile?.firstName || user?.firstName} {user?.profile?.lastName || user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                {user?.role}
              </Typography>
            </Box>
            <MenuItem onClick={handleProfile} sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}>
              <ListItemIcon><PersonIcon fontSize="small" sx={{ color: '#7A6A63' }} /></ListItemIcon>
              <ListItemText sx={{ color: '#2C1A1A' }}>Profile</ListItemText>
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => { handleClose(); navigate('/admin/settings'); }} sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}>
                <ListItemIcon><SettingsIcon fontSize="small" sx={{ color: '#7A6A63' }} /></ListItemIcon>
                <ListItemText sx={{ color: '#2C1A1A' }}>Settings</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout} sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}>
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#7A6A63' }} /></ListItemIcon>
              <ListItemText sx={{ color: '#2C1A1A' }}>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
