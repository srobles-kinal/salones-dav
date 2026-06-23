import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Lactation from './pages/Lactation';
import Reservations from './pages/Reservations';
import Salones from './pages/Salones';
import Users from './pages/Users';
import Permissions from './pages/Permissions';
import EmailTemplates from './pages/EmailTemplates';
import Settings from './pages/Settings';
import Audit from './pages/Audit';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lactation" element={<Lactation />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/salones" element={
          <ProtectedRoute permission="salones:read"><Salones /></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute permission="users:read"><Users /></ProtectedRoute>
        } />
        <Route path="/permissions" element={
          <ProtectedRoute permission="permissions:manage"><Permissions /></ProtectedRoute>
        } />
        <Route path="/email-templates" element={
          <ProtectedRoute permission="email_templates:read"><EmailTemplates /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute permission="settings:read"><Settings /></ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute permission="audit:read"><Audit /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
