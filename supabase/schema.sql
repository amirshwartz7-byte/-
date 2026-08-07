-- פאודר קלאב | סכימת מסד נתונים ל-Supabase
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
  departure_city text,
  resort text,
  trip_date date,
  ski_level text,
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

-- ============ PROVIDERS (מרקטפלייס ספקים) ============
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

-- ============ PACKAGE SELECTIONS (בונה חבילת החופשה) ============
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

-- ============ SEED DATA: ספקים ============
insert into public.providers (id, category, name, rating, price_tag, avg_price, deal_tag, description, phone, logo_emoji)
values
('p1', 'flights', 'פליי-סקי טיסות שכר', 4.8, '$$', 2400, 'מזוודת ציוד סקי חינם בהזמנה מראש', 'טיסות שכר ישירות לאתרי הסקי המובילים באירופה, כל החורף.', '0501234567', '✈️'),
('p2', 'flights', 'אלפים אקספרס - העברות', 4.6, '$', 320, null, 'שאטלים פרטיים משדה התעופה ישירות לאתר, בלי החלפות.', '0521234567', '🚐'),
('p3', 'flights', 'יורו-רנט קאר חורף', 4.7, '$$', 890, 'שלשלאות שלג כלולות בחינם', 'השכרת רכבי 4x4 עם צמיגי חורף, איסוף בשדה התעופה.', '0541234567', '🚙'),
('p4', 'lodging', 'שאלה בהרים - צ''לטים בוטיק', 4.9, '$$$', 5200, 'לילה חינם בהזמנת שבוע מלא', 'צ''לטים בוטיק צמודי מסלול עם ג''קוזי חוץ וארוחת בוקר כלולה.', '0501112233', '🏔️'),
('p5', 'lodging', 'אלפיין סוויטס', 4.5, '$$', 3400, null, 'מלון 4 כוכבים עם ספא וחדר ייבוש ציוד, הליכה לרכבל.', '0521112233', '🏨'),
('p6', 'lessons', 'מורי השלג - בית ספר לסקי', 4.8, '$$', 450, 'שיעור ראשון ב-50% הנחה', 'הדרכה פרטית וקבוצתית לכל הרמות, מדריכים דוברי עברית.', '0501112244', '🎿'),
('p7', 'lessons', 'סנוקאמפ סנובורד קלאב', 4.6, '$', 380, null, 'קורסים לסנובורדיסטים ממתחילים ועד פארק וחצי-צינור.', '0521112255', '🏂'),
('p8', 'equipment', 'פאודר גיר - השכרת ציוד', 4.7, '$$', 260, '10% הנחה בהזמנה מראש דרך פאודר קלאב', 'השכרה מקוונת מראש עם איסוף מהיר באתר, ציוד חדש כל עונה.', '0507778899', '⛷️'),
('p9', 'equipment', 'סקי-שופ ישראל', 4.9, '$', 1800, null, 'חנות ציוד סקי וסנובורד בישראל, מכירה והתאמה אישית לפני הטיסה.', '0509998877', '🧤')
on conflict (id) do nothing;

-- ============ SEED DATA: תבניות משימות ============
insert into public.task_templates (id, title, description, stage, offset_days, category, linked_provider_category)
values
('t01', 'קביעת תקציב לחופשת הסקי', 'הגדירו תקציב גג לחופשת הסקי כדי לעקוב אחרי ההוצאות בהמשך התהליך. אפשר להשתמש במחשבון התקציב באפליקציה.', '2mo', -60, 'general', null),
('t02', 'השוואת הצעות טיסות והעברות', 'מומלץ לקבל לפחות 3 הצעות מחיר לטיסות ולהעברה מהשדה לאתר. שימו לב לתוספת ציוד סקי במחיר הכרטיס.', '2mo', -55, 'flights', 'flights'),
('t03', 'בדיקת דרכון ותוקף ויזה', 'ודאו שהדרכון בתוקף לפחות 6 חודשים מיום החזרה, ובדקו אם נדרשת ויזה ליעד שבחרתם.', '2mo', -55, 'docs', null),
('t04', 'הזמנת לינה באתר מוקדם', 'אתרי הסקי הפופולריים מתמלאים מהר - הזמינו מלון או צ''לט מראש כדי לקבל את המחיר והמיקום הטובים ביותר.', '2mo', -50, 'lodging', 'lodging'),
('t05', 'בדיקת ביטוח נסיעות לספורט חורף', 'ודאו שהביטוח מכסה במפורש ספורט חורף (סקי/סנובורד מחוץ למסלולים מסומנים לרוב אינו מכוסה).', '2mo', -45, 'docs', null),
('t06', 'הרשמה מוקדמת לשיעורי סקי/סנובורד', 'אם אתם מתחילים או רוצים לשפר רמה, מומלץ לתאם מדריך פרטי או בית ספר מראש - הביקוש גבוה בעונה.', '2mo', -40, 'lessons', 'lessons'),
('t07', 'סגירת חבילת הטיול הסופית', 'לאחר השוואת המחירים, סגרו טיסות, לינה והעברות וקבלו אישור בכתב על כל ההזמנות.', '1mo', -30, 'flights', 'flights'),
('t08', 'הזמנת/השכרת ציוד סקי מראש', 'מגלשיים, מגפיים וקסדה - הזמינו מראש כדי להבטיח מידה נכונה ולחסוך בתור באתר.', '1mo', -25, 'equipment', 'equipment'),
('t09', 'רכישת סקי פאס מראש', 'כרטיסי מסלולים (Ski Pass) לרוב זולים יותר ברכישה מקוונת מראש לעומת רכישה באתר עצמו.', '1mo', -20, 'general', null),
('t10', 'עדכון ביטוח בריאות לחו״ל', 'ודאו שהביטוח הרפואי בתוקף ומכסה טיפולים בחו"ל וגם פינוי רפואי במקרה פציעה.', '1mo', -18, 'docs', null),
('t11', 'תרגול כושר גופני להכנה לסקי', 'חיזוק רגליים וליבה מפחית משמעותית סיכון לפציעות. 3-4 שבועות של אימונים קלים עושים הבדל גדול.', '1mo', -15, 'general', null),
('t12', 'בדיקת ביגוד תרמי וחורפי', 'מעיל ומכנסי סקי אטומים למים, שכבות תרמיות, כפפות ומשקפי סקי - עדיף לבדוק ולהשלים חוסרים מראש.', '1mo', -12, 'equipment', null),
('t13', 'אריזת תיק ציוד הסקי', 'ארזו את הביגוד התרמי, המשקפיים, הכפפות וקרם ההגנה. אם שכרתם ציוד באתר - סמנו זאת ברשימה.', 'week', -6, 'general', null),
('t14', 'הדפסת/הורדת מסמכי טיסה וביטוח', 'שמרו עותק דיגיטלי ומודפס של כרטיסי הטיסה, פוליסת הביטוח ואישורי המלון בטלפון ובתיק.', 'week', -5, 'docs', null),
('t15', 'בדיקת תחזית שלג ומזג אוויר באתר', 'עקבו אחר תחזית השלג והטמפרטורות באתר בימים שלפני הנסיעה, כדי להתאים את הביגוד והציפיות.', 'week', -3, 'general', null),
('t16', 'טעינת אפליקציית מסלולים ומפת האתר', 'רוב אתרי הסקי מציעים אפליקציה עם מפת מסלולים, מצב רכבלים בזמן אמת ותחזית - הורידו לפני הטיסה.', 'week', -2, 'general', null),
('t17', 'יום הנסיעה - צ''ק אין וטיסה', 'הגיעו לשדה מוקדם, ודאו שציוד הסקי נרשם כראוי ובדקו שהעברה מהשדה לאתר מתואמת.', 'week', 0, 'flights', null),
('t18', 'החזרת ציוד מושכר ובדיקת פיקדון', 'ודאו שהחזרתם את הציוד השכור בזמן ובמצב תקין, ושחררו/בדקו את הפיקדון שהופקד.', 'afterWeek', 2, 'equipment', 'equipment'),
('t19', 'ניקוי וייבוש ציוד אישי', 'אם קניתם ציוד אישי - נגבו ויבשו היטב לפני האחסון כדי למנוע עובש ולשמור על אורך חיי הציוד.', 'afterWeek', 3, 'general', null),
('t20', 'הגשת תביעת ביטוח (אם נדרש)', 'אם היה נזק, פציעה או עיכוב טיסה - הגישו תביעה לחברת הביטוח בהקדם, לרוב יש חלון זמן מוגבל.', 'afterWeek', 4, 'docs', null),
('t21', 'שיתוף חוויות וכתיבת ביקורת', 'דרגו וכתבו חוות דעת על הספקים שעבדתם איתם - זה עוזר לקהילת פאודר קלאב לבחור נכון בפעם הבאה.', 'afterWeek', 6, 'general', null)
on conflict (id) do nothing;

-- ============ הפיכת המשתמש הראשון שלכם למנהל מערכת ============
-- אחרי שנרשמתם לאפליקציה בפעם הראשונה, הריצו את השורה הבאה
-- (עם כתובת המייל שנרשמתם איתה) כדי לקבל הרשאות אדמין:
--
-- update public.profiles set is_admin = true where email = 'you@example.com';
