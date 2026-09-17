import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../utils/constants';

export const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    const handleStorage = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => {
      const current = localStorage.getItem('token');
      if (current !== token) setToken(current);
    }, 500);
    return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
  }, [token]);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', () => setConnected(false));

    newSocket.on('newNotification', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      toast.info(notification.message || 'New notification');
    });

    newSocket.on('orderUpdated', (data) => {
      toast.info(`Order ${data?.orderId || ''} updated`);
    });

    newSocket.on('taskUpdated', (data) => {
      toast.info(`Task ${data?.taskId || ''} updated`);
    });

    newSocket.on('machineStatusChanged', (data) => {
      toast.warning(`Machine ${data?.machineName || ''} status changed to ${data?.status || ''}`);
    });

    newSocket.on('qualityAlert', (data) => {
      toast.error(`Quality alert: ${data?.message || ''}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setConnected(false);
    };
  }, [token]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket, connected, notifications,
      addNotification, clearNotifications,
    }}>
      {children}
    </SocketContext.Provider>
  );
}
