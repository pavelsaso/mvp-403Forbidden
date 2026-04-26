from pydantic import BaseModel
import math
class Ubicacion(BaseModel):
    lat: float #latitud desde json introducida por herencia de BaseModel
    lon : float  #longitud desde json introducida por herencia de BaseModel
    precision : float = 0
    def __init__(self, **kwargs):  #Metodo constructor    
        super().__init__(**kwargs)
        zonemeter_size = 100
        self.precision = zonemeter_size / 111000    
    def getzoneId(self):
        grid_lat= math.floor(self.lat/self.precision)
        grid_lon= math.floor(self.lon/self.precision)
        return f"{grid_lat}_{grid_lon}"

