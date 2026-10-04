import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { api, notify } from './api.js';
import { findUserIdFromNotifications, HOME, useAuth } from './auth.jsx';

/* ---------- helpers ---------- */
export const STATUS = {
  DRAFT: ['Draft', 'secondary'],
  PENDING_HR_REVIEW: ['Pending HR review', 'primary'],
  PENDING_DEPARTMENT_REVIEW: ['Pending department review', 'warning text-dark'],
  ACCEPTED: ['Accepted', 'success'],
  REJECTED_BY_HR: ['Rejected by HR', 'danger'],
  REJECTED_BY_DEPARTMENT: ['Rejected by department', 'danger'],
};
export const ROLE_LABEL = { STUDENT: 'Student', HR_OFFICER: 'HR Officer', DEPARTMENT_COORDINATOR: 'Department Coordinator', SYSTEM_ADMIN: 'System Admin' };

const toDate = (v) => (Array.isArray(v) ? new Date(v[0], v[1] - 1, v[2], v[3] || 0, v[4] || 0) : new Date(v));
export const fmtDate = (v) => (v ? toDate(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const fmtDateTime = (v) => (v ? toDate(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const fullName = (u) => (u ? `${u.fname || ''} ${u.lname || ''}`.trim() : '—');

/* ---------- polling ---------- */
// Runs fn immediately and every `ms` while mounted and the tab is visible. One interval per mount.
export function usePoll(fn, deps = [], ms = 15000) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn); fnRef.current = fn;
  const alive = useRef(true);
  const run = useCallback(async () => {
    try { const data = await fnRef.current(); if (alive.current) setState({ data, loading: false, error: null }); }
    catch (error) { if (alive.current) setState((s) => ({ ...s, loading: false, error })); }
  }, []);
  useEffect(() => {
    alive.current = true;
    setState((s) => ({ ...s, loading: true }));
    run();
    const id = setInterval(() => { if (!document.hidden) run(); }, ms);
    return () => { alive.current = false; clearInterval(id); };
  }, deps); // eslint-disable-line
  return { ...state, reload: run };
}

/* ---------- small components ---------- */
export const Spinner = ({ label = 'Loading...' }) => (
  <div className="d-flex align-items-center justify-content-center gap-2 text-muted py-5"><div className="spinner-border spinner-border-sm" role="status" />{label}</div>
);
export const Busy = ({ busy, children }) => (<>{busy && <span className="spinner-border spinner-border-sm me-2" />}{children}</>);
export const StatusBadge = ({ status }) => { const [l, c] = STATUS[status] || [status || '—', 'secondary']; return <span className={`badge bg-${c}`}>{l}</span>; };
export const Empty = ({ icon = 'inbox', children }) => (<div className="text-center text-muted py-5"><i className={`bi bi-${icon} fs-1 d-block mb-2`} />{children}</div>);
export const PageHeader = ({ title, children }) => (<div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h1 className="h4 mb-0">{title}</h1><div>{children}</div></div>);
export const Stat = ({ icon, label, value, tone }) => (
  <div className="card h-100"><div className="card-body d-flex align-items-center gap-3">
    <div className="stat-icon" style={tone ? { background: tone + '22', color: tone } : null}><i className={`bi bi-${icon}`} /></div>
    <div><div className="text-muted small">{label}</div><div className="fs-4 fw-semibold">{value ?? '—'}</div></div>
  </div></div>
);
export const Field = ({ label, value }) => (<div className="mb-2"><div className="text-muted small">{label}</div><div>{value ?? '—'}</div></div>);

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-backdrop-lite" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 520 }} role="dialog" aria-modal="true">
        <div className="card-header d-flex justify-content-between align-items-center bg-white"><strong>{title}</strong><button className="btn-close" onClick={onClose} aria-label="Close" /></div>
        <div className="card-body">{children}</div>
        {footer && <div className="card-footer bg-white d-flex justify-content-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ title = 'Please confirm', message, confirmText = 'Confirm', danger, busyText, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await onConfirm(); onClose(); } catch { setBusy(false); } };
  return (
    <Modal title={title} onClose={() => !busy && onClose()} footer={<>
      <button className="btn btn-outline-secondary" disabled={busy} onClick={onClose}>Cancel</button>
      <button className={`btn btn-${danger ? 'danger' : 'primary'}`} disabled={busy} onClick={go}><Busy busy={busy}>{busy ? busyText || 'Working...' : confirmText}</Busy></button>
    </>}>{message}</Modal>
  );
}

export function ReasonModal({ title, label = 'Reason', confirmText, busyText, onSubmit, onClose }) {
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await onSubmit(reason.trim()); onClose(); } catch { setBusy(false); } };
  return (
    <Modal title={title} onClose={() => !busy && onClose()} footer={<>
      <button className="btn btn-outline-secondary" disabled={busy} onClick={onClose}>Cancel</button>
      <button className="btn btn-danger" disabled={busy || !reason.trim()} onClick={go}><Busy busy={busy}>{busy ? busyText : confirmText}</Busy></button>
    </>}>
      <label className="form-label">{label}</label>
      <textarea className="form-control" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      <div className="form-text">The student is notified with this reason.</div>
    </Modal>
  );
}

export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const h = (e) => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l.slice(-3), { id, ...e.detail }]);
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 6000);
    };
    window.addEventListener('fams:toast', h);
    return () => window.removeEventListener('fams:toast', h);
  }, []);
  return (
    <div className="toast-host">{items.map((t) => (
      <div key={t.id} className={`alert alert-${t.type} shadow-sm py-2 d-flex justify-content-between align-items-start`} role="alert">
        <span>{t.msg}</span><button className="btn-close btn-sm" onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} />
      </div>))}</div>
  );
}

/* ---------- notifications (polled once, shared by bell + page) ---------- */
const NotifCtx = createContext({ list: [], unread: 0, loading: false, reload: () => {} });
export const useNotifs = () => useContext(NotifCtx);

function NotifProvider({ children }) {
  const { user, patchUser } = useAuth();
  const { data, loading, reload } = usePoll(async () => {
    let uid = user.userId;
    if (!uid) { uid = await findUserIdFromNotifications(user.email); if (!uid) return []; patchUser({ userId: uid }); }
    return (await api.notifications(uid)).sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
  }, [user.email], 15000);
  const list = data || [];
  return <NotifCtx.Provider value={{ list, loading, reload, unread: list.filter((n) => n.status === 'UNREAD').length }}>{children}</NotifCtx.Provider>;
}

function NotificationBell({ base }) {
  const { list, unread, reload } = useNotifs();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const read = async (n) => { if (n.status === 'UNREAD') { await api.markRead(n.notificationId); reload(); } };
  return (
    <div className="position-relative" ref={ref}>
      <button className="btn btn-light position-relative" onClick={() => setOpen(!open)} aria-label="Notifications"><i className="bi bi-bell fs-5" />
        {unread > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unread}</span>}
      </button>
      {open && (
        <div className="dropdown-panel">
          <div className="p-2 border-bottom d-flex justify-content-between"><strong>Notifications</strong><Link to={`${base}/notifications`} onClick={() => setOpen(false)}>View all</Link></div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {list.length === 0 && <div className="p-3 text-muted small">No notifications yet.</div>}
            {list.slice(0, 6).map((n) => (
              <div key={n.notificationId} role="button" onClick={() => read(n)} className={`p-2 border-bottom small ${n.status === 'UNREAD' ? 'bg-light fw-semibold' : 'text-muted'}`}>
                {n.message}<div className="text-muted fw-normal" style={{ fontSize: '.72rem' }}>{fmtDateTime(n.sentDate)}</div>
              </div>))}
          </div>
        </div>)}
    </div>
  );
}

/* ---------- guards + layout ---------- */
export function RoleRoute({ role }) {
  const { isAuthenticated, user } = useAuth();
  const loc = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return <Layout />;
}

const NAV = {
  STUDENT: ['/student', [['dashboard', 'Dashboard', 'speedometer2'], ['profile', 'My Profile', 'person'], ['apply', 'Field Application', 'file-earmark-plus'], ['applications', 'My Applications', 'folder2-open'], ['notifications', 'Notifications', 'bell'], ['placement-letter', 'Placement Letter', 'file-earmark-pdf']]],
  HR_OFFICER: ['/hr', [['dashboard', 'Dashboard', 'speedometer2'], ['applications', 'Pending Applications', 'inbox'], ['notifications', 'Notifications', 'bell'], ['profile', 'Profile', 'person']]],
  DEPARTMENT_COORDINATOR: ['/coordinator', [['dashboard', 'Dashboard', 'speedometer2'], ['applications', 'Forwarded Applications', 'inbox'], ['notifications', 'Notifications', 'bell'], ['profile', 'Profile', 'person']]],
  SYSTEM_ADMIN: ['/admin', [['dashboard', 'Dashboard', 'speedometer2'], ['users', 'Users', 'people'], ['hr-officers', 'HR Officers', 'person-badge'], ['departments', 'Departments', 'diagram-3'], ['coordinators', 'Department Coordinators', 'person-gear'], ['profile', 'Profile', 'person']]],
};

function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const [base, items] = NAV[user.role];
  const title = items.find(([p]) => loc.pathname.startsWith(`${base}/${p}`))?.[1] || 'DUWASA FAMS';
  const initial = (user.fname || user.email || '?')[0].toUpperCase();
  return (
    <NotifProvider>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><b>DUWASA FAMS</b><small>Field Application Management System</small></div>
        <nav>{items.map(([p, label, icon]) => (
          <NavLink key={p} to={`${base}/${p}`} className="nav-item"><i className={`bi bi-${icon}`} />{label}</NavLink>))}</nav>
        <button className="nav-item logout" style={{ display: 'flex', gap: '.75rem', padding: '.9rem 1.25rem', color: '#fff', borderTop: '1px solid rgba(255,255,255,.18)' }} onClick={logout}><i className="bi bi-box-arrow-left" />Logout</button>
      </aside>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="btn btn-light d-lg-none" onClick={() => setOpen(true)} aria-label="Menu"><i className="bi bi-list fs-5" /></button>
          <div className="me-auto"><div className="fw-semibold">{title}</div><div className="text-muted small d-none d-md-block">DUWASA Field Application Management System</div></div>
          <NotificationBell base={base} />
          <div className="position-relative">
            <button className="btn btn-light d-flex align-items-center gap-2" onClick={() => setMenu(!menu)}>
              <span className="avatar">{initial}</span>
              <span className="text-start d-none d-md-block lh-sm"><span className="d-block small fw-semibold">{fullName(user) || user.email}</span><span className="d-block text-muted" style={{ fontSize: '.72rem' }}>{ROLE_LABEL[user.role]}</span></span>
            </button>
            {menu && <div className="dropdown-panel" style={{ width: 190 }}>
              {user.role !== 'SYSTEM_ADMIN' && user.role !== 'STUDENT' || true ? <Link className="d-block p-2 text-decoration-none" to={`${base}/profile`} onClick={() => setMenu(false)}><i className="bi bi-person me-2" />Profile</Link> : null}
              <button className="btn btn-link text-danger text-decoration-none d-block p-2 w-100 text-start" onClick={logout}><i className="bi bi-box-arrow-left me-2" />Logout</button>
            </div>}
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </NotifProvider>
  );
}
