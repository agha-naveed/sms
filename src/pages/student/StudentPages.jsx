// One file handles the student's assignments, attendance, results and fees.
// The URL decides which view is shown: /student/attendance, /student/fees ...
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../auth.jsx";
import { Page, Card, Empty } from "../../components/ui.jsx";
import {
  ResultsView, FeesView, AssignmentsView, ClassTimetableView,
} from "../../components/SharedViews.jsx";
import { AttendanceReport } from "../../components/AttendanceReport.jsx";
import { SubjectsView } from "../../components/AccountViews.jsx";

const TITLES = {
  subjects: ["My subjects", "Your subjects and the teacher for each one."],
  timetable: ["Timetable", "Your weekly schedule, once the school publishes it."],
  assignments: ["Assignments", "Upload your work before the due date."],
  attendance: ["My attendance", "Your record by day, week or month."],
  results: ["My results", "Marks for every exam that has been published."],
  fees: ["Fees", "Your slips. Payments are taken at the school office."],
};

export default function StudentPages() {
  const { view } = useParams();
  const { user } = useAuth();

  if (!TITLES[view]) {
    return <Navigate to="/student" replace />;
  }

  const studentId = user.student ? user.student.id : null;

  if (!studentId) {
    return (
      <Page title={TITLES[view][0]}>
        <Card>
          <Empty>Your student record is not set up yet. Please contact the school office.</Empty>
        </Card>
      </Page>
    );
  }

  return (
    <Page title={TITLES[view][0]} subtitle={TITLES[view][1]}>
      {view === "subjects" && (
        <SubjectsView
          classId={user.student.class_id}
          sectionId={user.student.section_id}
          className={user.student.class_name}
          sectionName={user.student.section_name}
        />
      )}
      {view === "timetable" && (
        <ClassTimetableView
          classId={user.student.class_id}
          sectionId={user.student.section_id}
          studentId={studentId}
          isParent={false}
        />
      )}
      {view === "assignments" && <AssignmentsView studentId={studentId} canSubmit={true} />}
      {view === "attendance" && (
        <AttendanceReport
          role="student"
          studentId={studentId}
          student={{
            name: user.name,
            admission_no: user.student.admission_no,
            class_name: user.student.class_name,
            section_name: user.student.section_name,
          }}
        />
      )}
      {view === "results" && <ResultsView studentId={studentId} studentName={user.name} />}
      {view === "fees" && <FeesView studentId={studentId} isParent={false} />}
    </Page>
  );
}
