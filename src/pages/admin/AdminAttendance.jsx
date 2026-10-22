// Attendance for the whole school, plus the daily window class teachers
// are allowed to submit attendance in.
import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import api, { errorText } from "../../api";
import { Page, Card, Button, Input, Field, Message } from "../../components/ui.jsx";
import { AttendanceReport } from "../../components/AttendanceReport.jsx";

export default function AdminAttendance() {
  return (
    <Page
      title="Attendance"
      subtitle="Day, week or month. Narrow it down by class and section, or leave both blank for the whole school."
    >
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
