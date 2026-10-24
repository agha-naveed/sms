// Review applications. Approving creates the student and parent logins.
import { useEffect, useState } from "react";
import { FileCheck2, Paperclip, KeyRound } from "lucide-react";
import api, { errorText, downloadFile } from "../../api";
import {
  Page, Card, Table, Pill, Button, Select, Input, Field, Message, Loading, Empty,
} from "../../components/ui.jsx";

export default function Admissions() {
  const [filter, setFilter] = useState("pending");
  const [list, setList] = useState(null);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(null);      // the application being reviewed
  const [logins, setLogins] = useState(null);  // shown once, after approval
  const [error, setError] = useState("");

  function load() {
    api.get("/admissions", { params: { status: filter || undefined } }).then(function (res) { setList(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, [filter]);

  useEffect(function () {
    api.get("/classes").then(function (res) { setClasses(res.data); }).catch(function () {});
  }, []);

  if (error && !list) return <Message type="error">{error}</Message>;
  if (!list) return <Loading />;

  if (logins) {
    return (
      <Page title="Admission approved" subtitle="Write these down and hand them to the family now.">
        <Card icon={KeyRound}>
          <p className="text-sm text-slate-600 mb-4">
            This is the only time the passwords are shown. If they are lost, the admin can set a new one.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <LoginBox title="Student login" login={logins.student_login} />
            <LoginBox title="Parent login" login={logins.parent_login} />
          </div>

          <p className="text-sm text-slate-600 mt-4">
            Admission number: <strong>{logins.admission_no}</strong>
          </p>

          <Button className="mt-4" onClick={function () { setLogins(null); load(); }}>Done</Button>
        </Card>
      </Page>
    );
  }

  if (open) {
    return (
      <Review
        application={open}
        classes={classes}
        onCancel={function () { setOpen(null); }}
        onApproved={function (result) { setOpen(null); setLogins(result); }}
        onRejected={function () { setOpen(null); load(); }}
      />
    );
  }

  return (
    <Page
      title="Admissions"
      subtitle="Applications sent through the public admission form."
      action={
        <Select value={filter} onChange={function (e) { setFilter(e.target.value); }} className="w-auto">
          <option value="pending">Waiting for review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </Select>
      }
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>

      <Card>
        {list.length === 0 ? (
          <Empty icon={FileCheck2}>Nothing to review right now.</Empty>
        ) : (
          <Table head={["Student", "Applying for", "Parent", "Phone", "Sent", "Status", ""]}>
            {list.map(function (a) {
              return (
                <tr key={a.id}>
                  <td className="py-2.5 pr-4 font-medium">{a.student_name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{a.applying_class || "-"}</td>
                  <td className="py-2.5 pr-4">{a.parent_name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{a.parent_phone || "-"}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-4"><Pill status={a.status} /></td>
                  <td className="py-2.5 pr-4">
                    {a.status === "pending" ? (
                      <Button size="sm" variant="plain" onClick={function () { setOpen(a); }}>Review</Button>
                    ) : (
                      <span className="text-xs text-slate-400">{a.remarks || "Done"}</span>
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

function LoginBox({ title, login }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
      <p className="text-sm font-semibold text-ink mb-2">{title}</p>
      <p className="text-sm text-slate-600 break-all">Email: {login.email}</p>
      <p className="text-sm text-slate-600">Password: <strong>{login.password}</strong></p>
    </div>
  );
}

// ------------------------------------------------------------------
// The review screen for one application
// ------------------------------------------------------------------
function Review({ application, classes, onCancel, onApproved, onRejected }) {
  const [classId, setClassId] = useState(application.applying_class_id || "");
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    function () {
      if (!classId) { setSections([]); return; }
      api.get("/classes/" + classId + "/sections").then(function (res) { setSections(res.data); setSectionId(""); }).catch(function () {});
    },
    [classId]
  );

  async function approve() {
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/admissions/" + application.id + "/approve", { class_id: classId, section_id: sectionId });
      onApproved(res.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setError("");
    setBusy(true);
    try {
      await api.post("/admissions/" + application.id + "/reject", { remarks });
      onRejected();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page
      title={application.student_name}
      subtitle="Check the details, then approve or reject."
      back={{ label: "Back to applications", onClick: onCancel }}
    >
      <Message type="error">{error}</Message>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="What the family sent">
          <dl className="text-sm space-y-2.5">
            <Row label="Student" value={application.student_name} />
            <Row label="Gender" value={application.gender || "-"} />
            <Row label="Date of birth" value={application.dob ? new Date(application.dob).toLocaleDateString() : "-"} />
            <Row label="Applying for" value={application.applying_class || "-"} />
            <Row label="Parent" value={application.parent_name} />
            <Row label="Email" value={application.parent_email} />
            <Row label="Phone" value={application.parent_phone || "-"} />
            <Row label="CNIC" value={application.parent_cnic || "-"} />
            <Row label="Address" value={application.address || "-"} />
          </dl>

          {application.document ? (
            <a
              href="#"
                onClick={function (e) { e.preventDefault(); downloadFile(application.document); }}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-teal underline mt-4 font-medium"
            >
              <Paperclip size={14} /> Download the uploaded document
            </a>
          ) : (
            <p className="text-sm text-slate-400 mt-4">No document was uploaded.</p>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Approve and place the student">
            <div className="space-y-4">
              <Field label="Class" required>
                <Select value={classId} disabled onChange={function (e) { setClassId(e.target.value); }}>
                  <option value="">Choose a class</option>
                  {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
                </Select>
              </Field>

              <Field label="Section" required>
                <Select value={sectionId} onChange={function (e) { setSectionId(e.target.value); }} disabled={sections.length === 0}>
                  <option value="">{sections.length === 0 ? "Choose a class first" : "Choose a section"}</option>
                  {sections.map(function (s) { return <option key={s.id} value={s.id}>Section {s.name}</option>; })}
                </Select>
              </Field>

              <Button variant="good" onClick={approve} loading={busy} disabled={!classId || !sectionId}>
                Approve and create logins
              </Button>
            </div>
          </Card>

          <Card title="Reject">
            <Field label="Reason" hint="The family sees this when they check their status.">
              <Input value={remarks} onChange={function (e) { setRemarks(e.target.value); }} placeholder="No seats left in this class" />
            </Field>
            <Button variant="danger" className="mt-3" onClick={reject} loading={busy}>Reject application</Button>
          </Card>
        </div>
      </div>
    </Page>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
