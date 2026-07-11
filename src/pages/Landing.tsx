import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";

type Mode = "signin" | "signup";

export default function Landing() {
  const navigate = useNavigate();
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("נא להזין שם מלא");
          return;
        }
        const res = await signUp(email.trim(), password, name.trim());
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.needsEmailConfirm) {
          setInfo("נשלח אליכם מייל אישור - יש ללחוץ על הקישור ואז להתחבר.");
          setMode("signin");
          return;
        }
        navigate("/onboarding");
      } else {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          setError(res.error);
          return;
        }
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="flex-1 flex flex-col justify-between px-6 py-8">
        <div className="text-center pt-4">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-3xl font-extrabold text-brand-600 mb-1">
            Done
          </h1>
          <p className="text-gray-500 leading-relaxed">
            מנהלים לכם את המעבר דירה
            <br />
            מא&apos; ועד ת&apos;
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === "signin"
                  ? "bg-white text-brand-600 shadow-card"
                  : "text-gray-500"
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === "signup"
                  ? "bg-white text-brand-600 shadow-card"
                  : "text-gray-500"
              }`}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם מלא"
                required
                className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="אימייל"
              required
              dir="ltr"
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none text-right"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
              required
              minLength={6}
              dir="ltr"
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none text-right"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2.5 text-center">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2.5 text-center">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white disabled:opacity-50"
            >
              {loading
                ? "רגע..."
                : mode === "signup"
                ? "הרשמה"
                : "התחברות"}
            </button>
          </form>

          <button
            disabled
            title="בקרוב"
            className="w-full py-3.5 rounded-xl font-semibold bg-white border border-gray-200 flex items-center justify-center gap-2 text-gray-400 cursor-not-allowed"
          >
            <span className="text-lg">🔵</span> המשך עם Google (בקרוב)
          </button>

          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            בהמשך אתם מאשרים את תנאי השימוש ומדיניות הפרטיות
          </p>
        </div>
      </div>
    </div>
  );
}
