from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import yfinance as yf
from prophet import Prophet
from datetime import datetime, timedelta
import pytz
import os
import warnings
from dateutil.relativedelta import *
# from fbprophet import Prophet
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM
from multiprocessing.pool import ThreadPool
import requests
import json

app = Flask(__name__)
CORS(app)
warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
NEWS_API_KEY = '79218abef1ac436e8a350bd9940d9618'
NEWS_API_URL = 'https://newsapi.org/v2/everything'

def fetch_news():
    params = {
        'q': 'stock market india',
        'apiKey': NEWS_API_KEY,
    }

    try:
        response = requests.get(NEWS_API_URL, params=params)
        response.raise_for_status()
        news_data = response.json()
        news_data['articles'].sort(key=lambda x: x['publishedAt'], reverse=True)
        return news_data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching news: {e}")
        return {"articles": []}

@app.route('/news', methods=['GET'])
def get_news():
    news = fetch_news()
    articles = news.get("articles", [])
    # Simplify the data if necessary
    articles = [{
        'id': index + 1,
        'title': article['title'],
        'date': article['publishedAt'],
        'content': article['description'],
        'url': article['url'],
        'image': article['urlToImage']
    } for index, article in enumerate(articles)]
    
    return jsonify(articles)

@app.route('/compare', methods=['POST'])
def compare():
    data = request.json
    tickers = data['tickers']
    start = data['start']
    end = data['end']

    try:
        df = yf.download(tickers, start=start, end=end)['Close']
        if df.empty:
            return jsonify({"error": "No data found for the given tickers"}), 404
        
        df.index = df.index.strftime('%d-%m-%Y')

        result = {ticker: df[ticker].to_dict() for ticker in tickers}
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_previous_market_open():
    # Get today's date in UTC
    today = datetime.now(pytz.utc)
    
    # Check if today is Monday, we need the last Friday's market open
    if today.weekday() == 0:  # Monday
        previous_day = today - timedelta(days=3)
    else:
        previous_day = today - timedelta(days=1)
    
    # Get the date of the previous market open (market opens at 9:30 AM local time)
    previous_market_open = previous_day.replace(hour=9, minute=30, second=0, microsecond=0)
    
    return previous_market_open

@app.route('/realtime', methods=['POST'])
def realtime():
    data = request.json
    ticker = data.get('ticker')
    
    # Get the previous market open time and current time
    start_time = get_previous_market_open()
    end_time = datetime.now(pytz.utc)  # Current time
    
    try:
        # Download minute-level data from previous market open to current time
        df = yf.download(ticker, start=start_time, end=end_time, interval='1m')
        
        if df.empty:
            return jsonify({'error': 'No data found for the given ticker'}), 404
        
        # Reset index and convert datetime to a more readable format
        df.reset_index(inplace=True)
        
        # Convert to string format for time
        df['Time'] = df['Datetime'].dt.strftime('%Y-%m-%d %H:%M')
        
        # Filter out future data (any minute after the current time)
        current_time = datetime.now(pytz.utc)
        df = df[df['Datetime'] <= current_time]  # Exclude future data
        
        # Sort by time in descending order
        df.sort_values(by='Datetime', ascending=False, inplace=True)
        
        # Prepare a list of time-price pairs to return
        # result = df[['Time', 'Close']].to_dict(orient='records')
        df = df[['Time', 'Close']].copy()  # Explicitly copying to avoid hidden metadata issues
        df.columns = ['Time', 'Close']  # Ensuring column names are correct
        df.reset_index(drop=True, inplace=True)  # Remove any index interference
        result = df.to_dict(orient='records')  # Convert to proper dictionary list

        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Function to fetch historical data
def get_yf_data(ticker):
    df = yf.download(ticker, start='2024-01-01', end=datetime.today().strftime('%Y-%m-%d'))
    df.reset_index(inplace=True) 
    return df

def get_real_time_data(ticker):
    df = yf.download(ticker, period='1d', interval='1m')  # Fetch 1 minute interval data
    last_price = df['Close'].iloc[-1]
    return last_price

# Prophet data formatting
def format_prophet_data(df):
    df_train = df[['Date', 'Close']].reset_index(drop=True)
    df_train.rename(columns={"Date": "ds", "Close": "y"}, inplace=True)
    df_train.columns = df_train.columns.get_level_values(0)
    df_train['ds'] = pd.to_datetime(df_train['ds'])  # Ensure proper datetime format
    df_train['y'] = pd.to_numeric(df_train['y'], errors='coerce')  # Convert values to float

    return df_train

# Prophet prediction
def prophet_predict(df_train, period):
    model = Prophet()
    model.fit(df_train)
    future = model.make_future_dataframe(periods=period)
    forecast = model.predict(future)
    forecast['ds'] = forecast['ds'].dt.strftime('%Y-%m-%d')  # Convert Timestamp Series to string format
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records')

# LSTM data formatting and prediction
def format_lstm_data(df):
    # Ensure 'Date' column is in datetime format (important for LSTM)
    df.columns = df.columns.get_level_values(0)
    df['Date'] = pd.to_datetime(df['Date'])
    data = df.filter(["Close"])
    dataset = data.values
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(dataset)
    return df, scaler, scaled_data

def generate_lstm_model(xtr, ytr):
    model = Sequential()
    model.add(LSTM(units=64, return_sequences=True, input_shape=(xtr.shape[1], xtr.shape[2])))
    model.add(LSTM(units=64, return_sequences=False))
    model.add(Dense(units=16))
    model.add(Dense(units=1))
    model.compile(optimizer="adam", loss="mean_squared_error")
    model.fit(xtr, ytr, batch_size=128, epochs=300, verbose=2)
    return model

def lstm_predict(symbol, period):
    # Fetch historical data
    df = get_yf_data(symbol)
    dataset, scaler, scaled_data = format_lstm_data(df)

    # Prepare data for LSTM model training
    xtr = []
    ytr = []
    for i in range(15, len(scaled_data)):
        xtr.append(scaled_data[i - 15:i, 0])
        ytr.append(scaled_data[i, 0])
    xtr = np.array(xtr)
    ytr = np.array(ytr)
    xtr = np.reshape(xtr, (xtr.shape[0], xtr.shape[1], 1))

    # Train the LSTM model
    model = generate_lstm_model(xtr, ytr)

    # Get the last 15 data points (window size for LSTM)
    last_data = scaled_data[-15:]
    last_data = np.reshape(last_data, (1, 15, 1))  # Reshape to match the input shape

    # Predict future values for the given period
    predictions = []
    future_dates = [pd.to_datetime(df['Date'].iloc[-1]) + timedelta(days=i) for i in range(1, period + 1)]

    for _ in range(period):  # Loop for prediction periods (for each day in the period)
        pred = model.predict(last_data)  # Predict the next price
        predicted_price = scaler.inverse_transform(pred)  # Convert the scaled prediction back to actual price
        predicted_price = float(predicted_price[0][0])  # Convert to scalar value

        predictions.append(predicted_price)  # Store the predicted price

        # Update the last_data array with the predicted value
        # Add predicted value as the next step and shift the window
        pred_reshaped = np.reshape(pred, (1, 1, 1))  # Reshape to match the input shape
        last_data = np.append(last_data[:, 1:, :], pred_reshaped, axis=1)  # Update the data window

    # Create a result with historical data and predictions
    historical_data = df[['Date', 'Close']].copy()
    historical_data.columns = ['Date', 'Close']
    historical_data['Date'] = historical_data['Date'].dt.strftime('%Y-%m-%d')
    historical_data.reset_index(drop=True, inplace=True)


    # Prepare result with both historical and future predictions
    result = [{
        'ds': historical_data['Date'].iloc[i],
        'yhat': historical_data['Close'].iloc[i],
        'yhat_lower': historical_data['Close'].iloc[i],
        'yhat_upper': historical_data['Close'].iloc[i]
    } for i in range(len(historical_data))]

    # Add future predictions to the result
    for i, pred in enumerate(predictions):
        result.append({
            'ds': future_dates[i].strftime('%Y-%m-%d'),
            'yhat': pred,
            'yhat_lower': pred,
            'yhat_upper': pred
        })

    return result

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        ticker = data['ticker']
        period = data['period']
        model_type = data['model_type']

        # Validate input data
        if not ticker or period <= 0:
            return jsonify({'error': 'Invalid input data'}), 400
        
        # Fetch real-time data (latest price)
        real_time_price = get_real_time_data(ticker).iloc[0]

        if not real_time_price:
            return jsonify({'error': 'Unable to fetch real-time data for the ticker'}), 500

        # Fetch historical data for prediction
        df = get_yf_data(ticker)
        if df is None or df.empty:
            return jsonify({'error': 'No historical data found for the ticker'}), 500
        
        # Reset the index to make 'Date' a regular column
        df.reset_index(inplace=True)
        
        # Extract 'Date' and 'Close' from the DataFrame

        historical_data = df[['Date', 'Close']].copy()
        historical_data.columns = ['Date', 'Close']
        historical_data['Date'] = historical_data['Date'].dt.strftime('%Y-%m-%d')
        historical_data.reset_index(drop=True, inplace=True)
        
        # Format data for Prophet or LSTM
        if model_type == 'prophet':
            df_train = format_prophet_data(df)  # Format for Prophet
            predictions = prophet_predict(df_train, period)
        elif model_type == 'lstm':
            predictions = lstm_predict(ticker, period)
        else:
            return jsonify({'error': 'Invalid model type selected'}), 400
        
        

        result = {
            'real_time_price': float(real_time_price),
            'predictions': predictions,
            'historical_data': historical_data.to_dict(orient='records'),
        }


        return jsonify(result)

    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({'error': 'An error occurred while processing the request'}), 500

if __name__ == '__main__':
    app.run(debug=True)
