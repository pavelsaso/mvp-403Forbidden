from fastapi import FastAPI
from Agregador import Agregador
from Ubicacion import Ubicacion
from Event import Event
app = FastAPI(title="Event_keys_value")
agregador1 = Agregador()#Crea objeto de agregador
@app.post("/update") #Updtea el servidor
def update_activity(lat: float, lon: float):
    posicion = Ubicacion(lat=lat, lon=lon) #Obtiene la posicion del usuario y la guarda en ob tipo posicion
    nuevo_evento = Event(posicion) #La clase Evento genera los valores del usuario
    agregador1.add_event(nuevo_evento)   #Genera el diccionario individual del usuario en python, agregando el evento que se creo previamente/eventos
    return {"status": "ok", "zone": nuevo_evento.zone} #Returnea
@app.get("/heatmap")
def heatmap():
    return agregador1.get_heatmap_values()