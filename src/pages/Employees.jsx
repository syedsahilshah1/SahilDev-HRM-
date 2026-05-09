import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronRight, X, Trash2, UserX, UserCheck, MoreVertical, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const Employees = () => {

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'staff',
    designation: '',
    salary: '',
    dept: ''
  });
  const [editingMember, setEditingMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { addEmployee, userData, isSuperAdmin } = useAuth();

  const menuRef = React.useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const emps = snapshot.docs.map(doc => ({ 
          uid: doc.id, 
          ...doc.data(),
          role: doc.data().role || 'staff',
          designation: doc.data().designation || 'Developer'
        }));
        setEmployees(emps);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching employees:", err);
        setLoading(false);
      }
    );

    // Load Designations - Ensure we use the correct path and structure
    const unsubDesig = onSnapshot(doc(db, 'settings', 'designations'), 
      (docSnap) => {
        if (docSnap.exists()) {
          setDesignations(docSnap.data().list || []);
        } else {
          // Fallback if document doesn't exist
          setDesignations(['Software Engineer', 'Product Manager', 'Designer', 'HR Manager', 'Sales Executive']);
        }
      },
      (err) => {
        console.error("Error fetching designations:", err);
      }
    );

    // Load Departments
    const unsubDept = onSnapshot(doc(db, 'settings', 'departments'), 
      (docSnap) => {
        if (docSnap.exists()) {
          setDepartments(docSnap.data().list || []);
        } else {
          setDepartments(['IT', 'HR', 'Marketing', 'Sales', 'Operations']);
        }
      },
      (err) => {
        console.error("Error fetching departments:", err);
      }
    );

    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribe();
      unsubDesig();
      unsubDept();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return setError('Please fill in all fields.');
    
    try {
      setError('');
      setSubmitting(true);
      await addEmployee(formData.email, formData.fullName, formData.designation, formData.role, formData.dept, formData.salary);
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', role: 'staff', designation: '', salary: '', dept: '' });
    } catch (err) {
      setError('Failed to add employee: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    if (!editingMember.fullName) return setError('Full Name is required.');
    
    try {
      setError('');
      setSubmitting(true);
      const userRef = doc(db, 'users', editingMember.uid);
      await updateDoc(userRef, {
        fullName: editingMember.fullName,
        role: editingMember.role,
        designation: editingMember.designation,
        salary: editingMember.salary,
        dept: editingMember.dept || 'Unassigned'
      });
      setShowEditModal(false);
      setEditingMember(null);
    } catch (err) {
      setError('Failed to update member: ' + err.message);
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



  const handleUpdateUserPermission = async (uid, permissionKey, value) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { [`permissions.${permissionKey}`]: value });
    } catch (err) {
      console.error('Error updating permission:', err);
    }
  };

  const handleUpdateUserSalary = async (uid, newSalary) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { salary: newSalary });
    } catch (err) {
      console.error('Error updating salary:', err);
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

  return (
    <div className="employees-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Employee Directory</h1>
          <p>Manage your organization's members, roles, and compensation.</p>
        </div>
        <div className="header-actions">
           <div className="search-bar">
             <Search size={18} />
             <input 
               type="text" 
               placeholder="Search..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
             <button className="btn-primary add-btn-desktop" onClick={() => setShowAddModal(true)}>
               <Plus size={18} />
               <span>Add Member</span>
             </button>
           )}
        </div>
      </header>



      <div className="employee-list">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted">
            <div className="animate-spin mr-3"><Search size={24} /></div>
            Loading team members...
          </div>
        ) : employees.filter(emp => 
             emp.fullName?.toLowerCase()?.includes(searchTerm.toLowerCase()) || 
             emp.email?.toLowerCase()?.includes(searchTerm.toLowerCase())
          ).length > 0 ? (
          employees
            .filter(emp => 
                            emp.fullName?.toLowerCase()?.includes(searchTerm.toLowerCase()) || 
                            emp.email?.toLowerCase()?.includes(searchTerm.toLowerCase()))
            .map((emp) => (
            <div key={emp.uid} className={`employee-list-item card ${openMenu === emp.uid ? 'menu-open' : ''}`}>
              <div className="emp-main">
                <div className="emp-photo">
                  <div className="avatar-placeholder">{emp.fullName?.charAt(0)}</div>
                  <span className={`status-indicator ${emp.status === 'Active' ? 'active' : 'inactive'}`}></span>
                </div>
                <div className="emp-info">
                  <h3>{emp.fullName}</h3>
                  <p>
                    <span className="font-bold text-slate-700">{emp.designation}</span> 
                    {emp.salary ? ` • $${emp.salary}` : ''} • {emp.dept || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="emp-right">
                <div className="status-container">
                  <span className={`status-pill ${emp.status === 'Active' ? 'active' : 'inactive'}`}>
                    {emp.status}
                  </span>
                </div>
                
                {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
                  <div className="flex items-center gap-4">
                    <div className="permission-toggle hidden md:flex">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={emp.permissions?.canViewPayroll || false}
                          onChange={(e) => handleUpdateUserPermission(emp.uid, 'canViewPayroll', e.target.checked)}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="permission-label">Payroll</span>
                    </div>
                    
                    <button 
                      className={`btn-status ${emp.status === 'Active' ? 'deactivate' : 'activate'}`}
                      onClick={() => handleUpdateUserStatus(emp.uid, emp.status === 'Active' ? 'Deactivated' : 'Active')}
                    >
                      {emp.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </div>
                )}
                <div className="emp-actions-end">
                  <div className={`relative menu-container ${openMenu === emp.uid ? 'active' : ''}`}>
                    <button 
                      className="icon-btn-ghost menu-trigger"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenu(openMenu === emp.uid ? null : emp.uid);
                      }}
                      title="Actions"
                      style={{ padding: '12px' }}
                    >
                      <MoreVertical size={20} style={{ pointerEvents: 'none' }} />
                    </button>
                    
                    {openMenu === emp.uid && (
                      <div className="dropdown-menu card shadow-lg">
                        <Link to={`/profile/${emp.uid}`} className="dropdown-item">
                          <UserCheck size={16} />
                          <span>View Profile</span>
                        </Link>
                        {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
                          <>
                            <button className="dropdown-item" onClick={() => {
                              setEditingMember({ ...emp });
                              setShowEditModal(true);
                              setOpenMenu(null);
                            }}>
                              <Edit3 size={16} />
                              <span>Edit Member</span>
                            </button>
                            <button className="dropdown-item text-danger" onClick={() => {
                              handleDeleteUser(emp.uid);
                              setOpenMenu(null);
                            }}>
                              <Trash2 size={16} />
                              <span>Remove Member</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-muted">No employees found.</p>
        )}
      </div>

      {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
        <button 
          className="fab-add" 
          onClick={() => {
            setShowAddModal(true);
            // Pre-select first options if available
            setFormData({
              ...formData,
              role: designations[0] || '',
              dept: departments[0] || 'Unassigned'
            });
          }} 
          title="Add Member"
        >
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
            
            <form onSubmit={handleAddEmployee} className="professional-form">
              <div className="form-section">
                <h3 className="section-title">Employee Details</h3>
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
                  <p className="helper-text">Initial password will be the same as the email.</p>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Role & Compensation</h3>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Access Level (Role)</label>
                    <select 
                      className="modal-input"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select Role</option>
                      <option value="staff">Staff / Employee</option>
                      <option value="admin">Administrator</option>
                      <option value="hr">HR Manager</option>
                    </select>
                    <p className="helper-text">Defines system permissions (e.g., HR can manage employees)</p>
                  </div>
                  <div className="form-group flex-1">
                    <label>Job Title</label>
                    <select 
                      className="modal-input"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select Job Title</option>
                      {designations.map(desig => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                    </select>
                    <p className="helper-text">e.g., Software Engineer</p>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Department</label>
                    <select 
                      className="modal-input"
                      value={formData.dept}
                      onChange={(e) => setFormData({...formData, dept: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <p className="helper-text">Choose the team the employee belongs to</p>
                  </div>
                  <div className="form-group flex-1">
                    <label>Base Salary (Monthly)</label>
                    <input 
                      type="number" 
                      className="modal-input" 
                      placeholder="e.g. 50000"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      required
                    />
                    <p className="helper-text">Enter amount in PKR</p>
                  </div>
                </div>
              </div>
              
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Creating Account...' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingMember && (
        <div className="modal-overlay">
          <div className="modal-content card shadow-xl">
            <div className="modal-header">
              <h2>Edit Member</h2>
              <button className="close-btn" onClick={() => {
                setShowEditModal(false);
                setEditingMember(null);
              }}><X size={20} /></button>
            </div>
            
            {error && <div className="alert alert-error mb-4">{error}</div>}
            
            <form onSubmit={handleEditMember} className="professional-form">
              <div className="form-section">
                <h3 className="section-title">Employee Details</h3>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="modal-input" 
                    placeholder="Enter full name"
                    value={editingMember.fullName}
                    onChange={(e) => setEditingMember({...editingMember, fullName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Role & Compensation</h3>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Access Level (Role)</label>
                    <select 
                      className="modal-input"
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select Role</option>
                      <option value="staff">Staff / Employee</option>
                      <option value="admin">Administrator</option>
                      <option value="hr">HR Manager</option>
                    </select>
                    <p className="helper-text">Defines system permissions (e.g., HR can manage employees)</p>
                  </div>
                  <div className="form-group flex-1">
                    <label>Job Title</label>
                    <select 
                      className="modal-input"
                      value={editingMember.designation}
                      onChange={(e) => setEditingMember({...editingMember, designation: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select Job Title</option>
                      {designations.map(desig => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                    </select>
                    <p className="helper-text">e.g., Software Engineer</p>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Department</label>
                    <select 
                      className="modal-input"
                      value={editingMember.dept || ''}
                      onChange={(e) => setEditingMember({...editingMember, dept: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <p className="helper-text">Choose the team the employee belongs to</p>
                  </div>
                  <div className="form-group flex-1">
                    <label>Base Salary (Monthly)</label>
                    <input 
                      type="number" 
                      className="modal-input" 
                      placeholder="e.g. 50000"
                      value={editingMember.salary}
                      onChange={(e) => setEditingMember({...editingMember, salary: e.target.value})}
                      required
                    />
                    <p className="helper-text">Enter amount in PKR</p>
                  </div>
                </div>
              </div>
              
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .employees-page {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-bottom: 5rem;
        }

        .relative { position: relative; }
        
        .menu-container.active {
          z-index: 999;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 1000;
          background: white;
          min-width: 200px;
          border-radius: 12px;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .icon-btn-ghost {
          background: transparent;
          border: none;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn-ghost:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .dropdown-item.text-danger {
          color: #ef4444;
        }

        .dropdown-item.text-danger:hover {
          background: #fef2f2;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex: 1;
          justify-content: flex-end;
          min-width: 300px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          flex: 1;
        }

        .search-bar input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          background: transparent;
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
          transition: all 0.2s ease;
          flex-wrap: wrap;
          gap: 1.5rem;
          position: relative;
        }

        .employee-list-item.menu-open {
          z-index: 50;
        }

        .employee-list-item:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
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
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        @media (max-width: 1024px) {
          .employees-page {
            padding: 1rem;
          }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-actions {
            width: 100%;
            justify-content: flex-start;
          }
          .search-bar {
            max-width: 100%;
          }
          .employee-list-item {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .emp-right {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid #f1f5f9;
            padding-top: 1rem;
          }
          
          .admin-controls {
            width: 100%;
            border-left: none;
            padding-left: 0;
            margin-left: 0;
          }

          .header-actions {
            justify-content: flex-start;
          }
          
          .add-btn-desktop {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .header-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .add-btn-desktop {
             width: 100%;
             justify-content: center;
          }
          .employee-list-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .emp-actions {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid #f1f5f9;
            padding-top: 1rem;
          }
          .tabs {
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
          }
          .admin-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          
          .salary-input-mini {
            width: 100%;
          }
          
          .permission-toggle {
            grid-column: span 2;
            justify-content: flex-start;
          }
          
          .btn-status {
            grid-column: span 2;
            justify-content: center;
          }
        }

        .role-input-mini {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 600;
          background: #f8fafc;
          outline: none;
          width: 140px;
          transition: border-color 0.2s;
        }

        .role-input-mini:focus {
          border-color: #2563eb;
          background: white;
        }

        .salary-input-mini {
          width: 80px;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          background: #f8fafc;
          outline: none;
        }

        .btn-status {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-status.deactivate {
          background: #fee2e2;
          color: #ef4444;
        }

        .btn-status.activate {
          background: #f0fdf4;
          color: #10b981;
        }

        .btn-delete {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-delete:hover { 
          background: #fef2f2;
          color: #ef4444;
          transform: scale(1.1);
        }

        .permission-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 4px;
        }
        
        .permission-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* The switch - the box around the slider */
        .switch {
          position: relative;
          display: inline-block;
          width: 34px;
          height: 20px;
        }

        /* Hide default HTML checkbox */
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        /* The slider */
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          -webkit-transition: .4s;
          transition: .4s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }

        input:checked + .slider {
          background-color: #000;
        }

        input:checked + .slider:before {
          -webkit-transform: translateX(14px);
          -ms-transform: translateX(14px);
          transform: translateX(14px);
        }

        /* Rounded sliders */
        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }

        .fab-add {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #000;
          color: white;
          border: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 50;
        }

        @media (max-width: 1024px) {
          .fab-add { display: flex; }
        }

        .emp-actions-end {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .professional-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .helper-text {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 6px;
          font-weight: 500;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          width: 100%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 2.5rem;
          border-radius: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          scrollbar-width: none;
        }

        .modal-content::-webkit-scrollbar { display: none; }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .modal-header h2 { 
          font-size: 1.75rem; 
          font-weight: 900; 
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .close-btn { 
          background: #f1f5f9; 
          border: none; 
          color: #64748b; 
          cursor: pointer; 
          padding: 8px;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .form-group { margin-bottom: 0; }
        .form-group label { 
          display: block; 
          font-size: 0.75rem; 
          font-weight: 700; 
          color: #475569; 
          margin-bottom: 0.5rem; 
          text-transform: uppercase; 
          letter-spacing: 0.025em;
        }
        
        .modal-input {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          font-size: 0.95rem;
          font-weight: 500;
          outline: none;
          background: white;
          transition: all 0.2s;
          color: #0f172a;
        }

        .modal-input:focus {
          border-color: #000;
          background: white;
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
        }

        .modal-input::placeholder {
          color: #94a3b8;
        }

        .form-row { display: flex; gap: 1.25rem; }
        .flex-1 { flex: 1; }

        .submit-btn {
          width: 100%;
          padding: 1.125rem;
          background: #000;
          color: white;
          border: none;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
          transition: all 0.3s;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          background: #1e293b;
        }

        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
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
