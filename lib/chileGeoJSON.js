/**
 * GeoJSON simplificado de las 16 regiones de Chile
 * Coordenadas aproximadas para visualización — suficiente para Highcharts Maps
 */
export const CHILE_REGIONS = {
  "XV": "Arica y Parinacota",
  "I":  "Tarapacá",
  "II": "Antofagasta",
  "III":"Atacama",
  "IV": "Coquimbo",
  "V":  "Valparaíso",
  "XIII":"Metropolitana",
  "VI": "O'Higgins",
  "VII":"Maule",
  "XVI":"Ñuble",
  "VIII":"Biobío",
  "IX": "La Araucanía",
  "XIV":"Los Ríos",
  "X":  "Los Lagos",
  "XI": "Aysén",
  "XII":"Magallanes",
}

// Mapeo de nombres alternativos → código de región
export const REGION_ALIASES = {
  // Código directo
  "XV":"XV","I":"I","II":"II","III":"III","IV":"IV","V":"V",
  "XIII":"XIII","VI":"VI","VII":"VII","XVI":"XVI","VIII":"VIII",
  "IX":"IX","XIV":"XIV","X":"X","XI":"XI","XII":"XII",
  // Nombre completo
  "arica y parinacota":"XV","arica":"XV","parinacota":"XV",
  "tarapacá":"I","tarapaca":"I","iquique":"I",
  "antofagasta":"II",
  "atacama":"III","copiapó":"III","copiapo":"III",
  "coquimbo":"IV","la serena":"IV","serena":"IV",
  "valparaíso":"V","valparaiso":"V",
  "metropolitana":"XIII","santiago":"XIII","rm":"XIII","región metropolitana":"XIII",
  "o'higgins":"VI","ohiggins":"VI","rancagua":"VI","libertador":"VI",
  "maule":"VII","talca":"VII",
  "ñuble":"XVI","nuble":"XVI","chillán":"XVI","chillan":"XVI",
  "biobío":"VIII","biobio":"VIII","concepción":"VIII","concepcion":"VIII",
  "la araucanía":"IX","araucanía":"IX","araucania":"IX","temuco":"IX",
  "los ríos":"XIV","los rios":"XIV","valdivia":"XIV",
  "los lagos":"X","puerto montt":"X","osorno":"X",
  "aysén":"XI","aysen":"XI","coyhaique":"XI",
  "magallanes":"XII","punta arenas":"XII",
}

export function normalizeRegionCode(value) {
  if (!value) return null
  const key = String(value).toLowerCase().trim()
  return REGION_ALIASES[key] || null
}

// GeoJSON completo de Chile con coordenadas reales simplificadas
export const CHILE_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type":"Feature","id":"XV",
      "properties":{"name":"Arica y Parinacota","code":"XV"},
      "geometry":{"type":"Polygon","coordinates":[[[-69.5,-17.5],[-69.5,-18.35],[-70.0,-18.35],[-70.5,-18.0],[-70.4,-17.5],[-69.5,-17.5]]]}
    },
    {
      "type":"Feature","id":"I",
      "properties":{"name":"Tarapacá","code":"I"},
      "geometry":{"type":"Polygon","coordinates":[[[-68.5,-18.35],[-68.5,-20.5],[-70.0,-20.5],[-70.1,-19.5],[-70.0,-18.35],[-68.5,-18.35]]]}
    },
    {
      "type":"Feature","id":"II",
      "properties":{"name":"Antofagasta","code":"II"},
      "geometry":{"type":"Polygon","coordinates":[[[-67.0,-20.5],[-67.0,-26.0],[-70.6,-26.0],[-70.5,-24.0],[-70.0,-20.5],[-67.0,-20.5]]]}
    },
    {
      "type":"Feature","id":"III",
      "properties":{"name":"Atacama","code":"III"},
      "geometry":{"type":"Polygon","coordinates":[[[-68.0,-26.0],[-68.0,-29.0],[-71.5,-29.0],[-71.0,-27.0],[-70.6,-26.0],[-68.0,-26.0]]]}
    },
    {
      "type":"Feature","id":"IV",
      "properties":{"name":"Coquimbo","code":"IV"},
      "geometry":{"type":"Polygon","coordinates":[[[-69.0,-29.0],[-69.0,-32.0],[-71.7,-32.0],[-71.5,-30.0],[-71.5,-29.0],[-69.0,-29.0]]]}
    },
    {
      "type":"Feature","id":"V",
      "properties":{"name":"Valparaíso","code":"V"},
      "geometry":{"type":"Polygon","coordinates":[[[-70.0,-32.0],[-70.0,-33.0],[-71.7,-33.0],[-71.7,-32.5],[-71.7,-32.0],[-70.0,-32.0]]]}
    },
    {
      "type":"Feature","id":"XIII",
      "properties":{"name":"Metropolitana","code":"XIII"},
      "geometry":{"type":"Polygon","coordinates":[[[-69.5,-33.0],[-69.5,-34.0],[-71.6,-34.0],[-71.7,-33.5],[-71.7,-33.0],[-69.5,-33.0]]]}
    },
    {
      "type":"Feature","id":"VI",
      "properties":{"name":"O'Higgins","code":"VI"},
      "geometry":{"type":"Polygon","coordinates":[[[-70.0,-34.0],[-70.0,-34.8],[-72.0,-34.8],[-72.0,-34.3],[-71.6,-34.0],[-70.0,-34.0]]]}
    },
    {
      "type":"Feature","id":"VII",
      "properties":{"name":"Maule","code":"VII"},
      "geometry":{"type":"Polygon","coordinates":[[[-70.5,-34.8],[-70.5,-36.0],[-72.5,-36.0],[-72.5,-35.4],[-72.0,-34.8],[-70.5,-34.8]]]}
    },
    {
      "type":"Feature","id":"XVI",
      "properties":{"name":"Ñuble","code":"XVI"},
      "geometry":{"type":"Polygon","coordinates":[[[-71.0,-36.0],[-71.0,-37.0],[-72.8,-37.0],[-72.5,-36.5],[-72.5,-36.0],[-71.0,-36.0]]]}
    },
    {
      "type":"Feature","id":"VIII",
      "properties":{"name":"Biobío","code":"VIII"},
      "geometry":{"type":"Polygon","coordinates":[[[-71.0,-37.0],[-71.0,-38.5],[-73.5,-38.5],[-73.5,-37.8],[-72.8,-37.0],[-71.0,-37.0]]]}
    },
    {
      "type":"Feature","id":"IX",
      "properties":{"name":"La Araucanía","code":"IX"},
      "geometry":{"type":"Polygon","coordinates":[[[-71.2,-38.5],[-71.2,-39.8],[-73.8,-39.8],[-73.5,-39.0],[-73.5,-38.5],[-71.2,-38.5]]]}
    },
    {
      "type":"Feature","id":"XIV",
      "properties":{"name":"Los Ríos","code":"XIV"},
      "geometry":{"type":"Polygon","coordinates":[[[-71.5,-39.8],[-71.5,-40.5],[-73.8,-40.5],[-73.8,-40.0],[-73.8,-39.8],[-71.5,-39.8]]]}
    },
    {
      "type":"Feature","id":"X",
      "properties":{"name":"Los Lagos","code":"X"},
      "geometry":{"type":"Polygon","coordinates":[[[-71.8,-40.5],[-71.8,-43.5],[-74.5,-43.5],[-74.0,-42.0],[-73.8,-40.5],[-71.8,-40.5]]]}
    },
    {
      "type":"Feature","id":"XI",
      "properties":{"name":"Aysén","code":"XI"},
      "geometry":{"type":"Polygon","coordinates":[[[-72.0,-43.5],[-72.0,-49.0],[-75.5,-49.0],[-75.5,-46.0],[-74.5,-43.5],[-72.0,-43.5]]]}
    },
    {
      "type":"Feature","id":"XII",
      "properties":{"name":"Magallanes","code":"XII"},
      "geometry":{"type":"Polygon","coordinates":[[[-68.5,-49.0],[-68.5,-55.5],[-75.5,-55.5],[-75.5,-52.0],[-75.5,-49.0],[-68.5,-49.0]]]}
    }
  ]
}
