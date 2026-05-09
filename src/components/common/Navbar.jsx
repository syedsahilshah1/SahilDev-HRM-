import React from 'react';
import { Search, User, LogOut, Menu } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const { isSuperAdmin, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <button className="menu-toggle" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h2 className="brand-text">
          {isSuperAdmin || userData?.role?.toLowerCase() === 'admin' ? 'HR Portal' : 'Staff Portal'}
        </h2>
      </div>

      <nav className="navbar-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
        
        {/* Only show Directory to admins/superadmins */}
        {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
          <NavLink to="/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Directory</NavLink>
        )}

        <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Leave</NavLink>
        
        {/* Only show Payroll to admins/superadmins */}
        {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
          <NavLink to="/payroll" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Payroll</NavLink>
        )}

        {/* Only show Settings to superadmins */}
        {isSuperAdmin && (
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Settings</NavLink>
        )}
      </nav>

      <div className="navbar-actions">
        <button className="icon-btn search-nav-btn" title="Search">
          <Search size={20} />
        </button>
        <button className="icon-btn logout-nav-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
        </button>
        <NavLink to="/profile" className="user-profile-link">
          <div className="user-profile-img">
             <User size={20} />
          </div>
        </NavLink>
      </div>

      <style>{`
        .navbar {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          position: sticky;
          top: 0;
          z-index: 40;
          background: white;
          border-bottom: 1px solid #f1f5f9;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .menu-toggle {
          display: none;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
        }

        .menu-toggle:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .brand-text {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .navbar-links {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          padding: 0.5rem 0;
          position: relative;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #0f172a;
        }

        .nav-link.active {
          color: #0f172a;
          font-weight: 600;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -18px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #0f172a;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .logout-nav-btn {
          color: #ef4444;
        }
        
        .logout-nav-btn:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .user-profile-img {
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #e2e8f0;
          transition: all 0.2s;
        }

        .user-profile-link:hover .user-profile-img {
          box-shadow: 0 0 0 1px #cbd5e1;
          transform: scale(1.05);
        }

        @media (max-width: 1024px) {
          .navbar {
            padding: 0 1rem;
          }
          .menu-toggle {
            display: flex;
          }
          .navbar-links {
            display: none;
          }
          .search-nav-btn {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
