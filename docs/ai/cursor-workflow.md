# Cursor Workflow

## Qué voy a documentar aquí

En este archivo explico cómo uso Cursor en mi flujo de trabajo y en qué partes del desarrollo me ayuda más.

---

#Primer contacto con Cursor

## Atajos que he usado

| Acción | Atajo |
|--------|-------|
| Edición inline para modificar funciones existentes | `Ctrl + K` |
| Composer para generar cambios que afecten a varios archivos | `Ctrl + I` |
| Chat | `Ctrl + L` |
| Abrir Terminal | `Ctrl + J` |

---

## Lo que hice con Cursor

Le pedí al agente de Cursor que revisara mi carpeta `js/` para probar sus capacidades y hasta dónde podía llegar. Después de enlazar, filtrar y revisar el código, encontró **3 errores**:

### 1. Stored XSS via `innerHTML`
Si un usuario introduce una categoría con contenido malicioso como `"><img src=x onerror=alert(1)>`, puede romper el HTML y ejecutar JavaScript arbitrario al renderizar la UI.

### 2. Normalization mismatch in mobile filter drawer
El drawer guardaba y comparaba valores de categorías usando solo `.toLowerCase()`, mientras que `app.js` usa `normalizeText()` —que combina lowercase, trim y eliminación de diacríticos.

### 3. Repeated icon re-creation may be expensive
`refreshUI()` llama a `refreshIcons()`, que vuelve a ejecutar `window.lucide.createIcons()` en cada actualización, aunque los iconos no hayan cambiado.

---

## Cambios que hice

El primer objetivo fue protegerme de posibles inyecciones XSS cuando el usuario introduzca datos en el campo del título de una tarea nueva.

### `js/app.js`

- Añadí el helper `escapeHtml()` y lo usé para escapar `task.title` y las labels/keys de categorías antes de interpolarlas en plantillas HTML.
- Actualicé las plantillas de renderizado de tareas y categorías para que ningún dato de usuario se inserte sin escapar vía `innerHTML`.
- Reemplacé la creación de elementos `<option>` con `innerHTML` por construcción segura usando nodos del DOM (`textContent` / `value`).
- Sustituí los `querySelector(...[data-category-input="${key}"])` por el helper `getCategoryInputEl()` para evitar fallos del selector con caracteres especiales.

### `js/mobile-task-form.js`

- Reemplacé el patrón `mobileCategory.innerHTML = ...<option>${label}</option>...` por creación segura de opciones usando la API del DOM.

---

## Test manual

Para verificar que los cambios funcionan:

1. Añadir una tarea o categoría con caracteres HTML conflictivos, por ejemplo: `"><img src=x onerror=alert(1)>`
2. Recargar la página para comprobar que el valor persiste desde `localStorage`.
3. Verificar que el texto se muestra literalmente en la UI, sin ejecutar ningún script ni romper el layout.

> ✅ Si el texto aparece tal cual, sin alertas ni imágenes rotas, la protección XSS funciona correctamente.

---

## Dos ejemplos concretos donde Cursor mejoró mi código

### Caso 1 — Renderizado seguro de `<option>`

**Antes:**
```js
selectElement.innerHTML = categories
  .map((label) => `<option>${label}</option>`)
  .join('');
```

**Después:**
```js
// Avoid `innerHTML` for option rendering; category labels are user-provided.
mobileCategory.innerHTML = '';
const frag = document.createDocumentFragment();
categories.forEach((label) => {
  const option = document.createElement('option');
  option.textContent = label;
  option.value = label;
  frag.appendChild(option);
});
mobileCategory.appendChild(frag);
```

---

### Caso 2 — Selector seguro de inputs de categoría

**Antes:**
```js
const input = dom.categoryFiltersGroup.querySelector(
  `[data-category-input="${editingCategoryKey}"]`
);
```

**Después:**
```js
const input = getCategoryInputEl(dom.categoryFiltersGroup, editingCategoryKey);
```

# Refactor TaskFlow usando IA

Después de revisar y detectar partes mejorables con el agente de Cursor, elegí las **5 funciones** que presentaré en formato antes/después. A continuación, los prompts que usé para recoger información y filtrar.

---

## Fase 1 — Análisis del proyecto

```
Revisa todo el proyecto TaskFlow sin hacer cambios todavía.
Quiero un análisis técnico del código:
1. Funciones largas o repetitivas
2. Nombres de variables poco claros
3. Posibles módulos o archivos a separar
4. Validaciones que faltan en el formulario
5. Funciones candidatas para refactorizar sin cambiar comportamiento

Devuélveme una lista priorizada de 8-12 mejoras con nombre de archivo y función.
No edites nada aún.
```

---

## Fase 2 — Selección de funciones

```
De la lista anterior, selecciona las 5 funciones con mejor relación impacto/riesgo para refactorizar primero.
Prioriza funciones largas, repetitivas o con demasiadas responsabilidades.
No cambies comportamiento.
```

### Funciones seleccionadas

#### 1. `js/app.js` — `bindListEvents`

**Impacto:** Alto. Concentra demasiadas responsabilidades y ramas: empty state, demo, toggle, edit/save/cancel, delete, keydown/change.  
**Riesgo:** Bajo, si solo se extraen los manejadores internos sin tocar el flujo ni los selectores.

---

#### 2. `js/app.js` — `bindCategoryEvents`

**Impacto:** Alto. Función muy larga con lógica mezclada: editor nuevo, edición/borrado en la lista, listeners de click y keydown.  
**Riesgo:** Bajo-medio, si el refactor se limita a dividir por casos y mantiene exactamente el mismo uso de `editingCategoryKey`, `dataset` y mensajes.

---

#### 3. `js/app.js` — `renderTask`

**Impacto:** Alto. Función grande que construye un `innerHTML` complejo y luego asigna partes (title, input, cat, prio).  
**Riesgo:** Medio. Cualquier extracción (por ejemplo, un builder de template) debe mantener la estructura idéntica y las mismas condiciones (`isEditing`, `data-task-id`, etiquetas y selectores).

---

#### 4. `js/filters-drawer.js` — `initFiltersDrawer`

**Impacto:** Alto. Mezcla accesibilidad/UI, snapshot e integración con `TaskFlowApp` en un solo bloque.  
**Riesgo:** Medio. Al dividirla en secciones (crear UI, snapshot, sync/apply, eventos) hay que preservar el orden de ejecución y el estado: `firstSnapshot`, `lastActive`, clase `is-open`, etc.

---

#### 5. `js/app.js` — `completeVisibleTasks`

**Impacto:** Alto. Combina cálculo de tareas visibles, confirmación y actualización masiva (`tasks = tasks.map(...)`).  
**Riesgo:** Bajo, si el refactor extrae helpers para "contar visibles / construir mensaje / obtener ids afectados" manteniendo exactamente el mismo criterio de selección y texto.

---

## Fase 3 — Refactorización con inline edit

Para cada función, se usó el siguiente prompt con **edición inline** (`Ctrl + K`):

```
Refactoriza esta función sin cambiar su comportamiento.
Objetivos:
- Nombres más claros
- Menos anidación
- Pasos internos más legibles
- Extraer helpers pequeños si aporta claridad
- Mantener compatibilidad con el resto del archivo

Devuélveme el código listo para revisar.
```

## Fase 4 — Estructurar los archivos

### Prompt usado

```
Propón una reorganización mínima y realista del proyecto TaskFlow.
No quiero una arquitectura exagerada.
Sugiere cómo separar el código actual en módulos sencillos, por ejemplo:
- state
- storage
- render
- filters
- form
- events

Indica qué moverías primero y con bajo riesgo.
```

---

## Objetivo

Dividir `app.js` por responsabilidades para que deje de ser un bloque gigante. La estructura propuesta separa estado, almacenamiento, filtros, render, formularios y eventos en módulos distintos dentro de `js/modules/`.

---

## Estrategia de modularización

La forma más segura de hacerlo **no es crear archivos nuevos de golpe**, sino modularizar primero dentro del propio `app.js` usando bloques con el patrón IIFE:

```js
const storage = (() => { ... })();
const filters = (() => { ... })();
const render  = (() => { ... })();
```

Esto reduce el riesgo y evita romper los `<script>` del HTML durante la transición.

---

## Orden de migración recomendado

| Prioridad | Módulo | Motivo |
|-----------|--------|--------|
| 1 | `storage` | Apenas depende del DOM; fácil de aislar |
| 2 | `helpers` | Funciones puras sin efectos secundarios |
| 3 | `filters` | Lógica bastante agrupada y acotada |
| 4 | `render` | Más grande, pero mecánico y predecible |
| 5 | `events` | El más delicado; se mueve al final |

---

## Contrato entre módulos

| Módulo | Responsabilidad |
|--------|----------------|
| `state` | Mantiene y expone el estado compartido |
| `storage` | Persiste y recupera datos |
| `filters` | Filtra tareas y sincroniza con el DOM |
| `render` | Pinta la UI a partir del estado |
| `events` | Conecta listeners con acciones |

---

## Commit final

Tras la reorganización, se le pedirá a Cursor que ejecute `git add .` y `git commit`, y que explique brevemente todo lo que ha cambiado.

## Fase 5 — Añadir JSDoc en funciones que realmente lo necesiten

### Prompt usado

Añade comentarios JSDoc a estas funciones.
Prioriza funciones públicas o importantes del flujo:
- creación de tarea
- validación
- persistencia
- filtrado
- render principal

Quiero comentarios breves y útiles, no relleno.

# Conectar servidores MCP

MCP es un protocolo abierto que permite conectar asistentes de IA con herramientas y fuentes de datos externas de manera estandarizada. En lugar de depender solo del prompt, la IA puede leer archivos, consultar servicios o ejecutar acciones a través de servidores MCP. Cursor soporta este protocolo para ampliar lo que el agente puede hacer.

---

## Instalación paso a paso

1. Abrí el proyecto TaskFlow en Cursor.
2. Investigué qué es MCP y confirmé que Cursor permite usar servidores MCP mediante configuración desde Settings.
3. Elegí instalar el servidor `filesystem`, porque es uno de los servidores de referencia del ecosistema MCP y permite trabajar directamente con archivos y carpetas del proyecto.
4. Creé el archivo `.cursor/mcp.json` en la raíz del proyecto. Cursor soporta configuración MCP a nivel de proyecto y también a nivel global.
5. Añadí la configuración del servidor con `npx` y limité el acceso únicamente a la carpeta del proyecto. El servidor filesystem opera solo sobre directorios permitidos.
6. Abrí Settings → Features → Model Context Protocol en Cursor y activé el servidor.
7. Probé varias consultas en el chat para verificar que la IA podía leer y analizar información real del proyecto a través del servidor MCP.

---

## Fase 1 — Conectar y comprobar que MCP está configurado correctamente

Creé `.cursor/mcp.json`, configuré la ruta a mi proyecto y conecté el servidor `filesystem` desde los ajustes de Cursor.

Para comprobar que la conexión funcionaba, usé este prompt en el agente:

```
Usa el servidor filesystem para listar la estructura del proyecto TaskFlow
y dime qué archivos principales hay.
```

El resultado fue el siguiente:

```
Directorios principales: css/, dist/, docs/, images/, js/

Archivos en la raíz: .gitignore, index.html, README.md, package.json,
package-lock.json, postcss.config.mjs, styles.css, tailwind.css, output.css

css/: category-management.css, responsive.css, core/, layout/, components/, utilities/
css/components/: bottom-nav.css, box.css, button.css, chip.css, drawer.css,
  filter.css, form.css, modal.css, nav.css, section.css, stats.css, task.css

docs/ai/: ai-comparison.md, cursor-workflow.md, experiments.md,
  prompt-engineering.md, reflection.md

js/: app.js, filters-drawer.js, mobile-task-form.js, theme.js
dist/: styles.css
images/: task-app-desktop.png, task-app-mobile.png
```

---

## Fase 2 — Cinco consultas usando el servidor MCP

```
Usa filesystem para abrir index.html y explicarme qué inputs forman
el formulario de tareas.
```

```
Usa filesystem para leer el archivo JavaScript principal y decirme
cuáles son las funciones más largas.
```

```
Usa filesystem para buscar todas las funciones relacionadas con filtros
y dime cuáles serían candidatas a refactorización.
```

```
Usa filesystem para buscar en el proyecto la función que lee el valor
del input de nueva tarea y lo guarda de forma persistente. Quiero ver:
1. dónde se lee el .value del input
2. qué función crea el objeto tarea
3. qué función lo guarda en el array tasks
4. qué función lo persiste en localStorage
```

```
Usa filesystem para revisar los archivos CSS y decirme si hay reglas
repetidas o clases mejorables.
```

---

## Conclusión

MCP es útil porque permite que el agente consulte archivos, servicios o repositorios de forma más precisa y reutilizable. Esto mejora tareas como análisis de código, documentación, automatización y soporte al desarrollo.

# Prompt engineering aplicado al desarrollo

## Experimentar con promts,

###Promt con rol:

Actúa como desarrollador frontend senior especializado en Tailwind CSS. Analiza y migra los estilos del proyecto TaskFlow a Tailwind CSS de forma progresiva, manteniendo el layout, la funcionalidad y la estética actual del proyecto.

Condiciones:
- No cambies la lógica JavaScript.
- No modifiques la estructura HTML salvo que sea estrictamente necesario y lo justifiques.
- Respeta los breakpoints actuales (`sm`, `md`, `lg`).
- Mantén el estilo visual existente, incluido el neumorfismo y el soporte de modo claro/oscuro.
- No ensucies el HTML con demasiadas utilidades si es mejor usar `@layer components`, `@apply` o clases semánticas reutilizables.
- Si alguna parte no merece migrarse a Tailwind, conserva el CSS original y explica por qué.
- Puedes sugerir librerías solo si realmente mejoran la solución.

Antes de tocar nada:
1. Revisa todos los archivos responsables del estilo del proyecto.
2. Explícame cuál es el enfoque de migración más viable.
3. Dime qué conviene migrar a Tailwind, qué conviene mantener en CSS y por qué.

Después:
- Propón una migración por fases.
- Aplica los cambios de forma limpia, escalable y bien justificada.
- Muestra los archivos modificados y el código final.

### Promt few-shot

Analiza el proyecto y localiza dónde se gestionan las persistencias actuales. Busca el flujo completo del input del título de nueva tarea: dónde se lee `value`, dónde se guarda en estado y dónde se persiste.

No inventes un `storage.json` si no existe. Reutiliza el sistema real del proyecto, ya sea `localStorage`, `storage.js`, `readStorage/writeStorage` o funciones `save*/load*`.

Después añade persistencia al borrador del input del título para que, si el usuario recarga la página sin enviar la tarea, el texto siga ahí.

Quiero esta salida:
1. archivos encontrados
2. funciones implicadas
3. flujo actual
4. cambio mínimo propuesto
5. código final exacto

Ejemplos:
- Si encuentras `taskTitle.value` dentro de `addTaskFromDesktopForm()`, explica esa cadena.
- Si encuentras `saveTasks()` y `loadTasks()`, reutiliza ese patrón.
- Si existe una clave `LS_*`, añade una nueva clave coherente para el draft del título.

#### Promt con razonamiento por pasos & promt con restricones claras se ha defnidio en promt anteriores. 

### 10 prompts útiles

1. Revisión como desarrollador senior:
Actúa como un desarrollador frontend senior. Revisa esta función de TaskFlow y detecta problemas de legibilidad, bugs potenciales, nombres poco claros y oportunidades de refactor sin cambiar el comportamiento. Devuélveme análisis breve y luego una propuesta de mejora.

2.Refactor con restricciones estrictas:
Refactoriza esta función con estas restricciones:
- no cambies el comportamiento
- no añadas librerías
- no uses clases
- mantén JavaScript vanilla
- usa nombres más claros
- máximo 2 helpers nuevos
Devuelve solo el código final.

3. Explicación paso a paso antes de refactorizar
Analiza esta función paso a paso:
1. qué hace
2. qué entradas recibe
3. qué salida produce
4. qué edge cases tiene
5. cómo la simplificarías sin cambiar el resultado
Después genera la versión refactorizada.

Few-shot para JSDoc

Quiero documentar funciones con este estilo:

/**
 * Guarda la lista de tareas en localStorage.
 * @returns {void}
 */

Ahora añade JSDoc a estas funciones siguiendo exactamente el mismo formato y nivel de detalle.

5. Mejora de nombres

Revisa este bloque de código y propón mejores nombres para variables, parámetros y funciones.
Reglas:
- que expresen intención real
- evita nombres genéricos
- no cambies el comportamiento
- explícame brevemente por qué cada renombrado mejora el código

6. Validaciones del formulario

Revisa el formulario de TaskFlow y propone validaciones adicionales.
Quiero cubrir:
- título vacío o solo espacios
- longitud mínima y máxima
- categoría inválida
- prioridad inválida
- datos corruptos
Después genera el código necesario con cambios pequeños y seguros.

7. Detección de repetición
Busca lógica repetida en este archivo.
Indica:
1. bloques repetidos
2. qué helper extraerías
3. riesgo de cada cambio
4. propuesta final de refactor mínima
No reestructures todo el archivo.

8. Generar función nueva con contrato claro

Necesito una función en JavaScript vanilla para TaskFlow.
Requisitos:
- recibe un array de tareas
- devuelve solo las tareas visibles según filtros activos
- no modifica el array original
- debe ser fácil de testear
- añade un ejemplo de uso

9. Documentación técnica breve

Resume este archivo del proyecto en formato técnico breve:
- responsabilidad principal
- funciones clave
- dependencias
- riesgos o puntos a revisar
Máximo 150 palabras.

10. Revisión final como code reviewer

Actúa como code reviewer.
Revisa este diff y dime:
- posibles roturas
- edge cases no cubiertos
- nombres mejorables
- complejidad innecesaria
- si el cambio está listo para commit o no
No propongas una reescritura total.