// The parent's home screen. One card per child, plus the alerts that
// came from attendance, fees, results and important school notices.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Megaphone, ArrowRight, Users } from "lucide-react";
import { useAuth } from "../../auth.jsx";
import api, { errorText } from "../../api";
import { Page, Card, Pill, Message, Loading, Empty, money } from "../../components/ui.jsx";

export default function ParentHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");

  useEffect(function () {
    api
      .get("/dashboard")
      .then(function (res) { setData(res.data); })
      .catch(function (err) { setError(errorText(err)); });

    api
      .get("/notifications")
      .then(function (res) { setAlerts(res.data.items.slice(0, 5)); })
      .catch(function () {});

    api
      .get("/notices")
      .then(function (res) { setNotices(res.data.slice(0, 3)); })
      .catch(function () {});
  }, []);

  if (error) return <Message type="error">{error}</Message>;
  if (!data) return <Loading />;

  return (
    <Page title={"Hello, " + user.name.split(" ")[0]} subtitle="How your children are doing.">
      {data.children.length === 0 ? (
        <Card>
          <Empty icon={Users}>No child is linked to your account yet. Please contact the school office.</Empty>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {data.children.map(function (child) {
            return (
              <Card key={child.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-ink">{child.name}</h3>
                    <p className="text-sm text-slate-500">
                      {child.class_name} - Section {child.section_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Today</p>
                    <Pill status={child.today_status === "not marked" ? "leave" : child.today_status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">Attendance this month</p>
                    <p
                      className={
                        "text-2xl font-bold " +
                        (child.attendance.percentage >= 75 ? "text-good" : "text-warn")
                      }
                    >
                      {child.attendance.percentage}%
                    </p>
                    <p className="text-xs text-slate-400">
                      {child.attendance.absent} day
                      {child.attendance.absent === 1 ? "" : "s"} absent
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Fee due</p>
                    <p
                      className={
                        "text-2xl font-bold " +
                        (child.fees.due_amount > 0 ? "text-bad" : "text-good")
                      }
                    >
                      {money(child.fees.due_amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {child.fees.unpaid_slips} unpaid slip
                      {child.fees.unpaid_slips === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-slate-100 text-sm">
                  <Link to="/parent/attendance" className="text-teal font-semibold">Attendance</Link>
                  <Link to="/parent/results" className="text-teal font-semibold">Results</Link>
                  <Link to="/parent/assignments" className="text-teal font-semibold">Assignments</Link>
                  <Link to="/parent/fees" className="text-teal font-semibold">Fee slips</Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Recent alerts" icon={AlertTriangle}>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nothing yet. Absences, fee slips and results appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map(function (n) {
                return (
                  <div
                    key={n.id}
                    className={
                      "border-l-4 pl-3 " +
                      (n.type === "attendance" ? "border-bad" : "border-slate-300") +
                      (n.is_read ? " opacity-60" : "")
                    }
                  >
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                );
              })}
              <Link to="/notifications" className="text-sm text-teal font-semibold inline-flex items-center gap-1">
                See all alerts <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </Card>

        <Card title="From the school office" icon={Megaphone}>
          {notices.length === 0 ? (
            <p className="text-sm text-slate-500">No notices right now.</p>
          ) : (
            <div className="space-y-3">
              {notices.map(function (n) {
                return (
                  <div key={n.id}>
                    <p className="text-sm font-medium text-ink">
                      {n.title}
                      {n.is_important && <span className="text-bad text-xs ml-2 font-semibold">Important</span>}
                    </p>
                    <p className="text-xs text-slate-500">{n.body}</p>
                  </div>
                );
              })}
              <Link to="/notices" className="text-sm text-teal font-semibold inline-flex items-center gap-1">
                See all notices <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
