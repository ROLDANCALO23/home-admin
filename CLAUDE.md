# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server at http://localhost:5173
npm run build     # production build to /dist
npm run lint      # run ESLint
npm run preview   # preview production build
```

> On Windows, run these from **cmd.exe** or via `! cmd /c "npm run dev"` — PowerShell blocks npm scripts by default due to execution policy.

## Architecture

React 19 + Vite 8, JavaScript only (no TypeScript). Navigation via `useState` en `App.jsx` — no router. No global state library, todo es `useState` local.

La app tiene dos secciones accesibles desde un `Sidebar`: **Gastos** y **Recordatorios**.

### Folder conventions

Feature-based structure bajo `src/features/`. Componentes compartidos (no atados a un feature) van en `src/components/`. Utilidades y hooks en `src/lib/`.

```
src/
├── components/                   ← componentes globales reutilizables
│   ├── ConfirmDialog/
│   └── Sidebar/
├── features/
│   ├── gastos/
│   │   ├── components/
│   │   │   ├── CategoriasPage/   ← CRUD de categorías (desde Supabase)
│   │   │   ├── FiltroRango/      ← filtro por rango de fechas
│   │   │   ├── GastoEditDialog/
│   │   │   ├── GastoForm/
│   │   │   ├── GastoLista/
│   │   │   ├── ResumenCategorias/
│   │   │   └── ToastContainer/   ← compartido también por tareas
│   │   ├── constants/
│   │   │   └── categorias.js     ← ya no se usa como fuente de datos; categorías vienen de Supabase
│   │   ├── RegistroGastos/       ← root del feature, dueño del estado
│   │   └── index.js
│   └── tareas/
│       ├── components/
│       │   ├── TareaEditDialog/
│       │   ├── TareaForm/        ← crea recordatorio con alarmas opcionales
│       │   └── TareaLista/       ← lista con drag-and-drop para reordenar
│       ├── RegistroTareas/       ← root del feature, dueño del estado
│       └── index.js
├── lib/
│   ├── formatCOP.js              ← formatea montos a pesos colombianos
│   ├── supabase.js               ← cliente Supabase (singleton)
│   ├── usePushNotifications.js   ← hook para suscripción web push (VAPID)
│   └── useToast.js               ← hook de toasts (success/error)
├── styles/
│   └── global.css                ← reset, .card, .card-title, .categoria-badge, inputs
└── App.jsx                       ← importa global.css, renderiza Sidebar + página activa
```

### Backend: Supabase

Toda la persistencia es en Supabase. El cliente se exporta desde `src/lib/supabase.js`.

Tablas:

| Tabla | Descripción |
|-------|-------------|
| `gastos` | `{ id, descripcion, monto, categoria, fecha }` |
| `categorias` | `{ id, nombre, valor, color, imagen, orden }` — fuente de verdad de categorías |
| `recordatorios` | `{ id, descripcion, responsable, fecha_registro, orden }` |
| `alarmas` | `{ id, recordatorio_id, fecha_hora, loop, loop_semanal }` — alarmas de un recordatorio |
| `push_subscriptions` | `{ endpoint, p256dh, auth }` — suscripciones web push |

`RegistroTareas` escucha cambios en tiempo real en la tabla `alarmas` vía Supabase Realtime channels.

### State

- **Gastos**: todo el estado en `RegistroGastos.jsx`. Los componentes reciben datos por props.
- **Tareas**: todo el estado en `RegistroTareas.jsx`. Los componentes reciben datos por props.
- No hay contexto ni store global.

Un gasto: `{ id, descripcion, monto, categoria, fecha }`
Un recordatorio: `{ id, descripcion, responsable, fecha_registro, orden, alarmas[] }`
Una alarma: `{ id, recordatorio_id, fecha_hora, loop, loop_semanal }`

### Push Notifications

El hook `usePushNotifications` (en `src/lib/`) solicita permiso al navegador, suscribe al Service Worker con una clave VAPID (`VITE_VAPID_PUBLIC_KEY`) y guarda el endpoint en la tabla `push_subscriptions` de Supabase.

### Styling

- Global shared styles: `src/styles/global.css` — importado una vez en `App.jsx`
- Component styles: co-located `ComponentName.css`, importado dentro del componente
- Tema oscuro con valores CSS directos (sin design tokens aún)
- Breakpoints: mobile `< 600px`, tablet `600–1023px`, desktop `≥ 1024px`
- `.card` es clase compartida definida en `global.css`

### Variables de entorno

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
```
