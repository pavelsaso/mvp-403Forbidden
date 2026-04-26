import requests

url = "http://127.0.0.1:5000/route-fast"

payload = {
    "origin_lat": 19.062516015756998,
    "origin_lng": -98.30551429588895,
    "destination_lat": 19.05096445543167,
    "destination_lng": -98.2795282056814
}

response = requests.post(url, json=payload)

print("Status:", response.status_code)
print(response.json())

#Par correr esta parte, la cual es la más importante, se debe de correr primero el código para levantar el backend, 
#cd C:\Users\jag17\Documents\Hackathon\mvp-403Forbidden\backendpython app.py
#Y después correr el siguiente código para ya correr el testeo de la API, 
#cd C:\Users\jag17\Documents\Hackathon\mvp-403Forbidden\backend python test_api.py