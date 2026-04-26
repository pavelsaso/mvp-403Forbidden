import os
import osmnx as ox
import networkx as nx
import matplotlib.pyplot as plt

from graph_builder import build_or_load_graph

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

G = build_or_load_graph()


def nearest_node(lat, lng):
    return ox.distance.nearest_nodes(G, X=lng, Y=lat)


origin = nearest_node(19.062516015756998, -98.30551429588895)
destination = nearest_node(19.05096445543167, -98.2795282056814)

route_fast = nx.shortest_path(
    G,
    origin,
    destination,
    weight="travel_time"
)

route_distance = nx.shortest_path(
    G,
    origin,
    destination,
    weight="length"
)

fig, ax = ox.plot_graph_routes(
    G,
    [route_fast, route_distance],
    route_colors=["blue", "orange"],
    route_linewidths=[5, 4],
    node_size=0,
    edge_color="gray",
    edge_linewidth=0.6,
    bgcolor="white",
    show=False,
    close=False
)

output_path = os.path.join(OUTPUT_DIR, "comparacion_rutas.png")

fig.savefig(
    output_path,
    dpi=300,
    bbox_inches="tight"
)

plt.close(fig)

print(f"Imagen guardada en: {output_path}")