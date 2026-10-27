import os
import re
import sys
import time
import json
import threading
import urllib.request
import urllib.parse
import subprocess
from http.server import SimpleHTTPRequestHandler, HTTPServer

BOT_TOKEN = "8394907443:AAGOJEcA7SLdfG8MEMP_3fNPeWOD8wqPmHo"
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
PORT = 8080
WWW_DIR = os.path.join(os.path.dirname(__file__), "app", "src", "main", "assets", "www")

WEB_APP_URL = ""

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WWW_DIR, **kwargs)

    def log_message(self, format, *args):
        pass

def start_http_server():
    server = HTTPServer(('0.0.0.0', PORT), CustomHTTPRequestHandler)
    print(f"  Local Web Server running at http://localhost:{PORT}")
    server.serve_forever()

def telegram_api(method, payload=None):
    url = f"{API_URL}/{method}"
    headers = {'Content-Type': 'application/json; charset=utf-8'}
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Telegram API Error ({method}): {e}")
        return None

def set_bot_menu_and_commands(web_url):
    # Set Menu Button
    menu_payload = {
        "menu_button": {
            "type": "web_app",
            "text": "🛍 Do'konni ochish",
            "web_app": {
                "url": web_url
            }
        }
    }
    res_menu = telegram_api("setChatMenuButton", menu_payload)

    # Set Commands
    commands_payload = {
        "commands": [
            {"command": "start", "description": "Do'konni ochish"},
            {"command": "help", "description": "Yordam va ma'lumot"}
        ]
    }
    res_cmd = telegram_api("setMyCommands", commands_payload)
    if res_menu and res_menu.get("ok"):
        print(f"  Telegram Bot Menu Button va buyruqlar sozlandi! WebApp: {web_url}")

def handle_update(update):
    message = update.get("message")
    if not message:
        return

    chat_id = message.get("chat", {}).get("id")
    text = message.get("text", "")
    user_first_name = message.get("from", {}).get("first_name", "Foydalanuvchi")

    if not chat_id:
        return

    print(f"📩 [{chat_id}] {user_first_name}: {text}")

    if text.startswith("/start"):
        reply_text = (
            f"Assalomu alaykum, <b>{user_first_name}</b>! 👋\n\n"
            f"<b>BREND STORE</b> rasmiy Telegram do'koniga xush kelibsiz! 🛍\n\n"
            f"Siz bu yerda eng so'nggi va sifatli mahsulotlarni qulay narxlarda harid qilishingiz mumkin.\n\n"
            f"Do'konni ochish uchun pastdagi <b>\"🛍 Do'konni ochish\"</b> tugmasini bosing:"
        )

        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "🛍 Do'konni ochish",
                        "web_app": {"url": WEB_APP_URL}
                    }
                ]
            ]
        }

        telegram_api("sendMessage", {
            "chat_id": chat_id,
            "text": reply_text,
            "parse_mode": "HTML",
            "reply_markup": reply_markup
        })

    elif text.startswith("/help"):
        reply_text = (
            "ℹ️ <b>Yordam bo'limi</b>\n\n"
            "Do'kondan foydalanish uchun <b>\"🛍 Do'konni ochish\"</b> tugmasini bosing.\n"
            "Mahsulotlarni tanlang va savatchaga qo'shing. Buyurtma berish tugmasini bossangiz, buyurtmangiz qabul qilinadi!"
        )
        telegram_api("sendMessage", {
            "chat_id": chat_id,
            "text": reply_text,
            "parse_mode": "HTML"
        })

def poll_updates():
    offset = 0
    print("\n Telegram Bot faol! Telegram'da botga kirib /start bosing.\n")
    while True:
        try:
            res = telegram_api("getUpdates", {"offset": offset, "timeout": 15})
            if res and res.get("ok"):
                for update in res.get("result", []):
                    offset = update["update_id"] + 1
                    handle_update(update)
        except Exception as e:
            print(f"Polling error: {e}")
            time.sleep(3)

def start_localtunnel():
    global WEB_APP_URL
    print("⏳ Veb-app uchun bepul HTTPS havola (tunnel) yaratilmoqda...")
    try:
        cmd = ["npx.cmd" if os.name == "nt" else "npx", "localtunnel", "--port", str(PORT)]
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        for _ in range(20):
            line = proc.stdout.readline()
            if "https://" in line:
                match = re.search(r'https://[^\s]+', line)
                if match:
                    WEB_APP_URL = match.group(0)
                    print(f"\n HTTPS Havola (localtunnel): {WEB_APP_URL}\n")
                    return True
            time.sleep(0.5)
    except Exception as e:
        print(f"Localtunnel xatosi: {e}")
    return False

if __name__ == "__main__":
    print("==================================================")
    print("   BREND STORE - TELEGRAM BOT VA MINI APP SERVER   ")
    print("==================================================")

    # 1. Start Local HTTP Server
    t_server = threading.Thread(target=start_http_server, daemon=True)
    t_server.start()
    time.sleep(1)

    # 2. Get Public HTTPS URL via localtunnel
    success = start_localtunnel()
    if not success or not WEB_APP_URL:
        WEB_APP_URL = "https://brendstore-app.loca.lt"
        print(f"  ⚠️ Default Tunnel URL: {WEB_APP_URL}")

    # 3. Configure Telegram Bot Menu
    set_bot_menu_and_commands(WEB_APP_URL)

    # 4. Start Bot Polling Loop
    poll_updates()
