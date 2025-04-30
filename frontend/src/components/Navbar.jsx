import { Link } from 'react-router-dom';
import './Navbar.css'; // Import the CSS file

export default function Navbar() {
  return (
    <nav className="navbar">
      <h1 className="navbar-title">Crime Predictor & Analyzer</h1>
      <div className="navbar-links">
        <Link to="/" className="navbar-link">Home</Link>
      </div>
    </nav>
  );
}
