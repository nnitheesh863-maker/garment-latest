/**
 * SocketContext
 * Centralized WebSockets provider with auto-reconnect backoff and room subscription management.
 */
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect when user is actively logged in with a valid token
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      return;
    }

    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.'));

    const envSocket = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    const isEnvSocketLocal = !envSocket || envSocket.includes('localhost') || envSocket.includes('127.0.0.1');

    const socketUrl = isLocal
      ? (envSocket || `http://${window.location.hostname}:5000`)
      : (isEnvSocketLocal ? 'https://garment-latest.onrender.com' : envSocket);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setConnected(false);
      const errMsg = err?.message?.toLowerCase() || '';
      if (
        errMsg.includes('auth') ||
        errMsg.includes('token') ||
        errMsg.includes('forbidden') ||
        errMsg.includes('inactive')
      ) {
        // Disconnect immediately on auth rejection to stop polling/400 errors
        newSocket.disconnect();
      }
    });

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
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [token, user]);

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
