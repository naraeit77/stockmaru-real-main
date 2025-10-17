from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List, Optional, Union, Literal, get_type_hints
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "주식 분석 API"
    PROJECT_DESCRIPTION: str = "해외주식 잔고 조회 및 주식 예측 API"
    PROJECT_VERSION: str = "1.0.0"
    
    # DEBUG 설정 추가
    DEBUG: bool = Field(default=False, description="디버그 모드 활성화 여부")
    
    CORS_ORIGINS: List[str] = ["*"]
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # 한국투자증권 API 설정
    KIS_APPKEY: str = os.getenv("KIS_APPKEY", "")
    KIS_APPSECRET: str = os.getenv("KIS_APPSECRET", "")
    KIS_CANO: str = os.getenv("KIS_CANO", "")
    KIS_ACNT_PRDT_CD: str = os.getenv("KIS_ACNT_PRDT_CD", "")
    KIS_USE_MOCK: bool = os.getenv("KIS_USE_MOCK", "true").lower() == "true"
    
    # 기존 .env 파일과의 호환성을 위해 직접 변수도 지원
    KIS_BASE_URL: str = os.getenv("KIS_BASE_URL", "https://openapivts.koreainvestment.com:29443")
    TR_ID: str = os.getenv("TR_ID", "VTTC8434R")
    
    # 실전/모의투자 URL 설정
    KIS_REAL_URL: str = "https://openapi.koreainvestment.com:9443"
    KIS_MOCK_URL: str = "https://openapivts.koreainvestment.com:29443"
    
    # 환경에 따른 base_url 자동 설정
    @property
    def kis_base_url(self) -> str:
        # .env에 KIS_BASE_URL이 설정되어 있으면 그것을 우선 사용
        if os.getenv("KIS_BASE_URL"):
            return self.KIS_BASE_URL
        # 그렇지 않으면 KIS_USE_MOCK에 따라 결정
        return self.KIS_MOCK_URL if self.KIS_USE_MOCK else self.KIS_REAL_URL
    
    # API TR_ID 설정 - 환경에 따라 자동으로 선택
    @property
    def get_tr_id(self) -> str:
        # .env에 TR_ID가 설정되어 있으면 그것을 우선 사용
        if os.getenv("TR_ID"):
            return self.TR_ID
        # 그렇지 않으면 KIS_USE_MOCK에 따라 결정
        return "VTTS0308U" if self.KIS_USE_MOCK else "TTTS0308U"  # 일본 매수 TR_ID 기본값

    ALPHA_VANTAGE_API_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY", "")
    FRED_API_KEY: str = os.getenv("FRED_API_KEY", "")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# 싱글톤 설정 객체 생성
settings = Settings()