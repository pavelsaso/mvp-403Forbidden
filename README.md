# 🚲 Ruta Segura

## 📌 Descripción del proyecto

**Ruta Segura** es una aplicación web de micromovilidad que ayuda a los usuarios a tomar decisiones más seguras y eficientes al desplazarse en ciudad mediante bicicleta o transporte ligero.

El sistema combina información de rutas, estaciones de bicicletas, condiciones climáticas y percepción de seguridad para recomendar trayectos optimizados.

Este proyecto busca alinearse con iniciativas urbanas de movilidad sostenible, incluyendo planes de modernización de infraestructura ciclista en ciudades como Puebla dentro del periodo 2024–2030.

---

## 🎯 Problema

En la movilidad urbana actual, los usuarios enfrentan incertidumbre al usar micromovilidad debido a:

- Falta de información sobre seguridad en rutas
- Desconocimiento de estaciones de bicicletas cercanas
- Rutas que no consideran infraestructura ciclista
- Condiciones climáticas variables
- Herramientas existentes que priorizan solo la ruta más rápida

Esto limita la adopción de medios de transporte sostenibles.

---

## 💡 Solución

Ruta Segura propone un sistema inteligente de recomendación de rutas que:

- Permite al usuario ingresar origen y destino
- Detecta la estación de bicicletas más cercana o segura
- Sugiere rutas que priorizan ciclovías
- Integra condiciones de seguridad (heatmap simulado)
- Considera clima en tiempo real
- Permite elegir entre usar bicicleta pública o propia

---

## 🧭 Integración con infraestructura urbana

El proyecto se diseña considerando planes de desarrollo urbano 2024–2030 que contemplan la implementación de estaciones de bicicletas modernas en la ciudad.

Ruta Segura se alinea con esta visión al:

- Mapear estaciones de bicicletas en la ciudad
- Conectar usuarios con la estación más cercana o más segura
- Generar rutas desde la estación hacia el destino
- Priorizar ciclovías cuando estén disponibles

Esto permite una integración natural con infraestructura futura de micromovilidad.

---

## 🧪 Funcionalidades del MVP

- 🗺 Mapa interactivo usando Leaflet + OpenStreetMap
- 📍 Detección de ubicación del usuario
- 🚲 Visualización de estaciones de bicicletas
- 🔥 Heatmap de concurrencia (simulado con datos agregados)
- 🌤 Integración de clima en tiempo real
- 🧭 Cálculo de ruta:
  - usuario → estación de bicicleta
  - estación → destino
- 🛣 Prioridad de ciclovías en rutas sugeridas
- 📊 Panel de recomendación de ruta

---

## ⚙️ Flujo del sistema

1. El usuario activa su ubicación
2. Selecciona destino en el mapa
3. El sistema:
   - Identifica estación de bicicletas más cercana o conveniente
   - Evalúa condiciones de seguridad y clima
4. Genera una ruta en dos etapas:
   - origen → estación
   - estación → destino
5. Muestra recomendación final en el mapa

---

## 🧱 Tecnologías utilizadas

- HTML
- CSS
- JavaScript
- Python (backend)
- Leaflet (mapas)
- OpenStreetMap
- Datos JSON para estaciones simuladas

---

## 📊 Datos utilizados

- 🌤 Clima: datos reales en tiempo real (API externa)
- 👥 Concurrencia: simulada mediante heatmaps agregados
- 🚲 Estaciones de bicicletas: dataset local en `data.json`
- 🗺 Mapas: OpenStreetMap

---

## 🧠 Implementación técnica (resumen)

El sistema utiliza:

- Geolocalización del usuario
- Cálculo de distancias a estaciones
- Selección de estación óptima (seguridad + proximidad)
- Visualización en mapa con Leaflet
- Carga dinámica de estaciones desde JSON

---

## 👥 Equipo de desarrollo

- Emiliano Huerta — Backend (Python)
- Jesús Alexander — Backend (Python)
- Pavel Bautista — Frontend (HTML, CSS, JavaScript)
- Wulfrano Sánchez — Frontend (HTML, CSS, JavaScript)

---

## 🎯 Objetivo

Incrementar la adopción de la micromovilidad en entornos urbanos mediante la reducción de incertidumbre en la toma de decisiones de movilidad, integrando infraestructura ciclista y factores ambientales en la planificación de rutas.

---

## 📌 Alcance del proyecto

Este proyecto corresponde a un **MVP funcional de hackathon**, por lo que:

- Las estaciones de bicicletas son datos simulados
- El heatmap de concurrencia no utiliza datos de usuarios reales
- El sistema no realiza tracking individual de personas
- El objetivo es demostrar el concepto de forma escalable y ética

---

## 🚀 Futuras mejoras

- Integración con datos reales de estaciones públicas de bicicletas
- Conexión con APIs de movilidad urbana
- Optimización de rutas con algoritmos avanzados
- Expansión a múltiples ciudades
- Integración con sistemas de transporte público
- Modelo predictivo de demanda de ciclovías
