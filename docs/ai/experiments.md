# Experiments

## Qué voy a documentar aquí
En este archivo voy a guardar pruebas y experimentos hechos con herramientas de IA durante el proyecto.

## Elige tres pequeños problemas de programación

# Problema 1: Filtrar y ordenar productos de menor a mayor precio

En este ejemplo creé un array de objetos de tienda con Claude, luego manualmente escribí dos funciones:

## 1. `SortProducts(products)`

- Copia el array original con spread operator `[...products]` para no mutarlo
- Aplica **Bubble Sort** manualmente: dos bucles anidados que comparan productos adyacentes y los intercambian usando una variable `temp` si el precio del izquierdo es mayor

## 2. `FilterProducts(productsArray)`

- Recorre el array ya ordenado
- Guarda en un nuevo array solo los productos donde `onSale === true`
- Usa un índice `j` separado para ir rellenando el array filtrado

## Flujo final

```
products → SortProducts() → productsArray → FilterProducts() → filteredProducts
```

---

Después comparé esta solución con la versión de Claude usando `.filter()` + `.sort()` encadenados — mucho más corta, pero por debajo hace exactamente lo mismo.

El código completo lo puedes encontrar en **`ai-experiments.js`**.


# Problema 2: Encontrar duplicados en un array

En este ejemplo creé un array de números con duplicados con Claude, luego manualmente escribí una función y la comparé con la versión de Claude:

## 1. `findDuplicates(numbers)` — versión manual

- Usa **dos bucles anidados**: el exterior fija un número, el interior lo compara con todos los siguientes
- Si encuentra una coincidencia, lo añade a `duplicates`

## 2. `findDuplicates(numbers)` — versión Claude

- `.filter()` se queda con los números cuya primera aparición no coincide con el índice actual — es decir, están repetidos
- `new Set()` elimina los duplicados del resultado
- `[...` `]` convierte el Set de vuelta a array

## Flujo final

```
numbers → findDuplicates() → duplicates
```

---

Mucho más corta que la versión manual, pero hace exactamente lo mismo.

El código completo lo puedes encontrar en **`ai-experiments.js`**.

# Problema 3: Validar un formulario simple

En este ejemplo creé un objeto `form` con título y contenido, luego escribí una función que valida cada campo y devuelve errores claros:

## 1. `validateForm(form)`

- Comprueba cada campo en orden: **vacío → mínimo → máximo**
- Acumula todos los errores en un array para devolverlos todos a la vez
- Si no hay errores, devuelve un mensaje de éxito

## Reglas de validación

| Campo | Mínimo | Máximo |
|-------|--------|--------|
| `title` | 3 caracteres | 50 caracteres |
| `content` | 10 caracteres | 500 caracteres |

## Flujo final

```
form → validateForm() → errors[] o "Formulario válido ✓"
```

---

El código completo lo puedes encontrar en **`ai-experiments.js`**.