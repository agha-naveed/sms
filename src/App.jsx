import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Protected } from "./components/Layout.jsx";

import Login from "./pages/Login.jsx";
import Apply from "./pages/Apply.jsx";
import Landing from "./pages/Landing.jsx";
import ResultPortal from "./pages/ResultPortal.jsx";
import Notifications from "./pages/Notifications.jsx";
import Notices from "./pages/Notices.jsx";
import { MyAccount } from "./components/AccountViews.jsx";

import AdminHome from "./pages/admin/AdminHome.jsx";
import Admissions from "./pages/admin/Admissions.jsx";
import Students from "./pages/admin/Students.jsx";
import Teachers from "./pages/admin/Teachers.jsx";
import Parents from "./pages/admin/Parents.jsx";
import Classes from "./pages/admin/Classes.jsx";
import AdminFees from "./pages/admin/AdminFees.jsx";
import AdminResults from "./pages/admin/AdminResults.jsx";
import AdminAttendance from "./pages/admin/AdminAttendance.jsx";
import Holidays from "./pages/admin/Holidays.jsx";
import AdminNotices from "./pages/admin/AdminNotices.jsx";
import AdminTimetable from "./pages/admin/AdminTimetable.jsx";
import StaffAttendance from "./pages/admin/StaffAttendance.jsx";
import AuditLog from "./pages/admin/AuditLog.jsx";

import TeacherHome from "./pages/teacher/TeacherHome.jsx";
import MarkAttendance from "./pages/teacher/MarkAttendance.jsx";
import TeacherAssignments from "./pages/teacher/TeacherAssignments.jsx";
import TeacherResults from "./pages/teacher/TeacherResults.jsx";
import TeacherClasses from "./pages/teacher/TeacherClasses.jsx";
import TeacherTimetable from "./pages/teacher/TeacherTimetable.jsx";
import TeacherMyAttendance from "./pages/teacher/TeacherMyAttendance.jsx";

import StudentHome from "./pages/student/StudentHome.jsx";
import StudentPages from "./pages/student/StudentPages.jsx";

import ParentHome from "./pages/parent/ParentHome.jsx";
import ParentPages from "./pages/parent/ParentPages.jsx";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <p className="p-8 text-slate-500">Loading...</p>;
  }

  return (
    <Routes>
      {/* open to everyone */}
      <Route path="/login" element={<Login />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/check" element={<ResultPortal />} />

      {/* the public front page. Signed-in people get a link to their dashboard. */}
      <Route path="/" element={<Landing />} />

      {/* admin */}
      <Route path="/admin" element={<Protected roles={["admin"]}><AdminHome /></Protected>} />
      <Route path="/admin/admissions" element={<Protected roles={["admin"]}><Admissions /></Protected>} />
      <Route path="/admin/students" element={<Protected roles={["admin"]}><Students /></Protected>} />
      <Route path="/admin/teachers" element={<Protected roles={["admin"]}><Teachers /></Protected>} />
      <Route path="/admin/parents" element={<Protected roles={["admin"]}><Parents /></Protected>} />
      <Route path="/admin/classes" element={<Protected roles={["admin"]}><Classes /></Protected>} />
      <Route path="/admin/fees" element={<Protected roles={["admin"]}><AdminFees /></Protected>} />
      <Route path="/admin/attendance" element={<Protected roles={["admin"]}><AdminAttendance /></Protected>} />
      <Route path="/admin/holidays" element={<Protected roles={["admin"]}><Holidays /></Protected>} />
      <Route path="/admin/results" element={<Protected roles={["admin"]}><AdminResults /></Protected>} />
      <Route path="/admin/notices" element={<Protected roles={["admin"]}><AdminNotices /></Protected>} />
      <Route path="/admin/timetable" element={<Protected roles={["admin"]}><AdminTimetable /></Protected>} />
      <Route path="/admin/staff-attendance" element={<Protected roles={["admin"]}><StaffAttendance /></Protected>} />
      <Route path="/admin/audit-log" element={<Protected roles={["admin"]}><AuditLog /></Protected>} />

      {/* teacher */}
      <Route path="/teacher" element={<Protected roles={["teacher"]}><TeacherHome /></Protected>} />
      <Route path="/teacher/attendance" element={<Protected roles={["teacher"]}><MarkAttendance /></Protected>} />
      <Route path="/teacher/my-attendance" element={<Protected roles={["teacher"]}><TeacherMyAttendance /></Protected>} />
      <Route path="/teacher/assignments" element={<Protected roles={["teacher"]}><TeacherAssignments /></Protected>} />

      <Route path="/teacher/results" element={<Protected roles={["teacher"]}><TeacherResults /></Protected>} />
      <Route path="/teacher/my-classes" element={<Protected roles={["teacher"]}><TeacherClasses /></Protected>} />
      <Route path="/teacher/timetable" element={<Protected roles={["teacher"]}><TeacherTimetable /></Protected>} />

      {/* student */}
      <Route path="/student" element={<Protected roles={["student"]}><StudentHome /></Protected>} />
      <Route path="/student/:view" element={<Protected roles={["student"]}><StudentPages /></Protected>} />

      {/* parent */}
      <Route path="/parent" element={<Protected roles={["parent"]}><ParentHome /></Protected>} />
      <Route path="/parent/:view" element={<Protected roles={["parent"]}><ParentPages /></Protected>} />

      {/* everyone who is logged in */}
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/notices" element={<Protected><Notices /></Protected>} />
      {/* every role, the admin included, can edit their own details */}
      <Route path="/account" element={<Protected><MyAccount /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
