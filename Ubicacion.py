from pydantic import BaseModel
import math
class Ubicacion(BaseModel):
    lat: float
    lon : float  
    def __init__(self, **data):      
        super().__init__(**data)
        zonemeter_size = 100
        self.precision = zonemeter_size / 111000    
    def getzoneId(self):
        grid_lat= math.floor(self.lat/self.precision)
        grid_lon= math.floor(self.lon/self.precision)
        return f"{grid_lat}_{grid_lon}"

