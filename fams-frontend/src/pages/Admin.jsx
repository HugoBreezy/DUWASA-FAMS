import { useState } from 'react';
import { api, notify } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Busy, Confirm, Empty, fmtDate, fullName, Modal, PageHeader, ROLE_LABEL, Spinner, Stat, usePoll } from '../ui.jsx';

const ROLES = Object.keys(ROLE_LABEL);

export function AdminDashboard() {
  const { data, loading } = usePoll(async () => ({ users: await api.adminUsers(), deps: await api.adminDepartments(), apps: await api.allApplications() }));
  if (loading && !data) return <Spinner />;
  const { users, deps, apps } = data; const c = (r) => users.filter((u) => u.role === r).length;
  return (
    <>
      <PageHeader title="Admin Dashboard" />
      <div className="row g-3">
        <div className="col-6 col-xl-3"><Stat icon="people" label="Users" value={users.length} /></div>
        <div className="col-6 col-xl-3"><Stat icon="person-badge" label="HR officers" value={c('HR_OFFICER')} /></div>
        <div className="col-6 col-xl-3"><Stat icon="person-gear" label="Department coordinators" value={c('DEPARTMENT_COORDINATOR')} /></div>
        <div className="col-6 col-xl-3"><Stat icon="mortarboard" label="Students" value={c('STUDENT')} /></div>
        <div className="col-6 col-xl-3"><Stat icon="diagram-3" label="Departments" value={deps.length} /></div>
        <div className="col-6 col-xl-3"><Stat icon="folder2-open" label="Applications" value={apps.length} /></div>
      </div>
    </>
  );
}

function UserForm({ title, initial, extra, withPassword, onSubmit, onClose }) {
  const [f, setF] = useState({ fname: '', lname: '', email: '', phone: '', password: '', ...initial }); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async (e) => { e.preventDefault(); setBusy(true); try { await onSubmit(f); onClose(); } catch { setBusy(false); } };
  return (
    <Modal title={title} onClose={() => !busy && onClose()}>
      <form onSubmit={go}>
        <div className="row g-2 mb-2"><div className="col"><label className="form-label">First name</label><input className="form-control" required value={f.fname} onChange={set('fname')} /></div>
          <div className="col"><label className="form-label">Last name</label><input className="form-control" required value={f.lname} onChange={set('lname')} /></div></div>
        <div className="mb-2"><label className="form-label">Email</label><input type="email" className="form-control" required value={f.email} onChange={set('email')} /></div>
        <div className="mb-2"><label className="form-label">Phone</label><input className="form-control" value={f.phone || ''} onChange={set('phone')} /></div>
        <div className="mb-2"><label className="form-label">{withPassword ? 'Password' : 'New password (leave blank to keep)'}</label><input type="password" className="form-control" required={withPassword} value={f.password} onChange={set('password')} /></div>
        {extra?.(f, set)}
        <div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}><Busy busy={busy}>Save</Busy></button></div>
      </form>
    </Modal>
  );
}

const strip = (f) => { const { password, ...r } = f; return password ? f : r; };

export function Users() {
  const { user } = useAuth();
  const { data, loading, reload } = usePoll(api.adminUsers, [], 30000);
  const [dlg, setDlg] = useState(null); const [busy, setBusy] = useState(null);
  const role = async (u, r) => { setBusy(u.userId); try { await api.adminRole(u.userId, r); notify('success', 'Role updated.'); await reload(); } finally { setBusy(null); } };
  return (
    <>
      <PageHeader title="Users" />
      <div className="card">{loading && !data ? <Spinner /> : (
        <div className="table-responsive"><table className="table align-middle mb-0"><thead className="table-light"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Created</th><th /></tr></thead>
          <tbody>{data.map((u) => { const me = u.userId === user.userId; return (
            <tr key={u.userId}><td>{fullName(u)}{me && <span className="badge bg-light text-dark ms-2">You</span>}</td><td>{u.email}</td><td>{u.phone || '—'}</td>
              <td><select className="form-select form-select-sm" style={{ minWidth: 190 }} disabled={me || busy === u.userId} value={u.role} onChange={(e) => role(u, e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
              <td>{fmtDate(u.createdAt)}</td>
              <td className="text-end text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => setDlg({ edit: u })}><i className="bi bi-pencil" /></button>
                <button className="btn btn-sm btn-outline-danger" disabled={me} onClick={() => setDlg({ del: u })}><i className="bi bi-trash" /></button></td></tr>); })}</tbody></table></div>)}</div>
      {dlg?.edit && <UserForm title="Edit user" initial={dlg.edit} onClose={() => setDlg(null)} onSubmit={async (f) => { await api.adminUpdateUser(dlg.edit.userId, strip(f)); notify('success', 'User updated.'); await reload(); }} />}
      {dlg?.del && <Confirm danger title="Delete user" confirmText="Delete" message={`Delete ${fullName(dlg.del)} (${dlg.del.email})? This cannot be undone. Users with linked records may not be deletable.`} onClose={() => setDlg(null)} onConfirm={async () => { await api.adminDeleteUser(dlg.del.userId); notify('success', 'User deleted.'); await reload(); }} />}
    </>
  );
}

function SimpleUserPage({ title, load, create, createLabel, extra, empty }) {
  const { data, loading, reload } = usePoll(load, [], 30000); const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader title={title}><button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><i className="bi bi-plus-lg me-1" />{createLabel}</button></PageHeader>
      <div className="card">{loading && !data ? <Spinner /> : !data.length ? <Empty icon="people">{empty}</Empty> : (
        <div className="table-responsive"><table className="table mb-0"><thead className="table-light"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Created</th></tr></thead>
          <tbody>{data.map((u) => <tr key={u.userId}><td>{fullName(u)}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{fmtDate(u.createdAt)}</td></tr>)}</tbody></table></div>)}</div>
      {open && <UserForm title={createLabel} withPassword extra={extra} onClose={() => setOpen(false)} onSubmit={async (f) => { await create(f); notify('success', 'Account created.'); await reload(); }} />}
    </>
  );
}

export const HrOfficers = () => <SimpleUserPage title="HR Officers" load={api.hrOfficers} create={api.createHr} createLabel="Add HR officer" empty="No HR officers yet." />;

export function Coordinators() {
  const { data: deps } = usePoll(api.adminDepartments, [], 60000);
  return (
    <>
      <div className="alert alert-info py-2 small">The backend lists coordinator accounts but does not expose which department each one belongs to. Each department can have only one coordinator.</div>
      <SimpleUserPage title="Department Coordinators" load={api.coordinatorUsers} createLabel="Add coordinator" empty="No coordinators yet."
        create={(f) => api.createCoordinator({ ...f, departmentId: Number(f.departmentId) })}
        extra={(f, set) => (<div className="mb-2"><label className="form-label">Department</label>
          <select className="form-select" required value={f.departmentId || ''} onChange={set('departmentId')}><option value="">Select a department</option>{(deps || []).map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}</select></div>)} />
    </>
  );
}

export function Departments() {
  const { data, loading, reload } = usePoll(api.adminDepartments, [], 30000);
  const [dlg, setDlg] = useState(null); const [busy, setBusy] = useState(null);
  const toggle = async (d) => { setBusy(d.departmentId); try { await api.adminDepartmentStatus(d.departmentId, d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); await reload(); } finally { setBusy(null); } };
  return (
    <>
      <PageHeader title="Departments"><button className="btn btn-primary btn-sm" onClick={() => setDlg({ form: {} })}><i className="bi bi-plus-lg me-1" />Add department</button></PageHeader>
      <div className="card">{loading && !data ? <Spinner /> : !data.length ? <Empty icon="diagram-3">No departments yet.</Empty> : (
        <div className="table-responsive"><table className="table align-middle mb-0"><thead className="table-light"><tr><th>Name</th><th>Description</th><th>Slots (used / total)</th><th>Status</th><th /></tr></thead>
          <tbody>{data.map((d) => (
            <tr key={d.departmentId}><td className="fw-semibold">{d.departmentName}</td><td className="text-muted">{d.description || '—'}</td><td>{d.occupiedSlots ?? 0} / {d.totalSlots ?? 0}</td>
              <td><button className={`btn btn-sm btn-${d.status === 'ACTIVE' ? 'success' : 'secondary'}`} disabled={busy === d.departmentId} onClick={() => toggle(d)}>{d.status}</button></td>
              <td className="text-end text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => setDlg({ form: d })}><i className="bi bi-pencil" /></button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => setDlg({ del: d })}><i className="bi bi-trash" /></button></td></tr>))}</tbody></table></div>)}</div>
      {dlg?.form && <DepartmentForm initial={dlg.form} onClose={() => setDlg(null)} onDone={reload} />}
      {dlg?.del && <Confirm danger title="Delete department" confirmText="Delete" message={`Delete "${dlg.del.departmentName}"? Departments with applications or a coordinator may not be deletable.`} onClose={() => setDlg(null)} onConfirm={async () => { await api.adminDeleteDepartment(dlg.del.departmentId); notify('success', 'Department deleted.'); await reload(); }} />}
    </>
  );
}

function DepartmentForm({ initial, onClose, onDone }) {
  const edit = !!initial.departmentId;
  const [f, setF] = useState({ departmentName: '', description: '', totalSlots: 0, status: 'ACTIVE', ...initial }); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { departmentName: f.departmentName.trim(), description: f.description, totalSlots: Number(f.totalSlots), status: f.status };
    try { edit ? await api.adminUpdateDepartment(initial.departmentId, body) : await api.adminCreateDepartment(body); notify('success', 'Department saved.'); await onDone(); onClose(); } catch { setBusy(false); }
  };
  return (
    <Modal title={edit ? 'Edit department' : 'Add department'} onClose={() => !busy && onClose()}>
      <form onSubmit={go}>
        <div className="mb-2"><label className="form-label">Name</label><input className="form-control" required value={f.departmentName} onChange={set('departmentName')} /></div>
        <div className="mb-2"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={f.description || ''} onChange={set('description')} /></div>
        <div className="row g-2 mb-2"><div className="col"><label className="form-label">Total slots</label><input type="number" min={initial.occupiedSlots || 0} className="form-control" required value={f.totalSlots} onChange={set('totalSlots')} /></div>
          <div className="col"><label className="form-label">Status</label><select className="form-select" value={f.status} onChange={set('status')}><option>ACTIVE</option><option>INACTIVE</option></select></div></div>
        <div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}><Busy busy={busy}>Save</Busy></button></div>
      </form>
    </Modal>
  );
}
