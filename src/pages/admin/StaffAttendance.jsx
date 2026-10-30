// The admin marks every teacher present, late, absent or on leave for the day,
// and can look back over any period. There is no time window here —
// unlike student attendance, this is the admin's own record to keep.
import { useEffect, useState } from "react";
import { Check, X, CalendarOff, Users, Percent, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Table, Button, Select, Input, Field, Message, Loading, Empty, Tabs, Stat,
} from "../../components/ui.jsx";

export default function StaffAttendance() {
  const [tab, setTab] = useState("mark");

  return (
    <Page title="Staff attendance" subtitle="Mark every teacher for the day, or look back over a period.">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { value: "mark", label: "Mark today" },
          { value: "report", label: "Reports" },
        ]}
      />
      {tab === "mark" ? <MarkStaff /> : <StaffReport />}
    </Page>
  );
}

function MarkStaff() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [roster, setRoster] = useState(null);
  const [marks, setMarks] = useState({});
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setRoster(null);
    setResult(null);
    setError("");

    api
      .get("/teacher-attendance/roster", { params: { date } })
      .then(function (res) {
        setRoster(res.data);
        const start = {};
        res.data.teachers.forEach(function (t) { start[t.id] = t.status || "present"; });
        setMarks(start);
      })
      .catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, [date]);

  function setStatus(teacherId, status) {
    setMarks(function (old) { return { ...old, [teacherId]: status }; });
  }

  function markAll(status) {
    const all = {};
    roster.teachers.forEach(function (t) { all[t.id] = status; });
    setMarks(all);
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const records = roster.teachers.map(function (t) { return { teacher_id: t.id, status: marks[t.id] }; });
      const res = await api.post("/teacher-attendance/mark", { date, records });
      setResult(res.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      {result && (
        <Message type="success" onClose={function () { setResult(null); }}>
          Saved for {result.total} teachers. {result.late || 0} late, {result.absent} absent.
        </Message>
      )}

      <Card className="mb-4">
        <Field label="Date" hint="You can mark or correct any past date.">
          <Input type="date" value={date} max={today} onChange={function (e) { setDate(e.target.value); }} className="w-48" />
        </Field>
      </Card>

      {!roster ? (
        <Loading />
      ) : roster.teachers.length === 0 ? (
        <Card><Empty icon={Users}>No teachers yet. Add one from the Teachers page.</Empty></Card>
      ) : (
        <Card>
          {roster.is_holiday && (
            <Message type="info">
              The school is closed on {roster.holiday_name}. You can still mark it if staff came in anyway.
            </Message>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-slate-100">
            <Button variant="plain" size="sm" onClick={function () { markAll("present"); }}>Mark everyone present</Button>
            <span className="text-sm text-slate-500 sm:ml-auto">{roster.teachers.length} teachers</span>
          </div>

          <div className="divide-y divide-slate-100">
            {roster.teachers.map(function (t) {
              return (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <p className="font-medium text-ink">{t.name}</p>
                  <div className="flex gap-1.5">
                    <Choice label="Present" icon={Check} active={marks[t.id] === "present"} color="good" onClick={function () { setStatus(t.id, "present"); }} />
                    <Choice label="Late" icon={Clock3} active={marks[t.id] === "late"} color="warn" onClick={function () { setStatus(t.id, "late"); }} />
                    <Choice label="Absent" icon={X} active={marks[t.id] === "absent"} color="bad" onClick={function () { setStatus(t.id, "absent"); }} />
                    <Choice label="Leave" icon={CalendarOff} active={marks[t.id] === "leave"} color="slate" onClick={function () { setStatus(t.id, "leave"); }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button onClick={submit} loading={busy}>{busy ? "Saving..." : "Save attendance"}</Button>
            {roster.already_marked && (
              <p className="text-xs text-slate-400 mt-2">
                This date already has attendance saved. Saving again will replace it.
              </p>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

function Choice({ label, icon: Icon, active, color, onClick }) {
  const on = {
    good: "bg-good text-white border-good",
    bad: "bg-bad text-white border-bad",
    warn: "bg-warn text-white border-warn",
    slate: "bg-slate-500 text-white border-slate-500",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors " +
        (active ? on[color] : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50")
      }
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StaffReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState("month");
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  function load() {
    setData(null);
    api
      .get("/teacher-attendance/report", { params: { period, date } })
      .then(function (res) { setData(res.data); })
      .catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, [period, date]);

  if (error) return <Message type="error">{error}</Message>;

  return (
    <>
      <Card className="mb-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Report for">
            <Select value={period} onChange={function (e) { setPeriod(e.target.value); }}>
              <option value="day">One day</option>
              <option value="week">One week</option>
              <option value="month">One month</option>
            </Select>
          </Field>
          <Field label="Any date inside the period">
            <Input type="date" value={date} max={today} onChange={function (e) { setDate(e.target.value); }} />
          </Field>
        </div>
      </Card>

      {!data ? (
        <Loading />
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-3">{data.label}</p>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <Stat icon={Users} label="Teachers" value={data.summary.teachers} />
            <Stat icon={CheckCircle2} label="Present" value={data.summary.present} tone="good" />
            <Stat icon={Clock3} label="Late" value={data.summary.late} tone="warn" />
            <Stat icon={XCircle} label="Absent" value={data.summary.absent} tone="bad" />
            <Stat icon={Percent} label="Attendance" value={data.summary.percentage + "%"} tone={data.summary.percentage >= 90 ? "good" : "warn"} />
          </div>

          {data.summary.marked === 0 ? (
            <Card><Empty>No staff attendance was marked in this period.</Empty></Card>
          ) : (
            <Card title="Teacher by teacher">
              <Table head={["Teacher", "Present", "Late", "Absent", "Leave", "Attendance"]}>
                {data.by_teacher.map(function (t) {
                  return (
                    <tr key={t.teacher_id}>
                      <td className="py-2.5 pr-4 font-medium">{t.name}</td>
                      <td className="py-2.5 pr-4 text-good">{t.present}</td>
                      <td className="py-2.5 pr-4 text-warn">{t.late}</td>
                      <td className="py-2.5 pr-4 text-bad">{t.absent}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{t.on_leave}</td>
                      <td className="py-2.5 pr-4">{t.marked === 0 ? <span className="text-slate-400">Not marked</span> : t.percentage + "%"}</td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}
        </>
      )}
    </>
  );
}
