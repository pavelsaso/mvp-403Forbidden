import osmnx as ox
import networkx as nx

from graph_builder import build_or_load_graph

from safety_metrics import (
    add_safe_costs_to_graph,
    summarize_route_safety
)


# Carga el grafo una sola vez
G = build_or_load_graph()


def get_best_edge_data(G, u, v, weight="travel_time"):
    """
    En un MultiDiGraph puede haber varias aristas entre dos nodos.
    Esta función elige la arista con menor valor del peso indicado.
    """
    edge_data_dict = G.get_edge_data(u, v)

    if edge_data_dict is None:
        return None

    return min(
        edge_data_dict.values(),
        key=lambda data: float(
            data.get(
                weight,
                data.get("length", 1.0)
            )
        )
    )


def route_to_geojson(route, weight="travel_time"):
    """
    Convierte una ruta calculada por NetworkX/OSMnx en GeoJSON.
    Leaflet puede dibujar este GeoJSON directamente.
    """

    coordinates = []

    for u, v in zip(route[:-1], route[1:]):
        edge_data = get_best_edge_data(G, u, v, weight=weight)

        if edge_data is None:
            continue

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
    Calcula la ruta rápida usando el peso travel_time.
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

    route_geojson = route_to_geojson(
        route,
        weight="travel_time"
    )

    return {
        "route_type": "fast",
        "route": route_geojson,
        "origin_node": int(origin_node),
        "destination_node": int(destination_node),
        "travel_time_seconds": float(travel_time_seconds),
        "travel_time_minutes": round(float(travel_time_seconds) / 60, 2),
        "nodes_count": len(route)
    }


def calculate_safe_route(
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    heatmap_values,
    reports,
    is_raining=False,
    hour=None
):
    """
    Calcula la ruta segura usando el peso safe_cost.

    El safe_cost se calcula dinámicamente con:
    - heatmap
    - reportes de baches/accidentes
    - lluvia
    - compatibilidad ciclista
    - tipo de calle
    """

    add_safe_costs_to_graph(
        G=G,
        heatmap_values=heatmap_values,
        reports=reports,
        is_raining=is_raining,
        hour=hour
    )

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
        weight="safe_cost"
    )

    safe_cost = nx.shortest_path_length(
        G,
        origin_node,
        destination_node,
        weight="safe_cost"
    )

    route_geojson = route_to_geojson(
        route,
        weight="safe_cost"
    )

    safety_summary = summarize_route_safety(G, route)

    return {
        "route_type": "safe",
        "route": route_geojson,
        "origin_node": int(origin_node),
        "destination_node": int(destination_node),
        "safe_cost": round(float(safe_cost), 2),
        "nodes_count": len(route),
        "safety_summary": safety_summary
    }