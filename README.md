# taskflow-project

## taskflow-maqueta
Maqueta de TaskFlow en `index.html` usando `<header>`, `<main>`, `<aside>` y `<section>`, con variables CSS en `:root` para colores/espaciados y lista de tareas maquetada con Flex + transiciones.
Incluye Media Queries para que la barra lateral se reubique en móvil y el layout sea responsive.
Se ha añadido la librería de iconos Lucide para checks y botones (p. ej. borrar) y el proyecto se despliega en Vercel con URL pública.


## taskflow-js-dom

Interactividad con JavaScript y el DOM
Manipulación de elementos y persistencia local
Uso de JavaScript para transformar la página estática en una aplicación dinámica que responde a las acciones del usuario.


1) La función addTask() valida el título (no vacío), crea un <li> con la estructura completa de una tarea (checkbox, título, categoría, prioridad y botón de borrar) y asigna un id incremental con nextId.
Luego inserta el <li> en la lista, limpia el input y aumenta nextId para la siguiente tarea.

2) Se usa DOMContentLoaded para ejecutar borrarTareas() cuando el HTML ya está cargado y listContainer existe.
La función añade un único click listener a la lista (delegación de eventos) que detecta cualquier botón .tarea__borrar, incluso en tareas creadas dinámicamente.
Al pulsar, elimina el <li> correspondiente y evita que el click active el checkbox porque el botón está dentro del <label>.