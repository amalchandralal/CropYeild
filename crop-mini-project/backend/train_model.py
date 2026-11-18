import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Paths
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset", "crop_dataset.csv")
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

FEATURES = ["State_enc", "District_enc", "Crop_enc", "Season_enc", "Crop_Year", "Area"]


def train():
    print(f"1. Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)
    df.columns = df.columns.str.strip()

    print(f"   Raw shape: {df.shape}")
    for col in ["State", "District", "Crop", "Season"]:
        df[col] = df[col].astype(str).str.strip()

    print("2. Handling missing values and cleaning...")
    df = df.drop_duplicates().dropna(subset=["Crop", "Area", "Production"])
    df = df[df["Area"] > 0].copy()

    # Calculate Yield = Production / Area
    df["Yield"] = df["Production"] / df["Area"]

    # Retain top 10 most frequent crops to ensure statistical validity
    top_crops = df["Crop"].value_counts().head(10).index.tolist()
    df = df[df["Crop"].isin(top_crops)].copy()

    # Per-crop IQR outlier removal
    q1 = df.groupby("Crop")["Yield"].transform(lambda s: s.quantile(0.25))
    q3 = df.groupby("Crop")["Yield"].transform(lambda s: s.quantile(0.75))
    iqr = q3 - q1
    df = df[(df["Yield"] >= q1 - 1.5 * iqr) & (df["Yield"] <= q3 + 1.5 * iqr)].copy()

    # Target variable: High_Yield = 1 if above the crop's own median yield, else 0
    crop_medians = df.groupby("Crop")["Yield"].median().to_dict()
    df["High_Yield"] = (df["Yield"] > df.groupby("Crop")["Yield"].transform("median")).astype(int)

    # Label Encoding for categorical features
    encoders = {}
    for col in ["State", "District", "Crop", "Season"]:
        le = LabelEncoder()
        df[col + "_enc"] = le.fit_transform(df[col])
        encoders[col] = le

    print(f"   Cleaned dataset shape: {df.shape}")
    print(f"   Class balance: {dict(df['High_Yield'].value_counts())}")

    X = df[FEATURES]
    y = df["High_Yield"]

    # 80% Training and 20% Testing split
    print("3. Splitting data into 80% training and 20% testing sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"   Train samples: {len(X_train):,}, Test samples: {len(X_test):,}")

    # Train One Model: Decision Tree Classifier
    print("4. Training Decision Tree Classifier...")
    model = DecisionTreeClassifier(max_depth=12, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate Model
    print("5. Evaluating model on test data...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature importances
    feature_importances = dict(zip(FEATURES, [round(float(v), 4) for v in model.feature_importances_]))

    metrics = {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": cm,
        "feature_importances": feature_importances,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "top_crops": top_crops,
        "crop_medians": {k: round(float(v), 3) for k, v in crop_medians.items()}
    }

    print("\n================ EVALUATION RESULTS ================")
    print(f"Accuracy : {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall   : {rec * 100:.2f}%")
    print(f"F1-Score : {f1 * 100:.2f}%")
    print(f"Confusion Matrix: {cm}")
    print(f"Feature Importances: {feature_importances}")
    print("====================================================\n")

    # Save artifacts in bundle
    artifact = {
        "model": model,
        "encoders": encoders,
        "features": FEATURES,
        "metrics": metrics,
        "top_crops": top_crops,
        "crop_medians": crop_medians,
        "categories": {
            "State": sorted(list(encoders["State"].classes_)),
            "District": sorted(list(encoders["District"].classes_)),
            "Crop": top_crops,
            "Season": sorted(list(encoders["Season"].classes_))
        }
    }

    joblib.dump(artifact, MODEL_SAVE_PATH)
    print(f"6. Model and encoders saved successfully to {MODEL_SAVE_PATH}")
    return metrics


if __name__ == "__main__":
    train()
