import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAdminDashboard } from '../services/dashboardService';

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function DataSection({ title, loading, error, empty, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4">
        {loading ? <LoadingSpinner label={`Loading ${title.toLowerCase()}…`} /> : error ? (
          <ErrorState message={error} />
        ) : empty ? (
          <EmptyState title="No data yet">MongoDB analytics will appear here as the platform receives activity.</EmptyState>
        ) : children}
      </div>
    </section>
  );
}

function HorizontalBars({ rows, labelField }) {
  const max = Math.max(...rows.map((row) => row.registrations), 0);
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row[labelField]}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{row[labelField]}</span>
            <span className="shrink-0 text-slate-500">{row.registrations}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${max ? (row.registrations / max) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' });
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAdminDashboard()
      .then((data) => { if (active) setDashboard(data); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load admin analytics.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const summary = dashboard?.summary;
  const months = dashboard?.monthlyEventTrend || [];
  const categories = dashboard?.popularCategories || [];
  const eventStats = dashboard?.registrationsPerEvent || [];
  const departments = dashboard?.departmentParticipation || [];
  const years = dashboard?.yearParticipation || [];
  const maxMonthlyEvents = Math.max(...months.map((row) => row.events), 0);
  const maxMonthlyRegistrations = Math.max(...months.map((row) => row.registrations), 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Platform dashboard</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Admin management">
          {[['Users', '/admin/users'], ['Events', '/admin/events'], ['Categories', '/admin/categories'], ['Venues', '/admin/venues']].map(([label, path]) => (
            <Link key={path} to={path} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{label}</Link>
          ))}
        </nav>
      </div>

      <section className="mt-7" aria-label="Platform totals">
        {loading ? <LoadingSpinner label="Loading platform totals…" /> : error ? <ErrorState message={error} /> : summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Users" value={summary.totalUsers} />
            <StatCard label="Events" value={summary.totalEvents} />
            <StatCard label="Registrations" value={summary.totalRegistrations} />
            <StatCard label="Attendance" value={summary.totalAttendance} />
            <StatCard label="Attendance rate" value={`${dashboard.attendanceRate.rate}%`} />
            <StatCard label="Average rating" value={dashboard.averageRating === null ? 'No ratings yet' : dashboard.averageRating} />
          </div>
        )}
      </section>

      {(dashboard || loading || error) && (
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <DataSection title="Popular categories" loading={loading} error={error} empty={!categories.length}>
            <div className="space-y-4">
              {(() => {
                const max = Math.max(...categories.map((item) => item.registrations), 0);
                return categories.map((item) => (
                  <div key={item.categoryId}>
                    <div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-medium text-slate-700">{item.name}</span><span className="text-slate-500">{item.registrations}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${max ? (item.registrations / max) * 100 : 0}%` }} /></div>
                  </div>
                ));
              })()}
            </div>
          </DataSection>

          <DataSection title="Registrations per event" loading={loading} error={error} empty={!eventStats.length}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3 pr-3">Event</th><th className="pb-3 pr-3">Registered</th><th className="pb-3 pr-3">Attended</th><th className="pb-3">Capacity filled</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {eventStats.map((event) => (
                    <tr key={event._id}>
                      <td className="py-3 pr-3 font-medium text-slate-800">{event.title}</td>
                      <td className="py-3 pr-3">{event.registered}</td>
                      <td className="py-3 pr-3">{event.attended}</td>
                      <td className="min-w-36 py-3">
                        <div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(event.fillPercentage, 100)}%` }} /></div><span className="w-12 text-right text-xs text-slate-500">{event.fillPercentage}%</span></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataSection>

          <DataSection title="Department participation" loading={loading} error={error} empty={!departments.length}>
            <HorizontalBars rows={departments} labelField="department" />
          </DataSection>

          <DataSection title="Year-wise participation" loading={loading} error={error} empty={!years.length}>
            <HorizontalBars rows={years} labelField="year" />
          </DataSection>

          <div className="lg:col-span-2">
            <DataSection title="Monthly event trend (UTC)" loading={loading} error={error} empty={!months.some((row) => row.events || row.registrations)}>
              <div className="flex h-56 items-end gap-2 overflow-x-auto border-b border-slate-200 px-1">
                {months.map((month) => {
                    const eventHeight = maxMonthlyEvents ? Math.max(6, (month.events / maxMonthlyEvents) * 100) : 6;
                    const registrationHeight = maxMonthlyRegistrations ? Math.max(6, (month.registrations / maxMonthlyRegistrations) * 100) : 6;
                    return (
                      <div key={month.month} className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2">
                        <div className="flex gap-1 text-[9px] text-slate-500" title={`${month.events} events and ${month.registrations} registrations`}>
                          <span>{month.events}</span><span>/</span><span>{month.registrations}</span>
                        </div>
                        <div className="flex h-[72%] w-full max-w-10 items-end justify-center gap-1">
                          <div className="w-3 rounded-t-md bg-indigo-500" style={{ height: `${eventHeight}%` }} title={`${month.events} events`} />
                          <div className="w-3 rounded-t-md bg-emerald-500" style={{ height: `${registrationHeight}%` }} title={`${month.registrations} registrations`} />
                        </div>
                        <span className="pb-2 text-[10px] text-slate-500">{monthLabel(month.month)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500"><span className="font-semibold text-indigo-600">Indigo</span> events · <span className="font-semibold text-emerald-600">Green</span> registrations. Each series is scaled independently.</p>
            </DataSection>
          </div>
        </div>
      )}
    </main>
  );
}
