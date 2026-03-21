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