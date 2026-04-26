from routing import calculate_fast_route

# Coordenadas de prueba aproximadas en Cholula
origin_lat = 19.062516015756998
origin_lng = -98.30551429588895

destination_lat = 19.05096445543167
destination_lng = -98.2795282056814

result = calculate_fast_route(
    origin_lat=origin_lat,
    origin_lng=origin_lng,
    destination_lat=destination_lat,
    destination_lng=destination_lng
)

print("Ruta calculada correctamente")
print("Tiempo estimado:", result["travel_time_minutes"], "min")
print("Nodos en ruta:", result["nodes_count"])
print("Primeras coordenadas GeoJSON:")
print(result["route"]["geometry"]["coordinates"][:5])
