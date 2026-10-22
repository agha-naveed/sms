import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, FileText, ClipboardCheck, ArrowRight, Star } from "lucide-react";
import api, { errorText } from "../../api";
import { Page, Card, Stat, Message, Loading, Empty, Pill } from "../../components/ui.jsx";

export default function TeacherHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    api
      .get("/dashboard")
      .then(function (res) { setData(res.data); })
      .catch(function (err) { setError(errorText(err)); });
  }, []);

  if (error) return <Message type="error">{error}</Message>;
  if (!data) return <Loading />;

  const c = data.counts;

  return (
    <Page title="Dashboard" subtitle="Your classes for today.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={BookOpen} label="Sections" value={c.sections} />
        <Stat icon={Users} label="Students" value={c.students} />
        <Stat icon={FileText} label="Assignments posted" value={c.assignments} />
        <Stat
          icon={ClipboardCheck}
          label="Attendance left today"
          value={c.pending_attendance}
          tone={c.pending_attendance > 0 ? "warn" : "good"}
        />
      </div>

      <Card title="Your classes" icon={BookOpen}>
        {data.classes.length === 0 ? (
          <Empty>No class has been assigned to you yet. Ask the admin to assign one.</Empty>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.classes.map(function (c) {
              return (
                <div
                  key={c.class_id + "-" + c.section_id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <p className="font-medium text-ink flex items-center gap-1.5">
                      {c.class_name} - Section {c.section_name}
                      {c.is_class_teacher && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-semibold">
                          <Star size={11} /> You're the class teacher
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">{c.student_count} students</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {c.attendance_done ? (
                      <Pill status="present" />
                    ) : c.is_class_teacher ? (
                      <span className="text-sm text-warn font-medium">Attendance not marked</span>
                    ) : (
                      <span className="text-sm text-slate-400">Not the class teacher</span>
                    )}
                    <Link to="/teacher/attendance" className="text-sm text-teal font-semibold inline-flex items-center gap-1">
                      {c.is_class_teacher ? (c.attendance_done ? "View" : "Mark attendance") : "View"} <ArrowRight size={13} />
                    </Link>
                    <Link to="/teacher/my-classes" className="text-sm text-teal font-semibold hidden sm:inline">
                      Subjects
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Page>
  );
}
