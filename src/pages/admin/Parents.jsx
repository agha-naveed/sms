// Every parent account, with the children linked to it.
// Parent accounts are created automatically when an admission is approved,
// so this page is mostly for looking things up and adding the odd extra one.
import { useEffect, useState } from "react";
import { UserPlus, Contact, Search } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Button, Input, Field, Message, Loading, Empty, PhoneInput, CnicInput,
} from "../../components/ui.jsx";

export default function Parents() {
  const [list, setList] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api.get("/parents").then(function (res) { setList(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  if (!list) return <Loading />;

  const text = search.trim().toLowerCase();

  const shown = text === "" ? list : list.filter(function (p) {
    const inParent =
      p.name.toLowerCase().includes(text) ||
      p.email.toLowerCase().includes(text) ||
      (p.phone || "").includes(text) ||
      (p.cnic || "").includes(text);

    const inChildren = p.students.some(function (s) {
      return s.name.toLowerCase().includes(text) || s.admission_no.toLowerCase().includes(text);
    });

    return inParent || inChildren;
  });

  return (
    <Page
      title="Parents"
      subtitle={list.length + " parent accounts. One parent can have several children."}
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      {showForm && (
        <AddParent
          onDone={function () { setShowForm(false); setDone("Parent added. Link a child to them from the Students page."); load(); }}
          onError={setError}
        />
      )}

      <Card className="mb-4">
        <Field label="Search by parent name, email, phone, CNIC, or a child's name">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={function (e) { setSearch(e.target.value); }} placeholder="Ahmed Khan" className="pl-10" />
          </div>
        </Field>
      </Card>

      {shown.length === 0 ? (
        <Card>
          <Empty icon={Contact}>
            {list.length === 0
              ? "No parent accounts yet. They are created when you approve an admission."
              : "No parent matches that search."}
          </Empty>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map(function (p) {
            return (
              <Card key={p.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">{p.name}</h3>
                    <p className="text-sm text-slate-500">
                      {p.email}{p.phone ? " · " + p.phone : ""}{p.cnic ? " · CNIC " + p.cnic : ""}
                    </p>
                    {p.occupation && <p className="text-xs text-slate-400 mt-0.5">{p.occupation}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">{p.children} child{p.children === 1 ? "" : "ren"}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  {p.students.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No child linked yet. Open the Students page and set this parent on a student.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {p.students.map(function (s) {
                        return (
                          <div key={s.id} className="flex flex-wrap justify-between gap-2 text-sm">
                            <span className="font-medium text-ink">{s.name}</span>
                            <span className="text-slate-500">
                              {s.admission_no} · {s.class_name || "-"}{s.section_name ? " - " + s.section_name : ""}
                            </span>
                            <span className="text-slate-400 w-full sm:w-auto">{s.email}</span>
                          </div>
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

    </Page>
  );
}

function AddParent({ onDone, onError }) {
  const [form, setForm] = useState({ name: "", email: "", password: "12345", phone: "", cnic: "", occupation: "" });
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm(function (old) { return { ...old, [k]: v }; });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/parents", form);
      onDone();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="New parent account" icon={UserPlus} className="mb-4">
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <Input value={form.name} onChange={function (e) { set("name", e.target.value); }} required />
        </Field>

        <Field label="Email" required hint="This is their login.">
          <Input type="email" value={form.email} onChange={function (e) { set("email", e.target.value); }} required />
        </Field>

        <Field label="Password" hint="Leave it as 12345 unless you have a reason to change it.">
          <Input value={form.password} onChange={function (e) { set("password", e.target.value); }} required />
        </Field>

        <Field label="Mobile number">
          <PhoneInput value={form.phone} onChange={function (v) { set("phone", v); }} />
        </Field>

        <Field label="CNIC">
          <CnicInput value={form.cnic} onChange={function (v) { set("cnic", v); }} />
        </Field>

        <Field label="Occupation">
          <Input value={form.occupation} onChange={function (e) { set("occupation", e.target.value); }} />
        </Field>

        <div className="flex items-end">
          <Button type="submit" loading={busy}>Add parent</Button>
        </div>
      </form>
    </Card>
  );
}
