# Supabase 클라이언트 설정
import subprocess
import sys
import os
import time
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "supabase"])
    from supabase import create_client, Client
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, Dense, Dropout, LayerNormalization, MultiHeadAttention, Add, GlobalAveragePooling1D
)
import tensorflow as tf
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

import json
import pickle
from sklearn.metrics import mean_absolute_error, mean_squared_error

# 하드웨어 가속 설정
print("=" * 50)
print("하드웨어 가속 설정")
print("=" * 50)

# CPU 최적화 설정
tf.config.threading.set_intra_op_parallelism_threads(0)  # 자동 설정
tf.config.threading.set_inter_op_parallelism_threads(0)  # 자동 설정

# GPU/Metal 감지
gpus = tf.config.list_physical_devices('GPU')
all_devices = tf.config.list_physical_devices()

print(f"TensorFlow 버전: {tf.__version__}")
print(f"사용 가능한 디바이스: {[d.device_type for d in all_devices]}")

if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"✅ GPU 사용 가능: {len(gpus)}개 GPU 감지")
        # Mixed Precision 활성화 (GPU 성능 향상)
        tf.keras.mixed_precision.set_global_policy('mixed_float16')
        print("✅ Mixed Precision (FP16) 활성화")
    except RuntimeError as e:
        print(f"⚠️  GPU 설정 오류: {e}")
        gpus = None
else:
    print("ℹ️  GPU를 사용할 수 없습니다. CPU로 학습합니다.")
    print("💡 Mac에서 GPU 가속을 원하시면 TensorFlow 2.13-2.15 버전과 tensorflow-metal을 설치하세요:")
    print("   pip uninstall tensorflow")
    print("   pip install tensorflow==2.15.0 tensorflow-metal")

    # CPU 최적화 활성화
    import os as os_env
    os_env.environ['TF_ENABLE_ONEDNN_OPTS'] = '1'
    print("✅ CPU 최적화 활성화 (oneDNN)")

print("=" * 50)

# Supabase 연결 설정 (.env 파일에서 읽기)
url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

if not url or not key:
    raise ValueError("SUPABASE_URL과 SUPABASE_KEY가 .env 파일에 설정되어 있어야 합니다.")

supabase: Client = create_client(url, key)

# Supabase에서 데이터 가져오기
# def get_stock_data_from_db():
#     try:
#         response = supabase.table("economic_and_stock_data").select("*").order("날짜", desc=False).execute()
#         print(f"economic_and_stock_data 테이블에서 {len(response.data)}개 데이터를 성공적으로 가져왔습니다!")
#         print(response.data)
#         # 응답 데이터를 DataFrame으로 변환
#         df = pd.DataFrame(response.data)

#         # 날짜 열을 datetime으로 변환
#         df['날짜'] = pd.to_datetime(df['날짜'])
#         df.sort_values(by='날짜', inplace=True)

#         print("Handling missing values and filtering invalid data...")
#         df.fillna(method='ffill', inplace=True)
#         df.fillna(method='bfill', inplace=True)
#         df = df.apply(pd.to_numeric, errors='coerce')
#         df.dropna(inplace=True)

#         return df
#     except Exception as e:
#         print(f"데이터 가져오기 오류: {e}")
#         return None

def get_stock_data_from_db():
    try:
        # 전체 데이터 가져오기
        all_data = get_all_data("economic_and_stock_data")
        print(f"economic_and_stock_data 테이블에서 {len(all_data)}개 데이터를 성공적으로 가져왔습니다!")
        df = pd.DataFrame(all_data)

        # 날짜 열을 datetime으로 변환하고 정렬
        df['날짜'] = pd.to_datetime(df['날짜'])
        df.sort_values(by='날짜', inplace=True)

        # 결측치 처리
        print("결측치 처리 중...")
        df = df.ffill().bfill()  # 앞/뒤 값으로 결측치 채우기

        # 수치형 컬럼으로 변환
        exclude_columns = ['날짜']
        numeric_columns = [col for col in df.columns if col not in exclude_columns]
        df[numeric_columns] = df[numeric_columns].apply(pd.to_numeric, errors='coerce')

        # NaN 비율 확인
        nan_ratios = df[numeric_columns].isna().mean()
        print("수치형 컬럼별 NaN 비율:")
        print(nan_ratios)

        # 유효한 데이터가 있는 컬럼만 dropna 대상으로 설정
        valid_columns = [col for col in numeric_columns if nan_ratios[col] < 1.0]
        df.dropna(subset=valid_columns, inplace=True)

        print(f"처리 후 데이터 크기: {df.shape}")
        return df
    except Exception as e:
        print(f"데이터 가져오기 오류: {e}")
        return None

def get_all_data(table_name, use_cache=True):
    """
    Supabase에서 모든 데이터 가져오기 (캐싱 지원)

    Args:
        table_name: 테이블 이름
        use_cache: 캐시 사용 여부 (기본: True)
    """
    cache_file = f"{table_name}_cache.pkl"

    # 캐시 파일이 있고 24시간 이내면 캐시 사용
    if use_cache and os.path.exists(cache_file):
        cache_age = time.time() - os.path.getmtime(cache_file)
        if cache_age < 86400:  # 24시간 = 86400초
            print(f"캐시된 데이터 사용 (캐시 나이: {cache_age/3600:.1f}시간)")
            with open(cache_file, 'rb') as f:
                return pickle.load(f)

    print(f"{table_name} 테이블에서 데이터 로딩 중...")
    all_data = []
    offset = 0
    limit = 1000  # Supabase의 기본 제한

    while True:
        response = supabase.table(table_name).select("*").order("날짜", desc=False).limit(limit).offset(offset).execute()
        data = response.data
        if not data:  # 더 이상 데이터가 없으면 종료
            break
        all_data.extend(data)
        offset += limit
        print(f"  {len(all_data)}개 로드됨...", end='\r')

    print(f"  총 {len(all_data)}개 로드 완료")

    # 캐시 저장
    if use_cache:
        with open(cache_file, 'wb') as f:
            pickle.dump(all_data, f)
        print(f"캐시 파일 저장: {cache_file}")

    return all_data

# Transformer Encoder 정의
def transformer_encoder(inputs, num_heads, ff_dim, dropout=0.1):
    attention_output = MultiHeadAttention(num_heads=num_heads, key_dim=inputs.shape[-1])(inputs, inputs)
    attention_output = Dropout(dropout)(attention_output)
    attention_output = Add()([inputs, attention_output])
    attention_output = LayerNormalization(epsilon=1e-6)(attention_output)

    ffn = Dense(ff_dim, activation="relu")(attention_output)
    ffn = Dense(inputs.shape[-1])(ffn)
    ffn_output = Dropout(dropout)(ffn)
    ffn_output = Add()([attention_output, ffn_output])
    ffn_output = LayerNormalization(epsilon=1e-6)(ffn_output)

    return ffn_output

# Transformer 모델 정의
def build_transformer_with_two_inputs(stock_shape, econ_shape, num_heads, ff_dim, target_size):
    stock_inputs = Input(shape=stock_shape)
    stock_encoded = stock_inputs
    for _ in range(4):  # 4개의 Transformer Layer
        stock_encoded = transformer_encoder(stock_encoded, num_heads=num_heads, ff_dim=ff_dim)
    stock_encoded = Dense(64, activation="relu")(stock_encoded)

    econ_inputs = Input(shape=econ_shape)
    econ_encoded = econ_inputs
    for _ in range(4):  # 4개의 Transformer Layer
        econ_encoded = transformer_encoder(econ_encoded, num_heads=num_heads, ff_dim=ff_dim)
    econ_encoded = Dense(64, activation="relu")(econ_encoded)

    merged = Add()([stock_encoded, econ_encoded])
    merged = Dense(128, activation="relu")(merged)
    merged = Dropout(0.2)(merged)
    merged = GlobalAveragePooling1D()(merged)

    # Mixed Precision 사용 시 출력 레이어는 float32로 설정
    outputs = Dense(target_size, dtype='float32')(merged)

    return Model(inputs=[stock_inputs, econ_inputs], outputs=outputs)

print("Loading data from database...")
data = get_stock_data_from_db()
if data is None or data.empty:
    raise ValueError("DB에서 데이터를 가져오지 못했습니다. 테이블과 컬럼명을 확인하세요.")

# data.sort_values(by='날짜', inplace=True)

# print("Handling missing values and filtering invalid data...")
# data.fillna(method='ffill', inplace=True)
# data.fillna(method='bfill', inplace=True)
# data = data.apply(pd.to_numeric, errors='coerce')
# data.dropna(inplace=True)

forecast_horizon = 14  # 예측 기간 (14일 후를 예측)

target_columns = [
    '애플', '마이크로소프트', '아마존', '구글 A', '구글 C', '메타',
    '테슬라', '엔비디아', '코스트코', '넷플릭스', '페이팔', '인텔', '시스코', '컴캐스트',
    '펩시코', '암젠', '허니웰 인터내셔널', '스타벅스', '몬델리즈', '마이크론', '브로드컴',
    '어도비', '텍사스 인스트루먼트', 'AMD', '어플라이드 머티리얼즈', 'S&P 500 ETF', 'QQQ ETF', 'string'
]

economic_features = [
    '10년 기대 인플레이션율', '장단기 금리차', '기준금리', '미시간대 소비자 심리지수',
    '실업률', '2년 만기 미국 국채 수익률', '10년 만기 미국 국채 수익률', '금융스트레스지수',
    '개인 소비 지출', '소비자 물가지수', '5년 변동금리 모기지', '미국 달러 환율',
    '통화 공급량 M2', '가계 부채 비율', 'GDP 성장률', '나스닥 종합지수', 'S&P 500 지수', '금 가격', '달러 인덱스', '나스닥 100',
    'S&P 500 ETF', 'QQQ ETF', '러셀 2000 ETF', '다우 존스 ETF', 'VIX 지수',
    '닛케이 225', '상해종합', '항셍', '영국 FTSE', '독일 DAX', '프랑스 CAC 40',
    '미국 전체 채권시장 ETF', 'TIPS ETF', '투자등급 회사채 ETF', '달러/엔', '달러/위안',
    '미국 리츠 ETF'
]

print("Scaling data...")
train_size = int(len(data) * 0.8)
train_data = data.iloc[:train_size]
test_data = data.iloc[train_size:]

data_scaled = data.copy()
stock_scaler = MinMaxScaler()
econ_scaler = MinMaxScaler()

data_scaled[target_columns] = stock_scaler.fit_transform(data[target_columns])
data_scaled[economic_features] = econ_scaler.fit_transform(data[economic_features])

lookback = 90

# 훈련 데이터 생성
X_stock_train = []
X_econ_train = []
y_train = []

for i in range(lookback, len(data_scaled) - forecast_horizon):
    X_stock_seq = data_scaled[target_columns].iloc[i - lookback:i].to_numpy()
    X_econ_seq = data_scaled[economic_features].iloc[i - lookback:i].to_numpy()
    y_val = data_scaled[target_columns].iloc[i + forecast_horizon - 1].to_numpy()
    X_stock_train.append(X_stock_seq)
    X_econ_train.append(X_econ_seq)
    y_train.append(y_val)

X_stock_train = np.array(X_stock_train)
X_econ_train = np.array(X_econ_train)
y_train = np.array(y_train)

# 전체 예측 데이터 생성: 마지막 날짜까지 포함하여 예측 (미래 실제값 없어도 예측)
X_stock_full = []
X_econ_full = []
for i in range(lookback, len(data_scaled)):  # 여기서 forecast_horizon 빼지 않음
    X_stock_seq = data_scaled[target_columns].iloc[i - lookback:i].to_numpy()
    X_econ_seq = data_scaled[economic_features].iloc[i - lookback:i].to_numpy()
    X_stock_full.append(X_stock_seq)
    X_econ_full.append(X_econ_seq)

X_stock_full = np.array(X_stock_full)
X_econ_full = np.array(X_econ_full)

print("Building Transformer model...")
stock_shape = (lookback, len(target_columns))
econ_shape = (lookback, len(economic_features))

model = build_transformer_with_two_inputs(stock_shape, econ_shape, num_heads=8, ff_dim=256, target_size=len(target_columns))
model.compile(optimizer=Adam(learning_rate=0.0001), loss='mse', metrics=['mae'])
model.summary()

print("Training model...")

# 콜백 설정
callbacks = [
    # Early Stopping: 검증 손실이 10 에포크 동안 개선되지 않으면 학습 중단
    EarlyStopping(
        monitor='loss',
        patience=10,
        restore_best_weights=True,
        verbose=1
    ),
    # Model Checkpoint: 최상의 모델 저장
    ModelCheckpoint(
        'best_stock_model.keras',
        monitor='loss',
        save_best_only=True,
        verbose=1
    ),
    # Learning Rate Reduction: 학습이 정체되면 학습률 감소
    ReduceLROnPlateau(
        monitor='loss',
        factor=0.5,
        patience=5,
        min_lr=1e-7,
        verbose=1
    )
]

# 배치 크기를 64로 증가 (GPU 사용 시 성능 향상)
batch_size = 64 if gpus else 32

history = model.fit(
    [X_stock_train, X_econ_train],
    y_train,
    epochs=50,
    batch_size=batch_size,
    callbacks=callbacks,
    verbose=1
)

print("Performing full predictions...")
predicted_prices = model.predict([X_stock_full, X_econ_full], verbose=1)
predicted_prices_actual = stock_scaler.inverse_transform(predicted_prices)

pred_len = len(predicted_prices_actual)

# 오늘 날짜들 (마지막 날짜까지 포함)
today_dates = data['날짜'].iloc[lookback : lookback + pred_len].values

# 오늘 실제 주가 (오늘 날짜에 해당하는 실제값), 데이터 범위 넘어가면 NaN 처리
actual_data_end = min(lookback + pred_len, len(data))
actual_full = data[target_columns].iloc[lookback:actual_data_end].values

# 만약 actual_full 길이가 pred_len보다 짧다면 부족한 부분을 NaN으로 채움
if actual_full.shape[0] < pred_len:
    nan_padding = np.full((pred_len - actual_full.shape[0], len(target_columns)), np.nan)
    actual_full = np.vstack([actual_full, nan_padding])

result_data = pd.DataFrame({'날짜': today_dates})

for idx, col in enumerate(target_columns):
    result_data[f'{col}_Predicted'] = predicted_prices_actual[:, idx]
    result_data[f'{col}_Actual'] = actual_full[:, idx]

result_data['날짜'] = pd.to_datetime(result_data['날짜'], errors='coerce')
result_data['날짜'] = result_data['날짜'].dt.strftime('%Y-%m-%d')

# # 결과를 Supabase에 저장
def save_predictions_to_db(result_df):
    try:
        # 기존 테이블이 없으면 생성 (predicted_stocks 테이블에 저장)
        records = result_df.to_dict('records')

        # 테이블에 먼저 데이터 삭제 후 새로 삽입
        supabase.table("predicted_stocks").delete().neq("id", 0).execute()

        # 일괄 삽입 (큰 데이터라면 청크로 나누어 삽입)
        chunk_size = 100
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i+chunk_size]
            response = supabase.table("predicted_stocks").insert(chunk).execute()

        print(f"{len(records)}개의 예측 결과가 데이터베이스에 저장되었습니다.")
    except Exception as e:
        print(f"데이터베이스 저장 오류: {e}")

# 예측 결과 저장
save_predictions_to_db(result_data)

plt.figure(figsize=(12, 6))
plt.plot(history.history['loss'], label='Train Loss')
plt.title('Training Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.show()

for col in target_columns:
    plt.figure(figsize=(12, 6))
    plt.plot(pd.to_datetime(result_data['날짜']), result_data[f'{col}_Actual'], label='Actual (Today)', alpha=0.7)
    plt.plot(pd.to_datetime(result_data['날짜']), result_data[f'{col}_Predicted'], label=f'Predicted ({forecast_horizon} days later)', alpha=0.7)
    plt.title(f'{col} - Actual(Today) vs Predicted({forecast_horizon} days later)')
    plt.xlabel('Date (Today)')
    plt.ylabel('Price')
    plt.legend()
    plt.xticks(rotation=45)
    plt.grid()
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gcf().autofmt_xdate()
    plt.close()

print(f"모든 예측 결과가 DB에 저장되었습니다.")

#################################### 결과 추론 ####################################
#################################### 결과 추론 ####################################
#################################### 결과 추론 ####################################

######################
# (0) Get Predictions From DB Function
######################

# Supabase에서 예측 데이터 가져오기 (청크 단위)
def get_predictions_from_db(chunk_size=1000):
    try:
        # 전체 레코드 수 확인
        count_response = supabase.table("predicted_stocks").select("id", count="exact").execute()
        total_count = count_response.count
        print(f"predicted_stocks 테이블의 총 레코드 수: {total_count}")

        # 데이터를 저장할 빈 리스트
        all_data = []

        # 청크 단위로 데이터 가져오기
        for offset in range(0, total_count, chunk_size):
            response = (
                supabase.table("predicted_stocks")
                .select("*")
                .order("날짜", desc=False)
                .limit(chunk_size)
                .offset(offset)
                .execute()
            )
            chunk_data = response.data
            print(f"오프셋 {offset}에서 {len(chunk_data)}개 데이터를 가져왔습니다.")
            all_data.extend(chunk_data)

        # 모든 데이터를 DataFrame으로 변환
        df = pd.DataFrame(all_data)
        print(f"총 {len(df)}개 데이터를 성공적으로 가져왔습니다!")

        # 날짜 열을 datetime으로 변환
        df['날짜'] = pd.to_datetime(df['날짜'])

        return df
    except Exception as e:
        print(f"데이터 가져오기 오류: {e}")
        return None

# 결과를 Supabase에 저장
def save_analysis_to_db(result_df):
    try:
        # stock_analysis_results 테이블에 저장
        records = result_df.to_dict('records')

        # 테이블에 먼저 데이터 삭제 후 새로 삽입
        supabase.table("stock_analysis_results").delete().neq("id", 0).execute()

        # 일괄 삽입 (큰 데이터라면 청크로 나누어 삽입)
        chunk_size = 100
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i+chunk_size]
            response = supabase.table("stock_analysis_results").insert(chunk).execute()

        print(f"{len(records)}개의 분석 결과가 데이터베이스에 저장되었습니다.")
    except Exception as e:
        print(f"데이터베이스 저장 오류: {e}")

######################
# (1) Evaluation Function
######################
def evaluate_predictions(data, target_columns, forecast_horizon):
    """
    This function compares actual vs. predicted values (for the next 7 days)
    and computes various metrics such as MAE, MSE, RMSE, MAPE, and Accuracy.

    - MAE (Mean Absolute Error): Average absolute error between actual and predicted
      (lower is better, same unit as original data)
    - MSE (Mean Squared Error): Average of squared errors
      (lower is better)
    - RMSE (Root Mean Squared Error): Square root of MSE
      (lower is better, often used with MAE)
    - MAPE (Mean Absolute Percentage Error): Error as a percentage of the actual values
      (lower is better)
    - Accuracy (%): Computed as 100 - MAPE, serving as a simple accuracy measure
    """

    metrics = []

    for col in target_columns:
        # 원래 컬럼명 그대로 사용
        predicted_col = f'{col}_Predicted'
        actual_col = f'{col}_Actual'

        # Check if the columns exist
        if predicted_col not in data.columns or actual_col not in data.columns:
            print(f"Skipping {col}: Columns not found in data ({predicted_col}, {actual_col})")
            continue

        # Retrieve predicted and actual values
        predicted = data[predicted_col]
        # Shift the actual values by forecast_horizon days
        # so that today's prediction aligns with actual values 14 days ahead
        actual = data[actual_col].shift(-forecast_horizon)

        # Use only valid (non-NaN) indices
        valid_idx = ~predicted.isna() & ~actual.isna()
        predicted = predicted[valid_idx]
        actual = actual[valid_idx]

        if len(predicted) == 0:
            print(f"Skipping {col}: No valid prediction/actual pairs.")
            continue

        # Calculate metrics
        mae = mean_absolute_error(actual, predicted)
        mse = mean_squared_error(actual, predicted)
        rmse = mse ** 0.5
        mape = (abs((actual - predicted) / actual).mean()) * 100
        accuracy = 100 - mape

        metrics.append({
            'Stock': col,
            'MAE': mae,
            'MSE': mse,
            'RMSE': rmse,
            'MAPE (%)': mape,
            'Accuracy (%)': accuracy
        })

    return pd.DataFrame(metrics)

###############################
# (2) Future Rise Analysis
###############################
def analyze_rise_predictions(data, target_columns):
    """
    This function looks at the last row of the DataFrame (most recent date),
    compares actual vs. predicted values, and calculates rise/fall information
    and rise probability in percentage.
    """

    last_row = data.iloc[-1]
    results = []

    for col in target_columns:
        # 원래 컬럼명 그대로 사용
        actual_col = f'{col}_Actual'
        predicted_col = f'{col}_Predicted'

        last_actual_price = last_row.get(actual_col, np.nan)
        predicted_future_price = last_row.get(predicted_col, np.nan)

        # Determine rise/fall and rise percentage
        if pd.notna(last_actual_price) and pd.notna(predicted_future_price):
            predicted_rise = predicted_future_price > last_actual_price
            rise_probability = ((predicted_future_price - last_actual_price) / last_actual_price) * 100
        else:
            predicted_rise = np.nan
            rise_probability = np.nan

        results.append({
            'Stock': col,
            'Last Actual Price': last_actual_price,
            'Predicted Future Price': predicted_future_price,
            'Predicted Rise': predicted_rise,
            'Rise Probability (%)': rise_probability
        })

    return pd.DataFrame(results)

#######################################
# (3) Buy/Sell Recommendation and Analysis
#######################################
def generate_recommendation(row):
    """
    Example logic:
    - (Predicted Rise == True) and (Rise Probability > 0) => BUY
    - (Rise Probability > 2) => STRONG BUY
    - Otherwise => SELL
    """
    rise_prob = row.get('Rise Probability (%)', 0)
    predicted_rise = row.get('Predicted Rise', False)

    if pd.isna(rise_prob) or pd.isna(predicted_rise):
        return "No Data"

    if predicted_rise and rise_prob > 0:
        if rise_prob > 2:
            return "STRONG BUY"
        else:
            return "BUY"
    else:
        return "SELL"

def generate_analysis(row):
    """
    Provides a one-line comment for each entry.
    Stock: stock name
    Rise Probability (%): approximate rise probability
    """
    stock_name = row['Stock']
    rise_prob = row.get('Rise Probability (%)', 0)
    predicted_rise = row.get('Predicted Rise', False)

    if pd.isna(rise_prob) or pd.isna(predicted_rise):
        return f"{stock_name}: Not enough data"

    if predicted_rise:
        return f"{stock_name} is expected to rise by about {rise_prob:.2f}%. Consider buying or holding."
    else:
        return f"{stock_name} is expected to fall by about {-rise_prob:.2f}%. A cautious approach is recommended."

#######################
# (4) Main Code
#######################
# 1) Load Data from Supabase
data = get_predictions_from_db(chunk_size=1000)
if data is None or len(data) == 0:
    print("데이터를 가져오는데 실패했습니다.")
    exit(1)

# 2) Target columns
target_columns = [
    '애플', '마이크로소프트', '아마존', '구글 A', '구글 C', '메타',
    '테슬라', '엔비디아', '코스트코', '넷플릭스', '페이팔', '인텔', '시스코', '컴캐스트',
    '펩시코', '암젠', '허니웰 인터내셔널', '스타벅스', '몬델리즈', '마이크론', '브로드컴',
    '어도비', '텍사스 인스트루먼트', 'AMD', '어플라이드 머티리얼즈', 'S&P 500 ETF', 'QQQ ETF'
]

forecast_horizon = 14  # predicting 14 days ahead

# 3) Evaluate predictions
evaluation_results = evaluate_predictions(data, target_columns, forecast_horizon)
print("============ Evaluation Results ============")
print(evaluation_results)

# 4) Analyze future rise
rise_results = analyze_rise_predictions(data, target_columns)
print("============ Rise Predictions ============")
print(rise_results)

# 5) Merge DataFrames (evaluation metrics + rise analysis)
final_results = pd.merge(evaluation_results, rise_results, on='Stock', how='outer')

# 6) Sort by rise probability (descending order)
final_results = final_results.sort_values(by='Rise Probability (%)', ascending=False)

# 7) Generate buy/sell recommendations and analysis
final_results['Recommendation'] = final_results.apply(generate_recommendation, axis=1)
final_results['Analysis'] = final_results.apply(generate_analysis, axis=1)

# Reorder columns
column_order = [
    'Stock',
    'MAE', 'MSE', 'RMSE', 'MAPE (%)', 'Accuracy (%)',
    'Last Actual Price', 'Predicted Future Price', 'Predicted Rise', 'Rise Probability (%)',
    'Recommendation', 'Analysis'
]
final_results = final_results[column_order]

# 8) Save final results to Supabase
save_analysis_to_db(final_results)
print("\n분석 결과가 'stock_analysis_results' 테이블에 저장되었습니다.")

# 9) Print final report
print("=============== Final Report ===============")
print(final_results.to_string(index=False))
