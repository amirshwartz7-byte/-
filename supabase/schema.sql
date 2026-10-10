-- Done | סכימת מסד נתונים ל-Supabase
-- הריצו את הקובץ הזה במלואו ב-SQL Editor של פרויקט ה-Supabase שלכם (Run).
-- בטוח להריץ שוב (idempotent) בזכות "if not exists" / "on conflict".

-- ============ EXTENSIONS ============
create extension if not exists "pgcrypto";

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  phone text,
  from_city text,
  to_city text,
  move_date date,
  apartment_size text,
  onboarding_complete boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- פונקציית עזר שבודקת אם המשתמש הנוכחי הוא אדמין, ללא רקורסיה ב-RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- יצירת פרופיל אוטומטית עם כל הרשמה חדשה
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ PROVIDERS (מרקטפלייס) ============
create table if not exists public.providers (
  id text primary key,
  category text not null,
  name text not null,
  rating numeric not null default 4.5,
  price_tag text not null default '$$',
  avg_price numeric not null default 0,
  deal_tag text,
  description text,
  phone text,
  logo_emoji text,
  created_at timestamptz not null default now()
);

alter table public.providers enable row level security;

drop policy if exists "providers_select_all" on public.providers;
create policy "providers_select_all" on public.providers
  for select using (true);

drop policy if exists "providers_admin_write" on public.providers;
create policy "providers_admin_write" on public.providers
  for all using (public.is_admin()) with check (public.is_admin());

-- ============ TASK TEMPLATES (CMS) ============
create table if not exists public.task_templates (
  id text primary key,
  title text not null,
  description text not null,
  stage text not null,
  offset_days int not null,
  category text not null,
  linked_provider_category text
);

alter table public.task_templates enable row level security;

drop policy if exists "task_templates_select_all" on public.task_templates;
create policy "task_templates_select_all" on public.task_templates
  for select using (true);

drop policy if exists "task_templates_admin_write" on public.task_templates;
create policy "task_templates_admin_write" on public.task_templates
  for all using (public.is_admin()) with check (public.is_admin());

-- ============ TASKS (צ'ק-ליסט אישי) ============
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id text,
  title text not null,
  description text,
  stage text not null,
  offset_days int not null default 0,
  category text not null default 'general',
  linked_provider_category text,
  done boolean not null default false,
  custom boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "tasks_owner_or_admin_select" on public.tasks;
create policy "tasks_owner_or_admin_select" on public.tasks
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "tasks_owner_write" on public.tasks;
create policy "tasks_owner_write" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_owner_update" on public.tasks;
create policy "tasks_owner_update" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_owner_delete" on public.tasks;
create policy "tasks_owner_delete" on public.tasks
  for delete using (auth.uid() = user_id);

-- ============ LEADS (פניות למרקטפלייס) ============
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_id text not null references public.providers (id) on delete cascade,
  category text not null,
  status text not null default 'sent',
  closed_price numeric,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads_owner_or_admin_select" on public.leads;
create policy "leads_owner_or_admin_select" on public.leads
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "leads_owner_write" on public.leads;
create policy "leads_owner_write" on public.leads
  for insert with check (auth.uid() = user_id);

drop policy if exists "leads_owner_update" on public.leads;
create policy "leads_owner_update" on public.leads
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ BUDGET ============
create table if not exists public.budgets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_budget numeric not null default 0
);

alter table public.budgets enable row level security;

drop policy if exists "budgets_owner" on public.budgets;
create policy "budgets_owner" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.budget_categories (
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text not null,
  label text not null,
  planned numeric not null default 0,
  actual numeric not null default 0,
  primary key (user_id, key)
);

alter table public.budget_categories enable row level security;

drop policy if exists "budget_categories_owner" on public.budget_categories;
create policy "budget_categories_owner" on public.budget_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ PACKAGE SELECTIONS (בונה חבילת שירותים) ============
create table if not exists public.package_selections (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  provider_id text not null references public.providers (id) on delete cascade,
  primary key (user_id, category)
);

alter table public.package_selections enable row level security;

drop policy if exists "package_selections_owner" on public.package_selections;
create policy "package_selections_owner" on public.package_selections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ SERVICE REQUESTS (הזמנות שירות מלא) ============
-- בקשות מעמוד החבילות. גם גולשים לא מחוברים יכולים לשלוח בקשה (insert בלבד),
-- רק הלקוח המחובר רואה את הבקשה שלו, ורק אדמין מעדכן.
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  from_city text,
  to_city text,
  move_date date,
  apartment_size text not null,
  package_id text not null check (package_id in ('basic', 'full', 'premium')),
  addons text[] not null default '{}',
  quoted_price numeric not null default 0,
  final_price numeric,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'booked', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.service_requests enable row level security;

drop policy if exists "service_requests_owner_or_admin_select" on public.service_requests;
create policy "service_requests_owner_or_admin_select" on public.service_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "service_requests_public_insert" on public.service_requests;
create policy "service_requests_public_insert" on public.service_requests
  for insert to anon, authenticated
  with check (
    status = 'new'
    and final_price is null
    and notes is null
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "service_requests_admin_update" on public.service_requests;
create policy "service_requests_admin_update" on public.service_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "service_requests_admin_delete" on public.service_requests;
create policy "service_requests_admin_delete" on public.service_requests
  for delete using (public.is_admin());

-- ============ SERVICE ITEMS (שלבי תוכנית המעבר של לקוח) ============
create table if not exists public.service_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  key text not null,
  label text not null,
  emoji text,
  scheduled_date date,
  vendor_name text,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'done')),
  sort int not null default 0
);

alter table public.service_items enable row level security;

drop policy if exists "service_items_owner_or_admin_select" on public.service_items;
create policy "service_items_owner_or_admin_select" on public.service_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.service_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "service_items_admin_write" on public.service_items;
create policy "service_items_admin_write" on public.service_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ============ SEED DATA: ספקים ============
insert into public.providers (id, category, name, rating, price_tag, avg_price, deal_tag, description, phone, logo_emoji)
values
('p1', 'moving', 'מובילי הצפון', 4.8, '$$', 2400, '10% הנחה על חומרי אריזה', 'צוות מקצועי עם ביטוח מקיף על התכולה, פועלים בכל הארץ.', '0501234567', '🚚'),
('p2', 'moving', 'EasyMove הובלות', 4.5, '$', 1800, null, 'הובלות חסכוניות לדירות קטנות ובינוניות, זמינות גבוהה.', '0521234567', '📦'),
('p3', 'moving', 'פרימיום הובלות ואחסנה', 4.9, '$$$', 3600, 'חודש אחסון ראשון חינם', 'שירות פרימיום כולל פירוק והרכבה של רהיטים ומחסן זמני.', '0541234567', '🏆'),
('p4', 'cleaning', 'נקי-נט שירותי ניקיון', 4.6, '$$', 450, 'דיל בלעדי של Done - 15% הנחה', 'ניקיון יסודי לפני/אחרי מעבר, כולל חלונות וארונות.', '0501112233', '🧽'),
('p5', 'cleaning', 'הדברת מגן ירוק', 4.7, '$', 300, null, 'הדברה ידידותית לחיות מחמד וילדים, אחריות לחצי שנה.', '0521112233', '🌿'),
('p6', 'internet', 'נטליין תקשורת', 4.3, '$$', 129, 'חודשיים ראשונים חינם', 'התקנה מהירה תוך 48 שעות, ללא התחייבות לשנה ראשונה.', '1800123123', '📡'),
('p7', 'internet', 'פייבר-נט', 4.4, '$', 99, null, 'סיבים אופטיים במחיר משתלם, כולל נתב מתקדם.', '1800456456', '🌐'),
('p8', 'handyman', 'הנדימן אקספרס', 4.6, '$$', 250, 'קריאה ראשונה ב-50% הנחה', 'תיקונים כלליים, הרכבת רהיטים, תליית מדפים ווילונות.', '0507778899', '🛠️'),
('p9', 'handyman', 'מנעולן דוד', 4.9, '$', 180, null, 'החלפת צילינדרים ומנעולי רב-בריח, זמינות 24/7.', '0509998877', '🔑')
on conflict (id) do nothing;

-- ============ SEED DATA: תבניות משימות ============
insert into public.task_templates (id, title, description, stage, offset_days, category, linked_provider_category)
values
('t01', 'קביעת תקציב מעבר', 'הגדירו תקציב גג למעבר הדירה כדי לעקוב אחרי ההוצאות בהמשך התהליך. אפשר להשתמש במחשבון התקציב באפליקציה.', '2mo', -60, 'general', null),
('t02', 'השוואת הצעות מחברות הובלה', 'מומלץ לקבל לפחות 3 הצעות מחיר מחברות הובלה שונות. שימו לב לגודל המשאית, מספר עובדים וביטוח על התכולה.', '2mo', -55, 'moving', 'moving'),
('t03', 'מיון וגריעת פריטים (דהגה)', 'עברו על כל חדר ומיינו פריטים ל''לוקח'', ''תורם'' ו''זורק''. מעבר דירה הוא ההזדמנות הכי טובה לצמצם עודפים.', '2mo', -50, 'general', null),
('t04', 'בדיקת חוזה שכירות / מכר', 'ודאו שקראתם את כל סעיפי החוזה החדש, כולל תאריך מסירת מפתח, פיקדון ותנאי ביטול.', '2mo', -55, 'docs', null),
('t05', 'עדכון בית ספר / גן לילדים', 'אם עוברים עיר, יש להתחיל תהליך רישום/העברה של הילדים למוסדות חינוך חדשים מוקדם ככל האפשר.', '2mo', -45, 'docs', null),
('t06', 'איסוף הצעות ממדביר', 'מומלץ לבצע הדברה בדירה החדשה לפני ההובלה, כשהיא עדיין ריקה מרהיטים.', '2mo', -40, 'cleaning', 'cleaning'),
('t07', 'סגירת חברת הובלה', 'לאחר השוואת המחירים, סגרו את חברת ההובלה וקבעו תאריך ושעה מדויקים. בקשו אישור בכתב.', '1mo', -30, 'moving', 'moving'),
('t08', 'הזמנת חומרי אריזה', 'קרטונים, נייר בועות, סקוץ'' ופלסטיק עטיפה. עדיף להזמין כמות גדולה מהמשוער.', '1mo', -28, 'moving', 'moving'),
('t09', 'הזמנת ניקיון לדירה הישנה', 'תאמו חברת ניקיון לניקיון יסודי של הדירה הישנה לאחר הפינוי, בהתאם לדרישות בעל הבית.', '1mo', -25, 'cleaning', 'cleaning'),
('t10', 'תיאום ניתוק/חיבור אינטרנט וכבלים', 'הזמינו ניתוק בכתובת הישנה וחיבור מראש בכתובת החדשה, כדי לא להישאר בלי אינטרנט.', '1mo', -21, 'internet', 'internet'),
('t11', 'עדכון כתובת בבנק ובחברות האשראי', 'עדכנו את הכתובת החדשה בבנק, בחברות האשראי ובחברת הביטוח.', '1mo', -20, 'docs', null),
('t12', 'בדיקת מנעולן לדירה החדשה', 'משיקולי ביטחון מומלץ להחליף צילינדר/מנעול בדירה החדשה מיד עם קבלת המפתח.', '1mo', -18, 'handyman', 'handyman'),
('t13', 'עדכון ביטוח דירה ותכולה', 'ודאו שהביטוח מכסה את הדירה החדשה ואת התכולה גם בזמן ההובלה עצמה.', '1mo', -15, 'docs', null),
('t14', 'אריזת קופסת חירום', 'הכינו קופסה עם פריטים חיוניים ליום הראשון: תרופות, מטענים, מסמכים, כלי מטבח בסיסיים ומצרכי היגיינה.', 'week', -6, 'general', null),
('t15', 'אריזת שאר הדירה', 'סמנו כל קופסה עם החדר היעד והתוכן הכללי, כדי להקל על הפריקה בדירה החדשה.', 'week', -5, 'general', null),
('t16', 'העברת קריאות מונים (חשמל, מים, גז)', 'צלמו את מצב המונים בדירה הישנה והחדשה ביום המעבר ודווחו לחברות הרלוונטיות.', 'week', -2, 'utilities', null),
('t17', 'עדכון כתובת בדואר ישראל', 'הגדירו העברת דואר זמנית מהכתובת הישנה לחדשה.', 'week', -3, 'docs', null),
('t18', 'הכנת מזומן לטיפ למובילים', 'מקובל לתת טיפ לצוות המוביל בסוף העבודה. הכינו מראש סכום מתאים במזומן.', 'week', -1, 'moving', null),
('t19', 'יום המעבר - קבלת מפתח ופיקוח על ההובלה', 'היו נוכחים בזמן הפריקה והטעינה, וודאו שכל התכולה נספרה והגיעה בשלמותה.', 'week', 0, 'moving', null),
('t20', 'עדכון כתובת ברשויות (רשות מקומית, ביטוח לאומי, משרד הפנים)', 'יש חובה חוקית לעדכן כתובת במשרד הפנים תוך 30 יום ממועד המעבר.', 'afterWeek', 3, 'docs', null),
('t21', 'פריקה וארגון סופי של הבית', 'התחילו מהחדרים החיוניים - מטבח וחדרי שינה, והמשיכו בהדרגה.', 'afterWeek', 4, 'general', null),
('t22', 'הכרת השכונה החדשה', 'מצאו סופרמרקט, בית מרקחת, רופא משפחה וגני משחקים קרובים לבית החדש.', 'afterWeek', 6, 'general', null),
('t23', 'תיקונים קטנים בבית החדש', 'וילונות, מדפים, הרכבת רהיטים - זה הזמן להזמין הנדימן לכל התיקונים שנצברו.', 'afterWeek', 7, 'handyman', 'handyman')
on conflict (id) do nothing;

-- ============ הפיכת המשתמש הראשון שלכם למנהל מערכת ============
-- אחרי שנרשמתם לאפליקציה בפעם הראשונה, הריצו את השורה הבאה
-- (עם כתובת המייל שנרשמתם איתה) כדי לקבל הרשאות אדמין:
--
-- update public.profiles set is_admin = true where email = 'you@example.com';
