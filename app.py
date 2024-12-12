from flask import Flask, request, jsonify
from amadeus import Client, ResponseError

app = Flask(__name__)

# Initialize Amadeus API Client
amadeus = Client(
    client_id='your_client_id',  # Replace with your Amadeus API key
    client_secret='your_client_secret'  # Replace with your Amadeus API secret
)

# Fetch historical average price (mocked function for now)
def fetch_historical_price(destination):
    # Example data: destination -> historical average price
    historical_prices = {
        "LON": 3000,  # Example: London
        "PAR": 2500,  # Example: Paris
        "TOK": 3500,  # Example: Tokyo
    }
    return historical_prices.get(destination, None)

# Fetch flight offers for flexible dates
@app.route('/deals/flexible', methods=['GET'])
def get_flexible_flight_deals():
    try:
        # Get parameters
        origin = request.args.get('origin', 'JFK')  # Default: JFK
        max_weeks_ahead = int(request.args.get('max_weeks', 4))  # Search up to X weeks ahead
        adults = int(request.args.get('adults', 1))
        DISCOUNT_THRESHOLD = 0.3  # Minimum 30% discount

        # Loop through the next X weeks to find deals
        from datetime import datetime, timedelta
        today = datetime.today()
        flight_deals = []

        for week in range(max_weeks_ahead):
            departure_date = (today + timedelta(days=week * 7)).strftime('%Y-%m-%d')
            return_date = (today + timedelta(days=(week * 7) + 7)).strftime('%Y-%m-%d')  # One-week trips

            # Fetch flight offers
            response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin,
                destinationLocationCode=None,  # Let Amadeus fetch various destinations
                departureDate=departure_date,
                returnDate=return_date,
                adults=adults,
                max=10  # Limit to 10 results per query
            )
            
            for offer in response.data:
                itinerary = offer['itineraries'][0]
                destination = itinerary['segments'][-1]['arrival']['iataCode']
                price = float(offer['price']['total'])

                # Fetch historical price for the destination
                historical_price = fetch_historical_price(destination)

                if historical_price:
                    discount = (historical_price - price) / historical_price
                    if discount >= DISCOUNT_THRESHOLD:
                        flight_deals.append({
                            "destination": destination,
                            "departure_date": departure_date,
                            "return_date": return_date,
                            "current_price": price,
                            "historical_price": historical_price,
                            "discount": f"{discount:.0%}"
                        })

        return jsonify(flight_deals)

    except ResponseError as error:
        return jsonify({"error": str(error)}), 500

if __name__ == '__main__':
    app.run(debug=True)
