from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote_plus
import time
import smtplib
import threading
import numpy as np
import joblib
import os
from email.message import EmailMessage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── MongoDB ───────────────────────────────────
password   = quote_plus("Harsh@777#")
MONGO_URL  = f"mongodb+srv://Harsh:{password}@cluster0.q1mkslk.mongodb.net/cloudmonitor?retryWrites=true&w=majority&appName=Cluster0"
client     = AsyncIOMotorClient(MONGO_URL, tlsAllowInvalidCertificates=True)
db         = client.cloudmonitor
collection = db.metrics
# ─────────────────────────────────────────────

# ── AI Model ─────────────────────────────────
model_path    = os.path.join(os.path.dirname(__file__), "anomaly_model.pkl")
anomaly_model = None
if os.path.exists(model_path):
    anomaly_model = joblib.load(model_path)
    print("✓ Anomaly detection model loaded")
else:
    print("⚠ No anomaly model found — run ai/anomaly.py to train it")
# ─────────────────────────────────────────────

# ── Alert config ──────────────────────────────
ALERT_EMAIL  = "harshvgaikwad2006@gmail.com"
APP_PASSWORD = "cbro knmu cqyi juzr"
THRESHOLDS   = {"cpu": 90, "ram": 85, "disk": 95}
last_alert   = {}
# ─────────────────────────────────────────────

class Metric(BaseModel):
    cpu:       float
    ram:       float
    disk:      float
    net_sent:  int
    net_recv:  int
    timestamp: float

def send_alert(metric, value):
    try:
        msg = EmailMessage()
        msg["Subject"] = f"ALERT: {metric.upper()} at {value:.1f}%"
        msg["From"]    = ALERT_EMAIL
        msg["To"]      = ALERT_EMAIL
        msg.set_content(
            f"Cloud Monitor Alert\n\n"
            f"{metric.upper()} usage has reached {value:.1f}%\n"
            f"Threshold: {THRESHOLDS[metric]}%\n\n"
            f"Check your system immediately."
        )
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(ALERT_EMAIL, APP_PASSWORD)
            s.send_message(msg)
        print(f"✓ Alert sent — {metric}: {value:.1f}%")
    except Exception as e:
        print(f"✗ Alert failed: {e}")

@app.post("/metrics")
async def receive(m: Metric):
    data = m.dict()

    # anomaly detection
    anomaly = False
    if anomaly_model is not None:
        features   = np.array([[m.cpu, m.ram, m.disk]])
        prediction = anomaly_model.predict(features)
        anomaly    = bool(prediction[0] == -1)
        if anomaly:
            print(f"⚠ Anomaly! CPU:{m.cpu} RAM:{m.ram} Disk:{m.disk}")
    data["anomaly"] = anomaly

    # threshold alerts
    for key, limit in THRESHOLDS.items():
        val = data.get(key, 0)
        if val > limit:
            now = time.time()
            if now - last_alert.get(key, 0) > 300:
                last_alert[key] = now
                threading.Thread(target=send_alert, args=(key, val)).start()

    await collection.insert_one(data)
    return {"status": "ok", "anomaly": anomaly}

@app.get("/metrics")
async def get_metrics(limit: int = 60):
    cursor = collection.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return list(reversed(docs))

@app.get("/")
def root():
    return {"message": "Cloud Monitor API is running"}