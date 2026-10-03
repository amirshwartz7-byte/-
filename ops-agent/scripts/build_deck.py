#!/usr/bin/env python3
"""Build a self-contained HTML slide deck from slides.md.

Usage: python3 scripts/build_deck.py <path/to/slides.md> [output.html]

Syntax is documented in templates/slides-template.md. No dependencies.
"""
import html
import re
import sys
from pathlib import Path

HEBREW = re.compile(r"[\u0590-\u05FF]")


def inline(text: str) -> str:
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`(.+?)`", r"<code>\1</code>", text)
    text = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2">\1</a>', text)
    return text


def parse_front_matter(src: str):
    meta = {}
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", src, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        src = src[m.end():]
    return meta, src


def split_row(line: str):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def render_body(lines):
    out, i = [], 0
    while i < len(lines):
        line = lines[i].rstrip()
        s = line.strip()
        if not s:
            i += 1
            continue
        if s.startswith("[[kpi:"):
            cards = []
            while i < len(lines) and lines[i].strip().startswith("[[kpi:"):
                parts = [p.strip() for p in lines[i].strip()[6:].rstrip("]").split("|")]
                value, label = parts[0], parts[1] if len(parts) > 1 else ""
                note = parts[2] if len(parts) > 2 else ""
                cards.append(
                    f'<div class="kpi"><div class="kpi-v">{inline(value)}</div>'
                    f'<div class="kpi-l">{inline(label)}</div>'
                    + (f'<div class="kpi-n">{inline(note)}</div>' if note else "")
                    + "</div>"
                )
                i += 1
            out.append(f'<div class="kpis">{"".join(cards)}</div>')
            continue
        if s.startswith("[[flow:"):
            steps = [p.strip() for p in s[7:].rstrip("]").split(">") if p.strip()]
            items = "".join(
                f'<div class="step"><span class="n">{n}</span>{inline(t)}</div>'
                for n, t in enumerate(steps, 1)
            )
            out.append(f'<div class="flow">{items}</div>')
            i += 1
            continue
        if s.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            header = split_row(rows[0])
            body = [r for r in rows[1:] if not re.match(r"^\s*\|?[\s:\-|]+\|?\s*$", r)]
            th = "".join(f"<th>{inline(c)}</th>" for c in header)
            trs = "".join(
                "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in split_row(r)) + "</tr>"
                for r in body
            )
            out.append(f"<table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>")
            continue
        if re.match(r"^[-*] ", s):
            items = []
            while i < len(lines) and re.match(r"^\s*[-*] ", lines[i]):
                items.append(f"<li>{inline(lines[i].strip()[2:])}</li>")
                i += 1
            out.append(f"<ul>{''.join(items)}</ul>")
            continue
        if re.match(r"^\d+[.)] ", s):
            items = []
            while i < len(lines) and re.match(r"^\s*\d+[.)] ", lines[i]):
                text = re.sub(r"^\s*\d+[.)] ", "", lines[i])
                items.append(f"<li>{inline(text)}</li>")
                i += 1
            out.append(f"<ol>{''.join(items)}</ol>")
            continue
        if s.startswith(">"):
            out.append(f'<div class="callout">{inline(s.lstrip("> ").strip())}</div>')
        elif s.startswith("^"):
            out.append(f'<div class="foot">{inline(s[1:].strip())}</div>')
        elif s.startswith("## "):
            out.append(f"<h3>{inline(s[3:])}</h3>")
        else:
            out.append(f"<p>{inline(s)}</p>")
        i += 1
    return "\n".join(out)


def build(src_text: str) -> str:
    meta, body = parse_front_matter(src_text)
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
    chunks = re.split(r"^\s*---\s*$", body, flags=re.M)
    title = meta.get("title", "מצגת")
    rtl = bool(HEBREW.search(src_text))

    slides = [
        '<section class="slide cover"><div class="inner">'
        f"<h1>{inline(title)}</h1>"
        + (f'<p class="sub">{inline(meta["subtitle"])}</p>' if meta.get("subtitle") else "")
        + (f'<p class="date">{inline(meta["date"])}</p>' if meta.get("date") else "")
        + "</div></section>"
    ]
    for chunk in chunks:
        lines = chunk.strip("\n").splitlines()
        if not any(l.strip() for l in lines):
            continue
        heading = ""
        for idx, l in enumerate(lines):
            if l.strip().startswith("# "):
                heading = l.strip()[2:]
                lines = lines[:idx] + lines[idx + 1:]
                break
        slides.append(
            '<section class="slide"><div class="inner">'
            + (f"<h2>{inline(heading)}</h2>" if heading else "")
            + f'<div class="content">{render_body(lines)}</div></div></section>'
        )

    total = len(slides)
    return TEMPLATE.format(
        lang="he" if rtl else "en",
        dir="rtl" if rtl else "ltr",
        title=html.escape(title),
        slides="\n".join(slides),
        total=total,
    )


TEMPLATE = """<!doctype html>
<html lang="{lang}" dir="{dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
:root {{
  --bg:#f4f6fa; --card:#ffffff; --ink:#14213d; --muted:#5b6475; --accent:#2251d1;
  --accent-soft:#e7edfc; --line:#dde2ec;
}}
@media (prefers-color-scheme: dark) {{
  :root {{ --bg:#0f141c; --card:#171e2a; --ink:#e8ecf3; --muted:#9aa4b5; --accent:#7ea2ff;
          --accent-soft:#1e2a44; --line:#2a3344; }}
}}
* {{ box-sizing:border-box; }}
html,body {{ margin:0; height:100%; background:var(--bg); color:var(--ink);
  font-family:"Segoe UI","Heebo","Assistant",system-ui,-apple-system,Arial,sans-serif; }}
.slide {{ display:none; position:fixed; inset:0; padding:clamp(16px,4vw,56px); }}
.slide.active {{ display:flex; align-items:center; justify-content:center; }}
.inner {{ width:min(1100px,100%); max-height:100%; overflow:auto; background:var(--card);
  border-radius:20px; padding:clamp(20px,4vw,56px); box-shadow:0 10px 40px rgba(20,33,61,.08);
  border-top:6px solid var(--accent); }}
h1 {{ font-size:clamp(28px,5vw,52px); margin:0 0 12px; line-height:1.15; }}
h2 {{ overflow-wrap:anywhere; font-size:clamp(22px,3.2vw,36px); margin:0 0 24px; line-height:1.2; }}
h3 {{ font-size:20px; color:var(--accent); margin:18px 0 8px; }}
.cover .inner {{ text-align:center; padding:clamp(40px,8vw,96px) 24px; }}
.sub {{ font-size:clamp(17px,2.2vw,24px); color:var(--muted); margin:0; }}
.date {{ color:var(--muted); margin-top:28px; font-size:15px; }}
p, li {{ font-size:clamp(16px,1.9vw,22px); line-height:1.55; }}
ul, ol {{ padding-inline-start:1.3em; margin:8px 0; }}
li {{ margin:8px 0; }}
li::marker {{ color:var(--accent); font-weight:700; }}
strong {{ color:var(--accent); }}
code {{ background:var(--accent-soft); padding:1px 6px; border-radius:6px; font-size:.9em; }}
a {{ color:var(--accent); }}
table {{ width:100%; border-collapse:collapse; margin:12px 0; font-size:clamp(14px,1.6vw,18px); }}
th {{ background:var(--accent-soft); text-align:start; }}
th, td {{ padding:10px 12px; border-bottom:1px solid var(--line); text-align:start; vertical-align:top; }}
.kpis {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr)); gap:16px; margin:12px 0 20px; }}
.kpi {{ background:var(--accent-soft); border-radius:16px; padding:22px; }}
.kpi-v {{ font-size:clamp(30px,4.5vw,48px); font-weight:800; color:var(--accent); line-height:1.1; }}
.kpi-l {{ font-size:17px; margin-top:6px; font-weight:600; }}
.kpi-n {{ font-size:14px; color:var(--muted); margin-top:4px; }}
.flow {{ display:flex; flex-wrap:wrap; gap:12px; margin:12px 0 20px; }}
.step {{ flex:1 1 min(140px,100%); background:var(--accent-soft); border-radius:14px; padding:16px; font-weight:600;
  font-size:clamp(15px,1.7vw,19px); position:relative; }}
.step .n {{ display:inline-grid; place-items:center; width:28px; height:28px; border-radius:50%;
  background:var(--accent); color:var(--card); font-size:14px; margin-inline-end:8px; }}
.callout {{ border-inline-start:5px solid var(--accent); background:var(--accent-soft); padding:14px 18px;
  border-radius:10px; font-size:clamp(16px,1.9vw,21px); margin:16px 0; font-weight:600; }}
.foot {{ color:var(--muted); font-size:13px; margin-top:20px; }}
.bar {{ position:fixed; bottom:0; inset-inline:0; height:4px; background:var(--line); }}
.bar i {{ display:block; height:100%; background:var(--accent); transition:width .25s; }}
.nav {{ position:fixed; bottom:14px; inset-inline-end:18px; display:flex; gap:8px; align-items:center;
  color:var(--muted); font-size:14px; }}
.nav button {{ border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:10px;
  width:38px; height:38px; font-size:18px; cursor:pointer; }}
@media print {{
  .slide {{ display:flex !important; position:relative; height:100vh; page-break-after:always; }}
  .nav, .bar {{ display:none; }}
  .inner {{ box-shadow:none; }}
}}
</style>
</head>
<body>
{slides}
<div class="bar"><i id="bar"></i></div>
<div class="nav"><button id="prev" aria-label="הקודם">&#8250;</button>
<span id="count" dir="ltr"></span><button id="next" aria-label="הבא">&#8249;</button></div>
<script>
(function () {{
  var slides = document.querySelectorAll('.slide'), i = 0, total = {total};
  var rtl = document.documentElement.dir === 'rtl';
  if (!rtl) {{ document.getElementById('prev').innerHTML = '&#8249;'; document.getElementById('next').innerHTML = '&#8250;'; }}
  function show(n) {{
    i = Math.max(0, Math.min(total - 1, n));
    slides.forEach(function (s, k) {{ s.classList.toggle('active', k === i); }});
    document.getElementById('count').textContent = (i + 1) + ' / ' + total;
    document.getElementById('bar').style.width = ((i + 1) / total * 100) + '%';
    try {{ history.replaceState(null, '', '#' + (i + 1)); }} catch (e) {{}}
  }}
  document.getElementById('next').onclick = function () {{ show(i + 1); }};
  document.getElementById('prev').onclick = function () {{ show(i - 1); }};
  document.addEventListener('keydown', function (e) {{
    var fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd || e.key === ' ' || e.key === 'PageDown') show(i + 1);
    if (e.key === back || e.key === 'PageUp') show(i - 1);
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(total - 1);
  }});
  var x0 = null;
  document.addEventListener('touchstart', function (e) {{ x0 = e.touches[0].clientX; }});
  document.addEventListener('touchend', function (e) {{
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) < 40) return;
    var forward = rtl ? dx > 0 : dx < 0;
    show(i + (forward ? 1 : -1));
  }});
  show((parseInt(location.hash.slice(1), 10) || 1) - 1);
}})();
</script>
</body>
</html>
"""


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: build_deck.py <slides.md> [output.html]")
    src = Path(sys.argv[1])
    dest = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_name("presentation.html")
    dest.write_text(build(src.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"built {dest}")


if __name__ == "__main__":
    main()
