from datetime import datetime
from Ubicacion import Ubicacion #Se necesita crear un objeto ubicacion para obtener la ID del evento
class Event:
    def __init__(self, ubicacion: Ubicacion):   #COnstructor,    ubicacion solo indica que Ubicacion debe ser tipo Ubicacion 
        self.ubicacion= ubicacion #Crea el objeto ubicacion y posteriormente obtiene el id
        self.hour= datetime.now().strftime("%H") #Guarda tiempo actual en horas
        self.Zone = Ubicacion.getZoneId() #Obtiene el ID de la ubicacion actual
        
