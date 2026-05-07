import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, File, Loader2, ExternalLink, Calendar, User } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocuments(docs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredDocs = documents.filter(doc => 
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1>Document Repository</h1>
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
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-download">
                  <Download size={18} />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
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
