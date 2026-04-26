from pydantic import BaseModel,Field
class Entrada(BaseModel):
    lat_origen:  float = Field(..., example=19.0631, description="Latitud del punto de origen")
    lon_origen:  float = Field(..., example=-98.3018, description="Longitud del punto de origen")
    lat_destino: float = Field(..., example=19.0558, description="Latitud del punto de destino")
    lon_destino: float = Field(..., example=-98.2836, description="Longitud del punto de destino")
