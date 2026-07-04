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

  return (
    <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onToggleSidebar} sx={{ mr: 1, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{ height: 32, width: 32, mr: 1, display: { xs: 'none', sm: 'block' } }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ flexGrow: 1 }}>
          GarmentOS
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          <NotificationBell />
          <IconButton onClick={handleMenu} size="small">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {user ? getInitials(`${user.profile?.firstName || user.firstName} ${user.profile?.lastName || user.lastName}`) : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box px={2} py={1}>
              <Typography variant="subtitle2">{user?.profile?.firstName || user?.firstName} {user?.profile?.lastName || user?.lastName}</Typography>
              <Typography variant="caption" color="text.secondary" textTransform="capitalize">{user?.role}</Typography>
            </Box>
            <MenuItem onClick={handleProfile}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => { handleClose(); navigate('/admin/settings'); }}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
