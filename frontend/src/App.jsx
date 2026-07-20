import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ShareFile from './components/ShareFile';
import './App.css';
import api from './api';

// Configure axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['x-auth-token'] = token;
      getUser();
    } else {
      setLoading(false);
    }
  }, []);

  const normalizeUser = (u) => {
    if (!u) return null;
    const normalized = { ...u };
    if (normalized.user) {
      return normalizeUser(normalized.user);
    }
    normalized.id = normalized.id || normalized._id;
    normalized._id = normalized._id || normalized.id;
    return normalized;
  };

  const getUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(normalizeUser(res.data));
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['x-auth-token'];
    }
    setLoading(false);
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['x-auth-token'] = token;
    setUser(normalizeUser(userData));
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="google-drive-loading">
        <div className="google-spinner"></div>
        <p>Loading Google Drive...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="google-drive-app">
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login onLogin={login} /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={!user ? <Register onLogin={login} /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />}
          />
          {/* Updated this line ↓ from /share/:token to /shared/:token */}
          <Route path="/shared/:token" element={<ShareFile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;