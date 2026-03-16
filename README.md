# Dashboard Builder — AI-Powered Analytics

> Genera dashboards hermosos desde cualquier fuente de datos usando lenguaje natural y Claude AI.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![AI](https://img.shields.io/badge/Claude-Sonnet--4-6366F1) ![Charts](https://img.shields.io/badge/Highcharts-12-orange)

---

## ✨ Features

- **4 fuentes de datos** — Google Sheets, CSV/Excel, JSON URL, Pegar datos
- **Lenguaje natural** — Describe el dashboard y la IA lo genera
- **Refinamiento iterativo** — Refina con más prompts, historial de chat
- **6 tipos de visual** — KPI cards, barras H/V, pie/donut, línea temporal, tabla
- **5 formatos de exportación** — PNG, PDF, CSV, Excel, JSON config
- **Demo instantáneo** — Prueba sin datos propios con dataset de e-commerce

---

## 🚀 Quick Start

```bash
# 1. Clonar y instalar
git clone <repo>
cd dashboard-builder
npm install

# 2. Configurar API key
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." > .env.local

# 3. Ejecutar
npm run dev
# → http://localhost:3000
```

---

## 🌐 Deploy en Vercel

```bash
npx vercel --prod
```

En **Vercel Dashboard → Settings → Environment Variables** agrega:
- `ANTHROPIC_API_KEY` = `sk-ant-api03-...`

---

## 📁 Estructura

```
app/
  globals.css          # Design tokens
  layout.js            # Root layout
  page.js              # Orquestador principal
  api/
    data/route.js      # Proxy Google Sheets
    generate/route.js  # Claude AI endpoint

components/
  Header.jsx           # Barra superior
  SourceSelector.jsx   # Selector de origen de datos
  DataPreview.jsx      # Preview de datos cargados
  PromptChat.jsx       # Chat con IA
  DashboardRenderer.jsx # Renderiza el Config JSON
  ExportMenu.jsx       # Menú de exportación
  SkeletonDashboard.jsx # Loading state
  charts/
    KPICard.jsx        # Tarjeta KPI con animación
    HighBarChart.jsx   # Barras horizontales/verticales
    HighPieChart.jsx   # Pie / Donut
    HighLineChart.jsx  # Línea temporal
    DataTable.jsx      # Tabla con sort y paginación

lib/
  DataAdapter.js       # Normaliza fuentes de datos
  AIEngine.js          # Cliente del API de IA
  ExportManager.js     # Lógica de exportación
  schemas.js           # Schema del Config JSON
  demoData.js          # Dataset de e-commerce demo
```

---

## 🔑 Variables de entorno

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic (obligatoria) |

---

## 🧠 Cómo funciona

1. El usuario carga datos → `DataAdapter` normaliza cualquier fuente
2. El usuario describe el dashboard en lenguaje natural
3. `POST /api/generate` envía el prompt + esquema de datos a Claude Sonnet 4
4. Claude retorna un **Config JSON** con la configuración de los visuals
5. `DashboardRenderer` mapea el Config JSON a componentes Highcharts
6. El usuario puede refinar con más prompts o exportar el resultado

---

## 📊 Tipos de visual soportados

| Tipo | Descripción |
|---|---|
| `kpi` | Tarjeta KPI con contador animado |
| `bar_v` | Gráfico de columnas verticales |
| `bar_h` | Gráfico de barras horizontales |
| `pie` | Gráfico circular |
| `donut` | Gráfico donut |
| `line` | Línea temporal (area spline) |
| `table` | Tabla de datos con sort y paginación |

---

## 📄 License

MIT
