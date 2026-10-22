// These views are used by the student pages and the parent pages.
// Attendance lives in AttendanceReport.jsx because all four roles share it.
// The parent passes a child's id; the student passes their own id.
// Only difference: a student can upload assignment work, a parent cannot.
import { useEffect, useState } from "react";
import { Printer, Trophy, Wallet, FileText, UploadCloud, Paperclip, Clock, CalendarClock } from "lucide-react";
import api, { errorText } from "../api";
import { FeeSlip, ReportCard } from "./PrintDocs.jsx";
import {
  Card, Table, Pill, Empty, Loading, Message, Button, money,
} from "./ui.jsx";
import { TimetableGrid } from "./TimetableGrid.jsx";

// ------------------------------------------------------------------
// CLASS TIMETABLE  (read-only, for a student or their parent)
// ------------------------------------------------------------------
export function ClassTimetableView({ classId, sectionId, studentId, isParent }) {
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    function () {
      if (!classId || !sectionId) return;
      setGrid(null);
      setError("");

      const params = isParent ? { student_id: studentId } : {};

      api
        .get("/timetable/class/" + classId + "/" + sectionId, { params })
        .then(function (res) { setGrid(res.data); })
        .catch(function (err) { setError(errorText(err)); });
    },
    [classId, sectionId, studentId, isParent]
  );

  if (error) {
    return (
      <Card icon={CalendarClock}>
        <Empty>{error}</Empty>
      </Card>
    );
  }

  if (!grid) return <Loading />;

  return (
    <Card icon={CalendarClock} title={grid.class_name + " - Section " + grid.section_name}>
      <TimetableGrid
        periods={grid.periods}
        days={grid.days}
        slots={grid.slots}
        renderCell={function (cell) {
          return (
            <>
              <span className="block text-xs font-semibold text-ink truncate">
                {cell.subject_name || "General"}
              </span>
              <span className="block text-[0.7rem] text-slate-500 truncate">
                {cell.teacher_name || "No teacher"}
              </span>
            </>
          );
        }}
      />
    </Card>
  );
}

// ------------------------------------------------------------------
// RESULTS
// ------------------------------------------------------------------
export function ResultsView({ studentId, studentName }) {
  const [exams, setExams] = useState(null);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    function () {
      if (!studentId) return;
      setExams(null);

      api.get("/results/student/" + studentId).then(function (res) { setExams(res.data); }).catch(function (err) { setError(errorText(err)); });
      api.get("/students/" + studentId).then(function (res) { setStudent(res.data); }).catch(function () {});
    },
    [studentId]
  );

  if (error) return <Message type="error">{error}</Message>;
  if (!exams) return <Loading />;
  if (exams.length === 0) {
    return <Card><Empty icon={Trophy}>No result has been published yet.</Empty></Card>;
  }

  return (
    <div className="space-y-4 print-area">
      {exams.map(function (exam) {
        return <ReportCard key={exam.exam_name} exam={exam} student={student} />;
      })}

      <div className="no-print">
        <Button variant="plain" icon={Printer} onClick={function () { window.print(); }}>
          Download / print report card
        </Button>
        <p className="text-xs text-slate-400 mt-2">
          Choose "Save as PDF" in the print window to keep a copy for{" "}
          {student ? student.name : studentName || "the student"}.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// FEES  (list + printable slip)
// ------------------------------------------------------------------
export function FeesView({ studentId, isParent }) {
  const [slips, setSlips] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    function () {
      if (!studentId) return;
      setSlips(null);
      const params = isParent ? { student_id: studentId } : {};
      api.get("/fees", { params }).then(function (res) { setSlips(res.data); }).catch(function (err) { setError(errorText(err)); });
    },
    [studentId, isParent]
  );

  function openSlip(id) {
    api.get("/fees/slip/" + id).then(function (res) { setOpen(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  if (error) return <Message type="error">{error}</Message>;
  if (!slips) return <Loading />;

  if (open) {
    return <FeeSlip slip={open} onBack={function () { setOpen(null); }} />;
  }

  const due = slips.reduce(function (sum, s) { return sum + s.balance; }, 0);

  return (
    <div className="space-y-4">
      {due > 0 && (
        <Message type="info">
          Outstanding balance: <strong>{money(due)}</strong>. Payments are taken at the school office.
        </Message>
      )}

      <Card title="Fee slips" icon={Wallet}>
        {slips.length === 0 ? (
          <Empty>No fee slip has been generated yet.</Empty>
        ) : (
          <Table head={["Slip no", "Month", "Fee", "Late fee", "Total", "Paid", "Balance", "Status", ""]}>
            {slips.map(function (s) {
              return (
                <tr key={s.id}>
                  <td className="py-2.5 pr-4 text-slate-500">{s.slip_no}</td>
                  <td className="py-2.5 pr-4">{s.month_label}</td>
                  <td className="py-2.5 pr-4">{money(s.tuition_fee + s.other_fee)}</td>
                  <td className={"py-2.5 pr-4 " + (s.late_fee > 0 ? "text-bad" : "text-slate-400")}>{money(s.late_fee)}</td>
                  <td className="py-2.5 pr-4 font-medium">{money(s.total)}</td>
                  <td className="py-2.5 pr-4">{money(s.paid_amount)}</td>
                  <td className="py-2.5 pr-4">{money(s.balance)}</td>
                  <td className="py-2.5 pr-4"><Pill status={s.is_overdue && s.balance > 0 ? "overdue" : s.status} /></td>
                  <td className="py-2.5 pr-4">
                    <Button size="sm" variant="plain" onClick={function () { openSlip(s.id); }}>Open slip</Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------
// ASSIGNMENTS  (students can upload, parents only read)
// ------------------------------------------------------------------
export function AssignmentsView({ studentId, canSubmit, isParent }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busyId, setBusyId] = useState(null);

  function load() {
    const params = isParent ? { student_id: studentId } : {};
    api.get("/assignments", { params }).then(function (res) { setList(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(
    function () {
      if (isParent && !studentId) return;
      load();
    },
    [studentId, isParent]
  );

  function upload(assignmentId, file) {
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setBusyId(assignmentId);
    setError("");

    api
      .post("/assignments/" + assignmentId + "/submit", form)
      .then(function () { setDone("Your work was uploaded."); load(); })
      .catch(function (err) { setError(errorText(err)); })
      .finally(function () { setBusyId(null); });
  }

  if (error && !list) return <Message type="error">{error}</Message>;
  if (!list) return <Loading />;

  return (
    <div className="space-y-4">
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      {list.length === 0 && <Card><Empty icon={FileText}>No assignment has been given yet.</Empty></Card>}

      {list.map(function (a) {
        const late = a.due_date && new Date(a.due_date) < new Date() && !a.submission_id;

        return (
          <Card key={a.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">{a.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.subject_name || "General"} · {a.class_name} - {a.section_name}
                  {a.teacher_name ? " · " + a.teacher_name : ""}
                </p>
              </div>
              <div className="text-right text-sm">
                {a.due_date && (
                  <p className={"flex items-center gap-1 justify-end " + (late ? "text-bad" : "text-slate-600")}>
                    <Clock size={13} /> Due {new Date(a.due_date).toLocaleDateString()}
                  </p>
                )}
                {a.submission_id ? <Pill status="submitted" /> : <span className="text-xs text-slate-400">Not submitted</span>}
              </div>
            </div>

            {a.description && <p className="text-sm text-slate-600 mt-3">{a.description}</p>}

            {a.file && (
              <a href={"/uploads/" + a.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-teal underline mt-3 font-medium">
                <Paperclip size={14} /> Open the teacher's file
              </a>
            )}

            {a.submission_id && (
              <p className="text-sm text-slate-600 mt-3">
                You uploaded{" "}
                <a href={"/uploads/" + a.submission_file} target="_blank" rel="noreferrer" className="text-teal underline font-medium">
                  your file
                </a>{" "}
                on {new Date(a.submitted_at).toLocaleString()}.
              </p>
            )}

            {canSubmit && a.upload_closed && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-sm text-bad">
                  The due date has passed, so uploading is closed for this assignment.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {a.days_until_hidden === 0
                    ? "It disappears from your list today."
                    : a.days_until_hidden === 1
                    ? "It disappears from your list tomorrow."
                    : "It disappears from your list in " + a.days_until_hidden + " days."}
                </p>
              </div>
            )}

            {canSubmit && !a.upload_closed && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <label className="text-sm font-medium text-ink block mb-1.5 flex items-center gap-1.5">
                  <UploadCloud size={15} className="text-teal" />
                  {a.submission_id ? "Upload again to replace your file" : "Upload your work"}
                </label>
                <input
                  type="file"
                  disabled={busyId === a.id}
                  onChange={function (e) { upload(a.id, e.target.files[0]); }}
                  className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold"
                />
                {busyId === a.id && <span className="text-sm text-slate-500 ml-2">Uploading...</span>}
                <p className="text-xs text-slate-400 mt-1">PDF, Word or image. Up to 5 MB.</p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
