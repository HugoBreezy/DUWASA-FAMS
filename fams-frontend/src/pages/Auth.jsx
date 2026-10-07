import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HOME, useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { Busy } from '../ui.jsx';

const responseMessage = (error, fallback) => {
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) return data;

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  return fallback;
};

const validateEmail = (email) => {
  const value = email.trim();

  if (!/^[a-z]/.test(value)) {
    return 'Email must start with a lowercase letter.';
  }

  if (/[A-Z]/.test(value)) {
    return 'Email must use lowercase letters only.';
  }

  if (!/^[a-z][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) {
    return 'Please enter a valid email address.';
  }

  return '';
};

const validatePhone = (phone) => {
  const value = phone.trim();

  if (!/^\d{9}$/.test(value)) {
    return 'Phone number must contain exactly 9 digits.';
  }

  return '';
};

const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  if (!/^[A-Z]/.test(password)) {
    return 'Password must start with a capital letter.';
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(password)) {
    return 'Password must contain at least one special character.';
  }

  if (password.toLowerCase().includes('password')) {
    return 'The word "password" cannot be used in your password.';
  }

  return '';
};

const blockPasswordClipboard = (e) => {
  e.preventDefault();
};

function Shell({ title, children, footer }) {
  return (
    <>
      <style>{`
        .fams-auth-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background:
            radial-gradient(circle at 15% 20%, rgba(255,255,255,0.24), transparent 22%),
            radial-gradient(circle at 85% 15%, rgba(255,255,255,0.18), transparent 20%),
            linear-gradient(145deg, #043f5f 0%, #056b91 42%, #0b8db0 72%, #42b9cf 100%);
        }

        .fams-auth-page::before {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          top: -170px;
          left: -120px;
        }

        .fams-auth-page::after {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          right: -180px;
          bottom: -230px;
        }

        .fams-water {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .fams-bubble {
          position: absolute;
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          box-shadow:
            inset 0 0 12px rgba(255,255,255,0.12),
            0 0 18px rgba(255,255,255,0.08);
          animation: famsFloat 7s ease-in-out infinite;
        }

        .fams-bubble.one {
          width: 22px;
          height: 22px;
          left: 12%;
          top: 20%;
        }

        .fams-bubble.two {
          width: 42px;
          height: 42px;
          right: 14%;
          top: 27%;
          animation-delay: 1.5s;
        }

        .fams-bubble.three {
          width: 16px;
          height: 16px;
          right: 25%;
          bottom: 23%;
          animation-delay: 2.5s;
        }

        .fams-bubble.four {
          width: 30px;
          height: 30px;
          left: 20%;
          bottom: 18%;
          animation-delay: 3.5s;
        }

        @keyframes famsFloat {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.55;
          }

          50% {
            transform: translateY(-22px);
            opacity: 0.9;
          }
        }

        .fams-wave {
          position: absolute;
          left: -5%;
          bottom: -55px;
          width: 110%;
          height: 150px;
          background: rgba(255,255,255,0.12);
          border-radius: 50% 50% 0 0 / 35% 35% 0 0;
          transform: rotate(-2deg);
        }

        .fams-wave.wave-two {
          bottom: -85px;
          background: rgba(255,255,255,0.09);
          transform: rotate(2deg);
        }

        .fams-auth-card {
          width: 100%;
          max-width: 475px;
          position: relative;
          z-index: 5;
          border: 1px solid rgba(255,255,255,0.35) !important;
          border-radius: 20px !important;
          overflow: hidden;
          background: rgba(255,255,255,0.96) !important;
          box-shadow:
            0 25px 70px rgba(0,35,55,0.32),
            0 8px 25px rgba(0,0,0,0.12);
          backdrop-filter: blur(12px);
        }

        .fams-auth-brand {
          position: relative;
          padding: 30px 32px;
          color: white;
          overflow: hidden;
          background:
            linear-gradient(135deg, #03587b 0%, #087da2 55%, #12a0bd 100%);
        }

        .fams-auth-brand::after {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          right: -70px;
          top: -110px;
          background: rgba(255,255,255,0.10);
        }

        .fams-brand-title {
          position: relative;
          z-index: 2;
          letter-spacing: 0.5px;
        }

        .fams-brand-subtitle {
          position: relative;
          z-index: 2;
          margin-top: 5px;
          color: rgba(255,255,255,0.82);
        }

        .fams-auth-body {
          padding: 28px 32px !important;
        }

        .fams-auth-title {
          color: #063f5c;
          font-weight: 700;
          margin-bottom: 24px;
        }

        .fams-auth-label {
          color: #174e67;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .fams-auth-input {
          min-height: 48px;
          border: 1px solid #c9dfe8 !important;
          border-radius: 10px !important;
          background: #f8fcfe !important;
          padding: 11px 14px !important;
          transition: all 0.2s ease;
        }

        .fams-auth-input:focus {
          border-color: #0783a7 !important;
          box-shadow: 0 0 0 4px rgba(7,131,167,0.12) !important;
          background: white !important;
        }

        .fams-phone-group {
          display: flex;
          align-items: stretch;
        }

        .fams-phone-prefix {
          min-width: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #c9dfe8;
          border-right: none;
          border-radius: 10px 0 0 10px;
          background: #eaf6fa;
          color: #174e67;
          font-weight: 700;
          padding: 0 12px;
        }

        .fams-phone-input {
          border-radius: 0 10px 10px 0 !important;
        }

        .fams-password-group {
          position: relative;
        }

        .fams-password-input {
          padding-right: 52px !important;
        }

        .fams-password-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #4f7483;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 3;
        }

        .fams-password-toggle:hover {
          background: #e7f4f8;
          color: #057ba0;
        }

        .fams-auth-button {
          min-height: 48px;
          border: none !important;
          border-radius: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.2px;
          background: linear-gradient(135deg, #05698d, #0a9cbd) !important;
          box-shadow: 0 8px 18px rgba(5,105,141,0.22);
          transition: all 0.2s ease;
        }

        .fams-auth-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 11px 22px rgba(5,105,141,0.28);
        }

        .fams-auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .fams-auth-footer {
          padding: 16px 24px !important;
          background: #f7fbfd !important;
          border-top: 1px solid #e0edf2 !important;
          color: #55707d;
        }

        .fams-auth-footer a {
          color: #057ba0;
          font-weight: 600;
          text-decoration: none;
        }

        .fams-auth-footer a:hover {
          text-decoration: underline;
        }

        .fams-alert {
          border-radius: 10px !important;
          border: none !important;
        }

        .fams-validation-help {
          margin-top: 6px;
          font-size: 12px;
          color: #6a8490;
        }

        @media (max-width: 576px) {
          .fams-auth-page {
            padding: 20px 14px;
          }

          .fams-auth-card {
            max-width: 100%;
            border-radius: 16px !important;
          }

          .fams-auth-brand {
            padding: 25px 24px;
          }

          .fams-auth-body {
            padding: 25px 22px !important;
          }
        }
      `}</style>

      <div className="fams-auth-page">
        <div className="fams-water">
          <span className="fams-bubble one" />
          <span className="fams-bubble two" />
          <span className="fams-bubble three" />
          <span className="fams-bubble four" />
          <div className="fams-wave" />
          <div className="fams-wave wave-two" />
        </div>

        <div className="fams-auth-card card">
          <div className="fams-auth-brand">
            <div className="fams-brand-title fs-4 fw-bold">
              DUWASA FAMS
            </div>

            <div className="fams-brand-subtitle small">
              DUWASA Field Application Management System
            </div>
          </div>

          <div className="card-body fams-auth-body">
            {title && (
              <h1 className="h5 fams-auth-title">
                {title}
              </h1>
            )}

            {children}
          </div>

          <div className="card-footer fams-auth-footer text-center small">
            {footer}
          </div>
        </div>
      </div>
    </>
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
  const [showPassword, setShowPassword] = useState(false);

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
        f.email.trim().toLowerCase(),
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
            ? (
                e2.response.status === 401 ||
                e2.response.status === 403
              )
              ? 'Invalid email or password. Please check your email and password and try again.'
              : responseMessage(
                  e2,
                  `Login failed (${e2.response.status}).`
                )
            : 'Cannot reach the server.'
      );

      setBusy(false);
    }
  };

  return (
    <Shell
      title=""
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
          <div className="alert alert-success py-2 fams-alert mb-3">
            <i className="bi bi-check-circle me-2" />
            {successMessage}
          </div>
        )}

        {err && (
          <div className="alert alert-danger py-2 fams-alert mb-3">
            {err}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label fams-auth-label">
            Email
          </label>

          <input
            type="email"
            className="form-control fams-auth-input"
            required
            autoFocus
            value={f.email}
            onChange={(e) =>
              setF({
                ...f,
                email: e.target.value.toLowerCase()
              })
            }
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-4">
          <label className="form-label fams-auth-label">
            Password
          </label>

          <div className="fams-password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control fams-auth-input fams-password-input"
              required
              value={f.password}
              onChange={(e) =>
                setF({
                  ...f,
                  password: e.target.value
                })
              }
              onPaste={blockPasswordClipboard}
              onCopy={blockPasswordClipboard}
              onCut={blockPasswordClipboard}
              onDrop={blockPasswordClipboard}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <button
              type="button"
              className="fams-password-toggle"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
              title={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              <i
                className={
                  showPassword
                    ? 'bi bi-eye-slash'
                    : 'bi bi-eye'
                }
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 fams-auth-button"
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
  const [showPassword, setShowPassword] = useState(false);

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.value
    });

  const setEmail = (e) => {
    setF({
      ...f,
      email: e.target.value.toLowerCase()
    });
  };

  const setPhone = (e) => {
    const digits = e.target.value
      .replace(/\D/g, '')
      .slice(0, 9);

    setF({
      ...f,
      phone: digits
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    setErr('');

    const fname = f.fname.trim();
    const lname = f.lname.trim();
    const email = f.email.trim().toLowerCase();
    const phone = f.phone.trim();
    const password = f.password;

    if (!fname) {
      setErr('First name is required.');
      return;
    }

    if (!lname) {
      setErr('Last name is required.');
      return;
    }

    const emailError = validateEmail(email);

    if (emailError) {
      setErr(emailError);
      return;
    }

    const phoneError = validatePhone(phone);

    if (phoneError) {
      setErr(phoneError);
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setErr(passwordError);
      return;
    }

    setBusy(true);

    try {
      await api.register({
        fname,
        lname,
        email,
        phone: `+255${phone}`,
        password
      });

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
          <div className="alert alert-danger py-2 fams-alert">
            {err}
          </div>
        )}

        <div className="row g-2 mb-3">
          <div className="col">
            <label className="form-label fams-auth-label">
              First name
            </label>

            <input
              className="form-control fams-auth-input"
              required
              value={f.fname}
              onChange={set('fname')}
              placeholder="First name"
            />
          </div>

          <div className="col">
            <label className="form-label fams-auth-label">
              Last name
            </label>

            <input
              className="form-control fams-auth-input"
              required
              value={f.lname}
              onChange={set('lname')}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fams-auth-label">
            Email
          </label>

          <input
            type="email"
            className="form-control fams-auth-input"
            required
            value={f.email}
            onChange={setEmail}
            placeholder="Enter your email"
            autoComplete="email"
          />

          <div className="fams-validation-help">
            Example: john@gmail.com
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fams-auth-label">
            Phone
          </label>

          <div className="fams-phone-group">
            <div className="fams-phone-prefix">
              +255
            </div>

            <input
              type="tel"
              inputMode="numeric"
              className="form-control fams-auth-input fams-phone-input"
              required
              value={f.phone}
              onChange={setPhone}
              placeholder="712345678"
              maxLength={9}
            />
          </div>

          <div className="fams-validation-help">
            Enter exactly 9 digits.
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label fams-auth-label">
            Password
          </label>

          <div className="fams-password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control fams-auth-input fams-password-input"
              required
              minLength={8}
              value={f.password}
              onChange={set('password')}
              onPaste={blockPasswordClipboard}
              onCopy={blockPasswordClipboard}
              onCut={blockPasswordClipboard}
              onDrop={blockPasswordClipboard}
              placeholder="Create a password"
              autoComplete="new-password"
            />

            <button
              type="button"
              className="fams-password-toggle"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
              title={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              <i
                className={
                  showPassword
                    ? 'bi bi-eye-slash'
                    : 'bi bi-eye'
                }
              />
            </button>
          </div>

          <div className="fams-validation-help">
            Start with a capital letter and include at least one special character.
            The word "password" is not allowed.
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 fams-auth-button"
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