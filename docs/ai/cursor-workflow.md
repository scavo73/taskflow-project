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

