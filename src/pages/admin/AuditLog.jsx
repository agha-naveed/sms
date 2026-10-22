// A read-only trail of who did what. There is deliberately no way to edit
// or delete an entry here, from this screen or the API behind it.
import { useEffect, useState } from "react";
import { ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";
import api, { errorText } from "../../api";
import { Page, Card, Table, Select, Input, Field, Button, Message, Loading, Empty } from "../../components/ui.jsx";

const ACTION_WORDS = {
  created: "added", updated: "changed", deleted: "removed", changed: "changed",
  approved: "approved", rejected: "rejected", marked: "marked", generated: "generated",
  recorded: "recorded", published: "published", unpublished: "unpublished",
  signed_in: "signed in", failed_signin: "failed sign-in", requested: "requested",
  reset: "reset", blocked: "blocked", assigned: "assigned", unassigned: "unassigned",
  moved: "moved", submitted: "submitted", posted: "posted", corrected: "corrected",
};

// Failures and refusals stand out, so they're easy to spot when scanning.
const ALERT_ACTIONS = ["failed_signin", "blocked"];

export default function AuditLog() {
  const [entities, setEntities] = useState([]);
  const [filters, setFilters] = useState({ entity: "", role: "", search: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    api.get("/audit/entities").then(function (res) { setEntities(res.data); }).catch(function () {});
  }, []);

  function load() {
    setData(null);
    api
      .get("/audit", { params: { ...filters, page } })
      .then(function (res) { setData(res.data); })
      .catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, [page]);

  function applyFilters(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <Page
      title="Audit log"
      subtitle="Every sign-in and every change made in the system, with who did it and when. Entries can never be edited or deleted, not even by the admin."
    >
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>

      <Card className="mb-4">
        <form onSubmit={applyFilters} className="grid sm:grid-cols-5 gap-3 items-end mb-3">
          <Field label="Area">
            <Select value={filters.entity} onChange={function (e) { setFilters({ ...filters, entity: e.target.value }); }}>
              <option value="">Everything</option>
              {entities.map(function (e) { return <option key={e} value={e}>{e.replace(/_/g, " ")}</option>; })}
            </Select>
          </Field>

          <Field label="Done by">
            <Select value={filters.role} onChange={function (e) { setFilters({ ...filters, role: e.target.value }); }}>
              <option value="">Anyone</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="public">Not signed in</option>
            </Select>
          </Field>

          <Field label="From">
            <Input type="date" value={filters.from} onChange={function (e) { setFilters({ ...filters, from: e.target.value }); }} />
          </Field>

          <Field label="To">
            <Input type="date" value={filters.to} onChange={function (e) { setFilters({ ...filters, to: e.target.value }); }} />
          </Field>

          <Field label="Search">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={filters.search} onChange={function (e) { setFilters({ ...filters, search: e.target.value }); }} placeholder="A name..." className="pl-9" />
            </div>
          </Field>

          <Button type="submit" size="sm" variant="plain">Apply filters</Button>
        </form>
      </Card>

      {!data ? (
        <Loading />
      ) : data.entries.length === 0 ? (
        <Card><Empty icon={ShieldCheck}>Nothing matches these filters.</Empty></Card>
      ) : (
        <Card>
          <Table head={["When", "Who", "Action", "Details"]}>
            {data.entries.map(function (e) {
              return (
                <tr key={e.id}>
                  <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="font-medium">{e.user_name || "Unknown"}</span>
                    <span className="block text-xs text-slate-400 capitalize">{e.user_role || "-"}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={"capitalize " + (ALERT_ACTIONS.indexOf(e.action) !== -1 ? "text-bad font-semibold" : "")}>
                      {ACTION_WORDS[e.action] || e.action.replace(/_/g, " ")}
                    </span>
                    <span className="block text-xs text-slate-400 capitalize">{e.entity.replace(/_/g, " ")}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span>{e.label}</span>
                    {e.details && <span className="block text-xs text-slate-400">{e.details}</span>}
                  </td>
                </tr>
              );
            })}
          </Table>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {data.total} entr{data.total === 1 ? "y" : "ies"} · page {data.page} of {data.total_pages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="plain" icon={ChevronLeft} disabled={page <= 1} onClick={function () { setPage(page - 1); }}>Newer</Button>
              <Button size="sm" variant="plain" icon={ChevronRight} disabled={page >= data.total_pages} onClick={function () { setPage(page + 1); }}>Older</Button>
            </div>
          </div>
        </Card>
      )}
    </Page>
  );
}
