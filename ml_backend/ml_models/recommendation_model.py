import os
import re
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def get_mongo_uri():
    """Reads the MONGO_URI from the backend environment file."""
    # Try parent directory .env (Node backend)
    env_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backend', '.env'),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'),
        '.env'
    ]
    
    for path in env_paths:
        if os.path.exists(path):
            try:
                with open(path, 'r') as f:
                    for line in f:
                        if line.startswith('MONGO_URI='):
                            return line.strip().split('MONGO_URI=')[1].strip()
            except Exception as e:
                print(f"Error reading env file {path}: {e}")
                
    # Fallback to system env
    return os.environ.get('MONGO_URI', 'mongodb://localhost:27017/restaurant')

class FoodRecommender:
    def __init__(self):
        self.products_df = None
        self.similarity_matrix = None
        self.popularity_map = {}
        self.mongo_uri = get_mongo_uri()
        self.db = None
        
    def connect_db(self):
        """Connects to MongoDB and initializes database instance."""
        try:
            from urllib.parse import urlparse
            client = MongoClient(self.mongo_uri)
            # Parse DB name from URI (usually /dbname?options or last segment)
            db_name = 'restaurant'
            parsed = urlparse(self.mongo_uri)
            parsed_path = parsed.path.strip('/')
            if parsed_path:
                db_name = parsed_path
            self.db = client[db_name]
            print(f"Recommender connected to MongoDB database: '{db_name}'")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            self.db = None

    def load_and_train(self):
        """Fetches product and order data from MongoDB, trains the recommendation engine."""
        if self.db is None:
            self.connect_db()
            
        if self.db is None:
            print("Database connection offline. Recommender cannot load/train.")
            return False
            
        try:
            # 1. Fetch products
            products_col = self.db['products']
            products_list = list(products_col.find({}, {'_id': 0}))
            
            if not products_list:
                print("No products found in MongoDB to train recommender.")
                return False
                
            self.products_df = pd.DataFrame(products_list)
            
            # Ensure required columns exist
            for col in ['id', 'name', 'category', 'description']:
                if col not in self.products_df.columns:
                    self.products_df[col] = ''
            
            # 2. Fetch orders to build popularity map
            orders_col = self.db['orders']
            orders_list = list(orders_col.find({}, {'items': 1}))
            
            self.popularity_map = {}
            for order in orders_list:
                items = order.get('items', [])
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            prod_id = item.get('id')
                            qty = item.get('quantity', 1)
                            if prod_id is not None:
                                try:
                                    prod_id = int(prod_id)
                                    self.popularity_map[prod_id] = self.popularity_map.get(prod_id, 0) + int(qty)
                                except (ValueError, TypeError):
                                    pass
                                    
            # 3. Preprocess text features for Content-Based Filtering
            # Features: Product name, Category, Description
            self.products_df['combined_features'] = (
                self.products_df['name'].fillna('') + " " + 
                self.products_df['category'].fillna('') + " " + 
                self.products_df['description'].fillna('')
            )
            self.products_df['combined_features'] = self.products_df['combined_features'].str.lower()
            
            # 4. CountVectorizer + Cosine Similarity
            vectorizer = CountVectorizer(stop_words='english')
            count_matrix = vectorizer.fit_transform(self.products_df['combined_features'])
            self.similarity_matrix = cosine_similarity(count_matrix, count_matrix)
            
            print(f"Content-Based Recommender trained successfully with {len(self.products_df)} products.")
            return True
        except Exception as e:
            print(f"Error training recommendation model: {e}")
            return False

    def recommend_food(self, food_name, top_n=5):
        """
        Recommends top_n similar food items matching food_name.
        Integrates content-based scores with popularity scores.
        """
        # If model is not trained, try to load and train
        if self.products_df is None or self.similarity_matrix is None:
            success = self.load_and_train()
            if not success or self.products_df is None:
                return []
                
        # Handle case-insensitive query search
        query = food_name.strip().lower()
        if not query:
            # If search query is empty, return popular items overall
            return self.get_popular_items(top_n)
            
        # Find matches where product name contains the query substring
        matches = self.products_df[self.products_df['name'].str.lower().str.contains(query, regex=False)]
        
        if matches.empty:
            # Try matching by category if product name yields no results
            matches = self.products_df[self.products_df['category'].str.lower().str.contains(query, regex=False)]
            
        if matches.empty:
            # Fallback if nothing matches: return popular items
            print(f"No similarity match for '{food_name}'. Returning popular items.")
            return self.get_popular_items(top_n)
            
        # Pick the first match as the reference product for similarity
        ref_idx = matches.index[0]
        ref_id = self.products_df.iloc[ref_idx]['id']
        ref_name = self.products_df.iloc[ref_idx]['name']
        
        # Calculate similarity scores for this product index
        sim_scores = list(enumerate(self.similarity_matrix[ref_idx]))
        
        # We want to combine similarity score with popularity boost
        # Normalize popularity map values to [0, 1] range to make scores comparable
        max_orders = max(self.popularity_map.values()) if self.popularity_map else 0
        
        scored_products = []
        for idx, sim_score in sim_scores:
            # Skip the query product itself
            if idx == ref_idx:
                continue
                
            prod_row = self.products_df.iloc[idx]
            prod_id = int(prod_row['id'])
            
            # Popularity score calculation
            orders_count = self.popularity_map.get(prod_id, 0)
            norm_popularity = orders_count / max_orders if max_orders > 0 else 0.0
            
            # Combine content similarity (75%) and popularity (25%)
            final_score = (sim_score * 0.75) + (norm_popularity * 0.25)
            
            scored_products.append({
                'index': idx,
                'product': prod_row.to_dict(),
                'similarity_score': float(sim_score),
                'popularity_score': orders_count,
                'final_score': float(final_score)
            })
            
        # Sort by final score in descending order
        scored_products.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Return top N products
        recommendations = [item['product'] for item in scored_products[:top_n]]
        
        # If we need to serialize back to clean JSON, convert np data types to standard python types
        for rec in recommendations:
            for key in ['id', 'price']:
                if key in rec:
                    rec[key] = int(rec[key])
                    
        return recommendations

    def get_popular_items(self, top_n=5):
        """Returns the most ordered items (trending foods) in descending order of orders."""
        if self.products_df is None:
            self.load_and_train()
            if self.products_df is None:
                return []
                
        # Sort products based on order quantities in popularity map
        products_copy = self.products_df.copy()
        products_copy['popularity'] = products_copy['id'].apply(lambda x: self.popularity_map.get(int(x), 0))
        
        # Add a baseline of static high scores for typical crowd-favorites if no orders exist yet
        # e.g., Burgers, Pizzas, Biryani, Chai, Soft Drinks
        favorites = ["classic cheeseburger", "zinger stack", "bbq pizza medium", "chicken wings (10pcs)", "fresh strawberry lemonade", "mango lassi"]
        def get_baseline_boost(row):
            name = str(row['name']).lower()
            boost = 0
            for fav in favorites:
                if fav in name:
                    boost += 5
            return boost
            
        products_copy['popularity'] += products_copy.apply(get_baseline_boost, axis=1)
        
        # Sort by popularity
        popular_df = products_copy.sort_values(by='popularity', ascending=False)
        popular_list = popular_df.head(top_n).to_dict(orient='records')
        
        # Clean data types
        for item in popular_list:
            for key in ['id', 'price']:
                if key in item:
                    item[key] = int(item[key])
            if 'combined_features' in item:
                del item['combined_features']
            if 'popularity' in item:
                del item['popularity']
                
        return popular_list
