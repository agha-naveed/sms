// Forgotten password, in four stages:
//   form      ask for a reset (the school office is notified)
//   waiting   the office is checking it's really you
//   approved  the office said yes: choose a new password here
//   done      all set, go and sign in
//
// The browser keeps a secret "ref" from when the request was made. It's
// what proves this is the person who asked, so the page can be closed and
// reopened in the same browser without losing its place.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, KeyRound, Clock3, CheckCircle2, RefreshCw } from "lucide-react";
import api, { errorText } from "../api";
import { Button, Field, Input, Message } from "../components/ui.jsx";
import { SCHOOL, Crest } from "../school.jsx";

const STORAGE_KEY = "sms_password_request_ref";

function readRef() {
  try { return localStorage.getItem(STORAGE_KEY) || ""; } catch (e) { return ""; }
}
function saveRef(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* private mode: the page still works until it is closed */ }
}

export default function ForgotPassword() {
  const [stage, setStage] = useState("checking");   // checking | form | waiting | approved | done
  const [ref, setRef] = useState(readRef());
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);
  const timer = useRef(null);

  // Ask the server where this request stands.
  async function check(currentRef, quiet) {
    if (!currentRef) { setStage("form"); return; }

    try {
      const res = await api.get("/auth/password-request/status", { params: { ref: currentRef } });
      const status = res.data.status;
      setCheckedAt(new Date());
      if (res.data.name) setName(res.data.name);

      if (status === "pending") { setStage("waiting"); return; }
      if (status === "approved") { setStage("approved"); return; }

      // rejected, expired, used or unknown: this request is over.
      saveRef("");
      setRef("");
      setStage("form");

      if (status === "rejected") {
        setNote("The school office didn't approve this request." + (res.data.note ? " " + res.data.note : "") + " You can contact them, or send a new request.");
      } else if (status === "expired") {
        setNote("That request lapsed before it was finished. Please send a new one.");
      } else if (status === "used") {
        setNote("A new password was already set with that request. You can sign in now.");
      }
    } catch (err) {
      if (!quiet) setError(errorText(err));
      setStage(currentRef ? "waiting" : "form");
    }
  }

  // On arrival, and every 10 seconds while waiting.
  useEffect(function () { check(ref, true); }, []);

  useEffect(
    function () {
      if (stage !== "waiting") return;
      timer.current = setInterval(function () { check(ref, true); }, 10000);
      return function () { clearInterval(timer.current); };
    },
    [stage, ref]
  );

  async function sendRequest(e) {
    e.preventDefault();
    setError("");
    setNote("");
    setBusy(true);

    try {
      const res = await api.post("/auth/password-request", { identifier });

      if (res.data.ref) {
        saveRef(res.data.ref);
        setRef(res.data.ref);
        setStage("waiting");
      } else {
        setNote(res.data.message);
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function choosePassword(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError("The two passwords don't match."); return; }
    if (password.length < 6) { setError("Your new password must be at least 6 characters."); return; }

    setBusy(true);
    try {
      await api.post("/auth/password-request/complete", { ref, new_password: password });
      saveRef("");
      setRef("");
      setStage("done");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    saveRef("");
    setRef("");
    setNote("");
    setError("");
    setStage("form");
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-7">
          <span className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center mb-3">
            <Crest className="w-8 h-8" />
          </span>
          <h1 className="text-xl font-bold text-ink">
            {stage === "approved" ? "Choose a new password" : stage === "done" ? "Password changed" : "Forgot your password?"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{SCHOOL.shortName}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6">
          <Message type="error" onClose={function () { setError(""); }}>{error}</Message>

          {stage === "checking" && <p className="text-sm text-slate-500">Checking...</p>}

          {stage === "form" && (
            <form onSubmit={sendRequest} className="space-y-4">
              {note && <Message type="info">{note}</Message>}

              <p className="text-sm text-slate-600">
                Enter your email or registration number. We'll ask the school office to let you set
                a new password; they check it's really you first.
              </p>

              <Field label="Email or registration number">
                <Input value={identifier} autoFocus onChange={function (e) { setIdentifier(e.target.value); }} required />
              </Field>

              <Button type="submit" icon={Send} loading={busy} className="w-full" size="lg">
                {busy ? "Sending..." : "Send request to the office"}
              </Button>
            </form>
          )}

          {stage === "waiting" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-warn/10 text-warn flex items-center justify-center shrink-0">
                  <Clock3 size={18} />
                </span>
                <div>
                  <p className="font-semibold text-ink">Waiting for the school office</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Your request has been sent. Someone there will check it's really you, and may call
                    the phone number they have on file.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Keep this page open, or come back to it in this same browser. It refreshes by itself,
                and once you're approved you'll choose your new password right here.
              </p>

              <div className="flex items-center justify-between">
                <Button variant="plain" size="sm" icon={RefreshCw} onClick={function () { check(ref, false); }}>
                  Check now
                </Button>
                {checkedAt && (
                  <span className="text-xs text-slate-400">Checked {checkedAt.toLocaleTimeString()}</span>
                )}
              </div>

              <button type="button" onClick={startOver} className="text-xs text-slate-400 underline">
                This isn't my request
              </button>
            </div>
          )}

          {stage === "approved" && (
            <form onSubmit={choosePassword} className="space-y-4">
              <Message type="success">
                {name ? "Approved, " + name.split(" ")[0] + "." : "Approved."} Choose a new password below.
              </Message>

              <Field label="New password" hint="At least 6 characters.">
                <Input type="password" value={password} autoFocus autoComplete="new-password" onChange={function (e) { setPassword(e.target.value); }} required />
              </Field>

              <Field label="Type it again">
                <Input type="password" value={confirm} autoComplete="new-password" onChange={function (e) { setConfirm(e.target.value); }} required />
              </Field>

              <Button type="submit" icon={KeyRound} loading={busy} className="w-full" size="lg">
                {busy ? "Saving..." : "Set new password"}
              </Button>
            </form>
          )}

          {stage === "done" && (
            <div className="space-y-4 text-center">
              <span className="w-12 h-12 rounded-full bg-good/10 text-good flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </span>
              <p className="text-sm text-slate-600">Your password has been changed. You can sign in with it now.</p>
              <Link to="/login" className="inline-block w-full bg-teal text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors">
                Go to sign in
              </Link>
            </div>
          )}
        </div>

        {stage !== "done" && (
          <p className="text-sm text-slate-500 mt-5 text-center">
            <Link to="/login" className="text-teal underline font-medium inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
