// Classes hold sections and subjects. The monthly fee set here is what
// the fee slip generator uses for every student in that class. Each section
// can also have one class teacher: the only teacher allowed to mark that
// section's attendance.
import { useEffect, useState } from "react";
import { Plus, BookOpen, X, Star } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Button, Input, Select, Field, Message, Loading, Empty, money, Confirm,
} from "../../components/ui.jsx";

export default function Classes() {
  const [classes, setClasses] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.get("/classes").then(function (res) { setClasses(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  useEffect(function () {
    api.get("/teachers").then(function (res) { setTeachers(res.data); }).catch(function () {});
  }, []);

  async function addClass(e) {
    e.preventDefault();
    try {
      await api.post("/classes", { name: name, monthly_fee: fee || 0 });
      setName(""); setFee(""); setDone("Class added."); load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.delete("/classes/" + removing.id);
      setRemoving(null);
      load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!classes) return <Loading />;

  return (
    <Page title="Classes and sections" subtitle="One class can have many sections, like A and B.">
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <Card title="Add a class" icon={Plus} className="mb-4">
        <form onSubmit={addClass} className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Class name" required>
            <Input value={name} onChange={function (e) { setName(e.target.value); }} placeholder="Class 6" required />
          </Field>
          <Field label="Monthly fee" hint="Used when generating fee slips.">
            <Input type="number" value={fee} onChange={function (e) { setFee(e.target.value); }} placeholder="3000" />
          </Field>
          <Button type="submit">Add class</Button>
        </form>
      </Card>

      {classes.length === 0 ? (
        <Card><Empty icon={BookOpen}>No classes yet. Add your first class above.</Empty></Card>
      ) : (
        <div className="space-y-3">
          {classes.map(function (c) {
            return (
              <ClassRow
                key={c.id}
                cls={c}
                teachers={teachers}
                onChanged={load}
                onError={setError}
                onDone={setDone}
                onDelete={function () { setRemoving(c); }}
              />
            );
          })}
        </div>
      )}

      <Confirm
        open={!!removing}
        title={removing ? "Delete " + removing.name + "?" : ""}
        body="Its sections and subjects are deleted too. Students who have left the school are kept in the records but detached from this class. A class with current students cannot be deleted."
        confirmLabel="Delete class"
        danger
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={function () { setRemoving(null); }}
      />
    </Page>
  );
}

function ClassRow({ cls, teachers, onChanged, onError, onDone, onDelete }) {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sectionName, setSectionName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cls.name);
  const [fee, setFee] = useState(cls.monthly_fee);
  const [saving, setSaving] = useState(false);

  async function saveClass() {
    setSaving(true);
    try {
      await api.put("/classes/" + cls.id, { name: name, monthly_fee: fee });
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  function load() {
    api.get("/classes/" + cls.id + "/sections").then(function (r) { setSections(r.data); });
    api.get("/classes/" + cls.id + "/subjects").then(function (r) { setSubjects(r.data); });
  }

  useEffect(load, [cls.id]);

  async function addSection(e) {
    e.preventDefault();
    try {
      await api.post("/classes/" + cls.id + "/sections", { name: sectionName });
      setSectionName(""); load();
    } catch (err) {
      onError(errorText(err));
    }
  }

  async function addSubject(e) {
    e.preventDefault();
    try {
      await api.post("/classes/" + cls.id + "/subjects", { name: subjectName });
      setSubjectName(""); load();
    } catch (err) {
      onError(errorText(err));
    }
  }

  async function removeSection(id, name) {
    if (!window.confirm("Remove section " + name + " from " + cls.name + "?")) return;
    try {
      await api.delete("/classes/sections/" + id);
      onError(""); load();
    } catch (err) {
      onError(errorText(err));
    }
  }

  async function removeSubject(id, name) {
    if (!window.confirm("Remove " + name + " from " + cls.name + "?")) return;
    try {
      const res = await api.delete("/classes/subjects/" + id);
      onError(""); onDone(res.data.message); load();
    } catch (err) {
      onError(errorText(err));
    }
  }

  return (
    <Card>
      {editing ? (
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Class name">
            <Input value={name} onChange={function (e) { setName(e.target.value); }} />
          </Field>

          <Field label="Monthly fee" hint="Used the next time you generate slips.">
            <Input type="number" value={fee} onChange={function (e) { setFee(e.target.value); }} />
          </Field>

          <div className="flex gap-2">
            <Button onClick={saveClass} loading={saving}>Save</Button>
            <Button variant="plain" onClick={function () { setEditing(false); setName(cls.name); setFee(cls.monthly_fee); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink">{cls.name}</h3>
            <p className="text-sm text-slate-500">{money(cls.monthly_fee)} a month · {cls.student_count} students</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="plain" onClick={function () { setEditing(true); }}>Edit name and fee</Button>
            <Button size="sm" variant="plain" onClick={onDelete}>Delete class</Button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-sm font-medium text-ink mb-2">Sections and class teachers</p>
          <div className="space-y-2 mb-3">
            {sections.length === 0 && <p className="text-sm text-slate-400">No sections yet.</p>}
            {sections.map(function (s) {
              return (
                <SectionRow
                  key={s.id}
                  section={s}
                  teachers={teachers}
                  onRemove={function () { removeSection(s.id, s.name); }}
                  onChanged={function (msg) { onError(""); onDone(msg); load(); }}
                  onError={onError}
                />
              );
            })}
          </div>
          <form onSubmit={addSection} className="flex gap-2">
            <Input value={sectionName} onChange={function (e) { setSectionName(e.target.value); }} placeholder="A" required />
            <Button variant="plain" type="submit">Add section</Button>
          </form>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">Subjects</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {subjects.length === 0 && <span className="text-sm text-slate-400">No subjects yet.</span>}
            {subjects.map(function (s) {
              return (
                <span key={s.id} className="inline-flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm">
                  {s.name}
                  <button onClick={function () { removeSubject(s.id, s.name); }} className="text-slate-400 hover:text-bad" aria-label="Delete subject">
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
          <form onSubmit={addSubject} className="flex gap-2">
            <Input value={subjectName} onChange={function (e) { setSubjectName(e.target.value); }} placeholder="Mathematics" required />
            <Button variant="plain" type="submit">Add</Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

// One section, with its class teacher and a button to set or change them.
// A teacher can only be the class teacher of one section anywhere in the
// school, which the server checks; this shows the friendly error if so.
function SectionRow({ section, teachers, onRemove, onChanged, onError }) {
  const [editing, setEditing] = useState(false);
  const [teacherId, setTeacherId] = useState(section.class_teacher_id || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await api.put("/classes/sections/" + section.id + "/class-teacher", {
        teacher_id: teacherId || null,
      });
      setEditing(false);
      onChanged(res.data.message);
    } catch (err) {
      onError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-ink">Section {section.name}</span>

        {editing ? (
          <>
            <Select value={teacherId} onChange={function (e) { setTeacherId(e.target.value); }} className="w-56 py-1.5">
              <option value="">No class teacher</option>
              {teachers.map(function (t) { return <option key={t.id} value={t.id}>{t.name}</option>; })}
            </Select>
            <Button size="sm" onClick={save} loading={saving}>Save</Button>
            <Button size="sm" variant="plain" onClick={function () { setEditing(false); setTeacherId(section.class_teacher_id || ""); }}>
              Cancel
            </Button>
          </>
        ) : section.class_teacher_name ? (
          <span className="inline-flex items-center gap-1.5 text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full text-xs font-semibold">
            <Star size={11} /> {section.class_teacher_name}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">No class teacher set</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!editing && (
          <button onClick={function () { setEditing(true); }} className="text-xs text-teal font-semibold underline">
            {section.class_teacher_name ? "Change" : "Set class teacher"}
          </button>
        )}
        <button onClick={onRemove} className="text-slate-400 hover:text-bad" aria-label="Delete section">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
