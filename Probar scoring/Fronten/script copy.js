// =====================================================
// CONFIGURACIÓN GENERAL
// =====================================================
const API_BASE_URL = "http://127.0.0.1:5000";

let map;
let stations = [];
let safeCorridors = [];

let userLocation = null;
let userMarker = null;
let destinationMarker = null;

let fastRouteLayer = null;
let safeRouteLayer = null;
let corridorLayers = [];


// =====================================================
// INICIALIZAR MAPA
// =====================================================
map = L.map("map").setView([19.0605, -98.3040], 14);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);


// =====================================================
// CARGAR DATOS LOCALES: ESTACIONES Y CORREDORES
// =====================================================
async function loadData() {
  try {
    const response = await fetch("data copy.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar data copy.json");
    }

    const data = await response.json();

    stations = data.stations || [];
    safeCorridors = data.safe_corridors || [];

    drawStations();

    // Dibuja corredores usando el backend/grafo.
    // Si falla el backend, dibuja línea recta como respaldo.
    drawSafeCorridors();

    console.log("Datos cargados correctamente:", data);

  } catch (error) {
    console.error("Error cargando datos:", error);
    alert("Error al cargar data copy.json. Revisa que estés usando Live Server y que el archivo exista.");
  }
}

loadData();


// =====================================================
// BOTÓN: USAR UBICACIÓN REAL DEL USUARIO
// =====================================================
document.getElementById("btnUseUserLocation").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no permite geolocalización.");
    return;
  }

  setStatus("Obteniendo ubicación real...");

  navigator.geolocation.getCurrentPosition(
    position => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setUserMarker(userLocation, "Tu ubicación actual");

      map.setView([userLocation.lat, userLocation.lng], 15);

      sendActivity(userLocation.lat, userLocation.lng);

      setStatus(
        `Ubicación registrada: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
      );
    },
    error => {
      console.error("Error obteniendo ubicación:", error);
      alert("No se pudo obtener tu ubicación. Puedes usar la ubicación de prueba.");
      setStatus("No se pudo obtener ubicación real.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
});


// =====================================================
// BOTÓN: USAR UBICACIÓN DE PRUEBA
// =====================================================
document.getElementById("btnUseTestLocation").addEventListener("click", () => {
  userLocation = {
    lat: 19.0622,
    lng: -98.3060
  };

  setUserMarker(userLocation, "Ubicación de prueba");

  map.setView([userLocation.lat, userLocation.lng], 15);

  sendActivity(userLocation.lat, userLocation.lng);

  setStatus(
    `Ubicación de prueba registrada: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
  );
});


// =====================================================
// CLIC EN MAPA: SELECCIONAR DESTINO Y CALCULAR RUTAS
// =====================================================
map.on("click", async function(e) {
  if (!userLocation) {
    alert("Primero selecciona tu ubicación real o usa la ubicación de prueba.");
    return;
  }

  const destination = {
    lat: e.latlng.lat,
    lng: e.latlng.lng
  };

  setDestinationMarker(destination);

  const nearest = findNearestStation(userLocation.lat, userLocation.lng);

  if (!nearest.station) {
    alert("No hay estaciones con bicicletas disponibles.");
    return;
  }

  const station = nearest.station;

  const origin = {
    lat: station.lat,
    lng: station.lng
  };

  const isRaining = getRainStatus();

  await calculateAndDrawRoutes(
    origin,
    destination,
    isRaining,
    station,
    nearest.distanceKm
  );
});


// =====================================================
// MARCADORES
// =====================================================
function setUserMarker(location, popupText) {
  if (userMarker) {
    map.removeLayer(userMarker);
  }

  userMarker = L.marker([location.lat, location.lng])
    .addTo(map)
    .bindPopup(popupText)
    .openPopup();
}


function setDestinationMarker(destination) {
  if (destinationMarker) {
    map.removeLayer(destinationMarker);
  }

  destinationMarker = L.marker([destination.lat, destination.lng])
    .addTo(map)
    .bindPopup("Destino seleccionado")
    .openPopup();
}


// =====================================================
// DIBUJAR ESTACIONES
// =====================================================
function drawStations() {
  stations.forEach(station => {
    const markerColor = station.bikes_available > 0 ? "blue" : "gray";

    L.circleMarker([station.lat, station.lng], {
      radius: 8,
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.8
    })
      .addTo(map)
      .bindPopup(`
        <strong>${station.name}</strong><br>
        Bicicletas disponibles: ${station.bikes_available}
      `);
  });
}


// =====================================================
// DIBUJAR CORREDORES / CICLOVÍAS
// =====================================================
// Esta función intenta dibujar los corredores usando el backend/grafo.
// Si el backend falla, dibuja línea recta como respaldo.
async function drawSafeCorridors() {
  clearCorridorLayers();

  for (const corridor of safeCorridors) {
    try {
      const response = await fetch(`${API_BASE_URL}/route-fast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          origin_lat: corridor.start.lat,
          origin_lng: corridor.start.lng,
          destination_lat: corridor.end.lat,
          destination_lng: corridor.end.lng
        })
      });

      if (!response.ok) {
        throw new Error("No se pudo calcular corredor con backend.");
      }

      const routeData = await response.json();

      const layer = L.geoJSON(routeData.route, {
        style: {
          color: "#2ecc71",
          weight: 5,
          opacity: 0.75,
          dashArray: "8, 8"
        }
      })
        .addTo(map)
        .bindPopup(`
          <strong>${corridor.name}</strong><br>
          Score de seguridad: ${corridor.safety_score}<br>
          ${corridor.description}
        `);

      corridorLayers.push(layer);

    } catch (error) {
      console.warn("No se pudo dibujar corredor con grafo. Se dibuja línea recta:", error);

      const fallbackLayer = L.polyline(
        [
          [corridor.start.lat, corridor.start.lng],
          [corridor.end.lat, corridor.end.lng]
        ],
        {
          color: "#2ecc71",
          weight: 5,
          opacity: 0.5,
          dashArray: "8, 8"
        }
      )
        .addTo(map)
        .bindPopup(`
          <strong>${corridor.name}</strong><br>
          Score de seguridad: ${corridor.safety_score}<br>
          ${corridor.description}<br>
          <em>Visualización aproximada.</em>
        `);

      corridorLayers.push(fallbackLayer);
    }
  }
}


function clearCorridorLayers() {
  corridorLayers.forEach(layer => {
    map.removeLayer(layer);
  });

  corridorLayers = [];
}


// =====================================================
// DISTANCIA HAVERSINE
// =====================================================
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


// =====================================================
// ENCONTRAR ESTACIÓN MÁS CERCANA CON BICIS
// =====================================================
function findNearestStation(userLat, userLng) {
  let nearestStation = null;
  let shortestDistance = Infinity;

  stations.forEach(station => {
    if (station.bikes_available <= 0) return;

    const distance = haversineDistance(
      userLat,
      userLng,
      station.lat,
      station.lng
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestStation = station;
    }
  });

  return {
    station: nearestStation,
    distanceKm: shortestDistance
  };
}


// =====================================================
// CONEXIÓN CON BACKEND: PEDIR RUTA RÁPIDA Y SEGURA
// =====================================================
async function getRoutesFromBackend(origin, destination, isRaining = false) {
  const response = await fetch(`${API_BASE_URL}/routes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      is_raining: isRaining
    })
  });

  if (!response.ok) {
    let errorData = {};

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        details: "El backend respondió con error no JSON."
      };
    }

    console.error("Error del backend:", errorData);
    throw new Error(errorData.details || "No se pudieron calcular las rutas.");
  }

  return await response.json();
}


// =====================================================
// DIBUJAR RUTA RÁPIDA
// =====================================================
function drawFastRouteOnMap(routeData) {
  if (fastRouteLayer) {
    map.removeLayer(fastRouteLayer);
  }

  fastRouteLayer = L.geoJSON(routeData.route, {
    style: {
      color: "#3498db",
      weight: 5,
      opacity: 0.75
    }
  }).addTo(map);

  fastRouteLayer.bindPopup(`
    <strong>Ruta rápida</strong><br>
    Tiempo estimado: ${routeData.travel_time_minutes} min
  `);
}


// =====================================================
// DIBUJAR RUTA SEGURA
// =====================================================
function drawSafeRouteOnMap(routeData) {
  if (safeRouteLayer) {
    map.removeLayer(safeRouteLayer);
  }

  safeRouteLayer = L.geoJSON(routeData.route, {
    style: {
      color: "#27ae60",
      weight: 6,
      opacity: 0.95
    }
  }).addTo(map);

  const summary = routeData.safety_summary;

  safeRouteLayer.bindPopup(`
    <strong>Ruta segura</strong><br>
    Score seguridad: ${summary.avg_safe_score}<br>
    Heatmap: ${summary.avg_heatmap_score}<br>
    Compatibilidad ciclista: ${summary.avg_bike_score}<br>
    Reportes cercanos: ${summary.nearby_reports}<br>
    Distancia: ${(summary.total_length_m / 1000).toFixed(2)} km
  `);

  map.fitBounds(safeRouteLayer.getBounds());
}


// =====================================================
// FLUJO PRINCIPAL: CALCULAR Y DIBUJAR RUTAS
// =====================================================
async function calculateAndDrawRoutes(origin, destination, isRaining, station, stationDistanceKm) {
  try {
    setResult("Calculando rutas con backend...");

    const routes = await getRoutesFromBackend(
      origin,
      destination,
      isRaining
    );

    drawFastRouteOnMap(routes.fast);
    drawSafeRouteOnMap(routes.safe);

    updateBackendRouteSummary(
      routes.fast,
      routes.safe,
      station,
      stationDistanceKm,
      isRaining
    );

    console.log("Ruta rápida:", routes.fast);
    console.log("Ruta segura:", routes.safe);

  } catch (error) {
    console.error("Error calculando rutas:", error);

    setResult(`
      <strong>Error al calcular rutas</strong><br>
      Verifica que el backend esté corriendo en:<br>
      ${API_BASE_URL}
    `);

    alert("No se pudieron calcular las rutas. Revisa que el backend esté corriendo.");
  }
}


// =====================================================
// MOSTRAR RESUMEN EN PANEL
// =====================================================
function updateBackendRouteSummary(fastRoute, safeRoute, station, stationDistanceKm, isRaining) {
  const summary = safeRoute.safety_summary;

  setResult(`
    <strong>Comparación de rutas</strong><br><br>

    <strong style="color:#3498db;">Ruta rápida</strong><br>
    Tiempo estimado: ${fastRoute.travel_time_minutes} min<br><br>

    <strong style="color:#27ae60;">Ruta segura</strong><br>
    Distancia: ${(summary.total_length_m / 1000).toFixed(2)} km<br>
    Score de seguridad: ${summary.avg_safe_score}<br>
    Actividad urbana / heatmap: ${summary.avg_heatmap_score}<br>
    Compatibilidad ciclista: ${summary.avg_bike_score}<br>
    Reportes cercanos: ${summary.nearby_reports}<br>
    Condición lluvia: ${isRaining ? "Sí" : "No"}<br><br>

    <strong>Estación recomendada:</strong><br>
    ${station.name}<br>
    <strong>Bicicletas disponibles:</strong> ${station.bikes_available}<br>
    <strong>Distancia usuario-estación:</strong> ${stationDistanceKm.toFixed(2)} km<br><br>

    <strong>Interpretación:</strong><br>
    La ruta azul prioriza tiempo. La ruta verde prioriza menor exposición urbana considerando actividad, compatibilidad ciclista, reportes y clima.
  `);
}


// =====================================================
// HEATMAP: REGISTRAR ACTIVIDAD
// =====================================================
async function sendActivity(lat, lng) {
  try {
    const response = await fetch(`${API_BASE_URL}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lat: lat,
        lng: lng
      })
    });

    const data = await response.json();
    console.log("Actividad registrada:", data);

  } catch (error) {
    console.error("Error registrando actividad:", error);
  }
}


// =====================================================
// REPORTES CIUDADANOS: BACHE / ACCIDENTE
// =====================================================
async function sendReport(type) {
  if (!userLocation) {
    alert("Primero selecciona tu ubicación real o usa la ubicación de prueba.");
    return;
  }

  const report = {
    type: type,
    lat: userLocation.lat,
    lng: userLocation.lng
  };

  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(report)
    });

    const data = await response.json();

    console.log("Reporte enviado:", data);

    alert(`${type} reportado correctamente. La próxima ruta segura tomará este reporte en cuenta.`);

  } catch (error) {
    console.error("Error enviando reporte:", error);
    alert("No se pudo enviar el reporte al backend.");
  }
}


// =====================================================
// UTILIDADES DE UI
// =====================================================
function setResult(html) {
  const resultElement = document.getElementById("result");

  if (resultElement) {
    resultElement.innerHTML = html;
  }
}


function setStatus(text) {
  const statusElement = document.getElementById("statusText");

  if (statusElement) {
    statusElement.innerHTML = text;
  }
}


function getRainStatus() {
  const rainCheckbox = document.getElementById("rainCheckbox");

  if (!rainCheckbox) {
    return false;
  }

  return rainCheckbox.checked;
}