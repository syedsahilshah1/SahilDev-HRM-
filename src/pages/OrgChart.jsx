import React, { useState, useEffect } from 'react';
import { Network, Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const OrgChart = () => {
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'org_chart'), (doc) => {
      if (doc.exists()) {
        setChart(doc.data().imageUrl);
      } else {
        setChart(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load organization chart.');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p>Loading Organization Chart...</p>
      </div>
    );
  }

  return (
    <div className="org-chart-page">
      <header className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <Network size={32} />
          </div>
          <div>
            <h1>Organization Chart</h1>
            <p>Visual hierarchy of SahilDev HRM structure.</p>
          </div>
        </div>
        
        {chart && (
          <div className="header-actions">
            <button onClick={handleZoomOut} className="btn-icon" title="Zoom Out"><ZoomOut size={20} /></button>
            <button onClick={handleReset} className="btn-icon" title="Reset"><Maximize size={20} /></button>
            <button onClick={handleZoomIn} className="btn-icon" title="Zoom In"><ZoomIn size={20} /></button>
          </div>
        )}
      </header>

      <div className="card chart-card">
        {error ? (
          <div className="error-state">
            <AlertCircle size={40} />
            <p>{error}</p>
          </div>
        ) : !chart ? (
          <div className="empty-state">
            <Network size={64} className="text-muted" />
            <h3>No Chart Available</h3>
            <p>The organization chart hasn't been uploaded yet by the admin.</p>
          </div>
        ) : (
          <div className="chart-viewer">
            <div 
              className="chart-container"
              style={{ transform: `scale(${zoom})` }}
            >
              <img src={chart} alt="Organization Chart" className="org-image" />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .org-chart-page {
          height: calc(100vh - 150px);
          display: flex;
          flex-direction: column;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
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

        .header-actions {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f1f5f9;
          color: #2563eb;
        }

        .chart-card {
          flex: 1;
          padding: 0;
          overflow: hidden;
          position: relative;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-viewer {
          width: 100%;
          height: 100%;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
        }

        .chart-viewer:active {
          cursor: grabbing;
        }

        .chart-container {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center center;
        }

        .org-image {
          max-width: 100%;
          height: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }

        .empty-state, .error-state {
          text-align: center;
          color: #64748b;
        }

        .empty-state h3 {
          color: #0f172a;
          margin: 1rem 0 0.5rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default OrgChart;
