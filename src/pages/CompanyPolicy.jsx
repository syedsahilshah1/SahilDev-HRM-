import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const CompanyPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'company_policy'), (doc) => {
      if (doc.exists()) {
        setPolicy(doc.data().content);
      } else {
        setPolicy('No company policy has been set yet.');
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load company policy.');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p>Loading Policy...</p>
      </div>
    );
  }

  return (
    <div className="policy-page">
      <header className="page-header">
        <div className="header-icon">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1>Company Policy & Guidelines</h1>
          <p>Important rules and regulations for all employees.</p>
        </div>
      </header>

      <div className="card policy-card">
        {error ? (
          <div className="error-state">
            <AlertCircle size={40} />
            <p>{error}</p>
          </div>
        ) : (
          <div className="policy-content" dangerouslySetInnerHTML={{ __html: policy }} />
        )}
      </div>

      <style>{`
        .policy-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
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

        .policy-card {
          padding: 3rem;
          line-height: 1.8;
          color: #334155;
          font-size: 1.1rem;
        }

        .policy-content {
          white-space: pre-wrap;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          gap: 1rem;
        }

        .error-state {
          text-align: center;
          padding: 3rem;
          color: #ef4444;
        }

        @media (max-width: 768px) {
          .policy-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyPolicy;
