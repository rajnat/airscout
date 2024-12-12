from flask import Blueprint

deals_bp = Blueprint("deals", __name__)

from .routes import *  # Import routes to attach them to the blueprint
