import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileQuestion, Clock, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export default function DashboardCharts({ stats }) {
  const kpis = stats?.kpis || {};
  const charts = stats?.charts || {};

  const disciplineCounts = charts?.disciplineCounts || { underReview: 0, sanctioned: 0 };
  const isClean =
    charts?.disciplineStatus === 'Clean' ||
    (disciplineCounts.underReview === 0 && disciplineCounts.sanctioned === 0);

  const justificationsPieData = useMemo(() => ([
    { name: 'Treated', value: kpis?.justifications?.treated || 0 },
    { name: 'Pending', value: kpis?.justifications?.pending || 0 },
  ]), [kpis]);

  const complaintsPieData = useMemo(() => ([
    { name: 'Treated', value: kpis?.complaints?.treated || 0 },
    { name: 'Pending', value: kpis?.complaints?.pending || 0 },
  ]), [kpis]);

  const disciplineDoughnutData = useMemo(() => ([
    { name: 'Under Review', value: disciplineCounts.underReview },
    { name: 'Sanctioned', value: disciplineCounts.sanctioned },
  ]), [disciplineCounts]);

  const JUSTIFICATIONS_COLORS = ['rgba(34, 197, 94, 0.85)', 'rgba(234, 179, 8, 0.85)'];
  const COMPLAINTS_COLORS = ['rgba(59, 130, 246, 0.85)', 'rgba(239, 68, 68, 0.85)'];
  const DISCIPLINE_COLORS = ['rgba(234, 179, 8, 0.9)', 'rgba(239, 68, 68, 0.9)'];

  const getPfeStatusConfig = (status) => {
    switch (status) {
      case 'Approved':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Approved' };
      case 'Pending approval':
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Pending Approval' };
      case 'Rejected':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Rejected' };
      case 'Not selected':
      default:
        return { icon: FileQuestion, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Not Selected' };
    }
  };

  if (!stats) return null;

  const pfeConfig = getPfeStatusConfig(charts?.pfeStatus);
  const PfeIcon = pfeConfig.icon;

  const hasJustifications = justificationsPieData.some((item) => item.value > 0);
  const hasComplaints = complaintsPieData.some((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-surface rounded-lg border border-edge shadow-sm p-4 h-80">
        <h3 className="text-sm font-semibold text-ink mb-4 text-center">Justifications Status</h3>
        <div className="h-64 relative">
          {hasJustifications ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={justificationsPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {justificationsPieData.map((_, i) => (
                    <Cell key={`j-cell-${i}`} fill={JUSTIFICATIONS_COLORS[i % JUSTIFICATIONS_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-ink-tertiary">
              No justifications yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-edge shadow-sm p-4 h-80">
        <h3 className="text-sm font-semibold text-ink mb-4 text-center">Complaints Status</h3>
        <div className="h-64 relative">
          {hasComplaints ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complaintsPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {complaintsPieData.map((_, i) => (
                    <Cell key={`c-cell-${i}`} fill={COMPLAINTS_COLORS[i % COMPLAINTS_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-ink-tertiary">
              No complaints yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-edge shadow-sm p-4 h-80 flex flex-col items-center justify-center relative">
        <h3 className="text-sm font-semibold text-ink mb-6 w-full text-center absolute top-4">PFE Status</h3>
        <div className={`p-6 rounded-full ${pfeConfig.bg} mb-4`}>
          <PfeIcon className={`w-16 h-16 ${pfeConfig.color}`} />
        </div>
        <div className={`text-xl font-bold ${pfeConfig.color}`}>
          {pfeConfig.label}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-edge shadow-sm p-4 h-80 flex flex-col items-center justify-center relative">
        <h3 className="text-sm font-semibold text-ink mb-6 w-full text-center absolute top-4">
          Disciplinary Status
        </h3>

        {isClean ? (
          <>
            <div className="p-6 rounded-full bg-green-100 mb-4">
              <ShieldCheck className="w-16 h-16 text-green-500" />
            </div>
            <div className="text-xl font-bold text-green-500">Clean</div>
            <p className="text-xs text-ink-tertiary mt-1">No disciplinary records</p>
          </>
        ) : (
          <div className="w-full h-56 relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={disciplineDoughnutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {disciplineDoughnutData.map((_, i) => (
                    <Cell key={`d-cell-${i}`} fill={DISCIPLINE_COLORS[i % DISCIPLINE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
