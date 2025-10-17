import requests
import pandas as pd
from datetime import datetime, timedelta
import time

# 1) 다운로드 함수 정의
def download_yahoo_chart(symbol, range_str="1mo", interval="1d"):
    """
    Yahoo Finance Chart API를 통해 주어진 symbol의 종가(Close) 시계열을 가져옵니다.
    - symbol: Yahoo Finance 티커 문자열 (예: "^GSPC", "AAPL")
    - range_str: "1d", "5d", "1mo", "3mo", "6mo", "1y" 등
    - interval: "1d", "1wk", "1mo"
    """
    sess = requests.Session()
    sess.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    })
    
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {
        "range": range_str,
        "interval": interval,
        "includePrePost": "false",
        "events": "div|split"
    }
    
    r = sess.get(url, params=params)
    r.raise_for_status()
    result = r.json().get("chart", {}).get("result", [None])[0]
    if not result:
        raise ValueError(f"No data for symbol: {symbol}")
    
    timestamps = result["timestamp"]
    closes     = result["indicators"]["quote"][0]["close"]
    
    df = pd.DataFrame({
        "DateTime": pd.to_datetime(timestamps, unit="s"),
        symbol: closes
    }).set_index("DateTime")
    return df

# 2) 수집 대상 정의
yfinance_indicators = {
    'S&P 500 지수': '^GSPC',
    '금 가격': 'GC=F',
    '달러 인덱스': 'DX-Y.NYB',
    '나스닥 100': '^NDX',
    'S&P 500 ETF': 'SPY',
    'QQQ ETF': 'QQQ',
    '러셀 2000 ETF': 'IWM',
    '다우 존스 ETF': 'DIA',
    'VIX 지수': '^VIX',
    '닛케이 225': '^N225',
    '상해종합': '000001.SS',
    '항셍': '^HSI',
    '영국 FTSE': '^FTSE',
    '독일 DAX': '^GDAXI',
    '프랑스 CAC 40': '^FCHI',
    '미국 전체 채권시장 ETF': 'AGG',
    'TIPS ETF': 'TIP',
    '투자등급 회사채 ETF': 'LQD',
    '달러/엔': 'JPY=X',
    '달러/위안': 'CNY=X',
    '미국 리츠 ETF': 'VNQ'
}

nasdaq_top_100 = [
    ("AAPL", "애플"), ("MSFT", "마이크로소프트"), ("AMZN", "아마존"),
    ("GOOGL", "구글 A"), ("GOOG", "구글 C"), ("META", "메타"),
    ("TSLA", "테슬라"), ("NVDA", "엔비디아"), ("COST", "코스트코"),
    ("NFLX", "넷플릭스"), ("PYPL", "페이팔"), ("INTC", "인텔"),
    ("CSCO", "시스코"), ("CMCSA", "컴캐스트"), ("PEP", "펩시코"),
    ("AMGN", "암젠"), ("HON", "허니웰 인터내셔널"), ("SBUX", "스타벅스"),
    ("MDLZ", "몬델리즈"), ("MU", "마이크론"), ("AVGO", "브로드컴"),
    ("ADBE", "어도비"), ("TXN", "텍사스 인스트루먼트"), ("AMD", "AMD"),
    ("AMAT", "어플라이드 머티리얼즈")
]

# 3) 데이터 수집
if __name__ == "__main__":
    range_str = "1mo"    # 한 달치
    interval  = "1d"     # 일간
    all_dfs = []

    print("=== 지표 데이터 수집 ===")
    for name, sym in yfinance_indicators.items():
        try:
            df = download_yahoo_chart(sym, range_str, interval)
            df = df.rename(columns={sym: name})
            all_dfs.append(df)
            print(f"{name}({sym}) 수집 완료, {len(df)}개")
        except Exception as e:
            print(f"{name}({sym}) 오류: {e}")
        time.sleep(2)

    print("\n=== 나스닥 Top 100 수집 ===")
    for ticker, kor in nasdaq_top_100:
        try:
            df = download_yahoo_chart(ticker, range_str, interval)
            df = df.rename(columns={ticker: kor})
            all_dfs.append(df)
            print(f"{kor}({ticker}) 수집 완료, {len(df)}개")
        except Exception as e:
            print(f"{kor}({ticker}) 오류: {e}")
        time.sleep(2)

    # 4) 하나의 DataFrame으로 병합
    result_df = pd.concat(all_dfs, axis=1)

    # 5) DateTime → 날짜 기준으로 리샘플링: 하루에 하나씩
    result_df = result_df.resample('D').last()

    # 6) 인덱스 이름을 Date로 변경
    result_df.index.name = "Date"

    # 7) CSV로 저장
    result_df.to_csv("total_data.csv", encoding="utf-8-sig")
    print("\n=== total_data.csv 저장 완료 ===")
    print(result_df.tail())