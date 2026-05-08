import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Users, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  FileText
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { isSuperAdmin, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [timeRange, setTimeRange] = useState('monthly'); // monthly, yearly

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Employees
        const empSnap = await getDocs(query(collection(db, 'users'), orderBy('fullName', 'asc')));
        const emps = empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(emps);

        // Fetch Attendance with time filtering
        const now = new Date();
        const dateLimit = new Date();
        if (timeRange === 'monthly') {
          dateLimit.setDate(now.getDate() - 30);
        } else {
          dateLimit.setFullYear(now.getFullYear() - 1);
        }
        const minDateStr = dateLimit.toISOString().split('T')[0];
        
        const attSnap = await getDocs(query(collection(db, 'daily_attendance'), where('date', '>=', minDateStr), orderBy('date', 'desc')));
        setAttendance(attSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // In a real app, we'd fetch actual historical payroll records
        // For now, we'll simulate based on current salaries
        setPayrollData(emps.map(e => ({
          name: e.fullName,
          salary: Number(e.salary) || 0,
          dept: e.dept || 'Unassigned',
          status: e.payrollStatus || 'Pending'
        })));

      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const totalPayroll = payrollData.reduce((sum, item) => sum + item.salary, 0);
  const avgSalary = payrollData.length ? totalPayroll / payrollData.length : 0;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;

  // Calculate actual Department costs
  const deptCosts = employees.reduce((acc, emp) => {
    const dept = emp.dept || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + (Number(emp.salary) || 0);
    return acc;
  }, {});

  const sortedDepts = Object.entries(deptCosts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxDeptCost = Math.max(...Object.values(deptCosts), 1);

  // Calculate actual Attendance percentages
  const totalAttendance = attendance.length || 1;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent' || a.status === 'On Leave').length;
  const lateCount = attendance.filter(a => a.isLate).length;

  const attendanceStats = [
    { label: 'On-time', percentage: Math.round(((presentCount - lateCount) / totalAttendance) * 100), color: 'bg-green-500' },
    { label: 'Late', percentage: Math.round((lateCount / totalAttendance) * 100), color: 'bg-orange-500' },
    { label: 'Absent', percentage: Math.round((absentCount / totalAttendance) * 100), color: 'bg-red-500' },
  ];

  const handleExportCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (type === 'payroll') {
      headers = ["Employee Name", "Department", "Salary", "Status"];
      rows = payrollData.map(p => [`"${p.name}"`, `"${p.dept}"`, p.salary, `"${p.status}"`]);
      filename = `payroll_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ["Date", "Employee Name", "Status", "Check In", "Check Out"];
      rows = attendance.map(a => [`"${a.date}"`, `"${a.userName}"`, `"${a.status}"`, `"${a.checkIn}"`, `"${a.checkOut}"`]);
      filename = `attendance_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isSuperAdmin && userData?.role?.toLowerCase() !== 'admin' && userData?.role?.toLowerCase() !== 'hr') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <BarChart3 size={48} className="text-muted mb-4" />
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-muted">You do not have permission to view system reports.</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Analytics & Reports</h1>
          <p>Comprehensive insights into workforce, payroll, and attendance.</p>
        </div>
        <div className="header-actions">
          <div className="toggle-group">
            <button 
              className={`toggle-btn ${timeRange === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeRange('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`toggle-btn ${timeRange === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeRange('yearly')}
            >
              Yearly
            </button>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => handleExportCSV(activeTab === 'payroll' ? 'payroll' : 'attendance')}>
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      <div className="reports-grid">
        {/* Stats Cards */}
        <div className="stats-row mb-8">
          <div className="card stat-card report-stat">
            <div className="stat-header">
              <div className="icon-box blue"><Users size={20} /></div>
              <span className="trend positive"><ArrowUpRight size={14} /> 12%</span>
            </div>
            <p className="stat-label">Total Workforce</p>
            <h2 className="stat-value">{activeEmployees}</h2>
            <p className="stat-desc">Active members this {timeRange === 'monthly' ? 'month' : 'year'}</p>
          </div>

          <div className="card stat-card report-stat">
            <div className="stat-header">
              <div className="icon-box green"><Wallet size={20} /></div>
              <span className="trend positive"><ArrowUpRight size={14} /> 8%</span>
            </div>
            <p className="stat-label">Total Expenditure</p>
            <h2 className="stat-value">${totalPayroll.toLocaleString()}</h2>
            <p className="stat-desc">Payroll distribution for {timeRange === 'monthly' ? 'current cycle' : 'fiscal year'}</p>
          </div>

          <div className="card stat-card report-stat">
            <div className="stat-header">
              <div className="icon-box orange"><TrendingUp size={20} /></div>
              <span className="trend negative"><ArrowDownRight size={14} /> 2%</span>
            </div>
            <p className="stat-label">Avg. Compensation</p>
            <h2 className="stat-value">${Math.round(avgSalary).toLocaleString()}</h2>
            <p className="stat-desc">Per employee average</p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="card report-container">
          <div className="report-tabs">
            <button 
              className={`report-tab ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Executive Summary
            </button>
            <button 
              className={`report-tab ${activeTab === 'payroll' ? 'active' : ''}`}
              onClick={() => setActiveTab('payroll')}
            >
              Payroll Breakdown
            </button>
            <button 
              className={`report-tab ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance Logs
            </button>
          </div>

          <div className="report-content p-6">
            {activeTab === 'summary' && (
              <div className="summary-view">
                <div className="chart-placeholder flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <BarChart3 size={48} className="text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">Growth Visualizations Loading...</p>
                  <p className="text-xs text-slate-400">Aggregating real-time data for {timeRange} view.</p>
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-blue" />
                      Top Departments by Cost
                    </h4>
                    <div className="space-y-3">
                      {sortedDepts.map(([dept, cost]) => (
                        <div key={dept} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 truncate w-24">{dept}</span>
                          <div className="flex items-center gap-3 flex-1 mx-4">
                            <div className="h-2 bg-slate-100 rounded-full flex-1 overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${(cost / maxDeptCost) * 100}%` }}></div>
                            </div>
                          </div>
                          <span className="text-sm font-bold">${cost.toLocaleString()}</span>
                        </div>
                      ))}
                      {sortedDepts.length === 0 && <p className="text-sm text-muted">No data available</p>}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-green" />
                      Attendance Trends
                    </h4>
                    <div className="space-y-3">
                      {attendanceStats.map(stat => (
                        <div key={stat.label} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{stat.label}</span>
                          <div className="flex items-center gap-3 flex-1 mx-4">
                            <div className="h-2 bg-slate-100 rounded-full flex-1 overflow-hidden">
                              <div className="h-full" style={{ width: `${stat.percentage}%`, backgroundColor: stat.color === 'bg-green-500' ? '#22c55e' : stat.color === 'bg-orange-500' ? '#f97316' : '#ef4444' }}></div>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{stat.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
              <div className="payroll-view overflow-x-auto">
                <table className="report-table w-full">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((p, i) => (
                      <tr key={i}>
                        <td className="font-bold">{p.name}</td>
                        <td>{p.dept}</td>
                        <td>${p.salary.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${p.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button className="text-blue hover:underline text-xs font-bold">Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="attendance-view overflow-x-auto">
                <table className="report-table w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Status</th>
                      <th>In</th>
                      <th>Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.slice(0, 15).map((a, i) => (
                      <tr key={i}>
                        <td>{a.date}</td>
                        <td className="font-bold">{a.userName}</td>
                        <td>
                          <span className={`badge ${a.status === 'Present' ? 'badge-green' : 'badge-red'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>{a.checkIn || '-'}</td>
                        <td>{a.checkOut || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .reports-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .toggle-group {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
        }

        .toggle-btn {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .report-stat {
          flex: 1;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .trend {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 99px;
        }

        .trend.positive { background: #ecfdf5; color: #059669; }
        .trend.negative { background: #fef2f2; color: #dc2626; }

        .report-tabs {
          display: flex;
          padding: 0 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .report-tab {
          padding: 1.25rem 1.5rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .report-tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .report-table {
          border-collapse: collapse;
          text-align: left;
        }

        .report-table th {
          padding: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          border-bottom: 1px solid #f1f5f9;
        }

        .report-table td {
          padding: 1rem;
          font-size: 0.875rem;
          color: #1e293b;
          border-bottom: 1px solid #f8fafc;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .badge-green { background: #ecfdf5; color: #059669; }
        .badge-orange { background: #fff7ed; color: #ea580c; }
        .badge-red { background: #fef2f2; color: #dc2626; }
      `}</style>
    </div>
  );
};

export default Reports;
