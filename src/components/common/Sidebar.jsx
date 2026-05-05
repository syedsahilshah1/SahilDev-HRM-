import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings as SettingsIcon, LayoutDashboard, Users, ClipboardCheck, CalendarDays, Wallet, ShieldCheck, Network, FileText, HelpCircle, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout, isSuperAdmin, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };
  
  const mainItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  ];

  const userRole = userData?.role?.toLowerCase();
  
  // Only show Directory to admins/superadmins
  if (isSuperAdmin || userRole === 'admin') {
    mainItems.push({ name: 'Directory', icon: <Users size={20} />, path: '/employees' });
  }

  mainItems.push(
    { name: 'Tasks', icon: <ClipboardCheck size={20} />, path: '/tasks' },
    { name: 'Leave', icon: <CalendarDays size={20} />, path: '/attendance' }
  );

  // Only show Payroll to admins/superadmins OR users with explicit permission
  if (isSuperAdmin || userRole === 'admin' || userData?.permissions?.canViewPayroll) {
    mainItems.push({ name: 'Payroll', icon: <Wallet size={20} />, path: '/payroll' });
  }

  const subItems = [
    { name: 'Company Policy', icon: <ShieldCheck size={20} />, path: '/policy' },
    { name: 'Organization Chart', icon: <Network size={20} />, path: '/org-chart' },
    { name: 'Documents', icon: <FileText size={20} />, path: '/documents' },
  ];

  if (isSuperAdmin) {
    subItems.push({ name: 'Settings', icon: <SettingsIcon size={20} />, path: '/settings' });
  }

  subItems.push({ name: 'Help Center', icon: <HelpCircle size={20} />, path: '/help' });


  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="user-profile-section">
        <div className="user-avatar-container">
          <div className="avatar-box">
             {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="User" style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
             ) : (
                <User size={24} className="text-primary" />
             )}
          </div>
          <div className="user-details">
            <h3 className="user-name">{userData?.fullName || currentUser?.displayName || 'Sahil Dev'}</h3>
            <p className="user-dept">{userData?.role?.toUpperCase() || 'STAFF'} • {userData?.dept || 'Unassigned'}</p>
          </div>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-group">
          {mainItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-divider"></div>

        <div className="nav-group">
          {subItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="signout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
        <p className="version">v2.4.0</p>
      </div>

      <style jsx>{`
        .sidebar {
          width: 250px;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 20px 0 50px rgba(0,0,0,0.1);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }

        .user-profile-section {
          padding: 2rem 1.5rem;
        }

        .user-avatar-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }

        .avatar-box {
          width: 44px;
          height: 44px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          color: #0f172a;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-dept {
          font-size: 0.75rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-menu {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0 1rem;
          overflow-y: auto;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 1.5rem 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          color: #64748b;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .nav-item.active {
          background: #f1f5f9;
          color: #0f172a;
          font-weight: 600;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .signout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: transparent;
          border: none;
          padding: 0.75rem;
          color: #ef4444;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .signout-btn:hover {
          background: #fef2f2;
        }

        .version {
          font-size: 0.7rem;
          color: #94a3b8;
          text-align: center;
          margin-top: 1rem;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
