// Only the class teacher of a section may mark its attendance, and only
// inside the daily window the admin sets (for example 7:00 to 11:00 AM).
// Any teacher assigned to a class can still open the Reports tab.
import { useEffect, useState } from "react";
import { Check, X, CalendarOff, Users, Clock3, ShieldAlert } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Button, Select, Input, Field, Message, Loading, Empty, Tabs,
} from "../../components/ui.jsx";
import { AttendanceReport } from "../../components/AttendanceReport.jsx";

function to12Hour(hhmm) {
  if (!hhmm) return "";
  const parts = hhmm.split(":");
  let hour = Number(parts[0]);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return hour + ":" + parts[1] + " " + suffix;
}

export default function MarkAttendance() {
  const today = new Date().toISOString().slice(0, 10);

  const [myClasses, setMyClasses] = useState(null);       // every class taught, for reports
  const [ownSections, setOwnSections] = useState(null);   // class-teacher sections only, for marking
  const [picked, setPicked] = useState("");
  const [date, setDate] = useState(today);
  const [roster, setRoster] = useState(null);
  const [marks, setMarks] = useState({});
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("mark");

  useEffect(function () {
    api.get("/teachers/my-classes").then(function (res) { setMyClasses(res.data); }).catch(function (err) { setError(errorText(err)); });

    api
      .get("/teachers/my-class-teacher-sections")
      .then(function (res) {
        setOwnSections(res.data);
        if (res.data.length > 0) {
          setPicked(res.data[0].class_id + "-" + res.data[0].section_id);
        }
      })
      .catch(function (err) { setError(errorText(err)); });
  }, []);

  useEffect(
    function () {
      if (!picked) return;

      const parts = picked.split("-");
      setRoster(null);
      setResult(null);
      setError("");

      api
        .get("/attendance/roster", {
          params: { class_id: parts[0], section_id: parts[1], date: date },
        })
        .then(function (res) {
          setRoster(res.data);
          const start = {};
          res.data.students.forEach(function (s) { start[s.id] = s.status || "present"; });
          setMarks(start);
        })
        .catch(function (err) { setError(errorText(err)); });
    },
    [picked, date]
  );

  function setStatus(studentId, status) {
    setMarks(function (old) { return { ...old, [studentId]: status }; });
  }

  function markAll(status) {
    const all = {};
    roster.students.forEach(function (s) { all[s.id] = status; });
    setMarks(all);
  }

  async function submit() {
    const parts = picked.split("-");
    setError("");
    setBusy(true);

    try {
      const records = roster.students.map(function (s) {
        return { student_id: s.id, status: marks[s.id] };
      });

      const res = await api.post("/attendance/mark", {
        class_id: Number(parts[0]),
        section_id: Number(parts[1]),
        date: date,
        records: records,
      });

      setResult(res.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (myClasses === null || ownSections === null) return <Loading />;

  return (
    <Page title="Attendance" subtitle="Mark every student, then submit once for the whole class.">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { value: "mark", label: "Mark attendance" },
          { value: "report", label: "Reports" },
        ]}
      />

      {tab === "report" ? (
        myClasses.length === 0 ? (
          <Card><Empty>No class has been assigned to you yet. Ask the admin to assign one.</Empty></Card>
        ) : (
          <AttendanceReport role="teacher" sections={myClasses} />
        )
      ) : ownSections.length === 0 ? (
        <Card>
          <Empty icon={ShieldAlert} title="You are not a class teacher">
            Only a section's class teacher can mark its attendance. Ask the
            admin to make you the class teacher of a section from the Classes
            page, or open the Reports tab to see attendance that has already
            been marked.
          </Empty>
        </Card>
      ) : (
        <>
          <Message type="error" onClose={function () { setError(""); }}>{error}</Message>

          {result && (
            <Message type="success" onClose={function () { setResult(null); }}>
              Attendance submitted for {result.total} students. {result.absent} absent,{" "}
              {result.parents_notified} parent
              {result.parents_notified === 1 ? "" : "s"} notified.
            </Message>
          )}

          <Card className="mb-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Class and section" hint={ownSections.length > 1 ? "Sections you are the class teacher of." : undefined}>
                <Select value={picked} onChange={function (e) { setPicked(e.target.value); }} disabled={ownSections.length <= 1}>
                  {ownSections.map(function (c) {
                    const key = c.class_id + "-" + c.section_id;
                    return (
                      <option key={key} value={key}>
                        {c.class_name} - Section {c.section_name}
                      </option>
                    );
                  })}
                </Select>
              </Field>

              <Field label="Date">
                <Input type="date" value={date} max={today} onChange={function (e) { setDate(e.target.value); }} />
              </Field>
            </div>
          </Card>

          {!roster ? (
            <Loading />
          ) : roster.students.length === 0 ? (
            <Card><Empty icon={Users}>There are no active students in this section yet.</Empty></Card>
          ) : (
            <Card>
              {roster.is_holiday && (
                <Message type="info">
                  The school is closed on {roster.holiday_name}, so attendance cannot be
                  marked for this date. Pick another day.
                </Message>
              )}

              {roster.already_marked && (
                <Message type="info">
                  Attendance for this date was already submitted. Only the admin can change it now.
                </Message>
              )}

              {!roster.already_marked && !roster.within_window && (
                <Message type="error">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />
                    Attendance can only be submitted between{" "}
                    {to12Hour(roster.attendance_window.start)} and {to12Hour(roster.attendance_window.end)}.
                    You can still fill it in, but the submit button opens up during that window.
                  </span>
                </Message>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <Button
                  variant="plain"
                  size="sm"
                  onClick={function () { markAll("present"); }}
                  disabled={roster.already_marked || roster.is_holiday}
                >
                  Mark everyone present
                </Button>
                <span className="text-sm text-slate-500 sm:ml-auto flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock3 size={13} />
                    {to12Hour(roster.attendance_window.start)} - {to12Hour(roster.attendance_window.end)}
                  </span>
                  {roster.students.length} students
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {roster.students.map(function (s) {
                  return (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-ink">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.admission_no}</p>
                      </div>

                      <div className="flex gap-1.5">
                        <Choice
                          label="Present" icon={Check}
                          active={marks[s.id] === "present"} color="good"
                          disabled={roster.already_marked || roster.is_holiday}
                          onClick={function () { setStatus(s.id, "present"); }}
                        />
                        <Choice
                          label="Absent" icon={X}
                          active={marks[s.id] === "absent"} color="bad"
                          disabled={roster.already_marked || roster.is_holiday}
                          onClick={function () { setStatus(s.id, "absent"); }}
                        />
                        <Choice
                          label="Leave" icon={CalendarOff}
                          active={marks[s.id] === "leave"} color="slate"
                          disabled={roster.already_marked || roster.is_holiday}
                          onClick={function () { setStatus(s.id, "leave"); }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Button
                  onClick={submit}
                  loading={busy}
                  disabled={roster.already_marked || roster.is_holiday || !roster.within_window}
                >
                  {busy ? "Submitting..." : "Submit attendance"}
                </Button>
                <p className="text-xs text-slate-400 mt-2">
                  {!roster.within_window && !roster.already_marked
                    ? "Come back during the attendance window to submit."
                    : Object.values(marks).filter(function (v) { return v === "absent"; }).length > 0
                    ? "The parents of every student marked absent will be notified straight away."
                    : "No one is marked absent, so no notifications will be sent."}
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}

function Choice({ label, icon: Icon, active, color, onClick, disabled }) {
  const on = {
    good: "bg-good text-white border-good",
    bad: "bg-bad text-white border-bad",
    slate: "bg-slate-500 text-white border-slate-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border disabled:opacity-50 transition-colors " +
        (active ? on[color] : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50")
      }
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
