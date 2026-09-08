import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../api/axios';
import { formatCurrency, getErrorMessage, todayLocalISO } from '../utils/formatters';
import { departmentColor } from '../utils/departmentColors';

const LEAVE_TYPE_LABEL = { annual: 'Annual', sick: 'Sick', unpaid: 'Unpaid', other: 'Other' };
const STAGE_LABEL = { applied: 'Applied', interview: 'Interview', offered: 'Offered', hired: 'Hired', rejected: 'Rejected' };
const ATTENDANCE_COLORS = { present: 'var(--success)', late: 'var(--warning)', half_day: 'var(--accent)', absent: 'var(--danger)' };

function downloadReportCsv(data) {
  const lines = ['Report Summary,', ''];
  lines.push('Headcount Trend'); lines.push('Month,New Hires,Total Headcount');
  data.headcount_trend.forEach((r) => lines.push(`${r.month},${r.new_hires},${r.total_headcount}`));
  lines.push(''); lines.push('Department Distribution'); lines.push('Department,Employees');
  data.department_distribution.forEach((r) => lines.push(`"${r.department}",${r.total}`));
  lines.push(''); lines.push('Payroll by Month (Paid)'); lines.push('Month,Total Net');
  data.payroll_by_month.forEach((r) => lines.push(`"${r.month}",${r.total}`));
  lines.push(''); lines.push('Leave by Type'); lines.push('Type,Requests,Total Days');
  data.leave_by_type.forEach((r) => lines.push(`${r.leave_type},${r.total},${r.total_days}`));

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `staffnest-report-${todayLocalISO()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/reports/summary.php')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load report data.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-16 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Loading reports…</p>;
  }
  if (error || !data) {
    return (
      <p className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
        {error || 'No data available.'}
      </p>
    );
  }

  const attendanceData = Object.entries(data.attendance.counts).map(([status, total]) => ({
    name: status.replace('_', ' '),
    value: total,
    color: ATTENDANCE_COLORS[status],
  }));

  const leaveData = data.leave_by_type.map((r) => ({ name: LEAVE_TYPE_LABEL[r.leave_type], requests: r.total, days: Number(r.total_days) }));
  const funnelData = data.recruitment_funnel.map((r) => ({ name: STAGE_LABEL[r.stage] || r.stage, total: r.total }));

  return (
    <div className="animate-fade-rise space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => downloadReportCsv(data)}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          <Download size={16} /> Export Report CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Headcount trend */}
        <ChartCard title="Headcount Trend (6 months)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.headcount_trend} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="headcountFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }} />
              <Area type="monotone" dataKey="total_headcount" name="Total Headcount" stroke="var(--accent)" strokeWidth={2.5} fill="url(#headcountFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Department distribution */}
        <ChartCard title="Department Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.department_distribution} dataKey="total" nameKey="department" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {data.department_distribution.map((entry, i) => <Cell key={i} fill={departmentColor(i)} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Payroll by month */}
        <ChartCard title="Payroll Paid by Month">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.payroll_by_month} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }}
              />
              <Bar dataKey="total" name="Net Paid" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attendance overview (last 30 days) */}
        <ChartCard title={`Attendance Rate (30 days) — ${data.attendance.rate}%`}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={attendanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {attendanceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, textTransform: 'capitalize' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Leave by type */}
        <ChartCard title="Approved Leave by Type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={leaveData} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }} />
              <Bar dataKey="days" name="Total Days" fill="var(--dept-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recruitment funnel */}
        <ChartCard title="Recruitment Funnel">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} width={70} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }} />
              <Bar dataKey="total" name="Candidates" fill="var(--dept-4)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <h3 className="font-display mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
      {children}
    </div>
  );
}
