import yfinance as yf

# tickers = yf.Tickers('MSFT AAPL GOOG')
# tickers.tickers['MSFT'].info
# yf.download(['MSFT', 'AAPL', 'GOOG'], period='1mo')

# print("MSFT: " + tickers.tickers['MSFT'].info)
# print("AAPL: " + tickers.tickers['AAPL'].info)
# print("GOOG: " + tickers.tickers['GOOG'].info)

# dat = yf.Ticker("MSFT")
# print(dat.info)

print(yf.download(['MSFT', 'AAPL', 'GOOG'], period='1mo'))
