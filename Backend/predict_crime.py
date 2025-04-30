import pandas as pd
import numpy as np
import os
from statsmodels.tsa.arima.model import ARIMA

def calculate_crime_rate(df, city_name, crime_type):
    df.columns = df.columns.str.lower()
    city_col = f'city_{city_name.lower()}'
    crime_col = f'crime description_{crime_type.lower().replace(" ", "-")}'

    if city_col not in df.columns or crime_col not in df.columns:
        raise ValueError("City or crime type column not found.")

    total_city_cases = df[city_col].sum()
    specific_cases = df[df[crime_col] == 1][city_col].sum()

    crime_rate = (specific_cases / total_city_cases) * 100 if total_city_cases > 0 else 0.0
    return round(crime_rate, 4), specific_cases

def predict_future_crime_rate(df, city_name, crime_type, target_year):
    df.columns = df.columns.str.lower()
    df['date reported'] = pd.to_datetime(df['date reported'], errors='coerce')
    df = df.dropna(subset=['date reported'])
    df = df.set_index('date reported')

    city_col = f'city_{city_name.lower()}'

    monthly_crime_rate = df.groupby(pd.Grouper(freq='ME')).apply(
        lambda x: calculate_crime_rate(x, city_name, crime_type)[0]
    ).to_frame(name='Crime_Rate')

    monthly_crime_rate = monthly_crime_rate.ffill()

    model = ARIMA(monthly_crime_rate['Crime_Rate'], order=(1, 1, 1))
    model_fit = model.fit()

    months_to_predict = (target_year - monthly_crime_rate.index[-1].year) * 12
    forecast = model_fit.forecast(steps=months_to_predict)

    future_dates = pd.date_range(monthly_crime_rate.index[-1] + pd.offsets.MonthEnd(1),
                                 periods=months_to_predict, freq='ME')
    forecast_df = pd.DataFrame({'Predicted_Crime_Rate': forecast.values}, index=future_dates)

    last_year = df.index.max().year
    years_range = df[df.index.year >= last_year - 2]

    if city_col not in years_range.columns:
        raise ValueError(f"{city_col} not found in data.")

    avg_total_cases = years_range[city_col].resample('ME').sum().mean()
    forecast_df['Estimated_Cases'] = (forecast_df['Predicted_Crime_Rate'] / 100) * avg_total_cases
    forecast_df['Estimated_Cases'] = forecast_df['Estimated_Cases'].apply(lambda x: max(round(x), 1))

    return forecast_df
