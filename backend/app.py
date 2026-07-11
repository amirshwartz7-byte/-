"""
מצפן — Flask backend.

הרצה מקומית:
    pip install -r requirements.txt
    python app.py
    # פותחים http://localhost:8420

זהו scaffold ל-MVP כפי שמתואר ב-PRD (מצפן — PRD וארכיטקטורה טכנית, סעיף 7).
שימו לב לשני מקומות שמסומנים במפורש כ-MOCK להלן — הם הנקודות היחידות שדורשות
חשבונות/אישורים חיצוניים אמיתיים (Google Cloud OAuth client מאומת, מפתח API
של ספק נתוני חברות) ולכן לא ניתן להריץ אותם באמת בסביבת פיתוח מקומית.
"""
import json
import os
from datetime import date
from functools import wraps

from flask import Flask, jsonify, request, session, send_from_directory

import db
import recommendations as rec

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.secret_key = os.environ.get("MATZPEN_SECRET_KEY", "dev-only-secret-change-in-production")


def row_to_dict(row):
    return dict(row) if row is not None else None


def require_login(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "not_authenticated"}), 401
        return fn(*args, **kwargs)
    return wrapper


# ---------------------------------------------------------------------------
# Auth
#
# MOCK: בפרודקשן זה יוחלף בזרימת Google OAuth 2.0 אמיתית (ראו PRD סעיף 6.1
# ו-9.2) — מסך הסכמה, קבלת access/refresh token, ואימות ה-scopes המבוקשים
# (Gmail.readonly + Calendar.readonly) מול חשבון Google Cloud מאומת של
# האפליקציה. כאן, לצורך ההדגמה המקומית, אנחנו רק "מתחזים" להתחברות מוצלחת
# ומחזירים את המשתמש שכבר קיים ב-seed data.
# ---------------------------------------------------------------------------
@app.post("/api/auth/mock-login")
def mock_login():
    conn = db.get_conn()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (db.DEMO_EMAIL,)).fetchone()
    conn.close()
    if not user:
        return jsonify({"error": "demo_user_missing"}), 500
    session["user_id"] = user["id"]
    return jsonify({"user": row_to_dict(user), "mock": True,
                     "note": "זהו חיבור מדומה (Mock OAuth) לצורך הדגמה מקומית — לא חיבור אמיתי ל-Google."})


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/me")
@require_login
def me():
    conn = db.get_conn()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()
    conn.close()
    return jsonify({"user": row_to_dict(user)})


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
@app.get("/api/profile")
@require_login
def get_profile():
    conn = db.get_conn()
    p = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (session["user_id"],)).fetchone()
    conn.close()
    if not p:
        return jsonify({"error": "profile_not_found"}), 404
    return jsonify({
        "target_roles": json.loads(p["target_roles"]),
        "industries": json.loads(p["industries"]),
        "stages": json.loads(p["stages"]),
        "team_size_max": p["team_size_max"],
        "location": p["location"],
        "superpower": p["superpower"],
    })


@app.put("/api/profile")
@require_login
def update_profile():
    body = request.get_json(force=True)
    conn = db.get_conn()
    conn.execute(
        "UPDATE profiles SET target_roles=?, industries=?, stages=?, team_size_max=?, location=?, superpower=? "
        "WHERE user_id=?",
        (
            json.dumps(body.get("target_roles", []), ensure_ascii=False),
            json.dumps(body.get("industries", []), ensure_ascii=False),
            json.dumps(body.get("stages", []), ensure_ascii=False),
            int(body.get("team_size_max", 30)),
            body.get("location", ""),
            body.get("superpower", ""),
            session["user_id"],
        ),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
def _load_pipeline(user_id, conn):
    items = conn.execute(
        "SELECT * FROM pipeline_items WHERE user_id=? ORDER BY created_at", (user_id,)
    ).fetchall()
    result = []
    for it in items:
        timeline = conn.execute(
            "SELECT event_date, text FROM timeline_events WHERE pipeline_item_id=? ORDER BY event_date",
            (it["id"],),
        ).fetchall()
        d = row_to_dict(it)
        d["timeline"] = [row_to_dict(t) for t in timeline]
        result.append(d)
    return result


@app.get("/api/pipeline")
@require_login
def get_pipeline():
    conn = db.get_conn()
    items = _load_pipeline(session["user_id"], conn)
    conn.close()
    return jsonify({"items": items})


@app.post("/api/pipeline")
@require_login
def add_pipeline_item():
    """מוסיף חברה לצינור — או מתוך המלצה (company_id) או ידנית (name/role)."""
    body = request.get_json(force=True)
    conn = db.get_conn()
    today = date(2026, 7, 8).isoformat()

    if body.get("company_id"):
        company = conn.execute("SELECT * FROM company_pool WHERE id=?", (body["company_id"],)).fetchone()
        if not company:
            conn.close()
            return jsonify({"error": "company_not_found"}), 404
        existing = conn.execute(
            "SELECT id FROM pipeline_items WHERE user_id=? AND rec_company_id=?",
            (session["user_id"], company["id"]),
        ).fetchone()
        if existing:
            conn.close()
            return jsonify({"error": "already_added"}), 409
        role = f'מועמד לפנייה — {company["founder_role"]} ({company["founder"]})'
        meta = f'מקור: מחקר שוק אוטומטי · {company["source_url"]}'
        cur = conn.execute(
            "INSERT INTO pipeline_items (user_id, rec_company_id, name, role, status, meta, created_at) "
            "VALUES (?, ?, ?, ?, 'candidate', ?, ?)",
            (session["user_id"], company["id"], company["name"], role, meta, today),
        )
        pid = cur.lastrowid
        conn.execute(
            "INSERT INTO timeline_events (pipeline_item_id, event_date, text) VALUES (?, ?, ?)",
            (pid, today, "נוסף לצינור מתוך המלצות המערכת"),
        )
    else:
        cur = conn.execute(
            "INSERT INTO pipeline_items (user_id, rec_company_id, name, role, status, meta, created_at) "
            "VALUES (?, NULL, ?, ?, ?, ?, ?)",
            (session["user_id"], body.get("name", "ללא שם"), body.get("role", ""),
             body.get("status", "applied"), body.get("meta"), today),
        )
        pid = cur.lastrowid
        conn.execute(
            "INSERT INTO timeline_events (pipeline_item_id, event_date, text) VALUES (?, ?, ?)",
            (pid, today, "נוסף ידנית"),
        )

    conn.commit()
    items = _load_pipeline(session["user_id"], conn)
    conn.close()
    return jsonify({"items": items}), 201


@app.put("/api/pipeline/<int:item_id>/status")
@require_login
def update_pipeline_status(item_id):
    body = request.get_json(force=True)
    new_status = body.get("status")
    note = body.get("note", "עדכון סטטוס ידני")
    today = date(2026, 7, 8).isoformat()
    conn = db.get_conn()
    owned = conn.execute(
        "SELECT id FROM pipeline_items WHERE id=? AND user_id=?", (item_id, session["user_id"])
    ).fetchone()
    if not owned:
        conn.close()
        return jsonify({"error": "not_found"}), 404
    conn.execute("UPDATE pipeline_items SET status=? WHERE id=?", (new_status, item_id))
    conn.execute(
        "INSERT INTO timeline_events (pipeline_item_id, event_date, text) VALUES (?, ?, ?)",
        (item_id, today, note),
    )
    conn.commit()
    items = _load_pipeline(session["user_id"], conn)
    conn.close()
    return jsonify({"items": items})


# ---------------------------------------------------------------------------
# Contacts (networking calls / meetings)
# ---------------------------------------------------------------------------
@app.get("/api/contacts")
@require_login
def get_contacts():
    q = request.args.get("q", "").strip()
    conn = db.get_conn()
    if q:
        like = f"%{q}%"
        rows = conn.execute(
            "SELECT * FROM contacts WHERE user_id=? AND (name LIKE ? OR context LIKE ?) "
            "ORDER BY contact_date DESC, id DESC",
            (session["user_id"], like, like),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM contacts WHERE user_id=? ORDER BY contact_date DESC, id DESC",
            (session["user_id"],),
        ).fetchall()
    conn.close()
    return jsonify({"contacts": [row_to_dict(r) for r in rows]})


@app.post("/api/contacts")
@require_login
def add_contact():
    body = request.get_json(force=True)
    today = date(2026, 7, 8).isoformat()
    conn = db.get_conn()
    conn.execute(
        "INSERT INTO contacts (user_id, contact_date, name, channel, context, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (session["user_id"], body.get("date", today), body["name"], body.get("channel", "טלפון"),
         body.get("context", ""), today),
    )
    conn.commit()
    rows = conn.execute(
        "SELECT * FROM contacts WHERE user_id=? ORDER BY contact_date DESC, id DESC", (session["user_id"],)
    ).fetchall()
    conn.close()
    return jsonify({"contacts": [row_to_dict(r) for r in rows]}), 201


# ---------------------------------------------------------------------------
# Networking events, company pool
# ---------------------------------------------------------------------------
@app.get("/api/networking-events")
@require_login
def get_networking_events():
    conn = db.get_conn()
    rows = conn.execute(
        "SELECT * FROM networking_events WHERE user_id=? ORDER BY kind, id", (session["user_id"],)
    ).fetchall()
    conn.close()
    return jsonify({"events": [row_to_dict(r) for r in rows]})


@app.get("/api/companies")
@require_login
def get_companies():
    conn = db.get_conn()
    rows = conn.execute("SELECT * FROM company_pool").fetchall()
    conn.close()
    return jsonify({"companies": [row_to_dict(r) for r in rows]})


# ---------------------------------------------------------------------------
# Recommendations — the core "smart" endpoint
# ---------------------------------------------------------------------------
@app.get("/api/recommendations")
@require_login
def get_recommendations():
    conn = db.get_conn()
    user_id = session["user_id"]

    profile = conn.execute("SELECT * FROM profiles WHERE user_id=?", (user_id,)).fetchone()
    companies = conn.execute("SELECT * FROM company_pool").fetchall()
    pipeline = _load_pipeline(user_id, conn)
    contacts = conn.execute("SELECT * FROM contacts WHERE user_id=?", (user_id,)).fetchall()
    already_added_ids = {p["rec_company_id"] for p in pipeline if p["rec_company_id"]}
    already_contacted = {(c["name"], c["context"]) for c in contacts}

    scored = rec.scored_companies(companies, profile)

    company_cards = []
    for s in scored:
        c = s["company"]
        company_cards.append({
            **c, "score": s["score"], "reasons": s["reasons"],
            "already_added": c["id"] in already_added_ids,
        })

    people_cards = []
    for s in scored[:4]:
        c = s["company"]
        already = any(name == c["founder"] and c["name"] in ctx for (name, ctx) in already_contacted)
        people_cards.append({
            "founder": c["founder"], "founder_role": c["founder_role"], "company_name": c["name"],
            "company_id": c["id"], "industry": c["industry"], "stage": c["stage"],
            "score": s["score"], "already_contacted": already,
        })

    conn.close()
    return jsonify({
        "alerts": rec.pipeline_alerts(pipeline),
        "companies": company_cards,
        "people": people_cards,
        "followups": rec.followup_recs(contacts),
        "events": rec.EVENT_POOL,
    })


# ---------------------------------------------------------------------------
# Activity chart — aggregated for real from timeline_events + contacts dates
# (this is exactly the kind of aggregation a production system would run over
# synced Gmail/Calendar rows — see PRD section 6.1)
# ---------------------------------------------------------------------------
@app.get("/api/activity")
@require_login
def get_activity():
    conn = db.get_conn()
    user_id = session["user_id"]
    pipeline_ids = [p["id"] for p in conn.execute(
        "SELECT id FROM pipeline_items WHERE user_id=?", (user_id,)
    ).fetchall()]

    counts = {}
    if pipeline_ids:
        placeholders = ",".join("?" * len(pipeline_ids))
        rows = conn.execute(
            f"SELECT event_date, COUNT(*) as n FROM timeline_events "
            f"WHERE pipeline_item_id IN ({placeholders}) GROUP BY event_date",
            pipeline_ids,
        ).fetchall()
        for r in rows:
            counts[r["event_date"]] = counts.get(r["event_date"], 0) + r["n"]

    rows = conn.execute(
        "SELECT contact_date, COUNT(*) as n FROM contacts WHERE user_id=? GROUP BY contact_date",
        (user_id,),
    ).fetchall()
    for r in rows:
        counts[r["contact_date"]] = counts.get(r["contact_date"], 0) + r["n"]
    conn.close()

    series = [{"date": d, "count": n} for d, n in sorted(counts.items())]
    return jsonify({"series": series})


# ---------------------------------------------------------------------------
# Frontend static files
# ---------------------------------------------------------------------------
@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


# מאותחל ברמת המודול (לא רק בתוך __main__) כדי שגם שרתי WSGI בפרודקשן
# (gunicorn וכו', שמייבאים את app.py כמודול ולא מריצים אותו כסקריפט) ייצרו
# את הטבלאות/נתוני ה-seed באתחול, ולא רק בהרצה מקומית עם `python app.py`.
db.init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8420))
    print(f"מצפן רץ על http://localhost:{port}")
    debug_mode = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
