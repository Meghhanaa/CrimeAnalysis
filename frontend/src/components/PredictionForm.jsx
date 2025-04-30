import { useState, useEffect } from 'react';
import axios from 'axios';
import './PredictionForm.css';

export default function PredictionForm() {
  const [formData, setFormData] = useState({ year: '', city: '', description: '' });
  const [result, setResult] = useState(null);
  const [cities, setCities] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/get_cities')
      .then(res => setCities(res.data))
      .catch(err => console.error(err));

    axios.get('http://localhost:5000/get_descriptions')
      .then(res => setDescriptions(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentYear = new Date().getFullYear();
    if (formData.year && formData.year >= currentYear) {
      setError("Year cannot be in the future.");
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    console.log(formData)

    try {
      const res = await axios.post('http://localhost:5000/analyze_crime', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-form">
      <h2>📊 Crime Analyzer</h2>

      <form onSubmit={handleSubmit} className="form-fields">
        <input name="year" placeholder="Enter year between 2020 to 2024" type="number" className="form-input" value={formData.year} onChange={handleChange} />
        
        <select name="city" className="form-input" value={formData.city} onChange={handleChange} required>
          <option value="">Select City</option>
          {cities.map((city, i) => <option key={i} value={city}>{city}</option>)}
        </select>

        <select name="description" className="form-input" value={formData.description} onChange={handleChange} required>
          <option value="">Select Crime Description</option>
          {descriptions.map((desc, i) => <option key={i} value={desc}>{desc}</option>)}
        </select>

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Crime'}
        </button>
      </form>

      {error && <p className="error-message">❗ {error}</p>}

      {result && (
        <div className="analysis-result">
          <h3>🔍 Analysis Result</h3>
          <p><strong>Estimated Cases:</strong> {result["Estimated Cases"]}</p>
          <p><strong>Crime Rate (%):</strong> {result["Crime Rate (%)"]}</p>
          <div>
            <strong>Closure Status:</strong>
            {typeof result["Closure Status"] === 'string' ? (
              <p>{result["Closure Status"]}</p>
            ) : (
              <ul>
                {/* <li>Estimated Cases: {result["Closure Status"]["Estimated Cases"]}</li> */}
                <li>Closed Cases: {result["Closure Status"]["Closed Cases"]}</li>
                <li>Closure Rate: {result["Closure Status"]["Closure Rate (%)"]}%</li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
