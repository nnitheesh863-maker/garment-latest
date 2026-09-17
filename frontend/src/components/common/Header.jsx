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
  Fade,
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
import ProfileSettingsModal from '../modals/ProfileSettingsModal';
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
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const now = useClock();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleClose();
    setProfileModalOpen(true);
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
        bgcolor: isLight ? 'rgba(255, 248, 242, 0.82)' : 'rgba(26, 18, 18, 0.82)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: isLight
          ? '1px solid rgba(241, 213, 192, 0.65)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isLight ? '0 4px 24px rgba(89, 23, 27, 0.04)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <Toolbar sx={{ px: { xs: 1.5, md: 3 }, gap: 1 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onToggleSidebar}
          sx={{
            mr: 0.5,
            display: { md: 'none' },
            color: 'primary.main',
            borderRadius: '10px',
            bgcolor: isLight ? 'rgba(241, 213, 192, 0.35)' : 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{
            height: 32,
            width: 32,
            mr: 1,
            display: { xs: 'none', sm: 'block' },
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(89, 23, 27, 0.2)',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
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
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          Couture Intelligence
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          size="small"
          placeholder="AI Search orders, machines, tasks..."
          sx={{
            display: { xs: 'none', lg: 'block' },
            width: 320,
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              bgcolor: isLight ? 'rgba(241, 213, 192, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: isLight
                ? '1px solid rgba(241, 213, 192, 0.6)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.25s ease',
              '& fieldset': { border: 'none' },
              '&:hover': {
                bgcolor: isLight ? 'rgba(241, 213, 192, 0.4)' : 'rgba(255, 255, 255, 0.09)',
              },
              '&.Mui-focused': {
                boxShadow: '0 0 0 3px rgba(122, 35, 40, 0.18)',
                width: 360,
              },
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
                    fontWeight: 800,
                    color: '#A45A4A',
                    background: 'rgba(164, 90, 74, 0.14)',
                    borderRadius: '6px',
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
              px: 1.4,
              py: 0.6,
              borderRadius: '12px',
              bgcolor: isLight ? 'rgba(241, 213, 192, 0.35)' : 'rgba(255, 255, 255, 0.05)',
              border: isLight
                ? '1px solid rgba(241, 213, 192, 0.6)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 15, color: 'primary.main' }} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: 10,
                  color: '#7A6A63',
                  lineHeight: 1.1,
                  display: 'block',
                  fontWeight: 600,
                }}
              >
                {shift.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: 11.5,
                  color: 'text.primary',
                  lineHeight: 1.2,
                  display: 'block',
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {timeStr}{' '}
                <Box component="span" sx={{ color: '#7A6A63', fontWeight: 500 }}>
                  {dateStr}
                </Box>
              </Typography>
            </Box>
          </Box>
        </Tooltip>

        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            gap: 0.75,
            px: 1.3,
            py: 0.6,
            borderRadius: '12px',
            bgcolor: 'rgba(22, 163, 74, 0.1)',
            border: '1px solid rgba(22, 163, 74, 0.25)',
          }}
        >
          <span className="live-dot active" />
          <Typography
            variant="caption"
            sx={{ fontSize: 11, fontWeight: 800, color: '#16A34A', letterSpacing: '0.02em' }}
          >
            All Systems Running
          </Typography>
        </Box>

        <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{
              color: isLight ? '#59171B' : '#FED7B8',
              bgcolor: isLight ? 'rgba(241, 213, 192, 0.4)' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              p: 1.15,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: isLight ? 'rgba(241, 213, 192, 0.8)' : 'rgba(255, 255, 255, 0.16)',
                transform: 'rotate(20deg) scale(1.08)',
                boxShadow: '0 4px 14px rgba(89, 23, 27, 0.2)',
              },
              '&:active': {
                transform: 'scale(0.9)',
              },
            }}
          >
            {mode === 'light' ? (
              <DarkModeIcon sx={{ fontSize: 20 }} />
            ) : (
              <LightModeIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Tooltip>

        <NotificationBell />

        <IconButton
          onClick={handleMenu}
          size="small"
          sx={{
            ml: 0.25,
            border: '2px solid',
            borderColor: isLight ? '#F1D5C0' : 'rgba(254, 215, 184, 0.25)',
            borderRadius: '14px',
            p: 0.4,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: 'primary.main',
              transform: 'scale(1.08)',
              boxShadow: '0 4px 14px rgba(89, 23, 27, 0.25)',
            },
            '&:active': {
              transform: 'scale(0.92)',
            },
          }}
        >
          <Avatar
            src={user?.profile?.profileImage || user?.profileImage || undefined}
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#59171B',
              fontSize: 12,
              fontWeight: 800,
              color: '#FED7B8',
            }}
          >
            {user
              ? getInitials(
                  `${user.profile?.firstName || user.firstName} ${
                    user.profile?.lastName || user.lastName
                  }`
                )
              : 'U'}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          TransitionComponent={Fade}
          transitionDuration={200}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              borderRadius: '18px',
              boxShadow: '0 16px 40px rgba(89, 23, 27, 0.16)',
              border: (theme) =>
                `1px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(254, 215, 184, 0.15)' : '#F1D5C0'
                }`,
              mt: 1,
              bgcolor: 'background.paper',
              p: 0.5,
              minWidth: 200,
            },
          }}
        >
          <Box
            px={2}
            py={1.5}
            sx={{
              borderBottom: (theme) =>
                `1px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(254, 215, 184, 0.1)' : '#F1D5C0'
                }`,
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
              {user?.profile?.firstName || user?.firstName}{' '}
              {user?.profile?.lastName || user?.lastName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              textTransform="capitalize"
              sx={{ fontSize: 11, fontWeight: 600 }}
            >
              {user?.role}
            </Typography>
          </Box>
          <MenuItem onClick={handleProfile} sx={{ borderRadius: '10px', mx: 0.5, my: 0.35 }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" sx={{ color: '#7A6A63' }} />
            </ListItemIcon>
            <ListItemText
              sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 600 } }}
            >
              Profile Settings
            </ListItemText>
          </MenuItem>
          {isAdmin && (
            <MenuItem
              onClick={() => {
                handleClose();
                navigate('/admin/settings');
              }}
              sx={{ borderRadius: '10px', mx: 0.5, my: 0.35 }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" sx={{ color: '#7A6A63' }} />
              </ListItemIcon>
              <ListItemText
                sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 600 } }}
              >
                Settings
              </ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout} sx={{ borderRadius: '10px', mx: 0.5, my: 0.35 }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: '#DC2626' }} />
            </ListItemIcon>
            <ListItemText
              sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 600, color: '#DC2626' } }}
            >
              Logout
            </ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
      <ProfileSettingsModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </AppBar>
  );
}
