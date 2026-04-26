print("Ejecutando test_safe_api.py")
import requests


BASE_URL = "http://127.0.0.1:5000"


# 1. Simular actividad urbana en algunas zonas
activity_points = [
    {"lat": 19.060522, "lng": -98.302615},
    {"lat": 19.060600, "lng": -98.302700},
    {"lat": 19.061000, "lng": -98.302900},
    {"lat": 19.061905, "lng": -98.294113},
    {"lat": 19.061950, "lng": -98.294200},
]

for point in activity_points:
    response = requests.post(
        f"{BASE_URL}/activity",
        json=point
    )
    print("Activity:", response.status_code, response.json())


# 2. Simular reportes ciudadanos
reports = [
    {
        "type": "Bache",
        "lat": 19.0620,
        "lng": -98.3000
    },
    {
        "type": "Accidente",
        "lat": 19.0580,
        "lng": -98.2960
    }
]

for report in reports:
    response = requests.post(
        f"{BASE_URL}/report",
        json=report
    )
    print("Report:", response.status_code, response.json())


# 3. Pedir ruta segura
payload = {
    "origin_lat": 19.062516015756998,
    "origin_lng": -98.30551429588895,
    "destination_lat": 19.05096445543167,
    "destination_lng": -98.2795282056814,
    "is_raining": True
}

response = requests.post(
    f"{BASE_URL}/route-safe",
    json=payload
)

print("Safe route status:", response.status_code)
print(response.json())