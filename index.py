from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import json
import random
from datetime import datetime
import config

app = Flask(__name__)

PHOTOS_DIR = os.path.join("static", "photos")
MUSIC_DIR = os.path.join("static", "music")
WISHES_FILE = "wishes.json"
STATS_FILE = "stats.json"


# ---------- Утилиты ----------
def load_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default
    return default


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_photos():
    """Список фото в папке static/photos."""
    if not os.path.isdir(PHOTOS_DIR):
        return []
    exts = (".jpg", ".jpeg", ".png", ".gif", ".webp")
    files = sorted(
        f for f in os.listdir(PHOTOS_DIR)
        if f.lower().endswith(exts)
    )
    return [f"/static/photos/{f}" for f in files]


def get_music():
    """Файл музыки, если есть."""
    if not os.path.isdir(MUSIC_DIR):
        return None
    if os.path.exists(os.path.join(MUSIC_DIR, config.MUSIC_FILE)):
        return f"/static/music/{config.MUSIC_FILE}"
    return None


def days_until_birthday():
    try:
        bd = datetime.strptime(config.BIRTHDAY_DATE, "%Y-%m-%d")
    except ValueError:
        return None
    today = datetime.now()
    next_bd = bd.replace(year=today.year)
    if next_bd < today.replace(hour=0, minute=0, second=0, microsecond=0):
        next_bd = next_bd.replace(year=today.year + 1)
    return (next_bd.date() - today.date()).days


# ---------- Маршруты ----------
@app.route("/")
def index():
    # счётчик просмотров
    stats = load_json(STATS_FILE, {"views": 0})
    stats["views"] += 1
    stats["last_view"] = datetime.now().isoformat()
    save_json(STATS_FILE, stats)

    return render_template(
        "index.html",
        friend_name=config.FRIEND_NAME,
        your_name=config.YOUR_NAME,
        photos=get_photos(),
        music=get_music(),
        slide_interval=config.SLIDE_INTERVAL,
        days_left=days_until_birthday(),
        views=stats["views"],
    )


@app.route("/api/photos")
def api_photos():
    return jsonify({"photos": get_photos()})


@app.route("/api/wishes", methods=["GET", "POST"])
def api_wishes():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        author = (data.get("author") or "Гость").strip()[:50]
        if not text:
            return jsonify({"ok": False, "error": "Пустое пожелание"}), 400

        wishes = load_json(WISHES_FILE, [])
        wishes.append({
            "author": author,
            "text": text[:500],
            "date": datetime.now().strftime("%d.%m.%Y %H:%M")
        })
        save_json(WISHES_FILE, wishes)
        return jsonify({"ok": True, "wishes": wishes})

    wishes = load_json(WISHES_FILE, [])
    return jsonify({"wishes": wishes})


@app.route("/api/stats")
def api_stats():
    return jsonify(load_json(STATS_FILE, {"views": 0}))


# ---------- Служебное ----------
@app.route("/favicon.ico")
def favicon():
    return "", 204


if __name__ == "__main__":
    print(f"🎂 Сервер запущен для {config.FRIEND_NAME}!")
    print(f"📷 Найдено фото: {len(get_photos())}")
    print(f"🎵 Музыка: {'есть' if get_music() else 'нет'}")
    print("🌐 Открой http://127.0.0.1:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)