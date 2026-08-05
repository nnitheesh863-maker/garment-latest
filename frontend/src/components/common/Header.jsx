import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  TextField,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';
import { getInitials } from '../../utils/helpers';
import NotificationBell from './NotificationBell';
import { useNavigate } from 'react-router-dom';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function getShift(hour) {
  if (hour >= 5 && hour < 14) return { label: 'Morning Shift', icon: '🌅' };
  if (hour >= 14 && hour < 22) return { label: 'General Shift', icon: '☀️' };
  return { label: 'Night Shift', icon: '🌙' };
}

export default function Header({ onToggleSidebar }) {
  const { user, logout, isAdmin, isManager } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const now = useClock();
  const [anchorEl, setAnchorEl] = useState(null);

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
  const shift = getShift(now.getHours());
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: isLight ? 'rgba(255,248,242,0.72)' : 'rgba(26,18,18,0.72)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        borderBottom: isLight ? '1px solid rgba(241,213,192,0.55)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isLight ? '0 4px 24px rgba(89,23,27,0.05)' : 'none',
      }}
    >
      <Toolbar sx={{ px: { xs: 1.5, md: 3 }, gap: 1 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onToggleSidebar}
          sx={{ mr: 0.5, display: { md: 'none' }, color: 'primary.main' }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{ height: 30, width: 30, mr: 1, display: { xs: 'none', sm: 'block' }, borderRadius: 1 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            background: 'linear-gradient(135deg, #59171B, #A45A4A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: 17, sm: 19 },
            letterSpacing: '-0.02em',
          }}
        >
          GarmentOS
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          size="small"
          placeholder="AI Search orders, machines, tasks..."
          sx={{
            display: { xs: 'none', lg: 'block' },
            width: 320,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: isLight ? 'rgba(241,213,192,0.25)' : 'rgba(255,255,255,0.05)',
              border: isLight ? '1px solid rgba(241,213,192,0.6)' : '1px solid rgba(255,255,255,0.1)',
              '& fieldset': { border: 'none' },
              '&:hover': { bgcolor: isLight ? 'rgba(241,213,192,0.4)' : 'rgba(255,255,255,0.09)' },
              '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(122,35,40,0.18)' },
            },
            '& input': { fontSize: 13 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 19, color: '#7A6A63' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.4,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#A45A4A',
                    background: 'rgba(164,90,74,0.14)',
                    borderRadius: 1.5,
                    px: 0.8,
                    py: 0.35,
                    letterSpacing: '0.02em',
                  }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 11 }} /> AI
                </Box>
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title={`${shift.label} · ${timeStr}`}>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.8,
              px: 1.2,
              py: 0.55,
              borderRadius: 2.5,
              bgcolor: isLight ? 'rgba(241,213,192,0.35)' : 'rgba(255,255,255,0.05)',
              border: isLight ? '1px solid rgba(241,213,192,0.6)' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 15, color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" sx={{ fontSize: 10, color: '#7A6A63', lineHeight: 1.1, display: 'block', fontWeight: 500 }}>
                {shift.label}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 11.5, color: 'text.primary', lineHeight: 1.2, display: 'block', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {timeStr} <Box component="span" sx={{ color: '#7A6A63', fontWeight: 500 }}>{dateStr}</Box>
              </Typography>
            </Box>
          </Box>
        </Tooltip>

        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            gap: 0.6,
            px: 1.1,
            py: 0.55,
            borderRadius: 2.5,
            bgcolor: 'rgba(22,163,74,0.1)',
            border: '1px solid rgba(22,163,74,0.25)',
          }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16A34A', boxShadow: '0 0 7px rgba(22,163,74,0.6)', animation: 'pulseRing 2.4s ease-out infinite' }} />
          <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 700, color: '#16A34A' }}>
            All Systems Running
          </Typography>
        </Box>

        <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{
              color: '#7A6A63',
              bgcolor: isLight ? 'rgba(241,213,192,0.3)' : 'rgba(255,255,255,0.06)',
              borderRadius: 2,
              '&:hover': { bgcolor: isLight ? 'rgba(241,213,192,0.5)' : 'rgba(255,255,255,0.12)' },
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
            ml: 0.25,
            border: '2px solid',
            borderColor: isLight ? '#F1D5C0' : 'rgba(254,215,184,0.2)',
            borderRadius: 2,
            p: 0.4,
            '&:hover': { borderColor: 'primary.main' },
          }}
        >
          <Avatar sx={{ width: 30, height: 30, bgcolor: '#59171B', fontSize: 12, fontWeight: 700, color: '#FED7B8' }}>
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
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(89,23,27,0.16)',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(254,215,184,0.15)' : '#F1D5C0'}`,
              mt: 0.5,
              bgcolor: 'background.paper',
            },
          }}
        >
          <Box px={2} py={1.2} sx={{ borderBottom: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(254,215,184,0.1)' : '#F1D5C0'}` }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
              {user?.profile?.firstName || user?.firstName} {user?.profile?.lastName || user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" textTransform="capitalize" sx={{ fontSize: 11 }}>
              {user?.role}
            </Typography>
          </Box>
          <MenuItem onClick={handleProfile} sx={{ borderRadius: 2, mx: 0.75, my: 0.25 }}>
            <ListItemIcon><PersonIcon fontSize="small" sx={{ color: '#7A6A63' }} /></ListItemIcon>
            <ListItemText sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 500 } }}>Profile</ListItemText>
          </MenuItem>
          {isAdmin && (
            <MenuItem onClick={() => { handleClose(); navigate('/admin/settings'); }} sx={{ borderRadius: 2, mx: 0.75, my: 0.25 }}>
              <ListItemIcon><SettingsIcon fontSize="small" sx={{ color: '#7A6A63' }} /></ListItemIcon>
              <ListItemText sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 500 } }}>Settings</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, mx: 0.75, my: 0.25 }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#7A6A63' }} /></ListItemIcon>
            <ListItemText sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 500 } }}>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
