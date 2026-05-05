import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    assignedTo: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { currentUser, userData, isSuperAdmin } = useAuth();

  useEffect(() => {
    // Fetch Tasks
    const qTasks = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
      setLoading(false);
    });

    // Fetch Employees for dropdown
    const qEmps = query(collection(db, 'users'), orderBy('fullName', 'asc'));
    const unsubscribeEmps = onSnapshot(qEmps, (snapshot) => {
      const empList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setEmployees(empList);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeEmps();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setDeletingId(taskId);
      await deleteDoc(doc(db, 'tasks', taskId));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.assignedTo) return setError('Please fill in required fields.');

    try {
      setError('');
      setSubmitting(true);
      
      const selectedEmp = employees.find(emp => emp.uid === formData.assignedTo);
      
      await addDoc(collection(db, 'tasks'), {
        ...formData,
        status: 'To-do',
        createdAt: serverTimestamp(),
        assignedToName: selectedEmp?.fullName || 'Unknown',
        createdBy: userData?.fullName || 'Admin',
        createdById: userData?.uid || 'system'
      });

      setShowAddModal(false);
      setFormData({ title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '' });
    } catch (err) {
      setError('Failed to assign task: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const filteredTasks = tasks.filter(task => 
    activeFilter === 'All' || task.status === activeFilter
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={18} className="text-success" />;
      case 'In Progress': return <Clock size={18} className="text-warning" />;
      default: return <AlertCircle size={18} className="text-muted" />;
    }
  };

  return (
    <div className="tasks-page">
      <header className="page-header">
        <div className="header-text">
          <h1>Task Management</h1>
          <p>Assign and track project milestones for your team.</p>
        </div>
        {(isSuperAdmin || userData?.role === 'admin' || userData?.role === 'manager') && (
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            <span>Assign New Task</span>
          </button>
        )}
      </header>

      <div className="tasks-controls card">
        <div className="filter-group">
          {['All', 'To-do', 'In Progress', 'Completed'].map(filter => (
            <button 
              key={filter}
              className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="search-minimal">
          <Search size={18} />
          <input type="text" placeholder="Search tasks..." />
        </div>
      </div>

      <div className="tasks-grid">
        {loading ? (
          <div className="loading-state">
            <p>Syncing tasks...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div key={task.id} className="task-card card">
              <div className="task-header">
                <span className="priority-dot" style={{ background: getPriorityColor(task.priority) }}></span>
                <span className="priority-label">{task.priority}</span>
                <div className="menu-container">
                  <button 
                    className="btn-more"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMenuId(prev => prev === task.id ? null : task.id);
                    }}
                    title="Task options"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === task.id && (
                    <div className="dropdown-menu">
                      {(isSuperAdmin || userData?.role === 'admin') && (
                        <button 
                          className="menu-item delete"
                          onClick={() => deleteTask(task.id)}
                          disabled={deletingId === task.id}
                        >
                          {deletingId === task.id ? 'Deleting...' : 'Delete Task'}
                        </button>
                      )}
                      <button className="menu-item" onClick={() => setOpenMenuId(null)}>Close</button>
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="task-title">{task.title}</h3>
              <p className="task-desc">{task.description}</p>
              
              <div className="task-meta">
                <div className="meta-item">
                  <User size={14} />
                  <span>{task.assignedToName}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                </div>
              </div>

              <div className="task-footer">
                <div className="status-badge">
                  {getStatusIcon(task.status)}
                  <span>{task.status}</span>
                </div>
                
                <div className="task-actions">
                  {task.status !== 'Completed' && task.assignedTo === currentUser?.uid && (
                    <button 
                      className="btn-action-small"
                      onClick={() => updateTaskStatus(task.id, task.status === 'To-do' ? 'In Progress' : 'Completed')}
                    >
                      {task.status === 'To-do' ? 'Start' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state card">
            <ClipboardCheck size={48} className="text-muted mb-4" />
            <h3>No tasks found</h3>
            <p>Try changing your filters or assign a new task.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content card shadow-xl">
            <div className="modal-header">
              <h2>Assign New Task</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            
            {error && <div className="alert alert-error mb-4">{error}</div>}
            
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="e.g. Design System Update"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="modal-input" 
                  placeholder="Describe the task goals..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Priority</label>
                  <select 
                    className="modal-input"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    className="modal-input"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assign To</label>
                <select 
                  className="modal-input"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.uid} value={emp.uid}>
                      {emp.fullName} ({emp.dept})
                    </option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .tasks-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-text h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .header-text p {
          color: #64748b;
        }

        .btn-primary {
          background: #000;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .btn-primary:hover { transform: translateY(-2px); }

        .tasks-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }

        .filter-group {
          display: flex;
          gap: 0.5rem;
        }

        .filter-tab {
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-tab.active {
          background: #f1f5f9;
          color: #0f172a;
        }

        .search-minimal {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #f8fafc;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          width: 300px;
        }

        .search-minimal input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.875rem;
          width: 100%;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .task-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .task-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
        }

        .priority-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .priority-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex: 1;
        }

        .btn-more {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }

        .btn-more:hover { background: #f1f5f9; color: #0f172a; }

        .menu-container { position: relative; }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          z-index: 20;
          min-width: 140px;
          padding: 0.5rem;
          margin-top: 4px;
        }

        .menu-item {
          width: 100%;
          text-align: left;
          padding: 0.625rem 0.75rem;
          background: transparent;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          border-radius: 8px;
        }

        .menu-item:hover { background: #f8fafc; color: #0f172a; }
        .menu-item.delete { color: #ef4444; }
        .menu-item.delete:hover { background: #fef2f2; }

        .task-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
        }

        .task-desc {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .task-meta {
          display: flex;
          gap: 1.5rem;
          padding: 1rem 0;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .task-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1e293b;
        }

        .btn-action-small {
          background: #f1f5f9;
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action-small:hover { background: #e2e8f0; }

        .empty-state {
          grid-column: 1 / -1;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .loading-state {
          grid-column: 1 / -1;
          padding: 4rem;
          text-align: center;
          color: #64748b;
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
          padding: 2.5rem;
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

        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; }
        
        .modal-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 1rem;
          outline: none;
          background: #f8fafc;
          font-family: inherit;
        }

        .form-row { display: flex; gap: 1rem; }
        .flex-1 { flex: 1; }

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

        .text-success { color: #10b981; }
        .text-warning { color: #f59e0b; }
        .text-muted { color: #94a3b8; }
        .mb-4 { margin-bottom: 1rem; }

        @media (max-width: 1024px) {
          .tasks-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .header-actions { width: 100%; justify-content: flex-start; }
          .task-meta { flex-direction: column; gap: 0.5rem; }
          .modal-content { padding: 1.5rem; border-radius: 16px; }
        }
      `}</style>
    </div>
  );
};

export default Tasks;
