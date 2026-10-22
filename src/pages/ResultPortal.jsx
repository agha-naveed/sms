// The public result board. Anyone can look up one application, but only with
// something they already know: form number, registration number, the email
// used on the form, or the child's full name.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import api, { errorText } from "../api";
import { SCHOOL, Crest } from "../school.jsx";
import { Button, Input, Field, Message, Card, Pill, Empty } from "../components/ui.jsx";

export default function ResultPortal() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await api.get("/admissions/check", { params: { q: q } });
      setResults(res.data);
    } catch (err) {
      setError(errorText(err));
      setResults(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Crest className="w-8 h-8 text-white" />
            <span className="font-semibold">{SCHOOL.shortName}</span>
          </Link>
          <Link to="/login" className="text-sm text-white/70 hover:text-white">Sign in</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-ink">Admission result</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Check whether a child has been accepted. Results are published here as soon
          as the office reviews each application.
        </p>

        <Card className="mb-6">
          <form onSubmit={search} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-64">
              <Field
                label="Form number, registration number, email or full name"
                hint="For example APP-2026-0007, or 2026-0001, or the exact name written on the form."
              >
                <Input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder="APP-2026-0007" required />
              </Field>
            </div>
            <Button type="submit" icon={Search} loading={busy}>
              {busy ? "Searching..." : "Search"}
            </Button>
          </form>

          <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
        </Card>

        {results && results.length === 0 && (
          <Card>
            <Empty>
              Nothing found. Check the spelling, or try the form number printed on your
              copy of the admission form.
            </Empty>
          </Card>
        )}

        {results && results.map(function (r, i) {
          return (
            <Card key={i} className="mb-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink text-lg">{r.student_name}</h2>
                  <p className="text-sm text-slate-500">
                    Applied for {r.applying_class || "-"} on{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Pill status={r.status} />
              </div>

              {r.status === "pending" && (
                <p className="text-sm text-slate-600 mt-4">
                  This application is still being reviewed. Please check again in a few
                  days, or call the office on {SCHOOL.phone}.
                </p>
              )}

              {r.status === "rejected" && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600">This application was not accepted.</p>
                  {r.remarks && <p className="text-sm text-bad mt-1">Reason: {r.remarks}</p>}
                  <p className="text-sm text-slate-600 mt-2">
                    You may apply again through the{" "}
                    <Link to="/apply" className="text-teal underline font-medium">admission form</Link>.
                  </p>
                </div>
              )}

              {r.status === "approved" && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-good font-semibold mb-3">Accepted. Welcome to the school.</p>
                  <dl className="grid sm:grid-cols-3 gap-4 text-sm">
                    <Detail label="Registration number" value={r.admission_no || "-"} />
                    <Detail label="Section" value={r.section_name || "-"} />
                    <Detail label="Student login" value={r.login_email || "-"} />
                  </dl>
                  <p className="text-sm text-slate-600 mt-4">
                    Collect the student and parent passwords from the school office.
                    Bring the printed admission form with you.
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        <p className="text-xs text-slate-400 mt-8">
          Only the person who applied can look this up. Partial names are not searched,
          and the form number is never shown on this page, so the list cannot be
          browsed from outside.
        </p>
      </main>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium break-all">{value}</dd>
    </div>
  );
}
