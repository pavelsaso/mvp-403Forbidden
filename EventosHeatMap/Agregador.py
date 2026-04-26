from collections import defaultdict
from Evento import Evento
class Agregador:
    def __init__(self): #Desarrolla un diccionario anidado {tiempo:{ID:numeventos}}
        self.heatmapvalues=defaultdict(lambda:defaultdict(int))
    def add_event(self, event): 
        hour= event.hour
        Zone= event.Zone
        self.heatmapvalues[self.hour][self.Zone]  +=1  
    def get_heatmap_values(self):
        return {
            hour:dict(zones)
            for hour,zones in self.heatmapvalues.items()
        }