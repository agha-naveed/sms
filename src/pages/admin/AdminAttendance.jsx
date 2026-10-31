// Attendance for the whole school, plus the daily window class teachers
// are allowed to submit attendance in.
import { useEffect, useState } from "react";
import { Clock3, LockKeyhole } from "lucide-react";
import api, { errorText } from "../../api";
import { Page, Card, Button, Input, Field, Message, Pill } from "../../components/ui.jsx";
import { AttendanceReport } from "../../components/AttendanceReport.jsx";

export default function AdminAttendance() {
  return (
    <Page
      title="Attendance"
      subtitle="Day, week or month. Narrow it down by class and section, or leave both blank for the whole school."
    >
      <ReopenRequests />
      <AttendanceWindowSettings />
      <AttendanceReport role="admin" />
    </Page>
  );
}

function AttendanceWindowSettings() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(function () {
    api.get("/settings").then(function (res) { setForm(res.data); }).catch(function (err) { setError(errorText(err)); });
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.put("/settings", form);
      setDone("Attendance window updated.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!form) return null;

  return (
    <Card
      title="Attendance window"
      icon={Clock3}
      description="Only a section's class teacher can mark attendance, and only inside this daily window."
      className="mb-4"
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <Field label="Opens at">
          <Input
            type="time"
            value={form.attendance_start}
            onChange={function (e) { setForm({ ...form, attendance_start: e.target.value }); }}
            className="w-36"
          />
        </Field>

        <Field label="Closes at">
          <Input
            type="time"
            value={form.attendance_end}
            onChange={function (e) { setForm({ ...form, attendance_end: e.target.value }); }}
            className="w-36"
          />
        </Field>

        <Button type="submit" loading={busy}>Save</Button>
      </form>

      <p className="text-xs text-slate-400 mt-3">
        You, as the admin, can always mark or correct attendance. This window only
        applies to class teachers.
      </p>
    </Card>
  );
}

// Teachers ask here to open locked attendance once more (for example a
// student was late and had a good reason). Approving lets that class teacher
// submit that section and date one more time.
function ReopenRequests() {
  const [list, setList] = useState([]);
  const [note, setNote] = useState({});
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api.get("/attendance/requests").then(function (res) { setList(res.data); }).catch(function () {});
  }

  useEffect(load, []);

  async function decide(id, approve) {
    setError("");
    try {
      const res = await api.post("/attendance/requests/" + id + "/decide", {
        approve: approve, admin_note: note[id] || null,
      });
      setDone(res.data.message);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (list.length === 0) return null;

  const pending = list.filter(function (r) { return r.status === "pending"; });
  const decided = list.filter(function (r) { return r.status !== "pending"; }).slice(0, 8);

  return (
    <Card
      title={"Requests to reopen attendance" + (pending.length > 0 ? " (" + pending.length + ")" : "")}
      icon={LockKeyhole}
      description="Teachers ask for one more chance to change a locked attendance, with their reason."
      className="mb-4"
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      {pending.length === 0 && <p className="text-sm text-slate-400 mb-2">Nothing is waiting for you.</p>}

      <div className="space-y-3">
        {pending.map(function (r) {
          return (
            <div key={r.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{r.teacher_name}</p>
                  <p className="text-sm text-slate-500">
                    {r.class_name} - Section {r.section_name} · {new Date(r.date + "T12:00:00").toDateString()}
                  </p>
                </div>
                <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
              </div>

              <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-lg p-3">{r.reason}</p>

              <div className="mt-3 grid sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Field label="Note for the teacher" hint="Optional.">
                    <Input
                      value={note[r.id] || ""}
                      onChange={function (e) {
                        const v = e.target.value;
                        setNote(function (o) { return { ...o, [r.id]: v }; });
                      }}
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button variant="good" onClick={function () { decide(r.id, true); }}>Approve once</Button>
                  <Button variant="danger" onClick={function () { decide(r.id, false); }}>Refuse</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {decided.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent decisions</p>
          <ul className="text-sm text-slate-600 space-y-1.5">
            {decided.map(function (r) {
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-2">
                  <Pill status={r.status === "used" ? "paid" : r.status} />
                  {r.teacher_name}, {r.class_name} - {r.section_name}, {new Date(r.date + "T12:00:00").toLocaleDateString()}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
