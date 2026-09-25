import { useState, useEffect } from 'react';
import { useNavigate }   from 'react-router-dom';
import toast             from 'react-hot-toast';
import { useAuth }       from '../contexts/AuthContext';
import { fetchProfile, updateProfile, changePassword, deleteAccount } from '../api/userAPI';

const GRADE_COLORS = { A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Profile() {
  const { user: authUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [stats,   setStats]     = useState(null);
  const [loading, setLoading]   = useState(true);

  // Edit profile form
  const [editForm,    setEditForm]    = useState({ name: '', email: '' });
  const [editSaving,  setEditSaving]  = useState(false);

  // Password form
  const [passForm,    setPassForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passSaving,  setPassSaving]  = useState(false);
  const [passVisible, setPassVisible] = useState({ current: false, new: false, confirm: false });

  // Delete account
  const [deletePass,     setDeletePass]     = useState('');
  const [deleteConfirm,  setDeleteConfirm]  = useState(false);
  const [deleteLoading,  setDeleteLoading]  = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchProfile();
        setProfile(res.data.user);
        setStats(res.data.stats);
        setEditForm({ name: res.data.user.name, email: res.data.user.email });
      } catch { toast.error('Could not load profile.'); }
      finally  { setLoading(false); }
    };
    load();
  }, []);

  // ── Edit profile ──────────────────────────────────────────────
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return toast.error('Name cannot be empty.');
    setEditSaving(true);
    try {
      const res = await updateProfile(editForm);
      setProfile(res.data.user);
      if (updateUser) updateUser(res.data.user);   // update AuthContext if available
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed.');
    } finally { setEditSaving(false); }
  };

  // ── Change password ───────────────────────────────────────────
  const handlePassSave = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword)
      return toast.error('New passwords do not match.');
    if (passForm.newPassword.length < 6)
      return toast.error('Password must be at least 6 characters.');
    setPassSaving(true);
    try {
      await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Password change failed.');
    } finally { setPassSaving(false); }
  };

  // ── Delete account ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletePass) return toast.error('Enter your password to confirm.');
    setDeleteLoading(true);
    try {
      await deleteAccount({ password: deletePass });
      toast.success('Account deleted. Goodbye!');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Deletion failed.');
    } finally { setDeleteLoading(false); }
  };

  if (loading) return <div className="page-loader">Loading profile…</div>;

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const topGrade = stats?.gradeCounts
    ? Object.entries(stats.gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] : null;

  return (
    <>
      <style>{`
        .prof-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .prof-card  {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 28px;
          display: flex; flex-direction: column; gap: 20px;
          transition: background-color .25s ease;
        }
        .prof-card h2 { font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }

        /* Avatar row */
        .prof-avatar-row { display: flex; align-items: center; gap: 16px; }
        .prof-avatar {
          width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-glow); border: 2px solid var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 800; color: var(--accent);
        }
        .prof-meta { display: flex; flex-direction: column; gap: 4px; }
        .prof-meta-name  { font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: -.01em; }
        .prof-meta-email { font-size: 13px; color: var(--text-secondary); }
        .prof-meta-since { font-size: 11px; color: var(--text-muted); }

        /* Form */
        .prof-form { display: flex; flex-direction: column; gap: 14px; }

        /* Password field with toggle */
        .pass-wrap { position: relative; }
        .pass-wrap input { padding-right: 44px; }
        .pass-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; font-size: 14px; padding: 4px; line-height: 1;
          transition: color .15s;
        }
        .pass-eye:hover { color: var(--text-primary); }

        /* Pass strength bar */
        .pass-strength { height: 3px; border-radius: 2px; margin-top: 4px; transition: all .3s; }

        /* Danger zone */
        .danger-card {
          background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2);
          border-radius: var(--radius-lg); padding: 28px;
          display: flex; flex-direction: column; gap: 16px;
          transition: background-color .25s ease;
        }
        .danger-card h2 { font-size: 16px; font-weight: 700; color: var(--danger); display: flex; align-items: center; gap: 8px; }
        .danger-desc  { font-size: 13px; color: var(--text-secondary); line-height: 1.65; }
        .danger-confirm-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .danger-confirm-row input { flex: 1; min-width: 180px; }
        .btn-danger {
          background: var(--danger); color: #fff; border: none;
          padding: 9px 18px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: var(--font); transition: all .2s;
          flex-shrink: 0;
        }
        .btn-danger:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); }
        .btn-danger:disabled { opacity: .5; cursor: not-allowed; }

        /* Grade distribution */
        .grade-dist { display: flex; gap: 8px; flex-wrap: wrap; }
        .grade-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 999px;
          font-size: 12px; font-weight: 600; border: 1px solid transparent;
        }
        .grade-pill-count { font-size: 11px; opacity: .8; }

        @media (max-width: 768px) {
          .prof-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <main className="page">
        <div className="page-header">
          <h1>👤 My Profile</h1>
          <p className="text-muted">Manage your account and view your progress stats.</p>
        </div>

        {/* ── Account Overview ── */}
        <div className="prof-card">
          <div className="prof-avatar-row">
            <div className="prof-avatar">{profile?.name?.charAt(0).toUpperCase()}</div>
            <div className="prof-meta">
              <span className="prof-meta-name">{profile?.name}</span>
              <span className="prof-meta-email">{profile?.email}</span>
              <span className="prof-meta-since">Member since {joinedDate}</span>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div className="section">
            <div className="section-title">📊 Account Stats</div>
            <div className="stat-grid">
              <StatCard label="Total Entries"   value={stats.totalEntries}  sub="days logged" />
              <StatCard label="Average Score"   value={stats.avgScore}      sub="out of 100" color={stats.avgScore >= 70 ? 'var(--success)' : stats.avgScore >= 50 ? 'var(--warning)' : 'var(--danger)'} />
              <StatCard label="Current Streak"  value={stats.overallStreak} sub="consecutive days" color="var(--accent)" />
              <StatCard label="Best Score Ever" value={stats.bestScore}     sub={stats.bestDate ? new Date(stats.bestDate + 'T12:00:00').toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : ''} color="var(--success)" />
            </div>

            {/* Grade distribution */}
            {stats.gradeCounts && Object.keys(stats.gradeCounts).length > 0 && (
              <div className="prof-card" style={{ gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Grade Distribution</div>
                <div className="grade-dist">
                  {['A','B','C','D','F'].map(g => stats.gradeCounts[g] ? (
                    <div key={g} className="grade-pill"
                      style={{ background: `${GRADE_COLORS[g]}15`, borderColor: `${GRADE_COLORS[g]}40`, color: GRADE_COLORS[g] }}>
                      <span>{g}</span>
                      <span className="grade-pill-count">× {stats.gradeCounts[g]}</span>
                    </div>
                  ) : null)}
                </div>
                {stats.customHabitsCount > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ⭐ {stats.customHabitsCount} custom habit{stats.customHabitsCount !== 1 ? 's' : ''} active
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Edit + Password side by side ── */}
        <div className="prof-grid">

          {/* Edit Profile */}
          <div className="prof-card">
            <h2>✏️ Edit Profile</h2>
            <form className="prof-form" onSubmit={handleEditSave}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name" maxLength={60} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="prof-card">
            <h2>🔒 Change Password</h2>
            <form className="prof-form" onSubmit={handlePassSave}>
              {[
                { key: 'currentPassword', label: 'Current Password', vis: 'current' },
                { key: 'newPassword',     label: 'New Password',     vis: 'new'     },
                { key: 'confirmPassword', label: 'Confirm New Password', vis: 'confirm' },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}</label>
                  <div className="pass-wrap">
                    <input
                      type={passVisible[f.vis] ? 'text' : 'password'}
                      value={passForm[f.key]}
                      onChange={e => setPassForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" className="pass-eye"
                      onClick={() => setPassVisible(p => ({ ...p, [f.vis]: !p[f.vis] }))}>
                      {passVisible[f.vis] ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {/* Password strength bar for new password */}
                  {f.key === 'newPassword' && passForm.newPassword && (
                    <div className="pass-strength" style={{
                      width: `${Math.min(passForm.newPassword.length / 12 * 100, 100)}%`,
                      background: passForm.newPassword.length < 6 ? 'var(--danger)' : passForm.newPassword.length < 10 ? 'var(--warning)' : 'var(--success)'
                    }} />
                  )}
                </div>
              ))}
              <button type="submit" className="btn btn-primary" disabled={passSaving}>
                {passSaving ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="danger-card">
          <h2>⚠️ Danger Zone</h2>
          <p className="danger-desc">
            Permanently delete your account and <strong>all your data</strong> — entries, custom habits, streaks.
            This action <strong>cannot be undone.</strong>
          </p>

          {!deleteConfirm ? (
            <div>
              <button className="btn-danger" onClick={() => setDeleteConfirm(true)}>
                Delete My Account
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
                Enter your password to confirm permanent deletion:
              </p>
              <div className="danger-confirm-row">
                <input
                  type="password"
                  value={deletePass}
                  onChange={e => setDeletePass(e.target.value)}
                  placeholder="Enter your password"
                />
                <button className="btn-danger" onClick={handleDelete} disabled={deleteLoading || !deletePass}>
                  {deleteLoading ? 'Deleting…' : 'Yes, Delete Everything'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setDeleteConfirm(false); setDeletePass(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </>
  );
}