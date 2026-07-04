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
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
          <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        {notifs.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          notifs.slice(0, 10).map((notif) => (
            <MenuItem
              key={notif._id || notif.id}
              onClick={() => handleMarkRead({ stopPropagation: () => {} }, notif._id || notif.id)}
              sx={{ bgcolor: notif.read ? 'transparent' : 'action.hover' }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CircleIcon sx={{ fontSize: 10, color: notif.read ? 'text.disabled' : 'primary.main' }} />
              </ListItemIcon>
              <ListItemText
                primary={notif.message || notif.title || 'Notification'}
                secondary={timeAgo(notif.createdAt)}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </MenuItem>
          ))
        )}
        <Divider />
        <Box px={2} py={1}>
          <Button fullWidth size="small" onClick={handleViewAll}>View all</Button>
        </Box>
      </Menu>
    </>
  );
}
