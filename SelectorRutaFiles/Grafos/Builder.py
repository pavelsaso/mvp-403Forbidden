import osmnx as ox
import networkx as nx
from typing import Optional
from models.Entrada import Entrada
class Builder:
    def __init__(self):
        self.Entrada=Entrada()
        self.Center=Entrada.GetDestino()
    RADIO_M  = 1000
    TIPO_RED="bike"
    def obtener_grafo(self) -> nx.MultiDiGraph:
        G = ox.graph_from_point(center_point=self.Center,dist=self.RADIO_M,network_type=Builder.TIPO_RED,retain_all=False)
        return G
    def obtener_grafo_latlon(self) -> nx.MultiDiGraph:
        G = self.obtener_grafo()
        G = ox.add_edge_lengths(G)
        return ox.project_graph(G, to_crs="EPSG:4326")

