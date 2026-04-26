from collections import defaultdict

class Agregador:
    def __init__(self): #Desarrolla un diccionario anidado {tiempo:{ID:numeventos}}
        self.heatmapvalues = defaultdict(lambda: defaultdict(int))

    def add_event(self, event): #Funcion que agrega un evento a el diccionario correspondiente al heatmap
        hour = event.hour
        Zone = event.Zone
        self.heatmapvalues[hour][Zone] += 1  #Dentro de heatmapvalues la primera llave es hora, la segunda llave es zona

    def get_heatmap_values(self): #funcion que regresa el diccionario creado
        return {
            hour: dict(zones) #Convierte el defaultdict en un diccionario normal
            for hour, zones in self.heatmapvalues.items()
        }