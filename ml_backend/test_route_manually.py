import sys
import os
from flask import Flask

# Add path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.ml_routes import get_recommendations, recommender
from app import app

def test_manual():
    print("--- Running manual route test ---")
    print("recommender.db is:", recommender.db)
    print("recommender.products_df is:", recommender.products_df)
    
    with app.test_request_context('/api/ml/recommendations?query=burger'):
        print("Calling get_recommendations()...")
        res = get_recommendations()
        print("Response data:")
        print(res.get_data(as_text=True))
        
    print("recommender.db after test is:", recommender.db)
    print("recommender.products_df after test is:", "Not None" if recommender.products_df is not None else "None")
    if recommender.products_df is not None:
        print("DataFrame shape:", recommender.products_df.shape)

if __name__ == '__main__':
    test_manual()
