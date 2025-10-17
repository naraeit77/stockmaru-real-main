# StockMaru Dashboard

Next.js 기반의 AI 자동매매 시스템 실시간 대시보드입니다.

## 주요 기능

### 📊 실시간 잔고 현황
- 해외주식 보유 현황 실시간 조회
- 종목별 평가금액 및 수익률 표시
- 10초마다 자동 갱신

### 🎯 AI 추천 종목
- 종합 분석 기반 매수 추천 (정확도 ≥80%, 상승확률 ≥3%)
- 기술적 지표 (골든크로스, MACD, RSI)
- 뉴스 감정 분석 (sentiment score ≥0.15)
- 종합 점수 기반 순위 정렬
- 30초마다 자동 갱신

### 🚨 매도 대상 종목
- 익절/손절 조건 충족 종목 자동 감지
- 기술적 매도 신호 분석
- 매도 사유 상세 표시
- 30초마다 자동 갱신

### ⚡ 자동매매 제어
- 매수/매도 스케줄러 실시간 상태 모니터링
- 스케줄러 시작/중지 원클릭 제어
- 즉시 매수/매도 실행 기능
- 다음 실행 시간 표시
- 5초마다 자동 갱신

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Data Fetching**: SWR (자동 재검증 및 캐싱)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: Sonner

## 설치 및 실행

### 1. 의존성 설치
npm install

### 2. 환경변수 설정
cp .env.local.example .env.local

### 3. 개발 서버 실행
npm run dev

### 4. 프로덕션 빌드
npm run build
npm start

브라우저에서 http://localhost:3000으로 접속합니다.

## 주의사항

⚠️ **백엔드 서버 필수**: FastAPI 백엔드 서버가 실행 중이어야 정상 작동합니다.

백엔드 서버 실행:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
