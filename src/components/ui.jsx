// Small building blocks used across the app, so pages stay short and the
// whole app looks and behaves the same way everywhere.
//
// Design goals (this is the "easy to use" pass over the whole app):
//   - Big, obvious touch targets. A parent on an old phone should never
//     have to zoom in to tap the right thing.
//   - Every status is shown with an icon AND a word AND a colour, never
//     colour alone, so it still reads correctly for colour-blind users
//     and in black-and-white print.
//   - Plain language, short sentences, and a visible next step on every
//     screen (what do I do now?).
//   - Confirmation before anything that cannot be undone.
import {
  Loader2, Inbox, AlertTriangle, CheckCircle2, Info, X, ChevronLeft,
  ArrowRight,
} from "lucide-react";

// ------------------------------------------------------------------
// PAGE / SECTION LAYOUT
// ------------------------------------------------------------------
export function Page({ title, subtitle, action, back, children }) {
  return (
    <div>
      {back && (
        <button
          onClick={back.onClick}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink mb-3 -ml-1 px-1 py-0.5 rounded"
        >
          <ChevronLeft size={16} /> {back.label || "Back"}
        </button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-[1.7rem] font-bold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-[0.95rem] text-slate-500 mt-1.5 max-w-2xl">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, description, icon: Icon, children, className = "", action }) {
  return (
    <section className={"bg-white border border-slate-200 rounded-2xl shadow-soft " + className}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            {Icon && (
              <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icon size={17} />
              </span>
            )}
            <div>
              {title && <h2 className="font-semibold text-ink leading-tight">{title}</h2>}
              {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

// ------------------------------------------------------------------
// STATS
// ------------------------------------------------------------------
export function Stat({ label, value, tone = "ink", hint, icon: Icon }) {
  const tones = {
    ink: "text-ink",
    good: "text-good",
    bad: "text-bad",
    warn: "text-warn",
  };
  const chips = {
    ink: "bg-slate-100 text-slate-500",
    good: "bg-good/10 text-good",
    bad: "bg-bad/10 text-bad",
    warn: "bg-warn/10 text-warn",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <span className={"w-7 h-7 rounded-lg flex items-center justify-center shrink-0 " + chips[tone]}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className={"text-[1.9rem] font-bold mt-1 leading-none " + tones[tone]}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-2">{hint}</p>}
    </div>
  );
}

// ------------------------------------------------------------------
// BUTTONS
// ------------------------------------------------------------------
export function Button({ variant = "primary", size = "md", icon: Icon, loading, className = "", children, ...props }) {
  const styles = {
    primary: "bg-teal text-white hover:bg-brand-600 shadow-sm shadow-brand-600/20",
    plain: "bg-white text-ink border border-slate-300 hover:bg-slate-50",
    subtle: "bg-slate-100 text-ink hover:bg-slate-200",
    danger: "bg-bad text-white hover:bg-bad/90",
    good: "bg-good text-white hover:bg-good/90",
    ghost: "text-teal hover:bg-brand-50",
  };
  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2",
  };
  return (
    <button
      type="button"
      className={
        "inline-flex items-center justify-center rounded-xl font-semibold transition-colors " +
        "disabled:opacity-50 disabled:cursor-not-allowed " +
        sizes[size] + " " + styles[variant] + " " + className
      }
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

// ------------------------------------------------------------------
// FORM CONTROLS
// ------------------------------------------------------------------
export function Field({ label, hint, required, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-bad">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-slate-400 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-bad mt-1.5">{error}</span>}
    </label>
  );
}

const inputStyle =
  "w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-[0.95rem] bg-white " +
  "focus:border-teal focus:ring-4 focus:ring-brand-100 outline-none transition-shadow " +
  "placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export function Input({ className = "", ...props }) {
  return <input className={inputStyle + " " + className} {...props} />;
}

export function Select({ className = "", ...props }) {
  return <select className={inputStyle + " pr-8 " + className} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return <textarea rows={3} className={inputStyle + " " + className} {...props} />;
}

// A plain, big file picker. Used for documents, worksheets and photos.
export function FileInput({ hint, ...props }) {
  return (
    <div>
      <input
        type="file"
        className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl
                   file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold
                   hover:file:bg-brand-100 border border-dashed border-slate-300 rounded-xl p-3"
        {...props}
      />
      {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
    </div>
  );
}

// Phone box that always shows +92 and only accepts the 10 digits after it.
export function PhoneInput({ value, onChange, ...props }) {
  const digits = String(value || "").replace(/\D/g, "").replace(/^92/, "").slice(0, 10);

  function handle(e) {
    const next = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(next === "" ? "" : "+92" + next);
  }

  return (
    <div className="flex">
      <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-sm text-slate-600 font-medium">
        +92
      </span>
      <input
        className={inputStyle + " rounded-l-none"}
        inputMode="numeric"
        placeholder="3001234567"
        value={digits}
        onChange={handle}
        {...props}
      />
    </div>
  );
}

// CNIC box that puts the dashes in as you type: 35202-1234567-1
export function CnicInput({ value, onChange, ...props }) {
  function handle(e) {
    const d = e.target.value.replace(/\D/g, "").slice(0, 13);
    let out = d.slice(0, 5);
    if (d.length > 5) out = out + "-" + d.slice(5, 12);
    if (d.length > 12) out = out + "-" + d.slice(12);
    onChange(out);
  }

  return (
    <input
      className={inputStyle}
      inputMode="numeric"
      placeholder="35202-1234567-1"
      value={value || ""}
      onChange={handle}
      {...props}
    />
  );
}

// A big on/off button, used for picking sections, subjects, filters etc.
export function Chip({ label, active, onClick, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "px-3.5 py-2 text-sm font-medium rounded-xl border transition-colors " +
        (active
          ? "bg-teal text-white border-teal"
          : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50")
      }
      {...props}
    >
      {label}
    </button>
  );
}

// ------------------------------------------------------------------
// STATUS
// ------------------------------------------------------------------
// Colour, an icon-dot, AND a word together carry the meaning, never colour
// alone — that way it still makes sense in print and for colour-blind
// readers.
const STATUS_MAP = {
  present: { tone: "good", label: "Present" },
  paid: { tone: "good", label: "Paid" },
  submitted: { tone: "good", label: "Submitted" },
  approved: { tone: "good", label: "Approved" },
  absent: { tone: "bad", label: "Absent" },
  rejected: { tone: "bad", label: "Rejected" },
  overdue: { tone: "bad", label: "Overdue" },
  unpaid: { tone: "warn", label: "Unpaid" },
  partial: { tone: "warn", label: "Part paid" },
  pending: { tone: "warn", label: "Pending" },
  used: { tone: "good", label: "Used" },
  leave: { tone: "slate", label: "Leave" },
  "not marked": { tone: "slate", label: "Not marked" },
};

export function Pill({ status }) {
  const info = STATUS_MAP[status] || { tone: "slate", label: status };
  const tones = {
    good: "bg-good/10 text-good",
    bad: "bg-bad/10 text-bad",
    warn: "bg-warn/10 text-warn",
    slate: "bg-slate-100 text-slate-600",
  };
  const dots = { good: "bg-good", bad: "bg-bad", warn: "bg-warn", slate: "bg-slate-400" };
  return (
    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold " + tones[info.tone]}>
      <span className={"w-1.5 h-1.5 rounded-full " + dots[info.tone]} />
      {info.label}
    </span>
  );
}

// ------------------------------------------------------------------
// TABLE
// ------------------------------------------------------------------
export function Table({ head, children, compact }) {
  return (
    <div className="overflow-x-auto -mx-1 thin-scroll">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            {head.map(function (h) {
              return (
                <th key={h} className={"px-1 font-semibold whitespace-nowrap " + (compact ? "py-1.5" : "py-2.5")}>
                  {h}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 [&_td]:px-1 [&_td]:align-middle [&_tr]:hover:bg-slate-50/70">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------
// EMPTY / LOADING / MESSAGE
// ------------------------------------------------------------------
export function Empty({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Icon size={22} />
      </div>
      {title && <p className="font-medium text-ink mb-1">{title}</p>}
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Message({ type = "info", children, onClose }) {
  if (!children) return null;

  const styles = {
    error: "bg-bad/5 text-bad border-bad/20",
    success: "bg-good/5 text-good border-good/20",
    info: "bg-brand-50 text-brand-700 border-brand-200",
  };
  const icons = { error: AlertTriangle, success: CheckCircle2, info: Info };
  const Icon = icons[type];

  return (
    <div className={"border rounded-xl px-4 py-3 text-sm mb-4 flex items-start gap-2.5 " + styles[type]}>
      <Icon size={17} className="shrink-0 mt-0.5" />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Close" className="shrink-0 opacity-60 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function Loading({ label = "Loading..." }) {
  return (
    <div className="flex items-center w-full h-screen justify-center gap-2.5 text-sm text-slate-500 py-8">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

// ------------------------------------------------------------------
// CONFIRM DIALOG — used before anything that cannot be undone
// ------------------------------------------------------------------
export function Confirm({ open, title, body, confirmLabel = "Yes, continue", danger, busy, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-popover max-w-sm w-full p-5">
        <div className="flex items-start gap-3">
          <span className={"w-9 h-9 rounded-full flex items-center justify-center shrink-0 " + (danger ? "bg-bad/10 text-bad" : "bg-brand-50 text-brand-600")}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            {body && <p className="text-sm text-slate-500 mt-1">{body}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Button variant="plain" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button autoFocus variant={danger ? "danger" : "primary"} loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// TABS — replaces the one-off tab buttons different pages used to build
// ------------------------------------------------------------------
export function Tabs({ items, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-0">
      {items.map(function (t) {
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            onClick={function () { onChange(t.value); }}
            className={
              "px-4 py-2.5 text-sm font-semibold rounded-t-lg -mb-px border-b-2 transition-colors " +
              (isActive
                ? "border-teal text-teal"
                : "border-transparent text-slate-500 hover:text-ink")
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------
// STEPS — a small numbered progress strip for multi-part forms
// ------------------------------------------------------------------
export function Steps({ items, active }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {items.map(function (label, i) {
        const n = i + 1;
        const isActive = n === active;
        const done = n < active;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={
                "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 " +
                (done ? "bg-good text-white" : isActive ? "bg-teal text-white" : "bg-slate-100 text-slate-400")
              }
            >
              {done ? <CheckCircle2 size={15} /> : n}
            </span>
            <span className={"text-sm font-medium " + (isActive ? "text-ink" : "text-slate-400")}>{label}</span>
            {n < items.length && <ArrowRight size={14} className="text-slate-300 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------
// REVEAL MODAL — shows a one-time secret (a new password) after an admin
// action, since it will never be shown again after this.
// ------------------------------------------------------------------
export function RevealModal({ title, rows, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-popover max-w-sm w-full p-5">
        <h3 className="font-semibold text-ink mb-1">{title}</h3>
        <p className="text-xs text-slate-400 mb-4">Write this down now — it won't be shown again.</p>

        <div className="space-y-2 mb-5">
          {rows.map(function (r) {
            return (
              <div key={r.label} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <p className="text-xs text-slate-500">{r.label}</p>
                <p className="text-sm font-mono font-semibold text-ink break-all">{r.value}</p>
              </div>
            );
          })}
        </div>

        <Button className="w-full" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

export function money(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-PK");
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
