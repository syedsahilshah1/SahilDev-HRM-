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
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeTasks: 0
  });

  useEffect(() => {
    // Total Employees
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalEmployees: snapshot.size }));
    });

    // Active Tasks
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setStats(prev => ({ ...prev, activeTasks: snapshot.size }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
    };
  }, []);
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Good morning, {userData?.fullName?.split(' ')[0] || 'Member'}.</h1>
        <p>Manage your project team and pending administrative tasks.</p>
      </header>

      <div className="dashboard-grid">
        <div className="main-content-col">
          <div className="card team-overview-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <h3>Team Overview</h3>
                <p className="project-tag">PROJECT: APOLLO PHASE II</p>
              </div>
              <Users size={24} className="text-blue" />
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
                  {['M', 'T', 'W', 'T', 'F'].map((day, idx) => (
                    <div key={idx} className="bar-group">
                       <div className="bar-container">
                          <div className="bar-fill" style={{ height: '0%' }}></div>
                       </div>
                       <span className="day-label">{day}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="approvals-section">
            <div className="section-header">
              <h3>Pending Approvals</h3>
              <button className="text-link blue">View All</button>
            </div>
            <div className="approvals-list">
              {[].map((item, idx) => (
                <div key={idx} className="card approval-item">
                  <div className="user-info">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-muted text-sm">{item.type} • {item.duration}</p>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button className="btn-icon-danger"><X size={18} /></button>
                    <button className="btn-icon-success"><Check size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar-col">
          <div className="quick-actions-grid">
            <div className="card action-card dark" onClick={() => alert('Role Management module coming soon!')}>
              <ShieldCheck size={24} />
              <span>Manage Roles</span>
            </div>
            <div className="card action-card" onClick={() => navigate('/tasks')}>
              <ClipboardCheck size={24} className="text-blue" />
              <span>Assign Tasks</span>
            </div>
            <div className="card action-card" onClick={() => alert('Team Logs module coming soon!')}>
              <History size={24} className="text-blue" />
              <span>Team Logs</span>
            </div>
            <div className="card action-card" onClick={() => alert('Report Generation module coming soon!')}>
              <FileBarChart size={24} className="text-blue" />
              <span>Generate Report</span>
            </div>
          </div>

          <div className="card activity-card">
            <h3>Recent Team Activity</h3>
            <div className="activity-list">
              {[].map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-icon-box" style={{ background: activity.bg }}>
                    {activity.icon}
                  </div>
                  <div className="activity-text">
                    <p>{activity.title}</p>
                    <span className="time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 2rem;
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

        @media (max-width: 1200px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
