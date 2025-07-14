# PromptOne - scripts/save_voices.py
import os
import sys
import requests
from dotenv import load_dotenv

# models import 경로 설정
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from models import VoiceLocale, init_db

def normalize_style(style):
    # "newscast" (대소문자 무시) → "Newscast"로 통일
    if style.lower() == "newscast":
        return "Newscast"
    return style

def save_voices_to_db(voice_data: list):
    session = init_db()
    seen = set()  # (voiceId, locale) 중복 방지

    for item in voice_data:
        voice_id = item.get("voiceId")
        displayName = item.get("displayName").split(" ")[0]
        accent = item.get("accent")
        gender = item.get("gender")
        description = item.get("description")
        supported_locales = item.get("supportedLocales", {})

        for locale, locale_info in supported_locales.items():
            key = (voice_id, locale)
            if key in seen:
                continue  # 이미 처리한 조합은 건너뜀
            seen.add(key)

            styles = locale_info.get('availableStyles', [])
            unique_styles = list(set([normalize_style(s) for s in styles]))

            voice = VoiceLocale(
                voiceId=voice_id,
                locale=locale,
                displayName=displayName,
                displayLanguage=locale_info.get("detail", ""),
                accent=accent,
                gender=gender,
                description=description,
                availableStyles=unique_styles,
                rawdata=item
            )
            session.merge(voice)

    session.commit()
    print("✅ 저장 완료 (supportedLocales 기준, locale별 row 생성됨)")

if __name__ == "__main__":
    load_dotenv()
    MURF_API_KEY = os.getenv("MURF_API_KEY")
    if not MURF_API_KEY:
        raise RuntimeError("MURF_API_KEY가 .env 파일에 설정되어 있지 않습니다.")

    headers = {"api-key": MURF_API_KEY}
    res = requests.get("https://api.murf.ai/v1/speech/voices", headers=headers)

    voices = res.json()  # 리스트 형태
    save_voices_to_db(voices)
