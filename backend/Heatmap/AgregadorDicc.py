from Agregador import Agregador
from Ubicacion import Ubicacion
from fastapi import FastAPI
from Event import Event
app = FastAPI(title="Event_keys_value")
agregador1 = Agregador()
@app.post("/update")
def update_activity(lat: float, lon: float):
    posicion = Ubicacion(lat=lat, lon=lon)
    nuevo_evento = Event(posicion)
    agregador1.add_event(nuevo_evento)
    
    return {"status": "ok", "zone": nuevo_evento.zone}
@app.get("/heatmap")
def heatmap():
    return agregador1.get_heatmap_values()