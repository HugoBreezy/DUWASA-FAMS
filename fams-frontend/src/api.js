import axios from 'axios';

const TOKEN_KEY = 'fams_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export const decodeJwt = (t) => {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return null; }
};
export const tokenExpired = (t) => { const p = decodeJwt(t); return !p || (p.exp && p.exp * 1000 < Date.now()); };

export const notify = (type, msg) => window.dispatchEvent(new CustomEvent('fams:toast', { detail: { type, msg } }));

export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '' });

http.interceptors.request.use((c) => {
  // Public auth endpoints must not inherit a stale token from a previous session.
  const t = c.skipAuth ? null : getToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  else if (c.headers?.Authorization) delete c.headers.Authorization;
  return c;
});

const serverMsg = (e) => { const m = e.response?.data?.message; return typeof m === 'string' && m.trim() ? m : null; };

// Pass { silent: true } in a request config to handle the error inline instead of showing a toast.
http.interceptors.response.use((r) => r, (err) => {
  const s = err.response?.status;
  if (!err.config?.silent) {
    const t = getToken();
    // Spring Security (no entry point configured) answers an invalid/expired token with 403, not 401.
    if (s === 401 || (s === 403 && t && tokenExpired(t))) {
      window.dispatchEvent(new Event('fams:logout'));
      notify('warning', 'Your session has expired. Please login again.');
    } else if (s === 403) notify('danger', 'You are not authorized to perform this action.');
    else if (s === 404) notify('warning', 'Requested information was not found.');
    else if (s === 400) notify('warning', serverMsg(err) || 'The request was not accepted. Please check your input.');
    else if (s >= 500) notify('danger', serverMsg(err) || 'Something went wrong on the server. Please try again.');
    else if (!err.response) notify('danger', 'Cannot reach the server. Check your connection and the API URL.');
  }
  return Promise.reject(err);
});

const d = (p) => p.then((r) => r.data);

export const api = {
  // auth
  login: (email, password) => d(http.post('/api/users/login', { email, password }, { silent: true, skipAuth: true })),
  register: (body) => d(http.post('/api/users/register', body, { silent: true, skipAuth: true })),
  // students
  getStudent: (id) => d(http.get(`/api/students/${id}`)),
  saveProfile: (id, b) => d(http.put(`/api/students/${id}/profile`, b)),
  // departments
  departments: () => d(http.get('/api/departments')),
  // applications
  createApplication: (b) => d(http.post('/api/applications', b)),
  allApplications: () => d(http.get('/api/applications')),
  studentApplications: (sid) => d(http.get(`/api/applications/student/${sid}`)),
  application: (id) => d(http.get(`/api/applications/${id}`)),
  submit: (id) => d(http.post(`/api/applications/${id}/submit`)),
  hrReview: () => d(http.get('/api/applications/hr-review')),
  validate: (id, cfg) => d(http.post(`/api/applications/${id}/validate`, null, cfg)),
  checkRequirements: (id, cfg) => d(http.post(`/api/applications/${id}/check-requirements`, null, cfg)),
  availableSlot: (id, cfg) => d(http.get(`/api/applications/${id}/available-slot`, cfg)),
  forward: (id, cfg) => d(http.post(`/api/applications/${id}/forward-to-department`, null, cfg)),
  rejectByHr: (id, reason) => d(http.post(`/api/applications/${id}/reject-by-hr`, null, { params: { reason } })),
  // documents
  documents: (appId) => d(http.get('/api/application-documents')).then((l) => l.filter((x) => x.application?.applicationId === Number(appId))),
  upload: (applicationId, documentType, file) => {
    const f = new FormData();
    f.append('applicationId', applicationId); f.append('documentType', documentType); f.append('file', file);
    return d(http.post('/api/application-documents/upload', f));
  },
  verifyDocument: (id, verificationStatus) => d(http.patch(`/api/application-documents/${id}/verify`, null, { params: { verificationStatus } })),
  deleteDocument: (id) => http.delete(`/api/application-documents/${id}`),
  history: (appId) => d(http.get(`/api/application-history/application/${appId}`)),
  // coordinator
  coordApplications: (id) => d(http.get(`/api/department-coordinators/${id}/applications`)),
  availablePositions: (appId) => d(http.get(`/api/department-coordinators/applications/${appId}/available-positions`)),
  accept: (appId) => d(http.post(`/api/department-coordinators/applications/${appId}/accept`)),
  rejectByDept: (appId, reason) => d(http.post(`/api/department-coordinators/applications/${appId}/reject`, null, { params: { reason } })),
  // notifications
  notifications: (uid) => d(http.get(`/api/notifications/user/${uid}`)),
  markRead: (id) => d(http.patch(`/api/notifications/${id}/read`)),
  // placement letters
  letterByApplication: (appId, cfg) => d(http.get(`/api/placement-letters/application/${appId}`, cfg)),
  // admin
  adminUsers: () => d(http.get('/api/admin/users')),
  adminUpdateUser: (id, b) => d(http.put(`/api/admin/users/${id}`, b)),
  adminRole: (id, role) => d(http.patch(`/api/admin/users/${id}/role`, null, { params: { role } })),
  adminDeleteUser: (id) => http.delete(`/api/admin/users/${id}`),
  hrOfficers: () => d(http.get('/api/admin/hr-officers')),
  createHr: (b) => d(http.post('/api/admin/hr-officers', b)),
  adminDepartments: () => d(http.get('/api/admin/departments')),
  adminCreateDepartment: (b) => d(http.post('/api/admin/departments', b)),
  adminUpdateDepartment: (id, b) => d(http.put(`/api/admin/departments/${id}`, b)),
  adminDepartmentStatus: (id, status) => d(http.patch(`/api/admin/departments/${id}/status`, null, { params: { status } })),
  adminDeleteDepartment: (id) => http.delete(`/api/admin/departments/${id}`),
  coordinatorUsers: () => d(http.get('/api/admin/department-coordinators')),
  createCoordinator: (b) => d(http.post('/api/admin/department-coordinators', b)),
};

// Placement letter PDFs need the Authorization header, so fetch as a blob and open/save locally.
export async function openLetter(appId, download = false, fileName = 'placement-letter.pdf') {
  const { data } = await http.get(`/api/placement-letters/application/${appId}/${download ? 'download' : 'view'}`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  if (download) {
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } else window.open(url, '_blank');
}
