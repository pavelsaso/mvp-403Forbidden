from collections import defaultdict
class Agregador:
    def __init__(self):
        self.heatmapvalues=defaultdict(lambda:defaultdict(int))
    def add_event(self, event):
        self.hour= event.hour
        self.Zone= event.Zone
        self.heatmapvalues[self.hour][self.Zone]  +=1  
    def get_heatmap_values(self):
        return {
            hour:dict(zones)
            for hour,zones in self.heatmapvalues.items()
        }