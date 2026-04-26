from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Agregador import Agregador
from Ubicacion import Ubicacion
from Event import Event

app = FastAPI(title="Event_keys_value")
agregador1 = Agregador()

#Permitir conexión con HTML y JS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/update")
def update_activity(lat: float, lon: float):
    posicion = Ubicacion(lat=lat, lon=lon)
    nuevo_evento = Event(posicion)
    agregador1.add_event(nuevo_evento)

    return {
        "status": "ok",
        "zone": nuevo_evento.Zone
    }

@app.get("/heatmap")
def heatmap():
    return agregador1.get_heatmap_values()