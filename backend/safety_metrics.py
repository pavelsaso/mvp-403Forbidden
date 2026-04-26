import math
from datetime import datetime

from safety_state import get_zone_id


def clamp01(value):
    return max(0.0, min(1.0, float(value)))


def safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371

    d_lat = math.radians(float(lat2) - float(lat1))
    d_lng = math.radians(float(lng2) - float(lng1))

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(float(lat1)))
        * math.cos(math.radians(float(lat2)))
        * math.sin(d_lng / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def normalize_osm_value(value):
    if value is None:
        return ""

    if isinstance(value, list):
        if len(value) == 0:
            return ""
        return str(value[0]).lower()

    return str(value).lower()


def infer_bike_score(edge_data):
    highway = normalize_osm_value(edge_data.get("highway"))
    cycleway = normalize_osm_value(edge_data.get("cycleway"))

    if highway == "cycleway":
        return 1.0

    if cycleway and cycleway not in ["no", "none"]:
        return 0.95

    if highway in ["path", "pedestrian", "living_street"]:
        return 0.85

    if highway in ["residential", "service"]:
        return 0.75

    if highway in ["tertiary", "unclassified"]:
        return 0.55

    if highway in ["secondary", "primary", "trunk"]:
        return 0.25

    return 0.45


def infer_street_calm_score(edge_data):
    highway = normalize_osm_value(edge_data.get("highway"))

    if highway in ["cycleway", "path", "pedestrian", "living_street"]:
        return 1.0

    if highway in ["residential", "service"]:
        return 0.80

    if highway in ["tertiary", "unclassified"]:
        return 0.55

    if highway in ["secondary", "primary", "trunk"]:
        return 0.25

    return 0.50


def get_edge_midpoint(G, u, v, edge_data):
    geometry = edge_data.get("geometry")

    if geometry is not None and hasattr(geometry, "interpolate"):
        midpoint = geometry.interpolate(0.5, normalized=True)
        return midpoint.y, midpoint.x

    lat1 = G.nodes[u]["y"]
    lng1 = G.nodes[u]["x"]

    lat2 = G.nodes[v]["y"]
    lng2 = G.nodes[v]["x"]

    return (lat1 + lat2) / 2, (lng1 + lng2) / 2


def get_heatmap_score_for_edge(G, u, v, edge_data, heatmap_values, hour=None):
    if hour is None:
        hour = datetime.now().strftime("%H")

    edge_lat, edge_lng = get_edge_midpoint(G, u, v, edge_data)
    zone_id = get_zone_id(edge_lat, edge_lng)

    hour_values = heatmap_values.get(hour, {})

    if not hour_values:
        return 0.50

    max_value = max(hour_values.values())

    if max_value <= 0:
        return 0.50

    zone_value = hour_values.get(zone_id, 0)

    if zone_value == 0:
        return 0.20

    return clamp01(zone_value / max_value)


def get_report_penalty_for_edge(G, u, v, edge_data, reports, radius_m=80):
    edge_lat, edge_lng = get_edge_midpoint(G, u, v, edge_data)

    penalty = 0.0
    nearby_reports = 0

    for report in reports:
        report_lat = report.get("lat")
        report_lng = report.get("lng")

        if report_lat is None or report_lng is None:
            continue

        distance_km = haversine_km(
            edge_lat,
            edge_lng,
            float(report_lat),
            float(report_lng)
        )

        if distance_km * 1000 <= radius_m:
            nearby_reports += 1
            report_type = str(report.get("type", "")).lower()

            if "accidente" in report_type or "accident" in report_type:
                penalty += 0.45
            elif "bache" in report_type or "pothole" in report_type:
                penalty += 0.25
            else:
                penalty += 0.15

    return clamp01(penalty), nearby_reports


def get_weather_score(is_raining, bike_score):
    if not is_raining:
        return 1.0

    if bike_score >= 0.80:
        return 0.75

    if bike_score >= 0.55:
        return 0.55

    return 0.35


def calculate_edge_safety_score(
    G,
    u,
    v,
    edge_data,
    heatmap_values,
    reports,
    is_raining=False,
    hour=None
):
    heatmap_score = get_heatmap_score_for_edge(
        G,
        u,
        v,
        edge_data,
        heatmap_values,
        hour
    )

    bike_score = infer_bike_score(edge_data)
    street_calm_score = infer_street_calm_score(edge_data)

    report_penalty, nearby_reports = get_report_penalty_for_edge(
        G,
        u,
        v,
        edge_data,
        reports
    )

    report_score = 1 - report_penalty

    weather_score = get_weather_score(
        is_raining=is_raining,
        bike_score=bike_score
    )

    safety_score = (
        0.35 * heatmap_score
        + 0.25 * bike_score
        + 0.20 * report_score
        + 0.10 * street_calm_score
        + 0.10 * weather_score
    )

    components = {
        "heatmap_score": heatmap_score,
        "bike_score": bike_score,
        "report_score": report_score,
        "street_calm_score": street_calm_score,
        "weather_score": weather_score,
        "nearby_reports": nearby_reports,
        "report_penalty": report_penalty
    }

    return clamp01(safety_score), components


def add_safe_costs_to_graph(
    G,
    heatmap_values,
    reports,
    is_raining=False,
    hour=None
):
    for u, v, k, data in G.edges(keys=True, data=True):
        length = safe_float(data.get("length"), 1.0)

        safety_score, components = calculate_edge_safety_score(
            G=G,
            u=u,
            v=v,
            edge_data=data,
            heatmap_values=heatmap_values,
            reports=reports,
            is_raining=is_raining,
            hour=hour
        )

        multiplier = 0.35 + 3.65 * (1 - safety_score)
        safe_cost = length * multiplier

        data["safe_score"] = safety_score
        data["safe_cost"] = safe_cost

        data["heatmap_score"] = components["heatmap_score"]
        data["bike_score"] = components["bike_score"]
        data["report_score"] = components["report_score"]
        data["street_calm_score"] = components["street_calm_score"]
        data["weather_score"] = components["weather_score"]
        data["nearby_reports"] = components["nearby_reports"]
        data["report_penalty"] = components["report_penalty"]


def get_best_edge_data(G, u, v, weight="safe_cost"):
    edge_data_dict = G.get_edge_data(u, v)

    if edge_data_dict is None:
        return None

    return min(
        edge_data_dict.values(),
        key=lambda data: safe_float(
            data.get(weight),
            safe_float(data.get("length"), 1.0)
        )
    )


def summarize_route_safety(G, route):
    total_length = 0.0
    weighted_safety = 0.0
    weighted_heatmap = 0.0
    weighted_bike = 0.0
    total_reports = 0

    for u, v in zip(route[:-1], route[1:]):
        data = get_best_edge_data(G, u, v, weight="safe_cost")

        if data is None:
            continue

        length = safe_float(data.get("length"), 1.0)

        total_length += length
        weighted_safety += safe_float(data.get("safe_score"), 0.5) * length
        weighted_heatmap += safe_float(data.get("heatmap_score"), 0.5) * length
        weighted_bike += safe_float(data.get("bike_score"), 0.5) * length
        total_reports += int(data.get("nearby_reports", 0))

    if total_length <= 0:
        return {
            "total_length_m": 0,
            "avg_safe_score": 0,
            "avg_heatmap_score": 0,
            "avg_bike_score": 0,
            "nearby_reports": 0
        }

    return {
        "total_length_m": round(total_length, 2),
        "avg_safe_score": round(weighted_safety / total_length, 3),
        "avg_heatmap_score": round(weighted_heatmap / total_length, 3),
        "avg_bike_score": round(weighted_bike / total_length, 3),
        "nearby_reports": total_reports
    }
