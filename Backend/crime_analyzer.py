# crime_analyzer.py

import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split

def analyze_crime_data(df, city_input, crime_desc_input, year_input=None):
    df.columns = df.columns.str.strip().str.lower()
    original_df = df.copy()

    df_clean = df.drop(columns=[
        'report number', 'date reported', 'date of occurrence',
        'time of occurrence', 'date case closed'
    ], errors='ignore')

    for col in ['crime code', 'victim age', 'police deployed']:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')

    df_clean = df_clean.dropna()

    target_rate = 'crime domain_violent crime'
    target_cases = 'crime domain_other crime'

    if target_rate not in df_clean.columns or target_cases not in df_clean.columns:
        raise ValueError("Target columns not found in dataset.")

    X = df_clean.drop(columns=[target_rate, target_cases])
    y_rate = df_clean[target_rate]
    y_cases = df_clean[target_cases]

    X_train, _, y_rate_train, _ = train_test_split(X, y_rate, test_size=0.2, random_state=42)
    _, _, y_cases_train, _ = train_test_split(X, y_cases, test_size=0.2, random_state=42)

    reg_rate = XGBRegressor()
    reg_cases = XGBRegressor()

    reg_rate.fit(X_train, y_rate_train)
    reg_cases.fit(X_train, y_cases_train)

    input_data = {col: 0 for col in X.columns}

    for col in X.columns:
        if col.startswith('city_') and city_input.strip().title() == col.replace('city_', '').replace('_', ' ').title():
            input_data[col] = 1
        if col.startswith('crime description_') and crime_desc_input.strip().title() == col.replace('crime description_', '').replace('-', ' ').title():
            input_data[col] = 1

    input_df = pd.DataFrame([input_data]).reindex(columns=X.columns, fill_value=0)

    city_col = next((col for col in df.columns if col.startswith('city_') and city_input.strip().title() == col.replace('city_', '').replace('_', ' ').title()), None)
    desc_col = next((col for col in df.columns if col.startswith('crime description_') and crime_desc_input.strip().title() == col.replace('crime description_', '').replace('-', ' ').title()), None)

    if year_input and 'date reported' in original_df.columns:
        original_df['year'] = pd.to_datetime(original_df['date reported'], errors='coerce').dt.year
        df = df[pd.to_datetime(original_df['date reported'], errors='coerce').dt.year == year_input]

    if city_col in df.columns:
        city_df = df[df[city_col] == 1]
        total_cases_in_city = len(city_df)

        if desc_col in city_df.columns:
            specific_crime_df = city_df[city_df[desc_col] == 1]
            specific_crime_cases = len(specific_crime_df)
        else:
            specific_crime_cases = 0
    else:
        total_cases_in_city = 0
        specific_crime_cases = 0

    crime_rate = round((specific_crime_cases / total_cases_in_city) * 100, 2) if total_cases_in_city > 0 else 0

    if 'case closed_yes' in df.columns:
        if city_col in df.columns and desc_col in df.columns:
            closure_df = df[(df[city_col] == 1) & (df[desc_col] == 1)]
        else:
            closure_df = df

        total = len(closure_df)
        closed = closure_df['case closed_yes'].sum() if 'case closed_yes' in closure_df.columns else 0
        closure_rate = round((closed / total) * 100, 2) if total > 0 else None

        closure_result = {
            "Estimated Cases": total,
            "Closed Cases": int(closed),
            "Closure Rate (%)": closure_rate
        }
    else:
        closure_result = "Closure data not available."

    results = {
        "Crime Rate (%)": crime_rate,
        "Estimated Cases": specific_crime_cases,
        "Closure Status": closure_result
    }

    return results
