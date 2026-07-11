"""
מצפן — מנוע ההמלצות (V1: rule engine שקוף).

זהו אותו היגיון בדיוק שנבדק בפרוטוטייפ הקליקבילי (matzpen-app.html), רק
שעכשיו הוא רץ בצד השרת וקורא נתונים אמיתיים ממסד הנתונים במקום ממערכי JS
מקומיים. ראו PRD סעיף 7.3 לגבי איך זה מתפתח ל-V2 (LLM + embeddings).
"""
import json
from datetime import date

REF_DATE = date(2026, 7, 8)


def _parse_iso(d):
    y, m, day = [int(x) for x in d.split("-")]
    return date(y, m, day)


def days_since(iso_date_str, ref=REF_DATE):
    return (ref - _parse_iso(iso_date_str)).days


def score_company(company_row, profile):
    """מחזיר (score:int, reasons:list[str]) — בדיוק כמו scoreCompany() ב-JS."""
    score = 0
    reasons = []
    industries = json.loads(profile["industries"])
    stages = json.loads(profile["stages"])

    if company_row["industry"] in industries:
        score += 50
        reasons.append(f'תואם לתעשייה שסימנת: {company_row["industry"]}')
    if company_row["team_size"] <= profile["team_size_max"]:
        score += 30
        reasons.append(f'צוות של כ-{company_row["team_size"]} עובדים — בטווח שהגדרת (עד {profile["team_size_max"]})')
    if company_row["stage"] in stages:
        score += 20
        reasons.append(f'שלב מימון {company_row["stage"]} — תואם להעדפה שלך')
    return score, reasons


def scored_companies(company_rows, profile):
    out = []
    for c in company_rows:
        score, reasons = score_company(c, profile)
        if score > 0:
            out.append({"company": dict(c), "score": score, "reasons": reasons})
    out.sort(key=lambda x: -x["score"])
    return out


def pipeline_alerts(pipeline_items_with_timeline, threshold_days=7):
    """תהליכים שבסטטוס 'awaiting' וללא עדכון מעבר לסף הימים."""
    alerts = []
    for item in pipeline_items_with_timeline:
        if item["status"] != "awaiting" or not item["timeline"]:
            continue
        last = item["timeline"][-1]
        diff = days_since(last["event_date"])
        if diff >= threshold_days:
            alerts.append({
                "pipeline_item_id": item["id"],
                "name": item["name"],
                "diff_days": diff,
                "last_text": last["text"],
            })
    alerts.sort(key=lambda a: -a["diff_days"])
    return alerts


def followup_recs(contacts_rows, threshold_days=6):
    """קשרים קיימים שהמגע האחרון איתם ישן מהסף — ראו renderFollowUps() בפרוטוטייפ."""
    by_name = {}
    for c in contacts_rows:
        d = _parse_iso(c["contact_date"])
        if c["name"] not in by_name or d > by_name[c["name"]]["date"]:
            by_name[c["name"]] = {"date": d, "context": c["context"], "date_str": c["contact_date"]}
    flagged = []
    for name, info in by_name.items():
        diff = (REF_DATE - info["date"]).days
        if diff >= threshold_days:
            flagged.append({"name": name, "diff_days": diff, "context": info["context"], "date_str": info["date_str"]})
    flagged.sort(key=lambda f: -f["diff_days"])
    return flagged


EVENT_POOL = [
    {"name": "Geektime — לוח אירועי הייטק",
     "desc": "לוח אירועי טכנולוגיה וסטארטאפים בישראל, מתעדכן שוטף — שווה בדיקה שבועית.",
     "link": "https://www.geektime.co.il/event/"},
    {"name": "VC Club — The Sunday Round (המהדורה הבאה)",
     "desc": "השתתפת במהדורה #2 ב-5.7; המערכת תעדכן אוטומטית כשתיפתח הרשמה למהדורה #3.",
     "link": None},
    {"name": "LaStartup — מיטאפים ואירועים ליזמים",
     "desc": "לוח מיטאפים ואירועים בהייטק הישראלי הרלוונטי לתפקידי תפעול וניהול פרויקטים.",
     "link": "https://www.lastartup.co.il/events"},
]
