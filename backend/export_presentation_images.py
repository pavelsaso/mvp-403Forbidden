import os
import osmnx as ox
import networkx as nx
import matplotlib.pyplot as plt

from graph_builder import build_or_load_graph
from safety_metrics import add_safe_costs_to_graph
from safety_state import HEATMAP_VALUES, REPORTS, register_activity, add_report


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs", "presentacion")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Cargando grafo...")
G = build_or_load_graph()
print("Grafo cargado.")


def nearest_node(lat, lng):
    return ox.distance.nearest_nodes(G, X=lng, Y=lat)


def seed_demo_safety_data():
    """
    Carga datos simulados de heatmap y reportes para que la ruta segura
    tenga información contextual al momento de generar imágenes.
    """

    activity_points = [
        {"lat": 19.060522, "lng": -98.302615},
        {"lat": 19.060600, "lng": -98.302700},
        {"lat": 19.061000, "lng": -98.302900},
        {"lat": 19.061905, "lng": -98.294113},
        {"lat": 19.061950, "lng": -98.294200},
        {"lat": 19.0552869, "lng": -98.2926157},
        {"lat": 19.0549402, "lng": -98.2918562},
    ]

    for point in activity_points:
        register_activity(point["lat"], point["lng"])

    add_report("Bache", 19.0620, -98.3000)
    add_report("Accidente", 19.0580, -98.2960)

    print("Datos simulados de heatmap y reportes cargados.")


def export_graph_base():
    print("Generando imagen del grafo base...")

    fig, ax = ox.plot_graph(
        G,
        node_size=0,
        edge_color="gray",
        edge_linewidth=0.6,
        bgcolor="white",
        show=False,
        close=False
    )

    output_path = os.path.join(OUTPUT_DIR, "01_grafo_base.png")

    fig.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close(fig)

    print(f"Imagen guardada: {output_path}")


def export_fast_vs_safe_route():
    print("Generando comparación: ruta rápida vs ruta segura...")

    origin_lat = 19.062516015756998
    origin_lng = -98.30551429588895

    destination_lat = 19.05096445543167
    destination_lng = -98.2795282056814

    origin = nearest_node(origin_lat, origin_lng)
    destination = nearest_node(destination_lat, destination_lng)

    route_fast = nx.shortest_path(
        G,
        origin,
        destination,
        weight="travel_time"
    )

    add_safe_costs_to_graph(
        G=G,
        heatmap_values=HEATMAP_VALUES,
        reports=REPORTS,
        is_raining=True,
        hour=None
    )

    route_safe = nx.shortest_path(
        G,
        origin,
        destination,
        weight="safe_cost"
    )

    fig, ax = ox.plot_graph_routes(
        G,
        [route_fast, route_safe],
        route_colors=["blue", "green"],
        route_linewidths=[4, 5],
        node_size=0,
        edge_color="lightgray",
        edge_linewidth=0.6,
        bgcolor="white",
        show=False,
        close=False
    )

    output_path = os.path.join(OUTPUT_DIR, "02_comparacion_rapida_vs_segura.png")

    fig.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close(fig)

    print(f"Imagen guardada: {output_path}")


def export_safe_route_only():
    print("Generando imagen de ruta segura...")

    origin_lat = 19.062516015756998
    origin_lng = -98.30551429588895

    destination_lat = 19.05096445543167
    destination_lng = -98.2795282056814

    origin = nearest_node(origin_lat, origin_lng)
    destination = nearest_node(destination_lat, destination_lng)

    add_safe_costs_to_graph(
        G=G,
        heatmap_values=HEATMAP_VALUES,
        reports=REPORTS,
        is_raining=True,
        hour=None
    )

    route_safe = nx.shortest_path(
        G,
        origin,
        destination,
        weight="safe_cost"
    )

    fig, ax = ox.plot_graph_route(
        G,
        route_safe,
        route_color="green",
        route_linewidth=5,
        node_size=0,
        edge_color="lightgray",
        edge_linewidth=0.6,
        bgcolor="white",
        show=False,
        close=False
    )

    output_path = os.path.join(OUTPUT_DIR, "03_ruta_segura.png")

    fig.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close(fig)

    print(f"Imagen guardada: {output_path}")


if __name__ == "__main__":
    print("Iniciando exportación de imágenes para presentación...")

    seed_demo_safety_data()
    export_graph_base()
    export_fast_vs_safe_route()
    export_safe_route_only()

    print("Proceso terminado.")
    print(f"Revisa la carpeta: {OUTPUT_DIR}")
    