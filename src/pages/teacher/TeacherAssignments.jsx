// Post an assignment for one class and section. Students in that section
// and their parents both see it, and students can upload their work.
import { useEffect, useState } from "react";
import { FileText, Plus, Paperclip } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Table, Button, Select, Input, Textarea, Field, Message, Loading,
  Empty, FileInput, Confirm,
} from "../../components/ui.jsx";

export default function TeacherAssignments() {
  const [myClasses, setMyClasses] = useState([]);
  const [list, setList] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api
      .get("/assignments")
      .then(function (res) { setList(res.data); })
      .catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  useEffect(function () {
    api
      .get("/teachers/my-classes")
      .then(function (res) { setMyClasses(res.data); })
      .catch(function () {});
  }, []);

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.delete("/assignments/" + removing.id);
      setDone("Assignment deleted.");
      setRemoving(null);
      load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!list) return <Loading />;

  if (viewing) {
    return <Submissions assignment={viewing} onBack={function () { setViewing(null); }} />;
  }


  return (
    <Page
      title="Assignments"
      subtitle="Everything you have given to your classes."
      action={
        <Button icon={Plus} onClick={function () { setShowForm(!showForm); }} disabled={myClasses.length === 0}>
          {showForm ? "Close form" : "New assignment"}
        </Button>
      }
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      {myClasses.length === 0 && (
        <Card><Empty>No class has been assigned to you yet. Ask the admin to assign one.</Empty></Card>
      )}

      {showForm && (
        <NewAssignment
          myClasses={myClasses}
          onDone={function () {
            setShowForm(false);
            setDone("Assignment posted. Students and parents have been notified.");
            load();
          }}
          onError={setError}
        />
      )}

      {list.length === 0 && myClasses.length > 0 && (
        <Card><Empty icon={FileText}>You have not posted an assignment yet.</Empty></Card>
      )}

      <div className="space-y-3">
        {list.map(function (a) {
          return (
            <Card key={a.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-medium text-ink">{a.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {a.class_name} - Section {a.section_name}
                    {a.subject_name ? " · " + a.subject_name : ""}
                    {a.due_date ? " · due " + new Date(a.due_date).toLocaleDateString() : ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm">
                    <strong>{a.submission_count}</strong>
                    <span className="text-slate-500"> of {a.student_count} handed in</span>
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="plain" onClick={function () { setViewing(a); }}>
                      See who submitted
                    </Button>
                    <Button size="sm" variant="danger" onClick={function () { setRemoving(a); }}>Delete</Button>
                  </div>
                </div>
              </div>

              {a.description && <p className="text-sm text-slate-600 mt-3">{a.description}</p>}

              {a.file && (
                <a
                  href={"/uploads/" + a.file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-teal underline mt-3 font-medium"
                >
                  <Paperclip size={14} /> Your attached file
                </a>
              )}
            </Card>
          );
        })}
      </div>

      <Confirm
        open={!!removing}
        title={removing ? "Delete \"" + removing.title + "\"?" : ""}
        body="Every student's uploaded work for this assignment is deleted too. This cannot be undone."
        confirmLabel="Delete assignment"
        danger
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={function () { setRemoving(null); }}
      />
    </Page>
  );
}

function NewAssignment({ myClasses, onDone, onError }) {

  const today = new Date().toISOString().split("T")[0];

  const [picked, setPicked] = useState(
    myClasses.length > 0 ? myClasses[0].class_id + "-" + myClasses[0].section_id : ""
  );
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", subject_id: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  // Only the subjects this teacher takes in this section. Asking the class
  // for all its subjects would offer somebody else's.
  useEffect(
    function () {
      if (!picked) return;
      const parts = picked.split("-");

      api
        .get("/teachers/my-subjects", {
          params: { class_id: parts[0], section_id: parts[1] },
        })
        .then(function (res) {
          setSubjects(res.data);
          setForm(function (o) {
            const stillMine = res.data.some(function (x) {
              return String(x.id) === String(o.subject_id);
            });
            return stillMine ? o : { ...o, subject_id: "" };
          });
        })
        .catch(function () { setSubjects([]); });
    },
    [picked]
  );

  function set(k, v) {
    setForm(function (old) { return { ...old, [k]: v }; });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const parts = picked.split("-");
      const data = new FormData();

      data.append("class_id", parts[0]);
      data.append("section_id", parts[1]);
      data.append("title", form.title);
      data.append("description", form.description);
      if (form.due_date) data.append("due_date", form.due_date);
      if (form.subject_id) data.append("subject_id", form.subject_id);
      if (file) data.append("file", file);

      await api.post("/assignments", data);
      onDone();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="New assignment" icon={Plus} className="mb-4">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Class and section">
            <Select value={picked} onChange={function (e) { setPicked(e.target.value); }}>
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

          <Field label="Subject">
            <Select value={form.subject_id} onChange={function (e) { set("subject_id", e.target.value); }}>
              <option value="">
                {subjects.length === 0
                  ? "No subject assigned to you here"
                  : "General (no subject)"}
              </option>
              {subjects.map(function (s) {
                return <option key={s.id} value={s.id}>{s.name}</option>;
              })}
            </Select>
          </Field>

          <Field label="Due date">
            <Input
              type="date"
              value={form.due_date}
              onChange={function (e) { set("due_date", e.target.value); }}
              min={today}
            />
          </Field>
        </div>

        <Field label="Title">
          <Input
            value={form.title}
            onChange={function (e) { set("title", e.target.value); }}
            placeholder="Chapter 4 exercise questions"
            required
          />
        </Field>

        <Field label="Instructions">
          <Textarea
            value={form.description}
            onChange={function (e) { set("description", e.target.value); }}
            rows={3}
          />
        </Field>

        <Field label="Attach a file">
          <FileInput onChange={function (e) { setFile(e.target.files[0]); }} hint="Optional question paper or worksheet. Up to 5 MB." />
        </Field>

        <Button type="submit" loading={busy}>
          {busy ? "Posting..." : "Post assignment"}
        </Button>
      </form>
    </Card>
  );
}

function Submissions({ assignment, onBack }) {
  const [rows, setRows] = useState(null);

  useEffect(
    function () {
      api
        .get("/assignments/" + assignment.id + "/submissions")
        .then(function (res) { setRows(res.data); })
        .catch(function () { setRows([]); });
    },
    [assignment.id]
  );

  if (!rows) return <Loading />;

  const handedIn = rows.filter(function (r) { return r.submitted_at; }).length;

  return (
    <Page
      title={assignment.title}
      subtitle={assignment.class_name + " - Section " + assignment.section_name + " · " + handedIn + " of " + rows.length + " handed in"}
      back={{ label: "Back to assignments", onClick: onBack }}
    >
      <Card>
        {rows.length === 0 ? (
          <Empty>No students in this section yet.</Empty>
        ) : (
          <Table head={["Student", "Submitted on", "File"]}>
            {rows.map(function (r) {
              return (
                <tr key={r.student_id}>
                  <td className="py-2.5 pr-4 font-medium">{r.name}</td>
                  <td className="py-2.5 pr-4">
                    {r.submitted_at ? (
                      new Date(r.submitted_at).toLocaleString()
                    ) : (
                      <span className="text-bad">Not handed in</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    {r.file ? (
                      <a
                        href={"/uploads/" + r.file}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal underline font-medium"
                      >
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </Page>
  );
}
