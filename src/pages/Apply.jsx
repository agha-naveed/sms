// The public admission form. No login needed.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Printer, Search as SearchIcon, ArrowLeft } from "lucide-react";
import { SCHOOL, Crest } from "../school.jsx";
import api, { errorText } from "../api";
import {
  Button, Field, Input, Select, Textarea, Message, Card, Pill, PhoneInput,
  CnicInput, FileInput,
} from "../components/ui.jsx";

export default function Apply() {
  const today = new Date().toISOString().slice(0, 10);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    student_name: "",
    gender: "",
    dob: "",
    applying_class_id: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    parent_cnic: "",
    address: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);

  // Live CNIC check: runs once all 13 digits are in.
  const [cnicCheck, setCnicCheck] = useState(null);

  // status check
  const [checkEmail, setCheckEmail] = useState("");
  const [checkResult, setCheckResult] = useState(null);

  useEffect(function () {
    api.get("/classes").then(function (res) { setClasses(res.data); }).catch(function () {});
  }, []);

  function set(key, value) {
    setForm(function (old) { return { ...old, [key]: value }; });
  }

  useEffect(
    function () {
      const digits = String(form.parent_cnic || "").replace(/\D/g, "");
      if (digits.length !== 13) { setCnicCheck(null); return; }

      const timer = setTimeout(function () {
        api
          .get("/admissions/check-parent", {
            params: { cnic: form.parent_cnic, name: form.parent_name, email: form.parent_email },
          })
          .then(function (res) { setCnicCheck(res.data); })
          .catch(function () { setCnicCheck(null); });
      }, 400);

      return function () { clearTimeout(timer); };
    },
    [form.parent_cnic, form.parent_name, form.parent_email]
  );

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = new FormData();
      Object.keys(form).forEach(function (k) { data.append(k, form[k]); });
      if (file) data.append("document", file);

      const res = await api.post("/admissions/apply", data);
      setSent(res.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus(e) {
    e.preventDefault();
    try {
      const res = await api.get("/admissions/status", { params: { email: checkEmail } });
      setCheckResult(res.data);
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (sent) {
    const cls = classes.find(function (c) { return String(c.id) === String(form.applying_class_id); });

    return (
      <Wrapper>
        <div className="no-print mb-4">
          <Message type="success">
            Application received. Print this slip and keep it &mdash; the form number on
            it is how you check the result later.
          </Message>
          <div className="flex flex-wrap gap-2">
            <Button icon={Printer} onClick={function () { window.print(); }}>Print / save this slip</Button>
            <Link to="/check" className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-ink border border-slate-300 hover:bg-slate-50">
              Go to the result page
            </Link>
          </div>
        </div>

        <div className="print-area bg-white border border-slate-200 rounded-2xl p-6 shadow-soft">
          <div className="flex justify-between items-start border-b-2 border-ink pb-4">
            <div className="flex items-center gap-3">
              <Crest className="w-12 h-12 text-ink" />
              <div>
                <h2 className="text-lg font-semibold text-ink">{SCHOOL.name}</h2>
                <p className="text-xs text-slate-500">{SCHOOL.address}</p>
                <p className="text-xs text-slate-500">{SCHOOL.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Applicant copy</p>
              <p className="font-semibold text-ink text-lg">{sent.form_no}</p>
              <p className="text-xs text-slate-500">
                {new Date(sent.submitted_on).toLocaleDateString()}
              </p>
            </div>
          </div>

          <h3 className="font-medium text-ink mt-5 mb-3">Admission form received</h3>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <SlipRow label="Student" value={sent.student_name} />
            <SlipRow label="Applying for" value={cls ? cls.name : "-"} />
            <SlipRow label="Date of birth" value={form.dob ? new Date(form.dob).toLocaleDateString() : "-"} />
            <SlipRow label="Gender" value={form.gender || "-"} />
            <SlipRow label="Parent or guardian" value={sent.parent_name} />
            <SlipRow label="Mobile" value={sent.parent_phone || "-"} />
            <SlipRow label="Email" value={sent.parent_email} />
            <SlipRow label="Document attached" value={file ? "Yes" : "No"} />
          </dl>

          <div className="mt-6 border border-slate-300 rounded-xl p-4 bg-slate-50">
            <p className="text-sm font-medium text-ink">How to check the result</p>
            <p className="text-sm text-slate-600 mt-1">
              The decision on this application will be announced on the school website,
              in the result section. Search using the form number{" "}
              <strong>{sent.form_no}</strong>, or the name written above.
            </p>
            <p className="text-sm text-slate-600 mt-2">
              If the child is accepted, bring this slip to the office to collect the
              student and parent logins.
            </p>
          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-10 pt-8">
            <span>Parent signature</span>
            <span>Office stamp</span>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl shadow-soft p-6 space-y-6">
        <Message type="error">{error}</Message>

        <div>
          <SectionHeading n="1" title="Student" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input value={form.student_name} onChange={function (e) { set("student_name", e.target.value); }} required />
            </Field>
            <Field label="Date of birth" hint="It cannot be a future date.">
              <Input type="date" value={form.dob} max={today} onChange={function (e) { set("dob", e.target.value); }} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={function (e) { set("gender", e.target.value); }}>
                <option value="">Choose</option>
                <option>Male</option>
                <option>Female</option>
              </Select>
            </Field>
            <Field label="Applying for class" required>
              <Select value={form.applying_class_id} onChange={function (e) { set("applying_class_id", e.target.value); }} required>
                <option value="">Choose a class</option>
                {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
              </Select>
            </Field>
          </div>
        </div>

        <div>
          <SectionHeading n="2" title="Parent or guardian" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input value={form.parent_name} onChange={function (e) { set("parent_name", e.target.value); }} required />
            </Field>
            <Field label="Email" required hint="This becomes your login once the admission is approved.">
              <Input type="email" value={form.parent_email} onChange={function (e) { set("parent_email", e.target.value); }} required />
            </Field>
            <Field label="Mobile number">
              <PhoneInput value={form.parent_phone} onChange={function (v) { set("parent_phone", v); }} />
            </Field>
            <Field label="CNIC">
              <CnicInput value={form.parent_cnic} onChange={function (v) { set("parent_cnic", v); }} />
              {cnicCheck && (
                <p className={"text-xs mt-1.5 " + (cnicCheck.status === "conflict" ? "text-bad" : cnicCheck.status === "match" ? "text-good" : "text-slate-400")}>
                  {cnicCheck.message}
                </p>
              )}
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Home address">
              <Textarea value={form.address} onChange={function (e) { set("address", e.target.value); }} />
            </Field>
          </div>
        </div>

        <div>
          <SectionHeading n="3" title="Document (optional)" />
          <FileInput
            onChange={function (e) { setFile(e.target.files[0]); }}
            hint="Birth certificate or last school result. PDF or image, up to 5 MB."
          />
        </div>

        <Button
          type="submit"
          size="lg"
          loading={busy}
          disabled={cnicCheck && cnicCheck.status === "conflict"}
        >
          {busy ? "Sending..." : "Send application"}
        </Button>

        {cnicCheck && cnicCheck.status === "conflict" && (
          <p className="text-xs text-bad -mt-3">
            Fix the CNIC, the name or the email before sending.
          </p>
        )}
      </form>

      <Card title="Already applied? Check your status" icon={SearchIcon} className="mt-6">
        <form onSubmit={checkStatus} className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-56">
            <Field label="The email you used">
              <Input type="email" value={checkEmail} onChange={function (e) { setCheckEmail(e.target.value); }} required />
            </Field>
          </div>
          <Button variant="plain" type="submit">Check</Button>
        </form>

        {checkResult && checkResult.length === 0 && (
          <p className="text-sm text-slate-500 mt-4">No application was found for that email.</p>
        )}

        {checkResult && checkResult.map(function (r) {
          return (
            <div key={r.id} className="mt-4 pt-3 border-t border-slate-100 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{r.student_name}</span>
                <Pill status={r.status} />
              </div>
              <p className="text-slate-500">{r.applying_class} · sent {new Date(r.created_at).toLocaleDateString()}</p>
              {r.remarks && <p className="text-bad mt-1">{r.remarks}</p>}
              {r.status === "approved" && (
                <p className="text-good mt-1">Approved. Collect your login details from the school office.</p>
              )}
            </div>
          );
        })}
      </Card>
    </Wrapper>
  );
}

function SlipRow({ label, value }) {
  return (
    <div>
      <dt className="text-slate-500 text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function SectionHeading({ n, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center">{n}</span>
      <h2 className="font-semibold text-ink">{title}</h2>
    </div>
  );
}

function Wrapper({ children }) {
  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/login" className="text-sm text-slate-500 hover:text-ink inline-flex items-center gap-1 mb-3">
            <ArrowLeft size={15} /> Back to login
          </Link>
          <h1 className="text-2xl font-bold text-ink">Admission form</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill this in once. The school reviews every application by hand.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
