let map;
let stations = [];
let safeCorridors = [];

let userLocation = null;
let userMarker = null;
let destinationMarker = null;
let fastRouteLayer = null;
let recommendedRouteLayer = null;

const SCORE_WEIGHTS = {
  distance: 0.25,
  safety: 0.35,
  cycleCoverage: 0.25,
  intermodality: 0.15
};

// Inicializar mapa
map = L.map("map").setView([19.0605, -98.3040], 14);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Cargar datos
async function loadData() {
  try {
    const response = await fetch("data copy.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar data.json");
    }

    const data = await response.json();

    stations = data.stations || [];
    safeCorridors = data.safe_corridors || [];

    drawStations();
    drawSafeCorridors();

    console.log("Datos cargados correctamente:", data);
  } catch (error) {
    console.error(error);
    alert("Error al cargar data.json. Revisa que estés usando Live Server.");
  }
}

loadData();

// Botón para usar ubicación simulada
document.getElementById("btnUseTestLocation").addEventListener("click", () => {
  userLocation = {
    lat: 19.0622,
    lng: -98.3060
  };

  if (userMarker) {
    map.removeLayer(userMarker);
  }

  userMarker = L.marker([userLocation.lat, userLocation.lng])
    .addTo(map)
    .bindPopup("Ubicación de prueba")
    .openPopup();

  map.setView([userLocation.lat, userLocation.lng], 15);
});

// Click para seleccionar destino
map.on("click", function(e) {
  if (!userLocation) {
    alert("Primero selecciona 'Usar ubicación de prueba'.");
    return;
  }

  const destination = {
    lat: e.latlng.lat,
    lng: e.latlng.lng
  };

  if (destinationMarker) {
    map.removeLayer(destinationMarker);
  }

  destinationMarker = L.marker([destination.lat, destination.lng])
    .addTo(map)
    .bindPopup("Destino seleccionado")
    .openPopup();

  const nearest = findNearestStation(userLocation.lat, userLocation.lng);

  if (!nearest.station) {
    alert("No hay estaciones con bicicletas disponibles.");
    return;
  }

  const station = nearest.station;

  const bestOption = findBestSafeCorridor(
    station,
    destination,
    nearest.distanceKm
  );

  const classification = classifyRoute(bestOption);

  drawFastRoute(station, destination);
  drawRecommendedRoute(station, destination, bestOption, classification);
  showRouteSummary(station, bestOption, classification, nearest.distanceKm);
});

// Dibujar estaciones
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

// Dibujar corredores
function drawSafeCorridors() {
  safeCorridors.forEach(corridor => {
    L.polyline(
      [
        [corridor.start.lat, corridor.start.lng],
        [corridor.end.lat, corridor.end.lng]
      ],
      {
        color: "#2ecc71",
        weight: 5,
        opacity: 0.75,
        dashArray: "8, 8"
      }
    )
      .addTo(map)
      .bindPopup(`
        <strong>${corridor.name}</strong><br>
        Score de seguridad: ${corridor.safety_score}<br>
        ${corridor.description}
      `);
  });
}

// Distancia Haversine
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

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

// Estación más cercana con bicis disponibles
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

// Distancia del corredor
function calculateCorridorDistance(corridor) {
  return haversineDistance(
    corridor.start.lat,
    corridor.start.lng,
    corridor.end.lat,
    corridor.end.lng
  );
}

// D(r): eficiencia de distancia
function calculateDistanceEfficiencyScore(directDistance, recommendedDistance) {
  if (!recommendedDistance || recommendedDistance <= 0) return 0;
  return clamp01(directDistance / recommendedDistance);
}

// S(r): seguridad percibida
function calculatePerceivedSafetyScore(corridor) {
  if (!corridor || corridor.safety_score === undefined) return 0.25;
  return clamp01(corridor.safety_score);
}

// C(r): cobertura ciclista
function calculateCycleCoverageScore(corridorDistance, totalRouteDistance) {
  if (!totalRouteDistance || totalRouteDistance <= 0) return 0;
  return clamp01(corridorDistance / totalRouteDistance);
}

// I(r): intermodalidad
function calculateIntermodalityScore(station, stationDistanceKm) {
  const availabilityScore = clamp01(station.bikes_available / 20);
  const accessScore = clamp01(1 - stationDistanceKm / 2);

  return clamp01(
    availabilityScore * 0.6 +
    accessScore * 0.4
  );
}

// Score global
function calculateRouteScore({
  directDistance,
  recommendedDistance,
  corridorDistance,
  corridor,
  station,
  stationDistanceKm
}) {
  const D = calculateDistanceEfficiencyScore(directDistance, recommendedDistance);
  const S = calculatePerceivedSafetyScore(corridor);
  const C = calculateCycleCoverageScore(corridorDistance, recommendedDistance);
  const I = calculateIntermodalityScore(station, stationDistanceKm);

  const finalScore =
    SCORE_WEIGHTS.distance * D +
    SCORE_WEIGHTS.safety * S +
    SCORE_WEIGHTS.cycleCoverage * C +
    SCORE_WEIGHTS.intermodality * I;

  return {
    finalScore: clamp01(finalScore),
    finalScore100: Math.round(clamp01(finalScore) * 100),
    components: {
      distance: D,
      safety: S,
      cycleCoverage: C,
      intermodality: I
    }
  };
}

// Encontrar mejor corredor con score
function findBestSafeCorridor(station, destination, stationDistanceKm) {
  let bestOption = null;

  const directDistance = haversineDistance(
    station.lat,
    station.lng,
    destination.lat,
    destination.lng
  );

  safeCorridors.forEach(corridor => {
    const corridorDistance = calculateCorridorDistance(corridor);

    const optionA =
      haversineDistance(station.lat, station.lng, corridor.start.lat, corridor.start.lng) +
      corridorDistance +
      haversineDistance(corridor.end.lat, corridor.end.lng, destination.lat, destination.lng);

    const optionB =
      haversineDistance(station.lat, station.lng, corridor.end.lat, corridor.end.lng) +
      corridorDistance +
      haversineDistance(corridor.start.lat, corridor.start.lng, destination.lat, destination.lng);

    const recommendedDistance = Math.min(optionA, optionB);
    const direction = optionA <= optionB ? "start_to_end" : "end_to_start";

    const detourRatio =
      directDistance > 0
        ? (recommendedDistance - directDistance) / directDistance
        : 0;

    const score = calculateRouteScore({
      directDistance,
      recommendedDistance,
      corridorDistance,
      corridor,
      station,
      stationDistanceKm
    });

    const option = {
      corridor,
      directDistance,
      recommendedDistance,
      corridorDistance,
      detourRatio,
      direction,
      score
    };

    if (!bestOption || option.score.finalScore > bestOption.score.finalScore) {
      bestOption = option;
    }
  });

  return bestOption;
}

// Clasificar ruta
function classifyRoute(bestOption) {
  if (!bestOption) {
    return {
      type: "precaution",
      label: "Ruta con precaución",
      color: "#e74c3c",
      message: "No se identificaron corredores seguros cercanos."
    };
  }

  const score = bestOption.score.finalScore;
  const detour = bestOption.detourRatio;
  const coverage = bestOption.score.components.cycleCoverage;

  if (score >= 0.70 && detour <= 0.35 && coverage >= 0.25) {
    return {
      type: "protected",
      label: "Ruta protegida",
      color: "#27ae60",
      message: "La ruta tiene buen score de seguridad, cobertura ciclista y un rodeo aceptable."
    };
  }

  if (score >= 0.50 && detour <= 0.70) {
    return {
      type: "low_exposure",
      label: "Ruta de menor exposición",
      color: "#f39c12",
      message: "La ruta prioriza menor exposición vial, aunque aumenta el trayecto."
    };
  }

  return {
    type: "precaution",
    label: "Ruta con precaución",
    color: "#e74c3c",
    message: "No hay una ruta suficientemente favorable. Se muestra una opción con advertencia."
  };
}

// Dibujar ruta rápida
function drawFastRoute(station, destination) {
  if (fastRouteLayer) {
    map.removeLayer(fastRouteLayer);
  }

  fastRouteLayer = L.polyline(
    [
      [station.lat, station.lng],
      [destination.lat, destination.lng]
    ],
    {
      color: "#3498db",
      weight: 4,
      opacity: 0.6
    }
  ).addTo(map);

  fastRouteLayer.bindPopup("Ruta rápida");
}

// Dibujar ruta recomendada
function drawRecommendedRoute(station, destination, bestOption, classification) {
  if (recommendedRouteLayer) {
    map.removeLayer(recommendedRouteLayer);
  }

  let coordinates;

  if (!bestOption || classification.type === "precaution") {
    coordinates = [
      [station.lat, station.lng],
      [destination.lat, destination.lng]
    ];
  } else {
    const corridor = bestOption.corridor;

    if (bestOption.direction === "start_to_end") {
      coordinates = [
        [station.lat, station.lng],
        [corridor.start.lat, corridor.start.lng],
        [corridor.end.lat, corridor.end.lng],
        [destination.lat, destination.lng]
      ];
    } else {
      coordinates = [
        [station.lat, station.lng],
        [corridor.end.lat, corridor.end.lng],
        [corridor.start.lat, corridor.start.lng],
        [destination.lat, destination.lng]
      ];
    }
  }

  recommendedRouteLayer = L.polyline(coordinates, {
    color: classification.color,
    weight: 6,
    opacity: 0.9
  }).addTo(map);

  recommendedRouteLayer.bindPopup(`
    ${classification.label}<br>
    Score: ${bestOption ? bestOption.score.finalScore100 : 0}/100
  `);

  map.fitBounds(recommendedRouteLayer.getBounds());
}

// Mostrar resultados
function showRouteSummary(station, bestOption, classification, stationDistanceKm) {
  if (!bestOption) {
    document.getElementById("result").innerHTML = `
      <strong>${classification.label}</strong><br>
      ${classification.message}
    `;
    return;
  }

  const score = bestOption.score;
  const components = score.components;

  document.getElementById("result").innerHTML = `
    <strong>${classification.label}</strong><br>
    ${classification.message}<br><br>

    <strong>Score de ruta:</strong> ${score.finalScore100}/100<br><br>

    <strong>Desglose:</strong><br>
    D(r) eficiencia de distancia: ${(components.distance * 100).toFixed(0)}%<br>
    S(r) seguridad percibida: ${(components.safety * 100).toFixed(0)}%<br>
    C(r) cobertura ciclista: ${(components.cycleCoverage * 100).toFixed(0)}%<br>
    I(r) intermodalidad: ${(components.intermodality * 100).toFixed(0)}%<br><br>

    <strong>Estación recomendada:</strong> ${station.name}<br>
    <strong>Bicicletas disponibles:</strong> ${station.bikes_available}<br>
    <strong>Distancia usuario-estación:</strong> ${stationDistanceKm.toFixed(2)} km<br>
    <strong>Corredor evaluado:</strong> ${bestOption.corridor.name}<br>
    <strong>Distancia rápida:</strong> ${bestOption.directDistance.toFixed(2)} km<br>
    <strong>Distancia recomendada:</strong> ${bestOption.recommendedDistance.toFixed(2)} km<br>
    <strong>Rodeo estimado:</strong> ${(bestOption.detourRatio * 100).toFixed(1)}%
  `;
}