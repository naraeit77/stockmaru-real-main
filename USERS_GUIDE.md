스톡마루(StockMaru) 애플리케이션 사용자 가이드
AI 기반 주식 거래 시스템의 설치부터 실행, 종료까지 전체 프로세스를 단계별로 안내합니다.
목차
시스템 요구사항
초기 설정
애플리케이션 시작하기
주요 기능 사용법
애플리케이션 종료하기
문제 해결
시스템 요구사항
필수 소프트웨어
Python: 3.8 이상 (권장: 3.10+)
pip: 최신 버전
메모리: 최소 4GB RAM (모델 학습 시 8GB 권장)
디스크 공간: 최소 2GB 여유 공간
필수 API 키
다음 API 키들을 사전에 준비해야 합니다:
FRED API 키 (경제 지표 수집용)
Supabase URL 및 API 키 (데이터베이스)
한국투자증권 AppKey 및 AppSecret (거래 실행용)
초기 설정
1단계: 프로젝트 다운로드
# 프로젝트 디렉토리로 이동
cd /Users/nit/stockmaru-real-main
2단계: Python 가상 환경 생성 (권장)
# 가상 환경 생성
python3 -m venv venv

# 가상 환경 활성화 (macOS/Linux)
source venv/bin/activate

# 가상 환경 활성화 (Windows)
venv\Scripts\activate
3단계: 필수 패키지 설치
# requirements.txt가 있는 경우
pip install -r requirements.txt

# 또는 개별 설치
pip install fastapi uvicorn tensorflow pandas numpy yfinance fredapi supabase python-dotenv pytz
4단계: API 키 설정
방법 A: 환경 변수 사용 (권장)
프로젝트 루트에 .env 파일 생성:
# .env 파일 내용
FRED_API_KEY=your_fred_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
KIS_APPKEY=your_korea_investment_appkey_here
KIS_APPSECRET=your_korea_investment_appsecret_here
방법 B: 파일 직접 수정 (임시 테스트용)
stock.py: FRED API 키 입력
dbConnection.py: Supabase URL 및 키 입력
getBalance.py: 한국투자증권 AppKey/AppSecret 입력
⚠️ 보안 주의: 프로덕션 환경에서는 반드시 환경 변수를 사용하세요.
애플리케이션 시작하기
전체 워크플로우 개요
데이터 수집 → AI 예측 → 서버 시작 → API 사용
1단계: 경제 및 주식 데이터 수집
python stock.py
실행 내용:
FRED API에서 60+ 경제 지표 수집
Yahoo Finance에서 NASDAQ 상위 주식 가격 수집
데이터 정규화 및 Supabase 저장
예상 소요 시간: 5-10분 (네트워크 속도에 따라 상이) 진행 상황 확인:
Fetching data from FRED...
Processing economic indicators...
Downloading stock data from Yahoo Finance...
Saving to Supabase... [100 records/batch]
✅ Data collection completed!
2단계: AI 모델 학습 및 예측 생성
python predict.py
실행 내용:
Supabase에서 학습 데이터 로드
Transformer 모델 학습 (50 에포크)
14일 선행 주가 예측 생성
예측 결과를 Supabase에 저장
예상 소요 시간: 10-30분 (하드웨어 성능에 따라 상이) 진행 상황 확인:
Loading data from Supabase...
Training Transformer model...
Epoch 1/50 - Loss: 0.0523
Epoch 2/50 - Loss: 0.0412
...
Epoch 50/50 - Loss: 0.0089
Generating predictions...
Saving predictions to Supabase...
✅ Prediction completed!
3단계: FastAPI 서버 시작
방법 A: uvicorn 직접 실행 (개발 모드)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
플래그 설명:
--host 0.0.0.0: 모든 네트워크 인터페이스에서 접근 허용
--port 8000: 포트 번호 지정 (기본값: 8000)
--reload: 코드 변경 시 자동 재시작 (개발 전용)
방법 B: run.py 스크립트 실행
python run.py
서버 시작 확인:
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
4단계: 서버 동작 확인
브라우저에서 다음 URL 접속:
http://localhost:8000
응답 예시:
{
  "message": "Stock Prediction API is running",
  "status": "healthy"
}
5단계: API 문서 확인 (선택사항)
Swagger UI 자동 문서:
http://localhost:8000/docs
ReDoc 문서:
http://localhost:8000/redoc
주요 기능 사용법
1. 계좌 잔고 조회
엔드포인트: GET /balance
# curl 사용
curl http://localhost:8000/balance

# 브라우저에서 직접 접속
http://localhost:8000/balance
응답 예시:
{
  "domestic_balance": {
    "total_evaluation": "10,000,000 KRW",
    "stocks": [...]
  },
  "overseas_balance": {
    "total_evaluation": "5,000 USD",
    "stocks": [...]
  }
}
2. 특정 종목 데이터 조회
엔드포인트: GET /stock/{ticker}
# 애플 주식 데이터 조회
curl http://localhost:8000/stock/AAPL

# 브라우저에서
http://localhost:8000/stock/AAPL
3. AI 예측 결과 조회
엔드포인트: GET /predictions
curl http://localhost:8000/predictions
응답 예시:
{
  "predictions": [
    {
      "ticker": "AAPL",
      "current_price": 175.50,
      "predicted_14d": 182.30,
      "rise_probability": 3.87,
      "accuracy": 85.2,
      "recommendation": "BUY"
    },
    ...
  ]
}
4. 데이터 수동 업데이트
엔드포인트: POST /update_data
# 백그라운드에서 데이터 수집 및 예측 실행
curl -X POST http://localhost:8000/update_data
응답 예시:
{
  "message": "Data update started in background",
  "status": "processing"
}
⏱️ 참고: 백그라운드 작업이므로 즉시 응답을 반환하지만, 실제 처리는 10-40분 소요됩니다.
애플리케이션 종료하기
1단계: FastAPI 서버 종료
서버가 실행 중인 터미널에서:
# Ctrl+C 입력 (Mac/Linux/Windows 공통)
^C
종료 확인 메시지:
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Finished server process [12346]
2단계: 가상 환경 비활성화 (선택사항)
deactivate
3단계: 백그라운드 프로세스 확인 (안전 종료)
혹시 남아있는 프로세스 확인:
# 실행 중인 Python 프로세스 확인
ps aux | grep python

# 특정 프로세스 종료 (필요 시)
kill -9 [프로세스_ID]
문제 해결
서버가 시작되지 않는 경우
증상: Address already in use 오류 해결방법:
# 8000번 포트 사용 중인 프로세스 확인
lsof -i :8000

# 해당 프로세스 종료
kill -9 [PID]

# 또는 다른 포트 사용
uvicorn main:app --port 8001
데이터 수집 중 API 오류
증상: FRED API key invalid 또는 Rate limit exceeded 해결방법:
API 키 유효성 확인
1분 대기 후 재시도 (Rate limit 해제)
stock.py 파일의 지연 시간 증가:
time.sleep(2)  # 1초에서 2초로 증가
모델 학습 메모리 부족
증상: ResourceExhaustedError 또는 시스템 프리징 해결방법:
predict.py 배치 크기 감소:
batch_size = 16  # 기본값 32에서 감소
다른 프로그램 종료하여 메모리 확보
시퀀스 길이 감소 (90일 → 60일)
Supabase 연결 실패
증상: Connection timeout 또는 Invalid credentials 해결방법:
네트워크 연결 확인
Supabase 대시보드에서 프로젝트 활성 상태 확인
API 키 만료 여부 확인 및 재발급
한국투자증권 토큰 만료
증상: Token expired 또는 401 Unauthorized 해결방법:
# 토큰 재발급 테스트
python getBalance.py
토큰은 24시간마다 자동 갱신되지만, 수동 갱신이 필요한 경우 위 명령어 실행.
자동화 스케줄링 (선택사항)
매일 자동으로 데이터 수집 및 예측을 실행하려면:
cron 설정 (Mac/Linux)
# cron 편집
crontab -e

# 매일 오전 9시 실행 (예시)
0 9 * * * cd /Users/nit/stockmaru-real-main && /usr/bin/python3 stock.py && /usr/bin/python3 predict.py
Windows 작업 스케줄러
"작업 스케줄러" 열기
"기본 작업 만들기" 클릭
트리거: 매일 오전 9시
동작: 프로그램 시작
프로그램: python.exe
인수: stock.py
시작 위치: C:\path\to\stockmaru-real-main
시스템 아키텍처 요약
┌─────────────────┐
│  1. 데이터 수집  │  stock.py (5-10분)
│  FRED + Yahoo   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │  economic_and_stock_data 테이블
│   (PostgreSQL)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. AI 예측     │  predict.py (10-30분)
│  Transformer    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │  predicted_stocks 테이블
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. FastAPI     │  main.py (실시간 서비스)
│  REST API       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. 사용자/앱   │  http://localhost:8000
│                 │
└─────────────────┘
추가 리소스
FastAPI 자동 문서: http://localhost:8000/docs
프로젝트 상세 문서: CLAUDE.md
기술 스택 정보: FastAPI, TensorFlow, Supabase, Korea Investment Securities API
보안 권고사항
✅ 환경 변수 사용: .env 파일로 API 키 관리
✅ Git 제외: .gitignore에 .env 추가
✅ CORS 제한: 프로덕션에서 allow_origins=["*"] 제거
✅ API 인증: FastAPI 엔드포인트에 인증 추가
✅ HTTPS 사용: 프로덕션 배포 시 SSL/TLS 적용
문의사항이나 오류 발생 시 프로젝트 이슈 트래커에 보고해주세요.