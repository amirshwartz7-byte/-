import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";

export default function Landing() {
  const navigate = useNavigate();
  const { state, setUser } = useApp();

  const handleAuth = (method: "google" | "apple" | "phone") => {
    setUser({
      authMethod: method,
      name: state.user.name || "משתמש/ת",
    });
    if (state.user.onboardingComplete) {
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="app-shell">
      <div className="flex-1 flex flex-col justify-between px-6 py-10">
        <div />
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-4xl font-extrabold text-brand-600 mb-2">
            Done
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            מנהלים לכם את המעבר דירה
            <br />
            מא&apos; ועד ת&apos;
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleAuth("google")}
            className="w-full py-3.5 rounded-xl font-semibold bg-white border border-gray-200 shadow-card flex items-center justify-center gap-2 text-gray-700"
          >
            <span className="text-lg">🔵</span> המשך עם Google
          </button>
          <button
            onClick={() => handleAuth("apple")}
            className="w-full py-3.5 rounded-xl font-semibold bg-black text-white flex items-center justify-center gap-2"
          >
            <span className="text-lg"></span> המשך עם Apple
          </button>
          <button
            onClick={() => handleAuth("phone")}
            className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white flex items-center justify-center gap-2"
          >
            המשך עם מספר טלפון
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed">
            בהמשך אתם מאשרים את תנאי השימוש ומדיניות הפרטיות
          </p>
          <button
            onClick={() => navigate("/admin")}
            className="text-xs text-gray-400 underline mt-4"
          >
            כניסת מנהל מערכת
          </button>
        </div>
      </div>
    </div>
  );
}
