import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyCenter: 'center' }}>
      <h2>Loading SahilDev HRM...</h2>
    </div>
  );

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                <Navbar />
                <div className="page-wrapper">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={
                      <div className="card">
                        <h1>Module Coming Soon</h1>
                        <p>We are working hard to bring this feature to you.</p>
                      </div>
                    } />
                  </Routes>
                </div>
              </main>

              <style jsx>{`
                .app-layout {
                  display: flex;
                  min-height: 100vh;
                }

                .main-content {
                  flex: 1;
                  margin-left: 250px;
                  min-height: 100vh;
                  background-color: #f8fafc;
                }

                .page-wrapper {
                  max-width: 1400px;
                  margin: 0 auto;
                  padding: 2rem 2.5rem;
                }

                @media (max-width: 1024px) {
                  .main-content {
                    margin-left: 0;
                  }
                  .page-wrapper {
                    padding: 1rem;
                  }
                }
              `}</style>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
