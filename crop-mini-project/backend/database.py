import os
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "crop_db")
COLLECTION_NAME = "prediction_history"

# In-memory fallback if MongoDB is not running locally
_memory_history = []


def get_collection():
    """Returns the MongoDB collection for prediction history, or None if unavailable."""
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.server_info()  # Check connection
        return client[DB_NAME][COLLECTION_NAME]
    except (ServerSelectionTimeoutError, Exception) as e:
        print(f"[Database Notice] MongoDB at {MONGO_URI} not reachable ({e}). Using in-memory history fallback.")
        return None


def save_prediction(input_data, prediction_result):
    """
    Saves user input features, predicted result, and timestamp.
    """
    record = {
        "inputs": input_data,
        "prediction": prediction_result["label"],
        "class_code": int(prediction_result["class_code"]),
        "crop_median": float(prediction_result.get("crop_median", 0.0)),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    col = get_collection()
    if col is not None:
        try:
            col.insert_one(record)
            # Remove MongoDB's internal _id for serialization
            record.pop("_id", None)
            return record
        except Exception as e:
            print(f"Error inserting into MongoDB: {e}")

    # Fallback to in-memory list
    _memory_history.insert(0, record)
    return record


def get_prediction_history(limit=10):
    """
    Retrieves the most recent predictions.
    """
    col = get_collection()
    if col is not None:
        try:
            cursor = col.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
            return list(cursor)
        except Exception as e:
            print(f"Error fetching from MongoDB: {e}")

    return _memory_history[:limit]
