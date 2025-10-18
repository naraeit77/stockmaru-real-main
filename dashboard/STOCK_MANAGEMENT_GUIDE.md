# 주식 종목 관리 가이드 (Dashboard 웹 인터페이스)

StockMaru Dashboard에 통합된 종목 관리 웹 인터페이스 사용 가이드입니다.

## 📋 목차

1. [시작하기](#시작하기)
2. [종목 관리 페이지 접속](#종목-관리-페이지-접속)
3. [종목 추가](#종목-추가)
4. [종목 삭제](#종목-삭제)
5. [종목명 변경](#종목명-변경)
6. [작업 후 필수 단계](#작업-후-필수-단계)
7. [FAQ](#faq)

---

## 🚀 시작하기

### 1. 서버 실행

두 개의 서버를 모두 실행해야 합니다:

```bash
# 터미널 1: FastAPI 백엔드 서버 (포트 8000)
cd /Users/nit/stockmaru-real-main
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# 터미널 2: Next.js 대시보드 서버 (포트 3000)
cd /Users/nit/stockmaru-real-main/dashboard
npm run dev
```

### 2. 서버 확인

- **FastAPI 백엔드**: http://localhost:8000/docs
- **Dashboard 웹**: http://localhost:3000

---

## 🌐 종목 관리 페이지 접속

### 방법 1: 대시보드에서 이동

1. http://localhost:3000 접속
2. 우측 상단의 **"종목 관리"** 버튼 클릭 (보라색 버튼)

### 방법 2: 직접 URL 접속

http://localhost:3000/stock-management

---

## ➕ 종목 추가

### 웹 인터페이스 사용

1. 종목 관리 페이지에서 **"종목 추가"** 탭 선택
2. 필드 입력:
   - **티커 심볼**: 예) AAPL, MSFT, GOOGL
   - **한글 종목명**: 예) 애플, 마이크로소프트, 구글
3. **"➕ 종목 추가하기"** 버튼 클릭
4. 성공 메시지와 다음 단계 안내 확인

### 예시

| 티커 | 한글명 |
|------|--------|
| AAPL | 애플 |
| NVDA | 엔비디아 |
| META | 메타 |

---

## 🗑️ 종목 삭제

### 웹 인터페이스 사용

1. 종목 관리 페이지에서 **"종목 삭제"** 탭 선택
2. **삭제할 종목의 한글명** 입력 (자동완성 지원)
3. **"🗑️ 종목 삭제하기"** 버튼 클릭
4. 확인 대화상자에서 **"확인"** 클릭
5. 성공 메시지와 다음 단계 안내 확인

⚠️ **주의**: 삭제는 되돌릴 수 없으므로 신중하게 진행하세요.

---

## ✏️ 종목명 변경

### 웹 인터페이스 사용

1. 종목 관리 페이지에서 **"종목명 변경"** 탭 선택
2. 필드 입력:
   - **기존 한글명**: 예) 구글 A (자동완성 지원)
   - **새로운 한글명**: 예) 알파벳 A
3. **"✏️ 종목명 변경하기"** 버튼 클릭
4. 성공 메시지와 다음 단계 안내 확인

### 예시

- 구글 A → 알파벳 A
- 구글 C → 알파벳 C
- 페이스북 → 메타

---

## 📝 작업 후 필수 단계

종목 추가/삭제/변경 후 **반드시** 다음 단계를 수행해야 합니다:

### 1. 캐시 삭제

```bash
cd /Users/nit/stockmaru-real-main
rm *_cache.pkl
```

### 2. 데이터 수집

```bash
python stock.py
```

- FRED API에서 경제 지표 수집
- Yahoo Finance에서 주가 데이터 수집
- Supabase에 데이터 저장

### 3. AI 모델 재학습

```bash
python predict.py
```

- 새로운 종목 데이터로 Transformer 모델 학습
- 14일 앞 예측 생성
- 예측 결과를 Supabase에 저장

### 4. FastAPI 서버 재시작

```bash
# 현재 실행 중인 서버 종료 (Ctrl+C)
# 다시 시작
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 대시보드 새로고침

브라우저에서 대시보드 페이지 새로고침 (F5 또는 Cmd+R)

---

## 🎯 전체 워크플로우 예시

### 종목 추가 예시 (NVDA 엔비디아)

1. **웹 페이지 접속**
   ```
   http://localhost:3000/stock-management
   ```

2. **종목 추가**
   - 티커: NVDA
   - 한글명: 엔비디아
   - 추가 버튼 클릭

3. **캐시 삭제**
   ```bash
   rm *_cache.pkl
   ```

4. **데이터 수집 & 학습**
   ```bash
   python stock.py
   python predict.py
   ```

5. **서버 재시작**
   ```bash
   # FastAPI 서버 재시작
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **대시보드 확인**
   - http://localhost:3000 접속
   - "추천 종목" 탭에서 NVDA 확인

---

## ❓ FAQ

### Q1. 종목 추가 후 대시보드에 바로 나타나지 않아요

**A**: 다음 단계를 모두 수행했는지 확인하세요:
- [ ] 캐시 삭제 (`rm *_cache.pkl`)
- [ ] 데이터 수집 (`python stock.py`)
- [ ] 모델 재학습 (`python predict.py`)
- [ ] 서버 재시작
- [ ] 브라우저 새로고침

### Q2. "종목 관리" 버튼이 보이지 않아요

**A**:
- Dashboard 서버가 정상적으로 실행 중인지 확인 (http://localhost:3000)
- 브라우저 캐시 삭제 후 새로고침

### Q3. API 요청이 실패해요

**A**:
- FastAPI 서버가 실행 중인지 확인 (http://localhost:8000/docs)
- CORS 설정 확인 (`main.py`의 `CORSMiddleware`)
- 네트워크 탭에서 오류 메시지 확인 (F12)

### Q4. 종목 목록이 비어있어요

**A**:
- `stock.py`에 종목이 등록되어 있는지 확인
- API 엔드포인트가 정상 작동하는지 확인
  ```bash
  curl http://localhost:8000/api/management/stocks
  ```

### Q5. 종목 삭제가 실패해요

**A**:
- 한글 종목명을 정확히 입력했는지 확인
- 자동완성 목록에서 선택하는 것을 권장
- 존재하지 않는 종목은 삭제할 수 없음

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.x
- **UI Components**: shadcn/ui, Radix UI
- **HTTP Client**: Axios
- **Notifications**: Sonner

---

## 📁 관련 파일 위치

```
stockmaru-real-main/
├── dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── stock-management/
│   │   │   │   └── page.tsx          # 종목 관리 페이지
│   │   ├── components/
│   │   │   └── StockManagement/
│   │   │       ├── StockList.tsx      # 종목 목록
│   │   │       ├── AddStockForm.tsx   # 종목 추가 폼
│   │   │       ├── RemoveStockForm.tsx # 종목 삭제 폼
│   │   │       └── RenameStockForm.tsx # 종목명 변경 폼
│   │   └── lib/
│   │       └── api.ts                 # API 클라이언트
├── app/
│   └── api/
│       └── routes/
│           └── stock_management.py    # 백엔드 API
├── stock.py                           # 데이터 수집
├── predict.py                         # AI 모델 학습
└── main.py                            # FastAPI 서버
```

---

## 🎨 UI 미리보기

### 메인 화면
- 그라데이션 배경 (보라색 → 인디고)
- 통계 카드: 등록 종목 수, 마지막 업데이트 시간
- 종목 목록 테이블 (티커, 한글명)

### 관리 탭
- **종목 추가**: 보라색 테마
- **종목 삭제**: 빨간색 테마 (경고)
- **종목명 변경**: 노란색 테마

### 알림
- 성공: 초록색 토스트 알림
- 오류: 빨간색 토스트 알림
- 다음 단계: 파란색 정보 알림 (10초간 표시)

---

## 📞 문제 해결

문제가 발생하면:

1. **브라우저 개발자 도구** (F12) 확인
   - Console 탭에서 JavaScript 오류 확인
   - Network 탭에서 API 요청/응답 확인

2. **FastAPI 로그** 확인
   ```bash
   # FastAPI 서버 터미널에서 오류 메시지 확인
   ```

3. **Next.js 로그** 확인
   ```bash
   # Dashboard 서버 터미널에서 오류 메시지 확인
   ```

4. **API 직접 테스트**
   ```bash
   # Swagger UI에서 테스트
   http://localhost:8000/docs
   ```

---

## 🔐 보안 고려사항

현재는 개발 환경 설정입니다. 운영 환경 배포 시:

- [ ] CORS 설정을 특정 도메인으로 제한
- [ ] 인증/인가 시스템 추가
- [ ] HTTPS 사용
- [ ] 입력 값 검증 강화
- [ ] Rate Limiting 추가

---

**마지막 업데이트**: 2025-10-18
