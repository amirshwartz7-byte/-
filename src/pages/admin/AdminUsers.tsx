import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { formatDateHe } from "../../utils/dateUtils";
import type { AdminUserRow } from "../../types";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    async function load() {
      if (!supabase) return;
      const [profilesRes, tasksRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, name, email, departure_city, resort, trip_date, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase.from("tasks").select("user_id, done"),
      ]);

      if (cancelled) return;

      if (profilesRes.error) {
        setError(profilesRes.error.message);
        return;
      }

      const progressByUser = new Map<string, { done: number; total: number }>();
      (tasksRes.data as { user_id: string; done: boolean }[] | null)?.forEach(
        (t) => {
          const entry = progressByUser.get(t.user_id) ?? { done: 0, total: 0 };
          entry.total += 1;
          if (t.done) entry.done += 1;
          progressByUser.set(t.user_id, entry);
        }
      );

      const rows: AdminUserRow[] = (
        profilesRes.data as {
          id: string;
          name: string | null;
          email: string | null;
          departure_city: string | null;
          resort: string | null;
          trip_date: string | null;
          created_at: string;
        }[]
      ).map((p) => {
        const progress = progressByUser.get(p.id);
        return {
          id: p.id,
          name: p.name || "ללא שם",
          email: p.email ?? "-",
          departureCity: p.departure_city ?? "-",
          resort: p.resort ?? "-",
          tripDate: p.trip_date,
          progress:
            progress && progress.total > 0
              ? Math.round((progress.done / progress.total) * 100)
              : 0,
          createdAt: p.created_at,
        };
      });

      setUsers(rows);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">ניהול משתמשים</h1>
        {users && (
          <span className="text-sm text-gray-500">
            {users.length} משתמשים רשומים
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-4">
          שגיאה בטעינת משתמשים: {error}
        </div>
      )}

      {!users && !error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          טוען משתמשים...
        </div>
      ) : (
        users &&
        (users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            עדיין אין משתמשים רשומים
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-right font-semibold px-4 py-3">שם</th>
                  <th className="text-right font-semibold px-4 py-3">מייל</th>
                  <th className="text-right font-semibold px-4 py-3">יעד</th>
                  <th className="text-right font-semibold px-4 py-3">
                    תאריך טיסה
                  </th>
                  <th className="text-right font-semibold px-4 py-3">
                    התקדמות
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500" dir="ltr">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.departureCity} ← {u.resort}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.tripDate ? formatDateHe(u.tripDate) : "-"}
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
        ))
      )}
    </div>
  );
}
