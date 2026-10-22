// What this teacher has been given: every class, section and subject,
// plus who teaches the other subjects in the same section.
import { useEffect, useState } from "react";
import { BookOpen, Trophy } from "lucide-react";
import api, { errorText } from "../../api";
import { useAuth } from "../../auth.jsx";
import { Page, Card, Select, Field, Message, Loading, Empty } from "../../components/ui.jsx";
import { SubjectsView } from "../../components/AccountViews.jsx";
import { ClassReport } from "../admin/AdminResults.jsx";

export default function TeacherClasses() {
  const { user } = useAuth();
  const [mine, setMine] = useState(null);
  const [picked, setPicked] = useState("");
  const [error, setError] = useState("");

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
                <p className="font-medium text-ink">
                  {c.class_name} - Section {c.section_name}
                </p>
                <p className="text-sm text-slate-500">{c.student_count || 0} students</p>
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
