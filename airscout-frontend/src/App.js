import React, { useState } from 'react';
import './App.css';
import logo from './logo.svg';
import axios from 'axios';
import Autosuggest from 'react-autosuggest'; // Import Autosuggest
import airportDataRaw from './data/airports.json'; // Import the raw JSON file

const backendUrl = process.env.REACT_APP_BACKEND_URL; // Load backend URL from environment variables

function App() {
  const airportData = Object.values(airportDataRaw); // Convert JSON to array

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [value, setValue] = useState(''); // State for the input value
  const [suggestions, setSuggestions] = useState([]); // State for airport suggestions
  const [sourceAirport, setSourceAirport] = useState(''); // State for source airport
  const [departureDate, setDepartureDate] = useState(''); // State for departure date
  const [returnDate, setReturnDate] = useState(''); // State for return date
  const [flightDeals, setFlightDeals] = useState([]); // State for fetched deals

  const getSuggestions = (inputValue) => {
    const input = inputValue.trim().toLowerCase();
    if (!input) return [];
    return airportData
      .filter(
        (airport) =>
          airport.name.toLowerCase().includes(input) || // Match airport name
          airport.city?.toLowerCase().includes(input) || // Match city
          airport.state?.toLowerCase().includes(input) || // Match state
          airport.icao.toLowerCase().startsWith(input) || // Match ICAO code
          (airport.iata && airport.iata.toLowerCase().startsWith(input)) // Match IATA code
      )
      .slice(0, 10); // Limit to 10 results
  };

  const renderSuggestion = (suggestion) => (
    <div>
      {suggestion.name} ({suggestion.iata || suggestion.icao}) - {suggestion.city}, {suggestion.state}, {suggestion.country}
    </div>
  );

  const onSuggestionSelected = (event, { suggestion }) => {
    setSourceAirport(`${suggestion.name} (${suggestion.iata || suggestion.icao})`);
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem('access_token'); // Get the JWT token from localStorage
      const response = await axios.get(`${backendUrl}/deals`, {
        headers: { Authorization: `Bearer ${token}` }, // Add token to headers
        params: {
          origin: sourceAirport,
          departure_date: departureDate,
          return_date: returnDate,
        },
      });
      setFlightDeals(response.data);
    } catch (error) {
      console.error('Error fetching flight deals:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${backendUrl}/auth/login`, {
        username,
        password,
      });

      if (response.status === 200) {
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token); // Save token to localStorage
        setIsLoggedIn(true); // Set login state to true
      } else {
        alert('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token'); // Clear the token
    setIsLoggedIn(false); // Reset login state
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="AirScout Logo" />
        <h1 className="welcome-header">Welcome to AirScout</h1>
        {!isLoggedIn ? (
          // Login Screen
          <form className="login-form" onSubmit={handleLogin}>
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
            <button type="submit">Login</button>
          </form>
        ) : (
          // Query Screen
          <div>
            <button onClick={handleLogout}>Logout</button>
            <form className="search-form" onSubmit={handleSearch}>
              <label>
                Source Airport:
                <Autosuggest
                  suggestions={suggestions}
                  onSuggestionsFetchRequested={({ value }) => {
                    const filteredSuggestions = getSuggestions(value);
                    setSuggestions(filteredSuggestions);
                  }}
                  onSuggestionsClearRequested={() => setSuggestions([])}
                  getSuggestionValue={(suggestion) => suggestion.name}
                  renderSuggestion={renderSuggestion}
                  inputProps={{
                    placeholder: 'Enter source airport (e.g., JFK)',
                    value,
                    onChange: (e, { newValue }) => setValue(newValue),
                  }}
                  onSuggestionSelected={onSuggestionSelected}
                />
              </label>
              <label>
                Departure Date:
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </label>
              <label>
                Return Date:
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </label>
              <button type="submit">Search Flights</button>
            </form>
          </div>
        )}
      </header>

      {isLoggedIn && (
        <section>
          <h2>Flight Deals</h2>
          {flightDeals.length > 0 ? (
            <ul>
              {flightDeals.map((deal, index) => (
                <li key={index}>
                  Destination: {deal.destination}, Price: ${deal.current_price}
                </li>
              ))}
            </ul>
          ) : (
            <p>No deals found yet. Try searching!</p>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
