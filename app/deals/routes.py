from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from amadeus import Client, ResponseError
from app.utils import fetch_historical_price

deals_bp = Blueprint("deals", __name__)

# Initialize Amadeus API Client
amadeus = Client(
    client_id="YOUR_AMADEUS_API_KEY",
    client_secret="YOUR_AMADEUS_SECRET_KEY"
)

@deals_bp.route("/", methods=["GET"])
@jwt_required()
def get_flight_deals():
    try:
        origin = request.args.get("origin")
        departure_date = request.args.get("departure_date")
        return_date = request.args.get("return_date")

        if not origin or not departure_date or not return_date:
            return jsonify({"error": "Missing required parameters"}), 400

        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=None,
            departureDate=departure_date,
            returnDate=return_date,
            adults=1,
            max=10
        )

        flight_deals = []
        for offer in response.data:
            itinerary = offer["itineraries"][0]
            destination = itinerary["segments"][-1]["arrival"]["iataCode"]
            price = float(offer["price"]["total"])

            historical_price = fetch_historical_price(origin, destination, departure_date)

            if historical_price and (historical_price - price) / historical_price >= 0.3:
                flight_deals.append({
                    "destination": destination,
                    "departure_date": departure_date,
                    "return_date": return_date,
                    "current_price": price,
                    "historical_price": historical_price
                })

        return jsonify(flight_deals)

    except ResponseError as error:
        return jsonify({"error": str(error)}), 500
