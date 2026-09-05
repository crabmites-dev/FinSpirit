import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from './api.js';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications au montage
  useEffect(() => {
    const isAuthPage = ['/login', '/register', '/forgotPassword', '/resetPassword'].includes(window.location.pathname);
    const hasAuth = localStorage.getItem('token') || localStorage.getItem('userName');

    if (!isAuthPage && hasAuth) {
      fetchNotifications();
    }

    // Fetch toutes les 30 secondes pour les utilisateurs connectés
    const interval = setInterval(() => {
      const isAuthPageNow = ['/login', '/register', '/forgotPassword', '/resetPassword'].includes(window.location.pathname);
      const hasAuthNow = localStorage.getItem('token') || localStorage.getItem('userName');
      if (!isAuthPageNow && hasAuthNow) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.notifications) {
        const mapped = res.data.notifications.map((n) => ({
          ...n,
          isRead: n.isRead ?? n.is_read ?? false,
          timestamp: n.timestamp ?? n.created_at ?? new Date().toISOString(),
        }));

        setNotifications(mapped);
        const unread = mapped.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Erreur récupération notifications:', error);
      }
    }
  };

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotif = {
      id,
      timestamp: new Date(),
      isRead: false,
      type: 'info', // 'success', 'warning', 'error', 'info'
      ...notification
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
    return id;
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans NotificationProvider');
  }
  return context;
}
 