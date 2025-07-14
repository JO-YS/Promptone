# PromptOne - AI Voice Generator
import os
import json
import logging
import re
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from models import VoiceLocale, init_db

load_dotenv()

MURF_API_KEY = os.getenv("MURF_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not MURF_API_KEY or not GEMINI_API_KEY:
    raise RuntimeError("API 키가 누락되었습니다. .env 파일을 확인하세요.")

app = Flask(__name__)
db_session = init_db("sqlite:///db/promptone_voices.db")
CORS(app)

logging.basicConfig(level=logging.DEBUG, format="%(levelname)s: %(message)s")

@app.route("/", methods=["GET"])
def serve_index():
    return render_template("index.html")

@app.route("/voices", methods=["GET"])
def get_voices():
    try:
        voices = db_session.query(VoiceLocale).all()
        result = []
        for v in voices:
            # availableStyles가 JSON 문자열인 경우 파싱
            available_styles = v.availableStyles
            if isinstance(available_styles, str):
                try:
                    available_styles = json.loads(available_styles)
                except json.JSONDecodeError:
                    available_styles = []
            elif available_styles is None:
                available_styles = []
            
            result.append({
                "voiceId": v.voiceId,
                "displayName": v.displayName,
                "locale": v.locale,
                "displayLanguage": v.displayLanguage,
                "accent": v.accent,
                "description": v.description,
                "gender": v.gender,
                "availableStyles": available_styles,
                #"supportedLocales": v.rawdata.get("supportedLocales", {}) if v.rawdata is not None else {}
            })
        return jsonify(result)

    except Exception as e:
        logging.exception("[DB Fetch Error]")
        return jsonify({"error": "DB 조회 실패", "detail": str(e)}), 500

def clean_json_block(text):
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)

def call_gemini_api(prompt):
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key={GEMINI_API_KEY}"
    headers = { "Content-Type": "application/json" }
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        logging.debug(f"[Gemini API] Status: {response.status_code}")

        if response.status_code != 200:
            logging.error(f"[Gemini Error] {response.status_code}: {response.text}")
            return None, f"Gemini API returned {response.status_code}"

        data = response.json()
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        text_response = parts[0]["text"] if parts else ""
        logging.debug(f"[Gemini Response Text] {text_response}")

        cleaned = clean_json_block(text_response)
        return cleaned, None

    except Exception as e:
        logging.exception("[Gemini Exception]")
        return None, str(e)

@app.route("/gemini", methods=["POST"])
def gemini_settings():
    data = request.get_json()
    prompt = data.get("prompt")
    logging.debug(f"[Request] Gemini prompt: {prompt}")

    if not prompt:
        logging.warning("[Error] No prompt provided")
        return jsonify({"error": "No prompt provided"}), 400

    response_text, error = call_gemini_api(prompt)
    if error:
        return jsonify({"error": "Gemini API Error", "detail": error}), 500

    if response_text is None:
        return jsonify({"error": "Gemini 응답이 없습니다."}), 500
    try:
        settings_json = json.loads(response_text)
        logging.debug(f"[Gemini JSON Parsed] {settings_json}")
        return jsonify(settings_json)
    except json.JSONDecodeError:
        logging.error(f"[Gemini JSON Decode Error] Raw response: {response_text}")
        return jsonify({
            "error": "Gemini 응답이 JSON 형식이 아님",
            "raw": response_text
        }), 500

@app.route("/tts", methods=["POST"])
def tts():
    data = request.get_json()
    settings = data.get("settings")

    if not settings:
        return jsonify({"error": "settings가 없습니다."}), 400

    logging.debug(f"[Request] settings: {settings}")

    required_fields = ["voiceId", "multiNativeLocale", "format", "text"]
    missing = [f for f in required_fields if f not in settings]
    if missing:
        return jsonify({"error": f"settings에 누락된 필드: {', '.join(missing)}"}), 400

    payload = {
        "modelVersion": "GEN2",
        "encodeAsBase64": "False",
        "channelType": "MONO",
        **settings
    }

    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post("https://api.murf.ai/v1/speech/generate", json=payload, headers=headers)
        logging.debug(f"[Murf API] status: {response.status_code}")

        if response.status_code != 200:
            logging.error(f"[Murf Error] {response.status_code}: {response.text}")
            return jsonify({"error": "Murf 요청 실패", "detail": response.text}), 400

        result = response.json()
        logging.debug(f"[Murf Response] {result}")
        return jsonify(result)

    except Exception as e:
        logging.exception("[Murf Exception]")
        return jsonify({"error": "Murf 처리 중 예외 발생", "detail": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)