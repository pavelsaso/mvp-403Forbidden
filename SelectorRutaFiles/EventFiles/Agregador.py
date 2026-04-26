from collections import defaultdict
from Evento import Evento
class Agregador:
    def __init__(self): #Desarrolla un diccionario anidado {tiempo:{ID:numeventos}}
        self.heatmapvalues=defaultdict(lambda:defaultdict(int))
    def add_event(self, event): #Funcion que agrega un evento a el diccionario correspondiente al heatmap
        hour= event.hour
        Zone= event.Zone
        self.heatmapvalues[hour][Zone]  +=1  #Esta parte lo agrega(Dentro de heatmap values la primera llave es hora, la segunda llave es zona, el valor se le aumenta 1)
    def get_heatmap_values(self): #funcion que regresa el diccionario creado
        return {
            hour:dict(zones) #Convierte el defaultdict en un diccionario normal, esto para pasarlo a json
            for hour,zones in self.heatmapvalues.items() #
        }