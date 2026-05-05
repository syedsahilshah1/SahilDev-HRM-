import React from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileText,
  Check,
  X,
  Clock
} from 'lucide-react';

const Attendance = () => {
  const attendanceLogs = [
    { name: 'Marcus Chen', status: 'ON TIME', checkIn: '08:45 AM', checkOut: '05:30 PM', avatar: 'MC' },
    { name: 'Sarah Jenkins', status: 'LATE', checkIn: '09:12 AM', checkOut: '06:05 PM', avatar: 'SJ' },
  ];

  const applications = [
    { name: 'Elena Rodriguez', role: 'Marketing Specialist', type: 'Sick Leave', date: 'Oct 24 - Oct 26, 2023', duration: '3 Days', note: 'Severe seasonal flu, medical certificate attached.', status: 'PENDING' },
    { name: 'Jameson Blake', role: 'Senior Engineer', type: 'Personal Leave', date: 'Nov 01 - Nov 05, 2023', duration: '5 Days', note: 'Family wedding event in Seattle.', status: 'APPROVED' },
  ];

  return (
    <div className="attendance-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Leave Tracking Workspace</h1>
          <p>Manage attendance records and employee leave requests.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline">Generate Report</button>
          <button className="btn-primary flex items-center gap-2">
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
                  <span>EMPLOYEE</span>
                  <span>STATUS</span>
                  <span>CHECK IN</span>
                  <span>CHECK OUT</span>
               </div>
               {attendanceLogs.map((log, idx) => (
                 <div key={idx} className="log-row">
                    <div className="user-info">
                       <div className="avatar-xs">{log.avatar}</div>
                       <span>{log.name}</span>
                    </div>
                    <div>
                       <span className={`badge-pill ${log.status.toLowerCase()}`}>
                          {log.status}
                       </span>
                    </div>
                    <div className="time">{log.checkIn}</div>
                    <div className="time">{log.checkOut}</div>
                 </div>
               ))}
            </div>
          </div>

          <div className="card review-section">
             <div className="card-header">
                <h3>Review Applications</h3>
                <div className="filter-pills">
                   <button className="pill active">Pending (4)</button>
                   <button className="pill">All Requests</button>
                </div>
             </div>
             <div className="app-list">
                {applications.map((app, idx) => (
                  <div key={idx} className="app-card">
                     <div className="app-top">
                        <div className="user-meta">
                           <div className="avatar-sm">{app.name.charAt(0)}</div>
                           <div>
                              <p className="font-bold">{app.name}</p>
                              <p className="text-muted">{app.role} • {app.type}</p>
                           </div>
                        </div>
                        <div className="app-date">
                           <Calendar size={14} />
                           <span>{app.date} <strong>({app.duration})</strong></span>
                        </div>
                     </div>
                     <p className="app-note">"{app.note}"</p>
                     <div className="app-bottom">
                        {app.status === 'PENDING' ? (
                          <div className="status-row">
                             <span className="status-label warning">● PENDING</span>
                             <div className="actions">
                                <button className="icon-btn red"><X size={18} /></button>
                                <button className="icon-btn green"><Check size={18} /></button>
                             </div>
                          </div>
                        ) : (
                          <div className="status-row">
                             <span className="status-label success">● APPROVED</span>
                             <button className="btn-outline btn-xs">View Details</button>
                          </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <aside className="stats-sidebar">
          <div className="card leave-summary">
             <h3>Leave Summary</h3>
             <div className="summary-item">
                <div className="item-label">
                   <span>Annual Leave</span>
                   <span>18 / 24 Days</span>
                </div>
                <div className="progress-bar"><div className="progress" style={{ width: '75%' }}></div></div>
             </div>
             <div className="summary-item">
                <div className="item-label">
                   <span>Sick Leave</span>
                   <span>2 / 10 Days</span>
                </div>
                <div className="progress-bar"><div className="progress blue" style={{ width: '20%' }}></div></div>
             </div>
          </div>

          <div className="card time-off-card">
             <h3>Need Time Off?</h3>
             <p>Your request will be reviewed by HR within 24 hours.</p>
             <button className="btn-white">Apply Now</button>
          </div>
        </aside>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default Attendance;
