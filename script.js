const cityData={
reports:JSON.parse(localStorage.getItem('reports'))||[],
stations:[
{id:1,name:'San Pedro Cholula',lat:19.0625,lng:-98.3055},
{id:2,name:'UDLAP',lat:19.0510,lng:-98.2795},
{id:3,name:'Pirámide',lat:19.0590,lng:-98.3041}
],
nodes:[
{id:'A',lat:19.0625,lng:-98.3055},
{id:'B',lat:19.0600,lng:-98.2950},
{id:'C',lat:19.0580,lng:-98.2870},
{id:'D',lat:19.0540,lng:-98.2800},
{id:'E',lat:19.0510,lng:-98.2795},
{id:'F',lat:19.0640,lng:-98.3150},
{id:'G',lat:19.0680,lng:-98.3000}
],
edges:[
['A','B'],['B','C'],['C','D'],['D','E'],['A','F'],['F','G'],['G','B']
]};

let map=L.map('map').setView([19.060,-98.295],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let userLocation=null,userMarker=null,destMarker=null,heatLayer=null,currentRoute=null;

const bikeIcon=L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',iconSize:[36,36],iconAnchor:[18,18],className:'pulse'});
const userIcon=L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',iconSize:[36,36],iconAnchor:[18,18],className:'pulse'});
const destIcon=L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/512/854/854878.png',iconSize:[34,34],iconAnchor:[17,17],className:'pulse'});

function hav(a,b,c,d){const R=6371;const d1=(c-a)*Math.PI/180;const d2=(d-b)*Math.PI/180;const x=Math.sin(d1/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(d2/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}

function riskPenalty(lat,lng){
 let p=0;
 cityData.reports.forEach(r=>{ if(hav(lat,lng,r.lat,r.lng)<0.5)p+=2; });
 return p;
}

function buildGraph(){
 let graph={};
 cityData.nodes.forEach(n=>graph[n.id]=[]);
 cityData.edges.forEach(e=>{
   const n1=cityData.nodes.find(n=>n.id===e[0]);
   const n2=cityData.nodes.find(n=>n.id===e[1]);
   const dist=hav(n1.lat,n1.lng,n2.lat,n2.lng);
   const weight=dist + riskPenalty((n1.lat+n2.lat)/2,(n1.lng+n2.lng)/2);
   graph[e[0]].push({node:e[1],weight});
   graph[e[1]].push({node:e[0],weight});
   L.polyline([[n1.lat,n1.lng],[n2.lat,n2.lng]],{color:'#7CFFB2',weight:3,opacity:.35}).addTo(map);
 });
 return graph;
}
const graph=buildGraph();

function nearestNode(lat,lng){
 let min=Infinity,id=null;
 cityData.nodes.forEach(n=>{let d=hav(lat,lng,n.lat,n.lng);if(d<min){min=d;id=n.id;}});
 return id;
}

function dijkstra(start,end){
 let dist={},prev={},q=new Set();
 Object.keys(graph).forEach(n=>{dist[n]=Infinity;q.add(n);});
 dist[start]=0;
 while(q.size){
   let u=[...q].reduce((a,b)=>dist[a]<dist[b]?a:b);
   q.delete(u);
   if(u===end)break;
   graph[u].forEach(nei=>{
      let alt=dist[u]+nei.weight;
      if(alt<dist[nei.node]){dist[nei.node]=alt;prev[nei.node]=u;}
   });
 }
 let path=[],u=end;
 while(u){path.unshift(u);u=prev[u];}
 return path;
}

function goToNearestBike(){
 navigator.geolocation.getCurrentPosition(pos=>{
   userLocation={lat:pos.coords.latitude,lng:pos.coords.longitude};
   if(userMarker)map.removeLayer(userMarker);
   userMarker=L.marker([userLocation.lat,userLocation.lng],{icon:userIcon}).addTo(map);
   document.getElementById('iaStatus').innerText='Ubicación detectada. IA lista.';
 });
}

function activateDestinationSelection(){
 map.once('click',e=>{
   if(!userLocation){alert('Primero detecta ubicación');return;}
   const dest={lat:e.latlng.lat,lng:e.latlng.lng};
   if(destMarker)map.removeLayer(destMarker);
   destMarker=L.marker([dest.lat,dest.lng],{icon:destIcon}).addTo(map);
   const start=nearestNode(userLocation.lat,userLocation.lng);
   const end=nearestNode(dest.lat,dest.lng);
   const path=dijkstra(start,end);
   drawGraphRoute(path,userLocation,dest);
 });
}

function drawGraphRoute(path,user,dest){
 if(currentRoute)map.removeLayer(currentRoute);
 let coords=[[user.lat,user.lng]];
 path.forEach(id=>{const n=cityData.nodes.find(x=>x.id===id);coords.push([n.lat,n.lng]);});
 coords.push([dest.lat,dest.lng]);
 currentRoute=L.polyline(coords,{color:'blue',weight:7}).addTo(map);
 document.getElementById('iaStatus').innerText='Ruta IA por grafos calculada con Dijkstra';
}

function sendReport(type){
 navigator.geolocation.getCurrentPosition(pos=>{
   cityData.reports.push({type,lat:pos.coords.latitude,lng:pos.coords.longitude});
   localStorage.setItem('reports',JSON.stringify(cityData.reports));
   location.reload();
 });
}
function toggleHeatMap(){
 if(heatLayer){map.removeLayer(heatLayer);heatLayer=null;return;}
 heatLayer=L.heatLayer(cityData.reports.map(r=>[r.lat,r.lng,1]),{radius:25}).addTo(map);
}
document.getElementById('reportsCount').innerText=cityData.reports.length;
document.getElementById('nodesCount').innerText=cityData.nodes.length;
cityData.stations.forEach(s=>L.marker([s.lat,s.lng],{icon:bikeIcon}).addTo(map));
