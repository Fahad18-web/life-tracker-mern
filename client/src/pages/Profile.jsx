import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile, updateProfile, changePassword, deleteAccount } from '../api/userAPI';

const GRADE_COLORS = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444'
};

export default function Profile() {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [editSaving, setEditSaving] = useState(false);

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passSaving, setPassSaving] = useState(false);
  const [passVisible, setPassVisible] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [deletePass, setDeletePass] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchProfile();
        setProfile(res.data.user);
        setStats(res.data.stats);
        setEditForm({ name: res.data.user.name, email: res.data.user.email });
      } catch {
        toast.error('Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return toast.error('Name cannot be empty.');
    setEditSaving(true);
    try {
      const res = await updateProfile(editForm);
      setProfile(res.data.user);
      if (updateUser) updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed.');
    } finally {
      setEditSaving(false);
    }
  };

  const handlePassSave = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    if (passForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    setPassSaving(true);
    try {
      await changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Password change failed.');
    } finally {
      setPassSaving(false);
    }
  };

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
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="page-loader">Loading profile…</div>;

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '—';

  const initials = profile?.name?.charAt(0)?.toUpperCase() || 'U';

  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20';

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
          <User className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Profile</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Manage your account and view progress stats.
        </p>
      </div>

      {/* Avatar card */}
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/15 text-2xl font-bold text-[var(--color-brand-400)]">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--color-text)]">{profile?.name}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{profile?.email}</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Member since {joinedDate}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Account Stats</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Total Entries', value: stats.totalEntries, sub: 'days logged' },
              { label: 'Average Score', value: stats.avgScore, sub: 'out of 100' },
              { label: 'Current Streak', value: stats.overallStreak, sub: 'consecutive days' },
              {
                label: 'Best Score',
                value: stats.bestScore,
                sub: stats.bestDate
                  ? new Date(stats.bestDate + 'T12:00:00').toLocaleDateString('en-PK', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : ''
              }
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
                  {s.value ?? '—'}
                </p>
                {s.sub && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{s.sub}</p>}
              </div>
            ))}
          </div>

          {stats.gradeCounts && Object.keys(stats.gradeCounts).length > 0 && (
            <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
                Grade Distribution
              </p>
              <div className="flex flex-wrap gap-2">
                {['A', 'B', 'C', 'D', 'F'].map(
                  (g) =>
                    stats.gradeCounts[g] && (
                      <span
                        key={g}
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                        style={{
                          color: GRADE_COLORS[g],
                          borderColor: `${GRADE_COLORS[g]}55`,
                          background: `${GRADE_COLORS[g]}18`
                        }}
                      >
                        {g} <span className="opacity-80">× {stats.gradeCounts[g]}</span>
                      </span>
                    )
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Edit profile */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Edit Profile</h2>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
                Full Name
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                required
                maxLength={60}
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
                Email
              </label>
              <input
                id="profile-email"
                name="email"
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={editSaving}
              className="w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Change password */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Lock className="h-4 w-4" /> Change Password
          </h2>
          <form onSubmit={handlePassSave} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password', vis: 'current' },
              { key: 'newPassword', label: 'New Password', vis: 'new' },
              { key: 'confirmPassword', label: 'Confirm New Password', vis: 'confirm' }
            ].map((f) => (
              <div key={f.key}>
                <label
                  htmlFor={`pass-${f.vis}`}
                  className="mb-1.5 block text-sm text-[var(--color-text-secondary)]"
                >
                  {f.label}
                </label>
                <div className="relative">
                  <input
                    id={`pass-${f.vis}`}
                    name={f.key}
                    type={passVisible[f.vis] ? 'text' : 'password'}
                    required
                    value={passForm[f.key]}
                    onChange={(e) => setPassForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className={`${inputClass} pr-11`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPassVisible((p) => ({ ...p, [f.vis]: !p[f.vis] }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    aria-label="Toggle password"
                  >
                    {passVisible[f.vis] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={passSaving}
              className="w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {passSaving ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>

      {/* Danger zone */}
      <section className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-danger)]">
          <Trash2 className="h-4 w-4" /> Danger Zone
        </h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Deleting your account permanently removes all entries, habits, and data. This cannot be undone.
        </p>

        {!deleteConfirm ? (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="rounded-xl border border-[var(--color-danger)]/40 px-4 py-2 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
          >
            Delete Account
          </button>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="password"
              placeholder="Enter password to confirm"
              value={deletePass}
              onChange={(e) => setDeletePass(e.target.value)}
              className={`${inputClass} sm:max-w-xs`}
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="rounded-xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirm(false);
                setDeletePass('');
              }}
              className="text-sm text-[var(--color-text-muted)]"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}