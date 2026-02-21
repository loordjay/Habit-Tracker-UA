import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import SupportChat from './pages/SupportChat';

function ProtectedRoute({ children, adminOnly = false, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If route requires admin, check if user is admin
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is admin and trying to access regular user routes, redirect to admin dashboard
  if (adminOnly && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  // Determine redirect based on user role
  const getDefaultRedirect = () => {
    if (user?.role === 'admin') {
      return '/admin';
    }
    return '/dashboard';
  };

  const getLoginRedirect = () => {
    if (user?.role === 'admin') {
      return '/admin';
    }
    return '/dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getLoginRedirect()} replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={getLoginRedirect()} replace /> : <Signup />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute adminOnly>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/habits" 
        element={
          <ProtectedRoute adminOnly>
            <Habits />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute adminOnly>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/support" 
        element={
          <ProtectedRoute adminOnly>
            <SupportChat />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
