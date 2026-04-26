import math
public class Geo{
    def haversine(lat1: float,lon1:float, lat2:float, lon2: float) -> float : #Funcion que regresa la distancia entre 2 puntos situadas en cierta latitud y longitud en la tierra
        R = 6_371_000
        phi= ((lat2-lat1)*(math.pi))/180
        delta= ((lon2-lon1)*(math.pi))/180
        a=(math.sin(phi/2)**2)+ math.cos(lat1)*math.cos(lat2)*(math.sin(delta/2)**2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
}