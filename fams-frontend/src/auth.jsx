import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, http, getToken, setToken, tokenExpired } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
const USER_KEY = 'fams_user';
const quiet = { silent: true };

export const HOME = { STUDENT: '/student/dashboard', HR_OFFICER: '/hr/dashboard', DEPARTMENT_COORDINATOR: '/coordinator/dashboard', SYSTEM_ADMIN: '/admin/dashboard' };

/**
 * The backend login returns only {token, message} and the JWT only carries the email.
 * There is no /me endpoint, so role and ids are resolved by probing role-restricted endpoints
 * (each returns 403 for other roles) and matching the logged-in email.
 */
async function resolveIdentity(email) {
  const same = (u) => u?.email?.toLowerCase() === email.toLowerCase();
  const base = (u) => ({ email, userId: u.userId, fname: u.fname, lname: u.lname, phone: u.phone, role: u.role });
  try {
    const list = (await http.get('/api/students', quiet)).data;
    const s = list.find((x) => same(x.user));
    if (s) return { ...base(s.user), role: 'STUDENT', studentId: s.studentId };
  } catch { /* not a student */ }
  try {
    const list = (await http.get('/api/admin/users', quiet)).data;
    const u = list.find(same);
    if (u) return base(u);
  } catch { /* not an admin */ }
  try {
    const list = (await http.get('/api/department-coordinators', quiet)).data;
    const c = list.find((x) => same(x.user));
    if (c) return { ...base(c.user), role: 'DEPARTMENT_COORDINATOR', coordinatorId: c.departmentCoordinatorId, department: c.department };
  } catch { /* not a coordinator */ }
  try {
    await http.get('/api/applications/hr-review', quiet); // HR_OFFICER only
    return { email, role: 'HR_OFFICER', userId: await findUserIdFromNotifications(email) };
  } catch { return null; }
}

// HR officers have no endpoint that returns their own user record. Notifications embed the user,
// so the id can be found once HR has received a notification.
export async function findUserIdFromNotifications(email) {
  try {
    const all = (await http.get('/api/notifications', quiet)).data;
    return all.find((n) => n.user?.email?.toLowerCase() === email.toLowerCase())?.user?.userId ?? null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setTok] = useState(() => { const t = getToken(); return t && !tokenExpired(t) ? t : null; });
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } });

  const logout = useCallback(() => { setToken(null); localStorage.removeItem(USER_KEY); setTok(null); setUser(null); }, []);

  useEffect(() => {
    window.addEventListener('fams:logout', logout);
    return () => window.removeEventListener('fams:logout', logout);
  }, [logout]);

  const login = async (email, password) => {
    const { token: t } = await api.login(email.trim(), password);
    setToken(t);
    const id = await resolveIdentity(email.trim());
    if (!id) { setToken(null); throw new Error('role'); }
    localStorage.setItem(USER_KEY, JSON.stringify(id));
    setTok(t); setUser(id);
    return id;
  };

  const patchUser = useCallback((p) => setUser((u) => { const n = { ...u, ...p }; localStorage.setItem(USER_KEY, JSON.stringify(n)); return n; }), []);

  const value = useMemo(() => ({
    user, token, login, logout, patchUser,
    isAuthenticated: !!token && !!user,
    hasRole: (...roles) => roles.includes(user?.role),
  }), [user, token, logout, patchUser]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
