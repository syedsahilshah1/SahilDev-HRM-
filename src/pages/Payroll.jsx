import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Play, 
  CheckCircle, 
  Clock, 
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Payroll = () => {
  const { userData, isSuperAdmin: authSuperAdmin, currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('All Departments');

  // Standardized role check
  const userRole = userData?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'superadmin' || authSuperAdmin || currentUser?.email === 'syedsahilshah1@gmail.com'; // Adding hardcoded fallback for safety
  const hasPayrollAccess = isSuperAdmin || userData?.permissions?.canViewPayroll === true;

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setEmployees(emps);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredEmployees = employees.filter(emp => 
    (activeDept === 'All Departments' || emp.dept === activeDept) && emp.role?.toLowerCase() !== 'superadmin'
  );

  const handleUpdatePayrollStatus = async (uid, newStatus) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { payrollStatus: newStatus });
    } catch (err) {
      console.error('Error updating payroll status:', err);
    }
  };

  const handleRunPayroll = async () => {
    if (filteredEmployees.length === 0) return;
    if (!window.confirm(`Are you sure you want to process payroll for ${filteredEmployees.length} employees in ${activeDept}?`)) return;
    
    try {
      const batch = writeBatch(db);
      filteredEmployees.forEach(emp => {
        const userRef = doc(db, 'users', emp.uid);
        batch.update(userRef, { payrollStatus: 'Paid' });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error running payroll:', err);
    }
  };

  const totalPayroll = filteredEmployees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
  const processedCount = filteredEmployees.filter(emp => emp.payrollStatus === 'Paid').length;
  const pendingCount = filteredEmployees.length - processedCount;

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) return alert('No data to export');
    const headers = ["Employee Name", "Department", "Salary", "Status"];
    const rows = filteredEmployees.map(emp => [
      `"${emp.fullName}"`,
      `"${emp.dept || 'Unassigned'}"`,
      `"${emp.salary || 0}"`,
      `"${emp.payrollStatus || 'Pending'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_report_${activeDept.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasPayrollAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Clock size={48} className="text-muted mb-4" />
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-muted max-w-md mx-auto">You do not have permission to view payroll information. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="payroll-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Payroll Overview</h1>
          <p>Summary for the period of {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleExportCSV}>
            <Download size={18} />
            <span>Generate Reports</span>
          </button>
          <button className="btn-primary flex-row gap-2" onClick={handleRunPayroll}>
            <CheckCircle size={16} fill="currentColor" />
            Run Payroll
          </button>
        </div>
      </header>

      <div className="stats-row">
        <div className="card stat-card wide">
          <p className="stat-label">TOTAL MONTHLY COMPENSATION</p>
          <h2 className="stat-value">${totalPayroll.toLocaleString()}</h2>
          <div className="progress-bar">
            <div className="progress" style={{ width: '45%' }}></div>
          </div>
          <p className="progress-label">45% of Budget</p>
        </div>
        <div className="card stat-card compact">
          <div className="icon-box green"><CheckCircle size={20} /></div>
          <div className="stat-info">
             <p className="stat-label">Processed</p>
             <h3 className="stat-value-small">{processedCount} Employees</h3>
          </div>
        </div>
        <div className="card stat-card compact">
          <div className="icon-box orange"><Clock size={20} /></div>
          <div className="stat-info">
             <p className="stat-label">Pending</p>
             <h3 className="stat-value-small">{pendingCount} Employees</h3>
          </div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-header">
          <h3>Employee Payment Details</h3>
          <div className="flex gap-2">
            {['All Departments', 'Development', 'Design', 'Marketing', 'Sales', 'HR'].map(dept => (
              <button 
                key={dept}
                className={`btn-outline btn-sm ${activeDept === dept ? 'active-pill' : ''}`}
                onClick={() => setActiveDept(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted">
              <Loader2 className="animate-spin mr-2" /> Loading payroll data...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>DEPARTMENT</th>
                  <th>SALARY AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.uid}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-sm">{emp.fullName?.charAt(0)}</div>
                        <div className="user-meta">
                          <p className="user-name">{emp.fullName}</p>
                          <p className="user-email">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{emp.dept}</td>
                    <td className="font-bold">${Number(emp.salary || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${emp.payrollStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {(emp.payrollStatus || 'Pending').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {emp.payrollStatus !== 'Paid' ? (
                          <button 
                            className="btn-action-success"
                            onClick={() => handleUpdatePayrollStatus(emp.uid, 'Paid')}
                          >
                            <CheckCircle size={14} />
                            Pay
                          </button>
                        ) : (
                          <button 
                            className="btn-action-neutral"
                            onClick={() => handleUpdatePayrollStatus(emp.uid, 'Pending')}
                          >
                            Reset
                          </button>
                        )}
                        <button className="download-btn">
                          <Download size={14} />
                          Payslip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-muted">No employees found for this department.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="table-footer">
          <p>Showing {filteredEmployees.length} employees</p>
        </div>
      </div>

      <div className="bottom-grid">
         <div className="card">
            <h3>Tax Withholdings</h3>
            <div className="tax-row">
               <span>Federal Tax</span>
               <span className="font-bold">$0.00</span>
            </div>
            <div className="tax-progress-bar"><div className="tax-progress" style={{ width: '0%' }}></div></div>
            <div className="tax-row">
               <span>Social Security</span>
               <span className="font-bold">$0.00</span>
            </div>
            <div className="tax-progress-bar blue"><div className="tax-progress blue" style={{ width: '0%' }}></div></div>
         </div>
         <div className="card">
            <h3>Annual Trend</h3>
            <p className="text-muted">Comparison with previous fiscal year</p>
            <div className="trend-chart">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="bar" style={{ height: '0%' }}></div>
               ))}
            </div>
         </div>
      </div>

      <style jsx>{`
        .payroll-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .flex-row { display: flex; align-items: center; }
        .gap-2 { gap: 0.5rem; }

        .stats-row {
          display: flex;
          gap: 1.5rem;
        }

        .stat-card.wide { flex: 2; }
        .stat-card.compact { flex: 1; display: flex; align-items: center; gap: 1rem; }

        .progress-bar {
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          margin: 1.5rem 0 0.5rem;
          overflow: hidden;
        }

        .progress {
          height: 100%;
          background: #2563eb;
        }

        .progress-label {
          font-size: 0.75rem;
          color: #64748b;
          text-align: right;
        }

        .stat-value-small {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .icon-box {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-box.green { background: #f0fdf4; color: #10b981; }
        .icon-box.orange { background: #fff7ed; color: #f97316; }

        .table-card { padding: 0; }

        .table-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .table-container { overflow-x: auto; }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f9fafb;
          text-align: left;
          padding: 1rem 1.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
          color: #1e293b;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .avatar-sm {
          width: 32px;
          height: 32px;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .user-name { font-weight: 600; }
        .user-email { font-size: 0.75rem; color: #64748b; }

        .font-bold { font-weight: 700; }

        .download-btn {
          background: transparent;
          border: none;
          color: #2563eb;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .table-footer {
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #64748b;
          font-size: 0.875rem;
        }

        .pagination { display: flex; gap: 0.5rem; }
        .page-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .tax-row {
          display: flex;
          justify-content: space-between;
          margin: 1.5rem 0 0.5rem;
          font-size: 0.875rem;
        }

        .tax-progress-bar {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
        }

        .tax-progress {
          height: 100%;
          background: #0f172a;
        }

        .tax-progress.blue { background: #2563eb; }

        .trend-chart {
          height: 120px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin-top: 2rem;
        }

        .trend-chart .bar {
          flex: 1;
          background: #f1f5f9;
          border-radius: 4px 4px 0 0;
        }

        .trend-chart .bar.dark { background: #0f172a; }

        .text-muted { color: #64748b; font-size: 0.8125rem; }

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .bottom-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .table-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .tabs { 
            overflow-x: auto; 
            width: 100%;
            padding-bottom: 0.5rem;
            justify-content: flex-start;
          }
          .stats-grid { grid-template-columns: 1fr; }
          .table-container { margin: 0 -1.5rem; }
          table { min-width: 600px; }
        }
      `}</style>
    </div>
  );
};

export default Payroll;
