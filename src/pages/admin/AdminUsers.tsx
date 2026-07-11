import { useApp } from "../../store/AppContext";
import { mockUsers } from "../../data/mockUsers";
import { formatDateHe } from "../../utils/dateUtils";

export default function AdminUsers() {
  const { state } = useApp();

  const currentUserRow = state.user.onboardingComplete
    ? [
        {
          id: "current",
          name: state.user.name || "משתמש/ת נוכחי/ת",
          email: state.user.email || "-",
          fromCity: state.user.fromCity,
          toCity: state.user.toCity,
          moveDate: state.user.moveDate ?? "",
          progress: state.tasks.length
            ? Math.round(
                (state.tasks.filter((t) => t.done).length /
                  state.tasks.length) *
                  100
              )
            : 0,
          signedUp: "היום",
        },
      ]
    : [];

  const allUsers = [...currentUserRow, ...mockUsers];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">ניהול משתמשים</h1>
        <span className="text-sm text-gray-500">
          {allUsers.length} משתמשים רשומים
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right font-semibold px-4 py-3">שם</th>
              <th className="text-right font-semibold px-4 py-3">מייל</th>
              <th className="text-right font-semibold px-4 py-3">מסלול</th>
              <th className="text-right font-semibold px-4 py-3">
                תאריך מעבר
              </th>
              <th className="text-right font-semibold px-4 py-3">התקדמות</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr
                key={u.id}
                className={`border-t border-gray-100 ${
                  u.id === "current" ? "bg-brand-50/40" : ""
                }`}
              >
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {u.name}
                  {u.id === "current" && (
                    <span className="ms-2 text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full">
                      אתה
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">
                  {u.fromCity} ← {u.toCity}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.moveDate ? formatDateHe(u.moveDate) : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8">
                      {u.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
