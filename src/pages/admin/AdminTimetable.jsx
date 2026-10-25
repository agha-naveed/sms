// The admin builds one class's weekly grid here, then publishes it so its
// teachers, students and parents can see it. Nothing is visible to anyone
// else until Publish is pressed, so half-finished work is never seen.
import { useEffect, useState } from "react";
import { CalendarClock, Plus, X, Eye, EyeOff, Clock3, Coffee, Wand2, Download } from "lucide-react";
import api, { errorText, downloadPdf } from "../../api";
import {
  Page, Card, Button, Select, Input, Field, Message, Loading, Empty,
} from "../../components/ui.jsx";
import { TimetableGrid } from "../../components/TimetableGrid.jsx";

export default function AdminTimetable() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [options, setOptions] = useState({ subjects: [], teachers: [] });
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [grid, setGrid] = useState(null);
  const [showPeriods, setShowPeriods] = useState(false);
  const [editing, setEditing] = useState(null); // { day, period, cell }
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(function () {
    api.get("/classes").then(function (r) { setClasses(r.data); }).catch(function (err) { setError(errorText(err)); });
  }, []);

  useEffect(
    function () {
      if (!classId) { setSections([]); setSectionId(""); return; }
      api.get("/classes/" + classId + "/sections").then(function (r) { setSections(r.data); });
      setSectionId("");
      setGrid(null);
    },
    [classId]
  );

  function load() {
    if (!classId || !sectionId) return;
    setError("");
    setGrid(null);
    api
      .get("/timetable/class/" + classId + "/" + sectionId)
      .then(function (r) { setGrid(r.data); })
      .catch(function (err) { setError(errorText(err)); });

    // Who teaches what in this section. The slot editor is built on this,
    // so a subject and its teacher can never be paired up wrongly.
    api
      .get("/timetable/options/" + classId + "/" + sectionId)
      .then(function (r) { setOptions(r.data); })
      .catch(function () {});
  }

  useEffect(load, [classId, sectionId]);

  async function togglePublish() {
    setBusy(true);
    try {
      const res = await api.put("/timetable/class/" + classId + "/" + sectionId + "/publish", {
        published: !grid.published,
      });
      setDone(res.data.message);
      load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page
      title="Timetable"
      subtitle="Build a class's weekly schedule, then publish it so teachers, students and parents can see it."
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <Card className="mb-4">
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Class">
            <Select value={classId} onChange={function (e) { setClassId(e.target.value); }}>
              <option value="">Choose a class</option>
              {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
            </Select>
          </Field>

          <Field label="Section">
            <Select value={sectionId} onChange={function (e) { setSectionId(e.target.value); }} disabled={sections.length === 0}>
              <option value="">Choose a section</option>
              {sections.map(function (s) { return <option key={s.id} value={s.id}>Section {s.name}</option>; })}
            </Select>
          </Field>

          <button
            type="button"
            onClick={function () { setShowPeriods(!showPeriods); }}
            className="text-sm text-teal font-semibold underline text-left sm:text-right"
          >
            {showPeriods ? "Hide class, break & lunch settings" : "Class, break & lunch settings"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <Button
            size="sm"
            variant="plain"
            icon={Download}
            disabled={!sectionId}
            onClick={function () {
              downloadPdf("/timetable/pdf/class/" + classId + "/" + sectionId, {}, "timetable.pdf");
            }}
          >
            Download this section (PDF)
          </Button>
          <Button
            size="sm"
            variant="plain"
            icon={Download}
            disabled={!classId}
            onClick={function () { downloadPdf("/timetable/pdf/all", { class_id: classId }, "timetables-class.pdf"); }}
          >
            Download whole class (PDF)
          </Button>
          <Button
            size="sm"
            variant="plain"
            icon={Download}
            onClick={function () { downloadPdf("/timetable/pdf/all", {}, "timetables-all-classes.pdf"); }}
          >
            Download all classes (PDF)
          </Button>
        </div>
      </Card>

      {showPeriods && <PeriodSettings onChanged={load} onError={setError} />}

      {!classId || !sectionId ? (
        <Card><Empty icon={CalendarClock}>Choose a class and section to see or build its timetable.</Empty></Card>
      ) : !grid ? (
        <Loading />
      ) : (
        <Card
          icon={CalendarClock}
          title={grid.class_name + " - Section " + grid.section_name}
          description={
            grid.published
              ? "Published — teachers, students and parents in this section can see it."
              : "Draft — only you can see this right now."
          }
          action={
            <Button
              size="sm"
              variant={grid.published ? "plain" : "good"}
              icon={grid.published ? EyeOff : Eye}
              onClick={togglePublish}
              loading={busy}
            >
              {grid.published ? "Unpublish" : "Publish"}
            </Button>
          }
        >
          <TimetableGrid
            periods={grid.periods}
            days={grid.days}
            slots={grid.slots}
            editable
            onCellClick={function (day, period, cell) { setEditing({ day, period, cell }); }}
          />
          <p className="text-xs text-slate-400 mt-3">
            Click any box to fill it in. If a teacher is already busy in that period, you'll be told before anything is saved.
          </p>
        </Card>
      )}

      {editing && (
        <SlotEditor
          classId={classId}
          sectionId={sectionId}
          day={editing.day}
          period={editing.period}
          cell={editing.cell}
          options={options}
          onClose={function () { setEditing(null); }}
          onSaved={function (msg) { setEditing(null); setDone(msg); load(); }}
        />
      )}
    </Page>
  );
}

// A small popover-style card for filling in one box of the grid.
//
// Subject and teacher are tied together by who really teaches what in this
// section (set on the Teachers page), and each subject has exactly one
// teacher there. So:
//   - pick a SUBJECT first  -> its teacher is filled in and locked;
//   - pick a TEACHER first  -> the subject list narrows to what they teach.
function SlotEditor({ classId, sectionId, day, period, cell, options, onClose, onSaved }) {
  const [subjectId, setSubjectId] = useState(cell && cell.subject_id ? String(cell.subject_id) : "");
  const [teacherId, setTeacherId] = useState(cell && cell.teacher_id ? String(cell.teacher_id) : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const subject = subjectId
    ? options.subjects.find(function (x) { return String(x.id) === subjectId; })
    : null;

  // Once a subject is chosen, the teacher is decided by it.
  const locked = !!subject;
  const lockedTeacherId = subject && subject.teacher_id ? String(subject.teacher_id) : "";
  const effectiveTeacherId = locked ? lockedTeacherId : teacherId;

  const pickedTeacher = !locked && teacherId
    ? options.teachers.find(function (t) { return String(t.id) === teacherId; })
    : null;

  // A teacher picked first narrows the subjects to the ones they teach here.
  const subjectChoices = pickedTeacher
    ? options.subjects.filter(function (x) { return pickedTeacher.subject_ids.indexOf(x.id) !== -1; })
    : options.subjects;

  function chooseSubject(value) {
    setSubjectId(value);
    setError("");

    // Carry the teacher across, so clearing the subject afterwards leaves
    // that teacher selected rather than dropping it.
    if (value) {
      const chosen = options.subjects.find(function (x) { return String(x.id) === value; });
      setTeacherId(chosen && chosen.teacher_id ? String(chosen.teacher_id) : "");
    }
  }

  async function send(subjectValue, teacherValue) {
    setError("");
    setBusy(true);
    try {
      const res = await api.put("/timetable/class/" + classId + "/" + sectionId + "/slot", {
        day_of_week: day.value,
        period_id: period.id,
        subject_id: subjectValue || null,
        teacher_id: teacherValue || null,
      });
      onSaved(res.data.message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const subjectHasNoTeacher = locked && !lockedTeacherId;
  const nothingChosen = !subjectId && !teacherId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-popover max-w-sm w-full p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-ink">{day.label} · {period.label}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {period.start_time.slice(0, 5)} - {period.end_time.slice(0, 5)}
        </p>

        <Message type="error">{error}</Message>

        <div className="space-y-4">
          <Field
            label="Subject"
            hint={
              pickedTeacher
                ? pickedTeacher.subject_ids.length === 0
                  ? pickedTeacher.name + " doesn't teach a subject in this section, so this period will have no subject."
                  : "Showing only what " + pickedTeacher.name + " teaches in this section."
                : "Pick a subject and its teacher is filled in for you."
            }
          >
            <Select value={subjectId} onChange={function (e) { chooseSubject(e.target.value); }}>
              <option value="">No subject</option>
              {subjectChoices.map(function (x) {
                return (
                  <option key={x.id} value={x.id} disabled={!x.teacher_id}>
                    {x.name}{x.teacher_id ? "" : " (no teacher assigned)"}
                  </option>
                );
              })}
            </Select>
          </Field>

          <Field
            label="Teacher"
            hint={
              locked
                ? subjectHasNoTeacher
                  ? "Nobody teaches this subject here yet. Assign a teacher on the Teachers page first."
                  : "Fixed. " + subject.name + " is taught by " + subject.teacher_name + " in this section."
                : "Or pick a teacher first to see only the subjects they teach here."
            }
          >
            {locked ? (
              <div
                className={
                  "border rounded-xl px-3.5 py-2.5 text-[0.95rem] " +
                  (lockedTeacherId
                    ? "border-slate-200 bg-slate-50 text-ink font-medium"
                    : "border-dashed border-slate-300 bg-slate-50 text-slate-400")
                }
              >
                {lockedTeacherId ? subject.teacher_name : "No teacher assigned"}
              </div>
            ) : (
              <Select value={teacherId} onChange={function (e) { setTeacherId(e.target.value); }}>
                <option value="">No teacher</option>
                {options.teachers.map(function (t) {
                  return <option key={t.id} value={t.id}>{t.name}</option>;
                })}
              </Select>
            )}
          </Field>
        </div>

        {options.teachers.length === 0 && (
          <p className="text-xs text-warn mt-3">
            No teacher has been assigned to this class and section yet. Do that from the Teachers page first.
          </p>
        )}

        <div className="flex flex-wrap gap-2 justify-between mt-5">
          <Button variant="plain" onClick={function () { send("", ""); }} loading={busy} disabled={!cell}>
            Clear this box
          </Button>
          <div className="flex gap-2">
            <Button variant="plain" onClick={onClose}>Cancel</Button>
            <Button
              onClick={function () { send(subjectId, effectiveTeacherId); }}
              loading={busy}
              disabled={nothingChosen || subjectHasNoTeacher}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Periods are shared by the whole school, so this list appears once,
// tucked behind "Manage periods" rather than cluttering every visit.
// The admin can build the whole day from a few numbers (how long a class
// is, how long each break is, and where it falls), or add single periods
// and breaks by hand.
function PeriodSettings({ onChanged, onError }) {
  const [periods, setPeriods] = useState(null);
  const [form, setForm] = useState({ kind: "class", label: "", start_time: "", end_time: "" });
  const [busy, setBusy] = useState(false);

  const [day, setDay] = useState({ start_time: "08:00", class_minutes: "40", count: "7" });
  const [breaks, setBreaks] = useState([
    { after: "3", minutes: "20", label: "Break" },
    { after: "5", minutes: "30", label: "Lunch" },
  ]);
  const [building, setBuilding] = useState(false);

  function load() {
    api.get("/timetable/periods").then(function (r) { setPeriods(r.data); }).catch(function (err) { onError(errorText(err)); });
  }

  useEffect(load, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      // Lunch is a break with the name "Lunch".
      const isLunch = form.kind === "lunch";
      await api.post("/timetable/periods", {
        ...form,
        kind: isLunch ? "break" : form.kind,
        label: form.label.trim() || (isLunch ? "Lunch" : form.kind === "break" ? "Break" : ""),
      });
      setForm({ kind: form.kind, label: "", start_time: "", end_time: "" });
      load();
      onChanged();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api.delete("/timetable/periods/" + id);
      load();
      onChanged();
    } catch (err) {
      onError(errorText(err));
    }
  }

  function changeBreak(index, field, value) {
    setBreaks(breaks.map(function (b, i) { return i === index ? { ...b, [field]: value } : b; }));
  }

  async function build(e) {
    e.preventDefault();

    const hasPeriods = periods && periods.length > 0;
    if (hasPeriods && !window.confirm(
      "This replaces all existing periods and breaks, and clears every class timetable built on them. Continue?"
    )) {
      return;
    }

    setBuilding(true);
    try {
      await api.post("/timetable/periods/generate", {
        start_time: day.start_time,
        class_minutes: Number(day.class_minutes),
        count: Number(day.count),
        breaks: breaks.map(function (b) {
          return { after: Number(b.after), minutes: Number(b.minutes), label: b.label };
        }),
        replace: true,
      });
      load();
      onChanged();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBuilding(false);
    }
  }

  return (
    <>
      <Card
        title="Set up classes, break & lunch"
        icon={Wand2}
        description="Choose how long each class is, then add the break and lunch time. The periods are made for you."
        className="mb-4"
      >
        <form onSubmit={build} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Day starts">
              <Input type="time" value={day.start_time} onChange={function (e) { setDay({ ...day, start_time: e.target.value }); }} required />
            </Field>
            <Field label="Class length (minutes)">
              <Input type="number" min="5" max="180" value={day.class_minutes} onChange={function (e) { setDay({ ...day, class_minutes: e.target.value }); }} required />
            </Field>
            <Field label="Number of classes">
              <Input type="number" min="1" max="15" value={day.count} onChange={function (e) { setDay({ ...day, count: e.target.value }); }} required />
            </Field>
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-2">Break and lunch time</p>
            {breaks.length === 0 && <p className="text-xs text-slate-400 mb-2">No break or lunch. Classes will run back to back.</p>}
            <div className="space-y-2">
              {breaks.map(function (b, i) {
                return (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_7rem_7rem_auto] gap-2 items-end">
                    <Field label="Name (Break, Lunch...)">
                      <Input value={b.label} onChange={function (e) { changeBreak(i, "label", e.target.value); }} placeholder="Break" />
                    </Field>
                    <Field label="After class no.">
                      <Input type="number" min="1" value={b.after} onChange={function (e) { changeBreak(i, "after", e.target.value); }} required />
                    </Field>
                    <Field label="Minutes">
                      <Input type="number" min="1" max="120" value={b.minutes} onChange={function (e) { changeBreak(i, "minutes", e.target.value); }} required />
                    </Field>
                    <button
                      type="button"
                      onClick={function () { setBreaks(breaks.filter(function (_, j) { return j !== i; })); }}
                      className="text-slate-400 hover:text-bad pb-3 justify-self-start"
                      aria-label="Remove this break or lunch"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={function () { setBreaks([...breaks, { after: "", minutes: "15", label: "Break" }]); }}
              className="text-sm text-teal font-semibold underline mt-2"
            >
              + Add another break / lunch
            </button>
          </div>

          <Button type="submit" icon={Wand2} loading={building}>Build the school day</Button>
        </form>
      </Card>

      <Card title="Classes, break and lunch" icon={Clock3} description="Shared by every class. Times cannot overlap." className="mb-4">
        {!periods ? (
          <Loading />
        ) : periods.length === 0 ? (
          <p className="text-sm text-slate-400 mb-4">Nothing yet. Set up the classes above, or add the first one below.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {periods.map(function (p) {
              const isBreak = p.kind === "break";
              return (
                <span
                  key={p.id}
                  className={
                    "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm " +
                    (isBreak ? "bg-amber-50 text-amber-700" : "bg-slate-100")
                  }
                >
                  {isBreak && <Coffee size={13} />}
                  {p.label} <span className="text-slate-400 text-xs">{p.start_time.slice(0, 5)}-{p.end_time.slice(0, 5)}</span>
                  <button onClick={function () { remove(p.id); }} className="text-slate-400 hover:text-bad" aria-label={"Delete " + p.label}>
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <form onSubmit={add} className="grid sm:grid-cols-5 gap-3 items-end">
          <Field label="Type">
            <Select value={form.kind} onChange={function (e) { setForm({ ...form, kind: e.target.value }); }}>
              <option value="class">Class</option>
              <option value="break">Break</option>
              <option value="lunch">Lunch</option>
            </Select>
          </Field>
          <Field label="Label">
            <Input
              value={form.label}
              onChange={function (e) { setForm({ ...form, label: e.target.value }); }}
              placeholder={form.kind === "lunch" ? "Lunch" : form.kind === "break" ? "Break" : "Period 8"}
              required={form.kind === "class"}
            />
          </Field>
          <Field label="Starts">
            <Input type="time" value={form.start_time} onChange={function (e) { setForm({ ...form, start_time: e.target.value }); }} required />
          </Field>
          <Field label="Ends">
            <Input type="time" value={form.end_time} onChange={function (e) { setForm({ ...form, end_time: e.target.value }); }} required />
          </Field>
          <Button type="submit" icon={Plus} loading={busy}>Add {form.kind === "lunch" ? "lunch" : form.kind === "break" ? "break" : "class"}</Button>
        </form>
      </Card>
    </>
  );
}
