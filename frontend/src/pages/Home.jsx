import { useState } from 'react';
import PredictionForm from '../components/PredictionForm';
import CrimeForecastForm from '../components/CrimeForecastForm';
import CrimeTrends from '../components/CrimeTrends';  // Import CrimeTrends component
import './Home.css'; // Make sure this path is correct

export default function Home() {
  const [mode, setMode] = useState('analyze'); // State to toggle between modes

  return (
    <div className="home-container">
      <div className="toggle-buttons">
        <button
          className={mode === 'analyze' ? 'active' : ''}
          onClick={() => setMode('analyze')}
        >
          🔍 Analyze Crime
        </button>

        <button
          className={mode === 'forecast' ? 'active' : ''}
          onClick={() => setMode('forecast')}
        >
          📈 Predict Future Crime
        </button>

        {/* Button for Crime Trends Mode */}
        <button
          className={mode === 'trends' ? 'active' : ''}
          onClick={() => setMode('trends')}
        >
          📊 Crime Trends
        </button>
      </div>

      <div className="form-wrapper">
        {/* Toggle between forms based on mode */}
        {mode === 'analyze' ? (
          <PredictionForm />
        ) : mode === 'forecast' ? (
          <CrimeForecastForm />
        ) : (
          <CrimeTrends />  // Render CrimeTrends component
        )}
      </div>
    </div>
  );
}
