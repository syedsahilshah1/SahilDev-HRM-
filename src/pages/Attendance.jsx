import React from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileText,
  Check,
  X,
  Clock,
  Loader2,
  Download,
  CheckCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const Attendance = () => {
  const { currentUser, userData, isSuperAdmin } = useAuth();
  const [applications, setApplications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('PENDING');
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    note: ''
  });

  // Fetch Applications
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userRole = userData?.role?.toLowerCase();
    const isAdmin = isSuperAdmin || userRole === 'admin';
    const q = isAdmin
      ? query(collection(db, 'leave_applications'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'leave_applications'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(apps);
      setLoading(false);
    }, (err) => {
      console.error("Leave applications error:", err);
      setError("Failed to load applications. " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isSuperAdmin, userData?.role, currentUser?.uid]);

  // Calculate Leave Summary
  const calculateLeaveTaken = (type) => {
    return applications
      .filter(app => app.status === 'APPROVED' && app.type === type)
      .reduce((total, app) => {
        const start = new Date(app.startDate);
        const end = new Date(app.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
      }, 0);
  };

  const annualTaken = calculateLeaveTaken('Annual Leave');
  const sickTaken = calculateLeaveTaken('Sick Leave');
  const annualTotal = 24;
  const sickTotal = 10;

  const handleApply = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) return alert('Please select dates');
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leave_applications'), {
        userId: currentUser.uid,
        userName: userData?.fullName || currentUser.displayName || 'Unknown',
        userRole: userData?.role || 'Employee',
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        note: formData.note,
        status: 'PENDING',
        createdAt: Timestamp.now()
      });
      setShowModal(false);
      setFormData({ type: 'Annual Leave', startDate: '', endDate: '', note: '' });
    } catch (error) {
      console.error("Error applying for leave:", error);
      alert("Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'leave_applications', id), {
        status: newStatus,
        reviewedBy: currentUser.email,
        reviewedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const handleGenerateReport = () => {
    if (applications.length === 0) return alert('No data to export');
    const headers = ["Staff Name", "Type", "Start Date", "End Date", "Status", "Note"];
    const rows = applications.map(app => [
      `"${app.userName}"`,
      `"${app.type}"`,
      `"${app.startDate}"`,
      `"${app.endDate}"`,
      `"${app.status}"`,
      `"${app.note || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_leave_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // Fetch Daily Attendance Logs
  useEffect(() => {
    if (!userData?.uid) return;

    // Superadmin/Admin/HR see all logs, Employees see only their own
    // Note: HR can see all attendance but only Admin/Superadmin can approve leave for HR
    const userRole = userData?.role?.toLowerCase();
    const isAdmin = isSuperAdmin || userRole === 'admin' || userRole === 'hr' || userData?.permissions?.canViewAttendance;
    
    let q = query(collection(db, 'daily_attendance'), orderBy('date', 'desc'), orderBy('checkIn', 'desc'));
    
    if (!isAdmin) {
      q = query(
        collection(db, 'daily_attendance'), 
        where('userId', '==', userData.uid),
        orderBy('date', 'desc'),
        orderBy('checkIn', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.userName || 'Staff Member',
          avatar: (data.userName || 'S').charAt(0),
          status: data.status || 'Present',
          checkIn: (data.checkIn && typeof data.checkIn.toDate === 'function') ? data.checkIn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOut: (data.checkOut && typeof data.checkOut.toDate === 'function') ? data.checkOut.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          date: data.date,
          ip: data.checkInIp || data.checkOutIp
        };
      });
      setAttendanceLogs(logs);
    }, (err) => {
      console.error("Attendance logs error:", err);
    });

    return () => unsubscribe();
  }, [userData?.uid, userData?.role, isSuperAdmin, userData?.permissions?.canViewAttendance]);

  const isAdmin = isSuperAdmin || userData?.role?.toLowerCase() === 'admin' || userData?.role?.toLowerCase() === 'hr' || userData?.permissions?.canViewAttendance;
  const isManager = isSuperAdmin || userData?.role?.toLowerCase() === 'admin';

  return (
    <div className="attendance-page">
      <header className="page-header">
        <div className="header-left">
          <h1>{isManager ? 'Staff Attendance Workspace' : 'My Attendance & Leave'}</h1>
          <p>{isManager ? 'Monitor staff presence and review leave applications.' : 'Track your daily attendance and manage your leave requests.'}</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline flex items-center gap-2" onClick={handleGenerateReport}>
            <Download size={20} />
            <span>Generate Report</span>
          </button>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            New Application
          </button>
        </div>
      </header>

      <div className="main-grid">
        <div className="attendance-logs-section">
          <div className="card">
            <div className="card-header">
              <h3>Daily Attendance Logs</h3>
              <div className="date-selector">
                <ChevronLeft size={16} />
                <span>October 2023</span>
                <ChevronRight size={16} />
              </div>
            </div>
            
            <div className="week-strip">
              {[16, 17, 18, 19, 20, 21, 22].map((day, idx) => (
                <div key={day} className={`day-box ${day === 18 ? 'active' : ''}`}>
                  <span className="day-name">{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][idx]}</span>
                  <span className="day-num">{day}</span>
                  <div className={`status-dot ${idx < 5 ? 'present' : 'absent'}`}></div>
                </div>
              ))}
            </div>

            <div className="logs-table">
               <div className="log-header">
                  <span>DATE</span>
                  <span>{isSuperAdmin ? 'STAFF MEMBER' : 'STATUS'}</span>
                  <span>CHECK IN</span>
                  <span>CHECK OUT</span>
                  {isSuperAdmin && <span>IP ADDR</span>}
               </div>
                {attendanceLogs.length > 0 ? (
                  attendanceLogs.map((log, idx) => (
                    <div key={log.id || idx} className="log-row">
                      <div className="date-cell font-bold">{log.date}</div>
                  {isAdmin ? (
                    <div className="user-info">
                      <div className="avatar-xs bg-blue-100 text-blue-600">{log.avatar}</div>
                      <span>{log.name}</span>
                    </div>
                  ) : (
                        <div>
                          <span className={`badge-pill ${log.status?.toLowerCase() || 'present'}`}>
                            {log.status}
                          </span>
                        </div>
                      )}
                      <div className="time">{log.checkIn}</div>
                      <div className="time">{log.checkOut}</div>
                      {isAdmin && <div className="text-xs text-muted font-mono">{log.ip || '-'}</div>}
                    </div>
                  ))
                ) : (
                  <div className="empty-state py-8 text-center text-muted">
                    <p>No attendance records found for this period.</p>
                  </div>
                )}
            </div>
          </div>

          <div className="card review-section">
             <div className="card-header">
                <h3>{isManager ? 'Review Applications' : 'My Applications'}</h3>
                <div className="filter-pills">
                   <button 
                     className={`pill ${filterTab === 'PENDING' ? 'active' : ''}`}
                     onClick={() => setFilterTab('PENDING')}
                   >
                    Pending ({applications.filter(a => a.status === 'PENDING').length})
                   </button>
                   <button 
                     className={`pill ${filterTab === 'ALL' ? 'active' : ''}`}
                     onClick={() => setFilterTab('ALL')}
                   >
                     All Requests
                   </button>
                </div>
             </div>
             <div className="app-list">
                {loading ? (
                  <div className="flex items-center justify-center p-8 text-muted">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Loading applications...
                  </div>
                ) : error ? (
                  <div className="alert alert-error m-4">
                    <p>{error}</p>
                    <p className="text-xs mt-2">Check Firebase console for missing indexes.</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center p-8 text-muted">No applications found.</div>
                ) : (
                  applications
                    .filter(app => filterTab === 'ALL' || app.status === filterTab)
                    .map((app) => (
                    <div key={app.id} className="app-card">
                       <div className="app-top">
                          <div className="user-meta">
                             <div className="avatar-sm">{app.userName?.charAt(0) || 'U'}</div>
                             <div>
                                <p className="font-bold">{app.userName || 'Unknown User'}</p>
                                <p className="text-muted">{app.userRole || 'Staff'} • {app.type}</p>
                             </div>
                          </div>
                          <div className="app-date">
                             <Calendar size={14} />
                             <span>{app.startDate} to {app.endDate}</span>
                          </div>
                       </div>
                       <p className="app-note">"{app.note}"</p>
                       <div className="app-bottom">
                          {app.status === 'PENDING' ? (
                            <div className="status-row">
                               <span className="status-label warning">● PENDING</span>
                               {(isSuperAdmin || (userData?.role?.toLowerCase() === 'admin' && app.userRole?.toLowerCase() !== 'hr' && app.userRole?.toLowerCase() !== 'admin')) && (
                                 <div className="actions">
                                    <button 
                                      className="icon-btn red" 
                                      onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                    >
                                      <X size={18} />
                                    </button>
                                    <button 
                                      className="icon-btn green"
                                      onClick={() => handleStatusUpdate(app.id, 'APPROVED')}
                                    >
                                      <Check size={18} />
                                    </button>
                                 </div>
                               )}
                            </div>
                          ) : (
                            <div className="status-row">
                               <span className={`status-label ${app.status === 'APPROVED' ? 'success' : 'danger'}`}>
                                ● {app.status}
                               </span>
                               <span className="text-muted text-xs">Reviewed by {app.reviewedBy}</span>
                            </div>
                          )}
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        <aside className="stats-sidebar">
          <div className="card leave-summary">
             <h3>Leave Summary</h3>
             <div className="summary-item">
                <div className="item-label">
                   <span>Annual Leave</span>
                   <span>{annualTaken} / {annualTotal} Days</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ width: `${Math.min((annualTaken / annualTotal) * 100, 100)}%` }}
                  ></div>
                </div>
             </div>
             <div className="summary-item">
                <div className="item-label">
                   <span>Sick Leave</span>
                   <span>{sickTaken} / {sickTotal} Days</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress blue" 
                    style={{ width: `${Math.min((sickTaken / sickTotal) * 100, 100)}%` }}
                  ></div>
                </div>
             </div>
          </div>

          <div className="card time-off-card">
             <h3>Need Time Off?</h3>
             <p>Your request will be reviewed by HR within 24 hours.</p>
             <button className="btn-white" onClick={() => setShowModal(true)}>Apply Now</button>
          </div>
        </aside>
      </div>

      {/* Leave Application Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>New Leave Application</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label>Leave Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Personal Leave</option>
                  <option>Maternity/Paternity</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Reason / Note</label>
                <textarea 
                  placeholder="Tell us why you need this time off..."
                  rows="4"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .attendance-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
        }

        .attendance-logs-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .date-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .week-strip {
          display: flex;
          justify-content: space-between;
          padding: 1rem 0;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 1.5rem;
        }

        .day-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 10px;
          min-width: 60px;
        }

        .day-box.active {
          background: #0f172a;
          color: white;
        }

        .day-name { font-size: 0.7rem; font-weight: 700; opacity: 0.6; }
        .day-num { font-size: 1rem; font-weight: 700; }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-dot.present { background: #10b981; }
        .status-dot.absent { background: #e2e8f0; }

        .logs-table {
          display: flex;
          flex-direction: column;
        }

        .log-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 0.75rem 0;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .log-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 1rem 0;
          border-top: 1px solid #f1f5f9;
          align-items: center;
          font-size: 0.875rem;
        }

        .user-info { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
        .avatar-xs {
          width: 28px;
          height: 28px;
          background: #f1f5f9;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
        }

        .badge-pill {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .badge-pill.on-time { background: #f0fdf4; color: #10b981; }
        .badge-pill.late { background: #fff7ed; color: #f97316; }

        .time { color: #64748b; }

        .filter-pills { display: flex; gap: 0.5rem; }
        .pill {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
        }
        .pill.active { background: #f1f5f9; border-color: #f1f5f9; color: #0f172a; }

        .app-list { display: flex; flex-direction: column; gap: 1rem; }
        .app-card {
          padding: 1.25rem;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
        }

        .app-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .app-date { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #64748b; }

        .avatar-sm { width: 36px; height: 36px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .app-note { font-size: 0.8125rem; color: #64748b; font-style: italic; margin-bottom: 1rem; }

        .status-row { display: flex; justify-content: space-between; align-items: center; }
        .status-label { font-size: 0.75rem; font-weight: 700; }
        .status-label.warning { color: #f97316; }
        .status-label.success { color: #10b981; }

        .actions { display: flex; gap: 0.5rem; }
        .icon-btn { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; background: white; cursor: pointer; }
        .icon-btn.red:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
        .icon-btn.green:hover { background: #f0fdf4; border-color: #bbf7d0; color: #10b981; }

        .leave-summary { display: flex; flex-direction: column; gap: 1.5rem; }
        .summary-item { display: flex; flex-direction: column; gap: 0.75rem; }
        .item-label { display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; }

        .time-off-card {
          background: #0f172a;
          color: white;
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .time-off-card p { color: #94a3b8; font-size: 0.8125rem; line-height: 1.5; }
        .btn-white { background: white; color: #0f172a; padding: 0.75rem; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; }

        .btn-xs { padding: 4px 10px; font-size: 0.7rem; }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-card {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .modal-header h2 { font-size: 1.5rem; font-weight: 800; }
        .close-btn { background: none; border: none; cursor: pointer; color: #64748b; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        
        .form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          font-size: 0.9375rem;
          outline: none;
          margin-bottom: 1.25rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }

        .status-label.danger { color: #ef4444; }
        .text-muted { color: #64748b; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .attendance-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .log-header { display: none; }
          .log-row {
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 10px;
            margin-bottom: 0.5rem;
          }
          .user-info { grid-column: span 2; margin-bottom: 0.5rem; }
          .time { font-size: 0.8rem; }
          .week-strip { overflow-x: auto; padding-bottom: 1rem; justify-content: flex-start; gap: 0.5rem; }
          .day-box { min-width: 50px; }
          .filter-pills { overflow-x: auto; padding-bottom: 0.5rem; }
        }
      `}</style>
    </div>
  );
};

export default Attendance;
