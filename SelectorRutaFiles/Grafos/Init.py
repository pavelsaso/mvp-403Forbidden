from fastapi import FastAPI
from EventFiles import Agregador
from EventFiles import Ubicacion
from EventFiles import Event
from Builder import Builder
from Ruteo import Ruteo
from models import Entrada

app = FastAPI(title="Ruta Segura API")

agregador1 = Agregador()

            
ruteo_distancia = Ruteo("distancia", agregador1)
ruteo_segura    = Ruteo("segura",    agregador1)

@app.on_event("startup")
async def startup():
    Builder.obtener_grafo

@app.post("/update")
def update_activity(entrada: Entrada):

    posicion     = Ubicacion(lat=entrada.lat, lon=entrada.lon)
    nuevo_evento = Event(posicion)
    agregador1.add_event(nuevo_evento)
    return {"status": "ok", "zone": nuevo_evento.zone}


@app.get("/heatmap")
def heatmap():
    return agregador1.get_heatmap_values()


            # ── Endpoints de ruteo ──────────────────────────────────────────────
@app.post("/ruta/distancia")
def ruta_distancia(entrada: Entrada):         
    return ruteo_distancia.calcular_ruta(
                    entrada.lat_origen,
                    entrada.lon_origen,
                    entrada.lat_destino,
                    entrada.lon_destino
    )


@app.post("/ruta/segura")
def ruta_segura(entrada: Entrada):
    return ruteo_segura.calcular_ruta(
                    entrada.lat_origen,
                    entrada.lon_origen,
                    entrada.lat_destino,
                    entrada.lon_destino
    )
                