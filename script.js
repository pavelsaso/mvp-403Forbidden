// ================================
// SMART URBAN BIKE AI SYSTEM
// ================================

const cityData = {
    reports: JSON.parse(localStorage.getItem('reports')) || [],
    stations: [
        {id:1,name:'Centro de San Pedro Cholula',lat:19.062516,lng:-98.305514,bikes_available:20,status:'Activa'},
        {id:2,name:'Pirámide de Cholula',lat:19.059045,lng:-98.304139,bikes_available:15,status:'Activa'},
        {id:3,name:'Universidad UDLAP',lat:19.050964,lng:-98.279528,bikes_available:10,status:'Activa'},
        {id:4,name:'5 de Mayo',lat:19.059548,lng:-98.294395,bikes_available:5,status:'Baja disponibilidad'},
        {id:5,name:'Santiago Mixquitla',lat:19.073532,lng:-98.302330,bikes_available:13,status:'Activa'},
        {id:6,name:'Santa Maria Xixitla',lat:19.060891,lng:-98.318601,status:'Sin bicicletas',bikes_available:0},
        {id:7,name:'Santa Bárbara Almoloya',lat:19.098581,lng:-98.306080,bikes_available:12,status:'Activa'}
    ],
    safe_corridors: [
        {
            id:1,
            start:{lat:19.056911,lng:-98.292057},
            end:{lat:19.063784,lng:-98.333018},
            safety_score:0.85
        },
        {
            id:2,
            start:{lat:19.065432,lng:-98.300981},
            end:{lat:19.055210,lng:-98.265874},
            safety_score:0.60
        },
        {
            id:3,
            start:{lat:19.060522,lng:-98.302615},
            end:{lat:19.061905,lng:-98.294113},
            safety_score:0.40
        }
    ]
};

let map = L.map('map').setView([19.0625,-98.30],13);

let navigationInfo = {
    origin:"Tu ubicación",
    station:"---",
    destination:"---",
    total:"---"
};

let fastRouteLayer = null;
let recommendedRouteLayer = null;
let heatLayer = null;
let routeToBike = null;
let userMarker = null;
let userLocation = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'©OpenStreetMap'
}).addTo(map);

// ================================
// ICONOS
// ================================

const bikeIcon = L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    iconSize:[40,40],
    className:'pulse-bike'
});

const userWalkIcon = L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
    iconSize:[42,42],
    className:'pulse-user'
});

const bacheIcon = L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/565/565547.png',
    iconSize:[30,30],
    className:'pulse-alert'
});

const accidentIcon = L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/296/296216.png',
    iconSize:[30,30],
    className:'pulse-alert'
});

const semaforoIcon = L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/2972/2972517.png',
    iconSize:[30,30],
    className:'pulse-alert'
});

// ================================
// CLIMA
// ================================

async function loadWeather(){
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=19.06&longitude=-98.30&current=temperature_2m,precipitation_probability');
    const d = await r.json();

    document.getElementById('temp').innerText = d.current.temperature_2m + "°C";
    document.getElementById('rain').innerText = d.current.precipitation_probability + "%";
    document.getElementById('iaStatus').innerText = "IA monitoreando clima y movilidad";
}

// ================================
// ESTACIONES
// ================================

function loadStations(){
    let total = 0;

    cityData.stations.forEach(st=>{
        total += st.bikes_available;

        L.marker([st.lat,st.lng],{icon:bikeIcon})
        .addTo(map)
        .bindPopup(`<b>🚲 ${st.name}</b><br>Bicicletas: ${st.bikes_available}<br>Estado: ${st.status}`);
    });

    document.getElementById('bikes').innerText = total;
}

// ================================
// CORREDORES SEGUROS VISUALES
// ================================

function loadBikeRoutes(){
    cityData.safe_corridors.forEach(c=>{
        L.Routing.control({
            waypoints:[
                L.latLng(c.start.lat,c.start.lng),
                L.latLng(c.end.lat,c.end.lng)
            ],
            lineOptions:{
                styles:[{
                    color:'#00cc66',
                    weight:5,
                    opacity:0.45
                }]
            },
            addWaypoints:false,
            draggableWaypoints:false,
            fitSelectedRoutes:false,
            show:false,
            createMarker:()=>null
        }).addTo(map);
    });
}

// ================================
// REPORTES
// ================================

function loadReports(){
    cityData.reports.forEach(r=>{
        let iconUse = r.type === 'Bache' ? bacheIcon :
                      r.type === 'Accidente' ? accidentIcon :
                      semaforoIcon;

        L.marker([r.lat,r.lng],{icon:iconUse})
        .addTo(map)
        .bindPopup("⚠ Reporte: " + r.type);
    });
}

function sendReport(type){
    navigator.geolocation.getCurrentPosition((pos)=>{
        cityData.reports.push({
            type:type,
            lat:pos.coords.latitude,
            lng:pos.coords.longitude
        });

        localStorage.setItem('reports',JSON.stringify(cityData.reports));
        location.reload();
    });
}

// ================================
// HEATMAP
// ================================

function toggleHeatMap(){
    if(heatLayer){
        map.removeLayer(heatLayer);
        heatLayer = null;
        return;
    }

    let points = cityData.reports.map(r=>[r.lat,r.lng,1]);

    heatLayer = L.heatLayer(points,{
        radius:30,
        blur:18
    }).addTo(map);
}

// ================================
// FUNCIONES IA
// ================================

function haversineDistance(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;

    const a =
        Math.sin(dLat/2)**2 +
        Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
        Math.sin(dLon/2)**2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function findNearestStation(lat,lng){
    let nearest = null;
    let min = Infinity;

    cityData.stations.forEach(st=>{
        if(st.bikes_available > 0){
            let d = haversineDistance(lat,lng,st.lat,st.lng);
            if(d < min){
                min = d;
                nearest = st;
            }
        }
    });

    return {station:nearest,distance:min};
}

function findBestSafeCorridor(station,destination){
    let bestOption = null;

    const directDistance = haversineDistance(station.lat,station.lng,destination.lat,destination.lng);

    cityData.safe_corridors.forEach(corridor=>{

        const corridorDistance = haversineDistance(
            corridor.start.lat,corridor.start.lng,
            corridor.end.lat,corridor.end.lng
        );

        const optionA =
            haversineDistance(station.lat,station.lng,corridor.start.lat,corridor.start.lng) +
            corridorDistance +
            haversineDistance(corridor.end.lat,corridor.end.lng,destination.lat,destination.lng);

        const optionB =
            haversineDistance(station.lat,station.lng,corridor.end.lat,corridor.end.lng) +
            corridorDistance +
            haversineDistance(corridor.start.lat,corridor.start.lng,destination.lat,destination.lng);

        const bestDistance = Math.min(optionA,optionB);
        const detourRatio = (bestDistance-directDistance)/directDistance;

        if(!bestOption || (corridor.safety_score-detourRatio) > (bestOption.corridor.safety_score-bestOption.detourRatio)){
            bestOption = {
                corridor:corridor,
                totalDistance:bestDistance,
                detourRatio:detourRatio,
                direction: optionA < optionB ? "start_to_end" : "end_to_start"
            };
        }
    });

    return bestOption;
}

function classifyRoute(bestOption){
    if(!bestOption){
        return {type:"precaution",label:"Ruta con precaución",color:"#e74c3c",message:"No hay corredores seguros cercanos."};
    }

    const detour = bestOption.detourRatio;
    const safety = bestOption.corridor.safety_score;

    if(detour <= 0.35 && safety >= 0.65){
        return {type:"protected",label:"Ruta protegida",color:"#27ae60",message:"Infraestructura ciclista segura."};
    }

    if(detour <= 0.70 && safety >= 0.45){
        return {type:"low_exposure",label:"Ruta de menor exposición",color:"#f39c12",message:"Menor exposición a zonas riesgosas."};
    }

    return {type:"precaution",label:"Ruta con precaución",color:"#e74c3c",message:"Circular con atención."};
}

// ================================
// IR A BICI MÁS CERCANA
// ================================

function goToNearestBike(){
    navigator.geolocation.getCurrentPosition((pos)=>{

        userLocation = {
            lat:pos.coords.latitude,
            lng:pos.coords.longitude
        };

        let user = L.latLng(userLocation.lat,userLocation.lng);

        if(userMarker) map.removeLayer(userMarker);

        userMarker = L.marker(user,{icon:userWalkIcon})
        .addTo(map)
        .bindPopup("🚶 Tú estás aquí")
        .openPopup();

        const nearest = findNearestStation(userLocation.lat,userLocation.lng).station;

        if(routeToBike) map.removeControl(routeToBike);

        routeToBike = L.Routing.control({
            waypoints:[user,L.latLng(nearest.lat,nearest.lng)],
            lineOptions:{styles:[{color:'blue',weight:6}]},
            addWaypoints:false,
            draggableWaypoints:false,
            createMarker:()=>null
        }).addTo(map);

        let meters = map.distance(user,L.latLng(nearest.lat,nearest.lng));
        let walkMinutes = Math.round(meters/80);

        document.getElementById('walkTime').innerText = walkMinutes + " min";
        document.getElementById('nearestStation').innerText = nearest.name;

        navigationInfo.station = nearest.name;
        updateBottomNav();
    });
}

// ================================
// DIBUJAR RUTAS IA
// ================================

function drawFastRoute(station,destination){
    if(fastRouteLayer) map.removeLayer(fastRouteLayer);

    fastRouteLayer = L.polyline([
        [station.lat,station.lng],
        [destination.lat,destination.lng]
    ],{
        color:"#3498db",
        weight:4,
        opacity:0.5,
        dashArray:"8,8"
    }).addTo(map);
}

function drawRecommendedRoute(station,destination,bestOption,classification){
    if(recommendedRouteLayer) map.removeLayer(recommendedRouteLayer);

    let coordinates;

    if(!bestOption){
        coordinates = [[station.lat,station.lng],[destination.lat,destination.lng]];
    }else{
        const c = bestOption.corridor;

        coordinates = bestOption.direction === "start_to_end"
            ? [[station.lat,station.lng],[c.start.lat,c.start.lng],[c.end.lat,c.end.lng],[destination.lat,destination.lng]]
            : [[station.lat,station.lng],[c.end.lat,c.end.lng],[c.start.lat,c.start.lng],[destination.lat,destination.lng]];
    }

    recommendedRouteLayer = L.polyline(coordinates,{
        color:classification.color,
        weight:7,
        opacity:0.9
    }).addTo(map);
}

// ================================
// DESTINO CON CLICK
// ================================

function activateDestinationSelection(){
    alert("Haz clic en el mapa para seleccionar tu destino.");

    map.once("click",function(e){

        if(!userLocation){
            alert("Primero busca una bici cercana.");
            return;
        }

        const destination = {
            lat:e.latlng.lat,
            lng:e.latlng.lng
        };

        const station = findNearestStation(userLocation.lat,userLocation.lng).station;

        const bestOption = findBestSafeCorridor(station,destination);
        const classification = classifyRoute(bestOption);

        drawFastRoute(station,destination);
        drawRecommendedRoute(station,destination,bestOption,classification);

        document.getElementById('iaStatus').innerText = classification.label + " - " + classification.message;
        navigationInfo.station = station.name;
        navigationInfo.destination = "Destino seleccionado";
        navigationInfo.total = Math.round(bestOption.totalDistance * 4) + " min";
        updateBottomNav();
    });
}

// ================================
// PANEL IA
// ================================

function analyzeUrbanData(){
    document.getElementById('reportsCount').innerText = cityData.reports.length;
    document.getElementById('stationsCount').innerText = cityData.stations.length;
    document.getElementById('corridorsCount').innerText = cityData.safe_corridors.length;
}

function updateBottomNav(){
    document.getElementById('navStation').innerText = navigationInfo.station;
    document.getElementById('navDestination').innerText = navigationInfo.destination;
    document.getElementById('navTotal').innerText = navigationInfo.total;
}

// ================================
// START
// ================================

loadWeather();
loadStations();
loadBikeRoutes();
loadReports();
analyzeUrbanData();