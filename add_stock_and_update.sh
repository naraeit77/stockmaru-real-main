#!/bin/bash

# 종목 추가 및 자동 업데이트 스크립트
# 사용법: ./add_stock_and_update.sh TICKER 한글명
# 예시: ./add_stock_and_update.sh ORCL 오라클

if [ $# -ne 2 ]; then
    echo "사용법: $0 TICKER 한글명"
    echo "예시: $0 ORCL 오라클"
    exit 1
fi

TICKER=$1
NAME=$2

echo "=================================="
echo "🚀 종목 추가 및 시스템 업데이트"
echo "=================================="
echo "종목: $NAME ($TICKER)"
echo ""

# 1. 종목 추가
echo "📊 1단계: 종목 추가 중..."
python manage_stocks.py add "$TICKER" "$NAME"
if [ $? -ne 0 ]; then
    echo "❌ 종목 추가 실패"
    exit 1
fi
echo ""

# 2. 캐시 삭제
echo "🗑️  2단계: 캐시 파일 삭제 중..."
rm -f *_cache.pkl
echo "   ✅ 캐시 삭제 완료"
echo ""

# 3. 데이터 수집
echo "📥 3단계: 데이터 수집 중..."
python stock.py
if [ $? -ne 0 ]; then
    echo "❌ 데이터 수집 실패"
    exit 1
fi
echo ""

# 4. 모델 재학습
echo "🤖 4단계: AI 모델 재학습 중..."
echo "⚠️  이 작업은 시간이 걸릴 수 있습니다 (5-20분)..."
python predict.py
if [ $? -ne 0 ]; then
    echo "❌ 모델 학습 실패"
    exit 1
fi
echo ""

echo "=================================="
echo "✅ 모든 작업 완료!"
echo "=================================="
echo ""
echo "📝 다음 단계:"
echo "   uvicorn main:app --reload  # 서버 재시작"
echo ""
