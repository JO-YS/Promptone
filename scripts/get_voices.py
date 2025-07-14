# PromptOne - Voice Data Fetcher
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
MURF_API_KEY = os.getenv("MURF_API_KEY")
if not MURF_API_KEY:
    raise RuntimeError("MURF_API_KEY가 .env 파일에 설정되어 있지 않습니다.")

headers = {
    "api-key": MURF_API_KEY,
    "Content-Type": "application/json"
}

res = requests.get("https://api.murf.ai/v1/speech/voices", headers=headers)

voices = res.json()  # 응답이 리스트 형태

# 보기 좋게 출력 (indent 적용)
print(json.dumps(voices))
