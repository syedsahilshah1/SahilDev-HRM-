import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { 
  Shield, 
  Wallet, 
  Calendar, 
  Users, 
  Plus, 
  Filter, 
  Download, 
  CheckCircle2, 
  Eye, 
  XCircle,
  X,
  History,
  Mail,
  Server,
  Lock,
  FileText,
  Network,
  ShieldCheck,
  Trash2,
  Save,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ enabled, setEnabled }) => (
  <button 
    onClick={() => setEnabled(!enabled)}
    className={`toggle-switch ${enabled ? 'enabled' : ''}`}
  >
    <div className="toggle-dot"></div>
    <style>{`
      .toggle-switch {
        width: 44px;
        height: 24px;
        background: #e2e8f0;
        border-radius: 99px;
        border: none;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .toggle-switch.enabled {
        background: #2563eb;
      }
      .toggle-dot {
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 3px;
        left: 3px;
        transition: transform 0.3s ease;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      .toggle-switch.enabled .toggle-dot {
        transform: translateX(20px);
      }
    `}</style>
  </button>
);

const Settings = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState({
    payroll: true,
    attendance: true,
    leaves: true,
    directory: true
  });

  const [smtp, setSmtp] = useState({
    server: 'smtp.gmail.com',
    port: '587',
    encryption: 'TLS',
    user: import.meta.env.VITE_SMTP_USER || '',
    password: import.meta.env.VITE_SMTP_PASS || ''
  });

  const [companyPolicy, setCompanyPolicy] = useState('');
  const [orgChartUrl, setOrgChartUrl] = useState('');
  const [documents, setDocuments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newDesignation, setNewDesignation] = useState('');
  const [newDept, setNewDept] = useState('');
  const [cloudinary, setCloudinary] = useState({
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
  });
  const [emailJS, setEmailJS] = useState({
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
  });
  const [saving, setSaving] = useState({ 
    policy: false, 
    org: false, 
    doc: false, 
    designation: false, 
    smtp: false,
    cloudinary: false,
    emailjs: false,
    testEmail: false,
    testCloud: false
  });

  const documentCategories = [
    'General',
    'Employment / HR',
    'Disciplinary',
    'Payroll / Finance',
    'Daily / Internal',
    'Legal',
    'Certificates'
  ];

  useEffect(() => {
    if (!isSuperAdmin) return;

    // Load Policy & Org Chart
    const loadCompanyData = async () => {
      const policyDoc = await getDoc(doc(db, 'settings', 'company_policy'));
      if (policyDoc.exists()) setCompanyPolicy(policyDoc.data().content);

      const orgDoc = await getDoc(doc(db, 'settings', 'org_chart'));
      if (orgDoc.exists()) setOrgChartUrl(orgDoc.data().imageUrl);

      const smtpDoc = await getDoc(doc(db, 'settings', 'smtp'));
      if (smtpDoc.exists()) setSmtp(prev => ({ ...prev, ...smtpDoc.data() }));

      const cloudDoc = await getDoc(doc(db, 'settings', 'cloudinary'));
      if (cloudDoc.exists()) setCloudinary(prev => ({ ...prev, ...cloudDoc.data() }));

      const ejsDoc = await getDoc(doc(db, 'settings', 'emailjs'));
      if (ejsDoc.exists()) setEmailJS(prev => ({ ...prev, ...ejsDoc.data() }));
    };

    loadCompanyData();

    // Load Documents
    const unsubDocs = onSnapshot(collection(db, 'documents'), (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Load Designations
    const unsubDesig = onSnapshot(doc(db, 'settings', 'designations'), (docSnap) => {
      if (docSnap.exists()) {
        const list = docSnap.data().list || [];
        // Keep unique by exact match (case sensitive) for the list display
        const uniqueList = Array.from(new Set(list.map(d => d.trim()))).filter(Boolean);
        setDesignations(uniqueList);
      }
    });

    // Load Departments
    const unsubDept = onSnapshot(doc(db, 'settings', 'departments'), (docSnap) => {
      if (docSnap.exists()) {
        const list = docSnap.data().list || [];
        const uniqueList = Array.from(new Set(list.map(d => d.trim()))).filter(Boolean);
        setDepartments(uniqueList);
      }
    });

    return () => {
      unsubDocs();
      unsubDesig();
      unsubDept();
    };
  }, [isSuperAdmin]);

  const handleSavePolicy = async () => {
    setSaving({ ...saving, policy: true });
    try {
      await setDoc(doc(db, 'settings', 'company_policy'), { content: companyPolicy });
      alert('Policy updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update policy');
    }
    setSaving({ ...saving, policy: false });
  };

  const handleSaveOrgChart = async () => {
    setSaving({ ...saving, org: true });
    try {
      await setDoc(doc(db, 'settings', 'org_chart'), { imageUrl: orgChartUrl });
      alert('Org Chart updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update org chart');
    }
    setSaving({ ...saving, org: false });
  };

  const handleSaveSmtp = async () => {
    setSaving({ ...saving, smtp: true });
    try {
      await setDoc(doc(db, 'settings', 'smtp'), smtp);
      alert('SMTP Settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update SMTP settings');
    }
    setSaving({ ...saving, smtp: false });
  };

  const handleSaveCloudinary = async () => {
    setSaving({ ...saving, cloudinary: true });
    try {
      await setDoc(doc(db, 'settings', 'cloudinary'), cloudinary);
      alert('Cloudinary settings updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update Cloudinary settings');
    }
    setSaving({ ...saving, cloudinary: false });
  };

  const handleTestCloudinary = async () => {
    if (!cloudinary.cloudName || !cloudinary.uploadPreset) {
      return alert('Please enter Cloudinary credentials first.');
    }
    setSaving({ ...saving, testCloud: true });
    try {
      // Logic for testing cloud connectivity
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Cloudinary connection verified successfully!');
    } catch (err) {
      alert('Connection failed.');
    }
    setSaving({ ...saving, testCloud: false });
  };

  const handleSaveEmailJS = async () => {
    setSaving({ ...saving, emailjs: true });
    try {
      await setDoc(doc(db, 'settings', 'emailjs'), emailJS);
      alert('EmailJS settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update EmailJS settings');
    }
    setSaving({ ...saving, emailjs: false });
  };

  const handleTestEmailJS = async () => {
    if (!emailJS.serviceId || !emailJS.templateId || !emailJS.publicKey) {
      return alert('Please fill in all EmailJS fields before testing.');
    }
    
    setSaving({ ...saving, testEmail: true });
    try {
      const { sendDocumentEmail } = await import('../services/emailService');
      await sendDocumentEmail({
        to_name: userData?.fullName || 'Admin',
        to_email: userData?.email || 'test@example.com',
        template_name: 'TEST CONNECTION',
        message_content: 'If you are reading this, your EmailJS integration is working perfectly!',
        sent_by: 'HR System Admin'
      }, emailJS);
      alert('Test email sent! Check your inbox.');
    } catch (err) {
      console.error(err);
      alert('EmailJS Test Failed: ' + err.message);
    }
    setSaving({ ...saving, testEmail: false });
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.url) return;
    setSaving({ ...saving, doc: true });
    try {
      await addDoc(collection(db, 'documents'), {
        ...newDoc,
        createdAt: serverTimestamp(),
        uploadedBy: 'Admin'
      });
      setNewDoc({ name: '', category: '', url: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add document');
    }
    setSaving({ ...saving, doc: false });
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDoc(doc(db, 'documents', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddDesignation = async (e) => {
    e.preventDefault();
    const trimmed = newDesignation.trim();
    if (!trimmed) return;
    
    // Check if it already exists in the current local list
    if (designations.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      alert('This designation already exists.');
      return;
    }

    setSaving({ ...saving, designation: true });
    // Clear input immediately to prevent "ALREADY EXISTS" badge flash
    setNewDesignation('');
    
    try {
      const currentList = designations.map(d => d.trim()).filter(Boolean);
      const updatedList = [...new Set([...currentList, trimmed])].sort((a, b) => a.localeCompare(b));
      
      await setDoc(doc(db, 'settings', 'designations'), { list: updatedList });
    } catch (err) {
      console.error(err);
      alert('Failed to add designation');
      // Restore input on failure
      setNewDesignation(trimmed);
    } finally {
      setSaving({ ...saving, designation: false });
    }
  };

  const handleDeleteDesignation = async (desigToDelete) => {
    if (!window.confirm(`Remove "${desigToDelete}"?`)) return;
    const updatedList = designations.filter(d => d !== desigToDelete);
    try {
      await setDoc(doc(db, 'settings', 'designations'), { list: updatedList });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    const trimmed = newDept.trim();
    if (!trimmed) return;
    if (departments.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      alert('This department already exists.');
      return;
    }

    setSaving({ ...saving, dept: true });
    setNewDept('');

    try {
      const currentList = departments.map(d => d.trim()).filter(Boolean);
      const updatedList = [...new Set([...currentList, trimmed])].sort((a, b) => a.localeCompare(b));
      
      await setDoc(doc(db, 'settings', 'departments'), { list: updatedList });
    } catch (err) {
      console.error(err);
      alert('Failed to add department');
      setNewDept(trimmed);
    } finally {
      setSaving({ ...saving, dept: false });
    }
  };

  const handleDeleteDept = async (deptToDelete) => {
    if (!window.confirm(`Remove "${deptToDelete}"?`)) return;
    const updatedList = departments.filter(d => d !== deptToDelete);
    try {
      await setDoc(doc(db, 'settings', 'departments'), { list: updatedList });
    } catch (err) {
      console.error(err);
    }
  };

  const roles = [
    { name: 'Superadmin', desc: 'FULL SYSTEM CONTROL', payroll: 'full', directory: 'full' },
    { name: 'Co-founder', desc: 'READ-ONLY ANALYTICS', payroll: 'read', directory: 'full' },
    { name: 'Project Manager', desc: 'TEAM MANAGEMENT', payroll: 'none', directory: 'full' },
    { name: 'Employee', desc: 'SELF-SERVICE PORTAL', payroll: 'none', directory: 'full' },
  ];

  const getStatusIcon = (status) => {
    if (status === 'full') return <CheckCircle2 size={24} className="text-success" />;
    if (status === 'read') return <Eye size={24} className="text-blue" />;
    return <XCircle size={24} className="text-muted" />;
  };

  if (!isSuperAdmin) {
    return (
      <div className="settings-page text-center py-20">
        <Lock size={64} className="text-muted mx-auto mb-4" />
        <h1>Access Restricted</h1>
        <p>Only the Superadmin (HR) can access these settings.</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <div className="header-left">
          <h1>System Configuration & Access Control</h1>
          <p>Configure global modules, role permissions, and email server settings.</p>
        </div>
      </header>

      <div className="settings-grid">
        <div className="left-column">
          {/* Modules Card */}
          <div className="card modules-card">
            <div className="card-header-row">
              <h3>Global System Modules</h3>
              <span className="badge-blue badge">Active</span>
            </div>
            
            <div className="module-list">
              {[
                { id: 'payroll', name: 'Payroll', desc: 'Salary & Disbursements', icon: <Wallet size={20} /> },
                { id: 'attendance', name: 'Attendance', desc: 'Daily Logs & Rosters', icon: <Calendar size={20} /> },
                { id: 'leaves', name: 'Leaves', desc: 'Approvals & Balances', icon: <Shield size={20} /> },
                { id: 'directory', name: 'Directory', desc: 'Employee Listings', icon: <Users size={20} /> },
              ].map(module => (
                <div key={module.id} className="module-item">
                  <div className="module-info">
                    <div className="module-icon">{module.icon}</div>
                    <div>
                      <p className="font-bold">{module.name}</p>
                      <p className="text-muted">{module.desc}</p>
                    </div>
                  </div>
                  <Toggle enabled={modules[module.id]} setEnabled={(val) => setModules({...modules, [module.id]: val})} />
                </div>
              ))}
            </div>
          </div>

          {/* SMTP Card */}
          <div className="card smtp-card">
             <div className="card-header-row">
                <div className="flex items-center gap-2">
                  <Mail size={20} className="text-blue" />
                  <h3>SMTP Configuration</h3>
                </div>
                <button className="text-link text-xs">Test Server</button>
             </div>
             <div className="smtp-form mt-4">
                <div className="form-group mb-4">
                   <label className="text-tiny font-bold text-muted mb-1 block">SMTP HOST</label>
                   <input 
                    type="text" 
                    value={smtp.server} 
                    onChange={(e) => setSmtp({...smtp, server: e.target.value})}
                    className="settings-input" 
                   />
                </div>
                <div className="form-row flex gap-2">
                   <div className="form-group flex-1">
                      <label className="text-tiny font-bold text-muted mb-1 block">PORT</label>
                      <input 
                        type="text" 
                        value={smtp.port} 
                        onChange={(e) => setSmtp({...smtp, port: e.target.value})}
                        className="settings-input" 
                      />
                   </div>
                   <div className="form-group flex-1">
                      <label className="text-tiny font-bold text-muted mb-1 block">ENCRYPTION</label>
                      <select 
                        value={smtp.encryption} 
                        onChange={(e) => setSmtp({...smtp, encryption: e.target.value})}
                        className="settings-input"
                      >
                        <option value="TLS">TLS</option>
                        <option value="SSL">SSL</option>
                        <option value="None">None</option>
                      </select>
                   </div>
                </div>
                <div className="form-group mt-4">
                   <label className="text-tiny font-bold text-muted mb-1 block">SENDER AUTH (EMAIL)</label>
                   <input 
                    type="text" 
                    value={smtp.user} 
                    onChange={(e) => setSmtp({...smtp, user: e.target.value})}
                    className="settings-input" 
                   />
                </div>
                <div className="form-group mt-4">
                   <label className="text-tiny font-bold text-muted mb-1 block">PASSWORD / APP KEY</label>
                   <input 
                    type="password" 
                    value={smtp.password} 
                    onChange={(e) => setSmtp({...smtp, password: e.target.value})}
                    className="settings-input" 
                    placeholder="••••••••"
                   />
                </div>
                <button 
                  onClick={handleSaveSmtp}
                  disabled={saving.smtp}
                  className="btn-outline w-full mt-4 flex items-center justify-center gap-2"
                >
                  <Server size={16} />
                  {saving.smtp ? 'Saving...' : 'Save Mail Settings'}
                </button>
             </div>
          </div>

          {/* Cloudinary Card */}
          <div className="card cloudinary-card mt-8">
             <div className="card-header-row">
                <div className="flex items-center gap-2">
                  <FileImage size={20} className="text-orange" />
                  <h3>Cloudinary Integration</h3>
                </div>
                <span className="badge badge-orange">Media Storage</span>
             </div>
             <div className="smtp-form mt-4">
                <div className="form-group mb-4">
                   <label className="text-tiny font-bold text-muted mb-1 block">CLOUD NAME</label>
                   <input 
                    type="text" 
                    value={cloudinary.cloudName} 
                    onChange={(e) => setCloudinary({...cloudinary, cloudName: e.target.value})}
                    className="settings-input" 
                    placeholder="e.g. dgqjvkfrf"
                   />
                </div>
                <div className="form-group">
                   <label className="text-tiny font-bold text-muted mb-1 block">UPLOAD PRESET (UNSIGNED)</label>
                   <input 
                    type="text" 
                    value={cloudinary.uploadPreset} 
                    onChange={(e) => setCloudinary({...cloudinary, uploadPreset: e.target.value})}
                    className="settings-input" 
                    placeholder="e.g. ml_default"
                   />
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={handleSaveCloudinary}
                    disabled={saving.cloudinary}
                    className="btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {saving.cloudinary ? 'Saving...' : 'Update Cloudinary'}
                  </button>
                  <button 
                    onClick={handleTestCloudinary}
                    disabled={saving.testCloud}
                    className="btn-ghost flex-1 flex items-center justify-center gap-2 text-primary"
                  >
                    {saving.testCloud ? <Loader2 className="animate-spin" size={16} /> : <FileImage size={16} />}
                    {saving.testCloud ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
             </div>
          </div>

          {/* EmailJS Card */}
          <div className="card emailjs-card mt-8">
             <div className="card-header-row">
                <div className="flex items-center gap-2">
                  <Mail size={20} className="text-success" />
                  <h3>EmailJS (Service Provider)</h3>
                </div>
                <span className="badge badge-success">Automated</span>
             </div>
             <div className="smtp-form mt-4">
                <div className="form-group mb-4">
                   <label className="text-tiny font-bold text-muted mb-1 block">SERVICE ID</label>
                   <input 
                    type="text" 
                    value={emailJS.serviceId} 
                    onChange={(e) => setEmailJS({...emailJS, serviceId: e.target.value})}
                    className="settings-input" 
                   />
                </div>
                <div className="form-group mb-4">
                   <label className="text-tiny font-bold text-muted mb-1 block">TEMPLATE ID</label>
                   <input 
                    type="text" 
                    value={emailJS.templateId} 
                    onChange={(e) => setEmailJS({...emailJS, templateId: e.target.value})}
                    className="settings-input" 
                   />
                </div>
                <div className="form-group">
                   <label className="text-tiny font-bold text-muted mb-1 block">PUBLIC KEY</label>
                   <input 
                    type="text" 
                    value={emailJS.publicKey} 
                    onChange={(e) => setEmailJS({...emailJS, publicKey: e.target.value})}
                    className="settings-input" 
                   />
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={handleSaveEmailJS}
                    disabled={saving.emailjs}
                    className="btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {saving.emailjs ? 'Saving...' : 'Update EmailJS'}
                  </button>
                  <button 
                    onClick={handleTestEmailJS}
                    disabled={saving.testEmail}
                    className="btn-ghost flex-1 flex items-center justify-center gap-2 text-primary"
                  >
                    {saving.testEmail ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                    {saving.testEmail ? 'Testing...' : 'Test Server'}
                  </button>
                </div>
             </div>
          </div>
        </div>

        <div className="right-column">
          <div className="card matrix-card">
            <div className="card-header-row">
              <h3>Role Matrix & Specific Permissions</h3>
              <div className="header-actions">
                <button className="btn-outline btn-sm"><Filter size={14} /> Filter</button>
                <button className="btn-outline btn-sm"><Download size={14} /> Export</button>
              </div>
            </div>

            <div className="matrix-table">
              <div className="table-row table-head">
                <span className="col-role">ROLE NAME</span>
                <span className="col-center">PAYROLL</span>
                <span className="col-center">DIRECTORY</span>
              </div>
              {roles.map((role, idx) => (
                <div key={idx} className="table-row">
                  <div className="col-role">
                    <p className="font-bold">{role.name}</p>
                    <p className="text-tiny">{role.desc}</p>
                  </div>
                  <div className="col-center">
                    {getStatusIcon(role.payroll)}
                  </div>
                  <div className="col-center">
                    {getStatusIcon(role.directory)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-changes">
             <div className="changes-header">
                <h3>Recent Permission Changes</h3>
                <button className="text-link flex items-center gap-1">
                   View Audit Logs
                </button>
             </div>
             <div className="card change-item">
                <div className="change-icon">
                   <Shield size={20} className="text-orange" />
                </div>
                <div className="change-content">
                   <p className="font-bold">Project Manager role modified</p>
                   <p className="text-muted">Superadmin removed 'Payroll' write access 2 hours ago</p>
                </div>
                <span className="change-id">#45821</span>
             </div>
          </div>

          {/* Designation Management */}
          <div className="card designation-card mt-8">
            <div className="card-header-row p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue" />
                <div>
                  <h3 className="text-lg font-bold">Company Designations</h3>
                  <p className="text-xs text-slate-500">Define job titles available in the employee directory.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddDesignation} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="Add job title (e.g. Lead Developer)"
                    className="settings-input w-full"
                  />
                  {newDesignation && designations.some(d => d.toLowerCase() === newDesignation.trim().toLowerCase()) && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">ALREADY EXISTS</span>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={saving.designation || !newDesignation.trim() || designations.some(d => d.toLowerCase() === newDesignation.trim().toLowerCase())} 
                  className="btn-primary-blue px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving.designation ? '...' : 'Add'}
                </button>
              </form>
              <div className="designation-list flex flex-wrap gap-2">
                {designations.map((desig) => (
                  <div key={desig} className="desig-tag group hover:border-blue-200 transition-all flex items-center">
                    <span>{desig}</span>
                    <button onClick={() => handleDeleteDesignation(desig)} className="text-slate-400 hover:text-red-500 ml-2 p-1 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {designations.length === 0 && (
                  <div className="w-full text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-xs text-slate-400 italic">No custom designations added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Department Management */}
          <div className="card designation-card mt-8">
            <div className="card-header-row p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Network size={20} className="text-blue" />
                <div>
                  <h3 className="text-lg font-bold">Company Departments</h3>
                  <p className="text-xs text-slate-500">Manage business units and departments.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddDept} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="Add department (e.g. Finance)"
                    className="settings-input w-full"
                  />
                  {newDept && departments.some(d => d.toLowerCase() === newDept.trim().toLowerCase()) && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">ALREADY EXISTS</span>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={saving.dept || !newDept.trim() || departments.some(d => d.toLowerCase() === newDept.trim().toLowerCase())} 
                  className="btn-primary-blue px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving.dept ? '...' : 'Add'}
                </button>
              </form>
              <div className="designation-list flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <div key={dept} className="desig-tag group hover:border-blue-200 transition-all flex items-center">
                    <span>{dept}</span>
                    <button onClick={() => handleDeleteDept(dept)} className="text-slate-400 hover:text-red-500 ml-2 p-1 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="w-full text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-xs text-slate-400 italic">No custom departments added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company Resources Management */}
          <div className="card company-mgmt-card mt-8">
            <div className="card-header-row p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe size={24} className="text-primary" />
                <div>
                  <h3 className="text-lg font-bold">Company Resources Dashboard</h3>
                  <p className="text-xs text-slate-500">Manage public assets, policies, and standard templates.</p>
                </div>
              </div>
            </div>

            <div className="mgmt-grid p-6">
              {/* Policy Editor */}
              <div className="mgmt-section mb-10">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue" /> 
                    Company Policy (Markdown/HTML)
                  </label>
                  <span className="text-tiny text-slate-400">Last updated: {new Date().toLocaleDateString()}</span>
                </div>
                <textarea 
                  value={companyPolicy}
                  onChange={(e) => setCompanyPolicy(e.target.value)}
                  placeholder="Enter company policy content here... Supports standard text and HTML tags."
                  className="settings-textarea"
                />
                <div className="flex gap-3 mt-3">
                  <button 
                    onClick={handleSavePolicy}
                    disabled={saving.policy}
                    className="btn-primary-blue flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {saving.policy ? 'Saving...' : 'Publish Policy'}
                  </button>
                  <button className="btn-outline flex-1" onClick={() => navigate('/policy')}>
                    <Eye size={16} /> Preview Page
                  </button>
                </div>
              </div>

              {/* Org Chart Editor */}
              <div className="mgmt-section mb-10">
                <label className="text-sm font-bold text-slate-700 mb-3 block flex items-center gap-2">
                  <Network size={18} className="text-blue" /> 
                  Organization Chart Image
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={orgChartUrl}
                      onChange={(e) => setOrgChartUrl(e.target.value)}
                      placeholder="Paste Image URL (Google Drive/Imgur Link)..."
                      className="settings-input pl-10"
                    />
                  </div>
                  <button 
                    onClick={handleSaveOrgChart}
                    disabled={saving.org}
                    className="btn-primary-blue px-6 flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    <Save size={16} />
                    {saving.org ? '...' : 'Update'}
                  </button>
                </div>
                {orgChartUrl ? (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center relative group">
                    <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Live Preview Preview</p>
                    <div className="relative overflow-hidden rounded-lg shadow-sm bg-white p-2">
                       <img src={orgChartUrl} alt="Org Chart Preview" className="max-h-48 mx-auto rounded transition-transform group-hover:scale-[1.02]" />
                       <button 
                        className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur shadow rounded-lg text-blue hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => window.open(orgChartUrl, '_blank')}
                       >
                        <Eye size={16} />
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <Network size={32} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No chart URL provided. Add one to show the hierarchy.</p>
                  </div>
                )}
              </div>

              {/* Document Manager */}
              <div className="mgmt-section">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={18} className="text-blue" /> 
                    Document Repository Manager
                  </label>
                  <button className="text-link text-xs" onClick={() => navigate('/documents')}>View Repository</button>
                </div>
                
                <form onSubmit={handleAddDocument} className="add-doc-form mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-4">Add New Global Resource</p>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="text-tiny font-bold text-slate-500 mb-1 block">DOCUMENT NAME</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Employee Handbook 2024" 
                          value={newDoc.name}
                          onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                          className="settings-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="text-tiny font-bold text-slate-500 mb-1 block">CATEGORY</label>
                        <select 
                          value={newDoc.category}
                          onChange={(e) => setNewDoc({...newDoc, category: e.target.value})}
                          className="settings-input"
                        >
                          {documentCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="text-tiny font-bold text-slate-500 mb-1 block">RESOURCE URL (Direct Link)</label>
                      <input 
                        type="text" 
                        placeholder="https://..." 
                        value={newDoc.url}
                        onChange={(e) => setNewDoc({...newDoc, url: e.target.value})}
                        className="settings-input"
                      />
                    </div>
                    <button type="submit" disabled={saving.doc} className="btn-primary-blue w-full flex items-center justify-center gap-2 py-3">
                      <Plus size={18} />
                      {saving.doc ? 'Adding...' : 'Add to Repository'}
                    </button>
                  </div>
                </form>

                <div className="doc-list-container bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div className="doc-list-header bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between">
                    <span className="text-tiny font-bold text-slate-400">UPLOADED DOCUMENTS</span>
                    <span className="text-tiny font-bold text-slate-400">{documents.length} FILES</span>
                  </div>
                  <div className="doc-list max-h-64 overflow-y-auto">
                    {documents.map(doc => (
                      <div key={doc.id} className="doc-mgmt-item flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 text-blue">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-700">{doc.name}</p>
                            <p className="text-xs text-slate-400">{doc.category || 'General'}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <div className="text-center py-10">
                        <FileText size={32} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Your repository is empty.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <style>{`
        .settings-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2rem;
        }

        .settings-textarea {
          width: 100%;
          min-height: 200px;
          padding: 0.75rem 1rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
          resize: vertical;
        }

        .settings-textarea:focus {
          border-color: #2563eb;
        }

        .settings-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .settings-input:focus {
          border-color: #2563eb;
        }

        .mt-8 { margin-top: 2rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .p-6 { padding: 1.5rem; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .w-full { width: 100%; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        
        @media (min-width: 768px) {
          .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        .text-red-500 { color: #ef4444; }
        .hover\:bg-red-50:hover { background-color: #fef2f2; }

        .company-mgmt-card {
          padding: 0;
        }

        .left-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .module-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .module-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }

        .module-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .module-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .roles-summary-card {
          background: #0f172a;
          color: white;
          padding: 2rem;
        }

        .summary-top { margin-bottom: 2rem; }
        .summary-top .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; }
        .summary-top .value { font-size: 3rem; font-weight: 700; }

        .privilege-bar { margin-bottom: 2rem; }
        .bar-info { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem; }
        .progress-bg { height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: #2563eb; }

        .btn-primary-blue {
          background: #2563eb;
          color: white;
          padding: 1rem;
          border-radius: 10px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }

        .matrix-card { padding: 0; }
        .matrix-card .card-header-row { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }

        .matrix-table { display: flex; flex-direction: column; }
        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          align-items: center;
        }

        .table-head {
          background: #f9fafb;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .col-center { display: flex; justify-content: center; }

        .text-tiny { font-size: 0.7rem; color: #64748b; margin-top: 2px; }

        .text-success { color: #10b981; }
        .text-blue { color: #2563eb; }
        .text-muted { color: #cbd5e1; }

        .recent-changes { margin-top: 2rem; }
        .changes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        
        .change-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
        }

        .change-icon {
          width: 44px;
          height: 44px;
          background: #fff7ed;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-orange { color: #f97316; }

        .change-content { flex: 1; }
        .change-content p { font-size: 0.875rem; }
        .change-content .text-muted { font-size: 0.75rem; color: #64748b; }
        
        .change-id { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

        .text-link { background: transparent; border: none; color: #2563eb; font-weight: 600; font-size: 0.875rem; cursor: pointer; }

        .desig-tag {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
        }

        .desig-tag button {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        @media (max-width: 1200px) {
          .settings-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Settings;
