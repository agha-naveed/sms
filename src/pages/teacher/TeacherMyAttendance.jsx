import { useEffect, useState } from "react";
import { Users, CheckCircle2, XCircle, CalendarOff, Percent, Clock3 } from "lucide-react";
import api, { errorText } from "../../api";
import { Page, Card, Table, Select, Input, Field, Stat, Message, Loading, Empty } from "../../components/ui.jsx";

export default function TeacherMyAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState("month");
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    function () {
      setData(null);
      api
        .get("/teacher-attendance/report", { params: { period, date } })
        .then(function (res) { setData(res.data); })
        .catch(function (err) { setError(errorText(err)); });
    },
    [period, date]
  );

  if (error) return <Message type="error">{error}</Message>;

  return (
    <Page title="My attendance" subtitle="Marked by the school office. Contact them if something looks wrong.">
      <Card className="mb-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Report for">
            <Select value={period} onChange={function (e) { setPeriod(e.target.value); }}>
              <option value="day">One day</option>
              <option value="week">One week</option>
              <option value="month">One month</option>
            </Select>
          </Field>
          <Field label="Any date inside the period">
            <Input type="date" value={date} max={today} onChange={function (e) { setDate(e.target.value); }} />
          </Field>
        </div>
      </Card>

      {!data ? (
        <Loading />
      ) : data.summary.marked === 0 ? (
        <Card><Empty icon={Users}>Nothing marked for you in this period.</Empty></Card>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-3">{data.label}</p>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <Stat icon={CheckCircle2} label="Present" value={data.summary.present} tone="good" />
            <Stat icon={Clock3} label="Late" value={data.summary.late} tone="warn" />
            <Stat icon={XCircle} label="Absent" value={data.summary.absent} tone="bad" />
            <Stat icon={CalendarOff} label="Leave" value={data.summary.on_leave} />
            <Stat icon={Percent} label="Attendance" value={data.summary.percentage + "%"} tone={data.summary.percentage >= 90 ? "good" : "warn"} />
          </div>

          <Card title="Day by day">
            <Table head={["Date", "Status"]}>
              {data.by_day.map(function (d) {
                const status = d.present > 0 ? "Present" : d.late > 0 ? "Late" : d.absent > 0 ? "Absent" : "Leave";
                return (
                  <tr key={d.date}>
                    <td className="py-2.5 pr-4">{new Date(d.date).toLocaleDateString()}</td>
                    <td className={"py-2.5 pr-4 " + (status === "Present" ? "text-good" : status === "Late" ? "text-warn" : status === "Absent" ? "text-bad" : "text-slate-500")}>
                      {status}
                    </td>
                  </tr>
                );
              })}
            </Table>
          </Card>
        </>
      )}
    </Page>
  );
}
