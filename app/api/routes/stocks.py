from fastapi import APIRouter, HTTPException
from typing import List
import pandas as pd
from app.db.supabase import supabase
from app.schemas.stock import StockPrediction

router = APIRouter()

# 영문명/티커 → 한글명 매핑
TICKER_TO_KOREAN = {
    # 영문 전체 이름
    "Apple": "애플",
    "Microsoft": "마이크로소프트",
    "Amazon": "아마존",
    "Google A": "구글 A",
    "Google C": "구글 C",
    "Meta": "메타",
    "Tesla": "테슬라",
    "NVIDIA": "엔비디아",
    "Costco": "코스트코",
    "Netflix": "넷플릭스",
    "PayPal": "페이팔",
    "Intel": "인텔",
    "Cisco": "시스코",
    "Comcast": "컴캐스트",
    "PepsiCo": "펩시코",
    "Amgen": "암젠",
    "Honeywell": "허니웰 인터내셔널",
    "Starbucks": "스타벅스",
    "Mondelez": "몬델리즈",
    "Micron": "마이크론",
    "Broadcom": "브로드컴",
    "Adobe": "어도비",
    "Texas Instruments": "텍사스 인스트루먼트",
    "Applied Materials": "어플라이드 머티리얼즈",
    "S&P 500 ETF": "S&P 500 ETF",
    "QQQ ETF": "QQQ ETF",

    # 티커 심볼
    "AAPL": "애플",
    "MSFT": "마이크로소프트",
    "AMZN": "아마존",
    "GOOGL": "구글 A",
    "GOOG": "구글 C",
    "META": "메타",
    "TSLA": "테슬라",
    "NVDA": "엔비디아",
    "COST": "코스트코",
    "NFLX": "넷플릭스",
    "PYPL": "페이팔",
    "INTC": "인텔",
    "CSCO": "시스코",
    "CMCSA": "컴캐스트",
    "PEP": "펩시코",
    "AMGN": "암젠",
    "HON": "허니웰 인터내셔널",
    "SBUX": "스타벅스",
    "MDLZ": "몬델리즈",
    "MU": "마이크론",
    "AVGO": "브로드컴",
    "ADBE": "어도비",
    "TXN": "텍사스 인스트루먼트",
    "AMD": "AMD",
    "AMAT": "어플라이드 머티리얼즈",
    "SPY": "S&P 500 ETF",
    "QQQ": "QQQ ETF"
}

@router.get("/predictions", summary="주식 예측 결과 조회", response_model=List[StockPrediction])
def read_predictions():
    try:
        # Supabase에서 예측 결과를 가져옴
        response = supabase.table("stock_analysis_results").select("*").execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="예측 결과가 없습니다.")

        predictions = []
        for row in response.data:
            predictions.append(
                StockPrediction(
                    stock=row.get("stock_name", row.get("Stock", "")),
                    last_price=float(row.get("last_actual_price", row.get("Last Actual Price", 0))),
                    predicted_price=float(row.get("predicted_future_price", row.get("Predicted Future Price", 0))),
                    rise_probability=float(row.get("rise_probability", row.get("Rise Probability (%)", 0))),
                    recommendation=row.get("recommendation", row.get("Recommendation", "")),
                    analysis=row.get("analysis", row.get("Analysis", ""))
                )
            )
        return predictions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"예측 결과 조회 중 오류 발생: {str(e)}")

@router.get("/{ticker}", summary="특정 주식 정보 조회")
def read_stock_info(ticker: str):
    try:
        # 영문명/티커를 한글명으로 변환 (대소문자 무시)
        korean_name = ticker
        for key, value in TICKER_TO_KOREAN.items():
            if key.upper() == ticker.upper():
                korean_name = value
                break

        # 여러 테이블에서 주식 정보를 조회
        result = {"ticker": ticker, "korean_name": korean_name}

        # 1. stock_analysis_results 테이블에서 분석 결과 조회 (컬럼명: Stock)
        analysis_response = supabase.table("stock_analysis_results").select("*").eq("Stock", korean_name).execute()
        if analysis_response.data:
            result["analysis"] = analysis_response.data[0]

        # 2. predicted_stocks 테이블에서 예측 데이터 조회 (컬럼명: 날짜, {주식명}_Predicted)
        predicted_response = supabase.table("predicted_stocks").select("*").order("날짜", desc=True).limit(30).execute()
        if predicted_response.data:
            # 한글명에 해당하는 컬럼 찾기 (예: 테슬라_Predicted, 테슬라_Actual)
            predicted_col = f"{korean_name}_Predicted"
            actual_col = f"{korean_name}_Actual"

            predictions = []
            for row in predicted_response.data:
                if predicted_col in row and actual_col in row:
                    predictions.append({
                        "date": row.get("날짜"),
                        "predicted": row.get(predicted_col),
                        "actual": row.get(actual_col)
                    })

            if predictions:
                result["predictions"] = predictions

        # 3. stock_recommendations 테이블에서 기술적 분석 조회
        try:
            recommendations_response = supabase.table("stock_recommendations").select("*").eq("ticker", ticker).order("timestamp", desc=True).limit(1).execute()
            if recommendations_response.data:
                result["technical_analysis"] = recommendations_response.data[0]
        except Exception:
            # stock_recommendations 테이블이 없거나 오류 발생 시 건너뜀
            pass

        # 4. ticker_sentiment_analysis 테이블에서 뉴스 감성 분석 조회
        try:
            sentiment_response = supabase.table("ticker_sentiment_analysis").select("*").eq("ticker", ticker).order("time_published", desc=True).limit(10).execute()
            if sentiment_response.data:
                result["sentiment_analysis"] = sentiment_response.data
        except Exception:
            # ticker_sentiment_analysis 테이블이 없거나 오류 발생 시 건너뜀
            pass

        # 분석 또는 예측 데이터가 하나라도 있으면 성공
        if "analysis" not in result and "predictions" not in result:
            raise HTTPException(status_code=404, detail=f"{ticker} 주식 정보를 찾을 수 없습니다. 지원되는 주식인지 확인하세요.")

        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"주식 정보 조회 중 오류 발생: {str(e)}")