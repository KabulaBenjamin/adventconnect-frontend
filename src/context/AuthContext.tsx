import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'https://adventconnect-7jfq.onrender.com';
axios.defaults.baseURL = BACKEND_URL;

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  const processUser = (userData: any) => {
    if (!userData) return null;
    return { ...userData, isAdmin: userData.role === 'admin' || userData.role === 'pastor' };
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(processUser(parsed));
        if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?._id) {
      if (socket) { socket.disconnect(); setSocket(null); }
      return;
    }
    if (socket?.connected) return;

    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true
    });

    newSocket.on('connect', () => newSocket.emit('join', user._id));
    setSocket(newSocket);

    return () => { if (!localStorage.getItem('token')) newSocket.disconnect(); };
  }, [user?._id]);

  const login = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(processUser(userData));
  };

  const logout = () => {
    if (socket) { socket.disconnect(); setSocket(null); }
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