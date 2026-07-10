import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import axios from 'axios';

// Components
import SanctuaryLibrary from "./components/SanctuaryLibrary";
import MusicChallenges from "./components/MusicChallenges";
import SearchPage from "./components/SearchPage";

// Pages
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Trivia from './pages/Trivia';
import Devotionals from './pages/Devotionals';
import Groups from './pages/Groups';
import Events from './pages/Events';
import Meeting from './pages/Meeting';
import MeetingsList from './pages/MeetingsList';
import Live from './pages/Live';

// Robust, pre-logged helper function to inspect tokens at runtime
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

// 2. GLOBAL NATIVE FETCH INTERCEPTOR
const { fetch: originalFetch } = window;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let config = init ? { ...init } : {};
  config.headers = config.headers || {};

  const token = getCleanToken();
  if (token) {
    if (config.headers instanceof Headers) {
      if (!config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(config.headers)) {
      const hasAuth = config.headers.some(([key]) => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        config.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      const hasAuth = Object.keys(config.headers).some(key => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        config.headers = {
          ...config.headers,
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
            <Route path="/chat" element={<Layout><Chat /></Layout>} />
            <Route path="/messages" element={<Layout><Chat /></Layout>} />
            <Route path="/groups" element={<Layout><Groups /></Layout>} />
            <Route path="/meetings" element={<Layout><MeetingsList /></Layout>} />
            <Route path="/trivia" element={<Layout><Trivia /></Layout>} />
            <Route path="/events" element={<Layout><Events /></Layout>} />
            <Route path="/live" element={<Layout><Live /></Layout>} />
            <Route path="/challenges" element={<Layout><MusicChallenges /></Layout>} />
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
