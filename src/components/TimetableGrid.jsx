// One table: periods down the side, days across the top. Used four ways:
//   - admin, editing a class's grid (editable, cells are buttons)
//   - student/parent, reading their class's grid (read-only)
//   - teacher, reading their own personal grid, built from every class
//     they teach (read-only, cells show which class instead of a teacher)
import { Plus } from "lucide-react";

function to12Hour(hhmm) {
  const parts = String(hhmm).split(":");
  let hour = Number(parts[0]);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return hour + ":" + parts[1] + " " + suffix;
}

// slots is a plain object keyed "day-periodId" -> cell data (or undefined
// for a free period). renderCell(cell) returns the JSX for a filled cell.
export function TimetableGrid({ periods, days, slots, editable, onCellClick, renderCell }) {
  if (periods.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">No periods have been set up yet.</p>;
  }

  return (
    <div className="overflow-x-auto thin-scroll -mx-1">
      <table className="w-full text-sm min-w-[640px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3 w-28">Period</th>
            {days.map(function (d) {
              return (
                <th key={d.value} className="text-left text-xs font-semibold text-slate-500 pb-2 px-1.5">
                  {d.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {periods.map(function (p) {
            // A break runs across the whole day: no boxes to fill or click.
            if (p.kind === "break") {
              return (
                <tr key={p.id}>
                  <td className="align-middle pr-3 py-1.5">
                    <div className="text-xs font-semibold text-slate-500">{p.label}</div>
                    <div className="text-[0.7rem] text-slate-400">
                      {to12Hour(p.start_time)} - {to12Hour(p.end_time)}
                    </div>
                  </td>
                  <td colSpan={days.length} className="p-1">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 text-center text-xs font-semibold text-amber-700 py-2 tracking-wide">
                      {p.label}
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={p.id}>
                <td className="align-top pr-3 py-1.5">
                  <div className="text-xs font-semibold text-ink">{p.label}</div>
                  <div className="text-[0.7rem] text-slate-400">
                    {to12Hour(p.start_time)} - {to12Hour(p.end_time)}
                  </div>
                </td>

                {days.map(function (d) {
                  const key = d.value + "-" + p.id;
                  const cell = slots[key];

                  if (editable) {
                    return (
                      <td key={key} className="p-1 align-top">
                        <button
                          type="button"
                          onClick={function () { onCellClick(d, p, cell); }}
                          className={
                            "w-full min-h-[3.25rem] rounded-lg border text-left px-2 py-1.5 transition-colors " +
                            (cell
                              ? "bg-brand-50 border-brand-200 hover:border-teal"
                              : "bg-white border-dashed border-slate-300 hover:border-teal hover:bg-slate-50")
                          }
                        >
                          {cell ? (
                            <>
                              <span className="block text-xs font-semibold text-ink truncate">
                                {cell.subject_name || "(no subject)"}
                              </span>
                              <span className="block text-[0.7rem] text-slate-500 truncate">
                                {cell.teacher_name || "No teacher"}
                              </span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Plus size={12} /> Add
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  }

                  return (
                    <td key={key} className="p-1 align-top">
                      <div className={"min-h-[3.25rem] border justify-items-center grid place-content-center rounded-lg text-center px-2 py-1.5 " + (cell ? "bg-brand-50" : "bg-slate-50")}>
                        {cell ? renderCell(cell) :<span className="opacity-0 text-xs">Free period</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
