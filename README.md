# Cloud Monitor Dashboard

A full-stack real-time system monitoring dashboard with AI-powered anomaly detection.

## Live Features
- Real-time CPU, RAM, disk and network monitoring (updates every 1 second)
- Live dashboard with interactive charts and color-coded alerts
- Automated email alerts when metrics cross critical thresholds
- AI anomaly detection using Isolation Forest (scikit-learn)
- Cloud database persistence with MongoDB Atlas

## Tech Stack
| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| Frontend | React, Recharts, Vite |
| Database | MongoDB Atlas |
| AI/ML | scikit-learn (Isolation Forest) |
| Monitoring | psutil |
| Alerts | SMTP / Gmail |

## Project Structure
```
cloud-monitor/
├── backend/
│   ├── main.py        # FastAPI server + alert system + AI integration
│   ├── monitor.py     # System metrics collector (psutil)
│   └── models.py      # Data models
├── frontend/
│   └── src/
│       └── App.jsx    # React dashboard with live charts
├── ai/
│   └── anomaly.py     # Isolation Forest model training
└── requirements.txt
```

## How It Works
1. `monitor.py` collects CPU, RAM, disk and network stats every second
2. Metrics are sent to FastAPI backend via HTTP POST
3. Backend stores data in MongoDB Atlas and runs AI anomaly detection
4. If metrics cross thresholds, an email alert is sent automatically
5. React frontend fetches and displays live data every 2 seconds

## Setup Instructions

### Backend
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd backend
uvicorn main:app --reload
```

### Monitor Script
```bash
cd backend
python monitor.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Train AI Model
```bash
python ai/anomaly.py
```

## Screenshots
_Dashboard showing live CPU, RAM, disk metrics with AI anomaly markers_

## Author
Harsh Gaikwad — CS (AI & Data Science)
