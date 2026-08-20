# NORTAGIRO APP — Especificaciones del Proyecto

## Descripción General

**NORTAGIRO APP** (nombre interno de producto: **ClimaPulse 360**) es una plataforma SaaS de **clima organizacional** orientada a equipos de Talento & Cultura / RRHH. Permite crear, enviar y analizar encuestas de clima laboral con insights impulsados por IA, todo dentro de una interfaz moderna y responsive.

### Propósito

- Medir el clima organizacional de empresas mediante encuestas periódicas (trimestrales).
- Proporcionar un dashboard ejecutivo con KPIs clave: índice global, eNPS, participación y riesgo de burnout.
- Ofrecer insights generados por IA para detectar alertas críticas y oportunidades de mejora.
- Garantizar el **anonimato** de los empleados encuestados (umbral mínimo de 5 respuestas).

---

## Stack Tecnológico

| Tecnología            | Versión / Detalle                       |
| --------------------- | --------------------------------------- |
| **Framework UI**      | React 19                                |
| **Lenguaje**          | TypeScript 5.8                          |
| **Build Tool**        | Vite 6                                  |
| **Estilos**           | Tailwind CSS v4 (plugin Vite)           |
| **Utilidades CSS**    | `clsx` + `tailwind-merge` (función `cn`) |
| **Iconos**            | `lucide-react`                          |
| **Animaciones**       | `motion` (Framer Motion)                |
| **Gráficos**          | `recharts`                              |
| **IA / Backend**      | `@google/genai` (Gemini API)            |
| **Servidor**          | Express 4 (API proxy para Gemini)       |
| **Package Manager**   | Bun (bun.lock presente)                 |

---

## Estructura del Proyecto

```
NORTAGIRO APP/
├── index.html              # Entry point HTML
├── package.json            # Dependencias y scripts
├── vite.config.ts          # Configuración Vite + Tailwind + React
├── tsconfig.json           # Configuración TypeScript
├── metadata.json           # Metadata para AI Studio
├── .env.local.example      # Template de variables de entorno
├── README.md               # Instrucciones de ejecución
├── AGENTS.md               # ← Este archivo (especificaciones)
├── assets/
│   └── .aistudio/          # Archivos de AI Studio
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Esquema PostgreSQL + RLS
└── src/
    ├── main.tsx             # Punto de entrada React
    ├── App.tsx              # Componente raíz con routing por estado
    ├── index.css            # Design system (tokens de color, tipografía)
    ├── components/
    │   ├── Sidebar.tsx      # Navegación lateral (desktop)
    │   └── TopNav.tsx       # Barra superior (mobile)
    ├── views/
    │   ├── DashboardView.tsx  # Panel principal con KPIs e insights
    │   ├── WizardView.tsx     # Wizard de configuración de envíos
    │   └── SurveyView.tsx     # Vista de encuesta (perspectiva empleado)
    └── lib/
        ├── utils.ts           # Utilidad `cn()` para clases CSS condicionales
        ├── supabase.ts        # Cliente Supabase (singleton tipado)
        └── database.types.ts  # Tipos TypeScript del esquema de BD
```

---

## Sistema de Diseño

### Paleta de Colores (Design Tokens)

Definidos en `src/index.css` bajo `@theme`:

| Token                        | Valor     | Uso                                      |
| ---------------------------- | --------- | ---------------------------------------- |
| `--color-primary`            | `#2563eb` | Acciones principales, CTAs               |
| `--color-primary-container`  | `#1d4ed8` | Hover/estado activo de primary           |
| `--color-secondary`          | `#64748b` | Texto secundario, labels                 |
| `--color-tertiary`           | `#10b981` | Elementos de éxito, acentos positivos    |
| `--color-error`              | `#ef4444` | Alertas críticas, errores                |
| `--color-background`         | `#f8fafc` | Fondo general de la app                  |
| `--color-on-background`      | `#1e293b` | Texto principal                          |
| `--color-surface`            | `#ffffff` | Fondo de tarjetas y contenedores         |
| `--color-outline-variant`    | `#e2e8f0` | Bordes sutiles                           |
| `--color-chart-emerald`      | `#10b981` | Gráficos — positivo                      |
| `--color-chart-amber`        | `#fbbf24` | Gráficos — neutro/precaución             |
| `--color-chart-coral`        | `#fb7185` | Gráficos — negativo/crítico              |

### Tipografía

- **Sans**: `Geist`, system-ui, sans-serif
- **Mono**: `JetBrains Mono`, monospace

### Componente Base

```css
.card {
  @apply bg-white border border-slate-200 shadow-sm rounded-xl
         transition-all duration-200 hover:shadow-md hover:border-slate-300;
}
```

---

## Vistas y Funcionalidades

### 1. Dashboard (`DashboardView`)

**Ruta lógica**: vista por defecto (`currentView === 'dashboard'`)

**Secciones**:
- **Header**: título "Dashboard", badge de organización, selector de periodo trimestral, botón "Crear nueva campaña".
- **KPI Cards** (grid 4 columnas):
  - **Índice Global**: puntuación sobre 10 con delta vs periodo anterior.
  - **eNPS**: Employee Net Promoter Score con barra de promotores/neutrales/detractores.
  - **Participación**: porcentaje con gráfico circular SVG.
  - **Riesgo Burnout**: indicador de nivel con alerta por departamento.
- **Mapa de Calor por Área**: tabla con dimensiones (Liderazgo, Crecimiento, Reconocimiento, Bienestar) × departamentos (Tech, Sales, Ops, Marketing). Colores semáforo: verde ≥7.5, ámbar ≥6.0, rojo <6.0.
- **AI Insights**: panel con alertas críticas y oportunidades detectadas por IA.
- **Análisis de Sentimiento**: breakdown porcentual (positivo/neutral/crítico) por dimensión, basado en NLP de comentarios libres.
- **Temas Frecuentes**: topic clusters extraídos semánticamente con conteo de menciones y código de color.

### 2. Wizard de Envíos (`WizardView`)

**Ruta lógica**: `currentView === 'wizard'`

**Funcionalidad**: configuración paso a paso para automatizar el envío de encuestas.

**Stepper visual** (4 pasos):
1. Configuración ✅
2. Audiencia ✅
3. Automatización 🔵 (activo)
4. Revisión ⬜ (pendiente)

**Paneles del paso actual**:
- **Remitente y Asunto**: nombre del remitente (bloqueado globalmente), asunto personalizable.
- **Programación de Lanzamiento**: fecha y hora de inicio.
- **Recordatorios Inteligentes**: toggle on/off con reglas:
  - Recordatorio 1: 3 días después del lanzamiento.
  - Recordatorio Final: 24 horas antes del cierre.
- **Vista Previa** (panel derecho sticky): preview del email de invitación con switch mobile/desktop. Muestra el correo con logo, saludo personalizado, CTA "Comenzar encuesta anónima" y badge de confidencialidad.

**Navegación fija inferior**: botones "Atrás" y "Siguiente Paso".

### 3. Vista de Encuesta (`SurveyView`)

**Ruta lógica**: `currentView === 'survey'` (renderizado a pantalla completa, sin sidebar)

**Funcionalidad**: simula la experiencia del empleado respondiendo la encuesta.

**Elementos**:
- **Progress Bar**: indicador "Pregunta X de 8" con barra de progreso y tiempo estimado restante.
- **Badge de anonimato**: "Tu respuesta es 100% anónima".
- **Pregunta**: escala 1-10 con labels "Para nada" / "Totalmente".
- **Feedback contextual**: texto dinámico según el rating seleccionado.
- **Comentario opcional**: textarea expandible para detalles o propuestas.
- **CTA "Siguiente pregunta"**: botón deshabilitado hasta seleccionar un rating, con animación hover.

---

## Navegación

### Desktop
- **Sidebar** lateral izquierda fija (w-64, fondo `slate-900`).
- Items de navegación: Dashboard, Automatización, Reporting, Insights, Directory.
- Sección inferior: badge de umbral de anonimato, botón "Vista de Empleado", Help, Logout.

### Mobile
- **TopNav**: barra superior sticky con logo, notificaciones, settings y avatar.
- **Bottom Nav**: barra fija inferior con 3 tabs (Home, Send, Preview) con iconos y estado activo resaltado.

---

## Routing

La app NO usa un router de librería. El routing se gestiona con estado local (`useState<View>`) en `App.tsx`:

```typescript
type View = 'dashboard' | 'wizard' | 'survey';
```

- `SurveyView` se renderiza a pantalla completa (sin sidebar ni layout).
- `DashboardView` y `WizardView` se renderizan dentro del layout con sidebar.

---

## Convenciones de Código

### General
- **Idioma del código**: inglés (nombres de componentes, variables, tipos).
- **Idioma del contenido**: español (textos visibles al usuario, labels, títulos).
- **Componentes**: funciones exportadas con nombre (`export function ComponentName()`).
- **Estilos**: Tailwind CSS con la utilidad `cn()` para clases condicionales.
- **Iconos**: importar individualmente desde `lucide-react`.

### Estructura de archivos
- Componentes reutilizables → `src/components/`
- Vistas/páginas completas → `src/views/`
- Utilidades y helpers → `src/lib/`

### CSS
- Usar los design tokens definidos en `@theme` de `index.css`.
- No usar colores hardcodeados; preferir tokens semánticos (`text-primary`, `bg-surface`, etc.).
- La clase `.card` es el contenedor estándar para paneles y tarjetas.

---

## Scripts Disponibles

| Script        | Comando                          | Descripción                        |
| ------------- | -------------------------------- | ---------------------------------- |
| `dev`         | `vite --port=3000 --host=0.0.0.0`| Servidor de desarrollo             |
| `build`       | `vite build`                     | Build de producción                |
| `preview`     | `vite preview`                   | Previsualización del build         |
| `clean`       | `rm -rf dist server.js`         | Limpieza de artefactos             |
| `lint`        | `tsc --noEmit`                   | Verificación de tipos TypeScript   |

---

## Configuración del Entorno

- **API Key**: configurar `GEMINI_API_KEY` en `.env.local` para funcionalidades de IA.
- **HMR**: se deshabilita con la variable `DISABLE_HMR=true` (para edición por agentes en AI Studio).
- **Alias**: `@` apunta a la raíz del proyecto en `vite.config.ts`.

---

## Estado Actual y Datos

> ⚠️ Actualmente la app usa **datos mock hardcodeados** en los componentes. No hay conexión a backend real ni persistencia de datos.

### Datos mock presentes:
- KPIs del dashboard (índice global 8.4, eNPS +42, participación 87%, burnout 14%).
- Heatmap con 4 dimensiones × 4 departamentos.
- Insights de IA estáticos.
- Análisis de sentimiento con porcentajes fijos.
- Topic clusters con conteos de menciones.
- Pregunta de encuesta fija (reconocimiento).

---

## Próximos Pasos (Backlog sugerido)

- [ ] Conectar con backend real (API Express + Gemini).
- [ ] Implementar autenticación y gestión de usuarios.
- [ ] Persistencia de encuestas y respuestas en base de datos.
- [ ] Generación dinámica de insights con Gemini API.
- [ ] Completar el flujo del wizard (4 pasos funcionales).
- [ ] Implementar flujo completo de encuesta (8 preguntas, no solo mock de 1).
- [ ] Añadir vistas de Reporting, Insights y Directory (actualmente solo navegan al dashboard).
- [ ] Exportación de reportes (PDF/Excel).
- [ ] Soporte multiidioma (i18n).
- [ ] Tests unitarios y de integración.
