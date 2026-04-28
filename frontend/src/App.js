import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import HospitalFinder from './pages/HospitalFinder';
import BookingPage from './pages/BookingPage';
import SymptomChecker from './pages/SymptomChecker';
import SosPage from './pages/SosPage';
import SosTrackPage from './pages/SosTrackPage';
import SosHistory from './pages/SosHistory';
import SuperAdminPage from './pages/SuperAdminPage';
import SubmitDocuments from './pages/SubmitDocuments';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const UserProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'USER') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/hospitals" element={<HospitalFinder />} />
        <Route path="/bookings" element={<UserProtectedRoute><BookingPage /></UserProtectedRoute>} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/sos/track" element={<SosTrackPage />} />
        <Route path="/sos/history" element={<SosHistory />} />
        <Route path="/superadmin" element={<SuperAdminPage />} />
        <Route path="/submit-documents" element={<SubmitDocuments />} />
        <Route path="/sos" element={<SosPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
