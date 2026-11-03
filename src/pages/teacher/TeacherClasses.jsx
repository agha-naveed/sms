// What this teacher has been given: every class, section and subject,
// plus who teaches the other subjects in the same section.
import { useEffect, useState } from "react";
import { BookOpen, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import api, { errorText } from "../../api";
import { useAuth } from "../../auth.jsx";
import { Page, Card, Select, Field, Message, Loading, Empty } from "../../components/ui.jsx";
import Avatar from "../../components/Avatar.jsx";
import { SubjectsView } from "../../components/AccountViews.jsx";
import { ClassReport } from "../admin/AdminResults.jsx";

export default function TeacherClasses() {
  const { user } = useAuth();
  const [mine, setMine] = useState(null);
  const [picked, setPicked] = useState("");
  const [error, setError] = useState("");
  const [openKey, setOpenKey] = useState("");        // the section whose students are shown
  const [students, setStudents] = useState({});      // key -> list of students

  function toggleStudents(c) {
    const key = c.class_id + "-" + c.section_id;
    if (openKey === key) { setOpenKey(""); return; }

    setOpenKey(key);
    if (students[key]) return;

    api
      .get("/students", { params: { class_id: c.class_id, section_id: c.section_id } })
      .then(function (res) { setStudents(function (old) { return { ...old, [key]: res.data }; }); })
      .catch(function (err) { setError(errorText(err)); });
  }

  useEffect(function () {
    api
      .get("/teachers/my-classes")
      .then(function (res) {
        setMine(res.data);
        if (res.data.length > 0) {
          setPicked(res.data[0].class_id + "-" + res.data[0].section_id);
        }
      })
      .catch(function (err) { setError(errorText(err)); });
  }, []);

  if (error) return <Message type="error">{error}</Message>;
  if (!mine) return <Loading />;

  if (mine.length === 0) {
    return (
      <Page title="My classes">
        <Card>
          <Empty icon={BookOpen}>
            No class has been assigned to you yet. Ask the admin to assign your
            class, section and subjects.
          </Empty>
        </Card>
      </Page>
    );
  }

  const chosen = mine.find(function (c) {
    return c.class_id + "-" + c.section_id === picked;
  }) || mine[0];

  return (
    <Page
      title="My classes"
      subtitle={"You are assigned to " + mine.length + " section" + (mine.length === 1 ? "" : "s") + "."}
    >
      <Card title="Everything assigned to you" icon={BookOpen} className="mb-4">
        <div className="divide-y divide-slate-100">
          {mine.map(function (c) {
            return (
              <div key={c.class_id + "-" + c.section_id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {c.class_name} - Section {c.section_name}
                    </p>
                    <p className="text-sm text-slate-500">{c.student_count || 0} students</p>
                  </div>
                  {c.student_count > 0 && (
                    <button
                      type="button"
                      onClick={function () { toggleStudents(c); }}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-teal"
                    >
                      {openKey === c.class_id + "-" + c.section_id ? "Hide students" : "View students"}
                      {openKey === c.class_id + "-" + c.section_id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  )}
                </div>

                {openKey === c.class_id + "-" + c.section_id && (
                  <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {!students[openKey] && <li className="text-sm text-slate-400">Loading...</li>}
                    {(students[openKey] || []).map(function (s) {
                      return (
                        <li key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <Avatar name={s.name} photo={s.photo} size={24} />
                          {s.name}
                          <span className="text-xs text-slate-400">{s.admission_no}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {mine.length > 1 && (
        <Card className="mb-4">
          <Field label="Show subjects for">
            <Select
              value={picked}
              onChange={function (e) { setPicked(e.target.value); }}
              className="sm:w-72"
            >
              {mine.map(function (c) {
                const key = c.class_id + "-" + c.section_id;
                return (
                  <option key={key} value={key}>
                    {c.class_name} - Section {c.section_name}
                  </option>
                );
              })}
            </Select>
          </Field>
        </Card>
      )}

      <SubjectsView
        classId={chosen.class_id}
        sectionId={chosen.section_id}
        className={chosen.class_name}
        sectionName={chosen.section_name}
      />

      <p className="text-xs text-slate-400 mt-3">
        Signed in as {user.name}. Ask the admin if a subject here should belong to
        someone else.
      </p>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={18} className="text-brand-600" />
          <h2 className="text-lg font-semibold text-ink">Class result</h2>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Positions, pass and fail lists for a section you teach.
        </p>
        <ClassReport sections={mine} />
      </div>
    </Page>
  );
}
