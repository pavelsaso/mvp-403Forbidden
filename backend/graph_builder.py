import os
import osmnx as ox

GRAPH_PATH = os.path.join("cache", "cholula.graphml")


def build_or_load_graph():
    os.makedirs("cache", exist_ok=True)

    if os.path.exists(GRAPH_PATH):
        print("Cargando grafo desde cache...")
        return ox.load_graphml(GRAPH_PATH)

    print("Descargando grafo desde OpenStreetMap...")

    center_point = (19.062516015756998, -98.30551429588895)

    G = ox.graph_from_point(
        center_point,
        dist=5000,
        network_type="bike",
        simplify=True
    )

    G = ox.routing.add_edge_speeds(G, fallback=15)
    G = ox.routing.add_edge_travel_times(G)

    ox.save_graphml(G, GRAPH_PATH)

    print("Grafo creado.")
    print(f"Nodos: {len(G.nodes)}")
    print(f"Aristas: {len(G.edges)}")

    return G


if __name__ == "__main__":
    build_or_load_graph()