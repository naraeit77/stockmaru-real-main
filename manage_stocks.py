#!/usr/bin/env python3
"""
주식 종목 관리 자동화 스크립트

사용법:
    python manage_stocks.py add NVDA 엔비디아        # 종목 추가
    python manage_stocks.py remove 페이팔            # 종목 삭제
    python manage_stocks.py rename "구글 A" "알파벳 A"  # 종목명 변경
    python manage_stocks.py list                     # 현재 종목 목록 보기
"""

import sys
import re
from pathlib import Path


class StockManager:
    def __init__(self):
        self.project_root = Path(__file__).parent
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

    def get_current_stocks_from_stock_py(self):
        """stock.py에서 현재 종목 리스트 추출"""
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

        return stocks

    def add_stock(self, ticker, korean_name):
        """종목 추가"""
        print(f"\n📊 종목 추가: {korean_name} ({ticker})")
        print("=" * 50)

        # 1. stock.py 수정
        print("\n1️⃣  stock.py 수정 중...")
        content = self.read_file(self.stock_py)

        # nasdaq_top_100 찾기
        pattern = r'(nasdaq_top_100\s*=\s*\[)(.*?)(\])'
        match = re.search(pattern, content, re.DOTALL)

        if not match:
            raise ValueError("nasdaq_top_100을 찾을 수 없습니다.")

        prefix, stocks_block, suffix = match.groups()

        # 마지막 항목 뒤에 새 종목 추가
        stocks_block = stocks_block.rstrip()
        if not stocks_block.endswith(','):
            stocks_block += ','

        new_entry = f'\n    ("{ticker}", "{korean_name}")'
        stocks_block += new_entry

        new_content = content[:match.start()] + prefix + stocks_block + '\n' + suffix + content[match.end():]
        self.write_file(self.stock_py, new_content)
        print("   ✅ stock.py 업데이트 완료")

        # 2. predict.py 수정
        print("\n2️⃣  predict.py 수정 중...")
        content = self.read_file(self.predict_py)

        # target_columns 찾기
        pattern = r'(target_columns\s*=\s*\[)(.*?)(\])'
        match = re.search(pattern, content, re.DOTALL)

        if not match:
            raise ValueError("target_columns를 찾을 수 없습니다.")

        prefix, columns_block, suffix = match.groups()

        # 마지막 항목 뒤에 새 종목 추가
        columns_block = columns_block.rstrip()
        if not columns_block.endswith(','):
            columns_block += ','

        new_entry = f" '{korean_name}'"
        columns_block += new_entry

        new_content = content[:match.start()] + prefix + columns_block + '\n' + suffix + content[match.end():]
        self.write_file(self.predict_py, new_content)
        print("   ✅ predict.py 업데이트 완료")

        # 3. stock_recommendation_service.py 수정
        print("\n3️⃣  stock_recommendation_service.py 수정 중...")
        content = self.read_file(self.service_py)

        # STOCK_TO_TICKER 찾기
        pattern = r'(STOCK_TO_TICKER\s*=\s*\{)(.*?)(\})'
        match = re.search(pattern, content, re.DOTALL)

        if not match:
            raise ValueError("STOCK_TO_TICKER를 찾을 수 없습니다.")

        prefix, dict_block, suffix = match.groups()

        # 마지막 항목 뒤에 새 종목 추가
        dict_block = dict_block.rstrip()
        if not dict_block.endswith(','):
            dict_block += ','

        new_entry = f'\n    "{korean_name}": "{ticker}"'
        dict_block += new_entry

        new_content = content[:match.start()] + prefix + dict_block + '\n' + suffix + content[match.end():]
        self.write_file(self.service_py, new_content)
        print("   ✅ stock_recommendation_service.py 업데이트 완료")

        print("\n✅ 종목 추가 완료!")
        print("\n📝 다음 단계:")
        print("   1. python stock.py           # 데이터 수집")
        print("   2. python predict.py         # 모델 재학습")
        print("   3. uvicorn main:app --reload # 서버 재시작")

    def remove_stock(self, korean_name):
        """종목 삭제"""
        print(f"\n🗑️  종목 삭제: {korean_name}")
        print("=" * 50)

        # 1. stock.py 수정
        print("\n1️⃣  stock.py 수정 중...")
        content = self.read_file(self.stock_py)

        # 해당 종목 라인 찾아서 삭제
        pattern = rf'^\s*\("[A-Z]+",\s*"{korean_name}"\),?\s*$'
        new_content = re.sub(pattern, '', content, flags=re.MULTILINE)
        self.write_file(self.stock_py, new_content)
        print("   ✅ stock.py 업데이트 완료")

        # 2. predict.py 수정
        print("\n2️⃣  predict.py 수정 중...")
        content = self.read_file(self.predict_py)

        # target_columns에서 해당 종목 삭제
        pattern = rf"'{korean_name}',?\s*"
        new_content = re.sub(pattern, '', content)
        self.write_file(self.predict_py, new_content)
        print("   ✅ predict.py 업데이트 완료")

        # 3. stock_recommendation_service.py 수정
        print("\n3️⃣  stock_recommendation_service.py 수정 중...")
        content = self.read_file(self.service_py)

        # STOCK_TO_TICKER에서 해당 종목 삭제
        pattern = rf'^\s*"{korean_name}":\s*"[A-Z]+",?\s*$'
        new_content = re.sub(pattern, '', content, flags=re.MULTILINE)
        self.write_file(self.service_py, new_content)
        print("   ✅ stock_recommendation_service.py 업데이트 완료")

        print("\n✅ 종목 삭제 완료!")
        print("\n📝 다음 단계:")
        print("   1. rm *_cache.pkl            # 캐시 삭제")
        print("   2. python predict.py         # 모델 재학습")
        print("   3. uvicorn main:app --reload # 서버 재시작")

    def rename_stock(self, old_name, new_name):
        """종목명 변경"""
        print(f"\n✏️  종목명 변경: {old_name} → {new_name}")
        print("=" * 50)

        # 1. stock.py 수정
        print("\n1️⃣  stock.py 수정 중...")
        content = self.read_file(self.stock_py)
        content = content.replace(f'"{old_name}"', f'"{new_name}"')
        self.write_file(self.stock_py, content)
        print("   ✅ stock.py 업데이트 완료")

        # 2. predict.py 수정
        print("\n2️⃣  predict.py 수정 중...")
        content = self.read_file(self.predict_py)
        content = content.replace(f"'{old_name}'", f"'{new_name}'")
        self.write_file(self.predict_py, content)
        print("   ✅ predict.py 업데이트 완료")

        # 3. stock_recommendation_service.py 수정
        print("\n3️⃣  stock_recommendation_service.py 수정 중...")
        content = self.read_file(self.service_py)
        content = content.replace(f'"{old_name}"', f'"{new_name}"')
        self.write_file(self.service_py, content)
        print("   ✅ stock_recommendation_service.py 업데이트 완료")

        print("\n✅ 종목명 변경 완료!")
        print("\n📝 다음 단계:")
        print("   1. rm *_cache.pkl            # 캐시 삭제")
        print("   2. python predict.py         # 모델 재학습")
        print("   3. uvicorn main:app --reload # 서버 재시작")

    def list_stocks(self):
        """현재 종목 목록 출력"""
        stocks = self.get_current_stocks_from_stock_py()

        print("\n📊 현재 등록된 주식 종목 목록")
        print("=" * 60)
        print(f"{'#':<5} {'티커':<10} {'한글명':<20}")
        print("-" * 60)

        for idx, (ticker, korean_name) in enumerate(stocks, 1):
            print(f"{idx:<5} {ticker:<10} {korean_name:<20}")

        print("=" * 60)
        print(f"총 {len(stocks)}개 종목")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    manager = StockManager()
    command = sys.argv[1].lower()

    try:
        if command == 'add':
            if len(sys.argv) != 4:
                print("사용법: python manage_stocks.py add TICKER 한글명")
                sys.exit(1)
            ticker = sys.argv[2].upper()
            korean_name = sys.argv[3]
            manager.add_stock(ticker, korean_name)

        elif command == 'remove' or command == 'delete':
            if len(sys.argv) != 3:
                print("사용법: python manage_stocks.py remove 한글명")
                sys.exit(1)
            korean_name = sys.argv[2]
            manager.remove_stock(korean_name)

        elif command == 'rename':
            if len(sys.argv) != 4:
                print("사용법: python manage_stocks.py rename 기존한글명 새한글명")
                sys.exit(1)
            old_name = sys.argv[2]
            new_name = sys.argv[3]
            manager.rename_stock(old_name, new_name)

        elif command == 'list':
            manager.list_stocks()

        else:
            print(f"알 수 없는 명령어: {command}")
            print(__doc__)
            sys.exit(1)

    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
