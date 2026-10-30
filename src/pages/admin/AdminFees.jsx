// Generate monthly slips, take payments at the office, print receipts.
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, AlertTriangle, Receipt, Wand2, Users2 } from "lucide-react";
import api, { errorText } from "../../api";
import {
  Page, Card, Table, Pill, Button, Select, Input, Field, Message, Loading, Empty,
  Stat, money, MONTHS,
} from "../../components/ui.jsx";
import { SlipModal } from "../../components/PrintDocs.jsx";
import { usePagination, Pagination } from "../../components/Pagination.jsx";

export default function AdminFees() {
  const now = new Date();

  const [slips, setSlips] = useState(null);
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(null);
  const [paying, setPaying] = useState(null);   // id of the slip being paid, right in its row
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const [filters, setFilters] = useState({ month: "", year: now.getFullYear(), status: "", class_id: "" });

  // Only one page of slips is drawn at a time; a new filter goes back to page 1.
  const pg = usePagination(slips, JSON.stringify(filters));

  const [gen, setGen] = useState({
    month: now.getMonth() + 1, year: now.getFullYear(), months_count: 1, due_day: 10, other_fee: 0, class_id: "",
  });

  function load() {
    api
      .get("/fees", { params: { month: filters.month || undefined, year: filters.year || undefined, status: filters.status || undefined, class_id: filters.class_id || undefined } })
      .then(function (res) { setSlips(res.data); })
      .catch(function (err) { setError(errorText(err)); });

    api.get("/fees/summary").then(function (res) { setSummary(res.data); }).catch(function () {});
  }

  useEffect(load, [filters]);

  useEffect(function () {
    api.get("/classes").then(function (res) { setClasses(res.data); }).catch(function () {});
  }, []);

  async function generate(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/fees/generate", gen);
      setDone(
        res.data.created + " slips created for " + res.data.covers +
        (res.data.already_existed > 0
          ? ". " + res.data.already_existed + " students were skipped because a slip already covers one of those months."
          : ".")
      );
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  function openSlip(id) {
    api.get("/fees/slip/" + id).then(function (res) { setOpen(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  if (!slips) return <Loading />;

  return (
    <Page title="Fees" subtitle="Generate slips at the start of the month, then record payments as they come in.">
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
      <Message type="success" onClose={function () { setDone(""); }}>{done}</Message>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Stat icon={CheckCircle2} label="Collected" value={money(summary.collected)} tone="good" />
          <Stat icon={Clock3} label="Outstanding" value={money(summary.pending)} tone="warn" />
          <Stat icon={AlertTriangle} label="Overdue slips" value={summary.overdue_slips} tone="bad" />
          <Stat icon={Receipt} label="Total slips" value={summary.total_slips} />
        </div>
      )}

      <Card title="Generate monthly fee slips" icon={Wand2} className="mb-4">
        <form onSubmit={generate} className="grid sm:grid-cols-6 gap-3 items-end">
          <Field label="Starting month">
            <Select value={gen.month} onChange={function (e) { setGen({ ...gen, month: Number(e.target.value) }); }}>
              {MONTHS.map(function (m, i) { return <option key={m} value={i + 1}>{m}</option>; })}
            </Select>
          </Field>

          <Field label="Year">
            <Input type="number" value={gen.year} onChange={function (e) { setGen({ ...gen, year: Number(e.target.value) }); }} />
          </Field>

          <Field label="How many months">
            <Select value={gen.months_count} onChange={function (e) { setGen({ ...gen, months_count: Number(e.target.value) }); }}>
              <option value={1}>1 month</option>
              <option value={2}>2 months</option>
              <option value={3}>3 months (quarter)</option>
              <option value={4}>4 months</option>
              <option value={6}>6 months (half year)</option>
              <option value={12}>12 months (full year)</option>
            </Select>
          </Field>

          <Field label="Due day">
            <Input type="number" min="1" max="28" value={gen.due_day} onChange={function (e) { setGen({ ...gen, due_day: Number(e.target.value) }); }} />
          </Field>

          <Field label="Extra charges">
            <Input type="number" value={gen.other_fee} onChange={function (e) { setGen({ ...gen, other_fee: Number(e.target.value) }); }} />
          </Field>

          <Button type="submit">Generate slips</Button>
        </form>
        <p className="text-xs text-slate-400 mt-3">
          Choosing more than one month puts them all on a single slip, and the tuition
          is multiplied. Safe to run twice: a student is skipped if any of those months
          is already on a slip.
        </p>
      </Card>

      <Card className="mb-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Month">
            <Select value={filters.month} onChange={function (e) { setFilters({ ...filters, month: e.target.value }); }}>
              <option value="">All months</option>
              {MONTHS.map(function (m, i) { return <option key={m} value={i + 1}>{m}</option>; })}
            </Select>
          </Field>

          <Field label="Year">
            <Input type="number" value={filters.year} onChange={function (e) { setFilters({ ...filters, year: e.target.value }); }} />
          </Field>

          <Field label="Class">
            <Select value={filters.class_id} onChange={function (e) { setFilters({ ...filters, class_id: e.target.value }); }}>
              <option value="">All classes</option>
              {classes.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
            </Select>
          </Field>

          <Field label="Status">
            <Select value={filters.status} onChange={function (e) { setFilters({ ...filters, status: e.target.value }); }}>
              <option value="">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Part paid</option>
              <option value="paid">Paid</option>
            </Select>
          </Field>
        </div>
      </Card>

      <CombinedPayment onPaid={function (msg) { setDone(msg); load(); }} onError={setError} />

      <Card>
        {slips.length === 0 ? (
          <Empty icon={Receipt}>No fee slips match these filters. Generate slips for a month above.</Empty>
        ) : (
          <Table head={["Student", "Class", "Period", "Total", "Paid", "Balance", "Status", ""]}>
            {pg.pageItems.map(function (s) {
              return (
                <tr key={s.id} className="relative">
                  <td className="py-2.5 pr-4">
                    <span className="font-medium">{s.student_name}</span>
                    <span className="block text-xs text-slate-400">{s.admission_no}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{s.class_name} {s.section_name ? "- " + s.section_name : ""}</td>
                  <td className="py-2.5 pr-4">{s.month_label}</td>
                  <td className="py-2.5 pr-4">{money(s.total)}</td>
                  <td className="py-2.5 pr-4">{money(s.paid_amount)}</td>
                  <td className={"py-2.5 pr-4 " + (s.balance > 0 ? "text-bad" : "text-good")}>{money(s.balance)}</td>
                  <td className="py-2.5 pr-4"><Pill status={s.is_overdue && s.balance > 0 ? "overdue" : s.status} /></td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    {paying === s.id ? (
                      <InlinePayment
                        slip={s}
                        onClose={function () { setPaying(null); }}
                        onSaved={function () { setPaying(null); setDone("Payment recorded for " + s.student_name + "."); load(); }}
                      />
                    ) : (
                      <>
                        {s.balance > 0 && (
                          <Button size="sm" variant="good" onClick={function () { setPaying(s.id); }}>Take payment</Button>
                        )}
                        <Button size="sm" variant="plain" className={s.balance > 0 ? "ml-2" : ""} onClick={function () { openSlip(s.id); }}>Slip</Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
        <Pagination pg={pg} />
      </Card>

      {open && <SlipModal slip={open} onClose={function () { setOpen(null); }} />}
    </Page>
  );
}

// A parent walks in and pays for two or three months at once. The money is
// put against the oldest unpaid slip first, then the next.
function CombinedPayment({ onPaid, onError }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [owing, setOwing] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function findStudents(e) {
    e.preventDefault();
    api.get("/students", { params: { search: search } }).then(function (r) { setStudents(r.data); }).catch(function (err) { onError(errorText(err)); });
  }

  function loadOwing(id) {
    setStudentId(id);
    setOwing(null);
    api
      .get("/fees/outstanding", { params: { student_id: id } })
      .then(function (r) { setOwing(r.data); setAmount(r.data.total_due); })
      .catch(function (err) { onError(errorText(err)); });
  }

  async function pay() {
    try {
      const res = await api.post("/fees/pay-many", { student_id: studentId, amount: Number(amount), note: note });
      onPaid(res.data.message + " " + res.data.applied.map(function (a) { return a.period; }).join(", ") + ".");
      setOpen(false); setOwing(null); setStudents([]); setSearch(""); setStudentId("");
    } catch (err) {
      onError(errorText(err));
    }
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button variant="plain" icon={Users2} onClick={function () { setOpen(true); }}>
          Take a payment for several months at once
        </Button>
      </div>
    );
  }

  return (
    <Card title="Payment covering more than one month" className="mb-4">
      <form onSubmit={findStudents} className="flex flex-wrap gap-2 items-end mb-4">
        <div className="flex-1 min-w-56">
          <Field label="Find the student" hint="Name or registration number.">
            <Input value={search} onChange={function (e) { setSearch(e.target.value); }} placeholder="2026-0001" />
          </Field>
        </div>
        <Button variant="plain" type="submit">Search</Button>
        <Button variant="plain" onClick={function () { setOpen(false); }}>Close</Button>
      </form>

      {students.length > 0 && !owing && (
        <Table head={["Reg. no", "Name", "Class", ""]}>
          {students.map(function (st) {
            return (
              <tr key={st.id}>
                <td className="py-2.5 pr-4 text-slate-500">{st.admission_no}</td>
                <td className="py-2.5 pr-4 font-medium">{st.name}</td>
                <td className="py-2.5 pr-4 text-slate-500">{st.class_name} {st.section_name ? "- " + st.section_name : ""}</td>
                <td className="py-2.5 pr-4">
                  <Button size="sm" variant="plain" onClick={function () { loadOwing(st.id); }}>Choose</Button>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {owing && (
        <div>
          {owing.slips.length === 0 ? (
            <Empty>This student has nothing outstanding.</Empty>
          ) : (
            <>
              <Table head={["Slip", "Period", "Total", "Paid", "Still owed", "Days late"]}>
                {owing.slips.map(function (sl) {
                  return (
                    <tr key={sl.id}>
                      <td className="py-2.5 pr-4 text-slate-500">{sl.slip_no}</td>
                      <td className="py-2.5 pr-4">{sl.month_label}</td>
                      <td className="py-2.5 pr-4">{money(sl.total)}</td>
                      <td className="py-2.5 pr-4">{money(sl.paid_amount)}</td>
                      <td className="py-2.5 pr-4 text-bad">{money(sl.balance)}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{sl.days_overdue > 0 ? sl.days_overdue : "-"}</td>
                    </tr>
                  );
                })}
              </Table>

              <p className="text-sm mt-3">Total outstanding: <strong>{money(owing.total_due)}</strong></p>

              <div className="grid sm:grid-cols-3 gap-3 items-end mt-4 pt-4 border-t border-slate-100">
                <Field label="Amount received" hint="Less than the total is fine.">
                  <Input type="number" value={amount} max={owing.total_due} onChange={function (e) { setAmount(e.target.value); }} />
                </Field>
                <Field label="Note">
                  <Input value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="Cash for March and April" />
                </Field>
                <Button variant="good" onClick={pay}>Record payment</Button>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                The money goes against the oldest slip first, then the next, until it
                runs out. Each slip is marked paid or part paid on its own.
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// Taking a payment happens right inside the student's row: the amount and a
// note appear where the buttons were, and once it is saved the row goes back
// to normal.
function InlinePayment({ slip, onClose, onSaved }) {
  const [amount, setAmount] = useState(slip.balance);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError("");

    const value = Number(amount);
    if (!value || value <= 0) { setError("Enter the amount received."); return; }
    if (value > slip.balance) { setError("That is more than the " + money(slip.balance) + " still owed."); return; }

    setBusy(true);
    try {
      await api.post("/fees/" + slip.id + "/pay", { amount: value, note: note });
      onSaved();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2 absolute right-[22px] top-1/2 -translate-y-1/2 bg-white">
      <Input
        type="number"
        min="1"
        max={slip.balance}
        autoFocus
        value={amount}
        onChange={function (e) { setAmount(e.target.value); }}
        className="!w-28 !py-1.5"
        aria-label="Amount received"
      />
      <Input
        value={note}
        onChange={function (e) { setNote(e.target.value); }}
        placeholder="Note (optional)"
        className="!w-40 !py-1.5"
        aria-label="Note"
      />
      <Button type="submit" size="sm" variant="good" loading={busy}>Save</Button>
      <Button type="button" size="sm" variant="plain" onClick={onClose} disabled={busy}>Cancel</Button>
      {error && <span className="basis-full text-xs text-bad">{error}</span>}
    </form>
  );
}
