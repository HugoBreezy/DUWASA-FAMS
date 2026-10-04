import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Busy, Empty, Field, fmtDate, fmtDateTime, fullName, PageHeader, ROLE_LABEL, Spinner, StatusBadge, useNotifs, usePoll } from '../ui.jsx';

export function ApplicationTable({ apps, base, showStudent }) {
  if (!apps?.length) return <Empty icon="folder2-open">No applications to show.</Empty>;
  return (
    <div className="table-responsive"><table className="table table-hover align-middle mb-0">
      <thead className="table-light"><tr><th>ID</th>{showStudent && <th>Student</th>}<th>Department</th><th>Applied</th><th>Period</th><th>Status</th><th /></tr></thead>
      <tbody>{apps.map((a) => (
        <tr key={a.applicationId}>
          <td>#{a.applicationId}</td>
          {showStudent && <td>{fullName(a.student?.user)}<div className="text-muted small">{a.student?.registrationNumber}</div></td>}
          <td>{a.department?.departmentName}</td><td>{fmtDate(a.applicationDate)}</td>
          <td className="text-nowrap">{fmtDate(a.startDate)} – {fmtDate(a.endDate)}</td>
          <td><StatusBadge status={a.status} /></td>
          <td className="text-end"><Link className="btn btn-sm btn-outline-primary" to={`${base}/applications/${a.applicationId}`}>Open</Link></td>
        </tr>))}</tbody>
    </table></div>
  );
}

export function Notifications() {
  const { list, loading, reload, unread } = useNotifs();
  const [busy, setBusy] = useState(null);

  const read = async (n) => {
    setBusy(n.notificationId);
    try {
      await api.markRead(n.notificationId);
      await reload();
    } finally {
      setBusy(null);
    }
  };

  const readAll = async () => {
    setBusy('all');
    try {
      await Promise.all(
        list
          .filter((n) => n.status === 'UNREAD')
          .map((n) => api.markRead(n.notificationId))
      );
      await reload();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Notifications">
        {unread > 0 && (
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={busy === 'all'}
            onClick={readAll}
          >
            <Busy busy={busy === 'all'}>Mark all as read</Busy>
          </button>
        )}
      </PageHeader>

      <div className="card">
        {loading && !list.length ? (
          <Spinner />
        ) : !list.length ? (
          <Empty icon="bell">You have no notifications yet.</Empty>
        ) : (
          <ul className="list-group list-group-flush">
            {list.map((n) => (
              <li
                key={n.notificationId}
                className={`list-group-item d-flex justify-content-between align-items-start gap-3 ${
                  n.status === 'UNREAD' ? 'bg-light' : ''
                }`}
              >
                <div>
                  <div className={n.status === 'UNREAD' ? 'fw-semibold' : ''}>
                    {n.message}
                  </div>

                  <div className="text-muted small">
                    {fmtDateTime(n.sentDate)}
                    {n.application && <> · Application #{n.application.applicationId}</>}
                  </div>
                </div>

                {n.status === 'UNREAD' && (
                  <button
                    className="btn btn-sm btn-outline-primary text-nowrap"
                    disabled={busy === n.notificationId}
                    onClick={() => read(n)}
                  >
                    <Busy busy={busy === n.notificationId}>
                      Mark as read
                    </Busy>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function Profile() {
  const { user } = useAuth();
  const isStudent = user.role === 'STUDENT';

  const { data: st, loading, reload } = usePoll(
    () => (isStudent ? api.getStudent(user.studentId) : null),
    [user.studentId],
    60000
  );

  /*
   * Load the student's applications so we can determine
   * whether academic profile editing is still allowed.
   */
  const { data: applications, loading: applicationsLoading } = usePoll(
    () => (isStudent ? api.studentApplications(user.studentId) : null),
    [user.studentId],
    60000
  );

  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);

  const complete =
    st?.registrationNumber &&
    st?.collegeName &&
    st?.course &&
    st?.yearOfStudy;

  /*
   * Academic information can only be edited when there is:
   *
   * - No application yet
   * - A DRAFT application
   * - A rejected application that can be corrected/re-applied
   *
   * Once the application reaches HR review,
   * department review, or ACCEPTED, academic information
   * must remain locked.
   */
  const lockedStatuses = [
    'PENDING_HR_REVIEW',
    'PENDING_DEPARTMENT_REVIEW',
    'ACCEPTED'
  ];

  const hasLockedApplication = (applications || []).some(
    (application) => lockedStatuses.includes(application.status)
  );

  const canEditAcademicProfile =
    isStudent &&
    !hasLockedApplication;

  const start = () => {
    if (!canEditAcademicProfile) return;

    setF({
      registrationNumber: st?.registrationNumber || '',
      collegeName: st?.collegeName || '',
      course: st?.course || '',
      yearOfStudy: st?.yearOfStudy || ''
    });

    setEdit(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (!canEditAcademicProfile) return;

    setBusy(true);

    try {
      await api.saveProfile(user.studentId, {
        ...f,
        yearOfStudy: Number(f.yearOfStudy)
      });

      await reload();
      setEdit(false);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.value
    });

  return (
    <>
      <PageHeader title="My Profile" />

      <div className="row g-3">

        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header bg-white fw-semibold">
              Account
            </div>

            <div className="card-body">
              <Field label="Name" value={fullName(user)} />
              <Field label="Email" value={user.email} />
              <Field label="Phone" value={user.phone || '—'} />
              <Field label="Role" value={ROLE_LABEL[user.role]} />

              {user.department && (
                <Field
                  label="Department"
                  value={user.department.departmentName}
                />
              )}
            </div>
          </div>
        </div>

        {isStudent && (
          <div className="col-lg-7">
            <div className="card h-100">

              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <span className="fw-semibold">
                  Academic information
                </span>

                {st &&
                  !edit &&
                  canEditAcademicProfile && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={start}
                    >
                      {complete ? 'Edit profile' : 'Complete profile'}
                    </button>
                  )}
              </div>

              <div className="card-body">

                {(loading || applicationsLoading) && !st ? (
                  <Spinner />
                ) : edit ? (

                  <form onSubmit={save}>

                    <div className="mb-3">
                      <label className="form-label">
                        Registration number
                      </label>

                      <input
                        className="form-control"
                        required
                        value={f.registrationNumber}
                        onChange={set('registrationNumber')}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        College
                      </label>

                      <input
                        className="form-control"
                        required
                        value={f.collegeName}
                        onChange={set('collegeName')}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Course
                      </label>

                      <input
                        className="form-control"
                        required
                        value={f.course}
                        onChange={set('course')}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Year of study
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="form-control"
                        required
                        value={f.yearOfStudy}
                        onChange={set('yearOfStudy')}
                      />
                    </div>

                    <button
                      className="btn btn-primary me-2"
                      disabled={busy}
                    >
                      <Busy busy={busy}>
                        {busy ? 'Saving...' : 'Save profile'}
                      </Busy>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={busy}
                      onClick={() => setEdit(false)}
                    >
                      Cancel
                    </button>

                  </form>

                ) : (

                  <>

                    {!complete && (
                      <div className="alert alert-warning py-2">
                        Your profile is incomplete. Complete it before applying.
                      </div>
                    )}

                    {hasLockedApplication && (
                      <div className="alert alert-info py-2">
                        Your academic information is locked because your
                        application is currently under review or has already
                        been accepted.
                      </div>
                    )}

                    <Field
                      label="Registration number"
                      value={st?.registrationNumber}
                    />

                    <Field
                      label="College"
                      value={st?.collegeName}
                    />

                    <Field
                      label="Course"
                      value={st?.course}
                    />

                    <Field
                      label="Year of study"
                      value={st?.yearOfStudy}
                    />

                  </>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}