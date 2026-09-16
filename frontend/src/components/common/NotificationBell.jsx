import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Fade,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../api/axios';
import { timeAgo } from '../../utils/helpers';

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { notifications } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      setNotifs((prev) => {
        const existing = new Set(prev.map((n) => n._id || n.id));
        const newOnes = notifications.filter((n) => !existing.has(n._id || n.id));
        return [...newOnes, ...prev].slice(0, 20);
      });
      setUnreadCount((prev) => {
        const newUnread = notifications.filter((n) => !n.read).length;
        return prev + newUnread;
      });
    }
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.list({ limit: 20 });
      const data = res.data.notifications || res.data;
      setNotifs(Array.isArray(data) ? data : []);
      const count = res.data.unreadCount ?? data.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch {
      // silent
    }
  };

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationApi.markRead(id);
      setNotifs((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleViewAll = () => {
    handleClose();
    const base =
      user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/employee';
    navigate(`${base}/dashboard`);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: unreadCount > 0 ? '#59171B' : '#7A6A63',
          bgcolor: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(241, 213, 192, 0.4)' : 'rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 1.1,
          transition: 'all 0.25s ease',
          '&:hover': {
            bgcolor: 'rgba(241, 213, 192, 0.7)',
            transform: 'scale(1.06)',
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#59171B',
              color: '#FED7B8',
              fontWeight: 800,
              fontSize: 10,
              boxShadow: '0 0 8px rgba(89, 23, 27, 0.5)',
              border: '1.5px solid #fff',
            },
          }}
        >
          <NotificationsIcon
            className={unreadCount > 0 ? 'bell-anim' : ''}
            sx={{ fontSize: 20 }}
          />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        TransitionComponent={Fade}
        transitionDuration={250}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 520,
            borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(89, 23, 27, 0.16)',
            border: '1px solid rgba(241, 213, 192, 0.8)',
            background: (theme) =>
              theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.96)'
                : 'rgba(35, 20, 24, 0.96)',
            backdropFilter: 'blur(20px)',
            mt: 1.25,
            p: 0,
            overflow: 'hidden',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2.5}
          py={1.5}
          sx={{
            borderBottom: '1px solid rgba(241, 213, 192, 0.5)',
            background: 'linear-gradient(180deg, rgba(254, 215, 184, 0.25) 0%, transparent 100%)',
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', fontSize: '0.95rem' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Box
                component="span"
                sx={{
                  px: 1,
                  py: 0.15,
                  borderRadius: '999px',
                  bgcolor: '#59171B',
                  color: '#FED7B8',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {unreadCount} NEW
              </Box>
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
              onClick={handleMarkAllRead}
              sx={{ color: '#59171B', fontSize: 11.5, fontWeight: 700, textTransform: 'none' }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {notifs.length === 0 ? (
          <Box py={5} textAlign="center" px={3}>
            <NotificationsIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.35, mb: 1 }} />
            <Typography color="text.secondary" variant="body2" fontWeight={500}>
              You're all caught up!
            </Typography>
            <Typography color="text.secondary" variant="caption" sx={{ opacity: 0.7 }}>
              No new alerts or system messages.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 0.5 }}>
            {notifs.slice(0, 10).map((notif) => (
              <MenuItem
                key={notif._id || notif.id}
                onClick={() => handleMarkRead({ stopPropagation: () => {} }, notif._id || notif.id)}
                sx={{
                  bgcolor: notif.read ? 'transparent' : 'rgba(254, 215, 184, 0.22)',
                  borderRadius: '12px',
                  mx: 1,
                  my: 0.5,
                  py: 1,
                  px: 1.5,
                  transition: 'background-color 0.2s, transform 0.15s',
                  '&:hover': {
                    bgcolor: notif.read ? 'rgba(241, 213, 192, 0.3)' : 'rgba(254, 215, 184, 0.38)',
                    transform: 'translateX(3px)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 26 }}>
                  <CircleIcon
                    sx={{
                      fontSize: 8,
                      color: notif.read ? 'rgba(241, 213, 192, 0.8)' : '#59171B',
                      boxShadow: notif.read ? 'none' : '0 0 6px rgba(89, 23, 27, 0.5)',
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={notif.message || notif.title || 'Notification'}
                  secondary={timeAgo(notif.createdAt)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    sx: {
                      color: 'text.primary',
                      fontWeight: notif.read ? 500 : 700,
                      fontSize: '0.85rem',
                    },
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    sx: { color: 'text.secondary', fontSize: '0.75rem', mt: 0.25 },
                  }}
                />
              </MenuItem>
            ))}
          </Box>
        )}

        <Box
          px={2}
          py={1.25}
          sx={{
            borderTop: '1px solid rgba(241, 213, 192, 0.5)',
            background: 'rgba(255, 248, 242, 0.5)',
          }}
        >
          <Button
            fullWidth
            size="small"
            onClick={handleViewAll}
            sx={{
              color: '#59171B',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.85rem',
              borderRadius: '8px',
            }}
          >
            View all notifications →
          </Button>
        </Box>
      </Menu>
    </>
  );
}
