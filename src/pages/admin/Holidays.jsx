// The school calendar: which days the school is closed. No attendance can be
// marked on these days and none is counted in any report.
import { useEffect, useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Button, Select, Input, Field, Message, Loading, Empty, Confirm,
} from "../../components/ui.jsx";

const WEEKLY = [
  { value: "none", label: "No weekly off day" },
  { value: "sunday", label: "Sunday" },
  { value: "saturday", label: "Saturday" },
  { value: "both", label: "Saturday and Sunday" },
];

const KIND_STYLE = {
  holiday: "bg-brand-50 text-brand-700",
  summer_vacation: "bg-warn/10 text-warn",
  winter_vacation: "bg-slate-100 text-slate-600",
  local_holiday: "bg-good/10 text-good",
};

function nice(text) {
  return new Date(text + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function dayCount(a, b) {
  return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000) + 1;
}

export default function Holidays() {
  const today = new Date().toISOString().slice(0, 10);

  const [data, setData] = useState(null);
  const [kind, setKind] = useState("holiday");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api.get("/holidays").then(function (res) { setData(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  async function saveWeekly(value) {
    setError(""); setDone("");
    try {
      await api.put("/holidays/weekly-off", { weekly_off: value });
      setData(function (d) { return { ...d, weekly_off: value }; });
      setDone("Weekly off days saved.");
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function add(e) {
    e.preventDefault();
    setError(""); setDone(""); setBusy(true);
    try {
      await api.post("/holidays", {
        kind: kind, title: title, start_date: start, end_date: end || start, note: note,
      });
      setTitle(""); setEnd(""); setNote("");
      setDone("Saved. No attendance will be taken or counted on those days.");
      load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.delete("/holidays/" + removing.id);
      setRemoving(null);
      setDone("Removed. Attendance counts those days again.");
      load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Loading />;

  const upcoming = data.holidays.filter(function (h) { return h.end_date >= today; }).reverse();
  const past = data.holidays.filter(function (h) { return h.end_date < today; });
  const label = {};
  data.kinds.forEach(function (k) { label[k.value] = k.label; });

  function row(h) {
    return (
      <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="font-medium text-ink flex flex-wrap items-center gap-2">
            {h.title}
            <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (KIND_STYLE[h.kind] || "bg-slate-100 text-slate-600")}>
              {label[h.kind] || h.kind}
            </span>
          </p>
          <p className="text-sm text-slate-500">
            {nice(h.start_date)}
            {h.end_date !== h.start_date ? " to " + nice(h.end_date) + " (" + dayCount(h.start_date, h.end_date) + " days)" : ""}
          </p>
          {h.note && <p className="text-xs text-slate-400 mt-0.5">{h.note}</p>}
        </div>
        <Button size="sm" variant="danger" icon={Trash2} onClick={function () { setRemoving(h); }}>Remove</Button>
      </li>
    );
  }

  return (
    <Page
      title="Holidays & vacations"
      subtitle="Days the school is closed. No attendance can be marked on these days, and none is counted in any report."
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      <Card title="Weekly off days" icon={CalendarOff} description="The days that are closed every week." className="mb-4">
        <div className="max-w-xs">
          <Select value={data.weekly_off} onChange={function (e) { saveWeekly(e.target.value); }}>
            {WEEKLY.map(function (w) { return <option key={w.value} value={w.value}>{w.label}</option>; })}
          </Select>
        </div>
      </Card>

      <Card title="Add a holiday or vacation" icon={Plus} className="mb-4">
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={kind} onChange={function (e) { setKind(e.target.value); }}>
              {data.kinds.map(function (k) { return <option key={k.value} value={k.value}>{k.label}</option>; })}
            </Select>
          </Field>
          <Field label="Name" hint="Optional. For example: Eid ul Fitr.">
            <Input value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder={label[kind]} />
          </Field>
          <Field label="First day">
            <Input type="date" value={start} onChange={function (e) { setStart(e.target.value); }} required />
          </Field>
          <Field label="Last day" hint="Leave empty for a single day.">
            <Input type="date" value={end} min={start} onChange={function (e) { setEnd(e.target.value); }} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note" hint="Optional.">
              <Input value={note} onChange={function (e) { setNote(e.target.value); }} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={busy}>Save</Button>
          </div>
        </form>
      </Card>

      <Card title="Upcoming and current" className="mb-4">
        {upcoming.length === 0
          ? <Empty icon={CalendarOff}>No holidays or vacations are planned.</Empty>
          : <ul className="divide-y divide-slate-100">{upcoming.map(row)}</ul>}
      </Card>

      {past.length > 0 && (
        <Card title="Past">
          <ul className="divide-y divide-slate-100">{past.map(row)}</ul>
        </Card>
      )}

      <Confirm
        open={!!removing}
        title={removing ? "Remove " + removing.title + "?" : ""}
        body="Those days will count as normal school days again, and any attendance already marked on them will show in the reports."
        confirmLabel="Remove"
        danger
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={function () { setRemoving(null); }}
      />
    </Page>
  );
}
