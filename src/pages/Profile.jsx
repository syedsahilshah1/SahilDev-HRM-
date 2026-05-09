import React, { useState, useEffect } from 'react';
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
  Trash2,
  User as UserIcon,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';

const Profile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData, updateUserPassword, updateUserProfile, uploadUserDocument, deleteUserDocument, isSuperAdmin } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    dept: 'IT'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [departments, setDepartments] = useState([]);

  // Documents State
  const [docList, setDocList] = useState([]);
  const [openDocMenu, setOpenDocMenu] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', type: 'pdf', file: null });
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      setLoading(true);
      const targetUid = uid || currentUser?.uid;
      
      if (!targetUid) {
        setLoading(false);
        return;
      }

      setIsOwnProfile(targetUid === currentUser?.uid);

      if (targetUid === currentUser?.uid && userData) {
        setProfileData(userData);
        setLoading(false);
      } else {
        try {
          const userSnap = await getDoc(doc(db, 'users', targetUid));
          if (userSnap.exists()) {
            setProfileData(userSnap.data());
          } else {
            console.error("User not found");
          }
        } catch (err) {
          console.error("Error fetching user:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    checkProfile();
  }, [uid, currentUser, userData]);

  useEffect(() => {
    const unsubDept = onSnapshot(doc(db, 'settings', 'departments'), (doc) => {
      if (doc.exists() && doc.data().list) {
        setDepartments(doc.data().list);
      }
    });
    return () => unsubDept();
  }, []);

  useEffect(() => {
    if (profileData) {
      setEditData({
        fullName: profileData.fullName || '',
        dept: profileData.dept || 'IT'
      });
    }
  }, [profileData]);

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

  const handleDeleteDoc = async (doc) => {
    if (window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      try {
        await deleteUserDocument(doc.id, doc.storagePath);
        setOpenDocMenu(null);
      } catch (err) {
        alert('Failed to delete document: ' + err.message);
      }
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to deactivate this account?')) {
      try {
        await updateUserProfile({ status: 'Deactivated' });
        alert('Account deactivated.');
      } catch (err) {
        alert('Failed to deactivate: ' + err.message);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) return alert('Please select a file');
    
    try {
      setUploadLoading(true);
      await uploadUserDocument(uploadData.file, uploadData.name || uploadData.file.name, uploadData.type);
      setShowUploadModal(false);
      setUploadData({ name: '', type: 'pdf', file: null });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => {
    const targetUid = uid || currentUser?.uid;
    if (!targetUid) return;

    const q = query(
      collection(db, 'users', targetUid, 'documents'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocList(docs);
    });

    return () => unsubscribe();
  }, [uid, currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setOpenDocMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
  if (!profileData) return <div className="p-10 text-center">User not found</div>;

  const schedule = [
    { date: 'OCT 24', title: 'Q4 Performance Review', time: '14:30 - 15:30', location: 'Room 402' },
    { date: 'OCT 28', title: 'New Hire Orientation (Host)', time: '09:00 - 12:00', location: 'Virtual' },
  ];

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="header-top">
          <Link to="/employees" className="back-btn"><ChevronLeft size={20} /> STAFF DIRECTORY</Link>
          <div className="action-buttons">
            <button className="btn-outline" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} /> Edit Profile
            </button>
            {(profileData?.role?.toLowerCase() === 'admin' || profileData?.role?.toLowerCase() === 'superadmin') && (
              <button className="btn-danger" onClick={handleDeactivate}><UserMinus size={16} /> Deactivate</button>
            )}
          </div>
        </div>

        <div className="profile-hero">
          <div className="profile-img-large">
            {currentUser?.photoURL ? (
               <img src={currentUser.photoURL} alt={profileData?.fullName} />
            ) : (
               <div className="avatar-placeholder-large">
                  <UserIcon size={48} />
               </div>
            )}
            <span className="status-dot-active"></span>
          </div>
          <div className="profile-main-info">
            <h1>{profileData?.fullName || 'User Name'}</h1>
            <p className="title">{profileData?.role || 'Staff'} • {profileData?.dept || 'Unassigned'}</p>
            
            <div className="info-grid">
               <div className="info-item">
                  <span className="label">DEPARTMENT</span>
                  <p>{profileData?.dept || 'General'}</p>
               </div>
               <div className="info-item">
                  <span className="label">STAFF ID</span>
                  <p>EMP-{currentUser?.uid.slice(0, 5).toUpperCase()}</p>
               </div>
               <div className="info-item">
                  <span className="label">JOIN DATE</span>
                  <p>{profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}</p>
               </div>
               <div className="info-item">
                  <span className="label">STATUS</span>
                  <p>{profileData?.status || 'Active'}</p>
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
             <h2 className="salary-value">${Number(profileData?.salary || 0).toLocaleString()}</h2>
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
                <button className="text-btn blue" onClick={() => setShowUploadModal(true)}>
                  <Upload size={16} /> Upload New
                </button>
             </div>
             <div className="docs-list">
                {docList.map((doc, idx) => (
                  <div key={idx} className="doc-item">
                     <div className={`doc-icon ${doc.type}`}>
                        {doc.type === 'pdf' ? <FileText size={20} /> : doc.type === 'img' ? <FileImage size={20} /> : <FileCode size={20} />}
                     </div>
                     <div className="doc-meta">
                        <p className="doc-name">{doc.name}</p>
                        <p className="doc-details">Added {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'} • {doc.size}</p>
                     </div>
                     <div className="relative menu-container">
                        <button 
                          className="icon-btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDocMenu(openDocMenu === idx ? null : idx);
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openDocMenu === idx && (
                          <div className="dropdown-menu card shadow-lg">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setOpenDocMenu(null)}>
                              <Download size={16} />
                              <span>Download</span>
                            </a>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteDoc(doc)}>
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                     </div>
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
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="submit-btn" disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>File Selection</label>
                <input 
                  type="file" 
                  className="modal-input" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setUploadData({
                        ...uploadData,
                        file: file,
                        name: file.name
                      });
                    }
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="e.g. Contract_Signed.pdf"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>File Category</label>
                <select 
                  className="modal-input"
                  value={uploadData.type}
                  onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                >
                  <option value="pdf">PDF Document</option>
                  <option value="img">Image / Photo</option>
                  <option value="doc">Word Document</option>
                </select>
              </div>
              <button type="submit" className="submit-btn" disabled={uploadLoading}>
                {uploadLoading ? 'Uploading...' : 'Add to Records'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .profile-page { display: flex; flex-direction: column; gap: 2rem; }
        .relative { position: relative; }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 100;
          background: white;
          min-width: 160px;
          border-radius: 12px;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          margin-top: 0.25rem;
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
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          color: #475569;
          font-size: 0.8rem;
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

        .docs-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem; }
        .doc-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; border: 1px solid #f1f5f9; transition: all 0.2s; }
        .doc-item:hover { background: #f8fafc; border-color: #e2e8f0; }
        .doc-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .doc-icon.pdf { background: #fee2e2; color: #ef4444; }
        .doc-icon.img { background: #f0fdf4; color: #10b981; }
        .doc-icon.doc { background: #eff6ff; color: #2563eb; }
        .doc-meta { flex: 1; }
        .doc-name { font-size: 0.9375rem; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
        .doc-details { font-size: 0.75rem; color: #64748b; font-weight: 500; }
        
        .tabs { display: flex; gap: 1.5rem; border-bottom: 1px solid #f1f5f9; margin-bottom: 2rem; }
        .tab { padding-bottom: 1rem; border: none; background: transparent; font-size: 0.9375rem; font-weight: 700; color: #94a3b8; cursor: pointer; position: relative; }
        .tab.active { color: #0f172a; }
        .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #0f172a; }

        .docs-header { display: flex; justify-content: space-between; align-items: center; }
        .text-btn { background: transparent; border: none; font-size: 0.875rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .text-btn.blue { color: #2563eb; }
        .text-btn.blue:hover { color: #1d4ed8; }

        @media (max-width: 1024px) {
          .profile-grid { grid-template-columns: 1fr; }
          .profile-hero { flex-direction: column; text-align: center; gap: 1.5rem; }
          .info-grid { justify-content: center; gap: 2rem; }
        }

        @media (max-width: 640px) {
          .header-top { flex-direction: column; gap: 1rem; align-items: flex-start; }
          .info-grid { flex-direction: column; gap: 1rem; }
          .modal-content { padding: 1.5rem; }
          .profile-hero { gap: 1rem; }
          .profile-img-large { width: 100px; height: 100px; }
          .profile-main-info h1 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
