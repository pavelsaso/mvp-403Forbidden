from flask import Flask, request, jsonify
from flask_cors import CORS

from routing import calculate_fast_route, calculate_safe_route

from safety_state import (
    register_activity,
    get_heatmap_values,
    add_report,
    get_reports,
    HEATMAP_VALUES,
    REPORTS
)


app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "ok",
        "message": "Ruta Segura API funcionando"
    })


@app.route("/route-fast", methods=["POST"])
def route_fast():
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "error": "No se recibió JSON válido."
        }), 400

    required_fields = [
        "origin_lat",
        "origin_lng",
        "destination_lat",
        "destination_lng"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "error": f"Falta el campo: {field}"
            }), 400

    try:
        result = calculate_fast_route(
            origin_lat=float(data["origin_lat"]),
            origin_lng=float(data["origin_lng"]),
            destination_lat=float(data["destination_lat"]),
            destination_lng=float(data["destination_lng"])
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": "Error al calcular ruta rápida.",
            "details": str(e)
        }), 500


@app.route("/route-safe", methods=["POST"])
def route_safe():
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "error": "No se recibió JSON válido."
        }), 400

    required_fields = [
        "origin_lat",
        "origin_lng",
        "destination_lat",
        "destination_lng"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "error": f"Falta el campo: {field}"
            }), 400

    try:
        result = calculate_safe_route(
            origin_lat=float(data["origin_lat"]),
            origin_lng=float(data["origin_lng"]),
            destination_lat=float(data["destination_lat"]),
            destination_lng=float(data["destination_lng"]),
            heatmap_values=HEATMAP_VALUES,
            reports=REPORTS,
            is_raining=bool(data.get("is_raining", False)),
            hour=data.get("hour")
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": "Error al calcular ruta segura.",
            "details": str(e)
        }), 500


@app.route("/activity", methods=["POST"])
def activity():
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "error": "No se recibió JSON válido."
        }), 400

    required_fields = ["lat", "lng"]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "error": f"Falta el campo: {field}"
            }), 400

    try:
        result = register_activity(
            lat=float(data["lat"]),
            lng=float(data["lng"]),
            hour=data.get("hour")
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": "Error al registrar actividad urbana.",
            "details": str(e)
        }), 500


@app.route("/heatmap", methods=["GET"])
def heatmap():
    try:
        return jsonify(get_heatmap_values())

    except Exception as e:
        return jsonify({
            "error": "Error al obtener heatmap.",
            "details": str(e)
        }), 500


@app.route("/report", methods=["POST"])
def report():
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "error": "No se recibió JSON válido."
        }), 400

    required_fields = ["type", "lat", "lng"]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "error": f"Falta el campo: {field}"
            }), 400

    try:
        result = add_report(
            report_type=str(data["type"]),
            lat=float(data["lat"]),
            lng=float(data["lng"])
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": "Error al registrar reporte ciudadano.",
            "details": str(e)
        }), 500


@app.route("/reports", methods=["GET"])
def reports():
    try:
        return jsonify(get_reports())

    except Exception as e:
        return jsonify({
            "error": "Error al obtener reportes.",
            "details": str(e)
        }), 500


@app.route("/debug-state", methods=["GET"])
def debug_state():
    """
    Endpoint opcional para revisar el estado actual del backend:
    heatmap y reportes cargados en memoria.
    """
    try:
        return jsonify({
            "heatmap": get_heatmap_values(),
            "reports": get_reports(),
            "total_reports": len(REPORTS)
        })

    except Exception as e:
        return jsonify({
            "error": "Error al obtener estado interno.",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )