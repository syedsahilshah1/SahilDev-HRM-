import React from 'react';
import { 
  FileText, 
  Play, 
  CheckCircle, 
  Clock, 
  Download,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Payroll = () => {
  const payrollData = [];

  return (
    <div className="payroll-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Payroll Overview</h1>
          <p>Summary for the period of October 2023</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline">Generate Reports</button>
          <button className="btn-primary flex-row gap-2">
            <Play size={16} fill="currentColor" />
            Run Payroll
          </button>
        </div>
      </header>

      <div className="stats-row">
        <div className="card stat-card wide">
          <p className="stat-label">TOTAL MONTHLY COMPENSATION</p>
          <h2 className="stat-value">$0.00</h2>
          <div className="progress-bar">
            <div className="progress" style={{ width: '0%' }}></div>
          </div>
          <p className="progress-label">0% of Budget</p>
        </div>
        <div className="card stat-card compact">
          <div className="icon-box green"><CheckCircle size={20} /></div>
          <div className="stat-info">
             <p className="stat-label">Processed</p>
             <h3 className="stat-value-small">0 Employees</h3>
          </div>
        </div>
        <div className="card stat-card compact">
          <div className="icon-box orange"><Clock size={20} /></div>
          <div className="stat-info">
             <p className="stat-label">Pending</p>
             <h3 className="stat-value-small">0 Employees</h3>
          </div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-header">
          <h3>Employee Payment Details</h3>
          <button className="btn-outline btn-sm">
            <Filter size={14} />
            All Departments
          </button>
        </div>
        <div className="table-container">
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
              {payrollData.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-sm">{row.name.charAt(0)}</div>
                      <div className="user-meta">
                        <p className="user-name">{row.name}</p>
                        <p className="user-email">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{row.dept}</td>
                  <td className="font-bold">{row.amount}</td>
                  <td>
                    <span className={`badge ${row.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="download-btn">
                      <Download size={16} />
                      Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <p>No records found</p>
          <div className="pagination">
            <button className="page-btn"><ChevronLeft size={16} /></button>
            <button className="page-btn"><ChevronRight size={16} /></button>
          </div>
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
      `}</style>
    </div>
  );
};

export default Payroll;
