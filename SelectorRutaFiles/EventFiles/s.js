import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Bike, Route, Brain, Flame } from 'lucide-react';

export default function UrbanMobilityDashboard(){
  const [status,setStatus] = useState('Sistema IA esperando ubicación...');
  const [routeReady,setRouteReady] = useState(false);
  const [heatZones] = useState([
    {id:'Zona A', level:'Alta actividad'},
    {id:'Zona B', level:'Media actividad'},
    {id:'Zona C', level:'Baja actividad'}
  ]);

  const detectLocation = ()=>{
    setStatus('Ubicación detectada. IA lista.');
  }

  const generateRoute = ()=>{
    setStatus('Ruta inteligente calculada con Dijkstra + zonas seguras');
    setRouteReady(true);
  }

  return (
    <div className='min-h-screen bg-slate-100 p-6'>
      <motion.h1 
        initial={{opacity:0,y:-20}}
        animate={{opacity:1,y:0}}
        className='text-4xl font-bold text-center mb-6'>
        Plataforma Inteligente de Movilidad Urbana
      </motion.h1>

      <div className='grid md:grid-cols-3 gap-6'>
        <Card className='rounded-2xl shadow-xl'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <MapPin size={28}/>
              <h2 className='text-xl font-semibold'>Ubicación del Usuario</h2>
            </div>
            <Button onClick={detectLocation} className='w-full mb-3'>Detectar mi ubicación</Button>
            <p>{status}</p>
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-xl'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <Route size={28}/>
              <h2 className='text-xl font-semibold'>Ruta Inteligente</h2>
            </div>
            <Button onClick={generateRoute} className='w-full mb-3'>Seleccionar destino y calcular</Button>
            {routeReady && <div className='mt-2 text-sm'>Ruta segura mostrada en mapa con estaciones cercanas.</div>}
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-xl'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <Brain size={28}/>
              <h2 className='text-xl font-semibold'>IA HeatMap Python</h2>
            </div>
            {heatZones.map((z,i)=>(
              <div key={i} className='flex justify-between border-b py-2'>
                <span>{z.id}</span>
                <span>{z.level}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <motion.div 
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{delay:0.4}}
        className='mt-8 bg-white rounded-2xl shadow-xl p-6'>
        <h2 className='text-2xl font-bold mb-4 flex items-center gap-2'><Bike/> Vista Visual del Sistema</h2>
        <div className='w-full h-96 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center text-center'>
          <Flame size={48} className='mb-3'/>
          <p className='text-lg'>Aquí irá incrustado el mapa Leaflet en tiempo real:</p>
          <p>• Flecha/Icono del usuario</p>
          <p>• Destino seleccionado</p>
          <p>• Ruta calculada</p>
          <p>• HeatMap de zonas con más eventos desde FastAPI</p>
          <p>• Estaciones de bicicletas cercanas</p>
        </div>
      </motion.div>
    </div>
  )
}