import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronRight, X, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const Employees = () => {
  const [activeTab, setActiveTab] = useState('All Teams');
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Developer',
    dept: 'Development'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { addEmployee, userData, isSuperAdmin } = useAuth();
  const teams = ['All Teams', 'IT', 'Development', 'HR', 'Sales', 'Marketing', 'Management'];

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(emps);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return setError('Please fill in all fields.');
    
    try {
      setError('');
      setSubmitting(true);
      await addEmployee(formData.email, formData.fullName, formData.role);
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', role: 'Developer', dept: 'Development' });
    } catch (err) {
      setError('Failed to add employee: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUserStatus = async (uid, newStatus) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleUpdateUserRole = async (uid, newRole) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (window.confirm('Are you sure you want to remove this member? This will delete their records.')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    activeTab === 'All Teams' || emp.dept === activeTab || emp.role.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="employees-page">
      <div className="search-container">
        <div className="search-box">
          <Search size={22} className="search-icon" />
          <input type="text" placeholder="Search employees..." />
        </div>
      </div>

      <div className="filter-scroll">
        {teams.map(team => (
          <button 
            key={team} 
            className={`filter-chip ${activeTab === team ? 'active' : ''}`}
            onClick={() => setActiveTab(team)}
          >
            {team}
          </button>
        ))}
      </div>

      <div className="employee-list">
        {loading ? (
          <p className="text-center py-10 text-muted">Loading employees...</p>
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => (
            <div key={emp.uid} className="employee-list-item card">
              <div className="emp-main">
                <div className="emp-photo">
                  <div className="avatar-placeholder">{emp.fullName?.charAt(0)}</div>
                  <span className={`status-indicator ${emp.status === 'Active' ? 'active' : 'inactive'}`}></span>
                </div>
                <div className="emp-info">
                  <h3>{emp.fullName}</h3>
                  <p>{emp.role} • {emp.dept}</p>
                </div>
              </div>
              <div className="emp-right">
                <div className="status-container">
                  <span className={`status-pill ${emp.status === 'Active' ? 'active' : 'inactive'}`}>
                    {emp.status}
                  </span>
                </div>
                
                {isSuperAdmin && emp.role !== 'superadmin' && (
                  <div className="admin-controls">
                    <select 
                      className="role-selector-mini"
                      value={emp.role}
                      onChange={(e) => handleUpdateUserRole(emp.uid, e.target.value)}
                    >
                      <option>Admin</option>
                      <option>Manager</option>
                      <option>Developer</option>
                      <option>Project Manager</option>
                      <option>Team Lead</option>
                      <option>Designer</option>
                      <option>HR</option>
                    </select>
                    <button 
                      className={`btn-status ${emp.status === 'Active' ? 'deactivate' : 'activate'}`}
                      onClick={() => handleUpdateUserStatus(emp.uid, emp.status === 'Active' ? 'Deactivated' : 'Active')}
                    >
                      {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteUser(emp.uid)}>
                      <X size={14} />
                    </button>
                  </div>
                )}
                <ChevronRight size={20} className="chevron" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-muted">No employees found.</p>
        )}
      </div>

      {isSuperAdmin && (
        <button className="fab-add" onClick={() => setShowAddModal(true)}>
          <Plus size={24} />
        </button>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content card shadow-xl">
            <div className="modal-header">
              <h2>Add New Member</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            
            {error && <div className="alert alert-error mb-4">{error}</div>}
            
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input 
                  type="email" 
                  className="modal-input" 
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                <p className="hint">Initial password will be the same as the email.</p>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Role</label>
                  <select 
                    className="modal-input"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Developer</option>
                    <option>Project Manager</option>
                    <option>Team Lead</option>
                    <option>Designer</option>
                    <option>HR</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Department</label>
                  <select 
                    className="modal-input"
                    value={formData.dept}
                    onChange={(e) => setFormData({...formData, dept: e.target.value})}
                  >
                    <option>IT</option>
                    <option>Development</option>
                    <option>HR</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                    <option>Design</option>
                    <option>Management</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Creating Account...' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .employees-page {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-bottom: 5rem;
        }

        .search-container {
          position: sticky;
          top: 0;
          background: #f8fafc;
          padding: 1rem 0;
          z-index: 10;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .search-icon { color: #94a3b8; }

        .search-box input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 1.125rem;
          font-weight: 500;
          color: #1e293b;
        }

        .filter-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
        }

        .filter-chip {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f1f5f9;
          color: #475569;
          font-weight: 600;
          font-size: 0.9375rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-chip.active {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }

        .employee-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .employee-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .employee-list-item:hover {
          transform: scale(1.01);
        }

        .emp-main {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .emp-photo {
          position: relative;
          width: 56px;
          height: 56px;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: #f1f5f9;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1.25rem;
          text-transform: uppercase;
        }

        .status-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 3px solid white;
        }

        .status-indicator.active { background: #10b981; }
        .status-indicator.inactive { background: #ef4444; }

        .emp-info h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .emp-info p {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .emp-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .status-pill.active { background: #f0fdf4; color: #10b981; }
        .status-pill.inactive { background: #fef2f2; color: #ef4444; }

        .admin-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: 1rem;
          padding-left: 1rem;
          border-left: 1px solid #e2e8f0;
        }

        .role-selector-mini {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 600;
          background: #f8fafc;
          outline: none;
        }

        .btn-status {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-status.deactivate {
          background: #fff7ed;
          color: #f97316;
        }

        .btn-status.activate {
          background: #f0fdf4;
          color: #10b981;
        }

        .btn-delete {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: #fee2e2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .btn-delete:hover { background: #fecaca; }

        .fab-add {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: #000;
          color: white;
          border: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1.5rem;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          border-radius: 24px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .modal-header h2 { font-size: 1.5rem; font-weight: 800; }

        .close-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; }

        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; }
        
        .modal-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 1rem;
          outline: none;
          background: #f8fafc;
        }

        .form-row { display: flex; gap: 1rem; }
        .flex-1 { flex: 1; }

        .hint { font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: #000;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 1rem;
        }

        .alert { padding: 1rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; }
        .alert-error { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }

        .text-muted { color: #94a3b8; }
        .text-center { text-align: center; }
        .py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
      `}</style>
    </div>
  );
};

export default Employees;
