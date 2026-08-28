import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Tasks from './pages/Tasks';
import AIPlanner from './pages/AIPlanner';
import StudyPlans from './pages/StudyPlans';
import Login from './pages/Login';
import Register from './pages/Register';
import { getToken } from './services/api';

/**
 * Layout wrapper for authenticated views
 */
const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/**
 * Route protection wrapper
 */
const ProtectedRoute = () => {
  const token = getToken();
  return token ? <AppLayout /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard & App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/ai-planner" element={<AIPlanner />} />
          <Route path="/study-plans" element={<StudyPlans />} />
        </Route>

        {/* Fallback & Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
