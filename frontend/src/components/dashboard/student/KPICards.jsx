import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';

export default function KPICards({ stats }) {
  if (!stats?.kpis) return null;

  const { justifications, complaints } = stats.kpis;

  const kpis = [
    {
      title: 'Total Justifications',
      value: justifications?.total || 0,
      icon: <FileText className="w-6 h-6 text-brand" />,
      bgColor: 'bg-brand/10',
    },
    {
      title: 'Treated Justifications',
      value: justifications?.treated || 0,
      icon: <FileText className="w-6 h-6 text-success" />,
      bgColor: 'bg-success/10',
    },
    {
      title: 'Pending Justifications',
      value: justifications?.pending || 0,
      icon: <FileText className="w-6 h-6 text-warning" />,
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Total Complaints',
      value: complaints?.total || 0,
      icon: <AlertCircle className="w-6 h-6 text-brand" />,
      bgColor: 'bg-brand/10',
    },
    {
      title: 'Treated Complaints',
      value: complaints?.treated || 0,
      icon: <AlertCircle className="w-6 h-6 text-success" />,
      bgColor: 'bg-success/10',
    },
    {
      title: 'Pending Complaints',
      value: complaints?.pending || 0,
      icon: <AlertCircle className="w-6 h-6 text-warning" />,
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-surface rounded-lg border border-edge shadow-sm p-4 flex items-center space-x-4 rtl:space-x-reverse"
        >
          <div className={`p-3 rounded-full flex-shrink-0 ${kpi.bgColor}`}>
            {kpi.icon}
          </div>
          <div>
            <p className="text-sm text-ink-tertiary font-medium">{kpi.title}</p>
            <p className="text-2xl font-bold text-ink mt-1">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
