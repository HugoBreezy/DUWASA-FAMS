import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api.js';

export default function TrackApplication() {
  const navigate = useNavigate();

  const [trackNumber, setTrackNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const searchApplication = async (e) => {
    e.preventDefault();

    const value = trackNumber.trim();

    if (!value) {
      setError('Please enter your Track Number.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const application =
        await api.getApplicationByTrackNumber(value);

      if (!application?.applicationId) {
        setError('Application not found.');
        return;
      }

      /*
       * Use the existing Application Details page.
       * This means the same status and timeline are shown.
       */
      navigate(
        `/student/applications/${application.applicationId}`
      );
    } catch (err) {
      const status = err.response?.status;

      if (status === 404) {
        setError(
          'No application was found with this Track Number.'
        );
      } else if (status === 403) {
        setError(
          'You are not authorized to view this application.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to find the application. Please try again.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{`
        .track-page {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #f5f9fc;
        }

        .track-card {
          width: 100%;
          max-width: 650px;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 10px 35px rgba(0, 70, 100, 0.10);
          border: 1px solid #e5eef4;
          overflow: hidden;
        }

        .track-header {
          background: linear-gradient(
            135deg,
            #064b6b,
            #087fa5
          );
          color: white;
          padding: 32px;
          text-align: center;
        }

        .track-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.16);
          font-size: 28px;
        }

        .track-header h1 {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .track-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .track-body {
          padding: 32px;
        }

        .track-label {
          display: block;
          font-weight: 600;
          color: #163b4d;
          margin-bottom: 8px;
        }

        .track-input {
          width: 100%;
          height: 52px;
          border: 1px solid #cedde6;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 15px;
          color: #173b4c;
          outline: none;
          transition: 0.2s ease;
          text-transform: uppercase;
        }

        .track-input:focus {
          border-color: #087fa5;
          box-shadow: 0 0 0 3px rgba(8, 127, 165, 0.12);
        }

        .track-button {
          width: 100%;
          height: 52px;
          margin-top: 18px;
          border: none;
          border-radius: 10px;
          background: #087fa5;
          color: white;
          font-size: 15px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .track-button:hover:not(:disabled) {
          background: #066b8b;
        }

        .track-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .track-error {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 9px;
          background: #fff1f1;
          border: 1px solid #f3caca;
          color: #a52828;
          font-size: 14px;
        }

        .track-help {
          margin-top: 22px;
          padding: 15px;
          border-radius: 10px;
          background: #f1f8fb;
          color: #45606e;
          font-size: 13px;
          line-height: 1.6;
        }

        .track-example {
          display: inline-block;
          margin-top: 6px;
          font-weight: 600;
          color: #087fa5;
          letter-spacing: 0.3px;
        }

        @media (max-width: 576px) {
          .track-page {
            padding: 20px 14px;
          }

          .track-header {
            padding: 26px 20px;
          }

          .track-body {
            padding: 24px 20px;
          }

          .track-header h1 {
            font-size: 22px;
          }
        }
      `}</style>

      <div className="track-page">
        <div className="track-card">
          <div className="track-header">
            <div className="track-icon">
              <i className="bi bi-search" />
            </div>

            <h1>Track Your Application</h1>

            <p>
              Enter your Track Number to view your
              application status.
            </p>
          </div>

          <div className="track-body">
            <form onSubmit={searchApplication}>
              <label className="track-label">
                Track Number
              </label>

              <input
                type="text"
                className="track-input"
                placeholder="DUWASA-TRK-2026-000001"
                value={trackNumber}
                onChange={(e) => {
                  setTrackNumber(
                    e.target.value.toUpperCase()
                  );

                  if (error) {
                    setError('');
                  }
                }}
                maxLength={50}
                autoComplete="off"
              />

              <button
                type="submit"
                className="track-button"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2" />
                    Track Application
                  </>
                )}
              </button>

              {error && (
                <div className="track-error">
                  <i className="bi bi-exclamation-circle me-2" />
                  {error}
                </div>
              )}
            </form>

            <div className="track-help">
              <strong>
                Where can I find my Track Number?
              </strong>

              <br />

              Your Track Number is generated automatically
              when your field application is created.

              <br />

              <span className="track-example">
                Example: DUWASA-TRK-2026-000001
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}