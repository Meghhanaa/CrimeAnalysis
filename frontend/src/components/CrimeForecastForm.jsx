import { useState, useEffect } from 'react';
import axios from 'axios';
import './PredictionForm.css';

export default function CrimeForecastForm() {
  const [formData, setFormData] = useState({ year: '', city: '', description: '' });
  const [result, setResult] = useState(null);
  const [cities, setCities] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load cities
    axios.get('http://localhost:5000/get_cities')
      .then(res => setCities(res.data))
      .catch(err => console.error("Failed to load cities", err));

    // Load crime descriptions
    axios.get('http://localhost:5000/get_descriptions')
      .then(res => setDescriptions(res.data))
      .catch(err => console.error("Failed to load descriptions", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentYear = new Date().getFullYear();

    if (!formData.year || !formData.city || !formData.description) {
      setError("All fields are required.");
      setResult(null);
      return;
    }

    if (parseInt(formData.year) < currentYear) {
      setError(`Year must be ${currentYear} or later.`);
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    console.log(formData)

    try {
        const payload = {
      target_year: formData.year,
      city: formData.city,
      description: formData.description
    };
      console.log(payload)
      const response = await axios.post('http://localhost:5000/predict_future_crime', payload);
      setResult(response.data);
      console.log(result)
    } catch (err) {
      console.error("Prediction API error", err);
      setError("Prediction failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="prediction-form">
      <h2>📈 Crime Forecast</h2>

      <form onSubmit={handleSubmit} className="form-fields">
        <input
          name="year"
          type="number"
          min={new Date().getFullYear()}
          placeholder={`Enter year (≥ ${new Date().getFullYear()})`}
          className="form-input"
          value={formData.year}
          onChange={handleChange}
          required
        />

        <select
          name="city"
          className="form-input"
          value={formData.city}
          onChange={handleChange}
          required
        >
          <option value="">Select City</option>
          {cities.map((city, idx) => (
            <option key={idx} value={city}>{city}</option>
          ))}
        </select>

        <select
          name="description"
          className="form-input"
          value={formData.description}
          onChange={handleChange}
          required
        >
          <option value="">Select Crime Description</option>
          {descriptions.map((desc, idx) => (
            <option key={idx} value={desc}>{desc}</option>
          ))}
        </select>

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Crime'}
        </button>
      </form>

      {error && <p className="error-message">❗ {error}</p>}

      {result && (
        <div className="analysis-result">
          <h3>🔮 Forecast Result</h3>
          <p><strong>Predicted Crime Rate (%):</strong> {result.average_crime_rate_percent}</p>
          <p><strong>Estimated Number of Cases:</strong> {result.estimated_cases}</p>
        </div>
      )}
    </div>
  );
}
