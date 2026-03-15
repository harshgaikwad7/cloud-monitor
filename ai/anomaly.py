import asyncio
import numpy as np
from sklearn.ensemble import IsolationForest
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote_plus
import joblib
import os

async def fetch_data():
    password = quote_plus("Harsh@777#")
    url = f"mongodb+srv://Harsh:{password}@cluster0.q1mkslk.mongodb.net/cloudmonitor?retryWrites=true&w=majority&appName=Cluster0"
    client = AsyncIOMotorClient(url, tlsAllowInvalidCertificates=True)
    cursor = client.cloudmonitor.metrics.find({}, {"_id": 0})
    docs = await cursor.to_list(length=10000)
    client.close()
    return docs

async def train():
    print("Fetching data from MongoDB...")
    docs = await fetch_data()
    
    if len(docs) < 10:
        print(f"Not enough data yet — only {len(docs)} readings. Keep monitor.py running and try again later.")
        return
    
    print(f"Training on {len(docs)} readings...")
    X = np.array([[d["cpu"], d["ram"], d["disk"]] for d in docs])
    
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    
    model_path = os.path.join(os.path.dirname(__file__), "..", "backend", "anomaly_model.pkl")
    joblib.dump(model, model_path)
    print(f"Model trained and saved! ({len(docs)} data points used)")

asyncio.run(train())