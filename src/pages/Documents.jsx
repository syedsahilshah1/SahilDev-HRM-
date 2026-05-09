import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, File, Loader2, ExternalLink, Calendar, User, AlertCircle, X, Copy, Check, Eye, Mail, Users, AlertTriangle, CreditCard, ClipboardList, ShieldCheck, Award } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { templatesContent } from '../data/templatesContent';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('repository');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Send Feature State
  const [showSendModal, setShowSendModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [placeholders, setPlaceholders] = useState({});
  const [sending, setSending] = useState(false);
  const { isSuperAdmin, userData } = useAuth();

  const templates = [
    {
      category: '📄 Employment / HR',
      icon: <Users size={20} />,
      items: [
        'Offer Letter', 'Appointment Letter', 'Employment Contract', 'Internship Offer Letter',
        'Internship Completion Certificate', 'Experience Letter (Work Letter)', 'Employment Certificate',
        'Salary Certificate', 'Relieving Letter', 'Promotion Letter', 'Transfer Letter',
        'Resignation Letter', 'Acceptance of Resignation Letter', 'Probation Completion Letter',
        'Exit Interview Form', 'Employee Referral Bonus Policy'
      ]
    },
    {
      category: '⚠️ Disciplinary',
      icon: <AlertTriangle size={20} />,
      items: [
        'Warning Letter', 'Final Warning Letter', 'Show Cause Notice', 'Suspension Letter', 'Termination Letter', 'Performance Improvement Plan (PIP)', 'Incident Report Form'
      ]
    },
    {
      category: '💰 Payroll / Finance',
      icon: <CreditCard size={20} />,
      items: [
        'Salary Slip', 'Invoice', 'Payment Receipt', 'Final Settlement Letter'
      ]
    },
    {
      category: '📊 Daily / Internal',
      icon: <ClipboardList size={20} />,
      items: [
        'Daily Work Report', 'Timesheet', 'Leave Application', 'Leave Approval Letter', 'Equipment Handover Letter', 'Code Review Feedback', 'Project Handover Document'
      ]
    },
    {
      category: '🔐 Legal',
      icon: <ShieldCheck size={20} />,
      items: [
        'Non-Disclosure Agreement (NDA)', 'Service Agreement', 'Employee Agreement', 'Software Developer Agreement', 'Remote Work Policy', 'Data Security & Privacy Acknowledgement'
      ]
    },
    {
      category: '📜 Certificates',
      icon: <Award size={20} />,
      items: [
        'Appreciation Certificate', 'Achievement Certificate', 'Training Certificate'
      ]
    }
  ];

  useEffect(() => {
    setLoading(true);
    // 1. Fetch Company-wide Repository Documents
    const qDocs = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    
    const unsubDocs = onSnapshot(qDocs, 
      (snapshot) => {
        const companyDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isPersonal: false
        }));

        // 2. Fetch Personal Documents if the user is an employee
        if (!isSuperAdmin && userData?.uid) {
          const qPersonal = query(
            collection(db, 'employee_documents'), 
            where('employeeId', '==', userData.uid),
            orderBy('createdAt', 'desc')
          );

          onSnapshot(qPersonal, 
            (personalSnapshot) => {
              const personalDocs = personalSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                name: doc.data().templateName || 'Personal Document',
                isPersonal: true
              }));
              
              // Combine both company docs and personal docs
              setDocuments([...companyDocs, ...personalDocs]);
              setLoading(false);
            },
            (err) => {
              console.error("Error fetching personal documents:", err);
              setDocuments(companyDocs);
              setLoading(false);
            }
          );
        } else {
          setDocuments(companyDocs);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching repository documents:", err);
        setLoading(false);
      }
    );

    return () => unsubDocs();
  }, [isSuperAdmin, userData?.uid]);

  useEffect(() => {
    if (showSendModal) {
      const fetchEmployees = async () => {
        const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
        const querySnapshot = await getDocs(q);
        setEmployees(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchEmployees();
    }
  }, [showSendModal]);

  const extractPlaceholders = (text) => {
    const regex = /\[(.*?)\]/g;
    const matches = [...text.matchAll(regex)];
    return [...new Set(matches.map(m => m[1]))];
  };

  const handleOpenSendModal = () => {
    const templateText = templatesContent[selectedTemplate] || '';
    const foundPlaceholders = extractPlaceholders(templateText);
    const initialPlaceholders = {};
    foundPlaceholders.forEach(p => {
      initialPlaceholders[p] = '';
    });
    setPlaceholders(initialPlaceholders);
    setShowSendModal(true);
  };

  const getFinalContent = () => {
    let text = templatesContent[selectedTemplate] || '';
    Object.entries(placeholders).forEach(([key, value]) => {
      text = text.replace(`[${key}]`, value || `[${key}]`);
    });
    return text;
  };

  const handleSendToEmployee = async () => {
    if (!selectedEmployee) return alert('Please select an employee');
    
    setSending(true);
    try {
      const finalContent = getFinalContent();
      const employee = employees.find(e => e.id === selectedEmployee);
      
      await addDoc(collection(db, 'employee_documents'), {
        employeeId: selectedEmployee,
        employeeName: employee?.fullName || 'Unknown',
        templateName: selectedTemplate,
        content: finalContent,
        status: 'Sent',
        sentBy: userData?.fullName || 'HR Admin',
        createdAt: serverTimestamp(),
      });

      // SMTP Simulation
      console.log(`[SMTP SIMULATION] Sending email to ${employee?.email}...`);
      console.log(`Subject: ${selectedTemplate}`);
      console.log(`Content Preview: ${finalContent.substring(0, 100)}...`);

      alert(`Successfully sent "${selectedTemplate}" to ${employee?.fullName}. It will now appear in their profile.`);
      setShowSendModal(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error(err);
      alert('Failed to send document');
    }
    setSending(false);
  };

  const filteredDocs = documents.filter(doc => 
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadDocument = async (doc) => {
    if (!doc) return;
    
    // Case 1: Hosted file (PDF/Image/Doc)
    if (doc.fileUrl) {
      try {
        const response = await fetch(doc.fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const element = document.createElement("a");
        element.href = url;
        element.download = doc.name || "document";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download failed, opening in new tab:", err);
        window.open(doc.fileUrl, '_blank');
      }
      return;
    }

    // Case 2: Generated document (text content)
    if (doc.content) {
      const element = document.createElement("a");
      const file = new Blob([doc.content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${(doc.name || doc.templateName || 'Document').replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleDownloadTemplate = (name) => {
    const content = templatesContent[name] || "Template content not found.";
    handleDownloadDocument({ name, content });
  };

  const handleCopyTemplate = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p>Loading Documents...</p>
      </div>
    );
  }

  return (
    <div className="documents-page">
      <header className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <FileText size={32} />
          </div>
          <div>
            <h1>Document Management</h1>
            <p>Access company forms, templates, and important files.</p>
          </div>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'repository' ? 'active' : ''}`}
          onClick={() => setActiveTab('repository')}
        >
          Repository
        </button>
        {isSuperAdmin && (
          <button 
            className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Standard Templates
          </button>
        )}
      </div>

      {activeTab === 'repository' ? (
        <div className="documents-grid">
          {filteredDocs.length === 0 ? (
            <div className="card empty-card">
              <File size={48} className="text-muted mb-4" />
              <h3>No documents found</h3>
              <p>Try a different search term or check back later.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="card doc-card">
                <div className="doc-icon">
                  <FileText size={24} />
                </div>
                <div className="doc-info">
                  <h3>{doc.name}</h3>
                  <span className="doc-category">{doc.category || 'General'}</span>
                  <div className="doc-meta">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>{doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                    </div>
                    <div className="meta-item">
                      <User size={14} />
                      <span>{doc.uploadedBy || 'Admin'}</span>
                    </div>
                  </div>
                </div>
                <div className="doc-actions">
                  <button 
                    onClick={() => doc.fileUrl ? window.open(doc.fileUrl, '_blank') : setPreviewDoc(doc)} 
                    className="btn-preview"
                  >
                    <Eye size={18} />
                    <span>Preview</span>
                  </button>
                  <button 
                    onClick={() => handleDownloadDocument(doc)} 
                    className="btn-download"
                  >
                    <Download size={18} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="templates-container">
          {templates.map((cat, idx) => {
            const filteredItems = cat.items.filter(item => 
              item.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (searchTerm && filteredItems.length === 0) return null;

            return (
              <div key={idx} className="template-category-card card">
                <div className="category-header">
                  <div className="category-icon">{cat.icon}</div>
                  <h3>{cat.category}</h3>
                </div>
                <div className="template-list">
                  {filteredItems.map((item, i) => (
                    <div key={i} className="template-item">
                      <span className="template-name">{item}</span>
                      <div className="template-item-actions">
                        <button 
                          className="btn-icon-sm btn-preview-sm" 
                          onClick={() => setSelectedTemplate(item)}
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn-icon-sm btn-download-sm" 
                          onClick={() => handleDownloadTemplate(item)}
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {searchTerm && templates.every(cat => !cat.items.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))) && (
            <div className="card empty-card w-full col-span-full py-12">
              <Search size={48} className="text-muted mb-4 mx-auto" />
              <h3>No templates match your search</h3>
              <p>Try searching for keywords like "Offer", "Contract", or "Salary".</p>
            </div>
          )}
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="modal-overlay" onClick={() => setSelectedTemplate(null)}>
          <div className="modal-content card shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedTemplate}</h2>
                <p className="text-xs text-muted uppercase font-bold tracking-wider">Standard Company Template</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedTemplate(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="template-preview-box">
                <pre>{templatesContent[selectedTemplate]}</pre>
              </div>
              <div className="placeholder-info">
                <AlertCircle size={14} />
                <span>Replace text in <strong>[brackets]</strong> with actual details.</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => handleCopyTemplate(templatesContent[selectedTemplate])}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              {isSuperAdmin && (
                <button className="btn-success flex-1 flex items-center justify-center gap-2" onClick={handleOpenSendModal}>
                  <Mail size={18} />
                  Send to Employee
                </button>
              )}
              <button className="btn-primary-blue flex-1 flex items-center justify-center gap-2" onClick={() => handleDownloadTemplate(selectedTemplate)}>
                <Download size={18} />
                Download .txt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal-content card shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{previewDoc.name || previewDoc.templateName}</h2>
                <p className="text-xs text-muted uppercase font-bold tracking-wider">
                  {previewDoc.isPersonal ? `Personal Document for ${previewDoc.employeeName}` : 'Company Document'}
                </p>
              </div>
              <button className="close-btn" onClick={() => setPreviewDoc(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="template-preview-box">
                <pre>{previewDoc.content}</pre>
              </div>
              <div className="placeholder-info">
                <Calendar size={14} />
                <span>Sent on: {previewDoc.createdAt?.toDate ? previewDoc.createdAt.toDate().toLocaleString() : 'Recently'}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary flex-1" onClick={() => setPreviewDoc(null)}>Close</button>
              <button className="btn-primary-blue flex-1 flex items-center justify-center gap-2" onClick={() => handleDownloadDocument(previewDoc)}>
                <Download size={18} />
                Download .txt
              </button>
            </div>
          </div>
        </div>
      )}
      {showSendModal && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="modal-content card shadow-xl max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Finalize & Send: {selectedTemplate}</h2>
                <p className="text-xs text-muted">Fill in the details to customize the document for the employee.</p>
              </div>
              <button className="close-btn" onClick={() => setShowSendModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="send-form-left flex flex-col gap-4">
                  <div className="form-group">
                    <label className="text-xs font-bold text-slate-500 mb-2 block">SELECT RECIPIENT</label>
                    <select 
                      className="modal-input"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.dept || 'Staff'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="placeholders-inputs">
                    <label className="text-xs font-bold text-slate-500 mb-3 block">DOCUMENT DETAILS</label>
                    <div className="flex flex-col gap-3">
                      {Object.keys(placeholders).map(key => (
                        <div key={key} className="form-group">
                          <label className="text-tiny font-bold text-slate-400 mb-1 block uppercase">{key}</label>
                          <input 
                            type="text"
                            placeholder={`Enter ${key}...`}
                            className="modal-input-small"
                            value={placeholders[key]}
                            onChange={(e) => setPlaceholders({...placeholders, [key]: e.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="send-preview-right">
                  <label className="text-xs font-bold text-slate-500 mb-2 block">LIVE PREVIEW</label>
                  <div className="final-preview-box">
                    <pre>{getFinalContent()}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSendModal(false)}>Cancel</button>
              <button 
                className="btn-primary-blue flex-1 flex items-center justify-center gap-2" 
                onClick={handleSendToEmployee}
                disabled={sending || !selectedEmployee}
              >
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                {sending ? 'Sending...' : 'Send via Email & Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}


      <style>{`
        .tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .tab-btn.active {
          color: #2563eb;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -0.5rem;
          left: 0;
          right: 0;
          height: 2px;
          background: #2563eb;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }

        .modal-content {
          width: 100%;
          max-width: 600px;
          max-height: 85vh;
          background: white;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalIn 0.3s ease-out;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .close-btn {
          background: #f1f5f9;
          border: none;
          color: #64748b;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .template-preview-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          font-family: 'Courier New', Courier, monospace;
          white-space: pre-wrap;
          font-size: 0.9rem;
          color: #334155;
          line-height: 1.6;
        }

        .template-preview-box pre {
          margin: 0;
          white-space: pre-wrap;
        }

        .placeholder-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 10px;
          font-size: 0.8rem;
        }

        .placeholder-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 10px;
          font-size: 0.8rem;
          margin-top: 1rem;
        }

        .doc-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .btn-preview {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 0.75rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-preview:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .btn-download {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-download:hover {
          background: #1d4ed8;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 1rem;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .btn-primary-blue {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary-blue:hover {
          background: #1d4ed8;
        }

        .btn-success {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-success:hover {
          background: #059669;
        }

        .max-w-2xl { max-width: 800px; }

        .modal-input-small {
          width: 100%;
          padding: 0.6rem 0.8rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .final-preview-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          height: 350px;
          overflow-y: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.75rem;
          line-height: 1.4;
          color: #334155;
        }

        .shadow-xl {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .templates-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .template-category-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .category-icon {
          width: 40px;
          height: 40px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .template-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .template-item:hover {
          background: #f1f5f9;
          border-color: #e2e8f0;
          transform: translateX(4px);
        }

        .template-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 1rem;
        }

        .template-item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon-sm {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-preview-sm {
          background: #f1f5f9;
          color: #64748b;
        }

        .btn-preview-sm:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .btn-download-sm {
          background: #eff6ff;
          color: #2563eb;
        }

        .btn-download-sm:hover {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .documents-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: #f1f5f9;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }

        .search-box {
          position: relative;
          width: 300px;
        }

        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }

        .search-box input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .search-box :global(svg) {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .doc-card {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .doc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .doc-icon {
          width: 48px;
          height: 48px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doc-info h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .doc-category {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 99px;
          margin-bottom: 1rem;
        }

        .doc-meta {
          display: flex;
          gap: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .doc-actions {
          margin-top: auto;
          padding-top: 1.25rem;
          border-top: 1px solid #f1f5f9;
        }

        .btn-download {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 10px;
          transition: background 0.2s;
        }

        .btn-download:hover {
          background: #1d4ed8;
        }

        .empty-card {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem;
          background: #f8fafc;
          border: 2px dashed #e2e8f0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
          .search-box {
            width: 100%;
          }
        }

      `}</style>
    </div>
  );
};

export default Documents;
