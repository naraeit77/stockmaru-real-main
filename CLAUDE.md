# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered stock trading system for NASDAQ top stocks. Combines AI predictions, technical indicators, and news sentiment analysis with Korea Investment Securities API for automated trading.

**Core Technology Stack:**
- Python 3.x with FastAPI for REST API
- TensorFlow/Keras for stock price prediction using Transformer models
- Supabase (PostgreSQL) for data storage
- Korea Investment Securities OpenAPI for trading execution
- FRED API for economic indicators
- Yahoo Finance for market data
- Alpha Vantage for news sentiment

## Development Commands

### Running the Application

```bash
# Run FastAPI server (development mode with auto-reload)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Alternative using run.py
python run.py
```

### Data Collection & Processing

```bash
# Collect economic and stock data (FRED + Yahoo Finance)
python stock.py

# Run stock price prediction model (Transformer-based)
python predict.py

# Test balance inquiry (Korea Investment Securities API)
python getBalance.py
```

### Testing

```bash
# Run basic tests
python test.py

# Test database connection
python dbConnection.py
```

## Architecture & Key Components

### Data Pipeline Architecture

**Three-stage pipeline:**
1. **Data Collection** (`stock.py`): Aggregates economic indicators from FRED API and stock prices from Yahoo Finance. Combines 60+ indicators including macro-economic data, market indices, and NASDAQ top 25 stocks.

2. **AI Prediction** (`predict.py`): Dual-input Transformer model processes both stock price sequences and economic feature sequences separately through 4-layer encoders, then merges for 14-day forward prediction.

3. **Trading Execution** (`main.py` + `getBalance.py`): FastAPI endpoints expose predictions and balance data; integrates with Korea Investment Securities API for actual trade execution.

### Database Schema (Supabase)

**Critical tables:**
- `economic_and_stock_data`: Time-series data with 60+ columns (economic indicators + stock prices)
- `predicted_stocks`: AI predictions with columns like `{stock_name}_Predicted` and `{stock_name}_Actual`
- `stock_analysis_results`: Final recommendations with MAE, MAPE, Accuracy, Rise Probability
- `access_tokens`: Korea Investment Securities API token management (24-hour refresh cycle)
- `ticker_sentiment_analysis`: News sentiment scores from Alpha Vantage
- `stock_recommendations`: Technical analysis results (RSI, MACD, SMA)

### AI Model Architecture

**Dual-Input Transformer:**
- Stock input: 90-day lookback window of target stock prices (27 stocks)
- Economic input: 90-day lookback window of 37 economic features
- 4-layer multi-head attention (8 heads, 256 feed-forward dim)
- Prediction: 14-day forward stock prices
- Training: 80/20 train/test split, Adam optimizer (lr=0.0001), MSE loss

**Target stocks:** Apple, Microsoft, Amazon, Google (A & C), Meta, Tesla, NVIDIA, Costco, Netflix, PayPal, Intel, Cisco, Comcast, PepsiCo, Amgen, Honeywell, Starbucks, Mondelez, Micron, Broadcom, Adobe, Texas Instruments, AMD, Applied Materials, SPY ETF, QQQ ETF.

### API Integration Points

**Korea Investment Securities API:**
- Token refresh: 24-hour expiration, managed via `get_token()` with Supabase caching
- Domestic balance: `VTTC8434R` transaction ID
- Overseas balance: `VTTS3012R` transaction ID (NASDAQ market)
- Base URL: `https://openapivts.koreainvestment.com:29443` (VTS = Virtual Trading System)

**External Data APIs:**
- FRED: Economic indicators (requires API key in `stock.py` line 12)
- Yahoo Finance: Market data via custom `download_yahoo_chart()` function
- Alpha Vantage: News sentiment (for trading logic, not in current codebase)

### Trading Logic Flow

**Buy Signal Criteria (from documentation):**
- AI Rise Probability ≥ 3%
- AI Accuracy ≥ 80%
- Golden Cross (SMA20 > SMA50)
- RSI < 50
- MACD > Signal
- News sentiment score ≥ 0.15

**Sell Signal Criteria:**
- Profit/Loss thresholds: +5%/-5%
- Dead Cross (SMA20 < SMA50)
- RSI > 70
- MACD < Signal
- News sentiment score < -0.15

## Configuration & Secrets

**Required API Keys/Credentials:**
- FRED API key: Set in `stock.py` (line 12)
- Supabase URL and key: Set in `dbConnection.py` (currently contains exposed credentials - should use environment variables)
- Korea Investment Securities: AppKey/AppSecret in `getBalance.py` (currently hardcoded - should use environment variables)

**Security Note:** Current implementation has hardcoded credentials. Migrate to environment variables using `python-dotenv` before production deployment.

## Data Processing Notes

### Date Handling Strategy
All timestamps are normalized to date-only (no time component) to prevent timezone mismatches between FRED (various frequencies), Yahoo Finance (market hours), and Supabase storage. See `stock.py` lines 187-199 and 342-346.

### Resampling Logic
Economic indicators arrive at different frequencies (daily, weekly, monthly, quarterly). The pipeline resamples everything to daily frequency using forward-fill (`ffill()`) to align with stock market data. See `stock.py` lines 264-284.

### Missing Data Handling
- Initial forward-fill and backward-fill for time-series continuity
- NaN/inf values converted to `None` for database insertion
- Columns with 100% NaN ratio are excluded from validation
- See `predict.py` lines 59-78 for DB retrieval handling

## FastAPI Endpoints

**Key endpoints:**
- `GET /`: Health check
- `GET /balance`: Real-time balance from Korea Investment Securities
- `GET /predictions`: Stock predictions from CSV (legacy, migrate to DB)
- `GET /stock/{ticker}`: Individual stock data from Supabase
- `POST /update_data`: Trigger background data update to Supabase

**Background Tasks:**
Background data updates use `BackgroundTasks` to avoid blocking API responses. See `main.py` lines 91-174.

## Important Implementation Details

### Token Management Pattern
The `get_token()` function implements smart caching: checks Supabase for existing token, validates 24-hour expiration using UTC timezone-aware comparison, refreshes only when needed. Falls back to hardcoded token on error (should be removed in production).

### Batch Processing for Supabase
Supabase has insertion limits. All bulk operations use batching (typically 100-1000 records per chunk). See `main.py` lines 120-169 and `predict.py` lines 247-267.

### Model Training Workflow
1. Load all data from Supabase (handles pagination for large datasets)
2. Scale separately: `MinMaxScaler` for stock prices and economic features
3. Create sequences: 90-day lookback, 14-day forward target
4. Train Transformer (50 epochs, batch_size=32)
5. Generate predictions for entire dataset including most recent data
6. Save predictions back to Supabase with `{stock}_Predicted` and `{stock}_Actual` columns

### Evaluation Metrics
- MAE (Mean Absolute Error): Average prediction error in price units
- MAPE (Mean Absolute Percentage Error): Percentage-based error
- Accuracy: 100 - MAPE
- Rise Probability: ((Predicted - Actual) / Actual) × 100

## Common Gotchas

1. **FRED API Rate Limits**: 1-second delay between requests (see `stock.py` line 302)
2. **Yahoo Finance Rate Limits**: 1-second delay between ticker requests (line 321)
3. **Date Alignment**: Always use `.dt.date` or `.date()` to strip time components
4. **Token Expiration**: Korea Investment Securities tokens expire after 24 hours
5. **Supabase Pagination**: Never assume all data returns in single query; use offset/limit
6. **Timezone Awareness**: Use `pytz.UTC` for all datetime comparisons in token management

## File Structure Context

```
├── main.py              # FastAPI application entry point
├── stock.py             # Data collection pipeline (FRED + Yahoo)
├── predict.py           # Transformer model training and prediction
├── getBalance.py        # Korea Investment Securities API integration
├── dbConnection.py      # Supabase client initialization
├── run.py               # Alternative uvicorn launcher
├── yfinance.py          # Custom Yahoo Finance chart downloader
├── app/
│   ├── core/            # Configuration and settings
│   ├── db/              # Database utilities
│   ├── models/          # Data models
│   ├── schemas/         # Pydantic schemas
│   └── utils/           # Scheduler and utilities
└── tests/               # Test files
```

## Development Workflow

1. Update API keys in respective files (or migrate to `.env`)
2. Run `stock.py` to collect latest economic and stock data
3. Run `predict.py` to train model and generate predictions
4. Start FastAPI server with `uvicorn main:app --reload`
5. Test endpoints via `http://localhost:8000/docs` (auto-generated Swagger UI)
6. Use `/update_data` endpoint to refresh Supabase with latest data

## Production Considerations

- Migrate all hardcoded credentials to environment variables
- Implement proper error handling and retry logic for API calls
- Add authentication/authorization to FastAPI endpoints
- Set up scheduled jobs for automated data collection and prediction updates
- Monitor API rate limits and implement circuit breakers
- Use CORS whitelist instead of wildcard (`allow_origins=["*"]`)
- Remove fallback hardcoded tokens in error handlers
