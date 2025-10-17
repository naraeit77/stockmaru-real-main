# StockMaru (스톡마루)

AI-powered stock trading system for NASDAQ top stocks combining Transformer-based price predictions, technical indicators, and news sentiment analysis with Korea Investment Securities API for automated trading.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange.svg)](https://www.tensorflow.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 Key Features

- **AI Price Prediction**: Dual-input Transformer model with 90-day lookback for 14-day forward predictions
- **Real-time Trading**: Integration with Korea Investment Securities OpenAPI
- **Economic Intelligence**: 60+ macro-economic indicators from FRED API
- **Technical Analysis**: RSI, MACD, Golden/Dead Cross signals
- **News Sentiment**: Alpha Vantage integration for market sentiment analysis
- **REST API**: FastAPI endpoints for predictions, balance inquiry, and data updates

## 🏗️ Architecture

```
┌─────────────────┐
│  Data Collection│  stock.py → FRED API + Yahoo Finance
│  (5-10 min)     │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Supabase DB   │  PostgreSQL with 60+ columns
│   (Storage)     │  economic_and_stock_data
└────────┬────────┘
         ▼
┌─────────────────┐
│  AI Prediction  │  predict.py → Transformer Model
│  (10-30 min)    │  90-day lookback, 14-day forecast
└────────┬────────┘
         ▼
┌─────────────────┐
│   Supabase DB   │  predicted_stocks + analysis_results
│   (Results)     │
└────────┬────────┘
         ▼
┌─────────────────┐
│  FastAPI Server │  main.py → REST API (Port 8000)
│  (Real-time)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Users/Apps     │  http://localhost:8000/docs
│                 │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ (recommended: 3.10+)
- 4GB RAM minimum (8GB for model training)
- 2GB disk space
- API keys: FRED, Supabase, Korea Investment Securities

### Installation

```bash
# Clone repository
git clone https://github.com/naraeit77/stockmaru-real-main.git
cd stockmaru-real-main

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Create `.env` file in project root:

```env
# Economic Data
FRED_API_KEY=your_fred_api_key_here

# Database
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# Trading API
KIS_APPKEY=your_korea_investment_appkey_here
KIS_APPSECRET=your_korea_investment_appsecret_here
```

⚠️ **Security**: Never commit `.env` file. Ensure it's in `.gitignore`.

### Running the System

**Step 1: Collect Data** (5-10 minutes)
```bash
python stock.py
```
- Fetches 60+ economic indicators from FRED
- Downloads NASDAQ top 25 stock prices from Yahoo Finance
- Normalizes and stores data in Supabase

**Step 2: Train AI Model & Generate Predictions** (10-30 minutes)
```bash
python predict.py
```
- Loads time-series data from Supabase
- Trains Transformer model (50 epochs)
- Generates 14-day forward predictions
- Saves results to database

**Step 3: Start API Server**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Alternative
python run.py
```

**Step 4: Access API**
- Health check: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📡 API Endpoints

### GET /
Health check endpoint
```bash
curl http://localhost:8000
```

### GET /balance
Real-time balance inquiry (Korea Investment Securities)
```bash
curl http://localhost:8000/balance
```

Response:
```json
{
  "domestic_balance": {
    "total_evaluation": "10,000,000 KRW",
    "stocks": [...]
  },
  "overseas_balance": {
    "total_evaluation": "5,000 USD",
    "stocks": [...]
  }
}
```

### GET /stock/{ticker}
Individual stock data from database
```bash
curl http://localhost:8000/stock/AAPL
```

### GET /predictions
AI prediction results with recommendations
```bash
curl http://localhost:8000/predictions
```

Response:
```json
{
  "predictions": [
    {
      "ticker": "AAPL",
      "current_price": 175.50,
      "predicted_14d": 182.30,
      "rise_probability": 3.87,
      "accuracy": 85.2,
      "recommendation": "BUY"
    }
  ]
}
```

### POST /update_data
Trigger background data update
```bash
curl -X POST http://localhost:8000/update_data
```

## 🤖 AI Model Details

**Architecture**: Dual-Input Transformer
- **Stock Input**: 90-day price sequences for 27 stocks
- **Economic Input**: 90-day sequences of 37 features
- **Encoder**: 4 layers × 8 attention heads
- **Feed-forward**: 256 dimensions
- **Prediction Horizon**: 14 days forward

**Target Stocks**: AAPL, MSFT, AMZN, GOOGL, GOOG, META, TSLA, NVDA, COST, NFLX, PYPL, INTC, CSCO, CMCSA, PEP, AMGN, HON, SBUX, MDLZ, MU, AVGO, ADBE, TXN, AMD, AMAT, SPY, QQQ

**Training**: 80/20 train/test split, Adam optimizer (lr=0.0001), MSE loss

## 📊 Trading Logic

**Buy Signals**:
- Rise Probability ≥ 3%
- AI Accuracy ≥ 80%
- Golden Cross (SMA20 > SMA50)
- RSI < 50
- MACD > Signal
- News Sentiment ≥ 0.15

**Sell Signals**:
- Profit/Loss: +5% / -5%
- Dead Cross (SMA20 < SMA50)
- RSI > 70
- MACD < Signal
- News Sentiment < -0.15

## 🗄️ Database Schema

**Supabase Tables**:
- `economic_and_stock_data`: Time-series with 60+ columns
- `predicted_stocks`: AI predictions (`{stock}_Predicted`, `{stock}_Actual`)
- `stock_analysis_results`: Recommendations with MAE, MAPE, Accuracy
- `access_tokens`: Korea Investment Securities token management (24h refresh)
- `ticker_sentiment_analysis`: News sentiment scores
- `stock_recommendations`: Technical analysis results

## 🔧 Configuration Files

- `main.py`: FastAPI application entry point
- `stock.py`: Data collection pipeline (FRED + Yahoo Finance)
- `predict.py`: Transformer model training and prediction
- `getBalance.py`: Korea Investment Securities API integration
- `dbConnection.py`: Supabase client initialization
- `run.py`: Alternative uvicorn launcher
- `yfinance.py`: Custom Yahoo Finance chart downloader

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -i :8000
kill -9 [PID]
# Or use different port
uvicorn main:app --port 8001
```

### FRED API Rate Limit
Wait 1 minute between retries. Increase delay in `stock.py`:
```python
time.sleep(2)  # Increase from 1 to 2 seconds
```

### Memory Issues During Training
Reduce batch size in `predict.py`:
```python
batch_size = 16  # Decrease from 32
```

### Token Expiration (Korea Investment Securities)
```bash
python getBalance.py  # Manual token refresh
```

### Supabase Connection Timeout
- Check network connection
- Verify project status in Supabase dashboard
- Regenerate API keys if expired

## 📅 Automation (Optional)

### macOS/Linux (cron)
```bash
crontab -e

# Daily at 9 AM
0 9 * * * cd /Users/nit/stockmaru-real-main && /usr/bin/python3 stock.py && /usr/bin/python3 predict.py
```

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task → Daily 9 AM
3. Action: Start Program
4. Program: `python.exe`
5. Arguments: `stock.py`
6. Start in: `C:\path\to\stockmaru-real-main`

## 🔒 Security Best Practices

✅ Use environment variables (`.env` file)
✅ Add `.env` to `.gitignore`
✅ Restrict CORS in production (remove `allow_origins=["*"]`)
✅ Implement API authentication for endpoints
✅ Use HTTPS in production deployment
✅ Never commit API keys to version control

## 📚 Documentation

- **User Guide**: [USERS_GUIDE.md](USERS_GUIDE.md) - Complete setup and usage instructions
- **Developer Guide**: [CLAUDE.md](CLAUDE.md) - Technical architecture and development notes
- **API Docs**: http://localhost:8000/docs (auto-generated Swagger UI)

## 🛠️ Tech Stack

- **Backend**: Python 3.8+, FastAPI, Uvicorn
- **AI/ML**: TensorFlow 2.x, Keras, NumPy, Pandas
- **Database**: Supabase (PostgreSQL)
- **Data Sources**: FRED API, Yahoo Finance, Alpha Vantage
- **Trading API**: Korea Investment Securities OpenAPI
- **Utils**: python-dotenv, pytz, scikit-learn

## 📈 Performance

- **Data Collection**: 5-10 minutes (60+ indicators + 27 stocks)
- **Model Training**: 10-30 minutes (50 epochs, depends on hardware)
- **API Response Time**: <200ms for predictions
- **Token Management**: 24-hour auto-refresh cycle

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and research purposes only. Trading stocks involves risk. The developers are not responsible for any financial losses incurred through the use of this system. Always conduct your own research and consult with financial advisors before making investment decisions.

## 📧 Contact

- **Repository**: https://github.com/naraeit77/stockmaru-real-main
- **Issues**: https://github.com/naraeit77/stockmaru-real-main/issues

## 🙏 Acknowledgments

- FRED API for economic data
- Yahoo Finance for market data
- Korea Investment Securities for trading API
- TensorFlow team for ML framework
- FastAPI community for excellent framework

---

**Last Updated**: October 2024
**Version**: 1.0.0
**Status**: Active Development
