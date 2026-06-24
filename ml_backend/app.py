import os
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from routes.ml_routes import ml_bp, recommender, predictor, get_db_products

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)  # Enable Cross-Origin Resource Sharing for React frontend

# Register Blueprints
app.register_blueprint(ml_bp, url_prefix='/api/ml')

@app.route('/')
def home():
    """Renders the interactive microservice documentation page."""
    return render_template('index.html')

@app.route('/status')
def status():
    """Basic health check status route."""
    print(f"DEBUG status: recommender.db is {recommender.db}")
    print(f"DEBUG status: recommender.products_df is {'Not None' if recommender.products_df is not None else 'None'}")
    if recommender.products_df is not None:
        print(f"DEBUG status: products_df shape is {recommender.products_df.shape}")
    return jsonify({
        "status": "online",
        "message": "GourmetGo ML Backend is running successfully.",
        "port": 5001,
        "recommender_db": str(recommender.db),
        "recommender_trained": recommender.products_df is not None
    })

def initialize_models():
    """Initializes and trains both ML models with current DB data on startup."""
    print("------------------------------------------")
    print("GourmetGo ML Backend Startup Initialization")
    print("------------------------------------------")
    
    # 1. Connect database & train Recommender
    print("Initializing Food Recommender...")
    recommender.connect_db()
    recommender_success = recommender.load_and_train()
    
    # 2. Train Sales Predictor
    if recommender_success:
        print("Initializing Sales Predictor...")
        products = get_db_products()
        if products:
            predictor.train_model(products)
        else:
            print("Warning: Could not fetch products from database. Sales predictor training deferred.")
    else:
        print("Warning: Database offline. Recommender and Predictor initialization deferred until API hits.")
    
    print("------------------------------------------")

if __name__ == '__main__':
    # Initialize and train models
    initialize_models()
    
    # Run server on port 5001 (separate from Node.js Express server on port 5000)
    print("Starting Flask server on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
