from collections import defaultdict
from datetime import datetime
import math


ZONE_METER_SIZE = 100
DEGREES_PER_METER = 1 / 111000

HEATMAP_VALUES = defaultdict(lambda: defaultdict(int))
REPORTS = []


def get_current_hour():
    return datetime.now().strftime("%H")


def get_zone_id(lat, lng, zone_meter_size=ZONE_METER_SIZE):
    precision = zone_meter_size * DEGREES_PER_METER

    grid_lat = math.floor(float(lat) / precision)
    grid_lng = math.floor(float(lng) / precision)

    return f"{grid_lat}_{grid_lng}"


def register_activity(lat, lng, hour=None):
    if hour is None:
        hour = get_current_hour()

    zone_id = get_zone_id(lat, lng)

    HEATMAP_VALUES[hour][zone_id] += 1

    return {
        "status": "ok",
        "hour": hour,
        "zone": zone_id,
        "value": HEATMAP_VALUES[hour][zone_id]
    }


def get_heatmap_values():
    return {
        hour: dict(zones)
        for hour, zones in HEATMAP_VALUES.items()
    }


def add_report(report_type, lat, lng):
    report = {
        "type": str(report_type),
        "lat": float(lat),
        "lng": float(lng),
        "hour": get_current_hour()
    }

    REPORTS.append(report)

    return {
        "status": "ok",
        "report": report,
        "total_reports": len(REPORTS)
    }


def get_reports():
    return REPORTS