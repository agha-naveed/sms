import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import api, { errorText } from "../../api";
import { Page, Card, Message, Loading, Empty } from "../../components/ui.jsx";
import { TimetableGrid } from "../../components/TimetableGrid.jsx";

export default function TeacherTimetable() {
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    api.get("/timetable/my").then(function (res) { setGrid(res.data); }).catch(function (err) { setError(errorText(err)); });
  }, []);

  if (error) return <Message type="error">{error}</Message>;
  if (!grid) return <Loading />;

  const hasAny = Object.keys(grid.slots).length > 0;

  return (
    <Page title="My timetable" subtitle="Every period you teach, across every class. Only published classes appear here.">
      <Card icon={CalendarClock}>
        {!hasAny ? (
          <Empty>
            Nothing to show yet. Either you haven't been placed in a timetable, or the
            admin hasn't published your classes' timetables yet.
          </Empty>
        ) : (
          <TimetableGrid
            periods={grid.periods}
            days={grid.days}
            slots={grid.slots}
            renderCell={function (cell) {
              return (
                <>
                  <span className="block text-xs font-semibold text-ink truncate">
                    {cell.class_name} - {cell.section_name}
                  </span>
                  <span className="block text-[0.7rem] text-slate-500 truncate">
                    {cell.subject_name || "General"}
                  </span>
                </>
              );
            }}
          />
        )}
      </Card>
    </Page>
  );
}
