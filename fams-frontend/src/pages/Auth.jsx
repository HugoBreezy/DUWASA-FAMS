import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HOME, useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { Busy } from '../ui.jsx';

const responseMessage = (error, fallback) => {
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) return data;

  if (
    typeof data?.message === 'string' &&
    data.message.trim()
  ) {
    return data.message;
  }

  if (
    typeof data?.error === 'string' &&
    data.error.trim()
  ) {
    return data.error;
  }

  return fallback;
};

function Shell({ title, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card card">

        <div className="auth-brand">
          <div className="fs-4 fw-bold">
            DUWASA FAMS
          </div>

          <div className="small opacity-75">
            DUWASA Field Application Management System
          </div>
        </div>

        <div className="card-body p-4">
          <h1 className="h5 mb-3">
            {title}
          </h1>

          {children}
        </div>

        <div className="card-footer bg-white text-center small">
          {footer}
        </div>

      </div>
    </div>
  );
}

export function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [f, setF] = useState({
    email: '',
    password: ''
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const successMessage = location.state?.success || '';

  if (isAuthenticated) {
    return (
      <Navigate
        to={HOME[user.role]}
        replace
      />
    );
  }

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setErr('');

    try {
      const u = await login(
        f.email,
        f.password
      );

      nav(
        HOME[u.role],
        { replace: true }
      );

    } catch (e2) {
      setErr(
        e2.message === 'role'
          ? 'Your account role could not be determined. Contact the system administrator.'
          : e2.response
            ? responseMessage(
                e2,
                e2.response.status === 401
                  ? 'Invalid email or password.'
                  : `Login failed (${e2.response.status}).`
              )
            : 'Cannot reach the server.'
      );

      setBusy(false);
    }
  };

  return (
    <Shell
      title="Sign in"
      footer={
        <>
          New student?{' '}
          <Link to="/register">
            Create an account
          </Link>
        </>
      }
    >

      <form onSubmit={submit}>

        {successMessage && (
          <div className="alert alert-success py-2">
            <i className="bi bi-check-circle me-2" />
            {successMessage}
          </div>
        )}

        {err && (
          <div className="alert alert-danger py-2">
            {err}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">
            Email
          </label>

          <input
            type="email"
            className="form-control"
            required
            autoFocus
            value={f.email}
            onChange={(e) =>
              setF({
                ...f,
                email: e.target.value
              })
            }
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Password
          </label>

          <input
            type="password"
            className="form-control"
            required
            value={f.password}
            onChange={(e) =>
              setF({
                ...f,
                password: e.target.value
              })
            }
          />
        </div>

        <button
          className="btn btn-primary w-100"
          disabled={busy}
        >
          <Busy busy={busy}>
            {busy
              ? 'Signing in...'
              : 'Sign in'}
          </Busy>
        </button>

      </form>

    </Shell>
  );
}

export function Register() {
  const nav = useNavigate();

  const [f, setF] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    password: ''
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.value
    });

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setErr('');

    try {
      await api.register(f);

      nav(
        '/login',
        {
          replace: true,
          state: {
            success:
              'Registration successful! Your account has been created. Please sign in to continue.'
          }
        }
      );

    } catch (e2) {
      setErr(
        e2.response
          ? responseMessage(
              e2,
              `Registration failed (${e2.response.status}). Check the details and try again.`
            )
          : 'Cannot reach the server.'
      );

      setBusy(false);
    }
  };

  return (
    <Shell
      title="Student registration"
      footer={
        <>
          Already registered?{' '}
          <Link to="/login">
            Sign in
          </Link>
        </>
      }
    >

      <form onSubmit={submit}>

        {err && (
          <div className="alert alert-danger py-2">
            {err}
          </div>
        )}

        <div className="row g-2 mb-3">

          <div className="col">
            <label className="form-label">
              First name
            </label>

            <input
              className="form-control"
              required
              value={f.fname}
              onChange={set('fname')}
            />
          </div>

          <div className="col">
            <label className="form-label">
              Last name
            </label>

            <input
              className="form-control"
              required
              value={f.lname}
              onChange={set('lname')}
            />
          </div>

        </div>

        <div className="mb-3">
          <label className="form-label">
            Email
          </label>

          <input
            type="email"
            className="form-control"
            required
            value={f.email}
            onChange={set('email')}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Phone
          </label>

          <input
            className="form-control"
            value={f.phone}
            onChange={set('phone')}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Password
          </label>

          <input
            type="password"
            className="form-control"
            required
            minLength={6}
            value={f.password}
            onChange={set('password')}
          />
        </div>

        <button
          className="btn btn-primary w-100"
          disabled={busy}
        >
          <Busy busy={busy}>
            {busy
              ? 'Creating account...'
              : 'Create account'}
          </Busy>
        </button>

      </form>

    </Shell>
  );
}