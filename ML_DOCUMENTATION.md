# GourmetGo — Machine Learning Documentation

**Project:** GourmetGo Restaurant Web App  
**ML Backend:** Flask (Python) — Port `5001`  
**Last Updated:** June 2026

---

## Overview

GourmetGo uses a **3-tier architecture** for ML features:

| Layer | Technology | Port |
|-------|------------|------|
| Frontend | React + Vite | `5173` (or next available) |
| API Backend | Node.js + Express | `5000` |
| ML Microservice | Flask + scikit-learn | `5001` |
| Database | MongoDB Atlas | — |

All ML logic lives in `ml_backend/`. The React frontend calls the ML server directly on port `5001`.

---

## Implemented ML Features (Status: ✅ Complete)

| # | Feature | Algorithm | User-facing location | API Endpoint |
|---|---------|-----------|---------------------|--------------|
| 1 | **Smart Food Recommendations** | Content-Based Filtering (CountVectorizer + Cosine Similarity) + Popularity boost | Menu page — search bar | `GET /api/ml/recommendations?query=burger` |
| 2 | **Trending / Popular Items** | Order-history popularity ranking + baseline heuristics | Home page — "Trending Flavors" section | `GET /api/ml/trending` |
| 3 | **Sales Demand Prediction (Best Selling)** | RandomForest Regressor (100 trees) | Admin Dashboard — "ML Demand Predictions" tab | `POST /api/ml/predict-sales` |

---

## Feature 1: Smart Food Recommendations

### How it works

1. **Data source:** MongoDB `products` and `orders` collections.
2. **Text processing:** Product `name`, `category`, and `description` are combined into one text field.
3. **Vectorization:** scikit-learn `CountVectorizer` converts text to numeric vectors.
4. **Similarity:** `cosine_similarity` computes how similar each product is to the search query match.
5. **Popularity boost:** Real order quantities from MongoDB are blended into the final score:
   - **75%** content similarity
   - **25%** normalized popularity (order count)
6. **Fallback:** If no match is found, popular/trending items are returned instead.

### User experience

- Go to **Menu** page.
- Type at least **2 characters** in the search box (e.g. `burger`, `pizza`, `chai`).
- A **"Smart AI recommendations"** section appears below the menu with 5 related dishes.

### Code location

- Model: `ml_backend/ml_models/recommendation_model.py` → `FoodRecommender.recommend_food()`
- Route: `ml_backend/routes/ml_routes.py` → `/recommendations`
- Frontend: `src/pages/Menu.jsx`

---

## Feature 2: Trending / Popular Items

### How it works

1. Loads all products from MongoDB.
2. Counts total ordered quantity per product from the `orders` collection.
3. Adds a **baseline boost** for crowd favorites when order data is sparse (e.g. Classic Cheeseburger, Zinger Stack).
4. Returns top **6** items sorted by popularity.

### User experience

- Open the **Home** page.
- Scroll to the **"Trending Flavors"** section — shows 6 popular dishes automatically.

### Code location

- Model: `ml_backend/ml_models/recommendation_model.py` → `FoodRecommender.get_popular_items()`
- Route: `ml_backend/routes/ml_routes.py` → `/trending`
- Frontend: `src/pages/Home.jsx`

---

## Feature 3: Sales Demand Prediction (Best Selling Forecast)

### How it works

1. **Training data:** A synthetic 120-day historical dataset (`ml_backend/datasets/historical_sales.csv`) is generated using business rules:
   - Hot weather → Drinks & Ice Cream sales increase
   - Cold weather → BBQ, Desi, Special Dishes increase
   - Weekends → Fast Food & Drinks spike
   - Occasions (Eid, Diwali, New Year) → category-specific boosts
2. **Model:** `RandomForestRegressor` with 100 trees trained on:
   - `weather`, `temperature`, `weekend`, `occasion`, `product_name`, `previous_sales`
   - Target: `predicted_sales` (expected quantity)
3. **Inference:** Admin selects conditions → model predicts expected sales for **all products**.
4. **Ranking:** Results sorted by `expected_sales` descending = **best-selling forecast**.
5. **Demand levels:**
   - `≥ 35 units` → **High Demand** (stock alert)
   - `20–34 units` → **Medium Demand**
   - `< 20 units` → **Low Demand**

### Important note

Training data is **synthetically generated** (rule-based simulation), not pulled from live order history. Predictions reflect realistic patterns but are **demonstration forecasts**, not exact real-world sales.

### Code location

- Model: `ml_backend/ml_models/sales_prediction_model.py` → `SalesPredictor`
- Route: `ml_backend/routes/ml_routes.py` → `/predict-sales`
- Frontend: `src/pages/AdminDashboard.jsx`

---

## Admin: How to View Best Selling / Demand Predictions

### Step-by-step

1. **Login** with admin account:
   - Email: `gullylaila509@gmail.com` (auto-assigned `isAdmin = true` on signup/login)
2. Navigate to **Admin Dashboard** from the navbar.
3. Click the **"ML Demand Predictions"** tab (TrendingUp icon).
4. Configure prediction conditions:
   - **Weather:** Hot / Cold / Rainy / Mild
   - **Temperature:** Auto-suggested based on weather
   - **Weekend:** Yes / No
   - **Occasion:** Eid / Diwali / New Year / None
5. Click **"Predict Sales Demand"** (or predictions load automatically when tab opens).

### What admin sees

| UI Element | Description |
|------------|-------------|
| **High Demand Alert Banner** | Red alert for items with `expected_sales ≥ 35` |
| **Bar Chart** | Top 8 products by predicted sales (SVG chart) |
| **Full Table** | All products ranked by expected sales — best sellers at top |
| **Columns** | Dish name, Expected Sales, Demand Level, Stock Recommendation |

**Best selling items appear at the top of the table** — highest `expected_sales` first.

Example: On a Hot + Weekend + Eid scenario, Drinks and BBQ items typically rank highest.

---

## How to Run the Project

### Prerequisites

- Node.js
- Python 3
- MongoDB Atlas connection (configured in `backend/.env`)

### Step 1 — Install dependencies

```powershell
# Frontend
cd c:\projects\web\project
npm install

# Node Backend
cd c:\projects\web\project\backend
npm install

# ML Backend
cd c:\projects\web\project\ml_backend
pip install -r requirements.txt
```

### Step 2 — Seed database (optional, 70+ products)

```powershell
cd c:\projects\web\project\backend
node seed.js
```

### Step 3 — Start all three servers (3 separate terminals)

```powershell
# Terminal 1 — Node API (port 5000)
cd c:\projects\web\project\backend
npm start

# Terminal 2 — ML Server (port 5001)
cd c:\projects\web\project\ml_backend
python app.py

# Terminal 3 — React Frontend (port 5173)
cd c:\projects\web\project
npm run dev
```

### Step 4 — Open in browser

- App: `http://localhost:5173` (or port shown by Vite)
- ML API docs: `http://localhost:5001`
- ML health check: `http://localhost:5001/status`

---

## Running Tests

```powershell
cd c:\projects\web\project\ml_backend
python test_ml_endpoints.py
```

### Expected results (all should return HTTP 200)

| Test | Endpoint | Expected |
|------|----------|----------|
| Health check | `GET /status` | `status: "online"` |
| Recommendations | `GET /api/ml/recommendations?query=burger` | 5 product objects |
| Trending | `GET /api/ml/trending` | 6 product objects |
| Sales prediction | `POST /api/ml/predict-sales` | 73 predictions sorted by sales |

---

## API Reference

### GET `/api/ml/recommendations?query=<text>`

Returns 5 similar food items based on search query.

### GET `/api/ml/trending`

Returns 6 most popular/trending food items.

### POST `/api/ml/predict-sales`

**Body:**
```json
{
  "weather": "Hot",
  "temperature": 38,
  "weekend": "Yes",
  "occasion": "Eid"
}
```

**Response:**
```json
{
  "weather": "Hot",
  "temperature": 38,
  "weekend": "Yes",
  "occasion": "Eid",
  "predictions": [
    {
      "id": 27,
      "name": "Peach Iced Tea",
      "category": "Drinks",
      "expected_sales": 41,
      "demand_level": "High Demand",
      "stock_recommendation": "Increase stock by 50% (High Demand alert)",
      "alert": true
    }
  ]
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Port 5173)                 │
│  Home.jsx ──► Trending    Menu.jsx ──► Recommendations │
│  AdminDashboard.jsx ──► Sales Predictions                │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP calls to :5001
┌────────────────────────▼────────────────────────────────┐
│           Flask ML Backend (Port 5001)                  │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  FoodRecommender    │  │  SalesPredictor          │  │
│  │  CountVectorizer    │  │  RandomForestRegressor     │  │
│  │  Cosine Similarity  │  │  LabelEncoder            │  │
│  └──────────┬──────────┘  └────────────┬─────────────┘  │
└─────────────┼──────────────────────────┼────────────────┘
              │                          │
┌─────────────▼──────────────────────────▼────────────────┐
│                    MongoDB Atlas                          │
│         collections: products, orders, users              │
└───────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           Node.js API (Port 5000)                       │
│   Products CRUD, Orders, Auth, Messages                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼ MongoDB Atlas
```

---

## File Index

| File | Purpose |
|------|---------|
| `ml_backend/app.py` | Flask entry point, model initialization |
| `ml_backend/routes/ml_routes.py` | All ML API routes |
| `ml_backend/ml_models/recommendation_model.py` | Content-based recommender + trending |
| `ml_backend/ml_models/sales_prediction_model.py` | RandomForest sales predictor |
| `ml_backend/datasets/historical_sales.csv` | Synthetic training dataset |
| `ml_backend/test_ml_endpoints.py` | Integration test script |
| `src/pages/Home.jsx` | Trending flavors UI |
| `src/pages/Menu.jsx` | AI recommendations UI |
| `src/pages/AdminDashboard.jsx` | Admin ML demand predictions UI |

---

## Known Limitations

1. **Synthetic training data** — Sales predictions use generated data, not live order history.
2. **ML server required** — Home trending, Menu recommendations, and Admin predictions fail if Flask on port 5001 is not running.
3. **Retrain on API calls** — Recommender retrains on every recommendations/trending request (works but slower on large datasets).
4. **Admin access** — Only `gullylaila509@gmail.com` gets admin rights automatically.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: flask` | Run `pip install -r requirements.txt` in `ml_backend/` |
| Admin predictions show error | Ensure ML server is running on port 5001 |
| Empty trending/recommendations | Check MongoDB connection in `backend/.env` |
| `404 No products found` | Run `node seed.js` to populate products |
| Port already in use | Kill existing process or use different port |
