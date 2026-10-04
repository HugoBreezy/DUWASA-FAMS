import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Empty, PageHeader, Spinner, Stat, usePoll } from '../ui.jsx';
import { ApplicationTable } from './Shared.jsx';

const byDate = (l) => [...l].sort((a, b) => new Date(a.applicationDate) - new Date(b.applicationDate));

export function HrDashboard() {
  const { data, loading } = usePoll(async () => ({ pending: await api.hrReview(), all: await api.allApplications() }));
  if (loading && !data) return <Spinner />;
  const { pending, all } = data; const n = (s) => all.filter((a) => a.status === s).length;
  return (
    <>
      <PageHeader title="HR Dashboard" />
      <div className="row g-3 mb-3">
        <div className="col-6 col-xl-3"><Stat icon="inbox" label="Awaiting HR review" value={pending.length} /></div>
        <div className="col-6 col-xl-3"><Stat icon="send" label="Forwarded to departments" value={n('PENDING_DEPARTMENT_REVIEW')} tone="#b58100" /></div>
        <div className="col-6 col-xl-3"><Stat icon="check-circle" label="Accepted" value={n('ACCEPTED')} tone="#198754" /></div>
        <div className="col-6 col-xl-3"><Stat icon="x-circle" label="Rejected" value={n('REJECTED_BY_HR') + n('REJECTED_BY_DEPARTMENT')} tone="#DC3545" /></div>
      </div>
      <div className="card"><div className="card-header bg-white fw-semibold">Oldest pending applications</div><ApplicationTable apps={byDate(pending).slice(0, 5)} base="/hr" showStudent /></div>
    </>
  );
}

export function HrApplications() {
  const { data, loading } = usePoll(() => api.hrReview().then(byDate));
  return (<><PageHeader title="Pending Applications" /><div className="card">{loading && !data ? <Spinner /> : <ApplicationTable apps={data} base="/hr" showStudent />}</div></>);
}

function useForwarded() {
  const { user } = useAuth();
  return usePoll(() => api.coordApplications(user.coordinatorId).then(byDate), [user.coordinatorId]);
}

export function CoordinatorDashboard() {
  const { user } = useAuth(); const { data, loading } = useForwarded();
  const { data: dep } = usePoll(() => api.departments().then((l) => l.find((d) => d.departmentId === user.department?.departmentId)), [user.department?.departmentId], 30000);
  if (loading && !data) return <Spinner />;
  return (
    <>
      <PageHeader title={`${user.department?.departmentName || 'Department'} · Coordinator`} />
      <div className="row g-3 mb-3">
        <div className="col-6 col-xl-3"><Stat icon="inbox" label="Awaiting your decision" value={data.length} /></div>
        <div className="col-6 col-xl-3"><Stat icon="briefcase" label="Available positions" value={dep ? (dep.totalSlots ?? 0) - (dep.occupiedSlots ?? 0) : null} tone="#198754" /></div>
        <div className="col-6 col-xl-3"><Stat icon="people" label="Occupied positions" value={dep?.occupiedSlots ?? 0} /></div>
        <div className="col-6 col-xl-3"><Stat icon="grid" label="Total positions" value={dep?.totalSlots ?? 0} /></div>
      </div>
      <div className="card"><div className="card-header bg-white fw-semibold">Forwarded applications</div><ApplicationTable apps={data.slice(0, 5)} base="/coordinator" showStudent /></div>
    </>
  );
}

export function CoordinatorApplications() {
  const { data, loading } = useForwarded();
  return (<><PageHeader title="Forwarded Applications" /><div className="card">{loading && !data ? <Spinner /> : <ApplicationTable apps={data} base="/coordinator" showStudent />}</div></>);
}
