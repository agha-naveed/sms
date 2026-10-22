// Add teachers and decide which class + section each one can work with.
// Those assignments are what let a teacher mark attendance at all.
import { useEffect, useState } from "react";
import { UserPlus, Users, X, Star, KeyRound } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Button, Select, Input, Field, Message, Loading, Empty, PhoneInput,
  Chip, Confirm, RevealModal,
} from "../../components/ui.jsx";

export default function Teachers() {
  const [list, setList] = useState(null);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [removing, setRemoving] = useState(null); // teacher pending delete confirmation
  const [resetting, setResetting] = useState(null); // teacher pending password reset confirmation
  const [newPassword, setNewPassword] = useState(null); // { name, password } to reveal once
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api.get("/teachers").then(function (res) { setList(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  useEffect(function () {
    api.get("/classes").then(function (res) { setClasses(res.data); }).catch(function () {});
  }, []);

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.delete("/teachers/" + removing.id);
      setDone("Teacher removed.");
      setRemoving(null);
      load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset() {
    setBusy(true);
    try {
      const res = await api.put("/teachers/" + resetting.id + "/reset-password");
      setNewPassword({ name: resetting.name, password: res.data.password });
      setResetting(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  function removeClass(linkId) {
    api.delete("/teachers/classes/" + linkId).then(load).catch(function (err) { setError(errorText(err)); });
  }

  if (!list) return <Loading />;

  return (
    <Page
      title="Teachers"
      subtitle="Each teacher can only see the classes you assign to them. Class teachers, who mark attendance, are set from the Classes page."
      action={
        <Button icon={UserPlus} onClick={function () { setShowForm(!showForm); }}>
          {showForm ? "Close form" : "Add a teacher"}
        </Button>
      }
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      {showForm && (
        <AddTeacher
          onDone={function () { setShowForm(false); setDone("Teacher added. Now assign them a class."); load(); }}
          onError={setError}
        />
      )}

      {assigning && (
        <AssignClass
          teacher={assigning}
          classes={classes}
          onClose={function () { setAssigning(null); }}
          onSaved={function (msg) { setAssigning(null); setDone(msg || "Classes assigned."); load(); }}
        />
      )}

      {list.length === 0 ? (
        <Card><Empty icon={Users}>No teachers yet. Add one to get started.</Empty></Card>
      ) : (
        <div className="space-y-3">
          {list.map(function (t) {
            return (
              <Card key={t.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink flex items-center gap-2">
                      {t.name}
                      {t.class_teacher_of && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-semibold">
                          <Star size={11} /> Class teacher: {t.class_teacher_of.class_name} - {t.class_teacher_of.section_name}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {t.email} {t.phone ? " · " + t.phone : ""}
                      {t.qualification ? " · " + t.qualification : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="plain" onClick={function () { setAssigning(t); }}>Assign classes</Button>
                    <Button size="sm" variant="plain" icon={KeyRound} onClick={function () { setResetting(t); }}>Reset password</Button>
                    <Button size="sm" variant="danger" onClick={function () { setRemoving(t); }}>Remove</Button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  {t.classes.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No class assigned yet. This teacher cannot mark attendance until you assign one.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {t.classes.map(function (c) {
                        return (
                          <span key={c.id} className="inline-flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 text-sm">
                            {c.class_name} - {c.section_name}
                            {c.subject_name ? " (" + c.subject_name + ")" : ""}
                            <button onClick={function () { removeClass(c.id); }} className="text-slate-400 hover:text-bad" aria-label="Remove this class">
                              <X size={14} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Confirm
        open={!!removing}
        title={removing ? "Remove " + removing.name + "?" : ""}
        body="Their login will stop working right away. This cannot be undone."
        confirmLabel="Remove teacher"
        danger
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={function () { setRemoving(null); }}
      />

      <Confirm
        open={!!resetting}
        title={resetting ? "Reset " + resetting.name + "'s password?" : ""}
        body="A new temporary password will be generated. Their old password will stop working."
        confirmLabel="Reset password"
        busy={busy}
        onConfirm={confirmReset}
        onCancel={function () { setResetting(null); }}
      />

      {newPassword && (
        <RevealModal
          title={newPassword.name + "'s new password"}
          rows={[{ label: "Password", value: newPassword.password }]}
          onClose={function () { setNewPassword(null); }}
        />
      )}
    </Page>
  );
}

function AddTeacher({ onDone, onError }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", qualification: "" });
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm(function (old) { return { ...old, [k]: v }; });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/teachers", form);
      onDone();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="New teacher" icon={UserPlus} className="mb-4">
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <Input value={form.name} onChange={function (e) { set("name", e.target.value); }} required />
        </Field>
        <Field label="Login name" hint="Their address becomes this, plus @school.com.">
          <div className="flex">
            <input
              className="w-full border border-slate-300 rounded-l-xl px-3.5 py-2.5 text-[0.95rem] bg-white focus:border-teal focus:ring-4 focus:ring-brand-100 outline-none"
              value={form.email}
              onChange={function (e) { set("email", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "")); }}
              placeholder="ayesha.malik"
              required
            />
            <span className="inline-flex items-center px-3.5 rounded-r-xl border border-l-0 border-slate-300 bg-slate-50 text-sm text-slate-600 font-medium">
              @school.com
            </span>
          </div>
        </Field>
        <Field label="Password" hint="At least 6 characters. Give it to the teacher directly.">
          <Input value={form.password} onChange={function (e) { set("password", e.target.value); }} required />
        </Field>
        <Field label="Mobile number">
          <PhoneInput value={form.phone} onChange={function (v) { set("phone", v); }} />
        </Field>
        <Field label="Qualification">
          <Input value={form.qualification} onChange={function (e) { set("qualification", e.target.value); }} />
        </Field>
        <div className="flex items-end">
          <Button type="submit" loading={busy}>Add teacher</Button>
        </div>
      </form>
    </Card>
  );
}

function AssignClass({ teacher, classes, onClose, onSaved }) {
  const [classId, setClassId] = useState("");
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pickedSections, setPickedSections] = useState([]);
  const [pickedSubjects, setPickedSubjects] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    function () {
      setPickedSections([]);
      setPickedSubjects([]);
      if (!classId) { setSections([]); setSubjects([]); return; }
      api.get("/classes/" + classId + "/sections").then(function (r) { setSections(r.data); });
      api.get("/classes/" + classId + "/subjects").then(function (r) { setSubjects(r.data); });
    },
    [classId]
  );

  function toggle(list, setList, id) {
    if (list.includes(id)) setList(list.filter(function (x) { return x !== id; }));
    else setList(list.concat([id]));
  }

  async function save() {
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/teachers/" + teacher.id + "/classes", {
        class_id: classId, section_ids: pickedSections, subject_ids: pickedSubjects,
      });
      onSaved(res.data.message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const total = pickedSections.length * (pickedSubjects.length === 0 ? 1 : pickedSubjects.length);

  return (
    <Card title={"Assign classes to " + teacher.name} className="mb-4">
      <Message type="error">{error}</Message>

      <div className="max-w-xs">
        <Field label="Class">
          <Select value={classId} onChange={function (e) { setClassId(e.target.value); }}>
            <option value="">Choose a class</option>
            {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
          </Select>
        </Field>
      </div>

      {classId && (
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div>
            <p className="text-sm font-medium text-ink mb-2">
              Sections <span className="text-slate-400 font-normal">(pick one or more)</span>
            </p>
            {sections.length === 0 ? (
              <p className="text-sm text-slate-400">This class has no sections yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sections.map(function (sec) {
                  return (
                    <Chip key={sec.id} label={"Section " + sec.name} active={pickedSections.includes(sec.id)}
                      onClick={function () { toggle(pickedSections, setPickedSections, sec.id); }} />
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-2">
              Subjects <span className="text-slate-400 font-normal">(pick as many as you like)</span>
            </p>
            {subjects.length === 0 ? (
              <p className="text-sm text-slate-400">This class has no subjects yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map(function (sub) {
                  return (
                    <Chip key={sub.id} label={sub.name} active={pickedSubjects.includes(sub.id)}
                      onClick={function () { toggle(pickedSubjects, setPickedSubjects, sub.id); }} />
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Pick no subject to let this teacher take the section for any subject.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-100">
        <Button onClick={save} loading={busy} disabled={!classId || pickedSections.length === 0}>Assign</Button>
        <Button variant="plain" onClick={onClose}>Cancel</Button>
        {total > 0 && <span className="text-sm text-slate-500">This will add {total} assignment{total === 1 ? "" : "s"}.</span>}
      </div>
    </Card>
  );
}
