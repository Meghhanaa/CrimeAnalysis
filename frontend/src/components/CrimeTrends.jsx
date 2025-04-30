import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CrimeTrends.css';
import { Bar } from 'react-chartjs-2';  // Importing Chart.js for bar chart
// import { Chart as ChartJS } from 'chart.js/auto';  // Registering chart.js components

function CrimeTrends() {
  const [crimeTypes, setCrimeTypes] = useState([]); // Crime types from backend
  const [selectedCrime, setSelectedCrime] = useState(''); // Selected crime type
  const [chartData, setChartData] = useState(null); // Chart data for rendering
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state

  useEffect(() => {
    // Load available crime types from backend (you can hard-code if necessary)
    axios.get('http://localhost:5000/get_descriptions')
      .then(res => setCrimeTypes(res.data))
      .catch(err => console.error("Failed to load crime types", err));
  }, []);

  const handleCrimeChange = (e) => {
    setSelectedCrime(e.target.value);
  };

  const handleGenerateChart = async () => {
    if (!selectedCrime) {
      setError('Please select a crime type');
      return;
    }

    setLoading(true);
    setError('');
    console.log(selectedCrime);

    try {
      const response = await axios.post('http://localhost:5000/crime_by_city', {
        crime_type: selectedCrime,
      });

      const cityData = response.data; // The backend sends city crime data

      if (cityData && cityData.length > 0) {
        // Prepare chart data
        const cities = cityData.map(item => item.City);
        const totalCases = cityData.map(item => item['Total Cases']);

        setChartData({
          labels: cities,
          datasets: [{
            label: 'Total Cases',
            data: totalCases,
            backgroundColor: '#4e73df', // Customize color if needed
            borderColor: '#2e59d9',
            borderWidth: 1,
          }]
        });
      } else {
        setError('No data found for the selected crime type.');
      }
    } catch (err) {
      setError('Failed to generate chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crime-forecast-form">
      <h2>Crime Forecast</h2>

      <div className="crime-type-selector">
        <label>Select Crime Type: </label>
        <select value={selectedCrime} onChange={handleCrimeChange}>
          <option value="">Select Crime</option>
          {crimeTypes.map((crime, index) => (
            <option key={index} value={crime}>{crime}</option>
          ))}
        </select>
      </div>

      <button className="generate-chart-btn" onClick={handleGenerateChart} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Crime Trends Chart'}
      </button>

      {error && <p className="error-message">{error}</p>}

      {chartData && (
        <div className="chart-container">
          <h3>Crime Distribution Chart</h3>
          <Bar
            data={chartData}  // Pass the chart data to the Bar chart
            options={{
              responsive: true,
              scales: {
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Cities',
                  },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Total Cases',
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CrimeTrends;
