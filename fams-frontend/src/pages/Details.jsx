import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, http, notify, openLetter } from '../api.js';
import { useAuth } from '../auth.jsx';
import {
  Busy,
  Confirm,
  Empty,
  Field,
  fmtDate,
  fmtDateTime,
  fullName,
  ReasonModal,
  Spinner,
  StatusBadge,
  usePoll
} from '../ui.jsx';

const VERIF = {
  PENDING: 'warning text-dark',
  VERIFIED: 'success',
  REJECTED: 'danger'
};

const MAX = 1024 * 1024;

/* =========================================================
   DOCUMENT VIEW / DOWNLOAD
   ========================================================= */

async function openDocument(documentId, download = false, fileName = 'document') {
  const response = await http.get(
    `/api/application-documents/${documentId}/${download ? 'download' : 'view'}`,
    {
      responseType: 'blob'
    }
  );

  const blob = new Blob(
    [response.data],
    {
      type: response.headers['content-type'] || 'application/octet-stream'
    }
  );

  const url = URL.createObjectURL(blob);

  if (download) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);
  } else {
    window.open(url, '_blank');

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  }
}

/* =========================================================
   TIMELINE
   ========================================================= */

function Timeline({ app, letter }) {
  const s = app.status;

  const idx =
    s === 'REJECTED_BY_HR'
      ? 1
      : s === 'REJECTED_BY_DEPARTMENT'
        ? 2
        : ['DRAFT', 'PENDING_HR_REVIEW', 'PENDING_DEPARTMENT_REVIEW', 'ACCEPTED']
            .indexOf(s);

  const step = (label, state, note) => ({
    label,
    state,
    note
  });

  const steps = [
    step('Application created', 'done'),

    step(
      'Submitted',
      idx >= 1 ? 'done' : 'current'
    ),

    step(
      'HR review',
      s === 'REJECTED_BY_HR'
        ? 'failed'
        : idx >= 2
          ? 'done'
          : idx === 1
            ? 'current'
            : 'pending',
      s === 'REJECTED_BY_HR' && app.comments
    ),

    step(
      'Department review',
      s === 'REJECTED_BY_DEPARTMENT'
        ? 'failed'
        : idx >= 3
          ? 'done'
          : idx === 2
            ? 'current'
            : 'pending',
      s === 'REJECTED_BY_DEPARTMENT' && app.comments
    ),

    step(
      'Accepted',
      idx === 3 ? 'done' : 'pending'
    ),

    step(
      'Placement letter',
      letter ? 'done' : 'pending'
    ),
  ];

  return (
    <ul className="timeline">
      {steps.map((x) => (
        <li
          key={x.label}
          className={x.state}
        >
          <span className="dot" />

          <div
            className={
              x.state === 'current'
                ? 'fw-semibold'
                : ''
            }
          >
            {x.label}
          </div>

          {x.note && (
            <div className="small text-danger">
              Reason: {x.note}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/* =========================================================
   DOCUMENT LIST
   ========================================================= */

function DocList({
  docs,
  onDelete,
  onVerify,
  busyId,
  allowDownload = true
}) {
  const [busyAction, setBusyAction] = useState(null);

  if (!docs.length) {
    return (
      <Empty icon="file-earmark">
        No documents uploaded yet.
      </Empty>
    );
  }

  const handleDocumentAction = async (
    document,
    download
  ) => {
    const key =
      `${download ? 'download' : 'view'}-${document.documentId}`;

    setBusyAction(key);

    try {
      await openDocument(
        document.documentId,
        download,
        document.fileName
      );
    } catch (error) {
      notify(
        'danger',
        error.response?.data?.message ||
        'Could not open the document.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Type</th>
            <th>File</th>
            <th>Uploaded</th>
            <th>Verification</th>
            <th>Document</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {docs.map((d) => (
            <tr key={d.documentId}>
              <td>
                {d.documentType}
              </td>

              <td>
                <div
                  className="text-truncate"
                  style={{ maxWidth: 220 }}
                  title={d.fileName}
                >
                  <i className="bi bi-file-earmark me-1" />
                  {d.fileName}
                </div>
              </td>

              <td>
                {fmtDate(d.uploadDate)}
              </td>

              <td>
                <span
                  className={`badge bg-${
                    VERIF[d.verificationStatus] ||
                    'secondary'
                  }`}
                >
                  {d.verificationStatus}
                </span>
              </td>

              <td className="text-nowrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary me-1"
                  disabled={
                    busyAction ===
                    `view-${d.documentId}`
                  }
                  onClick={() =>
                    handleDocumentAction(d, false)
                  }
                >
                  <Busy
                    busy={
                      busyAction ===
                      `view-${d.documentId}`
                    }
                  >
                    <i className="bi bi-eye me-1" />
                    View
                  </Busy>
                </button>

                {allowDownload && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={
                      busyAction ===
                      `download-${d.documentId}`
                    }
                    onClick={() =>
                      handleDocumentAction(d, true)
                    }
                  >
                    <Busy
                      busy={
                        busyAction ===
                        `download-${d.documentId}`
                      }
                    >
                      <i className="bi bi-download me-1" />
                      Download
                    </Busy>
                  </button>
                )}
              </td>

              <td className="text-end text-nowrap">
                {onVerify && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-success me-1"
                      disabled={
                        busyId === d.documentId ||
                        d.verificationStatus === 'VERIFIED'
                      }
                      onClick={() =>
                        onVerify(d, 'VERIFIED')
                      }
                    >
                      Verify
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      disabled={
                        busyId === d.documentId ||
                        d.verificationStatus === 'REJECTED'
                      }
                      onClick={() =>
                        onVerify(d, 'REJECTED')
                      }
                    >
                      Reject
                    </button>
                  </>
                )}

                {onDelete && (
                  <button
                    className="btn btn-sm btn-outline-danger ms-1"
                    onClick={() =>
                      onDelete(d)
                    }
                  >
                    <i className="bi bi-trash" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   DOCUMENT UPLOAD
   ========================================================= */

function DocumentUpload({ appId, onDone }) {
  const type = 'APPLICATION_LETTER';

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const input = useRef();

  const pick = (e) => {
    const f = e.target.files[0];

    if (!f) {
      return setFile(null);
    }

    if (!/\.pdf$/i.test(f.name)) {
      notify(
        'warning',
        'Only PDF files are allowed.'
      );

      e.target.value = '';
      return setFile(null);
    }

    if (f.size > MAX) {
      notify(
        'warning',
        'File size must not exceed 1 MB.'
      );

      e.target.value = '';
      return setFile(null);
    }

    setFile(f);
  };

  const go = async (e) => {
    e.preventDefault();

    setBusy(true);

    try {
      await api.upload(
        appId,
        type,
        file
      );

      notify(
        'success',
        'Document uploaded.'
      );

      setFile(null);
      input.current.value = '';

      await onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={go}
      className="row g-2 align-items-end mb-3"
    >
      <div className="col-md-4">
        <label className="form-label">
          Document type
        </label>

        <input
          className="form-control"
          value="Application Letter"
          readOnly
        />
      </div>

      <div className="col-md-5">
        <label className="form-label">
          File (PDF max 1 MB)
        </label>

        <input
          ref={input}
          type="file"
          accept=".pdf"
          className="form-control"
          required
          onChange={pick}
        />
      </div>

      <div className="col-md-3">
        <button
          className="btn btn-primary w-100"
          disabled={
            busy ||
            !file
          }
        >
          <Busy busy={busy}>
            {busy
              ? 'Uploading Document...'
              : 'Upload document'}
          </Busy>
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   STUDENT ACTIONS
   ========================================================= */

function StudentActions({
  app,
  docs,
  reload
}) {
  const [dlg, setDlg] = useState(null);

  if (app.status !== 'DRAFT') {
    return null;
  }

  return (
    <div className="card mb-3 border-primary">
      <div className="card-header bg-white fw-semibold">
        Next step: upload documents and submit
      </div>

      <div className="card-body">
        <p className="text-muted small">
          Upload the required documents, review the
          details on this page, then submit. After
          submission, HR starts the review.
        </p>

        {!docs.length && (
          <DocumentUpload
            appId={app.applicationId}
            onDone={reload}
          />
        )}

        <DocList
          docs={docs}
          allowDownload={false}
          onDelete={(d) =>
            setDlg({ d })
          }
        />

        <button
          className="btn btn-primary mt-3"
          disabled={!docs.length}
          onClick={() =>
            setDlg({ submit: true })
          }
        >
          Submit application
        </button>

        {!docs.length && (
          <span className="text-muted small ms-2">
            Upload at least one document first.
          </span>
        )}

        {dlg?.d && (
          <Confirm
            danger
            title="Delete document"
            message={`Delete "${dlg.d.fileName}"?`}
            confirmText="Delete"
            onClose={() =>
              setDlg(null)
            }
            onConfirm={async () => {
              await api.deleteDocument(
                dlg.d.documentId
              );

              await reload();
            }}
          />
        )}

        {dlg?.submit && (
          <Confirm
            title="Submit application"
            message="Are you sure you want to submit this application? You will not be able to change it afterwards."
            confirmText="Submit"
            busyText="Submitting Application..."
            onClose={() =>
              setDlg(null)
            }
            onConfirm={async () => {
              await api.submit(
                app.applicationId
              );

              notify(
                'success',
                'Application submitted to HR for review.'
              );

              await reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   CHECK RESULT
   ========================================================= */

const Check = ({ r }) =>
  !r
    ? null
    : (
      <span
        className={`small ms-2 text-${
          r.ok
            ? 'success'
            : 'danger'
        }`}
      >
        <i
          className={`bi bi-${
            r.ok
              ? 'check-circle'
              : 'x-circle'
          } me-1`}
        />
        {r.msg}
      </span>
    );

/* =========================================================
   HR ACTIONS
   ========================================================= */

function HrActions({
  app,
  docs,
  reload,
  onVerify,
  busyDoc
}) {
  const id = app.applicationId;

  const q = {
    silent: true
  };

  const [res, setRes] = useState({});
  const [busy, setBusy] = useState('');
  const [dlg, setDlg] = useState(null);

  const run = async (
    key,
    fn,
    ok,
    fail
  ) => {
    setBusy(key);

    try {
      const r = await fn();

      setRes((x) => ({
        ...x,
        [key]: {
          ok: true,
          msg: ok(r)
        }
      }));

      return true;
    } catch {
      setRes((x) => ({
        ...x,
        [key]: {
          ok: false,
          msg: fail
        }
      }));

      return false;
    } finally {
      setBusy('');
    }
  };

  const reqFail =
    !docs.length
      ? 'No documents uploaded.'
      : docs.some(
          (d) =>
            d.verificationStatus === 'PENDING'
        )
        ? 'Some documents are still pending verification.'
        : docs.some(
            (d) =>
              d.verificationStatus === 'REJECTED'
          )
          ? 'Application contains rejected documents.'
          : 'Requirements are not met.';

  const checks = async () => {
    if (
      !(await run(
        'validate',
        () => api.validate(id, q),
        () =>
          'Application data is complete.',
        'Student, department or training dates are missing or invalid.'
      ))
    ) {
      return;
    }

    if (
      !(await run(
        'req',
        () =>
          api.checkRequirements(
            id,
            q
          ),
        () =>
          'Documents verified; requirements met.',
        reqFail
      ))
    ) {
      return;
    }

    await run(
      'slot',
      () =>
        api.availableSlot(
          id,
          q
        ),
      (n) =>
        `${n} slot(s) available.`,
      'No available slot in the selected department.'
    );
  };

  const allOk =
    res.validate?.ok &&
    res.req?.ok &&
    res.slot?.ok;

  const forward = async () => {
    try {
      await api.forward(
        id,
        q
      );

      notify(
        'success',
        'Application forwarded to the department.'
      );

      await reload();
    } catch {
      notify(
        'danger',
        'Could not forward. Re-run the checks; the department may also have no coordinator assigned.'
      );

      throw new Error('x');
    }
  };

  return (
    <>
      <div className="card mb-3">
        <div className="card-header bg-white fw-semibold">
          Document verification
        </div>

        <div className="card-body p-0">
          <DocList
            docs={docs}
            onVerify={onVerify}
            busyId={busyDoc}
          />
        </div>
      </div>

      <div className="card mb-3 border-primary">
        <div className="card-header bg-white fw-semibold">
          HR decision
        </div>

        <div className="card-body">
          <p className="text-muted small">
            Verify each document, then run the checks.
            Forward only when every check passes;
            otherwise reject with a reason.
          </p>

          <button
            className="btn btn-outline-primary mb-3"
            disabled={!!busy}
            onClick={checks}
          >
            <Busy busy={!!busy}>
              {busy
                ? 'Checking Requirements...'
                : 'Run checks'}
            </Busy>
          </button>

          <ul className="list-unstyled small mb-3">
            <li>
              Application data
              <Check r={res.validate} />
            </li>

            <li>
              Requirements and documents
              <Check r={res.req} />
            </li>

            <li>
              Department slots
              <Check r={res.slot} />
            </li>
          </ul>

          <button
            className="btn btn-success me-2"
            disabled={!allOk}
            onClick={() =>
              setDlg('fwd')
            }
          >
            Approve and forward to department
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={() =>
              setDlg('rej')
            }
          >
            Reject application
          </button>
        </div>
      </div>

      {dlg === 'fwd' && (
        <Confirm
          title="Forward application"
          message="Approve the HR review and forward this application to the department coordinator?"
          confirmText="Forward"
          busyText="Forwarding..."
          onClose={() =>
            setDlg(null)
          }
          onConfirm={forward}
        />
      )}

      {dlg === 'rej' && (
        <ReasonModal
          title="Reject application"
          confirmText="Reject application"
          busyText="Rejecting..."
          onClose={() =>
            setDlg(null)
          }
          onSubmit={async (r) => {
            await api.rejectByHr(
              id,
              r
            );

            notify(
              'success',
              'Application rejected. The student has been notified.'
            );

            await reload();
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   COORDINATOR ACTIONS
   ========================================================= */

function CoordActions({
  app,
  reload
}) {
  const [dlg, setDlg] = useState(null);

  const {
    data: pos,
    loading
  } = usePoll(
    () =>
      api.availablePositions(
        app.applicationId
      ),
    [app.applicationId],
    30000
  );

  return (
    <div className="card mb-3 border-primary">
      <div className="card-header bg-white fw-semibold">
        Department decision
      </div>

      <div className="card-body">
        <div className="mb-3">
          Available positions in{' '}
          {app.department?.departmentName}:
          {' '}

          {loading
            ? (
              <span className="spinner-border spinner-border-sm" />
            )
            : (
              <strong
                className={
                  pos > 0
                    ? 'text-success'
                    : 'text-danger'
                }
              >
                {pos}
              </strong>
            )}
        </div>

        <button
          className="btn btn-success me-2"
          disabled={!(pos > 0)}
          onClick={() =>
            setDlg('acc')
          }
        >
          Accept application
        </button>

        <button
          className="btn btn-outline-danger"
          onClick={() =>
            setDlg('rej')
          }
        >
          Reject application
        </button>

        {dlg === 'acc' && (
          <Confirm
            title="Accept application"
            message="Are you sure you want to accept this application? A placement letter will be generated and the student notified."
            confirmText="Accept"
            busyText="Accepting Application..."
            onClose={() =>
              setDlg(null)
            }
            onConfirm={async () => {
              await api.accept(
                app.applicationId
              );

              notify(
                'success',
                'Application accepted. Placement letter generated.'
              );

              await reload();
            }}
          />
        )}

        {dlg === 'rej' && (
          <ReasonModal
            title="Reject application"
            confirmText="Reject application"
            busyText="Rejecting..."
            onClose={() =>
              setDlg(null)
            }
            onSubmit={async (r) => {
              await api.rejectByDept(
                app.applicationId,
                r
              );

              notify(
                'success',
                'Application rejected. The student has been notified.'
              );

              await reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PLACEMENT LETTER
   ========================================================= */

export function LetterCard({
  appId,
  letter
}) {
  const [busy, setBusy] = useState('');

  const go = async (dl) => {
    setBusy(
      dl
        ? 'd'
        : 'v'
    );

    try {
      await openLetter(
        appId,
        dl,
        letter.fileName
      );
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div>
        <div className="fw-semibold">
          <i className="bi bi-file-earmark-pdf text-danger me-1" />
          {letter.letterNumber}
        </div>

        <div className="small text-muted">
          Issued {fmtDate(letter.issueDate)}
        </div>
      </div>

      <div>
        <button
          className="btn btn-outline-primary btn-sm me-2"
          disabled={!!busy}
          onClick={() =>
            go(false)
          }
        >
          <Busy busy={busy === 'v'}>
            View
          </Busy>
        </button>

        <button
          className="btn btn-primary btn-sm"
          disabled={!!busy}
          onClick={() =>
            go(true)
          }
        >
          <Busy busy={busy === 'd'}>
            Download
          </Busy>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   APPLICATION DETAILS
   ========================================================= */

export default function ApplicationDetails({
  base
}) {
  const { id } = useParams();

  const { user } = useAuth();

  const role = user.role;

  const [busyDoc, setBusyDoc] =
    useState(null);

  const {
    data,
    loading,
    reload
  } = usePoll(
    async () => {
      const app =
        await api.application(id);

      const [
        docs,
        hist,
        letter
      ] = await Promise.all([
        api.documents(id),
        api.history(id),
        app.status === 'ACCEPTED'
          ? api
              .letterByApplication(
                id,
                { silent: true }
              )
              .catch(() => null)
          : null
      ]);

      return {
        app,
        docs,
        hist,
        letter
      };
    },
    [id],
    15000
  );

  if (
    loading &&
    !data
  ) {
    return <Spinner />;
  }

  const back = (
    <Link
      to={`${base}/applications`}
      className="btn btn-link px-0 mb-2"
    >
      <i className="bi bi-arrow-left" />
      {' '}
      Back to applications
    </Link>
  );

  if (
    !data ||
    (
      role === 'STUDENT' &&
      data.app.student?.studentId !==
        user.studentId
    )
  ) {
    return (
      <>
        {back}

        <Empty icon="exclamation-circle">
          Application not found.
        </Empty>
      </>
    );
  }

  const {
    app,
    docs,
    hist,
    letter
  } = data;

  const st =
    app.student;

  const dep =
    app.department;

  const verify = async (
    d,
    status
  ) => {
    setBusyDoc(
      d.documentId
    );

    try {
      await api.verifyDocument(
        d.documentId,
        status
      );

      await reload();
    } finally {
      setBusyDoc(null);
    }
  };

  return (
    <>
      {back}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h4 mb-0">
          Application #{app.applicationId}
        </h1>

        <StatusBadge
          status={app.status}
        />
      </div>

      {role === 'STUDENT' && (
        <StudentActions
          app={app}
          docs={docs}
          reload={reload}
        />
      )}

      {role === 'HR_OFFICER' &&
        app.status === 'PENDING_HR_REVIEW' && (
          <HrActions
            app={app}
            docs={docs}
            reload={reload}
            onVerify={verify}
            busyDoc={busyDoc}
          />
        )}

      {role === 'DEPARTMENT_COORDINATOR' &&
        app.status === 'PENDING_DEPARTMENT_REVIEW' && (
          <CoordActions
            app={app}
            reload={reload}
          />
        )}

      <div className="row g-3 mb-3">
        <div className="col-md-6 col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white fw-semibold">
              Student information
            </div>

            <div className="card-body">
              <Field
                label="Name"
                value={fullName(st?.user)}
              />

              <Field
                label="Email"
                value={st?.user?.email}
              />

              <Field
                label="Phone"
                value={st?.user?.phone}
              />

              <hr />

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
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white fw-semibold">
              Application & department
            </div>

            <div className="card-body">
              <Field
                label="Department"
                value={dep?.departmentName}
              />

              <Field
                label="Department description"
                value={dep?.description}
              />

              <Field
                label="Slots"
                value={
                  dep
                    ? `${(dep.totalSlots ?? 0) - (dep.occupiedSlots ?? 0)} available of ${dep.totalSlots ?? 0}`
                    : null
                }
              />

              <hr />

              <Field
                label="Applied on"
                value={fmtDateTime(app.applicationDate)}
              />

              <Field
                label="Training period"
                value={`${fmtDate(app.startDate)} – ${fmtDate(app.endDate)}`}
              />

              <Field
                label="Comments"
                value={app.comments}
              />
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white fw-semibold">
              Status
            </div>

            <div className="card-body">
              <Timeline
                app={app}
                letter={letter}
              />
            </div>
          </div>
        </div>
      </div>

      {role !== 'HR_OFFICER' &&
        app.status !== 'DRAFT' && (
          <div className="card mb-3">
            <div className="card-header bg-white fw-semibold">
              Documents
            </div>

            <div className="card-body p-0">
              <DocList
                docs={docs}
              />
            </div>
          </div>
        )}

      {role === 'HR_OFFICER' &&
        app.status !== 'PENDING_HR_REVIEW' && (
          <div className="card mb-3">
            <div className="card-header bg-white fw-semibold">
              Documents
            </div>

            <div className="card-body p-0">
              <DocList
                docs={docs}
              />
            </div>
          </div>
        )}

      {app.status === 'ACCEPTED' && (
        <div className="card mb-3">
          <div className="card-header bg-white fw-semibold">
            Placement letter
          </div>

          <div className="card-body">
            {letter ? (
              <LetterCard
                appId={app.applicationId}
                letter={letter}
              />
            ) : (
              <span className="text-muted">
                The placement letter is not available yet.
              </span>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header bg-white fw-semibold">
          Application history
        </div>

        <div className="card-body">
          {!hist.length ? (
            <span className="text-muted">
              No history recorded yet.
            </span>
          ) : (
            <ul className="timeline">
              {[...hist]
                .sort(
                  (a, b) =>
                    new Date(a.actionDate) -
                    new Date(b.actionDate)
                )
                .map((h) => (
                  <li
                    key={h.historyId}
                    className="done"
                  >
                    <span className="dot" />

                    <div className="fw-semibold">
                      {h.action.replaceAll(
                        '_',
                        ' '
                      )}
                    </div>

                    <div className="small text-muted">
                      {fmtDateTime(
                        h.actionDate
                      )}
                    </div>

                    {h.comments && (
                      <div className="small">
                        {h.comments}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}