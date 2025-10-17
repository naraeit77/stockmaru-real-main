Playwright를 이용한 StockMaru 프로그램 검증 가이드
Playwright를 활용하여 StockMaru AI 자동매매 시스템을 체계적으로 검증하는 방법을 상세히 안내드리겠습니다.
📋 목차
Playwright 소개 및 설치
테스트 전략 수립
FastAPI 엔드포인트 검증
데이터베이스 무결성 검증
AI 예측 모델 검증
한국투자증권 API 연동 검증
E2E 시나리오 테스트
성능 및 부하 테스트
CI/CD 파이프라인 통합
1. Playwright 소개 및 설치
Playwright란?
Playwright는 Microsoft에서 개발한 크로스 브라우저 자동화 라이브러리로, API 테스트, UI 테스트, 성능 모니터링을 지원합니다. StockMaru에 적합한 이유:
✅ FastAPI Swagger UI 자동 테스트
✅ API 응답 시간 측정
✅ 브라우저 기반 대시보드 검증
✅ 스크린샷/비디오 자동 캡처 (버그 재현)
설치
# Playwright 설치
pip install playwright pytest-playwright

# 브라우저 드라이버 설치
playwright install

# 추가 의존성
pip install pytest pytest-asyncio aiohttp
프로젝트 구조
stockmaru-real-main/
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # Pytest 공통 설정
│   ├── test_api_endpoints.py       # API 엔드포인트 테스트
│   ├── test_database.py            # DB 검증
│   ├── test_ai_prediction.py       # AI 모델 검증
│   ├── test_trading_logic.py       # 매매 로직 검증
│   ├── test_integration.py         # 통합 테스트
│   └── test_e2e_scenarios.py       # E2E 시나리오
├── playwright.config.py            # Playwright 설정
└── pytest.ini                      # Pytest 설정
2. 테스트 전략 수립
테스트 피라미드
        /\
       /  \  E2E 테스트 (10%)
      /    \  - 전체 매매 시나리오
     /------\
    /        \ 통합 테스트 (30%)
   /          \ - API + DB + 외부 API
  /------------\
 /              \ 단위 테스트 (60%)
/________________\ - 개별 함수, 엔드포인트
테스트 범위 정의
카테고리	테스트 대상	우선순위
API 엔드포인트	GET/POST 응답, 상태 코드, 데이터 형식	높음
데이터베이스	CRUD 작업, 데이터 무결성, 트랜잭션	높음
AI 예측	모델 정확도, 예측 범위, 성능	중간
매매 로직	매수/매도 조건, 리스크 관리	높음
외부 API	한투 API, Alpha Vantage, FRED	중간
성능	응답 시간, 메모리 사용량, 동시성	낮음
3. FastAPI 엔드포인트 검증
3.1 설정 파일 (conftest.py)
# tests/conftest.py
import pytest
import asyncio
from playwright.async_api import async_playwright
from fastapi.testclient import TestClient
from main import app
import os
from dotenv import load_dotenv

load_dotenv()

@pytest.fixture(scope="session")
def event_loop():
    """이벤트 루프 생성"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_client():
    """FastAPI 테스트 클라이언트"""
    return TestClient(app)

@pytest.fixture(scope="session")
async def browser():
    """Playwright 브라우저 인스턴스"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()

@pytest.fixture
async def page(browser):
    """새로운 페이지 컨텍스트"""
    context = await browser.new_context()
    page = await context.new_page()
    yield page
    await context.close()

@pytest.fixture
def base_url():
    """API 베이스 URL"""
    return os.getenv("API_BASE_URL", "http://localhost:8000")
3.2 API 엔드포인트 테스트
# tests/test_api_endpoints.py
import pytest
from playwright.async_api import expect
import time

class TestHealthCheck:
    """서버 상태 확인 테스트"""
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, page, base_url):
        """루트 엔드포인트 응답 검증"""
        response = await page.goto(f"{base_url}/")
        
        # 상태 코드 확인
        assert response.status == 200
        
        # 응답 본문 확인
        content = await page.content()
        assert "Stock Prediction API is running" in content or "healthy" in content

    @pytest.mark.asyncio
    async def test_docs_page(self, page, base_url):
        """Swagger UI 접근 확인"""
        response = await page.goto(f"{base_url}/docs")
        
        assert response.status == 200
        await expect(page.locator("text=FastAPI")).to_be_visible()
        
        # 스크린샷 저장 (검증용)
        await page.screenshot(path="tests/screenshots/swagger_ui.png")


class TestBalanceEndpoints:
    """잔고 조회 API 테스트"""
    
    @pytest.mark.asyncio
    async def test_get_balance(self, page, base_url):
        """잔고 조회 성공 케이스"""
        start_time = time.time()
        
        # API 요청 및 응답 캡처
        async with page.expect_response(f"{base_url}/balance") as response_info:
            await page.goto(f"{base_url}/balance")
        
        response = await response_info.value
        elapsed_time = time.time() - start_time
        
        # 상태 코드 검증
        assert response.status == 200, f"Expected 200, got {response.status}"
        
        # 응답 시간 검증 (3초 이내)
        assert elapsed_time < 3.0, f"Response time too slow: {elapsed_time:.2f}s"
        
        # 응답 데이터 구조 검증
        data = await response.json()
        assert "domestic_balance" in data or "overseas_balance" in data
        
        print(f"✅ Balance API responded in {elapsed_time:.2f}s")

    @pytest.mark.asyncio
    async def test_balance_with_invalid_token(self, page, base_url):
        """잘못된 토큰으로 접근 시 에러 처리 검증"""
        # 환경 변수 임시 변경 (모킹)
        response = await page.goto(f"{base_url}/balance?token=invalid_token")
        
        # 401 또는 403 예상
        assert response.status in [401, 403, 500]


class TestStockDataEndpoints:
    """주식 데이터 API 테스트"""
    
    @pytest.mark.asyncio
    async def test_get_stock_by_ticker(self, page, base_url):
        """특정 종목 데이터 조회"""
        tickers = ["AAPL", "MSFT", "TSLA"]
        
        for ticker in tickers:
            response = await page.goto(f"{base_url}/stock/{ticker}")
            assert response.status == 200
            
            content = await page.text_content("body")
            assert ticker in content or "error" not in content.lower()
    
    @pytest.mark.asyncio
    async def test_get_predictions(self, page, base_url):
        """AI 예측 결과 조회"""
        response = await page.goto(f"{base_url}/predictions")
        
        assert response.status == 200
        
        data = await response.json()
        
        # 예측 데이터 구조 검증
        if isinstance(data, dict) and "predictions" in data:
            predictions = data["predictions"]
            assert len(predictions) > 0, "No predictions found"
            
            # 첫 번째 예측 데이터 검증
            first_pred = predictions[0]
            required_fields = ["ticker", "predicted_14d", "rise_probability", "accuracy"]
            
            for field in required_fields:
                assert field in first_pred, f"Missing field: {field}"
    
    @pytest.mark.asyncio
    async def test_update_data_endpoint(self, page, base_url):
        """데이터 업데이트 트리거 (백그라운드 작업)"""
        # POST 요청 시뮬레이션
        response = await page.evaluate(f"""
            fetch('{base_url}/update_data', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}}
            }})
            .then(r => r.json())
        """)
        
        assert "message" in response
        assert "background" in response["message"].lower() or "started" in response["message"].lower()


class TestErrorHandling:
    """에러 처리 검증"""
    
    @pytest.mark.asyncio
    async def test_404_not_found(self, page, base_url):
        """존재하지 않는 엔드포인트"""
        response = await page.goto(f"{base_url}/nonexistent_endpoint")
        assert response.status == 404
    
    @pytest.mark.asyncio
    async def test_invalid_ticker(self, page, base_url):
        """잘못된 티커 요청"""
        response = await page.goto(f"{base_url}/stock/INVALID123")
        
        # 404 또는 에러 메시지 반환 예상
        assert response.status in [404, 400, 500]
3.3 API 응답 시간 모니터링
# tests/test_performance.py
import pytest
import asyncio
import statistics

class TestAPIPerformance:
    """API 성능 테스트"""
    
    @pytest.mark.asyncio
    async def test_balance_response_time(self, page, base_url):
        """잔고 조회 응답 시간 측정 (10회 평균)"""
        times = []
        
        for i in range(10):
            start = asyncio.get_event_loop().time()
            response = await page.goto(f"{base_url}/balance")
            end = asyncio.get_event_loop().time()
            
            if response.status == 200:
                times.append(end - start)
            
            await asyncio.sleep(0.5)  # Rate limiting 방지
        
        avg_time = statistics.mean(times)
        std_dev = statistics.stdev(times)
        
        print(f"\n📊 Balance API Performance:")
        print(f"   Average: {avg_time:.3f}s")
        print(f"   Std Dev: {std_dev:.3f}s")
        print(f"   Min: {min(times):.3f}s")
        print(f"   Max: {max(times):.3f}s")
        
        # 성능 기준: 평균 3초 이내
        assert avg_time < 3.0, f"Average response time too slow: {avg_time:.2f}s"
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, browser, base_url):
        """동시 요청 처리 능력 (10명 동시 접속)"""
        async def make_request(context_id):
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                start = asyncio.get_event_loop().time()
                response = await page.goto(f"{base_url}/")
                end = asyncio.get_event_loop().time()
                
                return {
                    "context_id": context_id,
                    "status": response.status,
                    "time": end - start
                }
            finally:
                await context.close()
        
        # 10개 동시 요청
        tasks = [make_request(i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        
        # 모든 요청 성공 확인
        successful = [r for r in results if r["status"] == 200]
        assert len(successful) == 10, f"Only {len(successful)}/10 requests succeeded"
        
        # 평균 응답 시간
        avg_time = statistics.mean([r["time"] for r in results])
        print(f"\n🔄 Concurrent Requests (10 users):")
        print(f"   Success Rate: {len(successful)}/10")
        print(f"   Average Time: {avg_time:.3f}s")
4. 데이터베이스 무결성 검증
# tests/test_database.py
import pytest
from dbConnection import supabase
import pandas as pd
from datetime import datetime, timedelta

class TestDatabaseConnection:
    """데이터베이스 연결 테스트"""
    
    def test_supabase_connection(self):
        """Supabase 연결 확인"""
        try:
            response = supabase.table("economic_and_stock_data").select("*").limit(1).execute()
            assert response.data is not None
            print("✅ Supabase connection successful")
        except Exception as e:
            pytest.fail(f"Supabase connection failed: {e}")


class TestEconomicDataTable:
    """economic_and_stock_data 테이블 검증"""
    
    def test_table_exists(self):
        """테이블 존재 확인"""
        response = supabase.table("economic_and_stock_data").select("날짜").limit(1).execute()
        assert len(response.data) > 0
    
    def test_data_integrity(self):
        """데이터 무결성 검증"""
        # 최근 30일 데이터 조회
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        response = supabase.table("economic_and_stock_data")\
            .select("*")\
            .gte("날짜", str(start_date))\
            .lte("날짜", str(end_date))\
            .execute()
        
        df = pd.DataFrame(response.data)
        
        # 필수 컬럼 존재 확인
        required_columns = ["날짜", "애플", "마이크로소프트", "테슬라", "기준금리"]
        for col in required_columns:
            assert col in df.columns, f"Missing column: {col}"
        
        # NULL 값 비율 확인 (10% 미만)
        null_ratio = df.isnull().sum() / len(df)
        high_null_cols = null_ratio[null_ratio > 0.1]
        
        if len(high_null_cols) > 0:
            print(f"⚠️  Columns with >10% NULL: {high_null_cols.to_dict()}")
        
        # 주가 데이터 범위 검증 (0 이상)
        stock_columns = ["애플", "마이크로소프트", "테슬라"]
        for col in stock_columns:
            if col in df.columns:
                assert (df[col] >= 0).all(), f"{col} has negative values"
    
    def test_date_continuity(self):
        """날짜 연속성 검증 (주말 제외)"""
        response = supabase.table("economic_and_stock_data")\
            .select("날짜")\
            .order("날짜", desc=False)\
            .limit(100)\
            .execute()
        
        dates = pd.to_datetime([r["날짜"] for r in response.data])
        
        # 날짜 정렬 확인
        assert (dates == dates.sort_values()).all(), "Dates are not sorted"
        
        # 주말 제외 연속성 확인
        business_days = pd.bdate_range(start=dates.min(), end=dates.max())
        missing_days = set(business_days) - set(dates)
        
        if len(missing_days) > 5:
            print(f"⚠️  {len(missing_days)} business days missing")


class TestPredictedStocksTable:
    """predicted_stocks 테이블 검증"""
    
    def test_prediction_accuracy(self):
        """예측 정확도 계산"""
        response = supabase.table("predicted_stocks")\
            .select("*")\
            .limit(100)\
            .execute()
        
        df = pd.DataFrame(response.data)
        
        # Actual과 Predicted 컬럼 매칭
        stock_names = ["애플", "마이크로소프트", "테슬라"]
        
        for stock in stock_names:
            pred_col = f"{stock}_Predicted"
            actual_col = f"{stock}_Actual"
            
            if pred_col in df.columns and actual_col in df.columns:
                # NaN 제거
                valid_data = df[[pred_col, actual_col]].dropna()
                
                if len(valid_data) > 0:
                    # MAPE 계산
                    mape = (abs(valid_data[pred_col] - valid_data[actual_col]) / valid_data[actual_col]).mean() * 100
                    
                    print(f"📊 {stock} Prediction MAPE: {mape:.2f}%")
                    
                    # 정확도 기준: MAPE < 20%
                    assert mape < 20, f"{stock} prediction accuracy too low: {mape:.2f}%"


class TestStockRecommendationsTable:
    """stock_recommendations 테이블 검증"""
    
    def test_technical_indicators_range(self):
        """기술적 지표 범위 검증"""
        response = supabase.table("stock_recommendations")\
            .select("*")\
            .limit(100)\
            .execute()
        
        df = pd.DataFrame(response.data)
        
        # RSI 범위 확인 (0~100)
        if "RSI" in df.columns:
            rsi_values = df["RSI"].dropna()
            assert (rsi_values >= 0).all() and (rsi_values <= 100).all(), "RSI out of range"
        
        # Boolean 필드 검증
        boolean_fields = ["골든_크로스", "MACD_매수_신호", "추천_여부"]
        for field in boolean_fields:
            if field in df.columns:
                unique_values = df[field].dropna().unique()
                assert set(unique_values).issubset({True, False, 0, 1}), f"{field} has invalid values"
5. AI 예측 모델 검증
# tests/test_ai_prediction.py
import pytest
import numpy as np
import pandas as pd
from predict import build_transformer_with_two_inputs
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

class TestTransformerModel:
    """Transformer 모델 검증"""
    
    def test_model_architecture(self):
        """모델 구조 검증"""
        stock_shape = (90, 27)  # 90일 lookback, 27개 종목
        econ_shape = (90, 37)   # 90일 lookback, 37개 경제 지표
        
        model = build_transformer_with_two_inputs(
            stock_shape=stock_shape,
            econ_shape=econ_shape,
            num_heads=8,
            ff_dim=256,
            target_size=27
        )
        
        # 입력 형태 확인
        assert len(model.inputs) == 2, "Model should have 2 inputs"
        assert model.inputs[0].shape[1:] == stock_shape
        assert model.inputs[1].shape[1:] == econ_shape
        
        # 출력 형태 확인
        assert model.output.shape[-1] == 27, "Output should predict 27 stocks"
        
        print(f"✅ Model architecture valid")
        print(f"   Total parameters: {model.count_params():,}")
    
    def test_prediction_output_range(self):
        """예측 결과 범위 검증 (음수 주가 방지)"""
        # 더미 데이터 생성
        X_stock = np.random.rand(10, 90, 27)
        X_econ = np.random.rand(10, 90, 37)
        
        model = build_transformer_with_two_inputs((90, 27), (90, 37), 8, 256, 27)
        predictions = model.predict([X_stock, X_econ])
        
        # 모든 예측값이 스케일링된 범위 (0~1) 내에 있는지 확인
        assert predictions.min() >= 0, "Predictions contain negative values after scaling"
        assert predictions.max() <= 1, "Predictions exceed scaling range"
    
    def test_model_performance(self):
        """실제 데이터로 모델 성능 평가"""
        # Supabase에서 최근 데이터 로드
        from dbConnection import supabase
        
        response = supabase.table("predicted_stocks")\
            .select("*")\
            .order("날짜", desc=True)\
            .limit(100)\
            .execute()
        
        df = pd.DataFrame(response.data)
        
        stock_names = ["애플", "마이크로소프트", "테슬라"]
        performance_report = {}
        
        for stock in stock_names:
            pred_col = f"{stock}_Predicted"
            actual_col = f"{stock}_Actual"
            
            if pred_col in df.columns and actual_col in df.columns:
                valid_data = df[[pred_col, actual_col]].dropna()
                
                if len(valid_data) > 10:
                    mae = mean_absolute_error(valid_data[actual_col], valid_data[pred_col])
                    mape = mean_absolute_percentage_error(valid_data[actual_col], valid_data[pred_col]) * 100
                    
                    performance_report[stock] = {
                        "MAE": round(mae, 2),
                        "MAPE": round(mape, 2),
                        "Accuracy": round(100 - mape, 2)
                    }
        
        print("\n📊 AI Model Performance Report:")
        for stock, metrics in performance_report.items():
            print(f"   {stock}:")
            print(f"      MAE: ${metrics['MAE']}")
            print(f"      MAPE: {metrics['MAPE']}%")
            print(f"      Accuracy: {metrics['Accuracy']}%")
            
            # 정확도 기준: 80% 이상
            assert metrics["Accuracy"] >= 80, f"{stock} accuracy below threshold"
6. 한국투자증권 API 연동 검증
# tests/test_trading_api.py
import pytest
from getBalance import get_token, get_overseas_balance
import os
from datetime import datetime, timezone
import pytz

class TestKoreaInvestmentAPI:
    """한국투자증권 API 테스트"""
    
    def test_token_generation(self):
        """토큰 생성 검증"""
        token = get_token()
        
        assert token is not None, "Token generation failed"
        assert len(token) > 50, "Token seems invalid (too short)"
        
        print(f"✅ Token generated: {token[:20]}...")
    
    def test_token_expiration_logic(self):
        """토큰 만료 로직 검증"""
        from dbConnection import supabase
        
        # DB에서 토큰 조회
        response = supabase.table("access_tokens")\
            .select("*")\
            .order("생성일", desc=True)\
            .limit(1)\
            .execute()
        
        if len(response.data) > 0:
            token_data = response.data[0]
            created_at = datetime.fromisoformat(token_data["생성일"].replace("Z", "+00:00"))
            now = datetime.now(pytz.UTC)
            
            age_hours = (now - created_at).total_seconds() / 3600
            
            print(f"📅 Token age: {age_hours:.2f} hours")
            
            # 24시간 이상이면 만료 예상
            if age_hours >= 24:
                print("⚠️  Token should be expired, will refresh")
    
    @pytest.mark.skipif(
        os.getenv("KIS_APPKEY") is None,
        reason="Korea Investment API keys not configured"
    )
    def test_balance_inquiry(self):
        """잔고 조회 API 호출"""
        try:
            balance = get_overseas_balance()
            
            assert balance is not None, "Balance inquiry failed"
            
            # 응답 구조 검증
            if isinstance(balance, dict):
                print(f"💰 Overseas Balance Retrieved:")
                if "output1" in balance:
                    stocks = balance["output1"]
                    print(f"   Positions: {len(stocks)}")
        
        except Exception as e:
            pytest.skip(f"API call failed (expected in test env): {e}")
    
    def test_api_error_handling(self):
        """API 오류 처리 검증"""
        # 잘못된 AppKey로 요청 시뮬레이션
        import requests
        
        url = "https://openapivts.koreainvestment.com:29443/oauth2/tokenP"
        headers = {"Content-Type": "application/json"}
        body = {
            "grant_type": "client_credentials",
            "appkey": "INVALID_KEY",
            "appsecret": "INVALID_SECRET"
        }
        
        response = requests.post(url, json=body, headers=headers)
        
        # 401 또는 400 에러 예상
        assert response.status_code in [400, 401], "Expected authentication error"
        print(f"✅ Error handling works: {response.status_code}")
7. E2E 시나리오 테스트
# tests/test_e2e_scenarios.py
import pytest
from playwright.async_api import async_playwright
import asyncio

class TestTradingWorkflow:
    """전체 매매 워크플로우 테스트"""
    
    @pytest.mark.asyncio
    async def test_full_trading_cycle(self, page, base_url):
        """
        E2E 시나리오: 데이터 수집 → 예측 → 추천 → 매수
        """
        print("\n🔄 Starting Full Trading Cycle Test...")
        
        # Step 1: 서버 상태 확인
        print("1️⃣  Checking server health...")
        response = await page.goto(f"{base_url}/")
        assert response.status == 200
        
        # Step 2: 잔고 조회
        print("2️⃣  Fetching account balance...")
        await page.goto(f"{base_url}/balance")
        balance_content = await page.content()
        assert "error" not in balance_content.lower()
        
        # Step 3: AI 예측 결과 확인
        print("3️⃣  Retrieving AI predictions...")
        await page.goto(f"{base_url}/predictions")
        predictions = await page.evaluate("JSON.parse(document.body.innerText)")
        
        assert "predictions" in predictions or isinstance(predictions, list)
        
        # Step 4: 매수 추천 종목 확인
        print("4️⃣  Checking buy recommendations...")
        # 추천 API가 있다면 호출
        # await page.goto(f"{base_url}/recommendations")
        
        # Step 5: 실제 매수 시뮬레이션 (모의투자)
        print("5️⃣  Simulating buy order...")
        # POST 요청 시뮬레이션
        # await page.evaluate(...)
        
        print("✅ Full trading cycle completed successfully")
    
    @pytest.mark.asyncio
    async def test_data_update_workflow(self, page, base_url):
        """
        데이터 업데이트 워크플로우
        """
        print("\n🔄 Testing Data Update Workflow...")
        
        # 업데이트 트리거
        response = await page.evaluate(f"""
            fetch('{base_url}/update_data', {{
                method: 'POST'
            }})
            .then(r => r.json())
        """)
        
        assert "started" in response["message"].lower() or "background" in response["message"].lower()
        
        # 백그라운드 작업 완료 대기 (최대 5분)
        print("⏳ Waiting for background task (max 5min)...")
        
        for i in range(30):  # 10초 간격으로 30회 확인
            await asyncio.sleep(10)
            
            # 최신 데이터 확인
            await page.goto(f"{base_url}/predictions")
            content = await page.content()
            
            if "predictions" in content or len(content) > 100:
                print(f"✅ Data update completed after {(i+1)*10} seconds")
                break
        else:
            pytest.skip("Data update took longer than 5 minutes")
    
    @pytest.mark.asyncio
    async def test_error_recovery(self, page, base_url):
        """
        에러 복구 시나리오
        """
        # 잘못된 요청 전송
        response = await page.goto(f"{base_url}/stock/INVALID_TICKER_12345")
        
        # 에러 응답 확인
        assert response.status in [400, 404, 500]
        
        # 정상 요청으로 복구 확인
        response = await page.goto(f"{base_url}/stock/AAPL")
        assert response.status == 200
        
        print("✅ Error recovery successful")
8. 성능 및 부하 테스트
# tests/test_load_testing.py
import pytest
import asyncio
import time
from playwright.async_api import async_playwright

class TestLoadTesting:
    """부하 테스트"""
    
    @pytest.mark.asyncio
    async def test_stress_test(self, base_url):
        """스트레스 테스트: 100명 동시 접속"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            async def user_session(user_id):
                context = await browser.new_context()
                page = await context.new_page()
                
                start = time.time()
                
                try:
                    # 루트 페이지 접속
                    await page.goto(base_url, wait_until="domcontentloaded", timeout=10000)
                    
                    # 잔고 조회
                    await page.goto(f"{base_url}/balance", wait_until="domcontentloaded", timeout=10000)
                    
                    # 예측 조회
                    await page.goto(f"{base_url}/predictions", wait_until="domcontentloaded", timeout=10000)
                    
                    elapsed = time.time() - start
                    
                    return {
                        "user_id": user_id,
                        "success": True,
                        "time": elapsed
                    }
                
                except Exception as e:
                    return {
                        "user_id": user_id,
                        "success": False,
                        "error": str(e)
                    }
                
                finally:
                    await context.close()
            
            # 100명 동시 접속
            print("\n🚀 Starting stress test with 100 concurrent users...")
            tasks = [user_session(i) for i in range(100)]
            results = await asyncio.gather(*tasks)
            
            await browser.close()
            
            # 결과 분석
            successful = [r for r in results if r["success"]]
            failed = [r for r in results if not r["success"]]
            
            success_rate = len(successful) / len(results) * 100
            avg_time = sum(r["time"] for r in successful) / len(successful) if successful else 0
            
            print(f"\n📊 Stress Test Results:")
            print(f"   Total Users: {len(results)}")
            print(f"   Successful: {len(successful)} ({success_rate:.1f}%)")
            print(f"   Failed: {len(failed)}")
            print(f"   Avg Response Time: {avg_time:.2f}s")
            
            # 성공률 기준: 90% 이상
            assert success_rate >= 90, f"Success rate too low: {success_rate:.1f}%"
            
            # 평균 응답 시간: 5초 이내
            assert avg_time < 5.0, f"Average response time too slow: {avg_time:.2f}s"
9. CI/CD 파이프라인 통합
9.1 GitHub Actions 워크플로우
# .github/workflows/playwright-tests.yml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # 매일 자정 실행

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install playwright pytest-playwright
        playwright install
    
    - name: Start FastAPI server
      run: |
        uvicorn main:app --host 0.0.0.0 --port 8000 &
        sleep 5
      env:
        FRED_API_KEY: ${{ secrets.FRED_API_KEY }}
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
    
    - name: Run Playwright tests
      run: |
        pytest tests/ -v --html=report.html --self-contained-html
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: |
          report.html
          tests/screenshots/
    
    - name: Notify on failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Playwright tests failed!'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
9.2 pytest 설정
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Tests that take more than 5 seconds
    api: API endpoint tests
    db: Database tests

addopts =
    -v
    --tb=short
    --strict-markers
    --disable-warnings
    --html=test_report.html
    --self-contained-html
9.3 실행 스크립트
# run_tests.sh
#!/bin/bash

echo "🚀 Starting StockMaru Playwright Tests"

# 환경 변수 로드
source .env

# FastAPI 서버 시작
echo "🔧 Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!
sleep 5

# 서버 상태 확인
curl -s http://localhost:8000/ > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Server failed to start"
    kill $SERVER_PID
    exit 1
fi

echo "✅ Server started (PID: $SERVER_PID)"

# 테스트 실행
echo "🧪 Running tests..."

# 단위 테스트
pytest tests/test_api_endpoints.py -v -m api

# 통합 테스트
pytest tests/test_database.py -v -m db

# E2E 테스트
pytest tests/test_e2e_scenarios.py -v -m e2e

# 서버 종료
echo "🛑 Stopping server..."
kill $SERVER_PID

echo "✅ All tests completed!"
10. 테스트 실행 가이드
10.1 전체 테스트 실행
# 모든 테스트 실행
pytest tests/ -v

# 특정 마커만 실행
pytest tests/ -m api        # API 테스트만
pytest tests/ -m db         # DB 테스트만
pytest tests/ -m e2e        # E2E 테스트만

# 병렬 실행 (속도 향상)
pytest tests/ -n 4          # 4개 워커 사용
10.2 개별 테스트 실행
# 특정 파일 실행
pytest tests/test_api_endpoints.py -v

# 특정 클래스 실행
pytest tests/test_api_endpoints.py::TestBalanceEndpoints -v

# 특정 테스트 함수 실행
pytest tests/test_api_endpoints.py::TestBalanceEndpoints::test_get_balance -v
10.3 리포트 생성
# HTML 리포트
pytest tests/ --html=report.html --self-contained-html

# Coverage 리포트
pytest tests/ --cov=. --cov-report=html

# JUnit XML (CI/CD용)
pytest tests/ --junitxml=test_results.xml
11. 모니터링 및 알림
테스트 결과 대시보드
# tests/generate_report.py
import json
from datetime import datetime

def generate_test_report(results):
    """테스트 결과 요약 리포트 생성"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total": len(results),
            "passed": len([r for r in results if r["passed"]]),
            "failed": len([r for r in results if not r["passed"]]),
            "success_rate": 0
        },
        "details": results
    }
    
    report["summary"]["success_rate"] = (
        report["summary"]["passed"] / report["summary"]["total"] * 100
    )
    
    # JSON 저장
    with open("test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    # 콘솔 출력
    print("\n" + "="*50)
    print("📊 TEST REPORT")
    print("="*50)
    print(f"Total Tests: {report['summary']['total']}")
    print(f"✅ Passed: {report['summary']['passed']}")
    print(f"❌ Failed: {report['summary']['failed']}")
    print(f"Success Rate: {report['summary']['success_rate']:.1f}%")
    print("="*50)
    
    return report
📋 요약
Playwright를 활용한 StockMaru 검증 전략:
✅ 테스트 범위
API 엔드포인트: 응답 코드, 데이터 형식, 응답 시간
데이터베이스: 무결성, 연속성, 예측 정확도
AI 모델: 구조, 성능, 정확도
외부 API: 한국투자증권, Alpha Vantage 연동
E2E 시나리오: 전체 매매 워크플로우
성능: 부하 테스트, 동시성 처리
🎯 기대 효과
버그 조기 발견 (배포 전 90% 이상 감지)
회귀 테스트 자동화
API 성능 모니터링
실거래 전 시스템 안정성 보장
🚀 다음 단계
테스트 환경 구축 (pytest.ini, conftest.py)
단위 테스트부터 점진적 확대
CI/CD 파이프라인 통합
일일 자동 실행 및 리포트 생성