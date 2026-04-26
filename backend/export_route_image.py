import os
import osmnx as ox
import networkx as nx
import matplotlib.pyplot as plt

from graph_builder import build_or_load_graph

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

G = build_or_load_graph()


def calculate_route(origin_lat, origin_lng, destination_lat, destination_lng):
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

    return route, origin_node, destination_node


def export_route_image(
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    output_name="ruta_rapida.png"
):
    route, origin_node, destination_node = calculate_route(
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng
    )

    fig, ax = ox.plot_graph_route(
        G,
        route,
        route_color="blue",
        route_linewidth=5,
        node_size=0,
        bgcolor="white",
        edge_color="gray",
        edge_linewidth=0.6,
        show=False,
        close=False
    )

    # Marcar origen y destino
    origin_x = G.nodes[origin_node]["x"]
    origin_y = G.nodes[origin_node]["y"]

    destination_x = G.nodes[destination_node]["x"]
    destination_y = G.nodes[destination_node]["y"]

    ax.scatter(origin_x, origin_y, c="green", s=80, zorder=5, label="Origen")
    ax.scatter(destination_x, destination_y, c="red", s=80, zorder=5, label="Destino")

    ax.legend()

    output_path = os.path.join(OUTPUT_DIR, output_name)

    fig.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close(fig)

    print(f"Imagen guardada en: {output_path}")


if __name__ == "__main__":
    # Ejemplo: Centro de San Pedro Cholula → UDLAP
    export_route_image(
        origin_lat=19.062516015756998,
        origin_lng=-98.30551429588895,
        destination_lat=19.05096445543167,
        destination_lng=-98.2795282056814,
        output_name="ruta_rapida_cholula.png"
    )
    