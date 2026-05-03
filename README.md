# Home Admin

Aplicación personal de gestión del hogar: gastos y recordatorios con integración de WhatsApp y IA.

## Stack tecnológico

| Capa | Tecnología | Para qué sirve |
|------|-----------|----------------|
| UI | React 19 + Vite | Interfaz web |
| Estilos | CSS vanilla | Sin frameworks CSS |
| Base de datos | Supabase (PostgreSQL) | Toda la persistencia |
| Funciones serverless | Supabase Edge Functions (Deno/TypeScript) | Lógica de servidor |
| Mensajería | Twilio | WhatsApp |
| IA | Claude API (Anthropic) | Leer lenguaje natural |
| PWA | Service Worker | Notificaciones push, offline |

## Comandos

```bash
npm run dev       # dev server en http://localhost:5173
npm run build     # build de producción a /dist
npm run lint      # ESLint
npm run preview   # preview del build de producción
```

> En Windows, correr desde **cmd.exe** o via `! cmd /c "npm run dev"` — PowerShell bloquea scripts npm por defecto.

---

## Arquitectura general

### Navegación — sin React Router

No hay router. La navegación es con un simple `useState` en `App.jsx`:

```jsx
const [pagina, setPagina] = useState('gastos')

return (
  <>
    <Sidebar paginaActual={pagina} onChangePagina={setPagina} />
    {pagina === 'gastos' && <RegistroGastos />}
    {pagina === 'tareas' && <RegistroTareas />}
  </>
)
```

### Patrón de estado — Props Drilling

No hay Context API ni Redux. El estado vive en el componente raíz de cada feature y se pasa hacia abajo por props. Los hijos nunca tocan Supabase directamente, solo llaman callbacks del padre.

```
RegistroGastos (dueño del estado)
  ├── GastoForm          → recibe onAgregar()
  ├── GastoLista         → recibe gastos[], onEliminar(), onEditar()
  ├── ResumenCategorias  → recibe gastos[], categorias[]
  └── GastoEditDialog    → recibe gastoEditando, onGuardar()
```

---

## Estructura de carpetas

```
src/
├── App.jsx                       ← punto de entrada, controla qué página mostrar
├── main.jsx                      ← monta React en el DOM, registra Service Worker
├── styles/global.css             ← estilos compartidos (.card, inputs, reset)
├── components/                   ← componentes reutilizables en toda la app
│   ├── Sidebar/                  ← navegación lateral (Gastos / Recordatorios)
│   └── ConfirmDialog/            ← modal de confirmación para borrar
├── features/
│   ├── gastos/
│   │   ├── RegistroGastos/       ← componente raíz, dueño del estado
│   │   └── components/
│   │       ├── GastoForm/        ← formulario crear gasto + CRUD categorías
│   │       ├── GastoLista/       ← lista de gastos con editar/borrar
│   │       ├── GastoEditDialog/  ← modal para editar gasto
│   │       ├── ResumenCategorias/← totales agrupados por categoría
│   │       ├── FiltroRango/      ← filtro por rango de fechas
│   │       └── ToastContainer/   ← muestra notificaciones temporales
│   └── tareas/
│       ├── RegistroTareas/       ← componente raíz, dueño del estado
│       └── components/
│           ├── TareaForm/        ← crear recordatorio con alarmas opcionales
│           ├── TareaLista/       ← lista con drag-and-drop para reordenar
│           └── TareaEditDialog/  ← modal para editar tarea y alarmas
└── lib/
    ├── supabase.js               ← cliente Supabase (singleton)
    ├── useToast.js               ← hook de toasts (success/error)
    ├── formatCOP.js              ← formatea montos a pesos colombianos
    └── usePushNotifications.js   ← hook para suscripción web push (VAPID)
```

---

## Base de datos (Supabase)

| Tabla | Esquema |
|-------|---------|
| `gastos` | `{ id, descripcion, monto, categoria, fecha }` |
| `categorias` | `{ id, emoji, label, valor, color, orden }` |
| `recordatorios` | `{ id, descripcion, responsable, fecha_registro, orden }` |
| `alarmas` | `{ id, recordatorio_id, fecha_hora, loop, loop_semanal, enviado }` |
| `push_subscriptions` | `{ endpoint, p256dh, auth }` |

---

## Feature Gastos

### Flujo de crear un gasto

1. Usuario llena `GastoForm` (descripción, monto, categoría, fecha)
2. El form valida → llama `onAgregar(datos)`
3. `RegistroGastos.agregarGasto()` hace insert en Supabase
4. Actualiza estado local y muestra toast de éxito

### Filtro por fecha

El filtrado es **cliente-side** sobre el array `gastos[]`:

```js
const gastosFiltrados = gastos.filter(g => g.fecha >= desde && g.fecha <= hasta)
```

### Categorías dinámicas

Las categorías no son un array fijo — vienen de Supabase. `GastoForm` tiene una mini-UI inline para crear/editar/borrar categorías con emoji picker y color picker.

---

## Feature Tareas (Recordatorios)

### Estructura de datos

Una tarea llega de Supabase con sus alarmas anidadas (JOIN implícito):

```js
supabase.from('recordatorios').select('*, alarmas(*)')
// Resultado:
{
  id, descripcion, responsable, fecha_registro, orden,
  alarmas: [
    { id, recordatorio_id, fecha_hora, loop, loop_semanal, enviado }
  ]
}
```

### Tipos de alarma

| `loop` | `loop_semanal` | Comportamiento |
|--------|---------------|----------------|
| `false` | `false` | Una sola vez → se borra al disparar |
| `true` | `false` | Diario → `fecha_hora += 1 día` al disparar |
| `false` | `true` | Semanal → `fecha_hora += 7 días` al disparar |

### Drag-and-drop para reordenar

`TareaLista` usa los eventos HTML5 nativos (`dragstart`, `dragover`, `drop`). Al soltar, hace batch-update en Supabase:

```js
Promise.all(tareas.map((t, i) =>
  supabase.from('recordatorios').update({ orden: i }).eq('id', t.id)
))
```

### Realtime — sincronización automática

`RegistroTareas` escucha cambios en la tabla `alarmas` vía Supabase Realtime:

```js
supabase.channel('alarmas-changes')
  .on('postgres_changes', { event: 'DELETE', table: 'alarmas' }, (payload) => {
    // remueve la alarma del estado sin recargar la página
  })
  .on('postgres_changes', { event: 'UPDATE', table: 'alarmas' }, (payload) => {
    // actualiza fecha_hora cuando el cron la adelantó (loop diario/semanal)
  })
  .subscribe()
```

Cuando el Edge Function del cron modifica una alarma en la DB, la UI se actualiza automáticamente.

---

## Edge Functions (Deno serverless)

### `enviar-recordatorios` — Cron de WhatsApp

Se ejecuta periódicamente via el scheduler de Supabase. Flujo:

1. Busca alarmas vencidas: `fecha_hora <= now AND enviado = false`
2. Para cada alarma, envía un WhatsApp vía Twilio
3. Según el tipo de alarma:
   - **Loop diario**: adelanta `fecha_hora += 1 día`
   - **Loop semanal**: adelanta `fecha_hora += 7 días`
   - **Una vez**: borra la alarma

Variables de entorno requeridas: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `WHATSAPP_OWNER`

### `whatsapp-recibo` — Chatbot de gastos con IA

Twilio apunta su webhook aquí cuando el usuario manda un WhatsApp. Flujo:

```
Usuario envía WhatsApp
  → Twilio llama el Edge Function
    → Edge Function envía el texto a Claude API con tool use
      → Claude retorna: registrar_gasto / solicitar_categoria / registrar_tarea
        → Edge Function escribe en Supabase
          → Responde al usuario con TwiML (mensaje de confirmación)
```

Claude usa **tool calling** para convertir lenguaje natural ("gasté 15 mil en almuerzo") en datos estructurados.

Variable de entorno adicional: `ANTHROPIC_API_KEY`

---

## PWA — Progressive Web App

### Service Worker (`public/sw.js`)

Registrado en `main.jsx`. Maneja dos eventos:

- **`push`**: recibe notificación del servidor → muestra notificación nativa del OS
- **`notificationclick`**: usuario toca notificación → abre/enfoca la app

### `usePushNotifications.js`

Hook que gestiona el ciclo de suscripción:

1. Pide permiso de notificaciones al browser
2. Suscribe al Service Worker con la VAPID public key
3. Guarda el endpoint en la tabla `push_subscriptions` de Supabase

---

## Manejo de fechas y zona horaria

Colombia es UTC-5. Reglas del proyecto:

- **Supabase almacena en UTC** (ISO string)
- **La UI muestra en hora local Colombia**
- Al guardar alarma: `new Date(fechaLocal + ':00-05:00').toISOString()` → convierte a UTC
- Al mostrar alarma: `d.toLocaleString('sv-SE', { timeZone: 'America/Bogota' })` → convierte de UTC a local

---

## Variables de entorno

```bash
# Frontend (.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=

# Edge Functions (Supabase dashboard)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
WHATSAPP_OWNER=          # números separados por coma
ANTHROPIC_API_KEY=
```

---

## Flujo completo del sistema

```
USUARIO
  │
  ├─ Web App (React)
  │    └─ Supabase JS Client → tablas: gastos, categorias, recordatorios, alarmas
  │
  ├─ WhatsApp
  │    └─ Twilio webhook → Edge Function whatsapp-recibo → Claude API → Supabase
  │
  └─ Notificaciones
       └─ Cron Edge Function enviar-recordatorios → Twilio → WhatsApp del usuario
            └─ (Si es loop) actualiza alarma en DB → Supabase Realtime → UI se actualiza
```
