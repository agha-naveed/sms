import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, ClipboardCheck, Trophy, Wallet, ArrowRight, Megaphone,
} from "lucide-react";
import { useAuth } from "../../auth.jsx";
import api, { errorText } from "../../api";
import { Page, Card, Stat, Message, Loading, money } from "../../components/ui.jsx";

export default function StudentHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");

  useEffect(function () {
    api
      .get("/dashboard")
      .then(function (res) { setData(res.data); })
      .catch(function (err) { setError(errorText(err)); });

    api.get("/notices").then(function (res) { setNotices(res.data.slice(0, 3)); }).catch(function () {});
  }, []);

  if (error) return <Message type="error">{error}</Message>;
  if (!data) return <Loading />;

  const s = user.student;

  return (
    <Page
      title={"Hello, " + user.name.split(" ")[0]}
      subtitle={
        s
          ? s.class_name + " - Section " + s.section_name +
            " · Registration " + s.admission_no
          : "Your class has not been set yet."
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat
          icon={ClipboardCheck}
          label="Attendance this month"
          value={data.attendance.percentage + "%"}
          tone={data.attendance.percentage >= 75 ? "good" : "warn"}
          hint={data.attendance.present + " of " + data.attendance.total + " days"}
        />
        <Stat icon={FileText} label="Assignments" value={data.assignments.total} />
        <Stat
          icon={FileText}
          label="Not handed in"
          value={data.assignments.not_submitted}
          tone={data.assignments.not_submitted > 0 ? "warn" : "good"}
        />
        <Stat
          icon={Wallet}
          label="Fee due"
          value={money(data.fees.due_amount)}
          tone={data.fees.due_amount > 0 ? "bad" : "good"}
          hint={data.fees.unpaid_slips + " unpaid slips"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Go to">
          <div className="space-y-1">
            <GoLink to="/student/assignments" icon={FileText} label="Assignments and uploads" />
            <GoLink to="/student/attendance" icon={ClipboardCheck} label="My attendance record" />
            <GoLink to="/student/results" icon={Trophy} label="My results" />
            <GoLink to="/student/fees" icon={Wallet} label="Fee slips" />
          </div>
        </Card>

        <Card title="Latest notices" icon={Megaphone}>
          {notices.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing new from the school office.</p>
          ) : (
            <div className="space-y-3">
              {notices.map(function (n) {
                return (
                  <div key={n.id}>
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.body}</p>
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

function GoLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-sm text-ink hover:text-teal py-1.5 group">
      <Icon size={15} className="text-slate-400 group-hover:text-teal" />
      {label}
      <ArrowRight size={13} className="ml-auto text-slate-300 group-hover:text-teal" />
    </Link>
  );
}
