import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocialProvider } from './context/SocialContext.js';
import PrivateRoute from './components/PrivateRoute.js';
import Layout from './components/Layout.js';
import axios from 'axios';

// Components
import SanctuaryLibrary from "./components/SanctuaryLibrary.js";
import ChallengeManager from "./components/ChallengeManager.js"; 
import SearchPage from "./components/SearchPage.js";

// Pages
import Feed from './pages/Feed.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import Onboarding from './pages/Onboarding.js';
import AdminDashboard from './pages/AdminDashboard.js';
import Settings from './pages/Settings.js';
import Trivia from './pages/Trivia.js';
import Devotionals from './pages/Devotionals.js';
import Groups from './pages/Groups.js';
import Events from './pages/Events.js';
import Meeting from './pages/Meeting.js';
import MeetingsList from './pages/MeetingsList.js';
import Live from './pages/Live.js';
import Messages from './pages/Messages.js';
import FriendsHub from './pages/FriendsHub.js'; // Added Friends Portal

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
    if (config.headers instanceof Headers) {
      const mutableHeaders = new Headers(config.headers);
      if (!mutableHeaders.has('Authorization')) {
        mutableHeaders.set('Authorization', `Bearer ${token}`);
      }
      config.headers = mutableHeaders;
    } 
    else if (Array.isArray(config.headers)) {
      const hasAuth = config.headers.some(([key]) => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        config.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } 
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

// ... (keep imports)

function App() {
  return (
    <AuthProvider>
      <SocialProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<Layout><Feed /></Layout>} />
              <Route path="/search" element={<Layout><SearchPage /></Layout>} />
              <Route path="/messages" element={<Layout><Messages /></Layout>} />
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
              <Route path="/friends" element={<Layout><FriendsHub /></Layout>} />
              <Route path="/meeting/:roomId" element={<Layout><Meeting /></Layout>} />
            </Route>

            <Route path="*" element={<CatchAllRoute />} />
          </Routes>
        </Router>
      </SocialProvider>
    </AuthProvider>
  );
}
export default App;