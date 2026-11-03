import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, UserPlus, Users, GraduationCap, Contact, BookOpen,
  ClipboardCheck, Trophy, Banknote, Megaphone, Bell, FileText, UserCircle,
  LogOut, Menu, X, Wallet, CalendarClock, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../auth.jsx";
import { SCHOOL, Crest } from "../school.jsx";
import api from "../api";
import Avatar from "./Avatar.jsx";


const MENUS = {
  admin: [
    { group: null, items: [
      { to: "/admin", label: "Dashboard", end: true, icon: LayoutDashboard },
    ] },
    { group: "People", items: [
      { to: "/admin/admissions", label: "Admissions", icon: UserPlus },
      { to: "/admin/students", label: "Students", icon: GraduationCap },
      { to: "/admin/teachers", label: "Teachers", icon: Users },
      { to: "/admin/parents", label: "Parents", icon: Contact },
    ] },
    { group: "Academics", items: [
      { to: "/admin/classes", label: "Classes & sections", icon: BookOpen },
      { to: "/admin/timetable", label: "Timetable", icon: CalendarClock },
      { to: "/admin/attendance", label: "Student attendance", icon: ClipboardCheck },
      { to: "/admin/staff-attendance", label: "Staff attendance", icon: Users },
      { to: "/admin/results", label: "Results", icon: Trophy },
    ] },
    { group: "Finance", items: [
      { to: "/admin/fees", label: "Fees", icon: Banknote },
    ] },
    { group: "Communication", items: [
      { to: "/admin/notices", label: "Notice board", icon: Megaphone },
    ] },
    { group: "Oversight", items: [
      { to: "/admin/audit-log", label: "Audit log", icon: ShieldCheck },
    ] },
  ],
  teacher: [
    { group: null, items: [
      { to: "/teacher", label: "Dashboard", end: true, icon: LayoutDashboard },
      { to: "/teacher/my-classes", label: "My classes", icon: BookOpen },
      { to: "/teacher/timetable", label: "My timetable", icon: CalendarClock },
      { to: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/teacher/my-attendance", label: "My attendance", icon: Users },
      { to: "/teacher/assignments", label: "Assignments", icon: FileText },
      { to: "/teacher/results", label: "Results", icon: Trophy },
    ] },
  ],
  student: [
    { group: null, items: [
      { to: "/student", label: "Dashboard", end: true, icon: LayoutDashboard },
      { to: "/student/subjects", label: "My subjects", icon: BookOpen },
      { to: "/student/timetable", label: "Timetable", icon: CalendarClock },
      { to: "/student/assignments", label: "Assignments", icon: FileText },
      { to: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/student/results", label: "Results", icon: Trophy },
      { to: "/student/fees", label: "Fees", icon: Wallet },
    ] },
  ],
  parent: [
    { group: null, items: [
      { to: "/parent", label: "Dashboard", end: true, icon: LayoutDashboard },
      { to: "/parent/subjects", label: "Subjects & teachers", icon: BookOpen },
      { to: "/parent/timetable", label: "Timetable", icon: CalendarClock },
      { to: "/parent/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/parent/results", label: "Results", icon: Trophy },
      { to: "/parent/assignments", label: "Assignments", icon: FileText },
      { to: "/parent/fees", label: "Fees", icon: Wallet },
    ] },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const [isClassTeacher, setIsClassTeacher] = useState(true);
  
  const groups = (MENUS[user.role] || []).map(function (g) {
    return {
      ...g,
      items: g.items.filter(function (item) {
        return !(item.to === "/teacher/attendance" && !isClassTeacher);
      }),
    };
  });

  useEffect(function () {
    let stop = false;

    function load() {
      api.get("/notifications").then(function (res) {
        if (!stop) setUnread(res.data.unread);
      }).catch(function () {});

      if (user.role === "teacher") {
        api.get("/teachers/my-class-teacher-sections").then(function (res) {
          setIsClassTeacher(res.data.length > 0);
        }).catch(function () {});
      }
    }

    load();
    const timer = setInterval(load, 30000);
    return function () { stop = true; clearInterval(timer); };
  }, [user.role]);

  function signOut() {
    logout();
    navigate("/login");
  }

  function itemClass({ isActive }) {
    return (
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-colors " +
      (isActive
        ? "bg-white/12 text-white"
        : "text-white/65 hover:text-white hover:bg-white/8")
    );
  }


  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      {/* Top bar on phones */}
      <header className="md:hidden bg-ink text-white flex items-center justify-between px-4 py-3 no-print sticky top-0 z-30">
        <Link to={"/" + user.role} className="flex items-center gap-2 font-semibold">
          <Crest className="w-6 h-6" />
          {SCHOOL.shortName}
        </Link>
        <button
          onClick={function () { setMenuOpen(!menuOpen); }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={
          "bg-ink text-white w-full md:w-64 max-h-screen sticky top-0 overflow-hidden shrink-0 md:min-h-screen p-4 no-print flex flex-col " +
          (menuOpen ? "block" : "hidden md:flex")
        }
      >
        <div className="hidden md:flex items-center gap-2.5 mb-6 px-1">
          <Crest className="w-8 h-8" />
          <div className="leading-tight">
            <p className="font-bold text-[0.95rem]">{SCHOOL.shortName}</p>
            <p className="text-white/45 text-xs capitalize">{user.role} account</p>
          </div>
        </div>

        <nav className="space-y-4 flex-1 overflow-y-auto thin-scroll">
          {groups.map(function (g, gi) {
            return (
              <div key={gi}>
                {g.group && (
                  <p className="px-3 text-[0.7rem] font-bold uppercase tracking-wider text-white/35 mb-1.5">
                    {g.group}
                  </p>
                )}
                <div className="space-y-1">
                  {g.items.map(function (item) {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={itemClass}
                        onClick={function () { setMenuOpen(false); }}
                      >
                        <Icon size={18} className="shrink-0" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="pt-3 border-t border-white/10 space-y-1">
            <NavLink to="/notifications" className={itemClass} onClick={function () { setMenuOpen(false); }}>
              <Bell size={18} className="shrink-0" />
              Notifications
              {unread > 0 && (
                <span className="ml-auto bg-bad text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {unread}
                </span>
              )}
            </NavLink>

            <NavLink to="/notices" className={itemClass} onClick={function () { setMenuOpen(false); }}>
              <FileText size={18} className="shrink-0" />
              Notices
            </NavLink>

            <NavLink to="/account" className={itemClass} onClick={function () { setMenuOpen(false); }}>
              <UserCircle size={18} className="shrink-0" />
              My account
            </NavLink>
          </div>
        </nav>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
          <Avatar name={user.name} photo={user.photo} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{user.name}</p>
            <p className="text-xs text-white/45 truncate">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 shrink-0"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full">{children}</main>
    </div>
  );
}

// Wraps a page so only the right roles can open it.
export function Protected({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm gap-2">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <RedirectTo to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Layout>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md">
          <h1 className="text-lg font-semibold text-ink">This page is not part of your account</h1>
          <p className="text-sm text-slate-500 mt-2">
            Your account is a {user.role} account. Go back to{" "}
            <Link to={"/" + user.role} className="text-teal underline font-medium">
              your dashboard
            </Link>
            .
          </p>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

function RedirectTo({ to }) {
  const navigate = useNavigate();
  useEffect(function () { navigate(to, { replace: true }); }, [to, navigate]);
  return null;
}
