#  GourmetGo — Full-Stack Food Ordering Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Flask-Python_ML-000000?logo=flask&logoColor=white" alt="Flask ML" />
  <img src="https://img.shields.io/badge/scikit--learn-RandomForest-F7931E?logo=scikitlearn&logoColor=white" alt="scikit-learn" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

A production-grade, ML-powered food ordering platform serving Pakistani cuisine. GourmetGo features real-time food recommendations, demand forecasting, role-based access control, and comprehensive property-based testing — built as an Advanced Database Systems project demonstrating full-stack architecture with intelligent automation.

---

##  Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [ML Models & Automation](#-ml-models--automation)
- [Tech Stack](#-tech-stack)
- [Database Design](#-database-design)
- [API Documentation](#-api-documentation)
- [Security & Validation](#-security--validation)
- [Testing Strategy](#-testing-strategy)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Production Considerations](#-production-considerations)

---

##  Features

### Customer Features
-  **Smart Cart Management** — Add/remove items, quantity controls, persistent across sessions
-  **Intelligent Search** — Real-time case-insensitive filtering with ML-powered recommendations
-  **Category Browsing** — Filter by Fast Food, BBQ, Desi, Special Dishes, Drinks, Ice Cream, Salad
-  **Order Tracking** — Real-time status updates (Pending → Preparing → Out for Delivery → Delivered)
-  **Wishlist** — Save favorite dishes for later with MongoDB persistence
-  **Reviews & Ratings** — 1-5 star rating system with validated submissions
-  **AI Recommendations** — Content-based + popularity hybrid scoring (75/25 split)
-  **Trending Foods** — ML-powered popularity engine on homepage
-  **Responsive Design** — Optimized for desktop, tablet, and mobile

### Admin Features
-  **Dashboard** — Centralized management with tabbed interface
-  **Product CRUD** — Full catalog management with validation
-  **Order Management** — Status workflow with visual badges
-  **Message Center** — Customer inquiries with timestamps
-  **ML Demand Forecasting** — RandomForest predictions based on weather, temperature, weekend, occasions
-  **Stock Alerts** — Automatic high-demand warnings (threshold: 35+ expected sales)

---

##  Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│   React 19 SPA • Vite • State-based Routing • lucide-react      │
├─────────────────────────────────────────────────────────────────┤
│                         ↕ HTTP/REST                             │
├──────────────────────────┬──────────────────────────────────────┤
│   EXPRESS API             │    FLASK ML SERVICE                 │
│   • Auth Routes           │    • Recommendation Engine          │
│   • Product CRUD          │    • Trending Algorithm             │
│   • Order Management      │    • Sales Predictor (RandomForest) │
│   • User Sync (Cart/WL)   │    • Demand Classification          │
│   • Reviews & Messages    │    • Stock Recommendations          │
│   • Admin Middleware      │                                     │
├──────────────────────────┴──────────────────────────────────────┤
│                    MongoDB Atlas (Cloud)                        │
│   Collections: users, products, orders, reviews, messages       │
└────────────────────────────────────────────────────────────────┘
```

### Communication Flow
1. **Frontend ↔ Express API** — All CRUD operations via REST 
2. **Frontend ↔ ML Service** — Recommendations, trending, predictions 
3. **ML Service ↔ MongoDB** — Direct PyMongo reads for model training
4. **Express ↔ MongoDB** — Mongoose ODM for all data persistence

---

##  ML Models & Automation

### 1. Content-Based Food Recommender

| Component | Implementation |
|-----------|---------------|
| **Algorithm** | Cosine Similarity + Popularity Boost |
| **Features** | Combined text: `name + category + description` |
| **Vectorizer** | CountVectorizer (stop_words='english') |
| **Scoring** | `final_score = 0.75 × similarity + 0.25 × popularity` |
| **Popularity Source** | Order frequency from MongoDB orders collection |
| **Retraining** | Per-request (always uses latest data) |
| **Output** | Top 5 similar products for any query |

**How it works:**
1. Fetches all products and orders from MongoDB
2. Creates a combined feature string for each product
3. Builds a cosine similarity matrix using CountVectorizer
4. Calculates order frequency as popularity metric
5. When queried, finds the reference product and scores all others
6. Returns top 5 by hybrid score (75% content + 25% popularity)

### 2. Trending Foods Engine

| Component | Implementation |
|-----------|---------------|
| **Algorithm** | Order frequency ranking with baseline boosts |
| **Fallback** | Crowd-favorite boosts for cold-start (burgers, biryani, pizza) |
| **Output** | Top 6 most-ordered products |
| **Update** | Retrains on every request for real-time trends |

### 3. Sales Demand Predictor (RandomForest)

| Component | Implementation |
|-----------|---------------|
| **Algorithm** | RandomForestRegressor (n_estimators=100) |
| **Features** | weather, temperature, weekend, occasion, product_name |
| **Encoding** | LabelEncoder for categorical features |
| **Training Data** | Synthetic historical dataset (120 days × all products) |
| **Output** | Per-product: expected_sales, demand_level, stock_recommendation |

**Demand Classification:**
| Expected Sales | Level | Action |
|---------------|-------|--------|
| ≥ 35 |  High Demand | Prepare 50% additional stock |
| 20–34 |  Moderate Demand | Maintain current stock levels |
| < 20 |  Low Demand | Consider reducing preparation |

**Automation:**
- Models initialize on server startup
- Sales predictor auto-generates synthetic training data if none exists
- Recommender retrains per-request for real-time accuracy
- Stock alerts automatically flag high-demand items in admin dashboard

---

##  Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2 |
| Build Tool | Vite | 8.0 |
| Backend API | Express | 5.2 |
| Runtime | Node.js | Latest LTS |
| Database | MongoDB Atlas | Cloud |
| ODM | Mongoose | 9.5 |
| ML Framework | scikit-learn | Latest |
| ML Server | Flask | 3.x |
| ML Data | Pandas + NumPy | Latest |
| Icons | lucide-react | 1.8 |
| Testing | Vitest + fast-check | Latest |
| Styling | Custom CSS Variables | — |

---

##  Database Design

### Entity Relationship

```
USER ──┬── places ──→ ORDER ──── contains ──→ PRODUCT
       ├── writes ──→ REVIEW
       ├── sends ───→ MESSAGE
       ├── cart ────→ [PRODUCT] (embedded array)
       └── wishlist → [PRODUCT] (embedded array)
```

### Collections Schema

**Users**
```javascript
{ name, email (unique, regex), password (min 6), cart[], wishlist[], isAdmin, timestamps }
```

**Products**
```javascript
{ id (unique numeric), name, price (PKR), category, image (URL), description }
```

**Orders**
```javascript
{ userId (ref), customerName, items[], totalAmount, deliveryAddress, status (enum), timestamps }
```

**Reviews**
```javascript
{ name, comment (max 500), rating (1-5), image, date, verified, timestamps }
```

**Messages**
```javascript
{ name, email, subject, message, isRead, timestamps }
```

---

##  API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Authenticate user |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Public | List all products (sorted by ID) |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | User | Place order (server calculates total) |
| GET | `/api/orders` | Admin | List all orders |
| GET | `/api/orders/user/:userId` | User | User's order history |
| PUT | `/api/orders/:id/status` | Admin | Update order status |

### User Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/users/:id/cart` | Sync cart to server |
| PUT | `/api/users/:id/wishlist` | Sync wishlist to server |

### Reviews & Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/reviews` | List/create reviews |
| GET/POST | `/api/messages` | List (admin)/create messages |

### ML Service (Port 5001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ml/recommendations?query=X` | Get up to 5 similar products |
| GET | `/api/ml/trending` | Get top 6 trending foods |
| POST | `/api/ml/predict-sales` | Forecast demand by conditions |

---

##  Security & Validation

### Backend Validation
- **Registration**: Name (1-50 chars), email regex, password (6-128 chars)
- **Products**: All 6 fields required, 404 for non-existent IDs
- **Orders**: Server-side total calculation (prevents price manipulation)
- **Reviews**: Rating integer 1-5, comment max 500 chars
- **Messages**: All fields validated with length constraints
- **Cart**: Quantity ≥ 1 enforcement

### Admin Authorization
- `requireAdmin` middleware validates `x-user-id` header
- Looks up user in DB, checks `isAdmin` flag
- Returns 403 "Access Denied" for unauthorized requests
- Applied to: product CRUD, all orders list, messages list

### Frontend Validation
- Client-side form validation before API calls
- Per-field error messages with visual indicators
- Network error handling with user-friendly messages
- Auth modal gate for cart/wishlist/review actions

---

##  Testing Strategy

### Property-Based Testing (32 Correctness Properties)

Using **fast-check** for property-based testing — generates hundreds of random inputs to verify universal invariants:

| Category | Properties | Examples |
|----------|-----------|----------|
| Authentication | P1-P4 | Registration round-trip, duplicate rejection, credential security |
| Product Catalog | P5-P7 | Sort ordering, category filter, search correctness |
| Cart Management | P8-P12 | Add idempotency, quantity bounds, removal, badge count |
| Order Lifecycle | P13-P18 | Total calculation, creation completeness, status invariant |
| Product CRUD | P19-P20 | Round-trip persistence, missing field rejection |
| ML Recommendations | P21-P23 | Count bounds, score formula, trending sort |
| ML Predictions | P24-P25 | Coverage guarantee, demand classification |
| Reviews/Wishlist | P26-P29 | Validation, sort order, toggle idempotency |
| Admin/Display | P30-P32 | Message validation, access control, ID format |

### Running Tests
```bash
# Frontend tests (React + cart logic)
cd project
npx vitest run

# Backend tests (API logic + ML properties)
cd backend
npx vitest run
```

---

##  Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# Clone the repository
git clone https://github.com/ks-exe/GourmetGo-Full-Stack-Food-Ordering-Platform.git
cd GourmetGo-Full-Stack-Food-Ordering-Platform

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install ML dependencies
pip install pymongo flask flask-cors scikit-learn pandas numpy joblib
```

### Configuration

Create `backend/.env`:
```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
```

### Running the Application

Open 3 terminal windows:

```bash
# Terminal 1 — Frontend (React + Vite)
npm run dev
# → http://localhost:5173

# Terminal 2 — Backend API (Express)
cd backend
node server.js
# → http://localhost:5000

# Terminal 3 — ML Backend (Flask)
cd ml_backend
python app.py
# → http://localhost:5001
```

### Seeding the Database

```bash
cd backend
node seed.js
```

---

##  Project Structure

```
├── src/                          # React Frontend
│   ├── components/               # Reusable UI components
│   │   ├── AuthModal.jsx         # Login/Signup with validation
│   │   ├── CartItem.jsx          # Cart item row
│   │   ├── CategoryFilter.jsx    # Category pills
│   │   ├── Navbar.jsx            # Navigation + search + badges
│   │   ├── Notification.jsx      # Toast notifications
│   │   └── ProductCard.jsx       # Product display card
│   ├── pages/                    # Page components
│   │   ├── Home.jsx              # Hero + trending foods
│   │   ├── Menu.jsx              # Catalog + filters + ML recommendations
│   │   ├── CartPage.jsx          # Cart + checkout
│   │   ├── Profile.jsx           # User profile + order history
│   │   ├── AdminDashboard.jsx    # Admin panel (4 tabs)
│   │   ├── Reviews.jsx           # Review list + submission
│   │   ├── Wishlist.jsx          # Saved items
│   │   ├── Contact.jsx           # Contact form
│   │   └── About.jsx             # About page
│   ├── tests/                    # Frontend property tests
│   ├── App.jsx                   # Root component + state management
│   └── main.jsx                  # Entry point
├── backend/                      # Express API
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── Message.js
│   ├── tests/                    # Backend property tests
│   ├── server.js                 # API routes + middleware
│   ├── seed.js                   # Database seeder
│   └── .env                      # Environment variables
├── ml_backend/                   # Flask ML Service
│   ├── ml_models/
│   │   ├── recommendation_model.py   # Content-based recommender
│   │   └── sales_prediction_model.py # RandomForest predictor
│   ├── routes/
│   │   └── ml_routes.py          # ML API endpoints
│   ├── datasets/
│   │   └── historical_sales.csv  # Auto-generated training data
│   └── app.py                    # Flask entry point
├── public/                       # Static assets
├── .kiro/specs/                  # Spec-driven development docs
├── vitest.config.js              # Frontend test config
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

---

##  Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `MONGO_URI` | `backend/.env` | MongoDB Atlas connection string |
| `PORT` | `backend/.env` | Express server port (default: 5000) |

---

##  Production Considerations

### What Makes This Production-Grade

1. **Server-Side Validation** — All inputs validated on both client and server; server never trusts client data
2. **Server-Side Total Calculation** — Prevents price manipulation attacks; delivery fee computed server-side
3. **Role-Based Access Control** — Admin middleware protects sensitive endpoints with DB lookup
4. **Error Handling** — Consistent error responses (400/401/403/404/500) with descriptive messages
5. **Data Persistence** — Cart/wishlist synced to MongoDB for authenticated users; localStorage fallback for guests
6. **ML Model Automation** — Models auto-initialize on startup, retrain per-request for accuracy
7. **Property-Based Testing** — 32 correctness properties verified with 100+ random iterations each
8. **Input Sanitization** — Length constraints, format validation, type checking on all user inputs
9. **Responsive Design** — Desktop, tablet, and mobile layouts
10. **Graceful Degradation** — App works without ML service; error states with retry for network failures

### What Would Be Added for Full Production

- JWT/OAuth token-based authentication (currently plain text password comparison)
- Password hashing (bcrypt)
- Rate limiting on API endpoints
- HTTPS enforcement
- Image upload to cloud storage (currently URLs only)
- Payment gateway integration
- Email notifications for order status changes
- WebSocket for real-time order tracking
- CI/CD pipeline with automated test runs
- Docker containerization
- Load balancing for horizontal scaling

---

##  Authors

Built as an **Advanced Database Systems** project demonstrating:
- Full-stack web development with modern frameworks
- NoSQL database design with MongoDB Atlas
- Machine Learning integration for business intelligence
- Property-based testing methodology for software correctness
- Spec-driven development workflow

---

##  License

This project is for educational purposes as part of an Advanced Database Systems course.
