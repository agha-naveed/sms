// The notice board. Each role only receives the notices meant for it.
import { useEffect, useState } from "react";
import { Megaphone, AlertTriangle } from "lucide-react";
import api, { errorText } from "../api";
import { Page, Card, Empty, Loading, Message } from "../components/ui.jsx";

export default function Notices() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    api.get("/notices").then(function (res) { setList(res.data); }).catch(function (err) { setError(errorText(err)); });
  }, []);

  if (error) return <Message type="error">{error}</Message>;
  if (!list) return <Loading />;

  return (
    <Page title="Notice board" subtitle="Announcements from the school office.">
      {list.length === 0 ? (
        <Card><Empty icon={Megaphone}>No notices have been posted.</Empty></Card>
      ) : (
        <div className="space-y-3">
          {list.map(function (n) {
            return (
              <article
                key={n.id}
                className={
                  "bg-white border rounded-2xl p-5 shadow-soft " +
                  (n.is_important ? "border-bad/30" : "border-slate-200")
                }
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <h2 className="font-semibold text-ink">{n.title}</h2>
                  {n.is_important && (
                    <span className="inline-flex items-center gap-1 text-xs text-bad font-semibold bg-bad/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={12} /> Important
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{n.body}</p>
                <p className="text-xs text-slate-400 mt-3">
                  {n.posted_by || "School office"} · {new Date(n.created_at).toLocaleDateString()}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
