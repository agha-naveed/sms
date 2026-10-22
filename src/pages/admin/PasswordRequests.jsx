// Someone forgot their password and asked to reset it. Approving lets that
// person choose a new password for the account, so this is a security
// decision: the page shows what's needed to check it's really them (the
// phone number on file, the class, the child's or parent's name), and every
// decision is recorded in the audit log.
import { useEffect, useState } from "react";
import { KeyRound, Phone, ShieldAlert, Clock3, CheckCircle2 } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Table, Pill, Button, Input, Field, Message, Loading, Empty, Tabs, Confirm,
} from "../../components/ui.jsx";

const ROLE_LABEL = { teacher: "Teacher", student: "Student", parent: "Parent" };

function when(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function PasswordRequests() {
  const [list, setList] = useState(null);
  const [tab, setTab] = useState("open");
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);   // the request whose reject box is open
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api.get("/password-requests").then(function (res) { setList(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  async function confirmApprove() {
    setBusy(true);
    try {
      const res = await api.post("/password-requests/" + approving.id + "/approve");
      setDone(res.data.message);
      setApproving(null);
      load();
    } catch (err) {
      setError(errorText(err));
      setApproving(null);
    } finally {
      setBusy(false);
    }
  }

  async function reject(request) {
    setBusy(true);
    try {
      const res = await api.post("/password-requests/" + request.id + "/reject", { note: note });
      setDone(res.data.message);
      setRejecting(null);
      setNote("");
      load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!list) return <Loading />;

  const open = list.filter(function (r) { return r.status === "pending" || r.status === "approved"; });
  const history = list.filter(function (r) { return r.status !== "pending" && r.status !== "approved"; });
  const waiting = open.filter(function (r) { return r.status === "pending" }).length;

  return (
    <Page
      title="Password requests"
      subtitle="People who forgot their password ask here. Approve a request only once you're sure it's really them."
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { value: "open", label: "Open" + (waiting > 0 ? " (" + waiting + ")" : "") },
          { value: "history", label: "History" },
        ]}
      />

      {tab === "open" && (
        <>
          <div className="flex items-start gap-3 bg-warn/5 border border-warn/20 rounded-xl px-4 py-3 mb-4 text-sm text-slate-600">
            <ShieldAlert size={18} className="text-warn shrink-0 mt-0.5" />
            <p>
              Whoever you approve gets to set a new password for that account. Before approving, call the
              phone number on file, or check with them in person. If you can't confirm it's them, reject it.
            </p>
          </div>

          {open.length === 0 ? (
            <Card><Empty icon={KeyRound}>No one is waiting. Requests appear here as soon as they're sent.</Empty></Card>
          ) : (
            <div className="space-y-3">
              {open.map(function (r) {
                const approved = r.status === "approved";
                return (
                  <Card key={r.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-ink flex items-center gap-2">
                          {r.name}
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {ROLE_LABEL[r.role] || r.role}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500">{r.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Asked {when(r.requested_at)}</p>
                      </div>

                      {approved ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-good bg-good/10 px-2.5 py-1 rounded-full h-fit">
                          <CheckCircle2 size={13} /> Approved, not used yet
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warn bg-warn/10 px-2.5 py-1 rounded-full h-fit">
                          <Clock3 size={13} /> Waiting for you
                        </span>
                      )}
                    </div>

                    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-4 pt-4 border-t border-slate-100">
                      <Detail label="Phone on file" value={r.phone || "None on file"} icon={Phone} />

                      {r.role === "student" && (
                        <>
                          <Detail label="Registration no." value={r.admission_no || "-"} />
                          <Detail label="Class" value={r.class_name ? r.class_name + " - Section " + r.section_name : "-"} />
                          <Detail
                            label="Parent (to call)"
                            value={r.parent_name ? r.parent_name + (r.parent_phone ? ", " + r.parent_phone : "") : "None linked"}
                          />
                        </>
                      )}

                      {r.role === "parent" && <Detail label="Children" value={r.children || "None linked"} />}
                    </dl>

                    {approved && (
                      <p className="text-xs text-slate-400 mt-3">
                        Open until {when(r.expires_at)}. They choose their new password from the Forgot
                        password page, in the browser they asked from.
                      </p>
                    )}

                    {rejecting === r.id ? (
                      <div className="mt-4 pt-4 border-t border-slate-100 grid sm:grid-cols-3 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <Field label={approved ? "Why cancel it?" : "Reason"} hint="Optional. They'll see this.">
                            <Input value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="Couldn't confirm it was you" />
                          </Field>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="danger" loading={busy} onClick={function () { reject(r); }}>
                            {approved ? "Cancel request" : "Reject"}
                          </Button>
                          <Button variant="plain" onClick={function () { setRejecting(null); setNote(""); }}>Back</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        {!approved && (
                          <Button variant="good" onClick={function () { setApproving(r); }}>Approve</Button>
                        )}
                        <Button variant="plain" onClick={function () { setRejecting(r.id); setNote(""); }}>
                          {approved ? "Cancel request" : "Reject"}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "history" && (
        <Card>
          {history.length === 0 ? (
            <Empty>Nothing here yet. Requests you've dealt with, and ones that were used or lapsed, appear here.</Empty>
          ) : (
            <Table head={["Person", "Role", "Asked", "Outcome", "Decided by", "Note"]}>
              {history.map(function (r) {
                return (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-4 font-medium">{r.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{ROLE_LABEL[r.role] || r.role}</td>
                    <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">{when(r.requested_at)}</td>
                    <td className="py-2.5 pr-4"><Pill status={r.status} /></td>
                    <td className="py-2.5 pr-4 text-slate-500">{r.decided_by_name || "-"}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{r.note || "-"}</td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      <Confirm
        open={!!approving}
        title={approving ? "Approve " + approving.name + "'s request?" : ""}
        body="They will be able to choose a new password for this account. Only approve if you're sure it's really them."
        confirmLabel="Yes, it's them. Approve"
        busy={busy}
        onConfirm={confirmApprove}
        onCancel={function () { setApproving(null); }}
      />
    </Page>
  );
}

function Detail({ label, value, icon: Icon }) {
  return (
    <div>
      <dt className="text-xs text-slate-400 flex items-center gap-1">
        {Icon && <Icon size={11} />} {label}
      </dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
