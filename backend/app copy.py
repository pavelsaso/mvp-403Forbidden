from flask import Flask, request, jsonify
from flask_cors import CORS
from routing import calculate_fast_route

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return {
        "status": "ok",
        "message": "Ruta Segura API funcionando"
    }


@app.route("/route-fast", methods=["POST"])
def route_fast():
    data = request.get_json()

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
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
    