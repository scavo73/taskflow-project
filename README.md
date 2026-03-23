# TaskFlow

TaskFlow es una aplicación de gestión de tareas con frontend en HTML, CSS y JavaScript vanilla, y backend en Node.js + Express.

En esta fase del proyecto, la aplicación dejó de depender de `localStorage` como persistencia principal de tareas y pasó a trabajar contra una API RESTful. El frontend consume el backend mediante `fetch`, y el backend está organizado con arquitectura por capas.

## Estado actual del proyecto

### Funcionalidades principales

* crear tareas desde frontend y persistirlas en backend
* listar tareas desde la API
* editar el título de una tarea
* marcar y desmarcar tareas como completadas
* borrar tareas individuales
* completar o borrar tareas visibles en bloque
* reordenar tareas con drag & drop y persistir el orden en backend
* cargar tareas demo desde la API
* filtros, búsqueda y cambio de layout en el frontend
* soporte para interfaz móvil con modal de creación y panel de filtros
* tema claro / oscuro

### Qué cambió en esta fase

* se creó un backend con Express dentro de `server/`
* se implementó una API RESTful para tareas
* se añadió validación de entrada y manejo global de errores
* el frontend dejó de usar `localStorage` como fuente de verdad para tareas
* el drag & drop ya no es solo visual: el orden se guarda en el backend
* el flujo demo ya no inyecta datos locales: ahora usa la API

## Stack

### Frontend

* HTML
* CSS / Tailwind CSS
* JavaScript vanilla
* SortableJS

### Backend

* Node.js
* Express
* CORS
* dotenv
* nodemon

## Arquitectura del proyecto

```text
TaskFlow/
├── vercel.json
├── index.html
├── api/
│   └── index.js
├── tailwind.css
├── dist/                         (generado)
│   └── styles.css
├── styles.css
├── package.json
├── js/
│   ├── api-client.js
│   ├── app-bootstrap.js
│   ├── state.js
│   ├── storage.js
│   ├── filters.js
│   ├── form.js
│   ├── events.js
│   ├── render.js
│   ├── mobile-task-form.js
│   ├── filters-drawer.js
│   └── theme.js
├── docs/
│   └── backend-api.md
└── server/
    ├── package.json
    ├── .env
    └── src/
        ├── app.js                (Express app reusable para serverless)
        ├── config/
        │   └── env.js
        ├── controllers/
        │   └── task.controller.js
        ├── routes/
        │   └── task.routes.js
        ├── services/
        │   └── task.service.js
        └── index.js

         (index.js sirve para ejecución local con `npm run dev`)
```

## Backend por capas

### Routes

Reciben la URL y el verbo HTTP, y delegan en el controlador adecuado.

### Controllers

Validan la entrada, extraen `req.body` y `req.params`, llaman al servicio y construyen la respuesta HTTP.

### Services

Contienen la lógica de negocio y la persistencia actual en memoria. Esta capa no conoce Express ni HTTP.

### Config

Centraliza la carga y validación de variables de entorno.

## Middlewares usados

* `cors()` para permitir peticiones desde el frontend
* `express.json()` para parsear JSON en `req.body`
* logger académico para registrar método, ruta, estado y duración
* middleware global de errores para mapear errores a HTTP `400`, `404` y `500`

## Variables de entorno

Archivo `server/.env` (solo local):

```env
PORT=3000
CLIENT_ORIGIN=http://127.0.0.1:5500
```
En producción (Vercel) no es necesario definir `PORT` para que la API funcione.

## Cómo ejecutar el proyecto

### 1. Backend

```bash
cd server
npm install
npm run dev
```

El backend quedará disponible en:

```text
http://localhost:3000
```

### 2. Frontend

Abre `index.html` con Live Server o cualquier servidor local estático.

Ejemplo habitual con Live Server:

```text
http://127.0.0.1:5500
```

## Despliegue en Vercel

Este repo está configurado para desplegar en Vercel usando:

* `vercel.json` para hacer `rewrites` de `/api/v1/tasks*` hacia la función serverless en `api/index.js`
* `api/index.js` como entry point del backend (Express) ejecutado en modo serverless
* `js/api-client.js` usando una URL relativa (`/api/v1/tasks`) para que funcione en prod

Después de conectar el repo a Vercel, el frontend quedará disponible en la raíz y la API en:

* `/api/v1/tasks`
* `/api/v1/tasks/:id`
* `/api/v1/tasks/reorder`
* `/api/v1/tasks/seed-demo`

Nota: la persistencia del backend es en memoria (sin base de datos), así que las tareas pueden reiniciarse ante cold starts o re-creación de instancias.

## Flujo actual de datos

1. El frontend arranca.
2. `api-client.js` hace peticiones al backend.
3. `app-bootstrap.js` hidrata las tareas desde `GET /api/v1/tasks`.
4. Las acciones de crear, editar, completar, borrar y reordenar usan la API.
5. El render se actualiza con el estado devuelto por el backend.

## Modelo actual de tarea

```json
{
  "id": 1,
  "title": "Estudiar Express",
  "category": "Estudio",
  "priority": "Alta",
  "done": false,
  "position": 1
}
```

## Endpoints de la API

### GET `/api/v1/tasks`

Devuelve todas las tareas ordenadas por `position`.

**Respuesta 200**

```json
[
  {
    "id": 1,
    "title": "Estudiar Express",
    "category": "Estudio",
    "priority": "Alta",
    "done": false,
    "position": 1
  }
]
```

### POST `/api/v1/tasks`

Crea una tarea nueva.

**Body**

```json
{
  "title": "Enviar propuesta",
  "category": "Trabajo",
  "priority": "Alta",
  "done": false
}
```

**Respuesta 201**

```json
{
  "id": 2,
  "title": "Enviar propuesta",
  "category": "Trabajo",
  "priority": "Alta",
  "done": false,
  "position": 2
}
```

### PATCH `/api/v1/tasks/:id`

Actualiza parcialmente una tarea.

**Body de ejemplo**

```json
{
  "done": true
}
```

**Respuesta 200**

```json
{
  "id": 2,
  "title": "Enviar propuesta",
  "category": "Trabajo",
  "priority": "Alta",
  "done": true,
  "position": 2
}
```

### DELETE `/api/v1/tasks/:id`

Borra una tarea.

**Respuesta 204**

Sin cuerpo.

### PATCH `/api/v1/tasks/reorder`

Persiste el orden de las tareas.

**Body**

```json
{
  "orderedIds": [3, 1, 2]
}
```

**Respuesta 200**

Devuelve la lista reordenada.

### POST `/api/v1/tasks/seed-demo`

Carga un conjunto de tareas demo desde backend.

**Respuesta 200**

Devuelve la colección demo creada en el servidor.

## Validaciones actuales

El backend valida, entre otras cosas:

* que `title` exista y tenga al menos 3 caracteres
* que `category` no esté vacía
* que `priority` sea `Alta`, `Media` o `Baja`
* que `done` sea boolean cuando se envía
* que los IDs sean enteros positivos
* que el reorder reciba un array válido de IDs

## Manejo de errores

### 400 Bad Request

Cuando el cliente envía datos inválidos.

Ejemplo:

```json
{
  "error": "El título es obligatorio y debe tener al menos 3 caracteres."
}
```

### 404 Not Found

Cuando se intenta modificar o borrar una tarea inexistente.

```json
{
  "error": "Recurso no encontrado"
}
```

### 500 Internal Server Error

Para errores no controlados del servidor.

```json
{
  "error": "Error interno del servidor"
}
```

## Persistencia actual

### En backend

* tareas
* estado completado
* orden de drag & drop
* carga de demo

### En frontend (`localStorage`)

Todavía se conservan localmente algunos estados de interfaz:

* filtros
* layout (grid / list)
* tema
* preferencias del formulario
* categorías del lado cliente, mientras no se migren al backend

## Pruebas manuales realizadas

Se probaron manualmente los siguientes casos con Postman o Thunder Client:

* `GET /api/v1/tasks`
* `POST /api/v1/tasks` válido
* `POST /api/v1/tasks` inválido sin título correcto
* `PATCH /api/v1/tasks/:id` para editar título
* `PATCH /api/v1/tasks/:id` para marcar completada
* `DELETE /api/v1/tasks/:id` válido
* `DELETE /api/v1/tasks/:id` inexistente
* `PATCH /api/v1/tasks/reorder`
* `POST /api/v1/tasks/seed-demo`

También se verificó en el frontend:

* carga inicial desde backend
* persistencia tras recarga
* drag & drop persistente
* acciones individuales y masivas
* flujo demo conectado a API

## Limitaciones actuales

* la persistencia del backend sigue en memoria; si el servidor se reinicia, los datos se pierden
* las categorías todavía no están sincronizadas con backend
* falta sustituir el almacenamiento en memoria por una base de datos real
* falta documentación interactiva con Swagger / OpenAPI
* el despliegue depende de conectar el repo en Vercel (config ya incluida)

## Próximos pasos

* mover categorías al backend
* sustituir el array en memoria por una base de datos
* añadir Swagger / OpenAPI
* desplegar backend y frontend en producción

## Autor

Proyecto TaskFlow adaptado en esta fase para trabajar con backend Express y arquitectura por capas.
