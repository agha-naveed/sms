// The two documents the school hands out on paper.
//
//   FeeVoucher  three copies on one page: student, school office, bank
//   ReportCard  one exam, laid out like a real report card
//
// Both print through the browser. Press the button, then choose "Save as PDF"
// in the print window to keep a file.
import { SCHOOL, Crest } from "../school.jsx";
import { Button, money } from "./ui.jsx";

// ------------------------------------------------------------------
// FEE VOUCHER
// ------------------------------------------------------------------
const COPIES = [
  { name: "Student Copy", note: "Keep this after paying." },
  { name: "Admin Copy", note: "Return this to the school office." },
  { name: "Bank Copy", note: "The bank keeps this." },
];

// The masthead every printed document carries.
export function PrintHeader({ title, subtitle, right, compact }) {
  return (
    <div className="flex justify-between items-start border-b-2 border-ink pb-3">
      <div className="flex items-center gap-3">
        <Crest className={(compact ? "w-10 h-10" : "w-14 h-14") + " text-ink shrink-0"} />
        <div className="leading-tight">
          <h2 className={(compact ? "text-sm" : "text-lg") + " font-semibold text-ink"}>
            {SCHOOL.name}
          </h2>
          <p className="text-xs text-slate-500">{SCHOOL.address}</p>
          <p className="text-xs text-slate-500">{SCHOOL.phone} · {SCHOOL.email}</p>
        </div>
      </div>

      <div className="text-right leading-tight">
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        {subtitle && <p className="font-semibold text-ink">{subtitle}</p>}
        {right}
      </div>
    </div>
  );
}

// A labelled row of facts about one student, used on printed documents.
export function StudentStrip({ student, extra }) {
  if (!student) return null;

  return (
    <dl className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm py-3 border-b border-slate-200">
      <Item label="Student" value={student.name} />
      <Item label="Father / guardian" value={student.parent_name || "-"} />
      <Item label="Registration no" value={student.admission_no} />
      <Item
        label="Class"
        value={(student.class_name || "-") + (student.section_name ? " - " + student.section_name : "")}
      />
      {extra || <Item label="Date issued" value={new Date().toLocaleDateString()} />}
    </dl>
  );
}

export function FeeSlip({ slip, onBack }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        {onBack && <Button variant="plain" onClick={onBack}>Back to list</Button>}
        <Button onClick={function () { window.print(); }}>Download / print voucher</Button>
        <span className="text-sm text-slate-500 self-center">
          Three copies print on one page: student, school and bank.
        </span>
      </div>

      <div className="print-area space-y-4 print:space-y-0">
        {COPIES.map(function (copy) {
          return <Voucher key={copy.name} slip={slip} copy={copy} />;
        })}
      </div>
    </div>
  );
}

function Voucher({ slip, copy }) {
  return (
    <section className="bg-white border border-slate-300 rounded-lg p-4 print:rounded-none print:break-inside-avoid print:border-dashed print:mb-2">
      {/* header */}
      <div className="flex justify-between items-start border-b-2 border-ink pb-2">
        <div className="flex items-center gap-2">
          <Crest className="w-10 h-10 text-ink shrink-0" />
          <div className="leading-tight">
            <h2 className="font-semibold text-ink text-sm">{SCHOOL.name}</h2>
            <p className="text-[10px] text-slate-500">{SCHOOL.address}</p>
            <p className="text-[10px] text-slate-500">{SCHOOL.phone}</p>
          </div>
        </div>

        <div className="text-right leading-tight">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{copy.name}</p>
          <p className="font-semibold text-ink text-sm">{slip.slip_no}</p>
          <p className="text-[10px] text-slate-500">{slip.month_name}</p>
          {slip.is_overdue && <p className="text-[10px] text-bad font-medium">Overdue</p>}
        </div>
      </div>

      {/* who it is for */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs py-3 border-b border-slate-200">
        <Item label="Student" value={slip.student_name} />
        <Item label="Father / guardian" value={slip.parent_name || "-"} />
        <Item label="Registration no" value={slip.admission_no} />
        <Item
          label="Class"
          value={(slip.class_name || "-") + (slip.section_name ? " - " + slip.section_name : "")}
        />
        <Item label="Months covered" value={slip.months_count} />
      </div>

      {/* the money */}
      <div className="grid grid-cols-2 gap-x-6 py-2">
        <table className="text-xs w-full">
          <tbody>
            <Line label="Tuition fee" value={slip.tuition_fee} />
            <Line label="Other charges" value={slip.other_fee} />
            {slip.discount > 0 && <Line label="Discount" value={-slip.discount} />}
            <Line
              label={
                slip.days_overdue > 0
                  ? "Late fee (" + slip.days_overdue + " day" +
                    (slip.days_overdue === 1 ? "" : "s") + ")"
                  : "Late fee"
              }
              value={slip.late_fee}
              warn={slip.late_fee > 0}
            />
          </tbody>
        </table>

        <table className="text-xs w-full">
          <tbody>
            <tr className="border-b-2 border-slate-300">
              <td className="py-1 font-semibold">Total payable</td>
              <td className="py-1 text-right font-semibold">{money(slip.total)}</td>
            </tr>
            <Line label="Already paid" value={slip.paid_amount} />
            <tr>
              <td className="py-1 font-semibold">Amount due</td>
              <td
                className={
                  "py-1 text-right font-semibold " +
                  (slip.balance > 0 ? "text-bad" : "text-good")
                }
              >
                {money(slip.balance)}
              </td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">Pay before</td>
              <td className="py-1 text-right">
                {new Date(slip.due_date).toLocaleDateString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* footer */}
      <div className="flex justify-between items-end border-t border-slate-200 pt-2 mt-1">
        <p className="text-[10px] text-slate-500 max-w-xs">
          {copy.note} A late fee is added for every day after the due date.
          Office hours {SCHOOL.hours}.
        </p>

        <div className="flex gap-8 text-[10px] text-slate-400">
          <span className="border-t border-slate-400 pt-1 px-4">Depositor</span>
          <span className="border-t border-slate-400 pt-1 px-4">Received by</span>
        </div>
      </div>
    </section>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <p className="text-slate-500 text-[10px]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Line({ label, value, warn }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1">{label}</td>
      <td className={"py-1 text-right " + (warn ? "text-bad" : "")}>{money(value)}</td>
    </tr>
  );
}

// ------------------------------------------------------------------
// REPORT CARD
// ------------------------------------------------------------------
export function ReportCard({ exam, student }) {
  return (
    <section className="bg-white border border-slate-300 rounded-lg p-6 print:rounded-none print:break-inside-avoid print:mb-6">
      <PrintHeader title="Report card" subtitle={exam.exam_name} />
      <StudentStrip student={student} />

      {/* marks */}
      <table className="w-full text-sm my-4">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2 font-medium">Subject</th>
            <th className="py-2 font-medium text-right">Total marks</th>
            <th className="py-2 font-medium text-right">Obtained</th>
            <th className="py-2 font-medium text-right">Percent</th>
            <th className="py-2 font-medium text-right">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {exam.subjects.map(function (sub) {
            const percent = Math.round((sub.obtained_marks / sub.total_marks) * 100);
            return (
              <tr key={sub.subject_name} className={sub.passed === false ? "text-bad" : ""}>
                <td className="py-2">{sub.subject_name}</td>
                <td className="py-2 text-right text-slate-500">{sub.total_marks}</td>
                <td className="py-2 text-right font-medium">{sub.obtained_marks}</td>
                <td className="py-2 text-right">{percent}%</td>
                <td className="py-2 text-right font-medium">{sub.grade}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 font-semibold">
            <td className="py-2">Total</td>
            <td className="py-2 text-right">{exam.total}</td>
            <td className="py-2 text-right">{exam.obtained}</td>
            <td className="py-2 text-right">{exam.percentage}%</td>
            <td className="py-2 text-right">{exam.grade}</td>
          </tr>
        </tfoot>
      </table>

      {/* verdict */}
      <div className="flex flex-wrap gap-6 text-sm border-t border-slate-200 pt-3">
        <span>
          Percentage: <strong>{exam.percentage}%</strong>
        </span>
        <span>
          Grade: <strong>{exam.grade}</strong>
        </span>
        <span className={exam.status === "Pass" ? "text-good" : "text-bad"}>
          Result: <strong>{exam.status}</strong>
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        A student passes with 40 percent overall and 40 percent in every subject.
        Grades: A+ 80, A 70, B 60, C 50, D 40, F below 40.
      </p>

      <div className="flex justify-between text-xs text-slate-400 mt-10 pt-8">
        <span className="border-t border-slate-400 pt-1 px-6">Class teacher</span>
        <span className="border-t border-slate-400 pt-1 px-6">Parent signature</span>
        <span className="border-t border-slate-400 pt-1 px-6">Principal</span>
      </div>
    </section>
  );
}
