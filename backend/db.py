"""
מצפן — שכבת גישה למסד הנתונים (SQLite לצורך הדגמה מקומית).

בפרודקשן (ראו PRD, סעיף 7.1) המלצתנו היא PostgreSQL מנוהל. משתמשים כאן ב-SQLite
כדי שהאפליקציה תרוץ בלי תלות בשירות חיצוני, אבל כל הגישה למסד עוברת דרך
הפונקציות בקובץ הזה בלבד — כך שהחלפה ל-Postgres בעתיד היא שינוי מקומי אחד
(swap ל-psycopg2 / SQLAlchemy) ולא רה-כתיבה של כל ה-routes.
"""
import sqlite3
import json
import os
from datetime import date

DB_PATH = os.path.join(os.path.dirname(__file__), "matzpen.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    target_roles TEXT NOT NULL,      -- JSON array
    industries TEXT NOT NULL,        -- JSON array
    stages TEXT NOT NULL,            -- JSON array
    team_size_max INTEGER NOT NULL,
    location TEXT,
    superpower TEXT
);

CREATE TABLE IF NOT EXISTS pipeline_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    rec_company_id TEXT,             -- links back to company_pool.id if added from recommendations
    name TEXT NOT NULL,
    role TEXT,
    status TEXT NOT NULL,            -- applied | interviewing | awaiting | rejected | explore | candidate
    meta TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_item_id INTEGER NOT NULL REFERENCES pipeline_items(id),
    event_date TEXT NOT NULL,        -- ISO yyyy-mm-dd
    text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    contact_date TEXT NOT NULL,      -- ISO yyyy-mm-dd
    name TEXT NOT NULL,
    channel TEXT NOT NULL,
    context TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS networking_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    when_text TEXT NOT NULL,
    location TEXT,
    kind TEXT NOT NULL,              -- past | future
    status_tag TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company_pool (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    stage TEXT NOT NULL,
    team_size INTEGER NOT NULL,
    founder TEXT NOT NULL,
    founder_role TEXT NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT NOT NULL
);
"""

DEMO_EMAIL = "amirshwartz7@gmail.com"
REF_DATE = date(2026, 7, 8)  # "today" for the seeded demo dataset


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(reset=False):
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    fresh = not os.path.exists(DB_PATH)
    conn = get_conn()
    conn.executescript(SCHEMA)
    conn.commit()
    if fresh:
        _seed(conn)
    conn.close()


def _seed(conn):
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO users (email, name, created_at) VALUES (?, ?, ?)",
        (DEMO_EMAIL, "עמיר שוורץ", REF_DATE.isoformat()),
    )
    user_id = cur.lastrowid

    cur.execute(
        "INSERT INTO profiles (user_id, target_roles, industries, stages, team_size_max, location, superpower) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            user_id,
            json.dumps(["VP Operations", "COO", "Director of Operations", "Head of PMO"], ensure_ascii=False),
            json.dumps(["E-commerce ולוגיסטיקה", "RegTech / FinCrime", "סייבר", "AI / no-code"], ensure_ascii=False),
            json.dumps(["Pre-Seed", "Seed"], ensure_ascii=False),
            30,
            "מרכז / תל אביב (היברידי בסדר)",
            "זרוע ביצועית תפעולית: נכנס לבלגן וחוסר ודאות, בונה תהליכי עבודה (Agile/Scrum), "
            "מסנכרן ממשקים מורכבים (מוצר, שיווק, דאטה) ומוביל צוותים גדולים.",
        ),
    )

    pipeline_seed = [
        ("agora", "Agora", "Director of Accounting Services Operations", "awaiting",
         "ההליך המתקדם ביותר כרגע · איש קשר: מור אלקובי",
         [("2026-06-25", "תיאום ראיון טלפוני"),
          ("2026-07-01", "ראיון טלפוני עם מור אלקובי"),
          ("2026-07-07", "ראיון וידאו סבב 2 (זיו פלינט-גור, שגיא גדעכט)")]),
        ("seatpick", "SeatPick", "תפקיד לא צוין (כיוון Business/Operations)", "awaiting",
         "לא התקבל עדכון מאז הראיון",
         [("2026-06-24", "ראיון 30 דק׳ עם מאיה א׳")]),
        ("buildots", "Buildots", "תפקיד לא צוין", "interviewing",
         "הראיון הקרוב הבא ביומן",
         [("2026-07-15", "שיחת טלפון עם אלה נחושתן")]),
        ("gong", "Gong", "Director, Operational Excellence", "applied", None,
         [("2026-07-08", "אישור הגשה התקבל")]),
        ("ship4wd", "ship4wd", "VP of Operations & Customer Success", "applied", None,
         [("2026-06-25", "המועמדות הוגשה")]),
        ("arpeely", "Arpeely", "Chief Operating Officer", "applied", None,
         [("2026-06-25", "המועמדות הוגשה")]),
        ("elta", "אלתא (AEW)", "ראש/ת פרויקט עסקי למטוסי AEW", "rejected", None,
         [("2026-07-01", "התקבלה תשובת דחייה")]),
        ("overwolf", "Overwolf", "פגישה עם אבנר פלורנטל — לא משרה פורמלית", "explore", None,
         [("2026-07-05", "שיחה ראשונית"), ("2026-07-08", "פגישה פרונטלית, מגדל ספיר רמת גן")]),
        ("unknown-miki", "חברה לא ידועה", "איש קשר: מיקי שחם", "awaiting", None,
         [("2026-06-24", "ראיון")]),
    ]
    for rec_id, name, role, status, meta, timeline in pipeline_seed:
        cur.execute(
            "INSERT INTO pipeline_items (user_id, rec_company_id, name, role, status, meta, created_at) "
            "VALUES (?, NULL, ?, ?, ?, ?, ?)",
            (user_id, name, role, status, meta, timeline[0][0]),
        )
        pid = cur.lastrowid
        for d, text in timeline:
            cur.execute(
                "INSERT INTO timeline_events (pipeline_item_id, event_date, text) VALUES (?, ?, ?)",
                (pid, d, text),
            )

    contacts_seed = [
        ("2026-06-28", "גיל סוכר", "טלפון", "שיחת היכרות"),
        ("2026-06-29", "איתמר אסף", "טלפון", "ייעוץ קריירה (קהילת בוגרים) — התקבל מייל תודה עם תובנות"),
        ("2026-06-30", "חן (יאנאי)", "טלפון", "שיחה"),
        ("2026-07-02", "ג׳אקו", "זום", "שיחה"),
        ("2026-07-04", "אורני איזקסון", "מייל", "ניסיון חידוש קשר — לשכת מסחר ישראל-נורווגיה"),
        ("2026-07-05", "יעל זהבי", "טלפון", "שיחה"),
        ("2026-07-05", "אבנר פלורנטל", "טלפון", "שיחה ראשונית (Overwolf) — הובילה לפגישה ב-8.7"),
        ("2026-07-06", "רונה רום", "טלפון", "שיחה"),
        ("2026-07-06", "אביה", "טלפון", "שיחה"),
        ("2026-07-06", "נויה קרמר", "טלפון", "שיחה"),
        ("2026-07-06", "שיר דנאי", "טלפון", "ארגון בוגרים"),
        ("2026-07-06", "נדב זימלס", "טלפון", "שיחה"),
        ("2026-07-06", "שרון קליינמן", "טלפון", "שיחה"),
        ("2026-07-07", "ברק איילון", "טלפון", "ייעוץ קורות חיים — התקבל משוב מפורט"),
        ("2026-07-07", "גיל סוכר", "טלפון", "שיחה נוספת"),
        ("2026-07-08", "עומר שדיב", "פגישה", "קפה"),
        ("2026-07-08", "אמיר זיו", "פגישה", "ישיבה"),
        ("2026-07-08", "אבנר פלורנטל", "פגישה", "פגישה פרונטלית, מגדל ספיר רמת גן"),
    ]
    for d, name, channel, context in contacts_seed:
        cur.execute(
            "INSERT INTO contacts (user_id, contact_date, name, channel, context, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, d, name, channel, context, d),
        )

    events_seed = [
        ("Reichman Business Society: Trajectories", "24.6.2026, 19:30–21:30", "אוניברסיטת רייכמן, הרצליה", "past", "השתתפת"),
        ("BizTec Demo Day", "5.7.2026, 16:30", "הטכניון", "past", "השתתפת"),
        ("The Sunday Round #2 — Building New Realities (VC Club)", "5.7.2026, 18:00–20:30", "לאונרדו דה וינצי 2, תל אביב", "past", "השתתפת"),
        ("People First: Building A Strong Foundation", "12.7.2026 (יום ראשון), 09:30", 'משרדי monday.com, יצחק שדה 6, ת"א, קומה 34', "future", "אושרה השתתפות"),
        ("הרצאת BizTec — קניין רוחני למיזמי AI", "תאריך מדויק לא צוין במייל ההרשמה (נרשם 8.7)", "כדאי לוודא תאריך ביומן", "future", "נרשמת"),
        ("Amir <> Yotam — Intro", "26.7.2026, 11:00–11:30", "הזמנה משולח (bazak.ai) — טרם אושרה ביומן", "future", "ממתין לאישור"),
    ]
    for title, when_text, loc, kind, tag in events_seed:
        cur.execute(
            "INSERT INTO networking_events (user_id, title, when_text, location, kind, status_tag) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, title, when_text, loc, kind, tag),
        )

    companies_seed = [
        ("octup", "Octup", "E-commerce ולוגיסטיקה", "Pre-Seed", 8, "אלון פרטוק", "CEO ומייסד שותף",
         'פלטפורמת דאטה ל-e-commerce שמזהה "דליפות תפעוליות" מלוגיסטיקה, מחסן ושירות לקוחות באמצעות ML ו-NLP.',
         "https://www.geektime.co.il/octup-raises-pre-seed-round/"),
        ("tangos", "Tangos AI", "RegTech / FinCrime", "Seed", 20, "איל אזולאי", "מייסד (יזם סדרתי, 3 אקזיטים קודמים)",
         "פלטפורמת AI לאוטומציה של חקירות פשעי כספים מורכבות — הלבנת הון, הונאה, תאימות סנקציות.",
         "https://www.calcalistech.com/ctechnews/article/rk8uoy9mze"),
        ("fig", "Fig Security", "סייבר", "Seed", 25, "גל שפיר", "CEO ומייסד שותף",
         "מערכת שמזהה פערים בתשתיות אבטחת סייבר (SIEM, SecOps, אוטומציה) ומספקת פתרונות קונקרטיים.",
         "https://www.geektime.co.il/fig-security-comes-out-of-stealth-with-38m-in-funding/"),
        ("blocks", "Blocks DIY", "AI / no-code", "Seed", 18, "מיכל לופו", "מייסדת שותפה (בכירה לשעבר ב-monday.com)",
         "פלטפורמת AI לבניית כלים וסוכנים חכמים ללא צורך בקוד.",
         "https://www.calcalistech.com/ctechnews/article/p9n9w144o"),
        ("above", "Above Security", "סייבר", "Seed", 12, "אביב נחום", "מייסד שותף",
         "פלטפורמת AI לזיהוי ותגובה לאיומי Insider בארגונים.",
         "https://www.calcalistech.com/ctechnews/article/p9n9w144o"),
    ]
    for cid, name, industry, stage, team, founder, frole, desc, src in companies_seed:
        cur.execute(
            "INSERT OR IGNORE INTO company_pool (id, name, industry, stage, team_size, founder, founder_role, description, source_url) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (cid, name, industry, stage, team, founder, frole, desc, src),
        )

    conn.commit()
