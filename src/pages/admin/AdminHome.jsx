import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Users, Contact, BookOpen, CheckCircle2, XCircle,
  ClipboardCheck, Banknote, ArrowRight, UserPlus, TrendingUp, BarChart3, PieChart,
} from "lucide-react";
import api, { errorText } from "../../api";
import { Page, Card, Stat, Table, Pill, Loading, Message, Empty, money } from "../../components/ui.jsx";
import { LineChart, BarChart, DonutChart } from "../../components/Charts.jsx";

export default function AdminHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    api.get("/dashboard").then(function (res) { setData(res.data); }).catch(function (err) { setError(errorText(err)); });
  }, []);

  if (error) return <Message type="error">{error}</Message>;
  if (!data) return <Loading />;

  const c = data.counts;
  const a = data.attendance_today;

  return (
    <Page title="Dashboard" subtitle="Everything happening in the school today.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={GraduationCap} label="Students" value={c.students} />
        <Stat icon={Users} label="Teachers" value={c.teachers} />
        <Stat icon={Contact} label="Parents" value={c.parents} />
        <Stat icon={BookOpen} label="Classes" value={c.classes} />
      </div>

      {c.pending_admissions > 0 && (
        <Link
          to="/admin/admissions"
          className="flex items-center justify-between gap-3 bg-brand-50 border border-brand-200 text-brand-700 rounded-2xl px-5 py-4 mb-6 hover:bg-brand-100 transition-colors"
        >
          <span className="flex items-center gap-3 font-medium">
            <span className="w-9 h-9 rounded-xl bg-white text-brand-600 flex items-center justify-center shrink-0">
              <UserPlus size={18} />
            </span>
            {c.pending_admissions} admission application{c.pending_admissions === 1 ? "" : "s"} waiting for review
          </span>
          <ArrowRight size={18} className="shrink-0" />
        </Link>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card title="Attendance today" icon={ClipboardCheck}>
          {a.marked === 0 ? (
            <Empty>No class has submitted attendance yet today.</Empty>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <CheckCircle2 className="mx-auto text-good mb-1" size={20} />
                <p className="text-2xl font-bold text-good">{a.present}</p>
                <p className="text-sm text-slate-500">Present</p>
              </div>
              <div>
                <XCircle className="mx-auto text-bad mb-1" size={20} />
                <p className="text-2xl font-bold text-bad">{a.absent}</p>
                <p className="text-sm text-slate-500">Absent</p>
              </div>
              <div>
                <ClipboardCheck className="mx-auto text-ink mb-1" size={20} />
                <p className="text-2xl font-bold text-ink">{a.marked}</p>
                <p className="text-sm text-slate-500">Marked</p>
              </div>
            </div>
          )}
        </Card>

        <Card title="Fees" icon={Banknote}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-bold text-good">{money(data.fees.collected)}</p>
              <p className="text-sm text-slate-500">Collected</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warn">{money(data.fees.pending)}</p>
              <p className="text-sm text-slate-500">Still outstanding</p>
            </div>
          </div>
          <Link to="/admin/fees" className="text-sm text-teal font-semibold underline mt-4 inline-flex items-center gap-1">
            Open fee management <ArrowRight size={13} />
          </Link>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title="Attendance, last 14 days" icon={TrendingUp} description="Share of marked students who were present each day.">
          <LineChart
            suffix="%"
            points={data.charts.attendance_trend.map(function (d) {
              return { label: new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { day: "2-digit", month: "short" }), value: d.percentage };
            })}
          />
        </Card>

        <Card title="Fees received, last 6 months" icon={Banknote} description="Money actually paid in each month.">
          <BarChart items={data.charts.fees_by_month} format={function (v) { return money(v); }} />
        </Card>

        <Card title="Students in each class" icon={BarChart3}>
          <BarChart items={data.charts.students_by_class.map(function (c) { return { label: c.name, value: c.count }; })} />
        </Card>

        <Card title="Admission applications" icon={PieChart} description="By what has happened to them.">
          <DonutChart
            items={data.charts.admissions_by_status.map(function (s) {
              const colors = { pending: "#d97706", approved: "#15803d", rejected: "#b91c1c" };
              return {
                label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
                value: s.count,
                color: colors[s.status] || "#64748b",
              };
            })}
          />
        </Card>
      </div>

      <Card title="Latest admission applications">
        {data.recent_admissions.length === 0 ? (
          <Empty>No applications have come in yet.</Empty>
        ) : (
          <Table head={["Student", "Applying for", "Sent", "Status"]}>
            {data.recent_admissions.map(function (r) {
              return (
                <tr key={r.id}>
                  <td className="py-2.5 pr-4 font-medium">{r.student_name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.applying_class || "-"}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-4"><Pill status={r.status} /></td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </Page>
  );
}
