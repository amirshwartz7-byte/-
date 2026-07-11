export default function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md bg-white rounded-2xl shadow-card border border-gray-100 p-6 text-center">
        <div className="text-4xl mb-3">🔧</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          נדרשת הגדרת חיבור למסד הנתונים
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          האפליקציה מחוברת ל-Supabase לצורך אחסון משתמשים, משימות, ספקים
          ותקציב. יש להגדיר את משתני הסביבה{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
            VITE_SUPABASE_URL
          </code>{" "}
          ו-
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
            VITE_SUPABASE_ANON_KEY
          </code>
          .
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          עבור פיתוח מקומי: העתיקו את <code>.env.example</code> ל-
          <code>.env</code> ומלאו את הערכים. עבור Vercel: הוסיפו את המשתנים
          תחת Project Settings → Environment Variables. פרטים מלאים ב-
          README.
        </p>
      </div>
    </div>
  );
}
