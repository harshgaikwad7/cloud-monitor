import psutil
import time
import json
import requests

API_URL = "http://localhost:8000/metrics"

def collect():
    net = psutil.net_io_counters()
    return {
        "cpu":       psutil.cpu_percent(interval=1),
        "ram":       psutil.virtual_memory().percent,
        "disk":      psutil.disk_usage("/").percent,
        "net_sent":  net.bytes_sent,
        "net_recv":  net.bytes_recv,
        "timestamp": time.time()
    }

if __name__ == "__main__":
    print("Monitoring started... Press Ctrl+C to stop.")
    while True:
        data = collect()
        print(json.dumps(data, indent=2))
        try:
            requests.post(API_URL, json=data, timeout=3)
        except Exception:
            pass  # API not running yet — that's fine
        time.sleep(5)