import osmnx as ox
import networkx as nx
from typing import Optional
public class Builder{
    LUGAR=  "San Andrés Cholula, Puebla, México"
    RADIO_M  = 5000
    _grafo_cache: Optional[nx.MultiDiGraph] = None
}