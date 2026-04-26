import osmnx as ox
import networkx as nx
from typing import Optional
class Builder:
    LUGAR=  "San Andrés Cholula, Puebla, México"
    RADIO_M  = 5000
    TIPO_RED="bike"
    _grafo_cache: Optional[nx.MultiDiGraph] = None
    @staticmethod 
    def obtener_grafo() -> nx.MultiDiGraph:
        if _grafo_cache is not None:
            return _grafo_cache
        G = ox.graph_from_place(Builder.LUGAR,network_type=Builder.TIPO_RED,retain_all=False,  simplify=True)
        G = ox.add_edge_lengths(G)
        Builder._grafo_cache = G
        return G
    @staticmethod
    def obtener_grafo_latlon() -> nx.MultiDiGraph:
        G = Builder.obtener_grafo()
        return ox.project_graph(G, to_crs="EPSG:4326")
        
