// 잔고 관련 타입
export interface DomesticBalanceItem {
  pdno: string;
  prdt_name: string;
  hldg_qty: string;
  ord_psbl_qty: string;
  pchs_avg_pric: string;
  pchs_amt: string;
  prpr: string;
  evlu_amt: string;
  evlu_pfls_amt: string;
  evlu_pfls_rt: string;
}

export interface OverseasBalanceItem {
  ovrs_pdno: string;
  ovrs_item_name: string;
  ovrs_cblc_qty: string;
  ord_psbl_qty: string;
  pchs_avg_pric: string;
  frcr_pchs_amt1: string;
  now_pric2: string;
  frcr_evlu_amt2: string;
  evlu_pfls_amt: string;
  evlu_pfls_rt: string;
  ovrs_excg_cd: string;
}

export interface BalanceResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output1?: DomesticBalanceItem[] | OverseasBalanceItem[];
  output2?: {
    tot_evlu_amt?: string;
    tot_evlu_pfls_amt?: string;
    tot_evlu_pfls_rt?: string;
  };
}

// 추천 주식 관련 타입
export interface StockRecommendation {
  Stock: string;
  'Accuracy (%)': number;
  'Rise Probability (%)': number;
  'Last Actual Price': number;
  'Predicted Future Price': number;
  Recommendation: string;
  Analysis: string;
}

export interface RecommendationResponse {
  message: string;
  recommendations: StockRecommendation[];
}

// 기술적 지표 + 감정 분석 결합 타입
export interface CombinedRecommendation {
  ticker: string;
  stock_name: string;
  accuracy: number;
  rise_probability: number;
  last_price: number;
  predicted_price: number;
  recommendation: string;
  analysis: string;
  sentiment_score: number | null;
  article_count: number | null;
  sentiment_date: string | null;
  technical_date: string;
  sma20: number;
  sma50: number;
  golden_cross: boolean;
  rsi: number;
  macd: number;
  signal: number;
  macd_buy_signal: boolean;
  technical_recommended: boolean;
  composite_score?: number;
}

export interface CombinedRecommendationResponse {
  message: string;
  results: CombinedRecommendation[];
}

// 매도 대상 종목 타입
export interface SellCandidate {
  ticker: string;
  stock_name: string;
  purchase_price: number;
  current_price: number;
  price_change_percent: number;
  quantity: number;
  exchange_code: string;
  sell_reasons: string[];
  technical_sell_signals: number;
  technical_sell_details: string[] | null;
  sentiment_score: number | null;
  technical_data: any;
}

export interface SellCandidatesResponse {
  message: string;
  sell_candidates: SellCandidate[];
}

// 스케줄러 상태 타입
export interface SchedulerStatus {
  buy_running: boolean;
  sell_running: boolean;
  buy_next_run_time?: string | null;
  sell_next_run_time?: string | null;
  message?: string;
}

// 미체결 내역 타입
export interface NccsItem {
  ord_dt: string;
  ord_gno_brno: string;
  odno: string;
  orgn_odno: string;
  pdno: string;
  prdt_name: string;
  sll_buy_dvsn_cd: string;
  sll_buy_dvsn_cd_name: string;
  rvse_cncl_dvsn: string;
  rvse_cncl_dvsn_name: string;
  ord_qty: string;
  ord_unpr: string;
  ord_tmd: string;
  tot_ccld_qty: string;
  tot_ccld_amt: string;
  rmn_qty: string;
  nccs_qty: string;
}

export interface NccsResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: NccsItem[];
}

// 예약주문 타입
export interface OrderResvItem {
  ord_dt: string;
  pdno: string;
  prdt_name: string;
  sll_buy_dvsn_cd: string;
  sll_buy_dvsn_cd_name: string;
  ord_qty: string;
  ord_unpr: string;
  ord_dvsn_name: string;
  [key: string]: any;
}

export interface OrderResvResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output?: OrderResvItem[];
}
