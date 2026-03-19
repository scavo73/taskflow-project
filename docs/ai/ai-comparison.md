# AI Comparison

## Qué voy a documentar aquí
En este archivo voy a comparar las herramientas de IA que he probado y explicar de forma simple cuál me ha resultado más útil según la tarea.

## Claude y ChatGPT
Los dos agentes presentan varias similitudes. Por ejemplo, ambos pueden ayudar a crear un proyecto y adaptarlo según las necesidades del usuario. También aceptan archivos, pueden leer su contenido y utilizarlos como contexto. Sin embargo, Claude destaca porque puede conectarse de forma más directa con otras herramientas.

#### Closures, Event Loop, Hoisting 
Les pedí a los dos que explicaran tres conceptos técnicos sin darles contexto adicional: closures, event loop y hoisting. En general, considero que la explicación de Claude tiene más sentido a nivel técnico y de presentación, aunque después de leer la respuesta de ChatGPT vi que también tenía puntos fuertes. ChatGPT me dio una respuesta menos robusta en lo visual y en la interactividad, pero explicó los conceptos con algo más de detalle y con ejemplos más simples de entender.

En cuanto a profundidad, Claude va más al grano, utiliza términos técnicos con más precisión y presenta la información de una forma más visual e interactiva, especialmente en los apartados de closures y event loop. Además, en hoisting ofreció más matices y ejemplos. Aun así, las explicaciones de ChatGPT me parecen más adecuadas para alguien que está empezando, porque resultan más directas y fáciles de seguir. Al final, si no se especifica el tipo de respuesta esperada, cada asistente tiende a enfocar la explicación de una manera algo distinta.

## 1. Crear 3 funciones en JavaScript con errores, pedir al AI que lo corriga.

### Comparación de explicaciones de bugs

### Funciones iniciales:

```js
function promedio(lista) {
  let suma = 0;
  for (let i = 0; i <= lista.length; i++) {
    suma += lista[i];
  }
  return suma / lista.length;
}

function invertirTexto(texto) {
  let resultado = "";
  for (let i = texto.length - 1; i > 0; i--) {
    resultado += texto[i];
  }
  return resultado;
}

function obtenerMayor(numeros) {
  let mayor = 0;
  for (let i = 1; i < numeros.length; i++) {
    if (numeros[i] > mayor) {
      mayor = numeros[i];
    }
  }
  return mayor;
}
```

| # | **Claude** | **ChatGPT** |
|---|------------|-------------|
| **Bug 1 `promedio`** | `<=` hace que el bucle llegue al índice `lista.length`, que no existe, añadiendo `undefined` a la suma y corrompiendo el resultado. **Fix:** cambiar `<=` por `<`. | `<=` hace que el bucle llegue a `i === lista.length`. Ese índice no existe, devuelve `undefined`, y `suma += undefined` da `NaN`. **Fix:** cambiar `<=` por `<`. |
| **Código fix 1** | `for (let i = 0; i < lista.length; i++)` | `for (let i = 0; i < lista.length; i++)` |
| **Bug 2 `invertirTexto`** | `i > 0` detiene el bucle antes del índice `0`, por lo que el primer carácter nunca se incluye. Ej: `"hola"` devuelve `"alo"` en vez de `"aloh"`. **Fix:** cambiar `> 0` por `>= 0`. | `i > 0` hace que el bucle nunca procese el índice `0`, perdiéndose la primera letra. Ej: `"hola"` recorre `a`, `l`, `o` pero omite `h`. **Fix:** cambiar `> 0` por `>= 0`. |
| **Código fix 2** | `for (let i = texto.length - 1; i >= 0; i--)` | `for (let i = texto.length - 1; i >= 0; i--)` |
| **Bug 3 `obtenerMayor`** | Inicializar `mayor = 0` falla con arrays de negativos. Ej: `[-5, -2, -8]` devuelve `0`, que no está en la lista. **Fix:** inicializar con `numeros[0]`. | Inicializar `mayor = 0` falla si todos son negativos. Ej: `[-8, -3, -10]` compara contra `0` y ninguno lo supera, devolviendo `0`. **Fix:** inicializar con `numeros[0]`. |
| **Código fix 3** | `let mayor = numeros[0];` + bucle desde `i = 1` | `let mayor = numeros[0];` + bucle desde `i = 1` |
| **Observación extra** | ❌ No menciona el caso de array vacío | ✅ Menciona que `promedio([])` y `obtenerMayor([])` siguen siendo problemáticos con array vacío |

---

### Código corregido (ambos coinciden)

```js
function promedio(lista) {
  let suma = 0;
  for (let i = 0; i < lista.length; i++) {
    suma += lista[i];
  }
  return suma / lista.length;
}

function invertirTexto(texto) {
  let resultado = "";
  for (let i = texto.length - 1; i >= 0; i--) {
    resultado += texto[i];
  }
  return resultado;
}

function obtenerMayor(numeros) {
  let mayor = numeros[0];
  for (let i = 1; i < numeros.length; i++) {
    if (numeros[i] > mayor) {
      mayor = numeros[i];
    }
  }
  return mayor;
}
```


## 2. Crear 3 promts en lenguaje natural, pedir a AI que explique e implmente las funciones 

## promt 1

promt: Dame una función y su implementación que reciba un objeto, por ejemplo una radio. La función debe comprobar si la radio con esa ID está en venta y, si lo está, imprimir su precio.

| Aspecto | Claude | ChatGPT |
|---|---|---|
| Parámetros | Solo recibe el objeto | Recibe el objeto + ID a buscar |
| Interpretación del enunciado | Asume que el objeto ya es el correcto | Valida que la ID del objeto coincide con la buscada |
| Realismo | Menos realista (no hay búsqueda real) | Más fiel al enunciado ("radio con **esa** ID") |

---

## Versión básica (un solo objeto)

| Claude | ChatGPT |
|---|---|
| `function checkIfOnSaleAndPrintPrice(item)` | `function imprimirPrecioSiEstaEnVenta(radio, idBuscada)` |
| Recibe solo el objeto | Recibe el objeto **y** la ID a comparar |
| No valida la ID | Compara `radio.id !== idBuscada` antes de continuar |
| Usa `item.onSale` | Usa `radio.enVenta === true` |
| Usa `item.price` | Usa `radio.precio` |
| Mensaje detallado con nombre e ID | Mensaje simple solo con el precio |

### Claude
```javascript
function checkIfOnSaleAndPrintPrice(item) {
  if (!item || typeof item !== "object") {
    console.log("El argumento debe ser un objeto válido.");
    return;
  }

  if (item.onSale) {
    console.log(`El artículo "${item.name}" (ID: ${item.id}) está en venta. Precio: ${item.price}€`);
  } else {
    console.log(`El artículo "${item.name}" (ID: ${item.id}) no está en venta.`);
  }
}
```

### ChatGPT
```javascript
function imprimirPrecioSiEstaEnVenta(radio, idBuscada) {
  if (!radio || typeof radio !== "object") {
    console.log("El valor recibido no es un objeto válido.");
    return;
  }

  if (radio.id !== idBuscada) {
    console.log("La radio con esa ID no existe.");
    return;
  }

  if (radio.enVenta === true) {
    console.log(`Precio: ${radio.precio}`);
  } else {
    console.log("La radio no está en venta.");
  }
}
```

---

## Versión con array (múltiples objetos)

Claude no incluía esta variante. ChatGPT la añadió como extensión.

### Código de ChatGPT (array)
```javascript
function imprimirPrecioRadioPorId(radios, idBuscada) {
  const radio = radios.find(r => r.id === idBuscada);

  if (!radio) {
    console.log("No se encontró una radio con esa ID.");
    return;
  }

  if (radio.enVenta) {
    console.log(`Precio: ${radio.precio}`);
  } else {
    console.log("La radio no está en venta.");
  }
}
```

---

## Conclusión

Claude valida la entrada y ofrece mensajes más informativos, pero no valida bien el ID, no incluye versión con array y se aleja más del enunciado.
ChatGPT también valida la entrada, además comprueba el ID, responde más rápido e incluye una versión más completa y usable.
La principal ventaja de Claude está en la explicación del resultado, pero pierde puntos en fidelidad e implementación práctica. 


## promt 2 

Genera una función asincrónica en JavaScript que maneje entrada de datos desde una fuente externa. Debe validar los datos recibidos, capturar excepciones con try/catch, usar async/await correctamente y devolver una respuesta estructurada. Incluye una interpretacion.


| Aspecto | Claude | ChatGPT |
|---|---|---|
| **¿Qué recibe?** | Una `url` (string) | Una función `obtenerDatos` como parámetro |
| **Abstracción de la fuente** | Interna — `fetch` está dentro de la función | Externa — la fuente se inyecta desde fuera |
| **Validación de la fuente** | No valida el parámetro de entrada | Verifica que `obtenerDatos` sea una función |
| **Campos validados** | `id`, `nombre` | `id`, `nombre`, `email` |
| **Normalización de datos** | No aplica | Sí — `.trim()` y `.toLowerCase()` en nombre y email |
| **Estructura del error** | `{ ok, datos, mensaje, timestamp }` | `{ ok, mensaje, error }` |
| **Estructura del éxito** | `{ ok, datos, mensaje, timestamp }` | `{ ok, mensaje, data: { id, nombre, email } }` |
| **`timestamp`** | Incluido en ambos casos | No incluido |
| **Fuente externa simulada** | No incluida | Incluida con `setTimeout` + `Promise` |
| **IIFE de ejemplo** | No incluida | Incluida `(async () => {})()` |
| **Separación de funciones** | 3 funciones separadas | Todo en una sola función |

---

## Código completo — lado a lado

### Función principal

| Claude | ChatGPT |
|---|---|
| Recibe `url` (string) | Recibe `obtenerDatos` (función) |

**Claude**
```javascript
async function manejarEntradaDatos(url) {
  try {
    const datos = await obtenerDatosExternos(url);
    validarDatos(datos);

    return {
      ok:        true,
      datos:     datos,
      mensaje:   "Datos recibidos y validados correctamente.",
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    return {
      ok:        false,
      datos:     null,
      mensaje:   error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
```

**ChatGPT**
```javascript
async function manejarEntradaDatos(obtenerDatos) {
  try {
    if (typeof obtenerDatos !== "function") {
      throw new Error("La fuente de datos debe ser una función.");
    }

    const datos = await obtenerDatos();

    if (!datos || typeof datos !== "object") {
      throw new Error("Los datos recibidos no son válidos.");
    }

    const { id, nombre, email } = datos;

    if (!id || typeof id !== "number")
      throw new Error("El campo 'id' es obligatorio y debe ser numérico.");
    if (!nombre || typeof nombre !== "string")
      throw new Error("El campo 'nombre' es obligatorio y debe ser texto.");
    if (!email || typeof email !== "string" || !email.includes("@"))
      throw new Error("El campo 'email' es obligatorio y debe ser válido.");

    return {
      ok:      true,
      mensaje: "Datos procesados correctamente.",
      data: {
        id,
        nombre: nombre.trim(),
        email:  email.toLowerCase().trim()
      }
    };

  } catch (error) {
    return {
      ok:      false,
      mensaje: "Error al manejar la entrada de datos.",
      error:   error.message
    };
  }
}
```

---

### Funciones auxiliares

**Claude — separadas y reutilizables**
```javascript
// Validación separada — testeable de forma independiente
function validarDatos(datos) {
  if (!datos || typeof datos !== "object")
    throw new Error("Los datos deben ser un objeto válido.");
  if (!datos.id || typeof datos.id !== "number")
    throw new Error("El campo 'id' es obligatorio y debe ser un número.");
  if (!datos.nombre || datos.nombre.trim() === "")
    throw new Error("El campo 'nombre' es obligatorio y no puede estar vacío.");
}

// Petición HTTP separada — reutilizable en otros contextos
async function obtenerDatosExternos(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok)
    throw new Error(`Error HTTP: ${respuesta.status}`);
  return respuesta.json();
}
```

**ChatGPT — fuente simulada incluida como ejemplo**
```javascript
// Simula una API externa con un retraso de 1 segundo
async function fuenteExterna() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: 1, nombre: " Juan Pérez ", email: "JUAN@EMAIL.COM" });
    }, 1000);
  });
}

// Ejemplo de ejecución inmediata
(async () => {
  const respuesta = await manejarEntradaDatos(fuenteExterna);
  console.log(respuesta);
})();
```

---

## Respuesta estructurada comparada

| Campo (exito) | Claude | ChatGPT |
|---|---|---|
| `ok` | `true` | `true` |
| `datos` / `data` | Objeto completo sin modificar | Solo campos desestructurados y normalizados |
| `mensaje` | `"Datos recibidos y validados..."` | `"Datos procesados correctamente."` |
| `timestamp` | ✅ `new Date().toISOString()` | ❌ No incluido |

| Campo (error) | Claude | ChatGPT |
|---|---|---|
| `ok` | `false` | `false` |
| `datos` | `null` | — (no incluido) |
| `mensaje` | Mensaje del error directamente | Mensaje genérico fijo |
| `error` | — (no separado) | `error.message` como campo propio |
| `timestamp` | Incluido | No incluido |

---

## Análisis detallado

### ChatGPT

- **Inyección de dependencia**: recibir `obtenerDatos` como función hace la función más flexible y fácil de testear. No importa si los datos vienen de `fetch`, un formulario o una base de datos.
- **Normalización de datos**: aplica `.trim()` y `.toLowerCase()` antes de devolver, entregando datos limpios listos para usar.
- **Valida el tipo del parámetro de entrada**: comprueba que `obtenerDatos` sea función antes de llamarla, evitando un error confuso en tiempo de ejecución.
- **Ejemplo ejecutable completo**: incluye `fuenteExterna` y la IIFE, por lo que el código se puede copiar y correr directamente.
- **Campo `error` separado de `mensaje`**: distingue entre el mensaje para el usuario y el detalle técnico del error.

### Claude

- **Separación de responsabilidades**: `validarDatos` y `obtenerDatosExternos` son funciones independientes, reutilizables y fáciles de testear unitariamente por separado.
- **`timestamp` en la respuesta**: permite saber cuándo ocurrió el éxito o el error, útil para logging y trazabilidad.
- **Respuesta uniforme total**: los cuatro campos `ok`, `datos`, `mensaje` y `timestamp` aparecen siempre en ambos casos. En ChatGPT, el campo `datos` desaparece en el error.
- **Manejo de errores HTTP explícito**: comprueba `response.ok` y lanza un error descriptivo con el código de estado.

---

### Conclusión

Claude destaca por una estructura más clara y uniforme, con separación de funciones, respuesta fija y timestamp.
ChatGPT es más flexible y práctico, porque acepta cualquier función, valida la entrada y además incluye un ejemplo ejecutable.

---

## promt 3

Dame una función que devuelva una lista de todos los productos filtrados de más barato a más caro, mapeando solo los elementos que aún no están en venta. Implmentala.

---

| Aspecto | Claude | ChatGPT |
|---|---|---|
| **Nombre de la función** | `filtrarYOrdenarProductos` | `obtenerProductosNoEnVentaOrdenados` |
| **Orden de operaciones** | `filter → map → sort` | `filter → sort → map` |
| **Comparación en filter** | `!p.enVenta` | `producto.enVenta === false` |
| **Robustez del orden** | El sort opera sobre el objeto ya reducido | El sort opera sobre el objeto completo |
| **Desestructuración en map** | `p => ({ id, nombre, precio })` con variable | `({ id, nombre, precio }) => ({...})` directa |
| **Ejemplo de uso incluido** | Sí (widget interactivo) | Sí (consola) |
| **Salida mostrada** | Visual con ranking | `console.log` |

---

## Código completo — lado a lado

**Mi versión**
```javascript
function filtrarYOrdenarProductos(productos) {
  return productos
    .filter(p => !p.enVenta)           // elimina los en venta
    .map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio })) // solo campos útiles
    .sort((a, b) => a.precio - b.precio); // más barato primero
}
```

**ChatGPT**
```javascript
function obtenerProductosNoEnVentaOrdenados(productos) {
  return productos
    .filter(producto => producto.enVenta === false)
    .sort((a, b) => a.precio - b.precio)
    .map(({ id, nombre, precio }) => ({
      id,
      nombre,
      precio
    }));
}
```

---

## El detalle clave: orden de `.map()` y `.sort()`

Este es el único punto técnico donde las dos versiones difieren de verdad.

### Claude: `filter → map → sort`
```javascript
.filter(p => !p.enVenta)
.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio }))
.sort((a, b) => a.precio - b.precio) // ordena el objeto YA reducido
```
- El objeto que llega al `sort` es más ligero (solo 3 campos)
- Solo funciona si `precio` está incluido en el `map` — si lo eliminas, el sort queda roto

### ChatGPT: `filter → sort → map`
```javascript
.filter(producto => producto.enVenta === false)
.sort((a, b) => a.precio - b.precio) // ordena el objeto completo
.map(({ id, nombre, precio }) => ({ id, nombre, precio }))
```
- El `sort` trabaja sobre el objeto original con todos sus campos
- Si el `map` cambia o elimina `precio`, el orden no se ve afectado
- Recorre un objeto más grande durante la ordenación (impacto mínimo en la práctica)

**Conclusión:** el orden de ChatGPT (`sort` antes que `map`) es más robusto porque desacopla la ordenación del mapeo. El resultado final es idéntico en ambos casos con estos datos.

---

## Comparación del filter

| | Claude | ChatGPT |
|---|---|---|
| **Expresión** | `!p.enVenta` | `producto.enVenta === false` |
| **¿Qué excluye?** | `true`, `1`, cualquier valor truthy | Solo el booleano estricto `false` |
| **¿Incluye `undefined`?** | ❌ Lo excluye (undefined es falsy) | Lo incluye (undefined !== false) |
| **Recomendación** | Válido si el campo siempre existe | Más seguro si el campo puede faltar |

Ejemplo donde difieren:
```javascript
{ id: 5, nombre: "Producto X", precio: 20 }
// sin campo enVenta

!p.enVenta              // → true  → INCLUIDO  (undefined es falsy)
p.enVenta === false     // → false → EXCLUIDO  (undefined !== false)
```

---

## Desestructuración en `.map()`

**Mi versión** — acceso explícito con variable:
```javascript
.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio }))
```

**ChatGPT** — desestructuración directa en el parámetro:
```javascript
.map(({ id, nombre, precio }) => ({ id, nombre, precio }))
```

Ambas son equivalentes. La de ChatGPT es más idiomática y concisa en JavaScript moderno.

---

### Conclusión

ChatGPT tomó mejores decisiones en los tres detalles técnicos: orden de operaciones, comparación estricta en el filter y desestructuración directa. El código es más corto, más seguro y más idiomático. Claude es funcional pero menos defensiva.