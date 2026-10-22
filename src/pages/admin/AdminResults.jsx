// The admin does not type marks. This page is for reading the results,
// printing them, and deciding on the change requests teachers send in.
import { useEffect, useState } from "react";
import { Users, CheckCircle2, XCircle, Percent, ClipboardList, Trophy } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Table, Button, Select, Input, Field, Pill, Tabs, Stat,
  Message, Loading, Empty,
} from "../../components/ui.jsx";

export default function AdminResults() {
  const [tab, setTab] = useState("report");
  const [requests, setRequests] = useState([]);

  function loadRequests() {
    api.get("/results/requests").then(function (r) { setRequests(r.data); }).catch(function () {});
  }

  useEffect(loadRequests, []);

  const pending = requests.filter(function (r) { return r.status === "pending"; }).length;

  return (
    <Page
      title="Results"
      subtitle="Marks are entered by teachers. Here you can read them, print them, and answer change requests."
    >
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { value: "report", label: "Class report" },
          { value: "requests", label: "Change requests" + (pending > 0 ? " (" + pending + ")" : "") },
        ]}
      />

      {tab === "report" ? (
        <ClassReport />
      ) : (
        <Requests list={requests} onChanged={loadRequests} />
      )}
    </Page>
  );
}

// ------------------------------------------------------------------
// Class report, shared by the admin and (through props) anyone else
// ------------------------------------------------------------------
export function ClassReport({ sections: mySections }) {
  // When a teacher opens this, mySections is the list the admin assigned to
  // them and they pick from that. The admin gets the full class dropdown.
  const teacherMode = Array.isArray(mySections);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  const [pick, setPick] = useState({
    class_id: "", section_id: "", exam_name: "", subject_id: "",
  });

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    if (!teacherMode) {
      api.get("/classes").then(function (r) { setClasses(r.data); }).catch(function () {});
    }
    api.get("/results/exams").then(function (r) {
      setExams(r.data);
      setPick(function (o) { return { ...o, exam_name: r.data[0] ? r.data[0].name : "" }; });
    });
  }, [teacherMode]);

  // A teacher starts on the first section they teach.
  useEffect(
    function () {
      if (!teacherMode || mySections.length === 0) return;
      setPick(function (o) {
        return o.class_id
          ? o
          : { ...o, class_id: mySections[0].class_id, section_id: mySections[0].section_id };
      });
    },
    [teacherMode, mySections]
  );

  useEffect(
    function () {
      if (!pick.class_id) { setSections([]); setSubjects([]); return; }
      api.get("/classes/" + pick.class_id + "/sections").then(function (r) { setSections(r.data); });
      api.get("/classes/" + pick.class_id + "/subjects").then(function (r) { setSubjects(r.data); });
    },
    [pick.class_id]
  );

  function set(k, v) {
    setPick(function (o) { return { ...o, [k]: v }; });
    setData(null);
  }

  function load() {
    setError("");
    setData(null);

    api
      .get("/results/class", {
        params: {
          class_id: pick.class_id,
          section_id: pick.section_id,
          exam_name: pick.exam_name,
          subject_id: pick.subject_id || undefined,
        },
      })
      .then(function (res) { setData(res.data); })
      .catch(function (err) { setError(errorText(err)); });
  }

  const ready = pick.class_id && pick.section_id && pick.exam_name;
  const chosen = teacherMode
    ? mySections.find(function (c) {
        return c.class_id === Number(pick.class_id) && c.section_id === Number(pick.section_id);
      })
    : null;

  const className = teacherMode
    ? (chosen ? { name: chosen.class_name } : null)
    : classes.find(function (c) { return String(c.id) === String(pick.class_id); });

  const sectionName = teacherMode
    ? (chosen ? { name: chosen.section_name } : null)
    : sections.find(function (s) { return String(s.id) === String(pick.section_id); });

  return (
    <div>
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>

      <Card className="mb-4 no-print">
        <div className="grid sm:grid-cols-4 gap-3">
          {teacherMode ? (
            <div className="sm:col-span-2">
              <Field label="Class and section">
                <Select
                  value={pick.class_id + "-" + pick.section_id}
                  onChange={function (e) {
                    const p = e.target.value.split("-");
                    setPick({ ...pick, class_id: Number(p[0]), section_id: Number(p[1]) });
                    setData(null);
                  }}
                >
                  {mySections.map(function (c) {
                    const key = c.class_id + "-" + c.section_id;
                    return (
                      <option key={key} value={key}>
                        {c.class_name} - Section {c.section_name}
                      </option>
                    );
                  })}
                </Select>
              </Field>
            </div>
          ) : (
            <>
              <Field label="Class">
                <Select value={pick.class_id} onChange={function (e) { set("class_id", e.target.value); }}>
                  <option value="">Choose</option>
                  {classes.map(function (c) {
                    return <option key={c.id} value={c.id}>{c.name}</option>;
                  })}
                </Select>
              </Field>

              <Field label="Section">
                <Select value={pick.section_id} onChange={function (e) { set("section_id", e.target.value); }}>
                  <option value="">Choose</option>
                  {sections.map(function (s) {
                    return <option key={s.id} value={s.id}>Section {s.name}</option>;
                  })}
                </Select>
              </Field>
            </>
          )}

          <Field label="Exam">
            <Select value={pick.exam_name} onChange={function (e) { set("exam_name", e.target.value); }}>
              {exams.map(function (e) {
                return <option key={e.name} value={e.name}>{e.name}</option>;
              })}
            </Select>
          </Field>

          <Field label="Subject" hint="Leave blank for all subjects.">
            <Select value={pick.subject_id} onChange={function (e) { set("subject_id", e.target.value); }}>
              <option value="">All subjects</option>
              {subjects.map(function (s) {
                return <option key={s.id} value={s.id}>{s.name}</option>;
              })}
            </Select>
          </Field>
        </div>

        <Button className="mt-4" onClick={load} disabled={!ready}>Show the result</Button>
      </Card>

      {data && <Report data={data} className={className} sectionName={sectionName} />}
    </div>
  );
}

function Report({ data, className, sectionName }) {
  if (data.summary.with_result === 0) {
    return (
      <Card>
        <Empty icon={Trophy}>No marks have been submitted for this exam yet.</Empty>
      </Card>
    );
  }

  const s = data.summary;

  return (
    <div className="print-area">
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-semibold">Government Model School</h2>
        <p className="text-sm">
          {data.exam_name} — {className ? className.name : ""}
          {sectionName ? " Section " + sectionName.name : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Stat icon={Users} label="Students" value={s.total_students} />
        <Stat icon={ClipboardList} label="With result" value={s.with_result} />
        <Stat icon={CheckCircle2} label="Passed" value={s.passed} tone="good" />
        <Stat icon={XCircle} label="Failed" value={s.failed} tone="bad" />
        <Stat icon={Percent} label="Class average" value={s.class_average + "%"} />
      </div>

      <Card title="Position holders" icon={Trophy} className="mb-4">
        {data.position_holders.length === 0 ? (
          <Empty>No positions yet.</Empty>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {data.position_holders.map(function (p) {
              return (
                <div key={p.student_id} className="border border-slate-200 rounded-xl p-3.5">
                  <p className="text-xs text-slate-500">Position {p.position}</p>
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-sm text-slate-500">
                    {p.obtained} / {p.total} · {p.percentage}% · {p.grade}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Full result" className="mb-4">
        <Table
          head={["Pos", "Student"]
            .concat(data.subjects)
            .concat(["Total", "%", "Grade", "Result"])}
        >
          {data.students.map(function (st) {
            return (
              <tr key={st.student_id}>
                <td className="py-2.5 pr-4">{st.position || "-"}</td>
                <td className="py-2.5 pr-4 font-medium">{st.name}</td>

                {data.subjects.map(function (name) {
                  const mark = st.subjects[name];
                  const failed = st.failed_subjects.includes(name);
                  return (
                    <td key={name} className={"py-2.5 pr-4 " + (failed ? "text-bad font-medium" : "")}>
                      {mark ? mark.obtained : "-"}
                    </td>
                  );
                })}

                <td className="py-2.5 pr-4">{st.has_result ? st.obtained + " / " + st.total : "-"}</td>
                <td className="py-2.5 pr-4">{st.has_result ? st.percentage + "%" : "-"}</td>
                <td className="py-2.5 pr-4">{st.has_result ? st.grade : "-"}</td>
                <td className="py-2.5 pr-4">
                  <Pill status={st.status === "Pass" ? "present" : st.status === "Fail" ? "absent" : "leave"} />
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card title={"Passed (" + data.passed.length + ")"}>
          {data.passed.length === 0 ? <Empty>Nobody passed.</Empty> : (
            <ul className="text-sm space-y-1">
              {data.passed.map(function (p) {
                return (
                  <li key={p.student_id} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-slate-500">{p.percentage}%</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={"Failed (" + data.failed.length + ")"}>
          {data.failed.length === 0 ? <Empty>Nobody failed.</Empty> : (
            <ul className="text-sm space-y-1">
              {data.failed.map(function (p) {
                return (
                  <li key={p.student_id}>
                    <div className="flex justify-between">
                      <span>{p.name}</span>
                      <span className="text-bad">{p.percentage}%</span>
                    </div>
                    {p.failed_subjects.length > 0 && (
                      <p className="text-xs text-slate-400">
                        Failed in {p.failed_subjects.join(", ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="no-print">
        <Button onClick={function () { window.print(); }}>Download / print this result</Button>
        <p className="text-xs text-slate-400 mt-2">
          Choose "Save as PDF" in the print window to keep a copy.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Change requests from teachers
// ------------------------------------------------------------------
function Requests({ list, onChanged }) {
  const [note, setNote] = useState({});
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function decide(id, approve) {
    setError("");
    try {
      const res = await api.post("/results/requests/" + id + "/decide", {
        approve: approve,
        admin_note: note[id] || null,
      });
      setDone(res.data.message);
      onChanged();
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (list.length === 0) {
    return <Card><Empty>No teacher has asked to change a result.</Empty></Card>;
  }

  return (
    <div className="space-y-3">
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      {list.map(function (r) {
        return (
          <Card key={r.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="font-medium text-ink">{r.teacher_name}</h3>
                <p className="text-sm text-slate-500">
                  {r.subject_name} · {r.class_name} - Section {r.section_name} · {r.exam_name}
                </p>
              </div>
              <div className="text-right">
                <Pill status={r.status === "used" ? "paid" : r.status} />
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-lg p-3">{r.reason}</p>

            {r.status === "pending" ? (
              <div className="mt-4 pt-3 border-t border-slate-100 grid sm:grid-cols-3 gap-3 items-end">
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
                  <Button variant="good" onClick={function () { decide(r.id, true); }}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={function () { decide(r.id, false); }}>
                    Refuse
                  </Button>
                </div>
              </div>
            ) : (
              r.admin_note && (
                <p className="text-sm text-slate-500 mt-3">Your note: {r.admin_note}</p>
              )
            )}
          </Card>
        );
      })}
    </div>
  );
}
