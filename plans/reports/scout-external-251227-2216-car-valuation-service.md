# Car Valuation Service - Architecture & Structure Report

**Generated:** 2025-12-27  
**Location:** `/Users/khoa2807/development/carmarket3/CarMarket-master/car-valuation-service`

---

## 1. OVERVIEW

Car Valuation Service la microservice ML-based cho pricing o to. Dung API de predict gia xe dua vao thong tin dau vao.

**Tech Stack:**
- Python 3.11
- FastAPI (web framework)
- scikit-learn (ML models)
- pandas, numpy (data processing)
- Docker (deployment)
- uvicorn (ASGI server)

---

## 2. DIRECTORY STRUCTURE

```
car-valuation-service/
├── service/
│   └── main.py              # FastAPI app - API endpoints
├── models/
│   ├── car_price_predictor.pkl  # ML model (31MB)
│   ├── label_encoders.pkl       # Categorical encoders
│   ├── feature_columns.pkl      # Feature list
│   └── model_metrics.pkl        # MAE, R2 scores
├── scraping/
│   ├── scrape_bonbanh.py        # BonBanh scraper
│   ├── scrape_oto.py            # Oto.com.vn scraper
│   ├── scrape_toyota_bonbanh.py # Toyota BonBanh
│   ├── scrape_toyota_chotot.py  # Toyota ChoTot
│   ├── test_chotot.py           # ChoTot test
│   └── test_oto.py              # Oto test
├── data/                        # Training data (not in repo)
├── Dockerfile                   # Docker config
├── render.yaml                  # Render deployment
├── run_service.py               # Service runner
├── train_model.py               # Initial training script
├── retrain_model.py             # Multi-model comparison
├── clean_data.py                # Data cleaning
├── extract_metadata.py          # Metadata extraction
├── test_model_load.py           # Model testing
├── requirements.txt             # Python dependencies
├── metadata.json                # Car metadata (115KB)
└── seed_valuation_metadata.sql  # DB seed (166KB)
```

---

## 3. API ENDPOINTS (`service/main.py`)

### Health Check
- **GET** `/health`
- Returns: `{"status": "ok", "model_loaded": bool, "encoders_loaded": bool}`

### Price Prediction
- **POST** `/predict`
- Request body (CarInput):
  - `brand` (str, required): Hang xe
  - `model` (str, required): Dong xe
  - `year` (int, required): Nam SX (1990-2030)
  - `mileage_km` (int, required): So km da di
  - `version` (str, optional): Phien ban
  - `color` (str, optional): Mau xe
  - `transmission` (str, optional): Hop so (AT/MT)
  - `location` (str, optional): Dia diem

- Response (PricePrediction):
  - `price_estimate` (float): Gia du doan (trieu VND)
  - `price_min` (float): Gia min (trieu VND)
  - `price_max` (float): Gia max (trieu VND)
  - `confidence_level` (str): Do tin cay ("Cao >95%", "Trung binh-Cao", "Trung binh")
  - `mae_estimate` (float): Sai so uoc tinh (trieu VND)

**CORS:** Configurable via `ALLOWED_ORIGINS` env var (default: all)

---

## 4. MACHINE LEARNING MODELS

### Current Model (`models/car_price_predictor.pkl`)
- **Type:** scikit-learn model (RandomForest/GradientBoosting/XGBoost)
- **Size:** ~31MB
- **Features:** `['make', 'model', 'year', 'version', 'color', 'mileage']`
- **Target:** `price_vnd` (trieu VND)

### Model Training Pipeline

**File:** `train_model.py` (initial)
- Uses Ridge Regression with OneHotEncoder
- Features: brand, model, year, mileage_km, transmission, location
- Pipeline: ColumnTransformer -> Ridge(alpha=1.0)

**File:** `retrain_model.py` (multi-model comparison)
- Trains 6 models in parallel:
  - Linear Regression
  - Ridge Regression (alpha=1.0)
  - Lasso Regression (alpha=1.0)
  - RandomForest (100 trees)
  - GradientBoosting (100 estimators)
  - XGBoost (100 estimators) [optional]
- Selects best model based on Test MAE
- Saves encoders, features, metrics

### Model Metrics
- **Test MAE:** ~104 million VND (default fallback)
- **Test R2:** ~0.959 (95.9% variance explained)
- Stored in `models/model_metrics.pkl`

### Feature Encoding
- Categorical features: LabelEncoder (make, model, version, color)
- Numerical features: Keep as-is (year, mileage)
- Encoders stored in `models/label_encoders.pkl`

---

## 5. DATA PIPELINE

### Scraping Scripts

**BonBanh Scraper** (`scraping/scrape_bonbanh.py`)
- Target: bonbanh.com
- Brands: Toyota, VinFast, Honda, Hyundai, Kia, Mazda, Suzuki, BMW, Ford, Mercedes-Benz
- Extracts: price, mileage, location, year, fuel, gearbox, body, color, seats, origin
- Output: CSV with 18 fields
- Pagination support (configurable max pages)

**Oto.com.vn Scraper** (`scraping/scrape_oto.py`)
- Target: oto.com.vn Toyota listings
- Models: 35+ Toyota models (vios, innova, camry, etc.)
- Techniques:
  - Selenium for infinite scroll
  - Direct pagination (/p2, /p3)
  - Fallback to first page
- Extracts from hidden inputs + HTML parsing
- Delay: 2-4 seconds between requests

**Toyota BonBanh** (`scraping/scrape_toyota_bonbanh.py`)
- Toyota-specific BonBanh scraper
- 30+ Toyota model URLs pre-configured
- Uses shared helper functions from `scrape_bonbanh.py`

**Toyota ChoTot** (`scraping/scrape_toyota_chotot.py`)
- Target: xe.chotot.com
- Regions: HCM, Hanoi, Da Nang
- Uses itemprop structured data
- Robots.txt compliant (2-4s delay)

### Data Cleaning (`clean_data.py`)
**Target Brands:** Toyota, VinFast, Honda, Hyundai, Kia, Mazda, Suzuki, BMW, Ford, Mercedes-Benz

**Steps:**
1. Normalize brand/model text
2. Filter to 10 target brands
3. Drop rows missing price or year
4. Convert to numeric types
5. Remove outliers:
   - Price: 5M - 5B VND
   - Mileage: <= 500,000 km
6. Select columns: brand, model, year, mileage_km, transmission, fuel, location, price_vnd
7. Export metadata for dropdowns

**Outputs:**
- `data/car_listings_raw.csv` - Original data
- `data/car_listings_clean.csv` - Cleaned data
- `data/car_listings.csv` - Alias for training
- `metadata/brand_model.csv` - Brand-model listing counts
- `metadata/brand_model_year.csv` - Brand-model-year counts

### Metadata Extraction (`extract_metadata.py`)
**Input:** `data/toyota_cleaned.csv`

**Outputs to `metadata.json`:**
- `makes` - List of all brands
- `make_models` - {make: [models]}
- `model_years` - {make: {model: [years]}}
- `year_versions` - {make: {model: {year: [versions]}}}
- `version_colors` - {make: {model: {year: {version: [colors]}}}}

**Size:** 115KB compressed

---

## 6. DEPLOYMENT

### Docker Configuration (`Dockerfile`)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD uvicorn service.main:app --host 0.0.0.0 --port ${PORT:-8001}
```

### Render Deployment (`render.yaml`)
```yaml
services:
  - type: web
    name: car-valuation-service
    runtime: docker
    envVars:
      - key: PORT
        value: 8001
      - key: ALLOWED_ORIGINS
        value: https://carmarket-six.vercel.app
    healthCheckPath: /health
    plan: free
```

### Service Runner (`run_service.py`)
```python
port = int(os.getenv("PORT", 8001))
host = os.getenv("HOST", "127.0.0.1")
reload = os.getenv("RELOAD", "false").lower() == "true"
uvicorn.run("service.main:app", host=host, port=port, reload=reload)
```

---

## 7. DEPENDENCIES (`requirements.txt`)

```
requests          # HTTP requests (scraping)
beautifulsoup4    # HTML parsing
pandas            # Data manipulation
numpy             # Numerical computing
scikit-learn      # ML models
joblib            # Model serialization
fastapi           # Web framework
uvicorn           # ASGI server
pydantic          # Data validation
```

**Note:** Selenium + webdriver-manager optional for oto.com.vn scraping

---

## 8. KEY PATTERNS & ARCHITECTURE

### Model Loading Pattern
1. Try joblib first (faster)
2. Fallback to pickle if joblib fails
3. Validate model has `predict()` method
4. Load encoders, features, metrics separately
5. Global state for performance (load once at startup)

### Feature Processing Pattern
```python
features = []
for col in feature_columns:
    if col in categorical_encoders:
        # Transform with label encoder, default to 0 if unknown
        encoded = label_encoders[col].transform([value])[0]
    else:
        # Keep numerical as-is
        encoded = float(value)
    features.append(encoded)
```

### Error Handling Pattern
- Try-except with detailed logging
- Fallback values for unknown categories (0)
- HTTP 500 for prediction errors
- Startup failure raises exception (fast-fail)

### Scraping Pattern
1. Extract ad links from listing pages
2. Deduplicate via URL set
3. Fetch detail page for each link
4. Parse structured data (itemprop, hidden inputs, CSS selectors)
5. Delay 1-4s between requests
6. Handle pagination / infinite scroll
7. Write to CSV incrementally

---

## 9. INTEGRATION POINTS

### Main App Integration
- **API Base URL:** Configured in main app
- **Health Check:** `/health` endpoint for monitoring
- **CORS:** Whitelisted for `https://carmarket-six.vercel.app`
- **Environment:** Render deployment with free tier

### Database Integration
- **Seed File:** `seed_valuation_metadata.sql` (166KB)
- Likely contains metadata tables for dropdowns (makes, models, versions)

---

## 10. UNRESOLVED QUESTIONS

1. **Data Source:** Where does `data/toyota_cleaned.csv` come from? Not in repo.
2. **Model Type:** Which actual model won in `retrain_model.py`? RandomForest? XGBoost?
3. **Update Frequency:** How often to retrain with new scraped data?
4. **Model Versioning:** No version tracking in current setup.
5. **Scraping Schedule:** Scripts are manual - no cron/jobs configured.
6. **Data Pipeline:** No ETL pipeline from scraping -> training -> deployment.
7. **Monitoring:** No logging/metrics beyond console output.
8. **Testing:** Only load testing in `test_model_load.py`, no unit tests.
9. **Error Tracking:** No Sentry/external logging configured.
10. **Rate Limiting:** No rate limiting on API endpoint.

---

## 11. FILE SUMMARY

| Category | Files | Purpose |
|----------|-------|---------|
| **API** | `service/main.py` | FastAPI app with 2 endpoints |
| **ML Models** | `models/*.pkl` (4 files) | Trained model + encoders |
| **Scraping** | `scraping/*.py` (6 files) | Data collection from 3 sources |
| **Training** | `train_model.py`, `retrain_model.py` | Model training scripts |
| **Data Processing** | `clean_data.py`, `extract_metadata.py` | ETL pipeline |
| **Testing** | `test_model_load.py` | Model verification |
| **Deployment** | `Dockerfile`, `render.yaml`, `run_service.py` | Container + deploy |
| **Config** | `requirements.txt`, `.gitignore`, `.dockerignore` | Project config |
| **Data** | `metadata.json`, `seed_valuation_metadata.sql` | Static metadata |
| **Notebooks** | `extract_version.ipynb`, `preprocessing.ipynb` | Exploratory analysis |

---

**Total Files:** 13 Python scripts + 4 ML models + 2 notebooks + 4 config + 2 data = 25 files

**Total Lines of Code:** ~3,500+ lines (including scraping)

**Key Strengths:** Modular design, multi-source scraping, model comparison, containerized

**Key Weaknesses:** No automated pipeline, no tests, no monitoring, manual retraining
