class Ubicacion:
    def __init__(self, lat, lon):
        self.lat = lat
        self.lon = lon

    def getZoneId(self):

        # Avenida Juarez
        if 19.050 <= self.lat <= 19.055 and -98.210 <= self.lon <= -98.200:
            return 1

        # Centro Historico
        elif 19.040 <= self.lat <= 19.050 and -98.205 <= self.lon <= -98.195:
            return 2

        # Blvd 5 de Mayo
        elif 19.035 <= self.lat <= 19.045 and -98.200 <= self.lon <= -98.185:
            return 3

        # CAPU
        elif 19.060 <= self.lat <= 19.070 and -98.220 <= self.lon <= -98.205:
            return 4

        # Analco
        elif 19.035 <= self.lat <= 19.040 and -98.195 <= self.lon <= -98.185:
            return 5

        # Reforma
        elif 19.045 <= self.lat <= 19.052 and -98.198 <= self.lon <= -98.188:
            return 6

        else:
            return 7