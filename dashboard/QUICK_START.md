# 🚀 빠른 시작 가이드

## 1️⃣ 서버 실행 (2개 터미널 필요)

### 터미널 1: FastAPI 백엔드
```bash
cd /Users/nit/stockmaru-real-main
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 터미널 2: Next.js 대시보드
```bash
cd /Users/nit/stockmaru-real-main/dashboard
npm run dev
```

## 2️⃣ 접속

- **대시보드**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs

## 3️⃣ 종목 관리

1. 대시보드 우측 상단 **"종목 관리"** 버튼 클릭
2. 또는 직접 접속: http://localhost:3000/stock-management

### 종목 추가
- 티커 심볼: AAPL
- 한글명: 애플
- 추가 버튼 클릭

### 작업 후 필수 단계
```bash
# 1. 캐시 삭제
cd /Users/nit/stockmaru-real-main
rm *_cache.pkl

# 2. 데이터 수집
python stock.py

# 3. 모델 재학습
python predict.py

# 4. 서버 재시작 (Ctrl+C 후 다시 실행)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 4️⃣ 주요 기능

### 대시보드 탭
- **전체 현황**: 잔고, 스케줄러 상태, 매매 현황
- **매매 현황**: 거래 내역, 예수금
- **추천 종목**: AI 추천 종목 목록
- **제어**: 스케줄러 시작/중지

### 종목 관리 탭
- **종목 추가**: 새로운 종목 등록
- **종목 삭제**: 기존 종목 삭제
- **종목명 변경**: 한글명 수정

## 5️⃣ 문제 해결

### 대시보드가 안 열려요
```bash
# Next.js 서버 확인
cd /Users/nit/stockmaru-real-main/dashboard
npm run dev
```

### API 요청이 실패해요
```bash
# FastAPI 서버 확인
cd /Users/nit/stockmaru-real-main
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 종목이 추가되었는데 보이지 않아요
- 캐시 삭제, 데이터 수집, 모델 재학습 완료했나요?
- 서버를 재시작했나요?
- 브라우저를 새로고침했나요?

## 📚 자세한 가이드

- 종목 관리: [STOCK_MANAGEMENT_GUIDE.md](./STOCK_MANAGEMENT_GUIDE.md)
- 프로젝트 전체: [README.md](./README.md)
