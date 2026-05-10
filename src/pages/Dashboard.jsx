import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ShieldCheck, 
  ClipboardCheck, 
  History, 
  FileBarChart,
  Check,
  X,
  UserPlus,
  Bell,
  CheckCircle,
  MapPin,
  LogIn,
  LogOut,
  MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeTasks: 0,
    pendingLeaves: 0,
    weeklyPresence: [0, 0, 0, 0, 0]
  });

  const [todayRecord, setTodayRecord] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!userData?.uid) return;
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'daily_attendance'),
      where('userId', '==', userData.uid),
      where('date', '==', today)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setTodayRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setTodayRecord(null);
      }
    });
    return unsubscribe;
  }, [userData?.uid]);

  const handleAttendance = async (type) => {
    if (!userData?.uid) return;
    setAttendanceLoading(true);
    try {
      // Get public IP
      let ip = 'Unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ip = ipData.ip;
      } catch (e) {
        console.warn("IP fetch failed:", e);
      }

      const today = new Date().toISOString().split('T')[0];

      if (type === 'check-in') {
        await addDoc(collection(db, 'daily_attendance'), {
          userId: userData.uid,
          userName: userData.fullName || userData.displayName || 'Staff Member',
          date: today,
          checkIn: Timestamp.now(),
          checkInIp: ip,
          status: 'Present',
          createdAt: Timestamp.now()
        });
      } else if (type === 'check-out' && todayRecord?.id) {
        await updateDoc(doc(db, 'daily_attendance', todayRecord.id), {
          checkOut: Timestamp.now(),
          checkOutIp: ip
        });
      }
    } catch (error) {
      console.error("Attendance Error:", error);
      alert(`Failed to record attendance: ${error.message}`);
    } finally {
      setAttendanceLoading(false);
    }
  };


  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalEmployees: snapshot.size }));
    });

    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setStats(prev => ({ ...prev, activeTasks: snapshot.size }));
    });

    const q = query(collection(db, 'leave_applications'), where('status', '==', 'PENDING'));
    const unsubscribeLeaves = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().userName,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().userName)}&background=random`,
        type: doc.data().type,
        duration: `${doc.data().startDate} - ${doc.data().endDate}`,
        ...doc.data() 
      }));
      setPendingApprovals(data);
      setStats(prev => ({ ...prev, pendingLeaves: snapshot.size }));
    });

    // Weekly Presence Logic
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    startOfWeek.setHours(0,0,0,0);

    const attendQuery = query(
      collection(db, 'daily_attendance'),
      where('createdAt', '>=', Timestamp.fromDate(startOfWeek))
    );

    const unsubscribeAttendance = onSnapshot(attendQuery, (snapshot) => {
      const dailyCounts = [0, 0, 0, 0, 0]; // M T W T F
      snapshot.docs.forEach(doc => {
        const date = doc.data().createdAt && typeof doc.data().createdAt.toDate === 'function' ? doc.data().createdAt.toDate() : null;
        if (date) {
          const day = date.getDay(); // 0 is Sun, 1 is Mon...
          if (day >= 1 && day <= 5) {
            dailyCounts[day - 1]++;
          }
        }
      });
      setStats(prev => ({ ...prev, weeklyPresence: dailyCounts }));
    }, (err) => {
      console.error("Dashboard attendance error:", err);
    });

    // Recent Activity Logic
    const activityQuery = query(collection(db, 'daily_attendance'), orderBy('createdAt', 'desc'), where('createdAt', '!=', null));
    const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
      const activities = snapshot.docs.slice(0, 5).map(doc => {
        const data = doc.data();
        const time = data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : null;
        return {
          title: `${data.userName} checked in`,
          time: time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          icon: <LogIn size={16} />,
          bg: '#eff6ff',
          color: '#2563eb'
        };
      });
      setRecentActivity(activities);
    }, (err) => {
      console.error("Dashboard activity error:", err);
      setRecentActivity([]);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeLeaves();
      unsubscribeAttendance();
      unsubscribeActivity();
    };
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Good morning, {userData?.fullName?.split(' ')[0] || 'Member'}.</h1>
          <p>Manage your project team and pending administrative tasks.</p>
        </div>
        {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
          <button className="btn-primary" onClick={() => navigate('/employees')}>
            <UserPlus size={18} />
            <span>Add Member</span>
          </button>
        )}
      </header>

      <div className="dashboard-grid">
        <div className="main-content-col">
          <div className="card team-overview-card cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/employees')}>
            <div className="card-header-row">
              <div className="card-title-group">
                <h3>Team Overview</h3>
                <p className="project-tag">SOFTWARE HOUSE SYSTEM</p>
              </div>
              <div className="flex items-center gap-2">
                <Users size={24} className="text-blue" />
                <button 
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors" 
                  title="Team Options"
                  onClick={(e) => { e.stopPropagation(); alert('Quick Actions: Filter, Sort, or Export team data.'); }}
                >
                  <MoreVertical size={20} className="text-slate-400" />
                </button>
              </div>
            </div>
            
            <div className="stats-row">
              <div className="stat-box">
                <span className="value">{stats.totalEmployees}</span>
                <span className="label">Total Members</span>
              </div>
              <div className="stat-box">
                <span className="value">{stats.activeTasks}</span>
                <span className="label">Total Active Tasks</span>
              </div>
            </div>
          </div>

          <div className="card presence-card">
            <h3>Weekly Presence</h3>
            <div className="presence-chart">
               <div className="chart-bars">
                  {['M', 'T', 'W', 'T', 'F'].map((day, idx) => {
                    const count = stats.weeklyPresence?.[idx] || 0;
                    const max = Math.max(...(stats.weeklyPresence || [1]), 1);
                    const height = (count / max) * 100;
                    return (
                      <div key={idx} className="bar-group">
                         <div className="bar-container">
                            <div className="bar-fill" style={{ height: `${height}%` }}></div>
                         </div>
                         <span className="day-label">{day}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>

          <div className="approvals-section">
            <div className="section-header">
              <h3>Pending Approvals</h3>
              <button className="text-link blue" onClick={() => navigate('/attendance')}>View All</button>
            </div>
            <div className="approvals-list">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.slice(0, 3).map((item) => (
                  <div key={item.id} className="card approval-item">
                    <div className="user-info">
                      <img src={item.image} alt={item.name} className="avatar-xs" />
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-muted text-sm">{item.type} • {item.duration}</p>
                      </div>
                    </div>
                    <div className="action-buttons">
                      <button className="btn-icon-danger" onClick={() => navigate('/attendance')} title="Reject"><X size={18} /></button>
                      <button className="btn-icon-success" onClick={() => navigate('/attendance')} title="Approve"><Check size={18} /></button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state py-6 text-center text-muted">
                  <p>No pending applications for review.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-col">
          <div className="card attendance-card mb-6">
            <div className="card-header-row">
              <h3>Daily Attendance</h3>
              <MapPin size={20} className="text-blue" />
            </div>
            <p className="text-sm text-muted mb-4">Mark your check-in/out for today.</p>
            
            {!todayRecord ? (
              <button 
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => handleAttendance('check-in')}
                disabled={attendanceLoading}
              >
                <LogIn size={18} />
                {attendanceLoading ? 'Checking In...' : 'Check In'}
              </button>
            ) : !todayRecord.checkOut ? (
              <div className="flex flex-col gap-3">
                <div className="check-in-info p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-bold text-blue-600 uppercase">Checked In At</p>
                  <p className="text-lg font-bold">{todayRecord.checkIn && typeof todayRecord.checkIn.toDate === 'function' ? todayRecord.checkIn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                </div>
                <button 
                  className="btn-outline w-full flex items-center justify-center gap-2"
                  style={{ borderColor: '#fee2e2', color: '#ef4444' }}
                  onClick={() => handleAttendance('check-out')}
                  disabled={attendanceLoading}
                >
                  <LogOut size={18} />
                  {attendanceLoading ? 'Checking Out...' : 'Check Out'}
                </button>
              </div>
            ) : (
              <div className="attendance-complete p-4 bg-green-50 rounded-lg text-center" style={{ backgroundColor: '#f0fdf4' }}>
                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                <p className="font-bold text-green-700">Day Completed</p>
                <p className="text-xs text-green-600">See you tomorrow!</p>
              </div>
            )}
          </div>

          <div className="quick-actions-grid">
            {(isSuperAdmin || userData?.role?.toLowerCase() === 'admin') && (
              <div className="card action-card dark" onClick={() => navigate('/employees')}>
                <ShieldCheck size={24} />
                <span>Manage Roles</span>
              </div>
            )}
            <div className="card action-card" onClick={() => navigate('/tasks')}>
              <ClipboardCheck size={24} className="text-blue" />
              <span>Assign Tasks</span>
            </div>
            <div className="card action-card" onClick={() => navigate('/attendance')}>
              <History size={24} className="text-blue" />
              <span>Team Logs</span>
            </div>
            <div className="card action-card" onClick={() => navigate('/attendance')}>
              <FileBarChart size={24} className="text-blue" />
              <span>Generate Report</span>
            </div>
          </div>

          <div className="card activity-card">
            <h3>Recent Team Activity</h3>
            <div className="activity-list">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-icon-box" style={{ background: activity.bg, color: activity.color }}>
                    {activity.icon}
                  </div>
                  <div className="activity-text">
                    <p>{activity.title}</p>
                    <span className="time">{activity.time}</span>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && <p className="text-muted text-xs text-center py-4">No recent activity.</p>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .dashboard-header p {
          color: #64748b;
          font-size: 0.9375rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
        }

        .main-content-col {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .team-overview-card {
          padding: 1.5rem;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .project-tag {
          font-size: 0.7rem;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: 0.05em;
          margin-top: 4px;
        }

        .stats-row {
          display: flex;
          gap: 4rem;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
        }

        .stat-box .value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        .stat-box .label {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
        }

        .value-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .badge-success {
          background: #f0fdf4;
          color: #10b981;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .presence-card {
          padding: 1.5rem;
        }

        .presence-chart {
          height: 200px;
          display: flex;
          align-items: flex-end;
          padding-top: 2rem;
        }

        .chart-bars {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: flex-end;
          padding: 0 1rem;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          width: 40px;
        }

        .bar-container {
          width: 32px;
          height: 140px;
          background: #f1f5f9;
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }

        .bar-fill {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: #2563eb;
          border-radius: 4px;
          transition: height 0.5s ease;
        }

        .day-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .approvals-section h3 {
          margin-bottom: 1.25rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .approvals-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .approval-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info img {
          width: 44px;
          height: 44px;
          border-radius: 12px;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .btn-icon-danger, .btn-icon-success {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
        }

        .btn-icon-danger { background: #fef2f2; color: #ef4444; }
        .btn-icon-success { background: #f0fdf4; color: #10b981; }

        .sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .action-card:hover { transform: translateY(-2px); }

        .action-card.dark {
          background: #000;
          color: white;
          border: none;
        }

        .action-card span {
          font-size: 0.8125rem;
          font-weight: 700;
        }

        .activity-card {
          padding: 1.5rem;
        }

        .activity-card h3 { margin-bottom: 1.5rem; }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
        }

        .activity-icon-box {
          min-width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-text p {
          font-size: 0.875rem;
          color: #1e293b;
          line-height: 1.4;
          margin-bottom: 2px;
        }

        .activity-text .time {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .attendance-card {
          padding: 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
        }

        .check-in-info {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 1rem;
          border-radius: 8px;
        }

        .attendance-complete {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 1.5rem;
          border-radius: 12px;
        }


        @media (max-width: 1200px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .quick-actions-grid { grid-template-columns: 1fr; }
          .page-header {
             flex-direction: column;
             align-items: flex-start;
             gap: 1rem;
          }
          .header-actions {
             width: 100%;
             justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
