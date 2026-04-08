# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<<<<<<< HEAD
This repository is currently empty. Update this file once the project is initialized with relevant build commands, architecture notes, and development workflows.
=======
## Commands

```bash
npm run dev       # start dev server at http://localhost:5173
npm run build     # production build to /dist
npm run lint      # run ESLint
npm run preview   # preview production build
```

> On Windows, run these from **cmd.exe** or via `! cmd /c "npm run dev"` — PowerShell blocks npm scripts by default due to execution policy.

## Architecture

React 19 + Vite 8, JavaScript only (no TypeScript). No router, no global state library — all state is local `useState`.

### Folder conventions

Feature-based structure under `src/features/`. Each feature owns its components, constants, and a barrel `index.js`.

```
src/
├── features/
│   └── gastos/                   ← only feature so far
│       ├── components/           ← UI components private to this feature
│       │   └── ComponentName/    ← each component in its own folder
│       │       ├── ComponentName.jsx
│       │       ├── ComponentName.css
│       │       └── index.js      ← barrel: export { default } from './ComponentName'
│       ├── constants/
│       │   └── categorias.js     ← CATEGORIAS array (single source of truth for categories)
│       ├── RegistroGastos/       ← feature root component, owns all state
│       └── index.js              ← public API: export { RegistroGastos }
├── styles/
│   └── global.css                ← reset, shared classes (.card, .card-title, .categoria-badge, inputs)
└── App.jsx                       ← imports global.css, renders <RegistroGastos />
```

### State

All gastos state lives in `RegistroGastos.jsx`. Components receive data via props — no context or external store. A gasto object has the shape `{ id, descripcion, monto, categoria, fecha }` where `id = Date.now()` and `fecha = new Date()` are set at creation time.

### Styling

- Global shared styles: `src/styles/global.css` — imported once in `App.jsx`
- Component styles: co-located `ComponentName.css`, imported inside the component
- Dark theme with CSS custom values (no CSS variables/design tokens yet)
- Breakpoints: mobile `< 600px`, tablet `600–1023px`, desktop `≥ 1024px`
- `.card` is a shared class defined in `global.css` used across all feature containers

### Categories

`src/features/gastos/constants/categorias.js` exports a default `CATEGORIAS` array. Import it directly in any component that needs category data — do not redefine it elsewhere.
>>>>>>> ec0587f (first commit)
