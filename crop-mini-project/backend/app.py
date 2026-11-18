import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import save_prediction, get_prediction_history

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# Load model artifacts
if not os.path.exists(MODEL_PATH):
    print("model.pkl not found, training model now...")
    from train_model import train
    train()

artifact = joblib.load(MODEL_PATH)
model = artifact["model"]
encoders = artifact["encoders"]
features_list = artifact["features"]
metrics_info = artifact["metrics"]
categories = artifact["categories"]
crop_medians = artifact["crop_medians"]


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Crop Mini Project API is running"})


@app.route("/api/metadata", methods=["GET"])
def metadata():
    """Returns dropdown options and model evaluation metrics for the UI."""
    return jsonify({
        "categories": categories,
        "metrics": metrics_info,
        "features": features_list
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    """Predicts High/Low Yield using the trained Decision Tree Classifier."""
    data = request.get_json() or {}

    state = str(data.get("state", "")).strip()
    district = str(data.get("district", "")).strip()
    crop = str(data.get("crop", "")).strip()
    season = str(data.get("season", "")).strip()

    try:
        crop_year = int(data.get("crop_year", 2020))
        area = float(data.get("area", 10.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Crop Year must be an integer and Area must be a positive number"}), 400

    if not state or not district or not crop or not season:
        return jsonify({"error": "State, District, Crop, and Season are required"}), 400

    if area <= 0:
        return jsonify({"error": "Area must be greater than zero"}), 400

    # Safe label encoding with fallback for unseen classes
    def encode_val(encoder, val):
        if val in encoder.classes_:
            return int(encoder.transform([val])[0])
        return 0

    state_enc = encode_val(encoders["State"], state)
    district_enc = encode_val(encoders["District"], district)
    crop_enc = encode_val(encoders["Crop"], crop)
    season_enc = encode_val(encoders["Season"], season)

    # Feature input row
    input_df = pd.DataFrame([{
        "State_enc": state_enc,
        "District_enc": district_enc,
        "Crop_enc": crop_enc,
        "Season_enc": season_enc,
        "Crop_Year": crop_year,
        "Area": area
    }])[features_list]

    # Predict
    pred_code = int(model.predict(input_df)[0])
    label = "High Yield" if pred_code == 1 else "Low Yield"
    crop_median = float(crop_medians.get(crop, 0.0))

    result = {
        "class_code": pred_code,
        "label": label,
        "crop_median": crop_median,
        "explanation": f"Predicted as {label} based on whether yield is expected to exceed the median for {crop} ({crop_median:.2f} yield units)."
    }

    # Save to MongoDB history
    input_record = {
        "State": state,
        "District": district,
        "Crop": crop,
        "Season": season,
        "Crop_Year": crop_year,
        "Area": area
    }
    history_record = save_prediction(input_record, result)

    return jsonify({
        "prediction": result,
        "history_item": history_record
    })


@app.route("/api/history", methods=["GET"])
def history():
    """Returns stored prediction history."""
    limit = request.args.get("limit", default=10, type=int)
    records = get_prediction_history(limit=limit)
    return jsonify({"history": records})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
