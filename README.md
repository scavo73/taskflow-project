# TaskFlow Project

TaskFlow es una app de tareas hecha con **HTML, CSS, JavaScript y Tailwind CSS**, con interfaz responsive, estado persistente y una estructura clara para mantener la lógica ordenada.

## Capturas de pantalla

### Vista desktop
![Vista desktop](images/task-app-desktop.png)

### Vista mobile
![Vista mobile](images/task-app-mobile.png)

- Crear, editar, completar y borrar tareas
- Filtros por estado, prioridad, categoría y búsqueda
- Persistencia con **localStorage**
- Vista adaptable para escritorio y móvil
- Tema claro/oscuro
- Drag & drop para reordenar tareas
- Drawer de filtros y modal de nueva tarea en móvil


## Capas clave del JavaScript

### Estado
Controla los datos principales de la app: tareas, categorías, filtros, layout y modo de edición.

### Persistencia
Guarda y recupera el estado con `localStorage` para que el usuario no pierda sus cambios al recargar.

### Lógica
Aplica las reglas del sistema: crear tareas válidas, filtrar, completar, borrar, renombrar categorías y mantener consistencia.

### Render
Convierte el estado actual en interfaz: lista de tareas, contador, progreso, filtros activos y estados vacíos.

### Eventos
Conecta la UI con la lógica: formularios, botones, búsqueda, filtros, drawer móvil y acciones sobre tareas.

## Archivos principales

- `app.js`: núcleo de la aplicación
- `mobile-task-form.js`: modal móvil para crear tareas
- `filters-drawer.js`: filtros móviles con aplicar/cancelar
- `theme.js`: gestión del tema visual

## Objetivo

Proyecto pequeño, pero bien resuelto: **estado controlado, persistencia real, render dinámico y separación clara de responsabilidades**.
