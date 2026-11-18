# Crop Yield Prediction & Classification - Mini Project

An explainable, academic mini project demonstrating end-to-end Machine Learning with dataset preprocessing, Decision Tree classification, PyMongo database integration, and a clean single-page React frontend.

---

## 1. Project Overview & Objectives
- **Demonstrate basic ML workflow**: Data cleaning, per-crop IQR outlier filtering, label encoding, 80:20 train-test splitting, model training, evaluation, and serialized persistence (`model.pkl`).
- **Explainability First**: Built specifically for presentations and technical vivas. It utilizes a single **Decision Tree Classifier** rather than complex multi-algorithm ensembles.
- **MongoDB Integration**: Stores and retrieves real-time prediction history using PyMongo.
- **Clean Single-Page Frontend**: React (Vite) + Tailwind CSS providing 4 structured, presentation-friendly sections.

---

## 2. Dataset Description
- **Source**: `dataset/crop_dataset.csv` (Indian Agriculture Crop Production dataset, 345,336 raw rows).
- **Target Variable**: `High_Yield` (Binary Classification: `1` for High Yield, `0` for Low Yield).
  - Defined as: `1` if yield ($\text{Production} / \text{Area}$) is strictly above the median yield of that specific crop, otherwise `0`.
- **Input Features**:
  1. `State_enc` (Label-encoded State)
  2. `District_enc` (Label-encoded District)
  3. `Crop_enc` (Label-encoded Crop)
  4. `Season_enc` (Label-encoded Season)
  5. `Crop_Year` (Year of harvest)
  6. `Area` (Cultivated land in hectares)
  *(Production and Yield are excluded from features to prevent target leakage).*

---

## 3. Machine Learning Algorithm: Decision Tree Classifier
- **Why Decision Tree?**
  Decision trees mirror human logic through hierarchical `if-else` decision thresholds. This makes the reasoning behind every prediction directly explainable to evaluators.
- **Data Split (80:20)**:
  - **Training Set (80%)**: 109,476 samples
  - **Testing Set (20%)**: 27,369 samples (Stratified by target class balance)
- **Actual Evaluation Metrics**:
  - **Accuracy**: **76.88%**
  - **Precision**: **78.59%**
  - **Recall**: **73.74%**
  - **F1-Score**: **76.09%**
  - **Confusion Matrix**:
    - True Low Yield: 10,972 | False High Yield: 2,743
    - False Low Yield: 3,585 | True High Yield: 10,069

---

## 4. Technologies Used
- **Backend & ML**: Python 3.10+, Scikit-learn, Pandas, NumPy, Joblib, Flask, Flask-CORS.
- **Database**: MongoDB & PyMongo.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide-React.

---

## 5. Project Folder Structure
```text
crop-mini-project/
├── dataset/
│   └── crop_dataset.csv       # Preserved original dataset
├── backend/
│   ├── app.py                 # Flask REST API endpoints
│   ├── train_model.py         # 10-step ML training & evaluation script
│   ├── database.py            # PyMongo integration & prediction history
│   ├── model.pkl              # Serialized trained Decision Tree & encoders
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # 4-section single-page React UI
│   │   ├── index.css          # Tailwind CSS styling
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json           # Frontend dependencies
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. How to Run the Project

### Step 1: Backend Setup
```bash
cd backend
pip install -r requirements.txt

# (Optional: Train model if model.pkl is not already present)
python train_model.py

# Start Flask API server on port 5000
python app.py
```

### Step 2: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`

*(Note: If MongoDB is running on `mongodb://localhost:27017/`, prediction records will be saved into `crop_db.prediction_history`. If MongoDB is offline, an automatic in-memory fallback handles requests seamlessly without crashing).*
