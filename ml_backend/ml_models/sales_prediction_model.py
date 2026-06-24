import os
import random
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib

class SalesPredictor:
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.dataset_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            'datasets', 
            'historical_sales.csv'
        )
        self.model_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            'sales_model.joblib'
        )
        self.encoders_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            'label_encoders.joblib'
        )

    def generate_sample_dataset(self, products_list):
        """Generates a realistic synthetic historical sales dataset based on current products."""
        print("Generating synthetic historical sales dataset...")
        
        os.makedirs(os.path.dirname(self.dataset_path), exist_ok=True)
        
        weathers = ['Hot', 'Cold', 'Rainy', 'Mild']
        weekends = ['Yes', 'No']
        occasions = ['Eid', 'Diwali', 'New Year', 'None']
        
        data = []
        
        # Generate sales records for the past 120 days for each product
        for day in range(1, 121):
            weather = random.choice(weathers)
            weekend = 'Yes' if day % 7 in [5, 6] else 'No' # Friday/Saturday or Saturday/Sunday
            
            # Occasions
            if day in [15, 45, 90]:
                occasion = 'Eid'
            elif day in [30, 105]:
                occasion = 'Diwali'
            elif day in [1, 120]:
                occasion = 'New Year'
            else:
                occasion = 'None'
                
            # Assign temperature based on weather
            if weather == 'Hot':
                temperature = random.randint(32, 45)
            elif weather == 'Cold':
                temperature = random.randint(8, 18)
            elif weather == 'Rainy':
                temperature = random.randint(18, 26)
            else:
                temperature = random.randint(20, 30)
                
            for product in products_list:
                name = product.get('name')
                category = product.get('category')
                
                # Base sales quantity
                base_sales = random.randint(10, 20)
                
                # Apply rules based on Weather
                if category == 'Drinks' or category == 'Ice Cream':
                    if weather == 'Hot':
                        base_sales += random.randint(15, 30)
                    elif weather == 'Cold':
                        base_sales -= random.randint(8, 12)
                elif category == 'Special Dishes' or category == 'Desi' or category == 'BBQ':
                    if weather == 'Cold':
                        base_sales += random.randint(10, 25)
                    elif weather == 'Hot':
                        base_sales -= random.randint(3, 8)
                elif category == 'Salad':
                    if weather == 'Hot':
                        base_sales += random.randint(3, 8)
                        
                # Apply rules based on Weekend
                if weekend == 'Yes':
                    if category in ['Fast Food', 'Drinks', 'Ice Cream']:
                        base_sales += random.randint(12, 22)
                    else:
                        base_sales += random.randint(5, 12)
                        
                # Apply rules based on Occasions
                if occasion == 'Eid':
                    if category in ['BBQ', 'Desi', 'Special Dishes']:
                        base_sales += random.randint(25, 45)
                    else:
                        base_sales += random.randint(3, 8)
                elif occasion == 'New Year':
                    if category in ['Fast Food', 'Drinks', 'BBQ']:
                        base_sales += random.randint(18, 30)
                elif occasion == 'Diwali':
                    if category in ['Ice Cream', 'Special Dishes']:
                        base_sales += random.randint(15, 25)
                        
                # Introduce randomness (noise)
                noise = random.randint(-4, 4)
                actual_sales = max(1, base_sales + noise)
                
                # Generate Previous Sales with high correlation
                prev_noise = random.randint(-5, 5)
                prev_sales = max(1, int(actual_sales * random.uniform(0.85, 1.15)) + prev_noise)
                
                data.append({
                    'weather': weather,
                    'temperature': temperature,
                    'weekend': weekend,
                    'occasion': occasion,
                    'product_name': name,
                    'previous_sales': prev_sales,
                    'predicted_sales': actual_sales # This is the historical actual quantity
                })
                
        df = pd.DataFrame(data)
        df.to_csv(self.dataset_path, index=False)
        print(f"Historical sales dataset successfully created at {self.dataset_path} with {len(df)} rows.")
        return df

    def train_model(self, products_list):
        """Loads dataset (generates if not exists), performs LabelEncoding, train_test_split, and fits RandomForestRegressor."""
        if not os.path.exists(self.dataset_path):
            df = self.generate_sample_dataset(products_list)
        else:
            df = pd.read_csv(self.dataset_path)
            # Ensure the dataset matches the current products (if product names changed)
            dataset_products = set(df['product_name'].unique())
            current_products = set([p.get('name') for p in products_list])
            if not current_products.issubset(dataset_products):
                print("Database products changed. Regenerating historical dataset...")
                df = self.generate_sample_dataset(products_list)

        try:
            # Initialize label encoders
            categorical_cols = ['weather', 'weekend', 'occasion', 'product_name']
            self.encoders = {}
            
            # We copy dataframe for encoding
            encoded_df = df.copy()
            
            for col in categorical_cols:
                le = LabelEncoder()
                encoded_df[col] = le.fit_transform(df[col])
                self.encoders[col] = le
                
            # Define Features X and Target y
            feature_cols = ['weather', 'temperature', 'weekend', 'occasion', 'product_name', 'previous_sales']
            X = encoded_df[feature_cols]
            y = encoded_df['predicted_sales']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Initialize & Fit RandomForest Regressor
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.model.fit(X_train, y_train)
            
            train_score = self.model.score(X_train, y_train)
            test_score = self.model.score(X_test, y_test)
            print(f"Random Forest model trained: Train R2 = {train_score:.4f}, Test R2 = {test_score:.4f}")
            
            # Save model and encoders to disk
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.encoders, self.encoders_path)
            
            return True
        except Exception as e:
            print(f"Error training Sales Prediction model: {e}")
            return False

    def load_model(self):
        """Loads the trained model and encoders from disk."""
        if os.path.exists(self.model_path) and os.path.exists(self.encoders_path):
            try:
                self.model = joblib.load(self.model_path)
                self.encoders = joblib.load(self.encoders_path)
                return True
            except Exception as e:
                print(f"Error loading saved ML model: {e}")
        return False

    def predict_best_selling_food(self, weather, temperature, weekend, occasion, products_list):
        """
        Predicts expected sales and stock recommendations for all products
        under the given weather, temperature, weekend, and occasion conditions.
        """
        # Load or train the model
        if self.model is None or not self.encoders:
            if not self.load_model():
                success = self.train_model(products_list)
                if not success:
                    return []

        predictions = []
        feature_cols = ['weather', 'temperature', 'weekend', 'occasion', 'product_name', 'previous_sales']
        
        try:
            # Retrain once if any new products were added since last training
            prod_le = self.encoders.get('product_name')
            if prod_le is not None:
                current_names = {p.get('name') for p in products_list}
                if not current_names.issubset(set(prod_le.classes_)):
                    print("New products detected. Retraining model...")
                    self.train_model(products_list)
                    prod_le = self.encoders.get('product_name')

            # We must encode the input values.
            # Handle possible unseen classes by matching against encoder classes or defaulting
            def encode_value(encoder_key, val):
                le = self.encoders.get(encoder_key)
                if not le:
                    return 0
                val_str = str(val)
                if val_str in le.classes_:
                    return int(le.transform([val_str])[0])
                return 0

            encoded_weather = encode_value('weather', weather)
            encoded_weekend = encode_value('weekend', weekend)
            encoded_occasion = encode_value('occasion', occasion)
            
            for product in products_list:
                prod_name = product.get('name')
                prod_le = self.encoders.get('product_name')
                if prod_le is not None and prod_name in prod_le.classes_:
                    encoded_prod = int(prod_le.transform([prod_name])[0])
                else:
                    encoded_prod = 0
                
                # Let's estimate a realistic previous_sales based on product price/category
                category = product.get('category')
                prev_sales_est = 20
                if category in ['Drinks', 'Fast Food']:
                    prev_sales_est = 35
                elif category in ['Ice Cream', 'Salad']:
                    prev_sales_est = 18
                elif category in ['BBQ', 'Desi', 'Special Dishes']:
                    prev_sales_est = 25
                    
                features_df = pd.DataFrame([{
                    'weather': encoded_weather,
                    'temperature': int(temperature),
                    'weekend': encoded_weekend,
                    'occasion': encoded_occasion,
                    'product_name': encoded_prod,
                    'previous_sales': prev_sales_est
                }], columns=feature_cols)
                
                predicted_qty = float(self.model.predict(features_df)[0])
                expected_sales = int(round(predicted_qty))
                
                # Define demand level and stock recommendation
                if expected_sales >= 35:
                    demand_level = 'High Demand'
                    stock_rec = 'Increase stock by 50% (High Demand alert)'
                    alert = True
                elif expected_sales >= 20:
                    demand_level = 'Medium Demand'
                    stock_rec = 'Maintain standard stock level'
                    alert = False
                else:
                    demand_level = 'Low Demand'
                    stock_rec = 'Reduce inventory by 30% to avoid food waste'
                    alert = False
                    
                predictions.append({
                    'id': int(product.get('id', 0)),
                    'name': prod_name,
                    'category': category,
                    'price': int(product.get('price', 0)),
                    'image': product.get('image', ''),
                    'description': product.get('description', ''),
                    'expected_sales': expected_sales,
                    'demand_level': demand_level,
                    'stock_recommendation': stock_rec,
                    'alert': alert
                })
                
            # Sort by expected sales descending
            predictions.sort(key=lambda x: x['expected_sales'], reverse=True)
            return predictions
        except Exception as e:
            print(f"Error predicting sales: {e}")
            return []
