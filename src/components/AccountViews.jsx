// Two small pages that every non-admin role uses.
//
// SubjectsView   shows the subjects of one section and who teaches each one.
// ChangePassword lets a teacher, student or parent set a new password.
import { useEffect, useState } from "react";
import { BookOpen, KeyRound, UserCircle } from "lucide-react";
import api, { errorText } from "../api";
import { useAuth } from "../auth.jsx";
import {
  Page, Card, Table, Button, Field, Input, Message, Loading, Empty, PhoneInput,
} from "./ui.jsx";

// ------------------------------------------------------------------
// Subjects and their teachers for one class + section
// ------------------------------------------------------------------
export function SubjectsView({ classId, sectionId, className, sectionName }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    function () {
      if (!classId || !sectionId) return;
      setRows(null);
      api
        .get("/teachers/section", { params: { class_id: classId, section_id: sectionId } })
        .then(function (res) { setRows(res.data); })
        .catch(function (err) { setError(errorText(err)); });
    },
    [classId, sectionId]
  );

  if (error) return <Message type="error">{error}</Message>;
  if (!rows) return <Loading />;

  const withTeacher = rows.filter(function (r) { return r.teacher_name; }).length;

  return (
    <Card icon={BookOpen} title={"Subjects for " + (className || "") + " - Section " + (sectionName || "")}>
      {rows.length === 0 ? (
        <Empty>No subject has been added to this class yet.</Empty>
      ) : (
        <>
          <Table head={["Subject", "Teacher", "Qualification"]}>
            {rows.map(function (r) {
              return (
                <tr key={r.subject_id}>
                  <td className="py-2.5 pr-4 font-medium">{r.subject_name}</td>
                  <td className="py-2.5 pr-4">
                    {r.teacher_name || <span className="text-slate-400">No teacher assigned yet</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.qualification || "-"}</td>
                </tr>
              );
            })}
          </Table>
          <p className="text-xs text-slate-400 mt-3">
            {withTeacher} of {rows.length} subjects have a teacher. Each subject in a
            section is taught by one teacher only.
          </p>
        </>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------
// My account
// ------------------------------------------------------------------
export function MyAccount() {
  const { user, refresh } = useAuth();
  const staff = user.role === "admin" || user.role === "teacher";

  const [form, setForm] = useState({
    full_name: user.name || "",
    phone: user.phone || "",
    email: staff ? String(user.email || "").split("@")[0] : user.email || "",
  });

  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm(function (o) { return { ...o, [k]: v }; });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setDone("");
    setBusy(true);

    try {
      const res = await api.put("/auth/profile", form);
      setDone(res.data.message);
      await refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="My account" subtitle="Your details and your password.">
      <div className="max-w-md space-y-4">
        <Card title="Your details" icon={UserCircle}>
          <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
          <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

          <form onSubmit={save} className="space-y-4">
            <Field label="Full name">
              <Input value={form.full_name} onChange={function (e) { set("full_name", e.target.value); }} required />
            </Field>

            <Field
              label={staff ? "Login name" : "Email"}
              hint={staff ? "Staff addresses end in @school.com." : "This is what you sign in with."}
            >
              {staff ? (
                <div className="flex">
                  <input
                    className="w-full border border-slate-300 rounded-l-xl px-3.5 py-2.5 text-[0.95rem] bg-white focus:border-teal focus:ring-4 focus:ring-brand-100 outline-none"
                    value={form.email}
                    onChange={function (e) { set("email", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "")); }}
                    required
                  />
                  <span className="inline-flex items-center px-3.5 rounded-r-xl border border-l-0 border-slate-300 bg-slate-50 text-sm text-slate-600 font-medium">
                    @school.com
                  </span>
                </div>
              ) : (
                <Input type="email" value={form.email} onChange={function (e) { set("email", e.target.value); }} required />
              )}
            </Field>

            <Field label="Mobile number">
              <PhoneInput value={form.phone} onChange={function (v) { set("phone", v); }} />
            </Field>

            <Button type="submit" loading={busy}>{busy ? "Saving..." : "Save details"}</Button>
          </form>

          {user.role === "student" && (
            <p className="text-xs text-slate-400 mt-4">
              You can also sign in with your registration number, whatever the email says.
            </p>
          )}
        </Card>

        <ChangePasswordCard />
      </div>
    </Page>
  );
}

export function ChangePassword() {
  return (
    <Page title="Change password" subtitle="Pick something only you know.">
      <div className="max-w-md">
        <ChangePasswordCard />
      </div>
    </Page>
  );
}

export function ChangePasswordCard() {
  const { user } = useAuth();
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setDone("");

    if (newPassword !== confirm) { setError("The two new passwords are not the same."); return; }
    if (newPassword.length < 6) { setError("Your new password must be at least 6 characters."); return; }
    if (newPassword === oldPassword) { setError("Your new password must be different from the old one."); return; }

    setBusy(true);

    try {
      await api.post("/auth/change-password", { oldPassword: oldPassword, newPassword: newPassword });
      setDone("Your password has been changed. Use the new one next time you sign in.");
      setOld(""); setNew(""); setConfirm("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change password" icon={KeyRound}>
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Current password" hint="If you have never changed it, this is 12345.">
          <Input type="password" value={oldPassword} autoComplete="current-password" onChange={function (e) { setOld(e.target.value); }} required />
        </Field>

        <Field label="New password" hint="At least 6 characters.">
          <Input type="password" value={newPassword} autoComplete="new-password" onChange={function (e) { setNew(e.target.value); }} required />
        </Field>

        <Field label="Type the new password again">
          <Input type="password" value={confirm} autoComplete="new-password" onChange={function (e) { setConfirm(e.target.value); }} required />
        </Field>

        <Button type="submit" loading={busy}>{busy ? "Saving..." : "Change password"}</Button>
      </form>

      <p className="text-xs text-slate-400 mt-4">
        {user.role === "admin"
          ? "Forgotten it entirely? Whoever looks after the school's server can reset it with a command (see the README)."
          : "Forgotten it entirely? Use \"Forgot password?\" on the sign-in page. The school office checks it's you, then lets you choose a new one."}
      </p>
    </Card>
  );
}
