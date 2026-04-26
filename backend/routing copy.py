import osmnx as ox
import networkx as nx
from graph_builder import build_or_load_graph

# Cargamos el grafo una sola vez al iniciar el backend
G = build_or_load_graph()


def route_to_geojson(route):
    """
    Convierte una ruta de nodos de NetworkX/OSMnx a GeoJSON.
    Leaflet puede dibujar este GeoJSON directamente.
    """

    coordinates = []

    for u, v in zip(route[:-1], route[1:]):
        edge_data_dict = G.get_edge_data(u, v)

        if edge_data_dict is None:
            continue

        # Puede haber varias aristas entre los mismos nodos.
        # Elegimos la de menor tiempo de viaje.
        edge_data = min(
            edge_data_dict.values(),
            key=lambda data: data.get("travel_time", data.get("length", 1))
        )

        if "geometry" in edge_data:
            xs, ys = edge_data["geometry"].xy

            for x, y in zip(xs, ys):
                coordinates.append([x, y])  # GeoJSON usa [lng, lat]
        else:
            x1 = G.nodes[u]["x"]
            y1 = G.nodes[u]["y"]
            x2 = G.nodes[v]["x"]
            y2 = G.nodes[v]["y"]

            coordinates.append([x1, y1])
            coordinates.append([x2, y2])

    return {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        }
    }


def calculate_fast_route(origin_lat, origin_lng, destination_lat, destination_lng):
    """
    Calcula ruta rápida minimizando travel_time.
    """

    origin_node = ox.distance.nearest_nodes(
        G,
        X=origin_lng,
        Y=origin_lat
    )

    destination_node = ox.distance.nearest_nodes(
        G,
        X=destination_lng,
        Y=destination_lat
    )

    route = nx.shortest_path(
        G,
        origin_node,
        destination_node,
        weight="travel_time"
    )

    travel_time_seconds = nx.shortest_path_length(
        G,
        origin_node,
        destination_node,
        weight="travel_time"
    )

    route_geojson = route_to_geojson(route)

    return {
        "route": route_geojson,
        "origin_node": int(origin_node),
        "destination_node": int(destination_node),
        "travel_time_seconds": float(travel_time_seconds),
        "travel_time_minutes": round(float(travel_time_seconds) / 60, 2),
        "nodes_count": len(route)
    }