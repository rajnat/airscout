from flask import Flask
from flask_cors import CORS
from app.extensions import db, jwt, bcrypt
from app.auth import auth_bp
from app.deals import deals_bp
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Enable CORS for the entire app
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(deals_bp, url_prefix="/deals")

    # Serve React Frontend
    @app.route("/", defaults={"path": "airscount-frontend/build"})
    @app.route("/<path:path>")
    def serve(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)  # Serve the file if it exists
        return send_from_directory(app.static_folder, "index.html")  # Serve index.html for React routes

    return app
