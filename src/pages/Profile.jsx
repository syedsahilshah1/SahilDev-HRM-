import React, { useState } from 'react';
import { 
  Edit3, 
  UserMinus, 
  Mail, 
  FileText, 
  FileImage, 
  FileCode,
  MoreVertical,
  Upload,
  ChevronLeft,
  Wallet,
  Key,
  X,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { currentUser, userData, updateUserPassword, updateUserProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    fullName: userData?.fullName || '',
    dept: userData?.dept || 'IT'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setPassError('Password must be at least 6 characters.');
    
    try {
      setPassError('');
      setPassSuccess('');
      setPassLoading(true);
      await updateUserPassword(newPassword);
      setPassSuccess('Password updated successfully!');
      setNewPassword('');
    } catch (err) {
      setPassError('Failed to update password. ' + err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setEditError('');
      setEditLoading(true);
      await updateUserProfile(editData);
      setShowEditModal(false);
    } catch (err) {
      setEditError('Failed to update profile. ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const documents = [
    { name: 'Employment_Contract_2018.pdf', type: 'pdf', date: 'Mar 12, 2018', size: '2.4 MB' },
    { name: 'Promotion_Letter_2022.docx', type: 'doc', date: 'Jan 15, 2022', size: '1.1 MB' },
    { name: 'ID_Verification_Copy.jpg', type: 'img', date: 'Mar 10, 2018', size: '4.8 MB' },
    { name: 'Compliance_Training_Cert.pdf', type: 'pdf', date: 'Oct 22, 2023', size: '0.8 MB' },
  ];

  const schedule = [
    { date: 'OCT 24', title: 'Q4 Performance Review', time: '14:30 - 15:30', location: 'Room 402' },
    { date: 'OCT 28', title: 'New Hire Orientation (Host)', time: '09:00 - 12:00', location: 'Virtual' },
  ];

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="header-top">
          <Link to="/employees" className="back-btn"><ChevronLeft size={20} /> EMPLOYEE DIRECTORY</Link>
          <div className="action-buttons">
            <button className="btn-outline" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} /> Edit Profile
            </button>
            <button className="btn-danger"><UserMinus size={16} /> Deactivate</button>
          </div>
        </div>

        <div className="profile-hero">
          <div className="profile-img-large">
            {currentUser?.photoURL ? (
               <img src={currentUser.photoURL} alt={userData?.fullName} />
            ) : (
               <div className="avatar-placeholder-large">
                  <UserIcon size={48} />
               </div>
            )}
            <span className="status-dot-active"></span>
          </div>
          <div className="profile-main-info">
            <h1>{userData?.fullName || 'User Name'}</h1>
            <p className="title">{userData?.role || 'Employee'} • {userData?.dept || 'Unassigned'}</p>
            
            <div className="info-grid">
               <div className="info-item">
                  <span className="label">DEPARTMENT</span>
                  <p>{userData?.dept || 'General'}</p>
               </div>
               <div className="info-item">
                  <span className="label">EMPLOYEE ID</span>
                  <p>EMP-{currentUser?.uid.slice(0, 5).toUpperCase()}</p>
               </div>
               <div className="info-item">
                  <span className="label">JOIN DATE</span>
                  <p>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</p>
               </div>
               <div className="info-item">
                  <span className="label">STATUS</span>
                  <p>{userData?.status || 'Active'}</p>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        <div className="profile-left">
          <div className="card salary-card dark">
             <div className="card-header">
                <span className="label">ANNUAL SALARY</span>
                <Wallet size={20} className="text-muted" />
             </div>
             <h2 className="salary-value">$98,500.00</h2>
             <p className="next-review">Next Review: Nov 2024</p>
          </div>

          <div className="contact-info">
             <div className="card contact-card">
                <div className="icon-box"><Mail size={20} /></div>
                <div>
                   <p className="label">EMAIL</p>
                   <p className="value">{currentUser?.email}</p>
                </div>
             </div>
             
             <div className="card contact-card security-card">
                <div className="icon-box"><Key size={20} /></div>
                <div className="flex-1">
                   <p className="label">SECURITY</p>
                   <form onSubmit={handlePasswordChange} className="password-form">
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="password-input"
                      />
                      <button type="submit" className="update-btn" disabled={passLoading}>
                        {passLoading ? 'Updating...' : 'Update'}
                      </button>
                   </form>
                   {passError && <p className="error-text">{passError}</p>}
                   {passSuccess && <p className="success-text">{passSuccess}</p>}
                </div>
             </div>
          </div>

          <div className="card leave-summary">
             <h3>Leave Summary (2024)</h3>
             <div className="summary-item">
                <div className="summary-label">
                   <span>ANNUAL LEAVE</span>
                   <span>18 / 25 days</span>
                </div>
                <div className="progress-bar"><div className="progress" style={{ width: '72%' }}></div></div>
             </div>
             <div className="summary-item">
                <div className="summary-label">
                   <span>SICK LEAVE</span>
                   <span>2 / 10 days</span>
                </div>
                <div className="progress-bar"><div className="progress dark" style={{ width: '20%' }}></div></div>
             </div>
          </div>
        </div>

        <div className="profile-right">
          <div className="card docs-card">
             <div className="tabs">
                <button className="tab active">Documents</button>
                <button className="tab">Attendance History</button>
             </div>
             <div className="docs-header">
                <h3>Personnel Documents</h3>
                <button className="text-btn blue"><Upload size={16} /> Upload New</button>
             </div>
             <div className="docs-list">
                {documents.map((doc, idx) => (
                  <div key={idx} className="doc-item">
                     <div className={`doc-icon ${doc.type}`}>
                        {doc.type === 'pdf' ? <FileText size={20} /> : doc.type === 'img' ? <FileImage size={20} /> : <FileCode size={20} />}
                     </div>
                     <div className="doc-meta">
                        <p className="doc-name">{doc.name}</p>
                        <p className="doc-details">Added {doc.date} • {doc.size}</p>
                     </div>
                     <button className="icon-btn-ghost"><MoreVertical size={18} /></button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>

            {editError && <div className="alert alert-error">{editError}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={editData.fullName}
                  onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select 
                  className="modal-input"
                  value={editData.dept}
                  onChange={(e) => setEditData({...editData, dept: e.target.value})}
                >
                  <option>IT</option>
                  <option>HR</option>
                  <option>Sales</option>
                  <option>Marketing</option>
                  <option>Operations</option>
                </select>
              </div>
              <button type="submit" className="submit-btn" disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-page { display: flex; flex-direction: column; gap: 2rem; }
        .password-form { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .password-input { flex: 1; padding: 0.5rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.875rem; outline: none; }
        .update-btn { background: #0f172a; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
        .error-text { color: #ef4444; font-size: 0.75rem; margin-top: 0.5rem; font-weight: 600; }
        .success-text { color: #10b981; font-size: 0.75rem; margin-top: 0.5rem; font-weight: 600; }
        .flex-1 { flex: 1; }

        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .back-btn { background: transparent; border: none; color: #64748b; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; text-decoration: none; }

        .profile-hero { display: flex; gap: 2.5rem; align-items: center; }
        .profile-img-large { position: relative; width: 120px; height: 120px; }
        .profile-img-large img, .avatar-placeholder-large { width: 100%; height: 100%; border-radius: 24px; object-fit: cover; }
        .avatar-placeholder-large { background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b; }
        .status-dot-active { position: absolute; bottom: -5px; right: -5px; width: 20px; height: 20px; background: #10b981; border: 4px solid white; border-radius: 50%; }

        .profile-main-info h1 { font-size: 2rem; font-weight: 800; color: #0f172a; }
        .profile-main-info .title { font-size: 1.125rem; color: #64748b; margin-bottom: 1.5rem; }
        .info-grid { display: flex; gap: 3rem; }
        .info-item .label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px; display: block; }
        .info-item p { font-size: 0.9375rem; font-weight: 600; color: #1e293b; }

        .profile-grid { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; }
        .salary-card.dark { background: #0f172a; color: white; padding: 2rem; margin-bottom: 1.5rem; }
        .salary-value { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .contact-info { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .contact-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; }
        .contact-card .icon-box { width: 44px; height: 44px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0f172a; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-content { background: white; width: 100%; max-width: 440px; padding: 2.5rem; border-radius: 24px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .close-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; }
        .modal-input { width: 100%; padding: 0.875rem; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 1rem; outline: none; background: #f8fafc; margin-top: 0.5rem; }
        .submit-btn { width: 100%; padding: 1rem; background: #000; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; margin-top: 1.5rem; }
        .alert-error { background: #fef2f2; color: #ef4444; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; font-size: 0.875rem; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default Profile;
