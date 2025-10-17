스톡마루(StockMaru) 애플리케이션 사용자 가이드
AI 기반 주식 거래 시스템의 설치부터 실행, 종료까지 전체 프로세스를 단계별로 안내합니다.
목차
시스템 요구사항
초기 설정
애플리케이션 시작하기
대시보드 사용하기 (localhost:3000)
주요 기능 사용법
애플리케이션 종료하기
문제 해결
시스템 요구사항
필수 소프트웨어
Python: 3.8 이상 (권장: 3.10+)
Node.js: 18.x 이상 (대시보드용, 권장: 20.x LTS)
pip: 최신 버전
npm: 최신 버전
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
대시보드 사용하기 (localhost:3000)
웹 기반 실시간 모니터링 대시보드
StockMaru는 Next.js 기반의 실시간 대시보드를 제공합니다. 백엔드 API 서버가 실행된 상태에서 대시보드를 시작하세요.
1단계: 대시보드 디렉토리로 이동
cd dashboard
2단계: 의존성 설치 (최초 1회만)
npm install
예상 소요 시간: 2-5분 (네트워크 속도에 따라 상이)
3단계: 환경 변수 설정
dashboard/.env.local 파일 생성 (예시 파일 복사):
cp .env.local.example .env.local
기본 설정 내용:
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000
⚠️ 주의: 백엔드 서버(localhost:8000)가 실행 중이어야 정상 작동합니다.
4단계: 개발 서버 실행
npm run dev
서버 시작 확인 메시지:
  ▲ Next.js 15.5.6
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.3s
5단계: 브라우저에서 접속
http://localhost:3000
대시보드 주요 기능
📊 실시간 잔고 현황
보유 중인 해외주식 실시간 조회
종목별 평가금액 및 수익률 표시
10초마다 자동 갱신
🎯 AI 추천 종목
종합 분석 기반 매수 추천 (정확도 ≥80%, 상승확률 ≥3%)
기술적 지표: 골든크로스, MACD, RSI
뉴스 감정 분석 (sentiment score ≥0.15)
종합 점수 기반 순위 정렬
30초마다 자동 갱신
🚨 매도 대상 종목
익절/손절 조건 충족 종목 자동 감지
기술적 매도 신호 분석 (데드크로스, RSI 과매수)
매도 사유 상세 표시
30초마다 자동 갱신
⚡ 자동매매 제어
매수/매도 스케줄러 실시간 상태 모니터링
스케줄러 시작/중지 원클릭 제어
즉시 매수/매도 실행 기능
다음 실행 시간 표시
5초마다 자동 갱신
대시보드 프로덕션 빌드 (선택사항)
성능 최적화가 필요한 경우:
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start
브라우저에서 http://localhost:3000 접속
대시보드 종료하기
터미널에서 Ctrl+C 입력:
^C
종료 확인 메시지:
 ✓ Compiled in 123ms
 ⨯ Aborted
프로젝트 루트로 돌아가기:
cd ..
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
1단계: 대시보드 종료 (실행 중인 경우)
대시보드 터미널에서:
# Ctrl+C 입력
^C
종료 확인 메시지:
 ✓ Compiled in 123ms
 ⨯ Aborted
2단계: FastAPI 서버 종료
서버가 실행 중인 터미널에서:
# Ctrl+C 입력 (Mac/Linux/Windows 공통)
^C
종료 확인 메시지:
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Finished server process [12346]
3단계: 가상 환경 비활성화 (선택사항)
deactivate
4단계: 백그라운드 프로세스 확인 (안전 종료)
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
대시보드 관련 문제
대시보드 포트 충돌 (3000번 포트)
증상: Port 3000 is already in use 해결방법:
# 3000번 포트 사용 중인 프로세스 확인
lsof -i :3000

# 해당 프로세스 종료
kill -9 [PID]

# 또는 다른 포트 사용
npm run dev -- -p 3001
대시보드 백엔드 연결 실패
증상: 대시보드에서 "데이터를 불러올 수 없습니다" 표시 해결방법:
1. FastAPI 백엔드 서버 실행 확인 (http://localhost:8000)
2. dashboard/.env.local 파일 확인:
   NEXT_PUBLIC_API_URL=http://localhost:8000
3. 브라우저 개발자 도구(F12) 콘솔에서 네트워크 오류 확인
4. CORS 설정 확인 (main.py에서 allow_origins 설정)
npm install 실패
증상: EACCES 권한 오류 또는 의존성 충돌 해결방법:
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 권한 문제 시 (sudo 사용 권장하지 않음)
# npm 글로벌 디렉토리 권한 수정
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
대시보드 빌드 오류
증상: Type errors 또는 Build failed 해결방법:
# TypeScript 타입 체크
npm run lint

# node_modules 재설치
rm -rf .next node_modules
npm install

# 캐시 삭제 후 재시작
rm -rf .next
npm run dev
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
│                 │  stock_analysis_results 테이블
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. FastAPI     │  main.py (실시간 서비스)
│  REST API       │  http://localhost:8000
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  4-A. Dashboard │   │  4-B. 외부 앱    │
│  Next.js        │   │  모바일/웹      │
│  localhost:3000 │   │  API 호출       │
└─────────────────┘   └─────────────────┘

📊 대시보드 주요 화면:
- 실시간 잔고 현황 (10초 갱신)
- AI 추천 종목 (30초 갱신)
- 매도 대상 종목 (30초 갱신)
- 자동매매 제어 (5초 갱신)
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