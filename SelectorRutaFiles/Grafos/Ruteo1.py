import osmnx as ox
import networkx as nx
from typing import List
from models.Entrada import Entrada
from Builder import Builder
class Ruteo1:
    def __init__(self):
        self.builder=Builder()
        self.G=self.builder.obtener_grafo_latlon
    def snap_nodo(self, lat:float, lon:float) -> int:
        return ox.distance.nearest_nodes(self.G, X=lon, Y=lat)
    def nodos_a_coordenadas(self, nodos : List[int]):
         return [
            (self.G_latlon.nodes[osmid]["y"],
             self.G_latlon.nodes[osmid]["x"])
            for osmid in nodos
        ]
    def calcular_ruta(self):
        Entrada2= self.builder.Entrada
        self.Origen= Entrada2.GetOrigen()
        self.Destino = Entrada2.GetDestino()
        nodo_origen= self.Origen
        nodo_destino=self.Destino
        nodos_ruta=nx.dijkstra_path(self.G,self.Origen,self.Destino,)