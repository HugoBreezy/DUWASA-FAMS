import { Navigate, Route, Routes } from 'react-router-dom';
import { HOME, useAuth } from './auth.jsx';
import { RoleRoute } from './ui.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { Notifications, Profile } from './pages/Shared.jsx';
import ApplicationDetails from './pages/Details.jsx';
import { Apply, PlacementLetters, StudentApplications, StudentDashboard } from './pages/Student.jsx';
import { CoordinatorApplications, CoordinatorDashboard, HrApplications, HrDashboard } from './pages/Staff.jsx';
import { AdminDashboard, Coordinators, Departments, HrOfficers, Users } from './pages/Admin.jsx';

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const shared = (base) => (<>
    <Route path="notifications" element={<Notifications />} />
    <Route path="profile" element={<Profile />} />
    <Route path="applications/:id" element={<ApplicationDetails base={base} />} />
  </>);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student" element={<RoleRoute role="STUDENT" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="apply" element={<Apply />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="placement-letter" element={<PlacementLetters />} />
        {shared('/student')}
      </Route>
      <Route path="/hr" element={<RoleRoute role="HR_OFFICER" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HrDashboard />} />
        <Route path="applications" element={<HrApplications />} />
        {shared('/hr')}
      </Route>
      <Route path="/coordinator" element={<RoleRoute role="DEPARTMENT_COORDINATOR" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CoordinatorDashboard />} />
        <Route path="applications" element={<CoordinatorApplications />} />
        {shared('/coordinator')}
      </Route>
      <Route path="/admin" element={<RoleRoute role="SYSTEM_ADMIN" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="hr-officers" element={<HrOfficers />} />
        <Route path="departments" element={<Departments />} />
        <Route path="coordinators" element={<Coordinators />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? HOME[user.role] : '/login'} replace />} />
    </Routes>
  );
}
