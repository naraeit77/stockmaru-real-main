from fastapi import APIRouter
from app.api.routes.stock_recommendations import router as stock_recommendations_router
from app.api.routes.economic import router as economic_router
from app.api.routes.balance import router as balance_router
from app.api.routes.stocks import router as stocks_router

api_router = APIRouter()
api_router.include_router(stock_recommendations_router, prefix="/stocks/recommendations", tags=["주식 추천"])
api_router.include_router(economic_router, prefix="/economic", tags=["경제 지표"])
api_router.include_router(balance_router, prefix="/balance", tags=["잔고"])
api_router.include_router(stocks_router, prefix="/stocks", tags=["주식"])