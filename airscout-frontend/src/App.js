import React, { useState } from 'react';
import './App.css';
import logo from './logo.svg';
import axios from 'axios';
import Autosuggest from 'react-autosuggest'; // Import Autosuggest
import airportDataRaw from './data/airports.json'; // Import the raw JSON file

function App() {
  const airportData = Object.values(airportDataRaw); // Convert JSON to array

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
      const response = await axios.get('http://127.0.0.1:5000/deals', {
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

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="AirScout Logo" />
        <h1>Welcome to AirScout</h1>
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
      </header>

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
    </div>
  );
}

export default App;
  