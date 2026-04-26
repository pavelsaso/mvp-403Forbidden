from datetime import datetime
from Ubicacion import Ubicacion
class Event:
    def __init__(self, ubicacion):       
    self.hour= datetime.now().strftime("%H")
    self.Zone = Ubicacion.getZoneId()
