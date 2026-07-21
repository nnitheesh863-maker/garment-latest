import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/Circle';
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
      setNotifs((prev) => prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n)));
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
    const base = user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/employee';
    navigate(`${base}/dashboard`);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: '#7A6A63',
          bgcolor: 'rgba(241,213,192,0.3)',
          borderRadius: 1.5,
          '&:hover': { bgcolor: 'rgba(241,213,192,0.5)' },
        }}
      >
        <Badge badgeContent={unreadCount} sx={{ '& .MuiBadge-badge': { bgcolor: '#59171B', color: '#FED7B8', fontWeight: 600, fontSize: 10 } }}>
          <NotificationsIcon sx={{ fontSize: 20 }} />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360, maxHeight: 480, borderRadius: 2,
            boxShadow: '0 8px 30px rgba(89,23,27,0.1)',
            border: '1px solid #F1D5C0',
            mt: 0.5,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1} sx={{ borderBottom: '1px solid #F1D5C0' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2C1A1A' }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ color: '#59171B', fontSize: 12, fontWeight: 600 }}>Mark all read</Button>
          )}
        </Box>
        {notifs.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="#7A6A63" variant="body2">No notifications</Typography>
          </Box>
        ) : (
          notifs.slice(0, 10).map((notif) => (
            <MenuItem
              key={notif._id || notif.id}
              onClick={() => handleMarkRead({ stopPropagation: () => {} }, notif._id || notif.id)}
              sx={{
                bgcolor: notif.read ? 'transparent' : 'rgba(254,215,184,0.15)',
                borderRadius: 1, mx: 0.5, my: 0.25,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CircleIcon sx={{ fontSize: 8, color: notif.read ? '#F1D5C0' : '#59171B' }} />
              </ListItemIcon>
              <ListItemText
                primary={notif.message || notif.title || 'Notification'}
                secondary={timeAgo(notif.createdAt)}
                primaryTypographyProps={{ variant: 'body2', noWrap: true, sx: { color: '#2C1A1A' } }}
                secondaryTypographyProps={{ variant: 'caption', sx: { color: '#7A6A63' } }}
              />
            </MenuItem>
          ))
        )}
        <Box px={2} py={1} sx={{ borderTop: '1px solid #F1D5C0' }}>
          <Button fullWidth size="small" onClick={handleViewAll} sx={{ color: '#59171B', fontWeight: 600 }}>
            View all
          </Button>
        </Box>
      </Menu>
    </>
  );
}
