import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to attach isAdmin helper based on backend role
  const processUser = (userData: any) => {
    if (!userData) return null;
    return {
      ...userData,
      isAdmin: userData.role === 'admin' || userData.role === 'pastor'
    };
  };

  // 1. Core Authentication Bootstrap Lifecycle
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(processUser(parsed));

        // Ensure Axios headers are restored if a user reloads the tab
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // 2. Real-time Socket Lifecycle Management
  useEffect(() => {
    // If the user isn't authenticated yet, don't build a socket pipeline
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Stabilize: If a socket connection is already active or connecting, skip recreation
    if (socket?.connected) return;

    const newSocket = io('http://localhost:4000', {
      transports: ['websocket'], // Stick strictly to stable websocket pipes
      withCredentials: true,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('📡 Global AdventConnect Real-time Socket Connected Successfully');
      // Aligned cleanly with backend socket.js handler mapping
      newSocket.emit('join', user._id);
    });

    newSocket.on('friend-request-received', (data) => {
      console.log('📥 New connection request arrived live from:', data.username);
    });

    newSocket.on('friend-request-accepted', (data) => {
      console.log(`🤝 Friendship confirmed with ${data.username}!`);
    });

    setSocket(newSocket);

    // Only disconnect if the component completely unmounts or the user logs out
    return () => {
      if (!localStorage.getItem('token')) {
        newSocket.disconnect();
      }
    };
  }, [user?._id]); // Only re-run if the explicit user ID changes string values

  const login = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(processUser(userData));
  };

  const logout = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    delete axios.defaults.headers.common['Authorization'];
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, socket, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
