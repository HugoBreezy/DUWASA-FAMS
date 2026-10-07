import { useMemo, useState } from 'react';

import { api, notify } from '../api.js';

import { useAuth } from '../auth.jsx';

import {
  Busy,
  Confirm,
  Empty,
  fmtDate,
  fullName,
  Modal,
  PageHeader,
  ROLE_LABEL,
  Spinner,
  Stat,
  usePoll
} from '../ui.jsx';



const ROLES = Object.keys(ROLE_LABEL);



/* =========================================================
   VALIDATION HELPERS
========================================================= */

function validateEmail(email) {

  const value = email.trim();

  if (!value) {
    return 'Email is required.';
  }

  if (value !== value.toLowerCase()) {
    return 'Email must be lowercase.';
  }

  const emailRegex =
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(value)) {
    return 'Enter a valid email address.';
  }

  return '';
}



function validatePhone(phone) {

  if (!phone) {
    return 'Phone number is required.';
  }

  if (!/^\d{9}$/.test(phone)) {
    return 'Phone number must contain exactly 9 digits after +255.';
  }

  return '';
}



function validatePassword(password) {

  if (!password) {
    return 'Password is required.';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (!/^[A-Z]/.test(password)) {
    return 'Password must start with an uppercase letter.';
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(password)) {
    return 'Password must contain at least one special character.';
  }

  if (/password/i.test(password)) {
    return 'Password cannot contain the word "password".';
  }

  return '';
}



function blockPasswordClipboard(e) {

  e.preventDefault();

  notify(
    'error',
    'Copy, cut and paste are not allowed for passwords.'
  );
}



/* =========================================================
   ROLE BADGES
========================================================= */

function RoleBadge({ role }) {

  const config = {
    SYSTEM_ADMIN: {
      label: 'System Admin',
      className: 'bg-dark text-white',
      icon: 'shield-lock'
    },

    ADMIN: {
      label: 'System Admin',
      className: 'bg-dark text-white',
      icon: 'shield-lock'
    },

    HR_OFFICER: {
      label: 'HR Officer',
      className: 'bg-primary-subtle text-primary',
      icon: 'person-badge'
    },

    DEPARTMENT_COORDINATOR: {
      label: 'Department Coordinator',
      className: 'bg-success-subtle text-success',
      icon: 'person-gear'
    },

    STUDENT: {
      label: 'Student',
      className: 'bg-info-subtle text-info-emphasis',
      icon: 'mortarboard'
    }
  };

  const item = config[role] || {
    label: ROLE_LABEL[role] || role,
    className: 'bg-light text-dark',
    icon: 'person'
  };

  return (
    <span
      className={`badge rounded-pill px-3 py-2 ${item.className}`}
    >
      <i className={`bi bi-${item.icon} me-1`} />
      {item.label}
    </span>
  );
}



/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export function AdminDashboard() {

  const { data, loading } = usePoll(async () => ({
    users: await api.adminUsers(),
    deps: await api.adminDepartments(),
    apps: await api.allApplications()
  }));

  if (loading && !data) {
    return <Spinner />;
  }

  const {
    users,
    deps,
    apps
  } = data;

  const countRole = (role) =>
    users.filter((u) => u.role === role).length;

  return (
    <>
      <PageHeader title="Admin Dashboard" />

      <div className="row g-3">

        <div className="col-6 col-xl-3">
          <Stat
            icon="people"
            label="Users"
            value={users.length}
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="person-badge"
            label="HR officers"
            value={countRole('HR_OFFICER')}
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="person-gear"
            label="Department coordinators"
            value={countRole('DEPARTMENT_COORDINATOR')}
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="mortarboard"
            label="Students"
            value={countRole('STUDENT')}
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="diagram-3"
            label="Departments"
            value={deps.length}
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="folder2-open"
            label="Applications"
            value={apps.length}
          />
        </div>

      </div>
    </>
  );
}



/* =========================================================
   USER FORM
========================================================= */

function UserForm({
  title,
  initial,
  extra,
  withPassword,
  onSubmit,
  onClose
}) {

  const isCreate = !!withPassword;

  const [f, setF] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    password: '',
    ...initial
  });

  const [busy, setBusy] = useState(false);

  const [errors, setErrors] = useState({});



  const set = (k) => (e) => {

    let value = e.target.value;

    if (k === 'email') {
      value = value.toLowerCase();
    }

    if (k === 'phone') {
      value = value
        .replace(/\D/g, '')
        .slice(0, 9);
    }

    setF({
      ...f,
      [k]: value
    });

    setErrors({
      ...errors,
      [k]: ''
    });
  };



  const go = async (e) => {

    e.preventDefault();

    const newErrors = {};



    if (!f.fname.trim()) {
      newErrors.fname =
        'First name is required.';
    }



    if (!f.lname.trim()) {
      newErrors.lname =
        'Last name is required.';
    }



    const emailError =
      validateEmail(f.email);

    if (emailError) {
      newErrors.email =
        emailError;
    }



    if (isCreate) {

      const phoneError =
        validatePhone(f.phone);

      if (phoneError) {
        newErrors.phone =
          phoneError;
      }

    }



    if (isCreate) {

      const passwordError =
        validatePassword(f.password);

      if (passwordError) {
        newErrors.password =
          passwordError;
      }

    } else if (f.password) {

      const passwordError =
        validatePassword(f.password);

      if (passwordError) {
        newErrors.password =
          passwordError;
      }
    }



    if (Object.keys(newErrors).length > 0) {

      setErrors(newErrors);

      notify(
        'error',
        'Please correct the highlighted fields.'
      );

      return;
    }



    setBusy(true);

    try {

      await onSubmit({
        ...f,
        email: f.email
          .trim()
          .toLowerCase()
      });

      onClose();

    } catch {

      setBusy(false);
    }
  };



  return (
    <Modal
      title={title}
      onClose={() =>
        !busy && onClose()
      }
    >

      <form onSubmit={go}>

        <div className="row g-2 mb-2">

          <div className="col">

            <label className="form-label">
              First name
            </label>

            <input
              className={`form-control ${
                errors.fname
                  ? 'is-invalid'
                  : ''
              }`}
              required
              value={f.fname}
              onChange={set('fname')}
            />

            {errors.fname && (
              <div className="invalid-feedback">
                {errors.fname}
              </div>
            )}

          </div>



          <div className="col">

            <label className="form-label">
              Last name
            </label>

            <input
              className={`form-control ${
                errors.lname
                  ? 'is-invalid'
                  : ''
              }`}
              required
              value={f.lname}
              onChange={set('lname')}
            />

            {errors.lname && (
              <div className="invalid-feedback">
                {errors.lname}
              </div>
            )}

          </div>

        </div>



        <div className="mb-2">

          <label className="form-label">
            Email
          </label>

          <input
            type="email"
            className={`form-control ${
              errors.email
                ? 'is-invalid'
                : ''
            }`}
            required
            value={f.email}
            onChange={set('email')}
            autoComplete="off"
          />

          {errors.email && (
            <div className="invalid-feedback">
              {errors.email}
            </div>
          )}

        </div>



        <div className="mb-2">

          <label className="form-label">
            Phone
          </label>

          <div className="input-group">

            <span className="input-group-text">
              +255
            </span>

            <input
              type="text"
              inputMode="numeric"
              className={`form-control ${
                errors.phone
                  ? 'is-invalid'
                  : ''
              }`}
              value={f.phone || ''}
              onChange={set('phone')}
              maxLength={9}
              placeholder="712345678"
              required={isCreate}
            />

          </div>

          {errors.phone && (
            <div className="text-danger small mt-1">
              {errors.phone}
            </div>
          )}

          {isCreate &&
            !errors.phone && (
              <div className="form-text">
                Enter exactly 9 digits after +255.
              </div>
            )}

        </div>



        <div className="mb-2">

          <label className="form-label">
            {withPassword
              ? 'Password'
              : 'New password (leave blank to keep)'}
          </label>

          <input
            type="password"
            className={`form-control ${
              errors.password
                ? 'is-invalid'
                : ''
            }`}
            required={withPassword}
            value={f.password}
            onChange={set('password')}
            onPaste={blockPasswordClipboard}
            onCopy={blockPasswordClipboard}
            onCut={blockPasswordClipboard}
            onDrop={blockPasswordClipboard}
            autoComplete="new-password"
          />

          {errors.password && (
            <div className="invalid-feedback">
              {errors.password}
            </div>
          )}

          {withPassword && (
            <div className="form-text">
              Minimum 8 characters, start with
              uppercase, contain a special
              character, and cannot contain
              the word "password".
            </div>
          )}

        </div>



        {extra?.(f, set)}



        <div className="d-flex justify-content-end gap-2 mt-3">

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn btn-primary"
            disabled={busy}
          >
            <Busy busy={busy}>
              Save
            </Busy>
          </button>

        </div>

      </form>

    </Modal>
  );
}



/* =========================================================
   USERS PAGE
========================================================= */

export function Users() {

  const { user } = useAuth();

  const {
    data,
    loading,
    reload
  } = usePoll(
    api.adminUsers,
    [],
    30000
  );

  const [dlg, setDlg] =
    useState(null);

  const [filter, setFilter] =
    useState('ALL');

  const [search, setSearch] =
    useState('');



  const users = data || [];



  const roleCounts = useMemo(() => {

    return {
      ALL: users.length,

      STUDENT: users.filter(
        (u) => u.role === 'STUDENT'
      ).length,

      HR_OFFICER: users.filter(
        (u) => u.role === 'HR_OFFICER'
      ).length,

      DEPARTMENT_COORDINATOR:
        users.filter(
          (u) =>
            u.role ===
            'DEPARTMENT_COORDINATOR'
        ).length,

      SYSTEM_ADMIN:
        users.filter(
          (u) =>
            u.role === 'SYSTEM_ADMIN' ||
            u.role === 'ADMIN'
        ).length
    };

  }, [users]);



  const filteredUsers = useMemo(() => {

    const query =
      search.trim().toLowerCase();

    return users.filter((u) => {

      const matchesRole =
        filter === 'ALL'
          ? true
          : filter === 'SYSTEM_ADMIN'
            ? (
                u.role === 'SYSTEM_ADMIN' ||
                u.role === 'ADMIN'
              )
            : u.role === filter;



      if (!matchesRole) {
        return false;
      }



      if (!query) {
        return true;
      }



      const name =
        fullName(u)
          .toLowerCase();

      const email =
        (u.email || '')
          .toLowerCase();

      const phone =
        (u.phone || '')
          .toLowerCase();



      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });

  }, [
    users,
    filter,
    search
  ]);



  const filters = [
    {
      key: 'ALL',
      label: 'All Users',
      icon: 'people',
      color: 'primary'
    },

    {
      key: 'STUDENT',
      label: 'Students',
      icon: 'mortarboard',
      color: 'info'
    },

    {
      key: 'HR_OFFICER',
      label: 'HR Officers',
      icon: 'person-badge',
      color: 'primary'
    },

    {
      key: 'DEPARTMENT_COORDINATOR',
      label: 'Coordinators',
      icon: 'person-gear',
      color: 'success'
    },

    {
      key: 'SYSTEM_ADMIN',
      label: 'Admins',
      icon: 'shield-lock',
      color: 'dark'
    }
  ];



  const strip = (f) => {

    const {
      password,
      role,
      ...rest
    } = f;

    return password
      ? f
      : {
          ...rest,
          role
        };
  };



  const saveUser = async (f) => {

    const oldRole =
      dlg.edit.role;

    await api.adminUpdateUser(
      dlg.edit.userId,
      strip(f)
    );



    if (
      f.role &&
      f.role !== oldRole
    ) {

      await api.adminRole(
        dlg.edit.userId,
        f.role
      );
    }



    notify(
      'success',
      'User updated.'
    );

    await reload();
  };



  const deleteUser =
    async (u) => {

      await api.adminDeleteUser(
        u.userId
      );

      notify(
        'success',
        'User deleted.'
      );

      await reload();
    };



  return (
    <>

      <PageHeader title="Users" />



      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="row g-3 mb-4">

        <div className="col-6 col-xl">

          <div
            className="card border-0 shadow-sm h-100"
            style={{
              cursor: 'pointer'
            }}
            onClick={() =>
              setFilter('ALL')
            }
          >

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start">

                <div>

                  <div className="text-muted small mb-1">
                    All Users
                  </div>

                  <div className="fs-3 fw-bold">
                    {roleCounts.ALL}
                  </div>

                </div>

                <div className="rounded-circle bg-primary-subtle text-primary p-3">
                  <i className="bi bi-people fs-5" />
                </div>

              </div>

            </div>

          </div>

        </div>



        <div className="col-6 col-xl">

          <div
            className="card border-0 shadow-sm h-100"
            style={{
              cursor: 'pointer'
            }}
            onClick={() =>
              setFilter('STUDENT')
            }
          >

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start">

                <div>

                  <div className="text-muted small mb-1">
                    Students
                  </div>

                  <div className="fs-3 fw-bold">
                    {roleCounts.STUDENT}
                  </div>

                </div>

                <div className="rounded-circle bg-info-subtle text-info p-3">
                  <i className="bi bi-mortarboard fs-5" />
                </div>

              </div>

            </div>

          </div>

        </div>



        <div className="col-6 col-xl">

          <div
            className="card border-0 shadow-sm h-100"
            style={{
              cursor: 'pointer'
            }}
            onClick={() =>
              setFilter('HR_OFFICER')
            }
          >

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start">

                <div>

                  <div className="text-muted small mb-1">
                    HR Officers
                  </div>

                  <div className="fs-3 fw-bold">
                    {roleCounts.HR_OFFICER}
                  </div>

                </div>

                <div className="rounded-circle bg-primary-subtle text-primary p-3">
                  <i className="bi bi-person-badge fs-5" />
                </div>

              </div>

            </div>

          </div>

        </div>



        <div className="col-6 col-xl">

          <div
            className="card border-0 shadow-sm h-100"
            style={{
              cursor: 'pointer'
            }}
            onClick={() =>
              setFilter(
                'DEPARTMENT_COORDINATOR'
              )
            }
          >

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start">

                <div>

                  <div className="text-muted small mb-1">
                    Coordinators
                  </div>

                  <div className="fs-3 fw-bold">
                    {
                      roleCounts
                        .DEPARTMENT_COORDINATOR
                    }
                  </div>

                </div>

                <div className="rounded-circle bg-success-subtle text-success p-3">
                  <i className="bi bi-person-gear fs-5" />
                </div>

              </div>

            </div>

          </div>

        </div>



        <div className="col-6 col-xl">

          <div
            className="card border-0 shadow-sm h-100"
            style={{
              cursor: 'pointer'
            }}
            onClick={() =>
              setFilter('SYSTEM_ADMIN')
            }
          >

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start">

                <div>

                  <div className="text-muted small mb-1">
                    Administrators
                  </div>

                  <div className="fs-3 fw-bold">
                    {roleCounts.SYSTEM_ADMIN}
                  </div>

                </div>

                <div className="rounded-circle bg-dark-subtle text-dark p-3">
                  <i className="bi bi-shield-lock fs-5" />
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>



      {/* =================================================
          FILTERS + SEARCH
      ================================================= */}

      <div className="card border-0 shadow-sm mb-3">

        <div className="card-body">

          <div className="d-flex flex-wrap gap-2 align-items-center">

            {filters.map((item) => (

              <button
                key={item.key}
                type="button"
                className={`btn btn-sm ${
                  filter === item.key
                    ? `btn-${item.color}`
                    : 'btn-outline-secondary'
                }`}
                onClick={() =>
                  setFilter(item.key)
                }
              >

                <i
                  className={`bi bi-${item.icon} me-1`}
                />

                {item.label}

                <span
                  className={`badge ms-2 ${
                    filter === item.key
                      ? 'bg-white text-dark'
                      : 'bg-light text-dark'
                  }`}
                >
                  {roleCounts[item.key]}
                </span>

              </button>

            ))}

          </div>



          <div className="mt-3">

            <div className="input-group">

              <span className="input-group-text bg-white">
                <i className="bi bi-search" />
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

              {search && (

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setSearch('')
                  }
                >
                  <i className="bi bi-x-lg" />
                </button>

              )}

            </div>

          </div>

        </div>

      </div>



      {/* =================================================
          USERS TABLE
      ================================================= */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white py-3">

          <div className="d-flex justify-content-between align-items-center">

            <div>

              <h5 className="mb-1 fw-semibold">
                {filter === 'ALL'
                  ? 'All Users'
                  : filters.find(
                      (x) =>
                        x.key === filter
                    )?.label}
              </h5>

              <div className="text-muted small">
                Showing {filteredUsers.length}{' '}
                user
                {filteredUsers.length === 1
                  ? ''
                  : 's'}
              </div>

            </div>

          </div>

        </div>



        {loading && !data ? (

          <Spinner />

        ) : !filteredUsers.length ? (

          <Empty icon="people">

            {search
              ? 'No users match your search.'
              : 'No users found in this category.'}

          </Empty>

        ) : (

          <div className="table-responsive">

            <table className="table align-middle mb-0">

              <thead className="table-light">

                <tr>

                  <th className="ps-4">
                    User
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Created
                  </th>

                  <th className="text-end pe-4">
                    Actions
                  </th>

                </tr>

              </thead>



              <tbody>

                {filteredUsers.map((u) => {

                  const me =
                    u.userId ===
                    user.userId;

                  return (

                    <tr
                      key={u.userId}
                    >

                      <td className="ps-4">

                        <div className="d-flex align-items-center">

                          <div
                            className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center me-3"
                            style={{
                              width: 42,
                              height: 42,
                              minWidth: 42
                            }}
                          >
                            <i className="bi bi-person" />
                          </div>

                          <div>

                            <div className="fw-semibold">

                              {fullName(u)}

                              {me && (

                                <span className="badge bg-light text-dark ms-2">
                                  You
                                </span>

                              )}

                            </div>

                            <div className="text-muted small">
                              User ID: {u.userId}
                            </div>

                          </div>

                        </div>

                      </td>



                      <td>
                        {u.email}
                      </td>



                      <td>
                        {u.phone || '—'}
                      </td>



                      <td>
                        <RoleBadge
                          role={u.role}
                        />
                      </td>



                      <td>
                        {fmtDate(
                          u.createdAt
                        )}
                      </td>



                      <td className="text-end pe-4 text-nowrap">

                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit user"
                          onClick={() =>
                            setDlg({
                              edit: u
                            })
                          }
                        >
                          <i className="bi bi-pencil" />
                        </button>



                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete user"
                          disabled={me}
                          onClick={() =>
                            setDlg({
                              del: u
                            })
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>



      {/* =================================================
          EDIT USER
      ================================================= */}

      {dlg?.edit && (

        <UserForm
          title="Edit user"
          initial={dlg.edit}

          extra={(f, set) => (

            <div className="mb-2">

              <label className="form-label">
                Role
              </label>

              <select
                className="form-select"
                value={
                  f.role || ''
                }
                onChange={set('role')}
                disabled={
                  dlg.edit.userId ===
                  user.userId
                }
              >

                {ROLES.map((r) => (

                  <option
                    key={r}
                    value={r}
                  >
                    {ROLE_LABEL[r]}
                  </option>

                ))}

              </select>

              {dlg.edit.userId ===
                user.userId && (

                <div className="form-text">
                  You cannot change your own role.
                </div>

              )}

            </div>

          )}

          onClose={() =>
            setDlg(null)
          }

          onSubmit={saveUser}
        />

      )}



      {/* =================================================
          DELETE USER
      ================================================= */}

      {dlg?.del && (

        <Confirm
          danger
          title="Delete user"
          confirmText="Delete"

          message={`Delete ${fullName(dlg.del)} (${dlg.del.email})? This cannot be undone. Users with linked records may not be deletable.`}

          onClose={() =>
            setDlg(null)
          }

          onConfirm={() =>
            deleteUser(
              dlg.del
            )
          }
        />

      )}

    </>
  );
}



/* =========================================================
   SIMPLE USER PAGE
========================================================= */

function SimpleUserPage({
  title,
  load,
  create,
  createLabel,
  extra,
  empty
}) {

  const {
    data,
    loading,
    reload
  } = usePoll(
    load,
    [],
    30000
  );

  const [open, setOpen] =
    useState(false);



  return (
    <>

      <PageHeader title={title}>

        <button
          className="btn btn-primary btn-sm"
          onClick={() =>
            setOpen(true)
          }
        >

          <i className="bi bi-plus-lg me-1" />

          {createLabel}

        </button>

      </PageHeader>



      <div className="card border-0 shadow-sm">

        {loading && !data ? (

          <Spinner />

        ) : !data.length ? (

          <Empty icon="people">
            {empty}
          </Empty>

        ) : (

          <div className="table-responsive">

            <table className="table align-middle mb-0">

              <thead className="table-light">

                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Created</th>
                </tr>

              </thead>



              <tbody>

                {data.map((u) => (

                  <tr key={u.userId}>

                    <td>
                      {fullName(u)}
                    </td>

                    <td>
                      {u.email}
                    </td>

                    <td>
                      {u.phone || '—'}
                    </td>

                    <td>
                      {fmtDate(
                        u.createdAt
                      )}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>



      {open && (

        <UserForm
          title={createLabel}
          withPassword
          extra={extra}
          onClose={() =>
            setOpen(false)
          }
          onSubmit={async (f) => {

            await create(f);

            notify(
              'success',
              'Account created.'
            );

            await reload();
          }}
        />

      )}

    </>
  );
}



/* =========================================================
   HR OFFICERS
========================================================= */

export const HrOfficers = () => (

  <SimpleUserPage
    title="HR Officers"
    load={api.hrOfficers}
    create={api.createHr}
    createLabel="Add HR officer"
    empty="No HR officers yet."
  />

);



/* =========================================================
   DEPARTMENT COORDINATORS
========================================================= */

export function Coordinators() {

  const {
    data: deps
  } = usePoll(
    api.adminDepartments,
    [],
    60000
  );



  return (
    <>

      <div className="alert alert-info py-2 small">

        The backend lists coordinator accounts
        but does not expose which department each
        one belongs to. Each department can have
        only one coordinator.

      </div>



      <SimpleUserPage

        title="Department Coordinators"

        load={
          api.coordinatorUsers
        }

        createLabel="Add coordinator"

        empty="No coordinators yet."

        create={(f) =>
          api.createCoordinator({
            ...f,
            departmentId:
              Number(
                f.departmentId
              )
          })
        }

        extra={(f, set) => (

          <div className="mb-2">

            <label className="form-label">
              Department
            </label>

            <select
              className="form-select"
              required
              value={
                f.departmentId ||
                ''
              }
              onChange={set(
                'departmentId'
              )}
            >

              <option value="">
                Select a department
              </option>

              {(deps || []).map(
                (d) => (

                  <option
                    key={
                      d.departmentId
                    }
                    value={
                      d.departmentId
                    }
                  >
                    {
                      d.departmentName
                    }
                  </option>

                )
              )}

            </select>

          </div>

        )}

      />

    </>
  );
}



/* =========================================================
   DEPARTMENTS
========================================================= */

export function Departments() {

  const {
    data,
    loading,
    reload
  } = usePoll(
    api.adminDepartments,
    [],
    30000
  );

  const [dlg, setDlg] =
    useState(null);

  const [busy, setBusy] =
    useState(null);



  const toggle = async (d) => {

    setBusy(
      d.departmentId
    );

    try {

      await api.adminDepartmentStatus(
        d.departmentId,
        d.status === 'ACTIVE'
          ? 'INACTIVE'
          : 'ACTIVE'
      );

      await reload();

    } finally {

      setBusy(null);
    }
  };



  return (
    <>

      <PageHeader title="Departments">

        <button
          className="btn btn-primary btn-sm"
          onClick={() =>
            setDlg({
              form: {}
            })
          }
        >

          <i className="bi bi-plus-lg me-1" />

          Add department

        </button>

      </PageHeader>



      <div className="card border-0 shadow-sm">

        {loading && !data ? (

          <Spinner />

        ) : !data.length ? (

          <Empty icon="diagram-3">
            No departments yet.
          </Empty>

        ) : (

          <div className="table-responsive">

            <table className="table align-middle mb-0">

              <thead className="table-light">

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Slots (used / total)
                  </th>

                  <th>
                    Status
                  </th>

                  <th />

                </tr>

              </thead>



              <tbody>

                {data.map((d) => (

                  <tr
                    key={
                      d.departmentId
                    }
                  >

                    <td className="fw-semibold">
                      {
                        d.departmentName
                      }
                    </td>

                    <td className="text-muted">
                      {
                        d.description ||
                        '—'
                      }
                    </td>

                    <td>
                      {
                        d.occupiedSlots ??
                        0
                      }
                      {' / '}
                      {
                        d.totalSlots ??
                        0
                      }
                    </td>

                    <td>

                      <button
                        className={`btn btn-sm btn-${
                          d.status === 'ACTIVE'
                            ? 'success'
                            : 'secondary'
                        }`}
                        disabled={
                          busy ===
                          d.departmentId
                        }
                        onClick={() =>
                          toggle(d)
                        }
                      >
                        {d.status}
                      </button>

                    </td>



                    <td className="text-end text-nowrap">

                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() =>
                          setDlg({
                            form: d
                          })
                        }
                      >

                        <i className="bi bi-pencil" />

                      </button>



                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          setDlg({
                            del: d
                          })
                        }
                      >

                        <i className="bi bi-trash" />

                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>



      {dlg?.form && (

        <DepartmentForm
          initial={
            dlg.form
          }
          onClose={() =>
            setDlg(null)
          }
          onDone={reload}
        />

      )}



      {dlg?.del && (

        <Confirm
          danger
          title="Delete department"
          confirmText="Delete"

          message={`Delete "${dlg.del.departmentName}"? Departments with applications or a coordinator may not be deletable.`}

          onClose={() =>
            setDlg(null)
          }

          onConfirm={async () => {

            await api.adminDeleteDepartment(
              dlg.del.departmentId
            );

            notify(
              'success',
              'Department deleted.'
            );

            await reload();
          }}

        />

      )}

    </>
  );
}



/* =========================================================
   DEPARTMENT FORM
========================================================= */

function DepartmentForm({
  initial,
  onClose,
  onDone
}) {

  const edit =
    !!initial.departmentId;



  const occupiedSlots =
    Number(
      initial.occupiedSlots || 0
    );



  const minimumSlots =
    Math.max(
      1,
      occupiedSlots
    );



  const [f, setF] =
    useState({

      departmentName: '',

      description: '',

      totalSlots:
        minimumSlots,

      status:
        'ACTIVE',

      ...initial,

      totalSlots:
        initial.totalSlots ??
        minimumSlots
    });



  const [busy, setBusy] =
    useState(false);



  const set = (k) => (e) => {

    setF({
      ...f,
      [k]: e.target.value
    });
  };



  const go = async (e) => {

    e.preventDefault();



    const departmentName =
      f.departmentName.trim();

    const totalSlots =
      Number(f.totalSlots);



    if (!departmentName) {

      notify(
        'error',
        'Department name is required.'
      );

      return;
    }



    if (
      !Number.isInteger(
        totalSlots
      ) ||
      totalSlots < 1
    ) {

      notify(
        'error',
        'Total slots must be at least 1.'
      );

      return;
    }



    if (
      totalSlots <
      occupiedSlots
    ) {

      notify(
        'error',
        `Total slots cannot be less than occupied slots (${occupiedSlots}).`
      );

      return;
    }



    setBusy(true);



    const body = {

      departmentName,

      description:
        f.description,

      totalSlots,

      status:
        f.status

    };



    try {

      if (edit) {

        await api.adminUpdateDepartment(
          initial.departmentId,
          body
        );

      } else {

        await api.adminCreateDepartment(
          body
        );
      }



      notify(
        'success',
        'Department saved.'
      );



      await onDone();

      onClose();

    } catch {

      setBusy(false);
    }
  };



  return (

    <Modal
      title={
        edit
          ? 'Edit department'
          : 'Add department'
      }
      onClose={() =>
        !busy &&
        onClose()
      }
    >

      <form onSubmit={go}>

        <div className="mb-2">

          <label className="form-label">
            Name
          </label>

          <input
            className="form-control"
            required
            value={
              f.departmentName
            }
            onChange={set(
              'departmentName'
            )}
          />

        </div>



        <div className="mb-2">

          <label className="form-label">
            Description
          </label>

          <textarea
            className="form-control"
            rows={2}
            value={
              f.description ||
              ''
            }
            onChange={set(
              'description'
            )}
          />

        </div>



        <div className="row g-2 mb-2">

          <div className="col">

            <label className="form-label">
              Total slots
            </label>

            <input
              type="number"
              min={minimumSlots}
              step="1"
              className="form-control"
              required
              value={
                f.totalSlots
              }
              onChange={set(
                'totalSlots'
              )}
            />

            <div className="form-text">
              Minimum allowed:{' '}
              {minimumSlots}
            </div>

          </div>



          <div className="col">

            <label className="form-label">
              Status
            </label>

            <select
              className="form-select"
              value={
                f.status
              }
              onChange={set(
                'status'
              )}
            >

              <option>
                ACTIVE
              </option>

              <option>
                INACTIVE
              </option>

            </select>

          </div>

        </div>



        <div className="d-flex justify-content-end gap-2 mt-3">

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>



          <button
            className="btn btn-primary"
            disabled={busy}
          >

            <Busy busy={busy}>
              Save
            </Busy>

          </button>

        </div>

      </form>

    </Modal>
  );
}