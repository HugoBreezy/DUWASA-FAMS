# DUWASA FAMS Frontend

React + Vite + Bootstrap 5 frontend for the DUWASA Field Application Management System (Spring Boot backend).

## Requirements
- Node.js 18+ and npm
- The Spring Boot backend running (default `http://localhost:8080`)

## Install and run
```bash
npm install
cp .env.example .env     # already provided as .env
npm run dev              # http://localhost:5173
npm run build            # production build in dist/
```

## Environment variables
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Leave **empty** in development (requests go to `/api`, proxied by Vite). For a production build on another origin, set the full backend URL. |
| `VITE_DEV_PROXY_TARGET` | Backend URL the Vite dev proxy forwards `/api` to. Default `http://localhost:8080`. |

The backend's security chain does not enable CORS (`@CrossOrigin` alone does not cover preflight requests that Spring Security blocks), so development uses the Vite proxy. A deployed build needs either a reverse proxy serving `/api` on the same origin, or `http.cors(...)` added to the backend.

## Authentication
`POST /api/users/login` returns only `{token, message}`, and the JWT contains only the email. There is no `/me` endpoint, so after login the app resolves the user's role and ids by probing role-restricted endpoints (`/api/students`, `/api/admin/users`, `/api/department-coordinators`, `/api/applications/hr-review`) and matching the email. The token is stored in `localStorage` and sent as `Authorization: Bearer <token>`. Spring answers invalid tokens with **403**, so the app treats a 403 with an expired token as "session expired".

## Roles and routes
| Role | Landing page | Pages |
|---|---|---|
| STUDENT | `/student/dashboard` | profile, apply, applications (+details), notifications, placement letter |
| HR_OFFICER | `/hr/dashboard` | pending applications, review/details, notifications, profile |
| DEPARTMENT_COORDINATOR | `/coordinator/dashboard` | forwarded applications, review/details, notifications, profile |
| SYSTEM_ADMIN | `/admin/dashboard` | users, HR officers, departments, coordinators, profile |

Routes are guarded by `RoleRoute`; a user opening another role's URL is redirected to their own dashboard.

## Live updates
The backend has no WebSocket/SSE, so the app polls every 15 s (applications, notifications, details) and pauses while the tab is hidden. Each poll is a single interval that is cleared on unmount.

## Status values (from the backend code)
`DRAFT`, `PENDING_HR_REVIEW`, `PENDING_DEPARTMENT_REVIEW`, `ACCEPTED`, `REJECTED_BY_HR`, `REJECTED_BY_DEPARTMENT`.

## Backend limitations found (not modified)
1. **Uploaded files are not stored.** `ApplicationDocumentService` saves only a DB record (file name, type, status). The app uploads for real (multipart), but documents cannot be viewed or downloaded.
2. **Error messages are hidden.** Services throw `RuntimeException` with no `@ControllerAdvice`, so the client gets a bare 500. HR checks therefore show reasons derived from the loaded documents. Adding `server.error.include-message=always` would let the UI show the real messages.
3. **No ownership checks.** Any student can call `/api/students` or `/api/applications/{id}`; the UI only filters to the student's own data.
4. **Admin cannot see coordinator→department links.** `/api/admin/department-coordinators` returns users only, and `/api/department-coordinators` is coordinator-only.
5. **HR officers have no self-lookup**, so their user id (needed for notifications) is read from `/api/notifications` once they have received one.
6. Document types are free text in the backend, so the upload form uses a text field.
7. Departments `POST/PUT/DELETE` on `/api/departments` are open to any authenticated user; the UI uses `/api/admin/departments` for admin work.

## Structure
```
src/api.js          axios instance, error handling, all endpoint functions
src/auth.jsx        AuthContext, identity resolution
src/ui.jsx          layout, sidebar/topbar, guards, modals, toasts, notifications, polling hook
src/pages/          Auth, Shared (profile, notifications, table), Details, Student, Staff (HR/coordinator), Admin
```
