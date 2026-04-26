from datetime import datetime
from Ubicacion import Ubicacion

class Event:
    def __init__(self, ubicacion: Ubicacion): #Constructor
        self.ubicacion = ubicacion
        self.hour = datetime.now().strftime("%H") #Guarda tiempo actual en horas
        self.Zone = ubicacion.getZoneId() #Obtiene ID de ubicacion actual