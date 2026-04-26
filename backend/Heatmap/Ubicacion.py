from pydantic import BaseModel
import math
class Ubicacion(BaseModel):
    lat: float #latitud desde json introducida por herencia de BaseModel
    lon : float  #longitud desde json introducida por herencia de BaseModel
    precision : float = 0
    def __init__(self, **kwargs):  #Metodo constructor  
        super().__init__(**kwargs)
        zonemeter_size = 100
        self.precision = zonemeter_size / 111000   #Medida del largo de un cuadrito en grados
    def getzoneId(self): #Metodo que devuelve el ID de cada zona basado en latitud y longitud
        grid_lat= math.floor(self.lat/self.precision) #Distancia de grados entre medida de cada cuadrito, cantidad de cuadritos en los grados evaluados
        grid_lon= math.floor(self.lon/self.precision)
        return f"{grid_lat}_{grid_lon}" #Regresa texto con el ID de cada zone(Cantidad de cuadritos en x y en y)