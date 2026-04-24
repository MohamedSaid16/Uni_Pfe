/*
  AdminAnalyticsPage — global KPIs for administrators.

  Data is fetched from a single endpoint (/api/v1/admin/analytics) backed by
  the centralized statistics service. Every metric shown here uses the same
  query definition as the student and teacher dashboards — so a "pending
  reclamation" is a pending reclamation everywhere.
*/

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  UserCog,
  FileText,
  Megaphone,
  BookOpenCheck,
  ShieldAlert,
  Rocket,
  Layers,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { adminPanelAPI } from '../../services/api';

function StatCard({ title, value, subtitle, icon: Icon, accent = 'brand' }) {
  const accentMap = {
    brand: { bg: 'bg-brand/10', text: 'text-brand' },
    success: { bg: 'bg-success/10', text: 'text-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
    danger: { bg: 'bg-danger/10', text: 'text-danger' },
    ink: { bg: 'bg-edge/30', text: 'text-ink' },
  };
  const tone = accentMap[accent] || accentMap.brand;

  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm p-5 flex items-start gap-4 transition-shadow hover:shadow-md">
      <div className={`p-3 rounded-full flex-shrink-0 ${tone.bg}`}>
        <Icon className={`w-6 h-6 ${tone.text}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide font-semibold text-ink-tertiary">
          {title}
        </p>
        <p className="text-2xl font-bold text-ink mt-1 tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-xs text-ink-secondary mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-ink-tertiary">{description}</p>
      )}
    </div>
  );
}

function MetricTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm overflow-hidden">
      <h3 className="px-5 py-4 text-sm font-semibold text-ink border-b border-edge">
        {title}
      </h3>
      <dl className="divide-y divide-edge">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-5 py-3 text-sm"
          >
            <dt className="text-ink-secondary">{row.label}</dt>
            <dd className="font-semibold text-ink tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function UserListCard({ title, icon: Icon, users, loading, emptyMessage }) {
  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-edge">
        <div className="p-2 rounded-full bg-brand/10">
          <Icon className="w-4 h-4 text-brand" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      {loading ? (
        <div className="p-5 flex items-center gap-2 text-sm text-ink-tertiary">
          <div className="w-4 h-4 border-2 border-edge-strong border-t-brand rounded-full animate-spin" />
          Loading…
        </div>
      ) : !users || users.length === 0 ? (
        <p className="p-5 text-sm text-ink-tertiary">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-edge">
          {users.map((user) => {
            const fullName = [user.prenom, user.nom]
              .filter((part) => part && String(part).trim())
              .join(' ')
              .trim() || user.email || `User #${user.id}`;
            return (
              <li key={user.id}>
                <Link
                  to={`/dashboard/admin/user/${user.id}`}
                  className="group flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-brand/5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{fullName}</p>
                    {user.email && (
                      <p className="text-xs text-ink-tertiary truncate">{user.email}</p>
                    )}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-ink-tertiary shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-brand rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await adminPanelAPI.getAnalytics();
        if (!cancelled) setData(response?.data || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setUsersLoading(true);
        const [studentsRes, teachersRes] = await Promise.all([
          adminPanelAPI.getUsers({ role: 'etudiant', limit: 20 }),
          adminPanelAPI.getUsers({ role: 'enseignant', limit: 20 }),
        ]);
        if (!cancelled) {
          setStudents(
            Array.isArray(studentsRes?.data?.items)
              ? studentsRes.data.items
              : Array.isArray(studentsRes?.data)
                ? studentsRes.data
                : []
          );
          setTeachers(
            Array.isArray(teachersRes?.data?.items)
              ? teachersRes.data.items
              : Array.isArray(teachersRes?.data)
                ? teachersRes.data
                : []
          );
        }
      } catch {
        if (!cancelled) {
          setStudents([]);
          setTeachers([]);
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const generatedAtLabel = data.generatedAt
    ? new Date(data.generatedAt).toLocaleString()
    : '';

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-brand/5 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Administration
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            System Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            Global view of the platform — aggregated from the same data sources
            used by student and teacher dashboards.
          </p>
          {generatedAtLabel && (
            <p className="mt-2 text-xs text-ink-tertiary">
              Refreshed at {generatedAtLabel}
            </p>
          )}
        </div>
      </header>

      <section>
        <SectionHeader
          title="People"
          description="User base across roles and account states."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total users"
            value={data.users.total}
            subtitle={`${data.users.active} active`}
            icon={Users}
            accent="brand"
          />
          <StatCard
            title="Students"
            value={data.users.students}
            subtitle="Enrolled accounts"
            icon={GraduationCap}
            accent="success"
          />
          <StatCard
            title="Teachers"
            value={data.users.teachers}
            subtitle="Active faculty"
            icon={UserCog}
            accent="ink"
          />
          <StatCard
            title="Suspended"
            value={data.users.suspended}
            subtitle={`${data.users.inactive} inactive`}
            icon={ShieldAlert}
            accent="warning"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Activity"
          description="Requests, announcements, and academic content."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total requests"
            value={data.reclamations.total}
            subtitle={`${data.reclamations.pending} pending`}
            icon={FileText}
            accent="brand"
          />
          <StatCard
            title="Pending requests"
            value={data.reclamations.pending}
            subtitle="Awaiting response"
            icon={FileText}
            accent="warning"
          />
          <StatCard
            title="Announcements"
            value={data.announcements.total}
            subtitle={`${data.announcements.active} active`}
            icon={Megaphone}
            accent="success"
          />
          <StatCard
            title="Promos / Modules"
            value={`${data.academic.promos} / ${data.academic.modules}`}
            subtitle="Academic catalog"
            icon={Building2}
            accent="ink"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="PFE System"
          description="Final-year projects, supervision, and assignments."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="PFE subjects"
            value={data.pfe.totalSubjects}
            subtitle="Proposed themes"
            icon={BookOpenCheck}
            accent="brand"
          />
          <StatCard
            title="Active PFE groups"
            value={data.pfe.activeGroups}
            subtitle={`${data.pfe.studentsInPfeGroup} students engaged`}
            icon={Layers}
            accent="success"
          />
          <StatCard
            title="Supervisors"
            value={data.pfe.totalSupervisors}
            subtitle="Teachers with PFE load"
            icon={UserCog}
            accent="ink"
          />
          <StatCard
            title="Avg. load"
            value={data.pfe.averageStudentsPerSupervisor}
            subtitle="Students per supervisor"
            icon={Rocket}
            accent="warning"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricTable
          title="Request pipeline"
          rows={[
            { label: 'Total', value: data.reclamations.total },
            { label: 'Pending', value: data.reclamations.pending },
            { label: 'Approved', value: data.reclamations.approved },
            { label: 'Rejected', value: data.reclamations.rejected },
          ]}
        />
        <MetricTable
          title="Disciplinary cases"
          rows={[
            { label: 'Open', value: data.discipline.openCases },
            { label: 'Closed', value: data.discipline.closedCases },
            { label: 'Minor', value: data.discipline.byGravity.faible ?? 0 },
            { label: 'Medium', value: data.discipline.byGravity.moyenne ?? 0 },
            { label: 'Grave', value: data.discipline.byGravity.grave ?? 0 },
          ]}
        />
      </section>

      <section>
        <MetricTable
          title="Affectation campaigns"
          rows={[
            { label: 'Total', value: data.campaigns.total },
            { label: 'Draft', value: data.campaigns.draft },
            { label: 'Open', value: data.campaigns.open },
            { label: 'Closed', value: data.campaigns.closed },
            { label: 'Finalized', value: data.campaigns.finalized },
          ]}
        />
      </section>

      <section>
        <SectionHeader
          title="Inspect a user"
          description="Click any name to view their dashboard exactly as they see it (read-only)."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UserListCard
            title="Students"
            icon={GraduationCap}
            users={students}
            loading={usersLoading}
            emptyMessage="No students found."
          />
          <UserListCard
            title="Teachers"
            icon={UserCog}
            users={teachers}
            loading={usersLoading}
            emptyMessage="No teachers found."
          />
        </div>
      </section>
    </div>
  );
}
