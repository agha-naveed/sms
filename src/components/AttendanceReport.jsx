// One attendance report used by all four roles. What you can filter by
// depends on who you are, and the server checks that again on its side.
//
//   admin    everything, plus a class and section breakdown
//   teacher  their own sections
//   student  themselves
//   parent   one of their children
import { useEffect, useState } from "react";
import { Printer, Users, CalendarCheck, CheckCircle2, XCircle, CalendarOff, Percent } from "lucide-react";
import api, { errorText } from "../api";
import {
  Card, Table, Button, Select, Input, Field, Pill, Stat, Message, Loading, Empty,
} from "./ui.jsx";
import { PrintHeader, StudentStrip } from "./PrintDocs.jsx";

export function AttendanceReport({ role, studentId, sections, student }) {
  const today = new Date().toISOString().slice(0, 10);

  const [classes, setClasses] = useState([]);
  const [sectionList, setSectionList] = useState([]);

  const [filters, setFilters] = useState({
    period: "month",
    date: today,
    class_id: "",
    section_id: "",
  });

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    function () {
      if (role !== "admin") return;
      api.get("/classes").then(function (r) { setClasses(r.data); }).catch(function () {});
    },
    [role]
  );

  useEffect(
    function () {
      if (role !== "admin" || !filters.class_id) { setSectionList([]); return; }
      api.get("/classes/" + filters.class_id + "/sections").then(function (r) { setSectionList(r.data); }).catch(function () {});
    },
    [role, filters.class_id]
  );

  useEffect(
    function () {
      if (role === "teacher" && sections && sections.length > 0 && !filters.section_id) {
        setFilters(function (o) {
          return { ...o, class_id: sections[0].class_id, section_id: sections[0].section_id };
        });
      }
    },
    [role, sections]
  );

  function load() {
    if (role === "teacher" && (!filters.class_id || !filters.section_id)) return;
    if ((role === "student" || role === "parent") && !studentId) return;

    setError("");
    setData(null);

    const params = { period: filters.period, date: filters.date };

    if (role === "admin") {
      if (filters.class_id) params.class_id = filters.class_id;
      if (filters.section_id) params.section_id = filters.section_id;
    }
    if (role === "teacher") {
      params.class_id = filters.class_id;
      params.section_id = filters.section_id;
    }
    if (role === "student" || role === "parent") {
      if (studentId) params.student_id = studentId;
    }

    api.get("/attendance/report", { params: params }).then(function (res) { setData(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, [filters, studentId, role]);

  function set(key, value) {
    setFilters(function (o) { return { ...o, [key]: value }; });
  }

  const single = role === "student" || role === "parent";

  return (
    <div className="space-y-4">
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>

      <Card className="no-print">
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Report for">
            <Select value={filters.period} onChange={function (e) { set("period", e.target.value); }}>
              <option value="day">One day</option>
              <option value="week">One week</option>
              <option value="month">One month</option>
            </Select>
          </Field>

          <Field label={filters.period === "day" ? "Date" : "Any date inside the period"}>
            <Input type="date" value={filters.date} max={today} onChange={function (e) { set("date", e.target.value); }} />
          </Field>

          {role === "admin" && (
            <>
              <Field label="Class">
                <Select
                  value={filters.class_id}
                  onChange={function (e) { setFilters({ ...filters, class_id: e.target.value, section_id: "" }); }}
                >
                  <option value="">All classes</option>
                  {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
                </Select>
              </Field>

              <Field label="Section">
                <Select value={filters.section_id} onChange={function (e) { set("section_id", e.target.value); }} disabled={sectionList.length === 0}>
                  <option value="">All sections</option>
                  {sectionList.map(function (s) { return <option key={s.id} value={s.id}>Section {s.name}</option>; })}
                </Select>
              </Field>
            </>
          )}

          {role === "teacher" && sections && sections.length > 0 && (
            <Field label="Class and section">
              <Select
                value={filters.class_id + "-" + filters.section_id}
                onChange={function (e) {
                  const p = e.target.value.split("-");
                  setFilters({ ...filters, class_id: Number(p[0]), section_id: Number(p[1]) });
                }}
              >
                {sections.map(function (c) {
                  const key = c.class_id + "-" + c.section_id;
                  return <option key={key} value={key}>{c.class_name} - Section {c.section_name}</option>;
                })}
              </Select>
            </Field>
          )}
        </div>
      </Card>

      {role === "teacher" && sections && sections.length === 0 ? (
        <Card><Empty>No class has been assigned to you yet, so there is nothing to report on.</Empty></Card>
      ) : !data ? (
        <Loading />
      ) : (
        <div className="print-area">
          <div className="hidden print:block mb-4">
            <PrintHeader title="Attendance report" subtitle={data.label} />
            {single && student ? (
              <StudentStrip student={student} />
            ) : (
              <p className="text-sm text-slate-600 py-3 border-b border-slate-200">
                {data.summary.students} students · {data.summary.school_days} days marked ·{" "}
                {data.summary.percentage}% attendance
              </p>
            )}
          </div>

          <p className="text-sm text-slate-500 mb-3 no-print">{data.label}</p>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            {!single && <Stat icon={Users} label="Students" value={data.summary.students} />}
            <Stat icon={CalendarCheck} label="Days marked" value={data.summary.school_days} />
            <Stat icon={CheckCircle2} label="Present" value={data.summary.present} tone="good" />
            <Stat icon={XCircle} label="Absent" value={data.summary.absent} tone="bad" />
            <Stat icon={CalendarOff} label="Leave" value={data.summary.on_leave} />
            <Stat
              icon={Percent}
              label="Attendance"
              value={data.summary.percentage + "%"}
              tone={data.summary.percentage >= 75 ? "good" : "warn"}
            />
          </div>

          {data.summary.marked === 0 && (
            <Card><Empty>No attendance was marked in this period.</Empty></Card>
          )}

          {data.by_section.length > 0 && (
            <Card title="By class and section" className="mb-4">
              <Table head={["Class", "Section", "Students", "Present", "Absent", "Leave", "Attendance"]}>
                {data.by_section.map(function (r, i) {
                  return (
                    <tr key={i}>
                      <td className="py-2.5 pr-4 font-medium">{r.class_name || "-"}</td>
                      <td className="py-2.5 pr-4">{r.section_name || "-"}</td>
                      <td className="py-2.5 pr-4">{r.students}</td>
                      <td className="py-2.5 pr-4 text-good">{r.present}</td>
                      <td className="py-2.5 pr-4 text-bad">{r.absent}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{r.on_leave}</td>
                      <td className={"py-2.5 pr-4 " + (r.percentage >= 75 ? "text-good" : "text-warn")}>{r.percentage}%</td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}

          {data.by_day.length > 0 && (
            <Card title="Day by day" className="mb-4">
              <Table head={["Date", "Day", "Present", "Absent", "Leave", "Attendance"]}>
                {data.by_day.map(function (d) {
                  const when = new Date(d.date);
                  const percent = d.marked === 0 ? 0 : Math.round((d.present / d.marked) * 100);
                  return (
                    <tr key={d.date}>
                      <td className="py-2.5 pr-4">{when.toLocaleDateString()}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{when.toLocaleDateString(undefined, { weekday: "long" })}</td>
                      <td className="py-2.5 pr-4 text-good">{d.present}</td>
                      <td className="py-2.5 pr-4 text-bad">{d.absent}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{d.on_leave}</td>
                      <td className="py-2.5 pr-4">{percent}%</td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}

          {!single && data.by_student.length > 0 && (
            <Card title="Student by student" className="mb-4">
              <Table head={["Student", "Class", "Present", "Absent", "Leave", "Attendance"]}>
                {data.by_student.map(function (s) {
                  return (
                    <tr key={s.student_id}>
                      <td className="py-2.5 pr-4 font-medium">{s.name}</td>
                      <td className="py-2.5 pr-4 text-slate-500">
                        {s.class_name || "-"}{s.section_name ? " - " + s.section_name : ""}
                      </td>
                      <td className="py-2.5 pr-4 text-good">{s.present}</td>
                      <td className="py-2.5 pr-4 text-bad">{s.absent}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{s.on_leave}</td>
                      <td className="py-2.5 pr-4">
                        {s.marked === 0 ? (
                          <span className="text-slate-400">Not marked</span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Pill status={s.percentage >= 75 ? "present" : "absent"} />
                            {s.percentage}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}

          <div className="no-print mt-2">
            <Button variant="plain" icon={Printer} onClick={function () { window.print(); }}>
              Download / print this report
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              The printed copy carries the school header and the student details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
