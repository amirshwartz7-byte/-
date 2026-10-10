// מצב דמו: מסד נתונים בזיכרון שמחקה את ממשק supabase-js שהאפליקציה משתמשת בו,
// כדי שאפשר יהיה להריץ את כל האפליקציה בלי שרת. נטען רק כש-VITE_DEMO=true.
import { providers } from "../data/providers";
import { taskTemplates } from "../data/taskTemplates";
import { buildServiceSteps, calculateQuote, type ServicePackageId } from "../data/servicePackages";

type Row = Record<string, unknown>;
type Db = Record<string, Row[]>;
type Result = { data: unknown; error: { message: string } | null };

const DEMO_USER_ID = "demo-user";
export const DEMO_EMAIL = "dana@example.com";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function isoDay(offset: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function isoTime(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

const tableDefaults: Record<string, () => Row> = {
  tasks: () => ({ done: false, custom: false }),
  leads: () => ({ status: "sent", closed_price: null }),
  service_requests: () => ({ status: "new", final_price: null, notes: null, addons: [] }),
  service_items: () => ({ status: "pending", vendor_name: null }),
};

function seed(): Db {
  const moveIn = 24;
  const profiles: Row[] = [
    { id: DEMO_USER_ID, email: DEMO_EMAIL, name: "דנה לוי", phone: "050-1234567", from_city: "תל אביב-יפו", to_city: "רמת גן", move_date: isoDay(moveIn), apartment_size: "3", onboarding_complete: true, is_admin: true, created_at: isoTime(12) },
    { id: "u2", email: "yossi@example.com", name: "יוסי מזרחי", phone: null, from_city: "חיפה", to_city: "תל אביב-יפו", move_date: isoDay(40), apartment_size: "2", onboarding_complete: true, is_admin: false, created_at: isoTime(9) },
    { id: "u3", email: "michal@example.com", name: "מיכל אברהם", phone: null, from_city: "רמת גן", to_city: "גבעתיים", move_date: isoDay(15), apartment_size: "4", onboarding_complete: true, is_admin: false, created_at: isoTime(6) },
    { id: "u4", email: "omer@example.com", name: "עומר בן דוד", phone: null, from_city: "ירושלים", to_city: "מודיעין-מכבים-רעות", move_date: isoDay(55), apartment_size: "5+", onboarding_complete: true, is_admin: false, created_at: isoTime(3) },
    { id: "u5", email: "noa@example.com", name: "נועה פרץ", phone: null, from_city: "הרצליה", to_city: "כפר סבא", move_date: isoDay(8), apartment_size: "3", onboarding_complete: true, is_admin: false, created_at: isoTime(1) },
  ];

  const templates: Row[] = taskTemplates.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    stage: t.stage,
    offset_days: t.offsetDays,
    category: t.category,
    linked_provider_category: t.linkedProviderCategory ?? null,
  }));

  const tasks: Row[] = [];
  profiles.forEach((p, pi) => {
    const doneUntil = [8, 4, 12, 2, 16][pi];
    taskTemplates.forEach((t, i) => {
      tasks.push({
        id: uid(),
        user_id: p.id,
        template_id: t.id,
        title: t.title,
        description: t.description,
        stage: t.stage,
        offset_days: t.offsetDays,
        category: t.category,
        linked_provider_category: t.linkedProviderCategory ?? null,
        done: i < doneUntil,
        custom: false,
        due_date: (() => {
          const d = new Date(`${p.move_date as string}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + t.offsetDays);
          return d.toISOString().slice(0, 10);
        })(),
      });
    });
  });

  const leads: Row[] = [
    { id: uid(), user_id: DEMO_USER_ID, provider_id: "p1", category: "moving", status: "contacted", closed_price: null, created_at: isoTime(5) },
    { id: uid(), user_id: DEMO_USER_ID, provider_id: "p6", category: "internet", status: "closed", closed_price: 129, created_at: isoTime(4) },
    { id: uid(), user_id: "u2", provider_id: "p2", category: "moving", status: "closed", closed_price: 1900, created_at: isoTime(7) },
    { id: uid(), user_id: "u3", provider_id: "p4", category: "cleaning", status: "closed", closed_price: 480, created_at: isoTime(3) },
    { id: uid(), user_id: "u4", provider_id: "p3", category: "moving", status: "sent", closed_price: null, created_at: isoTime(1) },
  ];

  const budgetPlan: Record<string, [string, number, number]> = {
    moving: ["הובלות ואריזה", 2400, 0],
    cleaning: ["ניקיון והדברה", 450, 0],
    internet: ["אינטרנט ותקשורת", 129, 129],
    handyman: ["הנדימן ומנעולנים", 250, 0],
    other: ["שונות", 800, 320],
  };
  const budget_categories: Row[] = Object.entries(budgetPlan).map(([key, [label, planned, actual]]) => ({
    user_id: DEMO_USER_ID,
    key,
    label,
    planned,
    actual,
  }));

  const requests: { id: string; user: string | null; name: string; phone: string; email: string; from: string; to: string; move: number; size: string; pkg: ServicePackageId; addons: string[]; status: string; final: number | null; ago: number }[] = [
    { id: "sr-demo", user: DEMO_USER_ID, name: "דנה לוי", phone: "050-1234567", email: DEMO_EMAIL, from: "תל אביב-יפו", to: "רמת גן", move: moveIn, size: "3", pkg: "full", addons: ["storage"], status: "booked", final: 13900, ago: 6 },
    { id: uid(), user: null, name: "אורי שלום", phone: "052-7654321", email: "uri@example.com", from: "תל אביב-יפו", to: "תל אביב-יפו", move: 30, size: "2", pkg: "basic", addons: [], status: "new", final: null, ago: 0.2 },
    { id: uid(), user: null, name: "שירה גולן", phone: "054-1112233", email: "shira@example.com", from: "גבעתיים", to: "הרצליה", move: 45, size: "4", pkg: "premium", addons: ["heavy"], status: "new", final: null, ago: 1 },
    { id: uid(), user: "u3", name: "מיכל אברהם", phone: "053-9988776", email: "michal@example.com", from: "רמת גן", to: "גבעתיים", move: 15, size: "4", pkg: "full", addons: [], status: "contacted", final: null, ago: 2 },
    { id: uid(), user: "u5", name: "נועה פרץ", phone: "058-4455667", email: "noa@example.com", from: "הרצליה", to: "כפר סבא", move: 8, size: "3", pkg: "full", addons: ["pest"], status: "in_progress", final: 12900, ago: 10 },
    { id: uid(), user: null, name: "אבי כהן", phone: "050-3332211", email: "avi@example.com", from: "חולון", to: "בת ים", move: -12, size: "3", pkg: "basic", addons: [], status: "completed", final: 6100, ago: 30 },
  ];
  const service_requests: Row[] = requests.map((r) => ({
    id: r.id,
    user_id: r.user,
    name: r.name,
    phone: r.phone,
    email: r.email,
    from_city: r.from,
    to_city: r.to,
    move_date: isoDay(r.move),
    apartment_size: r.size,
    package_id: r.pkg,
    addons: r.addons,
    quoted_price: calculateQuote({ packageId: r.pkg, apartmentSize: r.size as "3", addonIds: r.addons, intercity: r.from !== r.to }),
    final_price: r.final,
    status: r.status,
    notes: r.status === "booked" ? "קומה 3 עם מעלית. ספה גדולה בסלון." : null,
    created_at: isoTime(r.ago),
  }));

  const vendors: Record<string, string> = {
    kickoff: "מנהל המעבר: עידו",
    internet: "נטליין תקשורת",
    packing: "פרימיום הובלות ואחסנה",
    cleaning_new: "נקי-נט שירותי ניקיון",
    moving: "פרימיום הובלות ואחסנה",
    storage: "פרימיום הובלות ואחסנה",
  };
  const service_items: Row[] = buildServiceSteps("full", ["storage"]).map((s, i) => {
    const d = new Date(`${isoDay(moveIn)}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + s.offsetDays);
    return {
      id: uid(),
      request_id: "sr-demo",
      key: s.key,
      label: s.label,
      emoji: s.emoji,
      scheduled_date: d.toISOString().slice(0, 10),
      vendor_name: vendors[s.key] ?? null,
      status: s.key === "kickoff" ? "done" : vendors[s.key] ? "scheduled" : "pending",
      sort: i,
    };
  });

  return {
    profiles,
    providers: providers.map((p) => ({
      id: p.id,
      category: p.category,
      name: p.name,
      rating: p.rating,
      price_tag: p.priceTag,
      avg_price: p.avgPrice,
      deal_tag: p.dealTag ?? null,
      description: p.description,
      phone: p.phone,
      logo_emoji: p.logoEmoji,
    })),
    task_templates: templates,
    tasks,
    leads,
    budgets: [{ user_id: DEMO_USER_ID, total_budget: 15000 }],
    budget_categories,
    package_selections: [{ user_id: DEMO_USER_ID, category: "moving", provider_id: "p1" }],
    service_requests,
    service_items,
  };
}

type Filter = (r: Row) => boolean;

class Query implements PromiseLike<Result> {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Row[] = [];
  private patch: Row = {};
  private conflictKeys: string[] = [];
  private filters: Filter[] = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private mode: "many" | "single" | "maybe" = "many";
  private returning = false;
  private started = false;

  private db: Db;
  private table: string;

  constructor(db: Db, table: string) {
    this.db = db;
    this.table = table;
    db[table] ??= [];
  }

  select(): this {
    if (this.started) this.returning = true;
    this.started = true;
    return this;
  }
  insert(rows: Row | Row[]): this {
    this.op = "insert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    this.started = true;
    return this;
  }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }): this {
    this.op = "upsert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    this.conflictKeys = (opts?.onConflict ?? "id").split(",").map((k) => k.trim());
    this.started = true;
    return this;
  }
  update(patch: Row): this {
    this.op = "update";
    this.patch = patch;
    this.started = true;
    return this;
  }
  delete(): this {
    this.op = "delete";
    this.started = true;
    return this;
  }
  eq(col: string, val: unknown): this {
    this.filters.push((r) => r[col] === val);
    return this;
  }
  neq(col: string, val: unknown): this {
    this.filters.push((r) => r[col] !== val);
    return this;
  }
  ilike(col: string, pattern: string): this {
    const re = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*")}$`, "i");
    this.filters.push((r) => re.test(String(r[col] ?? "")));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, asc: opts?.ascending ?? true };
    return this;
  }
  limit(n: number): this {
    this.max = n;
    return this;
  }
  single(): this {
    this.mode = "single";
    return this;
  }
  maybeSingle(): this {
    this.mode = "maybe";
    return this;
  }

  then<A = Result, B = never>(
    onFulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(onFulfilled, onRejected);
  }

  private matches(r: Row): boolean {
    return this.filters.every((f) => f(r));
  }

  private withDefaults(row: Row): Row {
    return {
      id: uid(),
      created_at: new Date().toISOString(),
      ...(tableDefaults[this.table]?.() ?? {}),
      ...row,
    };
  }

  private shape(rows: Row[]): Result {
    const copies = rows.map((r) => ({ ...r }));
    if (this.mode === "many") return { data: copies, error: null };
    if (copies.length === 0) {
      return this.mode === "maybe"
        ? { data: null, error: null }
        : { data: null, error: { message: "No rows found" } };
    }
    return { data: copies[0], error: null };
  }

  private run(): Result {
    const rows = this.db[this.table];
    switch (this.op) {
      case "select": {
        let out = rows.filter((r) => this.matches(r));
        if (this.orderBy) {
          const { col, asc } = this.orderBy;
          out = [...out].sort((a, b) => {
            const x = a[col] as string | number;
            const y = b[col] as string | number;
            if (x === y) return 0;
            if (x === null || x === undefined) return 1;
            if (y === null || y === undefined) return -1;
            return (x < y ? -1 : 1) * (asc ? 1 : -1);
          });
        }
        if (this.max !== null) out = out.slice(0, this.max);
        return this.shape(out);
      }
      case "insert": {
        const inserted = this.payload.map((r) => this.withDefaults(r));
        rows.push(...inserted);
        return this.returning ? this.shape(inserted) : { data: null, error: null };
      }
      case "upsert": {
        const out: Row[] = [];
        for (const r of this.payload) {
          const existing = rows.find((e) => this.conflictKeys.every((k) => e[k] === r[k]));
          if (existing) {
            Object.assign(existing, r);
            out.push(existing);
          } else {
            const created = this.withDefaults(r);
            rows.push(created);
            out.push(created);
          }
        }
        return this.returning ? this.shape(out) : { data: null, error: null };
      }
      case "update": {
        const updated = rows.filter((r) => this.matches(r));
        updated.forEach((r) => Object.assign(r, this.patch));
        return this.returning ? this.shape(updated) : { data: null, error: null };
      }
      case "delete": {
        this.db[this.table] = rows.filter((r) => !this.matches(r));
        return { data: null, error: null };
      }
    }
  }
}

interface MockSession {
  user: { id: string; email: string };
  access_token: string;
}

export function createMockSupabase() {
  const db = seed();
  let session: MockSession | null = {
    user: { id: DEMO_USER_ID, email: DEMO_EMAIL },
    access_token: "demo",
  };
  const listeners = new Set<(event: string, s: MockSession | null) => void>();
  const emit = (event: string) =>
    setTimeout(() => listeners.forEach((cb) => cb(event, session)), 0);

  const sessionFor = (id: string, email: string): MockSession => ({
    user: { id, email },
    access_token: "demo",
  });

  return {
    from: (table: string) => new Query(db, table),
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange(cb: (event: string, s: MockSession | null) => void) {
        listeners.add(cb);
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
      },
      async signUp({ email }: { email: string; password: string }) {
        const existing = db.profiles.find((p) => p.email === email);
        if (existing) {
          return { data: { user: null, session: null }, error: { message: "User already registered" } };
        }
        const id = uid();
        db.profiles.push({
          id,
          email,
          name: null,
          phone: null,
          from_city: null,
          to_city: null,
          move_date: null,
          apartment_size: null,
          onboarding_complete: false,
          is_admin: false,
          created_at: new Date().toISOString(),
        });
        session = sessionFor(id, email);
        emit("SIGNED_IN");
        return { data: { user: session.user, session }, error: null };
      },
      // בדמו כל סיסמה עובדת. אימייל שלא קיים נכנס למשתמשת הדמו
      async signInWithPassword({ email }: { email: string; password: string }) {
        const profile = db.profiles.find((p) => p.email === email) ?? db.profiles[0];
        session = sessionFor(profile.id as string, profile.email as string);
        emit("SIGNED_IN");
        return { data: { session }, error: null };
      },
      async signOut() {
        session = null;
        emit("SIGNED_OUT");
        return { error: null };
      },
    },
  };
}
