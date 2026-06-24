from flask import Blueprint, request, jsonify
from ml_models.recommendation_model import FoodRecommender
from ml_models.sales_prediction_model import SalesPredictor

ml_bp = Blueprint('ml', __name__)

# Initialize ML modules
recommender = FoodRecommender()
predictor = SalesPredictor()

def get_db_products():
    """Helper to fetch products from MongoDB dynamically."""
    try:
        if recommender.db is None:
            recommender.connect_db()
        if recommender.db is not None:
            products_col = recommender.db['products']
            return list(products_col.find({}, {'_id': 0}))
    except Exception as e:
        print(f"Error fetching products for routes: {e}")
    return []

@ml_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """
    GET /api/ml/recommendations?query=burger
    Returns content-based similar food recommendations with popularity boost.
    """
    query = request.args.get('query', '')
    print(f"DEBUG: Entered get_recommendations with query='{query}'")
    
    # Reload/retrain recommender to ensure it has latest products
    print("DEBUG: Calling recommender.load_and_train()")
    recommender.load_and_train()
    
    if recommender.products_df is not None:
        print(f"DEBUG: recommender.products_df shape = {recommender.products_df.shape}")
    else:
        print("DEBUG: recommender.products_df is None")
        
    recommendations = recommender.recommend_food(query, top_n=5)
    print(f"DEBUG: recommend_food returned {len(recommendations)} items")
    return jsonify(recommendations)

@ml_bp.route('/trending', methods=['GET'])
def get_trending():
    """
    GET /api/ml/trending
    Returns most popular (most ordered) items.
    """
    recommender.load_and_train()
    trending = recommender.get_popular_items(top_n=6)
    return jsonify(trending)

@ml_bp.route('/predict-sales', methods=['POST'])
def predict_sales():
    """
    POST /api/ml/predict-sales
    Body: { "weather": "Hot", "temperature": 35, "weekend": "Yes", "occasion": "Eid" }
    Returns sales demand forecast, expected quantities, and stock recommendations.
    """
    data = request.get_json() or {}
    weather = data.get('weather', 'Mild')
    temperature = data.get('temperature', 25)
    weekend = data.get('weekend', 'No')
    occasion = data.get('occasion', 'None')
    
    products = get_db_products()
    if not products:
        return jsonify({"error": "No products found in database to perform prediction"}), 404
        
    predictions = predictor.predict_best_selling_food(
        weather=weather,
        temperature=temperature,
        weekend=weekend,
        occasion=occasion,
        products_list=products
    )
    
    return jsonify({
        "weather": weather,
        "temperature": temperature,
        "weekend": weekend,
        "occasion": occasion,
        "predictions": predictions
    })
