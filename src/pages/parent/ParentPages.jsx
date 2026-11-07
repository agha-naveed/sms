// Attendance, results, assignments and fees for a parent.
// If the parent has more than one child, a switcher appears at the top.
import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../auth.jsx";
import { Page, Card, Empty, Pill } from "../../components/ui.jsx";
import {
  ResultsView, FeesView, AssignmentsView, ClassTimetableView,
} from "../../components/SharedViews.jsx";
import { AttendanceReport } from "../../components/AttendanceReport.jsx";
import { SubjectsView } from "../../components/AccountViews.jsx";

const TITLES = {
  subjects: ["Subjects and teachers", "What your child studies and who teaches it."],
  timetable: ["Timetable", "Your child's weekly schedule, once the school publishes it."],
  attendance: ["Attendance", "Record by day, week or month."],
  results: ["Results", "Marks for every exam that has been published."],
  assignments: ["Assignments", "What the teacher has given the class."],
  fees: ["Fees", "Slips and balances. Payments are taken at the school office."],
};

export default function ParentPages() {
  const { view } = useParams();
  const { user } = useAuth();

  const children = user.children || [];
  // Start on a child who is still enrolled.
  const firstActive = children.find(function (c) { return c.status === "active"; }) || children[0];
  const [childId, setChildId] = useState(firstActive ? firstActive.id : null);

  // Every child has left the school: only the dashboard is open.
  if (user.parent_blocked) {
    return <Navigate to="/parent" replace />;
  }

  if (!TITLES[view]) {
    return <Navigate to="/parent" replace />;
  }

  if (children.length === 0) {
    return (
      <Page title={TITLES[view][0]}>
        <Card>
          <Empty>No child is linked to your account yet. Please contact the school office.</Empty>
        </Card>
      </Page>
    );
  }

  const child = children.find(function (c) { return c.id === childId; }) || children[0];

  return (
    <Page title={TITLES[view][0]} subtitle={TITLES[view][1]}>
      {children.length > 1 && (
        <div className="mb-5">
          <p className="text-sm font-medium text-ink mb-2">Choose a child</p>
          <div className="flex flex-wrap gap-2">
            {children.map(function (c) {
              const active = c.id === child.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={function () { setChildId(c.id); }}
                  className={
                    "text-left px-4 py-2.5 rounded-xl border transition-colors " +
                    (active
                      ? "bg-teal border-teal text-white"
                      : "bg-white border-slate-300 hover:border-slate-400")
                  }
                >
                  <span className="block font-semibold">{c.name}</span>
                  <span className={"block text-xs " + (active ? "text-white/80" : "text-slate-500")}>
                    {c.status === "active"
                      ? c.class_name + " - Section " + c.section_name + " · " + c.admission_no
                      : "Left the school · " + c.admission_no}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {children.length === 1 && child.status === "active" && (
        <p className="text-sm text-slate-500 mb-4">
          {child.name} · {child.class_name} - Section {child.section_name} · {child.admission_no}
        </p>
      )}

      {child.status !== "active" && (
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-ink">{child.name}</h3>
            <Pill status="left" />
          </div>
          <p className="text-sm text-slate-500">
            {child.name} has left the school, so there is nothing to show here. Choose another child, or
            contact the school office.
          </p>
        </Card>
      )}

      {child.status === "active" && view === "subjects" && (
        <SubjectsView
          classId={child.class_id}
          sectionId={child.section_id}
          className={child.class_name}
          sectionName={child.section_name}
        />
      )}
      {child.status === "active" && view === "timetable" && (
        <ClassTimetableView
          classId={child.class_id}
          sectionId={child.section_id}
          studentId={child.id}
          isParent={true}
        />
      )}
      {child.status === "active" && view === "attendance" && (
        <AttendanceReport
          role="parent"
          studentId={child.id}
          student={{
            name: child.name,
            parent_name: user.name,
            admission_no: child.admission_no,
            class_name: child.class_name,
            section_name: child.section_name,
          }}
        />
      )}
      {child.status === "active" && view === "results" && <ResultsView studentId={child.id} studentName={child.name} />}
      {child.status === "active" && view === "assignments" && (
        <AssignmentsView studentId={child.id} canSubmit={false} isParent={true} />
      )}
      {child.status === "active" && view === "fees" && <FeesView studentId={child.id} isParent={true} />}
    </Page>
  );
}
