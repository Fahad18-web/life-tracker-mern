import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';

export default function NotificationBanner() {
  const { showBanner, dismiss } = useNotification();
  const navigate = useNavigate();

  if (!showBanner) return null;

  return (
    <>
      <style>{`
        .notif-banner {
          position: sticky;
          top: 60px;          /* sits just below the header */
          z-index: 90;
          background: linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08));
          border-bottom: 1px solid rgba(99,102,241,0.25);
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          animation: slideDown 0.3s ease;
          transition: background-color 0.25s ease;
        }
        [data-theme="light"] .notif-banner {
          background: linear-gradient(90deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05));
          border-bottom-color: rgba(99,102,241,0.2);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .notif-banner-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .notif-icon { font-size: 18px; flex-shrink: 0; }
        .notif-text {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
          line-height: 1.4;
        }
        .notif-text span { color: var(--text-secondary); font-weight: 400; }
        .notif-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .notif-btn-log {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font);
          transition: background 0.15s;
          white-space: nowrap;
        }
        .notif-btn-log:hover { background: var(--accent-hover); }
        .notif-btn-dismiss {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          line-height: 1;
          transition: color 0.15s;
        }
        .notif-btn-dismiss:hover { color: var(--text-secondary); }
        @media (max-width: 480px) {
          .notif-text span { display: none; }
        }
      `}</style>

      <div className="notif-banner" role="alert" aria-live="polite">
        <div className="notif-banner-left">
          <span className="notif-icon">🔔</span>
          <p className="notif-text">
            You haven't logged today yet!{' '}
            <span>Keep your streak alive — it only takes a minute.</span>
          </p>
        </div>
        <div className="notif-actions">
          <button className="notif-btn-log" onClick={() => navigate('/log')}>
            Log Now
          </button>
          <button className="notif-btn-dismiss" onClick={dismiss} title="Dismiss for today" aria-label="Dismiss">
            ×
          </button>
        </div>
      </div>
    </>
  );
}