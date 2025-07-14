# PromptOne - AI Voice Generator

PromptOne은 텍스트를 자연스러운 음성으로 변환하는 AI 음성 생성기입니다. Murf AI와 Gemini AI를 활용하여 고품질의 음성 합성을 제공합니다.

## 🚀 주요 기능

- **다양한 음성 선택**: 100개 이상의 다양한 음성과 액센트
- **실시간 음성 생성**: 텍스트를 즉시 음성으로 변환
- **음성 스타일 커스터마이징**: Gemini AI를 통한 음성 특성 조정
- **다양한 출력 형식**: MP3, WAV, FLAC, ALAW, ULAW 지원
- **직관적인 UI**: 사용자 친화적인 웹 인터페이스

## 🛠️ 기술 스택

- **Backend**: Flask, SQLAlchemy
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI Services**: Murf AI (TTS), Gemini AI (음성 설정)
- **Database**: SQLite

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd Promptone
```

### 2. 가상환경 생성 및 활성화
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:
```env
MURF_API_KEY=your_murf_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. 음성 데이터 초기화
```bash
python scripts/save_voices.py
```

### 6. 애플리케이션 실행
```bash
python app.py
```

브라우저에서 `http://localhost:5000`으로 접속하세요.

## 🎯 사용법

1. **음성 선택**: "Select Voice" 버튼을 클릭하여 원하는 음성을 선택
2. **프롬프트 입력**: 음성의 특성을 설명하는 프롬프트 입력
3. **텍스트 입력**: 변환할 텍스트 입력 (최대 3000자)
4. **출력 형식 선택**: MP3, WAV, FLAC 등 원하는 형식 선택
5. **변환**: "Convert" 버튼을 클릭하여 음성 생성
6. **재생 및 다운로드**: 생성된 음성을 재생하거나 다운로드

## 📁 프로젝트 구조

```
Promptone/
├── app.py                 # Flask 애플리케이션 메인 파일
├── models/                # 데이터베이스 모델
│   └── __init__.py       # VoiceLocale 모델 정의
├── static/               # 정적 파일
│   ├── css/
│   │   └── style.css     # 스타일시트
│   └── js/
│       └── main.js       # 메인 JavaScript
├── templates/            # HTML 템플릿
│   └── index.html        # 메인 페이지
├── scripts/              # 유틸리티 스크립트
│   ├── get_voices.py     # 음성 데이터 조회
│   └── save_voices.py    # 음성 데이터 저장
├── db/                   # 데이터베이스 파일
└── requirements.txt      # Python 의존성
```

## 🔧 API 엔드포인트

- `GET /` - 메인 페이지
- `GET /voices` - 사용 가능한 음성 목록 조회
- `POST /gemini` - Gemini AI를 통한 음성 설정 생성
- `POST /tts` - 텍스트를 음성으로 변환

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해 주세요. 