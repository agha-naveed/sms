import { useEffect, useState } from "react";
import { UserPlus, GraduationCap, KeyRound, Search, FileSpreadsheet, Download, Upload } from "lucide-react";
import api, { errorText, downloadApiFile } from "../../api";
import { usePagination, Pagination } from "../../components/Pagination.jsx";
import Avatar from "../../components/Avatar.jsx";
import PhotoUpload from "../../components/PhotoUpload.jsx";
import {
  Page, Card, Table, Pill, Button, Select, Input, Field, Message, Loading, Empty,
  PhoneInput, CnicInput,
} from "../../components/ui.jsx";

export default function Students() {
  const [list, setList] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newLogins, setNewLogins] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  // Only one page of students is drawn at a time; a new class or section goes
  // back to page 1.
  const pg = usePagination(list, classId + "|" + sectionId);

  function load() {
    api
      .get("/students", { params: { class_id: classId || undefined, section_id: sectionId || undefined, search: search || undefined } })
      .then(function (res) { setList(res.data); })
      .catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, [classId, sectionId]);

  useEffect(function () {
    api.get("/classes").then(function (res) { setClasses(res.data); }).catch(function () {});
  }, []);

  useEffect(
    function () {
      if (!classId) { setSections([]); setSectionId(""); return; }
      api.get("/classes/" + classId + "/sections").then(function (res) { setSections(res.data); }).catch(function () {});
    },
    [classId]
  );

  if (!list) return <Loading />;

  // Shown once after a student is added, so the logins can be written down.
  if (newLogins) {
    return (
      <Page title="Student added" subtitle="Write these down before you leave this page.">
        <Card icon={KeyRound}>
          <p className="text-sm text-slate-600 mb-4">
            Registration number: <strong>{newLogins.admission_no}</strong>
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="text-sm font-semibold text-ink mb-2">Student login</p>
              <p className="text-sm text-slate-600 break-all">{newLogins.student_login.email}</p>
              <p className="text-sm text-slate-600">or the registration number {newLogins.admission_no}</p>
              <p className="text-sm text-slate-600 mt-1">Password: <strong>{newLogins.student_login.password}</strong></p>
            </div>

            {newLogins.parent_login && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <p className="text-sm font-semibold text-ink mb-2">Parent login</p>
                <p className="text-sm text-slate-600 break-all">{newLogins.parent_login.email}</p>
                <p className="text-sm text-slate-600 mt-1">Password: <strong>{newLogins.parent_login.password}</strong></p>
              </div>
            )}
          </div>

          <Button className="mt-4" onClick={function () { setNewLogins(null); load(); }}>Done</Button>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Students"
      subtitle={list.length + " students shown. A student can sign in with the registration number or the email."}
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="plain" icon={FileSpreadsheet} onClick={function () { setImporting(!importing); setAdding(false); }}>
            {importing ? "Close import" : "Import from Excel"}
          </Button>
          <Button icon={UserPlus} onClick={function () { setAdding(!adding); setImporting(false); }}>
            {adding ? "Close form" : "Add a student"}
          </Button>
        </div>
      }
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <Card className="mb-4">
        <form onSubmit={function (e) { e.preventDefault(); pg.setPage(1); load(); }} className="grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Class">
            <Select value={classId} onChange={function (e) { setClassId(e.target.value); }}>
              <option value="">All classes</option>
              {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
            </Select>
          </Field>

          <Field label="Section">
            <Select value={sectionId} onChange={function (e) { setSectionId(e.target.value); }} disabled={sections.length === 0}>
              <option value="">All sections</option>
              {sections.map(function (s) { return <option key={s.id} value={s.id}>Section {s.name}</option>; })}
            </Select>
          </Field>

          <Field label="Name or admission number">
            <Input value={search} onChange={function (e) { setSearch(e.target.value); }} />
          </Field>

          <Button type="submit" variant="plain" icon={Search}>Search</Button>
        </form>
      </Card>

      {importing && (
        <ImportStudents
          onClose={function () { setImporting(false); }}
          onImported={function () { load(); }}
        />
      )}

      {adding && (
        <AddStudent
          classes={classes}
          onError={setError}
          onAdded={function (result) { setAdding(false); setNewLogins(result); }}
        />
      )}

      {editing && (
        <EditStudent
          student={editing}
          classes={classes}
          onClose={function () { setEditing(null); }}
          onPhotoChanged={load}
          onSaved={function () { setEditing(null); setDone("Student updated."); load(); }}
        />
      )}

      <Card>
        {list.length === 0 ? (
          <Empty icon={GraduationCap}>No students match this search.</Empty>
        ) : (
          <Table head={["Reg. no", "Name", "Login email", "Class", "Parent", "Phone", "Status", ""]}>
            {pg.pageItems.map(function (s) {
              return (
                <tr key={s.id}>
                  <td className="py-2.5 pr-4 text-slate-500">{s.admission_no}</td>
                  <td className="py-2.5 pr-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={s.name} photo={s.photo} size={28} />
                      {s.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{s.email}</td>
                  <td className="py-2.5 pr-4">{s.class_name || "-"} {s.section_name ? "- " + s.section_name : ""}</td>
                  <td className="py-2.5 pr-4">{s.parent_name || "-"}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{s.parent_phone || "-"}</td>
                  <td className="py-2.5 pr-4"><Pill status={s.status === "active" ? "present" : "leave"} /></td>
                  <td className="py-2.5 pr-4">
                    <Button size="sm" variant="plain" onClick={function () { setEditing(s); }}>Edit</Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
        <Pagination pg={pg} />
      </Card>
    </Page>
  );
}

// For a child who already attends the school. The admission form is for new
// applicants; this is for filling in the register you already have.
function AddStudent({ classes, onAdded, onError }) {
  const [form, setForm] = useState({
    name: "", class_id: "", section_id: "", gender: "", dob: "",
    address: "", phone: "",
    parent_id: "", parent_name: "", parent_email: "", parent_phone: "", parent_cnic: "",
  });

  const [sections, setSections] = useState([]);
  const [parents, setParents] = useState([]);
  const [linkExisting, setLinkExisting] = useState(false);
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(function () {
    api.get("/parents").then(function (r) { setParents(r.data); }).catch(function () {});
  }, []);

  useEffect(
    function () {
      if (!form.class_id) { setSections([]); return; }
      api.get("/classes/" + form.class_id + "/sections").then(function (r) { setSections(r.data); }).catch(function () {});
    },
    [form.class_id]
  );

  function set(k, v) {
    setForm(function (o) { return { ...o, [k]: v }; });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const payload = { ...form };
      if (linkExisting) { payload.parent_name = ""; payload.parent_email = ""; }
      else { payload.parent_id = ""; }

      const res = await api.post("/students", payload);
      onAdded(res.data);
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Add a student who already attends" icon={UserPlus} className="mb-4">
      <form onSubmit={submit} className="space-y-6">
        <div>
          <SectionLabel n="1" title="Student" />
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Full name" required>
              <Input value={form.name} onChange={function (e) { set("name", e.target.value); }} required />
            </Field>

            <Field label="Class" required>
              <Select value={form.class_id} onChange={function (e) { set("class_id", e.target.value); set("section_id", ""); }} required>
                <option value="">Choose</option>
                {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
              </Select>
            </Field>

            <Field label="Section" required>
              <Select value={form.section_id} onChange={function (e) { set("section_id", e.target.value); }} disabled={sections.length === 0} required>
                <option value="">Choose</option>
                {sections.map(function (sec) { return <option key={sec.id} value={sec.id}>Section {sec.name}</option>; })}
              </Select>
            </Field>

            <Field label="Gender">
              <Select value={form.gender} onChange={function (e) { set("gender", e.target.value); }}>
                <option value="">Choose</option>
                <option>Male</option>
                <option>Female</option>
              </Select>
            </Field>

            <Field label="Date of birth">
              <Input type="date" max={today} value={form.dob} onChange={function (e) { set("dob", e.target.value); }} />
            </Field>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            The registration number, login email and password are made automatically.
          </p>
        </div>

        <div>
          <SectionLabel n="2" title="Parent or guardian" />

          <div className="flex gap-2 mb-3">
            <Button type="button" size="sm" variant={linkExisting ? "plain" : "primary"} onClick={function () { setLinkExisting(false); }}>
              New parent
            </Button>
            <Button type="button" size="sm" variant={linkExisting ? "primary" : "plain"} onClick={function () { setLinkExisting(true); }}>
              Link an existing parent
            </Button>
          </div>

          {linkExisting ? (
            <Field label="Parent" hint="Use this when a brother or sister already studies here.">
              <Select value={form.parent_id} onChange={function (e) { set("parent_id", e.target.value); }}>
                <option value="">Choose a parent</option>
                {parents.map(function (p) {
                  return <option key={p.id} value={p.id}>{p.name} — {p.email} ({p.children} child{p.children === 1 ? "" : "ren"})</option>;
                })}
              </Select>
            </Field>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full name">
                <Input value={form.parent_name} onChange={function (e) { set("parent_name", e.target.value); }} />
              </Field>

              <Field label="Email" hint="Optional. This becomes the parent's login. If empty, a school email is made.">
                <Input type="email" value={form.parent_email} onChange={function (e) { set("parent_email", e.target.value); }} />
              </Field>

              <Field label="Mobile number">
                <PhoneInput value={form.parent_phone} onChange={function (v) { set("parent_phone", v); }} />
              </Field>

              <Field label="CNIC" hint="The same CNIC links to the parent who is already in the system.">
                <CnicInput value={form.parent_cnic} onChange={function (v) { set("parent_cnic", v); }} />
              </Field>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-2">
            You can leave the parent blank now and link one later from the edit form.
          </p>
        </div>

        <Button type="submit" loading={busy}>{busy ? "Adding..." : "Add student"}</Button>
      </form>
    </Card>
  );
}

function EditStudent({ student, classes, onClose, onSaved, onPhotoChanged }) {
  const [photo, setPhoto] = useState(student.photo || null);
  const [classId, setClassId] = useState(student.class_id || "");
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState(student.section_id || "");
  const [status, setStatus] = useState(student.status);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    function () {
      if (!classId) return;
      api.get("/classes/" + classId + "/sections").then(function (res) { setSections(res.data); }).catch(function () {});
    },
    [classId]
  );

  async function save() {
    setBusy(true);
    try {
      await api.put("/students/" + student.id, { class_id: classId, section_id: sectionId, status: status });
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={"Edit " + student.name} className="mb-4">
      <Message type="error">{error}</Message>

      <div className="mb-4 pb-4 border-b border-slate-100">
        <PhotoUpload
          name={student.name}
          photo={photo}
          path={"/auth/photo/" + student.user_id}
          onChanged={function (url) { setPhoto(url); onPhotoChanged(); }}
        />
      </div>

      <div className="grid sm:grid-cols-4 gap-3 items-end">
        <Field label="Class">
          <Select value={classId} onChange={function (e) { setClassId(e.target.value); setSectionId(""); }}>
            <option value="">Choose</option>
            {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
          </Select>
        </Field>

        <Field label="Section">
          <Select value={sectionId} onChange={function (e) { setSectionId(e.target.value); }}>
            <option value="">Choose</option>
            {sections.map(function (s) { return <option key={s.id} value={s.id}>Section {s.name}</option>; })}
          </Select>
        </Field>

        <Field label="Status">
          <Select value={status} onChange={function (e) { setStatus(e.target.value); }}>
            <option value="active">Active</option>
            <option value="inactive">Left the school</option>
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
        <Button onClick={save} loading={busy}>Save changes</Button>
        <Button variant="plain" onClick={onClose}>Cancel</Button>
      </div>

    </Card>
  );
}

function SectionLabel({ n, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center">{n}</span>
      <h3 className="font-semibold text-ink">{title}</h3>
    </div>
  );
}


// Adds many existing students at once from an Excel file.
function ImportStudents({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);   // { message, errors, more }
  const [result, setResult] = useState(null);

  async function upload(e) {
    e.preventDefault();
    if (!file) return;

    setBusy(true);
    setProblem(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api.post("/student-import", body);
      setResult(res.data);
      setFile(null);
      onImported();
    } catch (err) {
      const data = err.response && err.response.data;
      setProblem({ message: errorText(err), errors: (data && data.errors) || [], more: (data && data.more) || 0 });
    } finally {
      setBusy(false);
    }
  }

  // The starting logins of everyone just added, to print or hand out.
  function downloadLogins() {
    const cell = function (v) { return '"' + String(v === undefined || v === null ? "" : v).replace(/"/g, '""') + '"'; };
    const lines = [["Name", "Class", "Section", "Registration no", "Login email", "Password", "Parent", "Parent email", "Parent password"]];

    const newParents = {};
    result.parent_logins.forEach(function (p) { newParents[p.email.toLowerCase()] = p.password; });

    result.students.forEach(function (s) {
      lines.push([
        s.name, s.class_name, s.section_name, s.admission_no, s.email, s.password,
        s.parent_name, s.parent_email, newParents[(s.parent_email || "").toLowerCase()] || (s.parent_email ? "(existing account)" : ""),
      ]);
    });

    const csv = "\uFEFF" + lines.map(function (l) { return l.map(cell).join(","); }).join("\r\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "new-student-logins.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <Card title="Import students from Excel" icon={FileSpreadsheet} description="For students who already attend the school. Fill in one row per student and upload the file." className="mb-4">
      <ol className="text-sm text-slate-600 list-decimal pl-5 space-y-1 mb-4">
        <li>Download the Excel template and fill it in. Only Name, Class and Section are required.</li>
        <li>Class and Section must match the ones already created (the template lists them).</li>
        <li>Registration numbers and logins are made automatically unless you fill them in.</li>
        <li>Parents are matched by Parent CNIC or Parent Email, so brothers and sisters share one parent. A parent with no email gets a school email such as parent-2026-0007@school.com.</li>
        <li>If any row has a problem, nothing is saved. Fix the rows shown and upload again.</li>
      </ol>

      <div className="mb-4">
        <Button variant="plain" icon={Download} onClick={function () { downloadApiFile("/student-import/template", {}, "students-import-template.xlsx"); }}>
          Download Excel template
        </Button>
      </div>

      {!result && (
        <form onSubmit={upload} className="flex flex-wrap items-end gap-3">
          <Field label="Filled-in file (.xlsx or .csv)">
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={function (e) { setFile(e.target.files[0] || null); setProblem(null); }}
              className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
            />
          </Field>
          <Button type="submit" icon={Upload} loading={busy} disabled={!file}>Upload and add students</Button>
        </form>
      )}

      {problem && (
        <div className="mt-4 rounded-xl border border-bad/30 bg-bad/5 p-4">
          <p className="text-sm font-semibold text-bad">{problem.message}</p>
          {problem.errors.length > 0 && (
            <ul className="mt-2 text-sm text-slate-700 space-y-1 max-h-64 overflow-auto">
              {problem.errors.map(function (er, i) {
                return <li key={i}><strong>Row {er.row}:</strong> {er.message}</li>;
              })}
              {problem.more > 0 && <li className="text-slate-500">...and {problem.more} more.</li>}
            </ul>
          )}
        </div>
      )}

      {result && (
        <div className="mt-2 rounded-xl border border-good/30 bg-good/5 p-4">
          <p className="text-sm font-semibold text-good">{result.message}</p>
          <p className="text-sm text-slate-600 mt-1">
            {result.parent_logins.length} new parent account{result.parent_logins.length === 1 ? "" : "s"} created.
            Everyone starts with the password given in the login list.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button icon={Download} onClick={downloadLogins}>Download login list (CSV)</Button>
            <Button variant="plain" onClick={function () { setResult(null); }}>Import another file</Button>
            <Button variant="plain" onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
