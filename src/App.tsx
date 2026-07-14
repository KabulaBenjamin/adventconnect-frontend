import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import axios from 'axios';

// Components
import SanctuaryLibrary from "./components/SanctuaryLibrary";
import ChallengeManager from "./components/ChallengeManager"; 
import SearchPage from "./components/SearchPage";

// Pages
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Trivia from './pages/Trivia';
import Devotionals from './pages/Devotionals';
import Groups from './pages/Groups';
import Events from './pages/Events';
import Meeting from './pages/Meeting';
import MeetingsList from './pages/MeetingsList';
import Live from './pages/Live';
import Messages from './pages/Messages';

// Robust helper to inspect and sanitize tokens at runtime
const getCleanToken = (): string | null => {
  const token = localStorage.getItem('token');
  console.log("🔍 [Interceptor Diagnosis] Raw storage token value:", token);
  
  if (!token || token === '[object Object]' || token === 'undefined' || token === 'null') {
    return null;
  }
  
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1).trim();
  }
  
  return token.trim();
};

// 1. GLOBAL AXIOS INTERCEPTOR
axios.interceptors.request.use(
  (config) => {
    const token = getCleanToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. SAFE GLOBAL NATIVE FETCH INTERCEPTOR (Prevents Header Mutation Crashes)
const { fetch: originalFetch } = window;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let config = init ? { ...init } : {};
  const token = getCleanToken();

  if (token) {
    // Case A: Headers is an instance of native Headers (creates a safe, mutable copy)
    if (config.headers instanceof Headers) {
      const mutableHeaders = new Headers(config.headers);
      if (!mutableHeaders.has('Authorization')) {
        mutableHeaders.set('Authorization', `Bearer ${token}`);
      }
      config.headers = mutableHeaders;
    } 
    // Case B: Headers is an Array of [key, value] pairs
    else if (Array.isArray(config.headers)) {
      const hasAuth = config.headers.some(([key]) => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        config.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } 
    // Case C: Headers is a plain object
    else {
      const headersObj = (config.headers || {}) as Record<string, string>;
      const hasAuth = Object.keys(headersObj).some(key => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        config.headers = {
          ...headersObj,
          'Authorization': `Bearer ${token}`
        };
      }
    }
  }

  return originalFetch(input, config);
};

const CatchAllRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<Layout><Feed /></Layout>} />
            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
            
            {/* Rendered standalone to bypass Navbar/Layout structural crashes */}
            <Route path="/messages" element={<Messages />} />
            
            <Route path="/groups" element={<Layout><Groups /></Layout>} />
            <Route path="/meetings" element={<Layout><MeetingsList /></Layout>} />
            <Route path="/trivia" element={<Layout><Trivia /></Layout>} />
            <Route path="/events" element={<Layout><Events /></Layout>} />
            <Route path="/live" element={<Layout><Live /></Layout>} />
            <Route path="/challenges" element={<Layout><ChallengeManager /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            <Route path="/library" element={<Layout><SanctuaryLibrary /></Layout>} />
            <Route path="/devotionals" element={<Layout><Devotionals /></Layout>} />
            <Route path="/meeting/:roomId" element={<Meeting />} />
          </Route>

          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;