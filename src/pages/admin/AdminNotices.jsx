// Post announcements. Marking one important also drops it into every
// reader's notification list, so parents see it on their dashboard.
import { useEffect, useState } from "react";
import { Megaphone, AlertTriangle, Trash2 } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Button, Input, Select, Textarea, Field, Message, Loading, Empty, Confirm,
} from "../../components/ui.jsx";

export default function AdminNotices() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", audience: "all", is_important: false });
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.get("/notices").then(function (res) { setList(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  function set(k, v) {
    setForm(function (old) { return { ...old, [k]: v }; });
  }

  async function post(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/notices", form);
      setForm({ title: "", body: "", audience: "all", is_important: false });
      setDone("Notice published.");
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.delete("/notices/" + removing.id);
      setRemoving(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!list) return <Loading />;

  return (
    <Page title="Notice board" subtitle="Write once, and the right people see it.">
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <Card title="Write a notice" icon={Megaphone} className="mb-4">
        <form onSubmit={post} className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={function (e) { set("title", e.target.value); }} placeholder="School closed on Friday" required />
          </Field>

          <Field label="Message" required>
            <Textarea value={form.body} onChange={function (e) { set("body", e.target.value); }} rows={4} required />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Who should see it">
              <Select value={form.audience} onChange={function (e) { set("audience", e.target.value); }}>
                <option value="all">Everyone</option>
                <option value="parent">Parents only</option>
                <option value="student">Students only</option>
                <option value="teacher">Teachers only</option>
              </Select>
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-600 sm:mt-7 select-none">
              <input
                type="checkbox"
                checked={form.is_important}
                onChange={function (e) { set("is_important", e.target.checked); }}
                className="w-4 h-4 rounded accent-teal"
              />
              Also send it as a notification
            </label>
          </div>

          <Button type="submit">Publish notice</Button>
        </form>
      </Card>

      {list.length === 0 ? (
        <Card><Empty icon={Megaphone}>Nothing published yet.</Empty></Card>
      ) : (
        <div className="space-y-3">
          {list.map(function (n) {
            return (
              <Card key={n.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink flex items-center gap-2">
                      {n.title}
                      {n.is_important && (
                        <span className="inline-flex items-center gap-1 text-xs text-bad font-semibold bg-bad/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={11} /> Important
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      For {n.audience === "all" ? "everyone" : n.audience + "s"} · {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="plain" icon={Trash2} onClick={function () { setRemoving(n); }}>Delete</Button>
                </div>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{n.body}</p>
              </Card>
            );
          })}
        </div>
      )}

      <Confirm
        open={!!removing}
        title="Delete this notice?"
        body="It will be removed from everyone's notice board."
        confirmLabel="Delete notice"
        danger
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={function () { setRemoving(null); }}
      />
    </Page>
  );
}
