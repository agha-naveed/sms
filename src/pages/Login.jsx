import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { errorText } from "../api";
import { Button, Field, Input, Message } from "../components/ui.jsx";
import { SCHOOL, Crest } from "../school.jsx";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in? Go straight to the dashboard.
  if (user) {
    navigate("/" + user.role, { replace: true });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const me = await login(email, password);
      navigate("/" + me.role, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-7">
          <span className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center mb-3">
            <Crest className="w-8 h-8" />
          </span>
          <h1 className="text-xl font-bold text-ink">{SCHOOL.shortName}</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in with your email, or your registration number.</p>
        </div>

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl shadow-card p-6 space-y-4">
          <Message type="error">{error}</Message>

          <Field label="Email or registration number">
            <Input
              type="text"
              value={email}
              autoComplete="username"
              autoFocus
              onChange={function (e) { setEmail(e.target.value); }}
              required
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={function (e) { setPassword(e.target.value); }}
              required
            />
          </Field>

          <p className="text-xs text-slate-400 -mt-2">
            Forgot your password? Ask the school office. They can give you a new one.
          </p>

          <Button type="submit" icon={LogIn} loading={busy} className="w-full" size="lg">
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          Applying for a new admission?{" "}
          <Link to="/apply" className="text-teal underline font-medium">Fill the admission form</Link>
        </p>
        <p className="text-sm text-slate-500 mt-2 text-center">
          <Link to="/check" className="text-teal underline font-medium">Check an admission result</Link>
          {" · "}
          <Link to="/" className="text-teal underline font-medium">School home</Link>
        </p>
      </div>
    </div>
  );
}
