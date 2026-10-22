// A teacher enters marks once. After that the sheet is locked, and the only
// way to change it is to ask the admin. If the admin approves, the sheet opens
// for one more save and then locks again.
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Table, Button, Select, Input, Textarea, Field, Pill,
  Message, Loading, Empty,
} from "../../components/ui.jsx";

export default function TeacherResults() {
  const [myClasses, setMyClasses] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [requests, setRequests] = useState([]);

  const [pick, setPick] = useState({
    picked: "",
    subject_id: "",
    exam_name: "",
    total_marks: 100,
  });

  const [sheet, setSheet] = useState(null);
  const [marks, setMarks] = useState({});
  const [reason, setReason] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  function loadRequests() {
    api.get("/results/requests").then(function (r) { setRequests(r.data); }).catch(function () {});
  }

  useEffect(function () {
    api
      .get("/teachers/my-classes")
      .then(function (res) {
        setMyClasses(res.data);
        if (res.data.length > 0) {
          setPick(function (o) {
            return { ...o, picked: res.data[0].class_id + "-" + res.data[0].section_id };
          });
        }
      })
      .catch(function (err) { setError(errorText(err)); });

    api.get("/results/exams").then(function (r) {
      setExams(r.data);
      setPick(function (o) { return { ...o, exam_name: r.data[0] ? r.data[0].name : "" }; });
    });

    loadRequests();
  }, []);

  useEffect(
    function () {
      if (!pick.picked) return;
      const parts = pick.picked.split("-");

      // Only the subjects this teacher takes in this section.
      api
        .get("/teachers/my-subjects", {
          params: { class_id: parts[0], section_id: parts[1] },
        })
        .then(function (r) {
          setSubjects(r.data);
          // If the subject already chosen is not theirs here, clear it.
          setPick(function (o) {
            const stillMine = r.data.some(function (x) {
              return String(x.id) === String(o.subject_id);
            });
            return stillMine ? o : { ...o, subject_id: "" };
          });
        })
        .catch(function () { setSubjects([]); });

      setSheet(null);
    },
    [pick.picked]
  );

  function set(key, value) {
    setPick(function (o) { return { ...o, [key]: value }; });
    setSheet(null);
  }

  function parts() {
    const p = pick.picked.split("-");
    return { class_id: Number(p[0]), section_id: Number(p[1]) };
  }

  function loadSheet() {
    const p = parts();
    setError("");
    setSheet(null);

    api
      .get("/results/entry", {
        params: {
          class_id: p.class_id,
          section_id: p.section_id,
          subject_id: pick.subject_id,
          exam_name: pick.exam_name,
        },
      })
      .then(function (res) {
        setSheet(res.data);
        setPick(function (o) { return { ...o, total_marks: res.data.total_marks }; });

        const start = {};
        res.data.students.forEach(function (r) {
          start[r.student_id] = r.obtained_marks === null ? "" : String(r.obtained_marks);
        });
        setMarks(start);
      })
      .catch(function (err) { setError(errorText(err)); });
  }

  async function save() {
    const p = parts();
    setError("");
    setBusy(true);

    try {
      const payload = sheet.students.map(function (r) {
        return { student_id: r.student_id, obtained_marks: Number(marks[r.student_id] || 0) };
      });

      const res = await api.post("/results", {
        class_id: p.class_id,
        section_id: p.section_id,
        subject_id: pick.subject_id,
        exam_name: pick.exam_name,
        total_marks: Number(pick.total_marks),
        marks: payload,
      });

      setDone(res.data.message + " Parents have been notified.");
      loadSheet();
      loadRequests();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function askForChange() {
    const p = parts();
    setError("");

    try {
      const res = await api.post("/results/requests", {
        class_id: p.class_id,
        section_id: p.section_id,
        subject_id: pick.subject_id,
        exam_name: pick.exam_name,
        reason: reason,
      });

      setDone(res.data.message);
      setAskOpen(false);
      setReason("");
      loadSheet();
      loadRequests();
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (myClasses === null) return <Loading />;

  if (myClasses.length === 0) {
    return (
      <Page title="Results">
        <Card><Empty icon={Trophy}>No class has been assigned to you yet. Ask the admin.</Empty></Card>
      </Page>
    );
  }

  const ready = pick.picked && pick.subject_id && pick.exam_name;

  return (
    <Page
      title="Results"
      subtitle="Marks are submitted once. To correct them afterwards, ask the admin."
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <Card className="mb-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Class and section">
            <Select value={pick.picked} onChange={function (e) { set("picked", e.target.value); }}>
              {myClasses.map(function (c) {
                const key = c.class_id + "-" + c.section_id;
                return (
                  <option key={key} value={key}>
                    {c.class_name} - Section {c.section_name}
                  </option>
                );
              })}
            </Select>
          </Field>

          <Field label="Subject" hint="Only the subjects you teach in this section.">
            <Select
              value={pick.subject_id}
              onChange={function (e) { set("subject_id", e.target.value); }}
              disabled={subjects.length === 0}
            >
              <option value="">
                {subjects.length === 0 ? "No subject assigned to you here" : "Choose a subject"}
              </option>
              {subjects.map(function (s) {
                return <option key={s.id} value={s.id}>{s.name}</option>;
              })}
            </Select>
          </Field>

          <Field label="Exam">
            <Select value={pick.exam_name} onChange={function (e) { set("exam_name", e.target.value); }}>
              {exams.map(function (e) {
                return <option key={e.name} value={e.name}>{e.name}</option>;
              })}
            </Select>
          </Field>

          <Field label="Paper total" hint="Between 1 and 200.">
            <Input
              type="number"
              min="1"
              max="200"
              value={pick.total_marks}
              disabled={sheet && !sheet.can_edit}
              onChange={function (e) { setPick({ ...pick, total_marks: e.target.value }); }}
            />
          </Field>
        </div>

        <Button className="mt-4" onClick={loadSheet} disabled={!ready}>
          Open the marks sheet
        </Button>
      </Card>

      {sheet && sheet.students.length === 0 && (
        <Card><Empty>There are no active students in this section.</Empty></Card>
      )}

      {sheet && sheet.students.length > 0 && (
        <Card title={pick.exam_name + " marks"} icon={Trophy}>
          {sheet.submitted && !sheet.can_edit && (
            <Message type="info">
              These marks are submitted and locked.{" "}
              {sheet.request_status === "pending"
                ? "Your change request is with the admin."
                : "If something is wrong, send a change request below."}
            </Message>
          )}

          {sheet.can_edit && sheet.submitted && (
            <Message type="success">
              The admin approved your request. Correct the marks and submit. The sheet
              will lock again straight away.
            </Message>
          )}

          <div className="divide-y divide-slate-100">
            {sheet.students.map(function (r) {
              return (
                <div key={r.student_id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-ink">{r.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={pick.total_marks}
                      disabled={!sheet.can_edit}
                      value={marks[r.student_id] || ""}
                      onChange={function (e) {
                        const v = e.target.value;
                        setMarks(function (o) { return { ...o, [r.student_id]: v }; });
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-slate-400">/ {pick.total_marks}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {sheet.can_edit && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Button onClick={save} loading={busy}>
                {busy ? "Submitting..." : "Submit marks"}
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                Check them before you submit. You cannot change them afterwards without
                the admin's approval.
              </p>
            </div>
          )}

          {sheet.submitted && !sheet.can_edit && sheet.request_status !== "pending" && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {askOpen ? (
                <div className="space-y-3">
                  <Field label="Why do these marks need changing?">
                    <Textarea
                      value={reason}
                      onChange={function (e) { setReason(e.target.value); }}
                      placeholder="Question 4 was marked wrong for three students."
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button onClick={askForChange} disabled={reason.trim().length < 5}>
                      Send request to admin
                    </Button>
                    <Button variant="plain" onClick={function () { setAskOpen(false); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="plain" onClick={function () { setAskOpen(true); }}>
                  Request a change from the admin
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {requests.length > 0 && (
        <Card title="Your change requests" className="mt-4">
          <Table head={["Sheet", "Reason", "Sent", "Status", "Admin note"]}>
            {requests.map(function (r) {
              return (
                <tr key={r.id}>
                  <td className="py-2.5 pr-4">
                    {r.subject_name} · {r.class_name} - {r.section_name}
                    <span className="block text-xs text-slate-400">{r.exam_name}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{r.reason}</td>
                  <td className="py-2.5 pr-4 text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Pill status={r.status === "used" ? "paid" : r.status} />
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.admin_note || "-"}</td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}
    </Page>
  );
}
