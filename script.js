let pulseCircles = [];
let map = L.map('map').setView([19.0433,-98.2019],13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'OpenStreetMap'
}).addTo(map);

let userLocation = null;
let userMarker = null;
let destMarker = null;
let routeLine = null;
let heatLayer = null;

let userIcon = L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/64/64113.png',
    iconSize:[35,35]
});

let destIcon = L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize:[35,35]
});

function goToNearestBike(){
    navigator.geolocation.getCurrentPosition(pos=>{
        userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };

        if(userMarker) map.removeLayer(userMarker);

      userMarker = L.marker([userLocation.lat,userLocation.lng],{icon:userIcon}).addTo(map);
        map.setView([userLocation.lat,userLocation.lng],15);

        document.getElementById('iaStatus').innerText = 'Ubicación detectada. IA lista.';

       fetch(`http://127.0.0.1:9000/update?lat=${userLocation.lat}&lon=${userLocation.lng}`,{
    method:'POST'
});

        loadHeatMap();
        loadBikeStations();
    });
}

function activateDestinationSelection(){
    if(!userLocation){
        alert("Primero detecta ubicación");
        return;
    }

    map.once('click',e=>{
        let dest = e.latlng;

        if(destMarker) map.removeLayer(destMarker);
        if(routeLine) map.removeLayer(routeLine);

        destMarker = L.marker([dest.lat,dest.lng],{icon:destIcon}).addTo(map);

        routeLine = L.polyline([
            [userLocation.lat,userLocation.lng],
            [dest.lat,dest.lng]
        ],{color:'blue',weight:5}).addTo(map);

        document.getElementById('iaStatus').innerText = 'Ruta inteligente generada.';
    });
}

function loadBikeStations(){
    fetch('estaciones.json')
    .then(res=>res.json())
    .then(data=>{
        data.forEach(est=>{
            L.marker([est.lat,est.lng]).addTo(map)
            .bindPopup("🚲 "+est.name);
        });
    });
}

function loadHeatMap(){
    document.getElementById('iaStatus').innerText = '🤖 IA analizando densidad urbana en tiempo real...';
    fetch('http://127.0.0.1:9000/heatmap')
    .then(res=>res.json())
    .then(data=>{
        let heatPoints = [];
        let heatList = document.getElementById('heatList');
        heatList.innerHTML='';

const zoneCoordinates = {
    1:[19.053,-98.205], // Juarez
    2:[19.045,-98.200], // Centro
    3:[19.040,-98.190], // 5 de Mayo
    4:[19.065,-98.212], // CAPU
    5:[19.037,-98.190], // Analco
    6:[19.048,-98.193], // Reforma
    7:[19.030,-98.215]  // periferica
};

        pulseCircles.forEach(c=>map.removeLayer(c));
pulseCircles = [];

        for(let hour in data){
            for(let zone in data[hour]){

                let cantidad = data[hour][zone];
                let coords = zoneCoordinates[zone];

                if(coords){
                    heatPoints.push([coords[0], coords[1], cantidad]);
                }

                if(cantidad >= 3){
    let circle = L.circle(coords,{
        radius: cantidad*25,
        color:'red',
        fillColor:'#ff0000',
        fillOpacity:0.25
    }).addTo(map);

    pulseCircles.push(circle);
}

                let li = document.createElement('li');
                li.innerText = `🕒 Hora ${hour} | Zona ${zone} → ${cantidad} personas detectadas`;
                heatList.appendChild(li);
            }
        }

        if(heatLayer) map.removeLayer(heatLayer);

        heatLayer = L.heatLayer(heatPoints,{
            radius:45,
            blur:35,
            maxZoom:17
        }).addTo(map);
        document.getElementById('iaStatus').innerText = '🔥 HeatMap actualizado en vivo.';
    });
}
setInterval(()=>{
   loadHeatMap();
},3600000);