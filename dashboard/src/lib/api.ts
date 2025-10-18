import axios from 'axios';

// API Base URL - 환경변수로 설정 가능
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 잔고 조회 API
export const balanceApi = {
  // 국내주식 잔고 조회
  getDomestic: () => api.get('/balance/'),

  // 해외주식 잔고 조회
  getOverseas: () => api.get('/balance/overseas'),

  // 예수금 조회 (원화 + 외화)
  getDeposit: () => api.get('/balance/deposit'),
};

// 주식 추천 API
export const recommendationApi = {
  // 추천 주식 목록 (Accuracy ≥ 80%, Rise Probability ≥ 3%)
  getRecommended: () => api.get('/stocks/recommendations/recommended-stocks'),

  // 추천 주식 + 감정 분석 (sentiment_score ≥ 0.15)
  getWithSentiment: () => api.get('/stocks/recommendations/recommended-stocks/with-sentiment'),

  // 추천 주식 + 기술적 지표 + 감정 분석 (종합)
  getWithTechnicalAndSentiment: () => api.get('/stocks/recommendations/recommended-stocks/with-technical-and-sentiment'),

  // 매도 대상 종목 조회
  getSellCandidates: () => api.get('/stocks/recommendations/sell-candidates'),
};

// 스케줄러 API
export const schedulerApi = {
  // 스케줄러 상태 조회
  getStatus: () => api.get('/stocks/recommendations/scheduler/status'),

  // 즉시 매수 실행
  runBuyNow: () => api.post('/stocks/recommendations/purchase/trigger'),

  // 즉시 매도 실행
  runSellNow: () => api.post('/stocks/recommendations/sell/trigger'),

  // 매수 스케줄러 시작
  startBuy: () => api.post('/stocks/recommendations/purchase/scheduler/start'),

  // 매수 스케줄러 중지
  stopBuy: () => api.post('/stocks/recommendations/purchase/scheduler/stop'),

  // 매도 스케줄러 시작
  startSell: () => api.post('/stocks/recommendations/sell/scheduler/start'),

  // 매도 스케줄러 중지
  stopSell: () => api.post('/stocks/recommendations/sell/scheduler/stop'),
};

// 미체결 내역 조회 API
export const nccsApi = {
  // 해외주식 미체결 내역 조회
  getOverseas: (ovrs_excg_cd: string = 'NASD') =>
    api.get('/balance/nccs', { params: { ovrs_excg_cd } }),
};

// 예약주문 조회 API
export const orderResvApi = {
  // 해외주식 예약주문 조회
  getList: (params: {
    ovrs_excg_cd?: string;
    inqr_strt_dt: string;
    inqr_end_dt: string;
  }) => api.get('/balance/order-resv-list', { params }),
};

// 매수/매도 거래 내역 조회 API
export const tradingHistoryApi = {
  // 미체결 내역 조회 (실시간 주문 현황)
  getNccs: (ovrs_excg_cd: string = 'NASD') =>
    api.get('/balance/nccs', { params: { ovrs_excg_cd } }),

  // 예약주문 조회 (오늘 날짜 기준)
  getReservations: () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0].replace(/-/g, '');
    const endDate = startDate;
    return api.get('/balance/order-resv-list', {
      params: {
        inqr_strt_dt: startDate,
        inqr_end_dt: endDate,
        ovrs_excg_cd: 'NASD',
      },
    });
  },
};

// 종목 관리 API
export const stockManagementApi = {
  // 종목 목록 조회
  getStocks: () => api.get('/api/management/stocks'),

  // 종목 개수 조회
  getStockCount: () => api.get('/api/management/stocks/count'),

  // 종목 추가
  addStock: (ticker: string, korean_name: string) =>
    api.post('/api/management/stocks/add', { ticker, korean_name }),

  // 종목 삭제
  removeStock: (korean_name: string) =>
    api.delete('/api/management/stocks/remove', { data: { korean_name } }),

  // 종목명 변경
  renameStock: (old_name: string, new_name: string) =>
    api.put('/api/management/stocks/rename', { old_name, new_name }),
};

export default api;
