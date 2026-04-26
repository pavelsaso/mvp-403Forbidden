import osmnx as ox
import networkx as nx
import json
import os
from typing import List, Dict, Any
from utils.geo import haversine
from Agregador import Agregador
from Builder import Builder
from datetime import datetime
class Ruteo:
    W_DIST = 0.3
    W_HEAT = 0.7
    def __init__(self, modo: str, agregador: Agregador): #Constructor que decidira el modo en el que operara el ruteo para generar el grafo
        if modo not in ("distancia", "segura"):
            raise ValueError(f"modo debe ser 'distancia' o 'segura', recibido: '{modo}'")
        self.modo      = modo
        self.agregador = agregador
        self._fn_peso = (self._peso_distancia if modo == "distancia" else self._peso_segura) #Determina la funcion de peso. Slo guarda en una variable
    #CARGA DE ESTACIONES DE BICICLETAS
    path_stations="Data copy.json" #Path de la ruta del archivo que contiene las estaiones
    _RUTA_JSON = os.path.join(os.path.dirname(__file__),  "..", "data",path_stations)
    @staticmethod 
    def _cargar_estaciones() -> List[Dict]:
        with open(Ruteo._RUTA_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        return [
            {
                "id":     e["id"],
                "nombre": e["name"],
                "lat":    e["lat"],
                "lon":    e["lng"],          
                "bicicletas": e["bikes_available"]
            }
            for e in data["stations"]
            if e["bikes_available"] > 0      
            ]
    ESTACIONES = _cargar_estaciones.__func__()
    #FUNCIONES DE PESO BASADOS EN DJKASTRA(DETERMINA QUE FUNCION SE USA DEPENDIENDO EL MODO)
    def _peso_distancia(self, u: int, v: int, datos: Dict) -> float:
        return datos.get("length", 1.0)
    
    def _peso_segura(self, u: int, v: int, datos: Dict) -> float:
        G_ll = Builder.obtener_grafo_latlon()
        lat = G_ll.nodes[u]["y"]
        lon = G_ll.nodes[u]["x"]
        precision = 100 / 111000
        grid_lat  = int(lat / precision)
        grid_lon  = int(lon / precision)
        zone_id   = f"{grid_lat}_{grid_lon}"
        hora = datetime.now().strftime("%H")
        heatmap = self.agregador.get_heatmap_values()
        eventos = heatmap.get(hora, {}).get(zone_id, 0)
        distancia = datos.get("length", 1.0)
        penalizacion = distancia / (1 + eventos)
        return (Ruteo.W_DIST * distancia) + (Ruteo.W_HEAT * penalizacion)
    #FUNCIONES DE RUTEO
    def _snap_nodo(self,G: nx.MultiDiGraph, lat: float, lon: float) -> int:
        return ox.distance.nearest_nodes(G, X=lon, Y=lat)
    
    def _estacion_mas_cercana(self,lat: float, lon: float) -> Dict:
        return min(self.ESTACIONES, key=lambda e: haversine(lat, lon, e["lat"], e["lon"]) )
    
    def _nodos_a_coordenadas(self,G_latlon: nx.MultiDiGraph, nodos: List[int]) -> List[tuple]:
         return [(G_latlon.nodes[osmid]["y"], G_latlon.nodes[osmid]["x"]) for osmid in nodos]
    #Calcular ruta
    def calcular_ruta(
        self,
        lat_origen:  float,
        lon_origen:  float,
        lat_destino: float,
        lon_destino: float
    ) -> Dict[str, Any]:
        G        = Builder.obtener_grafo()
        G_latlon = Builder.obtener_grafo_latlon()
        nodo_origen   = self._snap_nodo(G, lat_origen,  lon_origen)
        nodo_destino  = self._snap_nodo(G, lat_destino, lon_destino)
        estacion      = self._estacion_mas_cercana(lat_origen, lon_origen)
        nodo_estacion = self._snap_nodo(G, estacion["lat"], estacion["lon"])
        tramo_a    = nx.dijkstra_path(G, nodo_origen,   nodo_estacion, weight=self._fn_peso)
        tramo_b    = nx.dijkstra_path(G, nodo_estacion, nodo_destino,  weight=self._fn_peso)
        ruta_nodos = tramo_a + tramo_b[1:]
        return {
            "ruta": self._nodos_a_coordenadas(G_latlon, ruta_nodos)
        }