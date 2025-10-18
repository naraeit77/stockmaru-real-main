"""
주식 종목 관리 API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import re
from pathlib import Path

router = APIRouter()

class Stock(BaseModel):
    ticker: str
    korean_name: str

class StockAddRequest(BaseModel):
    ticker: str
    korean_name: str

class StockRemoveRequest(BaseModel):
    korean_name: str

class StockRenameRequest(BaseModel):
    old_name: str
    new_name: str


class StockManager:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.stock_py = self.project_root / "stock.py"
        self.predict_py = self.project_root / "predict.py"
        self.service_py = self.project_root / "app" / "services" / "stock_recommendation_service.py"

    def read_file(self, file_path):
        """파일 읽기"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def write_file(self, file_path, content):
        """파일 쓰기"""
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def get_current_stocks(self) -> List[Stock]:
        """현재 종목 리스트 조회"""
        content = self.read_file(self.stock_py)

        # nasdaq_top_100 찾기
        pattern = r'nasdaq_top_100\s*=\s*\[(.*?)\]'
        match = re.search(pattern, content, re.DOTALL)

        if not match:
            raise ValueError("nasdaq_top_100을 찾을 수 없습니다.")

        stocks_block = match.group(1)

        # 각 종목 파싱
        stock_pattern = r'\("([A-Z]+)",\s*"([^"]+)"\)'
        stocks = re.findall(stock_pattern, stocks_block)

        return [Stock(ticker=ticker, korean_name=name) for ticker, name in stocks]

    def add_stock(self, ticker: str, korean_name: str):
        """종목 추가"""
        # 1. stock.py 수정
        content = self.read_file(self.stock_py)
        pattern = r'(nasdaq_top_100\s*=\s*\[)(.*?)(\])'
        match = re.search(pattern, content, re.DOTALL)

        if not match:
            raise ValueError("nasdaq_top_100을 찾을 수 없습니다.")

        prefix, stocks_block, suffix = match.groups()
        stocks_block = stocks_block.rstrip()
        if not stocks_block.endswith(','):
            stocks_block += ','

        new_entry = f'\n    ("{ticker}", "{korean_name}")'
        stocks_block += new_entry

        new_content = content[:match.start()] + prefix + stocks_block + '\n' + suffix + content[match.end():]
        self.write_file(self.stock_py, new_content)

        # 2. predict.py 수정
        content = self.read_file(self.predict_py)
        pattern = r'(target_columns\s*=\s*\[)(.*?)(\])'
        match = re.search(pattern, content, re.DOTALL)

        if not match:
            raise ValueError("target_columns를 찾을 수 없습니다.")

        prefix, columns_block, suffix = match.groups()
        columns_block = columns_block.rstrip()
        if not columns_block.endswith(','):
            columns_block += ','

        new_entry = f" '{korean_name}'"
        columns_block += new_entry

        new_content = content[:match.start()] + prefix + columns_block + '\n' + suffix + content[match.end():]
        self.write_file(self.predict_py, new_content)

        # 3. stock_recommendation_service.py 수정
        content = self.read_file(self.service_py)
        pattern = r'(STOCK_TO_TICKER\s*=\s*\{)(.*?)(\})'
        match = re.search(pattern, content, re.DOTALL)

        if not match:
            raise ValueError("STOCK_TO_TICKER를 찾을 수 없습니다.")

        prefix, dict_block, suffix = match.groups()
        dict_block = dict_block.rstrip()
        if not dict_block.endswith(','):
            dict_block += ','

        new_entry = f'\n    "{korean_name}": "{ticker}"'
        dict_block += new_entry

        new_content = content[:match.start()] + prefix + dict_block + '\n' + suffix + content[match.end():]
        self.write_file(self.service_py, new_content)

    def remove_stock(self, korean_name: str):
        """종목 삭제"""
        # 1. stock.py 수정
        content = self.read_file(self.stock_py)
        pattern = rf'^\s*\("[A-Z]+",\s*"{korean_name}"\),?\s*$'
        new_content = re.sub(pattern, '', content, flags=re.MULTILINE)
        self.write_file(self.stock_py, new_content)

        # 2. predict.py 수정
        content = self.read_file(self.predict_py)
        pattern = rf"'{korean_name}',?\s*"
        new_content = re.sub(pattern, '', content)
        self.write_file(self.predict_py, new_content)

        # 3. stock_recommendation_service.py 수정
        content = self.read_file(self.service_py)
        pattern = rf'^\s*"{korean_name}":\s*"[A-Z]+",?\s*$'
        new_content = re.sub(pattern, '', content, flags=re.MULTILINE)
        self.write_file(self.service_py, new_content)

    def rename_stock(self, old_name: str, new_name: str):
        """종목명 변경"""
        # 1. stock.py 수정
        content = self.read_file(self.stock_py)
        content = content.replace(f'"{old_name}"', f'"{new_name}"')
        self.write_file(self.stock_py, content)

        # 2. predict.py 수정
        content = self.read_file(self.predict_py)
        content = content.replace(f"'{old_name}'", f"'{new_name}'")
        self.write_file(self.predict_py, content)

        # 3. stock_recommendation_service.py 수정
        content = self.read_file(self.service_py)
        content = content.replace(f'"{old_name}"', f'"{new_name}"')
        self.write_file(self.service_py, content)


# StockManager 인스턴스
stock_manager = StockManager()


@router.get("/stocks", response_model=List[Stock])
async def get_stocks():
    """
    등록된 주식 종목 목록 조회
    """
    try:
        stocks = stock_manager.get_current_stocks()
        return stocks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종목 목록 조회 실패: {str(e)}")


@router.post("/stocks/add")
async def add_stock(request: StockAddRequest):
    """
    새로운 주식 종목 추가

    - **ticker**: 주식 티커 심볼 (예: AAPL, MSFT)
    - **korean_name**: 한글 종목명 (예: 애플, 마이크로소프트)
    """
    try:
        # 티커 대문자 변환
        ticker = request.ticker.upper()

        # 중복 체크
        existing_stocks = stock_manager.get_current_stocks()
        for stock in existing_stocks:
            if stock.ticker == ticker:
                raise HTTPException(status_code=400, detail=f"티커 {ticker}는 이미 존재합니다.")
            if stock.korean_name == request.korean_name:
                raise HTTPException(status_code=400, detail=f"종목명 '{request.korean_name}'는 이미 존재합니다.")

        # 종목 추가
        stock_manager.add_stock(ticker, request.korean_name)

        return {
            "message": f"종목 추가 성공: {request.korean_name} ({ticker})",
            "ticker": ticker,
            "korean_name": request.korean_name,
            "next_steps": [
                "rm *_cache.pkl - 캐시 삭제",
                "python stock.py - 데이터 수집",
                "python predict.py - 모델 재학습",
                "서버 재시작"
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종목 추가 실패: {str(e)}")


@router.delete("/stocks/remove")
async def remove_stock(request: StockRemoveRequest):
    """
    주식 종목 삭제

    - **korean_name**: 삭제할 종목의 한글명
    """
    try:
        # 존재 확인
        existing_stocks = stock_manager.get_current_stocks()
        found = False
        for stock in existing_stocks:
            if stock.korean_name == request.korean_name:
                found = True
                break

        if not found:
            raise HTTPException(status_code=404, detail=f"종목 '{request.korean_name}'를 찾을 수 없습니다.")

        # 종목 삭제
        stock_manager.remove_stock(request.korean_name)

        return {
            "message": f"종목 삭제 성공: {request.korean_name}",
            "korean_name": request.korean_name,
            "next_steps": [
                "rm *_cache.pkl - 캐시 삭제",
                "python predict.py - 모델 재학습",
                "서버 재시작"
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종목 삭제 실패: {str(e)}")


@router.put("/stocks/rename")
async def rename_stock(request: StockRenameRequest):
    """
    주식 종목명 변경

    - **old_name**: 기존 한글 종목명
    - **new_name**: 새로운 한글 종목명
    """
    try:
        # 기존 종목 확인
        existing_stocks = stock_manager.get_current_stocks()
        found = False
        for stock in existing_stocks:
            if stock.korean_name == request.old_name:
                found = True
            if stock.korean_name == request.new_name:
                raise HTTPException(status_code=400, detail=f"새 종목명 '{request.new_name}'는 이미 존재합니다.")

        if not found:
            raise HTTPException(status_code=404, detail=f"종목 '{request.old_name}'를 찾을 수 없습니다.")

        # 종목명 변경
        stock_manager.rename_stock(request.old_name, request.new_name)

        return {
            "message": f"종목명 변경 성공: {request.old_name} → {request.new_name}",
            "old_name": request.old_name,
            "new_name": request.new_name,
            "next_steps": [
                "rm *_cache.pkl - 캐시 삭제",
                "python predict.py - 모델 재학습",
                "서버 재시작"
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종목명 변경 실패: {str(e)}")


@router.get("/stocks/count")
async def get_stocks_count():
    """
    등록된 종목 개수 조회
    """
    try:
        stocks = stock_manager.get_current_stocks()
        return {
            "count": len(stocks),
            "message": f"현재 {len(stocks)}개의 종목이 등록되어 있습니다."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종목 개수 조회 실패: {str(e)}")
