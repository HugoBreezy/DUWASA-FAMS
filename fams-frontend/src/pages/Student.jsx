import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, notify } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Busy, Empty, fmtDate, PageHeader, Spinner, Stat, StatusBadge, useNotifs, usePoll } from '../ui.jsx';
import { ApplicationTable } from './Shared.jsx';
import { LetterCard } from './Details.jsx';

const sortApps = (l) => [...l].sort((a, b) => b.applicationId - a.applicationId);

const BLOCKING_APPLICATION_STATUSES = [
  'DRAFT',
  'PENDING_HR_REVIEW',
  'PENDING_DEPARTMENT_REVIEW',
  'ACCEPTED',
];

const hasBlockingApplication = (apps = []) =>
  apps.some((a) => BLOCKING_APPLICATION_STATUSES.includes(a.status));

export function StudentApplications() {
  const { user } = useAuth();

  const { data, loading } = usePoll(
    () => api.studentApplications(user.studentId).then(sortApps),
    [user.studentId]
  );

  const canCreateNewApplication = !hasBlockingApplication(data || []);

  return (
    <>
      <PageHeader title="My Applications">
        {canCreateNewApplication && (
          <Link
            to="/student/apply"
            className="btn btn-primary btn-sm"
          >
            <i className="bi bi-plus-lg me-1" />
            New application
          </Link>
        )}
      </PageHeader>

      <div className="card">
        {loading && !data ? (
          <Spinner />
        ) : (
          <>
            {data?.some((a) => a.status === 'ACCEPTED') && (
              <div className="alert alert-success m-3 mb-0">
                Your field application has been accepted. You cannot create
                another application while this placement is active.
              </div>
            )}

            {!data?.some((a) => a.status === 'ACCEPTED') &&
              data?.some((a) =>
                ['PENDING_HR_REVIEW', 'PENDING_DEPARTMENT_REVIEW'].includes(
                  a.status
                )
              ) && (
                <div className="alert alert-info m-3 mb-0">
                  Your application is currently under review. You cannot create
                  another application until the current application is
                  completed or rejected.
                </div>
              )}

            <ApplicationTable
              apps={data}
              base="/student"
            />
          </>
        )}
      </div>
    </>
  );
}

export function StudentDashboard() {
  const { user } = useAuth();
  const { unread } = useNotifs();

  const { data: apps, loading } = usePoll(
    () => api.studentApplications(user.studentId).then(sortApps),
    [user.studentId]
  );

  const { data: st } = usePoll(
    () => api.getStudent(user.studentId),
    [user.studentId],
    60000
  );

  if (loading && !apps) return <Spinner />;

  const n = (f) => apps.filter(f).length;
  const cur = apps[0];

  const complete =
    st &&
    st.registrationNumber &&
    st.collegeName &&
    st.course &&
    st.yearOfStudy;

  return (
    <>
      <PageHeader title={`Welcome, ${user.fname || 'student'}`} />

      {st && !complete && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center">
          Complete your profile before applying for a field placement.
          <Link
            to="/student/profile"
            className="btn btn-sm btn-warning"
          >
            Complete profile
          </Link>
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-6 col-xl-3">
          <Stat
            icon="folder2-open"
            label="Total applications"
            value={apps.length}
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="hourglass-split"
            label="In review"
            value={n((a) => a.status.startsWith('PENDING'))}
            tone="#b58100"
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="check-circle"
            label="Accepted"
            value={n((a) => a.status === 'ACCEPTED')}
            tone="#198754"
          />
        </div>

        <div className="col-6 col-xl-3">
          <Stat
            icon="bell"
            label="Unread notifications"
            value={unread}
            tone="#DC3545"
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white fw-semibold">
          Current application
        </div>

        <div className="card-body">
          {!cur ? (
            <Empty icon="file-earmark-plus">
              You have not applied yet.

              <div className="mt-2">
                <Link
                  to="/student/apply"
                  className="btn btn-primary"
                >
                  Start field application
                </Link>
              </div>
            </Empty>
          ) : (
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div className="fw-semibold">
                  Department: {cur.department?.departmentName}
                </div>

                <div className="text-muted small">
                  {fmtDate(cur.startDate)} – {fmtDate(cur.endDate)}
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <StatusBadge status={cur.status} />

                <Link
                  className="btn btn-outline-primary btn-sm"
                  to={`/student/applications/${cur.applicationId}`}
                >
                  {cur.status === 'DRAFT'
                    ? 'Continue'
                    : 'View details'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function Apply() {
  const { user } = useAuth();
  const nav = useNavigate();

  const { data, loading } = usePoll(
    async () => ({
      st: await api.getStudent(user.studentId),
      deps: await api.departments(),
      apps: await api.studentApplications(user.studentId).then(sortApps),
    }),
    [user.studentId],
    60000
  );

  const [f, setF] = useState({
    departmentId: '',
    startDate: '',
    endDate: '',
    comments: '',
  });

  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Spinner />;

  const {
    st,
    deps,
    apps = [],
  } = data || {
    deps: [],
    apps: [],
  };

  const complete =
    st &&
    st.registrationNumber &&
    st.collegeName &&
    st.course &&
    st.yearOfStudy;

  const blockingApplication = apps.find((a) =>
    BLOCKING_APPLICATION_STATUSES.includes(a.status)
  );

  if (!complete) {
    return (
      <>
        <PageHeader title="Field Application" />

        <div className="alert alert-warning">
          Complete your academic profile first.{' '}
          <Link to="/student/profile">
            Go to profile
          </Link>
        </div>
      </>
    );
  }

  if (blockingApplication) {
    const isAccepted = blockingApplication.status === 'ACCEPTED';

    const isDraft = blockingApplication.status === 'DRAFT';

    return (
      <>
        <PageHeader title="Field Application" />

        <div className={`alert ${isAccepted ? 'alert-success' : 'alert-info'}`}>
          <h5 className="alert-heading">
            {isAccepted
              ? 'Application already accepted'
              : isDraft
                ? 'You already have a draft application'
                : 'Application currently under review'}
          </h5>

          <p className="mb-3">
            {isAccepted
              ? 'Your field placement application has already been accepted. You cannot create another application.'
              : isDraft
                ? 'You already have a draft application. Continue with that application instead of creating a new one.'
                : 'Your application is currently being processed. You cannot create another application while it is under review.'}
          </p>

          <Link
            to={`/student/applications/${blockingApplication.applicationId}`}
            className="btn btn-primary btn-sm"
          >
            {isDraft ? 'Continue application' : 'View application'}
          </Link>
        </div>
      </>
    );
  }

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.value,
    });

  const submit = async (e) => {
    e.preventDefault();

    if (f.endDate < f.startDate) {
      return notify(
        'warning',
        'End date cannot be before start date.'
      );
    }

    setBusy(true);

    try {
      const a = await api.createApplication({
        student: {
          studentId: user.studentId,
        },
        department: {
          departmentId: Number(f.departmentId),
        },
        startDate: f.startDate,
        endDate: f.endDate,
        comments: f.comments || null,
      });

      notify(
        'success',
        'Draft created. Upload your documents and submit.'
      );

      nav(`/student/applications/${a.applicationId}`);
    } catch {
      setBusy(false);
    }
  };

  const sel = deps.find(
    (d) => String(d.departmentId) === String(f.departmentId)
  );

  return (
    <>
      <PageHeader title="Field Application" />

      <div className="row g-3">
        <div className="col-lg-8">
          <form
            className="card"
            onSubmit={submit}
          >
            <div className="card-header bg-white fw-semibold">
              Step 1 of 3 · Department and training period
            </div>

            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">
                  DUWASA department
                </label>

                <select
                  className="form-select"
                  required
                  value={f.departmentId}
                  onChange={set('departmentId')}
                >
                  <option value="">
                    Select a department
                  </option>

                  {deps.map((d) => {
                    const free =
                      (d.totalSlots ?? 0) -
                      (d.occupiedSlots ?? 0);

                    return (
                      <option
                        key={d.departmentId}
                        value={d.departmentId}
                        disabled={d.status !== 'ACTIVE'}
                      >
                        {d.departmentName} — {free} slot(s) 
                        {d.status !== 'ACTIVE'
                          ? ` (${d.status})`
                          : ''}
                      </option>
                    );
                  })}
                </select>

                {sel?.description && (
                  <div className="form-text">
                    {sel.description}
                  </div>
                )}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label">
                    Start date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    required
                    value={f.startDate}
                    onChange={set('startDate')}
                  />
                </div>

                <div className="col-sm-6">
                  <label className="form-label">
                    End date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    required
                    min={f.startDate}
                    value={f.endDate}
                    onChange={set('endDate')}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Comments (optional)
                </label>

                <textarea
                  className="form-control"
                  rows={3}
                  value={f.comments}
                  onChange={set('comments')}
                />
              </div>

              <button
                className="btn btn-primary"
                disabled={busy}
              >
                <Busy busy={busy}>
                  {busy
                    ? 'Creating draft...'
                    : 'Save and continue'}
                </Busy>
              </button>
            </div>
          </form>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header bg-white fw-semibold">
              What happens next
            </div>

            <ol className="card-body small mb-0 ps-4">
              <li className="mb-2">
                Your draft is saved.
              </li>

              <li className="mb-2">
                Upload the required documents.
              </li>

              <li className="mb-2">
                Review the details and submit.
              </li>

              <li>
                HR reviews, then the department decides.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

export function PlacementLetters() {
  const { user } = useAuth();

  const { data, loading } = usePoll(
    async () => {
      const apps = (
        await api.studentApplications(user.studentId)
      ).filter((a) => a.status === 'ACCEPTED');

      return Promise.all(
        apps.map(async (a) => ({
          a,
          letter: await api
            .letterByApplication(
              a.applicationId,
              { silent: true }
            )
            .catch(() => null),
        }))
      );
    },
    [user.studentId]
  );

  return (
    <>
      <PageHeader title="Placement Letter" />

      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <div className="card">
          <Empty icon="file-earmark-pdf">
            Your placement letter appears here after a department
            accepts your application.
          </Empty>
        </div>
      ) : (
        data.map(({ a, letter }) => (
          <div
            className="card mb-3"
            key={a.applicationId}
          >
            <div className="card-body">
              <div className="mb-2 text-muted small">
                Application #{a.applicationId} ·{' '}
                {a.department?.departmentName}
              </div>

              {letter ? (
                <LetterCard
                  appId={a.applicationId}
                  letter={letter}
                />
              ) : (
                <span className="text-muted">
                  The letter is being prepared.
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
}