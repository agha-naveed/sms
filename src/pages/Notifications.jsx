// Every role sees this page. It is where absence alerts land for parents.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, AlertTriangle, Banknote, FileText, Trophy, Info, CheckCheck, KeyRound } from "lucide-react";
import api, { errorText } from "../api";
import { Page, Card, Empty, Loading, Button, Message } from "../components/ui.jsx";

const KIND = {
  attendance: { border: "border-l-bad", bg: "bg-bad/10 text-bad", icon: AlertTriangle },
  fee: { border: "border-l-warn", bg: "bg-warn/10 text-warn", icon: Banknote },
  assignment: { border: "border-l-teal", bg: "bg-brand-50 text-brand-600", icon: FileText },
  result: { border: "border-l-good", bg: "bg-good/10 text-good", icon: Trophy },
  security: { border: "border-l-warn", bg: "bg-warn/10 text-warn", icon: KeyRound },
  general: { border: "border-l-slate-300", bg: "bg-slate-100 text-slate-500", icon: Info },
};

export default function Notifications() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/notifications").then(function (res) { setData(res.data); }).catch(function (err) { setError(errorText(err)); });
  }

  useEffect(load, []);

  function markRead(id) {
    api.post("/notifications/" + id + "/read").then(load).catch(function () {});
  }

  function markAll() {
    api.post("/notifications/read-all").then(load).catch(function () {});
  }

  if (error) return <Message type="error">{error}</Message>;
  if (!data) return <Loading />;

  return (
    <Page
      title="Notifications"
      subtitle={data.unread > 0 ? data.unread + " unread" : "Everything is read."}
      action={data.unread > 0 && <Button variant="plain" icon={CheckCheck} onClick={markAll}>Mark all as read</Button>}
    >
      {data.items.length === 0 ? (
        <Card><Empty icon={Bell}>Nothing here yet. Alerts about attendance, fees and results appear on this page.</Empty></Card>
      ) : (
        <div className="space-y-2">
          {data.items.map(function (n) {
            const k = KIND[n.type] || KIND.general;
            const Icon = k.icon;
            return (
              <div
                key={n.id}
                className={
                  "bg-white border border-slate-200 border-l-4 rounded-2xl p-4 shadow-soft flex gap-3 " +
                  k.border + (n.is_read ? " opacity-60" : "")
                }
              >
                <span className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " + k.bg}>
                  <Icon size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold text-ink">{n.title}</h3>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  {n.body && <p className="text-sm text-slate-600 mt-1">{n.body}</p>}
                  {n.type === "security" && n.title === "Password reset request" && (
                    <Link
                      to="/admin/password-requests"
                      onClick={function () { markRead(n.id); }}
                      className="inline-block text-sm font-semibold text-teal underline mt-2 mr-4"
                    >
                      Review the request
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={function () { markRead(n.id); }}
                      className="text-xs text-teal font-semibold underline mt-2"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
