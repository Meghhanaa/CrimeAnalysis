from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
import os
from crime_analyzer import analyze_crime_data
from predict_crime import predict_future_crime_rate

app = Flask(__name__)
# CORS(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# ---------- Load Metadata ----------
def load_json_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return []

cities = load_json_file('../model/cities.json')
descriptions = load_json_file('../model/crime_descriptions.json')

# ---------- Load dataset ----------
try:
    dataset = pd.read_csv('../model/encoded_dataset.csv')
    print("✅ Dataset loaded successfully.")
    dataCrimeset = pd.read_csv('../crime_dataset_india.csv')
    print("✅ Dataset loaded successfully.")
except Exception as e:
    dataset = None
    print(f"❌ Failed to load dataset: {e}")

# ---------- Routes ----------
@app.route('/')
def home():
    return "🔍 Crime Analysis API Running."

@app.route('/analyze_crime', methods=['POST'])
def predict_crime():
    if dataset is None:
        return jsonify({'error': 'Dataset not available'}), 500

    data = request.get_json()
    city = data.get('city')
    description = data.get('description')
    year = data.get('year', None)

    if not city or not description:
        return jsonify({'error': 'City and Description are required'}), 400

    try:
        year = int(year) if year else None
        result = analyze_crime_data(dataset.copy(), city, description, year)
        return jsonify(result)
    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({'error': 'Prediction failed'}), 500

@app.route('/predict_future_crime', methods=['POST'])
def predict_future_crime():
    data = request.get_json()

    city = data.get('city', '').strip()
    description = data.get('description', '').strip()
    target_year = data.get('target_year')

    if not city or not description or not target_year:
        return jsonify({'error': 'City, Description, and Target Year are required'}), 400

    try:
        target_year = int(target_year)
        forecast_df = predict_future_crime_rate(dataset.copy(), city, description, target_year)
        year_pred = forecast_df[forecast_df.index.to_series().dt.year == target_year]

        if not year_pred.empty:
            avg_rate = year_pred['Predicted_Crime_Rate'].mean()
            est_cases = int(year_pred['Estimated_Cases'].mean())

            result = {
                "average_crime_rate_percent": round(avg_rate, 2),
                "estimated_cases": est_cases,
                # "monthly_forecast": year_pred.round(2).to_dict(orient='index')
            }
        else:
            result = {"message": f"No predictions for {target_year}. Try a later year."}

        return jsonify(result)

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500
    

@app.route('/crime_by_city', methods=['POST'])
def crime_by_city():
    if dataCrimeset is None:
        return jsonify({'error': 'Dataset not loaded'}), 500

    data = request.get_json()
    crime_type = data.get('crime_type', '').strip().upper()

    if not crime_type:
        return jsonify({'error': 'Crime type is required'}), 400

    try:
        # Filter only rows matching the given crime type
        filtered = dataCrimeset[dataCrimeset['Crime Description'].str.upper() == crime_type]

        if filtered.empty:
            return jsonify({'message': f'No cases found for crime type: {crime_type}'}), 404

        # Group by City (or State if you have it)
        result_df = filtered.groupby('City').size().reset_index(name='Total Cases')
        result_df = result_df.sort_values(by='Total Cases', ascending=False)
        print(result_df.to_dict(orient='records'))

        return jsonify(result_df.to_dict(orient='records'))

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal error', 'details': str(e)}), 500

@app.route('/get_cities', methods=['GET'])
def get_cities():
    return jsonify(cities)

@app.route('/get_descriptions', methods=['GET'])
def get_descriptions():
    return jsonify(descriptions)

# ---------- Run ----------
if __name__ == '__main__':
    app.run(debug=True)
