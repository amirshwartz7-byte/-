# מצפן — MVP ריצתי

זהו יישום ה-MVP בפועל של "מצפן" (ראו `matzpen-prd.docx` שקיבלת קודם) — **לא עוד פרוטוטייפ סטטי, אלא backend אמיתי + מסד נתונים אמיתי + REST API אמיתי**, עם frontend שמדבר איתם דרך `fetch()`. ההבדל המרכזי מהפרוטוטייפ הקליקבילי הראשון: **הנתונים נשמרים בפועל** — תוסיף חברה לצינור, תסגור את הדפדפן, תפעיל מחדש את השרת, והיא עדיין שם. זה נבדק בפועל (הריגה מלאה של תהליך השרת + הפעלה מחדש) לפני המסירה.

## הרצה מקומית

```bash
./run.sh
```
זה יוצר virtualenv, מתקין את Flask, ומריץ את השרת על `http://localhost:8420`. פותחים את הכתובת בדפדפן ולוחצים "התחבר עם Google (Demo)".

או ידנית:
```bash
cd backend
pip install -r requirements.txt
python app.py
```

בהפעלה ראשונה נוצר קובץ `backend/matzpen.db` (SQLite) עם נתוני seed — בדיוק הנתונים האמיתיים שנשלפו מה-Gmail וה-Calendar בתהליך העבודה המקורי (9 תהליכי גיוס, 18 שיחות נטוורקינג, 6 אירועים, 5 חברות מומלצות). למחיקה ואיפוס: פשוט מוחקים את `backend/matzpen.db` ומריצים שוב.

## מבנה הפרויקט

```
matzpen-fullapp/
  backend/
    app.py              # Flask app — כל ה-routes של ה-REST API
    db.py                # סכימת SQLite + seed data
    recommendations.py   # מנוע ההמלצות (rule engine) — לוגיקה טהורה, ניתנת לבדיקה
    requirements.txt
  frontend/
    index.html           # SPA אחד (HTML+CSS+JS וניל, ללא build step) שמדבר עם ה-API
  run.sh                  # סקריפט הרצה נוח
  .env.example            # אילו משתני סביבה יידרשו כשמחברים אינטגרציות אמיתיות
  matzpen-prd.docx         # מסמך ה-PRD המלא (נמסר בנפרד קודם לכן)
```

## מה אמיתי כאן, ומה עדיין Mock

**אמיתי ורץ בפועל:**
- Flask REST API עם endpoints אמיתיים (`/api/profile`, `/api/pipeline`, `/api/contacts`, `/api/recommendations` ועוד).
- מסד נתונים SQLite אמיתי עם 7 טבלאות (users, profiles, pipeline_items, timeline_events, contacts, networking_events, company_pool) — תואם ישירות למודל הנתונים שבפרק 8 ב-PRD.
- מנוע המלצות (rule engine) שרץ בצד השרת ולא בדפדפן — התראות פולואפ, ציוני התאמה, ופולואפ מומלץ מחושבים מ-SQL אמיתי, לא ממערכים מוזרקים ב-JS.
- גרף "עומס פעילות" בדשבורד מחושב דינמית מצירי הזמן האמיתיים בטבלאות (לא נתון קבוע).
- ניהול session אמיתי (Flask session + cookie) עם endpoint מוגן (`@require_login`) — הבסיס לתמיכה ברב-משתמשים.

**Mock, מסומן במפורש בקוד וב-UI, ודורש חשבונות/אישורים חיצוניים כדי להפוך לאמיתי:**
1. **התחברות** — כפתור "התחבר עם Google (Demo)" מדמה כניסה מוצלחת. כדי שזה יהיה חיבור Google OAuth 2.0 אמיתי (Gmail.readonly + Calendar.readonly), צריך: פרויקט מאומת ב-Google Cloud Console, ותהליך אימות מלא כולל **CASA Security Assessment** (ראו PRD סעיף 9.2) — זהו תהליך רגולטורי-אבטחתי שיכול לקחת שבועות עד חודשים, ואי אפשר "לעקוף" אותו בקוד.
2. **מאגר החברות** — 5 חברות אמיתיות שנחקרו ואומתו ידנית (Octup, Tangos AI, Fig Security, Blocks DIY, Above Security), קבועות ב-`db.py`. כדי שזה יהיה מאגר חי ומתעדכן, צריך מפתח API בתשלום מספק כמו Harmonic.ai / Crunchbase / Apollo.io (ראו PRD סעיף 14 להערכת עלויות).

כל שאר הקוד — ה-API, מודל הנתונים, מנוע ההמלצות, ה-UI — **אינו** Mock ואפשר לבנות עליו ישירות.

## המשך טבעי (לפי מפת הדרכים ב-PRD)

1. להחליף את `/api/auth/mock-login` בזרימת Google OAuth אמיתית (יש כבר placeholder ב-`.env.example`).
2. להחליף את הקריאה הסטטית ל-`company_pool` בקריאה חיה ל-API של ספק נתוני חברות, עם job מתוזמן שמרענן את הטבלה.
3. להעביר את ה-DB מ-SQLite ל-PostgreSQL מנוהל (שינוי מקומי ב-`db.py` בלבד — שאר הקוד לא ידע את ההבדל).
4. V2: להוסיף שכבת LLM (Claude API) מעל `recommendations.py` להסברים בשפה טבעית וניקוד סמנטי (embeddings).

## המשך פיתוח ב-Claude Code

הפרויקט הזה נבנה בסביבת Cowork מבודדת שאין לה גישת רשת לפרוס כתובת אינטרנט
ציבורית. כדי להמשיך מכאן — להריץ, לבדוק, ולפרוס בפועל לכתובת חיה (למשל
Render/Railway) — פתח את התיקייה הזו ב-Claude Code על המחשב שלך, ותן לו
לקרוא את `CLAUDE_CODE_PROMPT.md`: הוא כולל תדריך מלא על מצב הפרויקט, מה
Mock ומה אמיתי, ורשימת צעדים מסודרת (הרצה מקומית → git → פריסה → שיפורים
אופציונליים). יש כבר `Procfile` מוכן לפריסה עם gunicorn.
