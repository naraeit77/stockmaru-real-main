#!/bin/bash

# 빠른 종목 추가 스크립트 (데이터 수집 + 모델 학습 나중에)
# 사용법: ./quick_add_stock.sh TICKER 한글명
# 예시: ./quick_add_stock.sh ORCL 오라클

if [ $# -ne 2 ]; then
    echo "사용법: $0 TICKER 한글명"
    echo "예시: $0 ORCL 오라클"
    exit 1
fi

TICKER=$1
NAME=$2

echo "=================================="
echo "⚡ 빠른 종목 추가"
echo "=================================="
echo "종목: $NAME ($TICKER)"
echo ""

# 종목 추가만 수행
python manage_stocks.py add "$TICKER" "$NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ 종목 추가 완료!"
    echo "=================================="
    echo ""
    echo "📝 데이터 수집 및 모델 학습을 원하시면:"
    echo ""
    echo "   # 방법 1: 한번에 실행"
    echo "   ./add_stock_and_update.sh $TICKER \"$NAME\""
    echo ""
    echo "   # 방법 2: 수동 실행"
    echo "   rm *_cache.pkl           # 캐시 삭제"
    echo "   python stock.py          # 데이터 수집"
    echo "   python predict.py        # 모델 재학습"
    echo "   uvicorn main:app --reload # 서버 재시작"
    echo ""
else
    echo "❌ 종목 추가 실패"
    exit 1
fi
