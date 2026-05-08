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
import Reports from './pages/Reports';
import CompanyPolicy from './pages/CompanyPolicy';
import OrgChart from './pages/OrgChart';
import Documents from './pages/Documents';
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, userData, loading, logout } = useAuth();
  
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <h2>Loading SahilDev HRM...</h2>
    </div>
  );

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (userData?.status === 'Deactivated') {
    logout();
    return <Navigate to="/login" />;
  }

  return children;
};


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
              <main className="main-content">
                <Navbar onMenuClick={toggleSidebar} />
                <div className="page-wrapper">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile/:uid?" element={<Profile />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/policy" element={<CompanyPolicy />} />
                    <Route path="/org-chart" element={<OrgChart />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="*" element={
                      <div className="card">
                        <h1>Module Coming Soon</h1>
                        <p>We are working hard to bring this feature to you.</p>
                      </div>
                    } />
                  </Routes>
                </div>
              </main>

              {/* Mobile Backdrop */}
              {isSidebarOpen && (
                <div className="mobile-backdrop" onClick={closeSidebar} />
              )}

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
                  transition: margin-left 0.3s ease;
                }

                .page-wrapper {
                  max-width: 1400px;
                  margin: 0 auto;
                  padding: 2rem 2.5rem;
                }

                .mobile-backdrop {
                  display: none;
                  position: fixed;
                  inset: 0;
                  background: rgba(0, 0, 0, 0.4);
                  backdrop-filter: blur(4px);
                  z-index: 45;
                }

                @media (max-width: 1024px) {
                  .main-content {
                    margin-left: 0;
                  }
                  .page-wrapper {
                    padding: 1rem;
                  }
                  .mobile-backdrop {
                    display: block;
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
