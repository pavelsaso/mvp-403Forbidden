import math
class Geo:
    @staticmethod  
    def haversine(lat1: float,lon1:float, lat2:float, lon2: float) -> float : #Funcion que regresa la distancia entre 2 puntos situadas en cierta latitud y longitud en la tierra
        R = 6_371_000
        phi1 = math.radians(lat1)                        # ← radianes de cada punto por separado
        phi2 = math.radians(lat2)
        phi  = math.radians(lat2 - lat1)
        delta= math.radians(lon2 - lon1)
        a = (math.sin(phi / 2) ** 2
             + math.cos(phi1) * math.cos(phi2)           # ← phi1 y phi2 en radianes
             * math.sin(delta / 2) ** 2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
