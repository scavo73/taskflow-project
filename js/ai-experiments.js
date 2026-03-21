

// Problema 1: filtrar y ordenar productos
// recibir un array de productos
// devolver solo los que están en venta
// ordenarlos de más barato a más caro

// he creado con claude el array de prodcutos

const products = [
    {
      id: 1,
      name: "Teclado mecánico TKL",
      price: 89.99,
      category: "periféricos",
      onSale: true
    },
    {
      id: 2,
      name: "Monitor 27\" 144Hz",
      price: 299.99,
      category: "monitores",
      onSale: false
    },
    {
      id: 3,
      name: "Silla ergonómica Pro",
      price: 459.00,
      category: "mobiliario",
      onSale: true
    },
    {
      id: 4,
      name: "Webcam 1080p",
      price: 74.50,
      category: "periféricos",
      onSale: false
    }
  ]

// funcion para ordenar los productos de más barato a más caro
// function SortProducts(products) {
//   const productsArray = [...products]

//   for(let i = 0; i < productsArray.length; i++) {
//       for(let j = 0; j < productsArray.length -1; j++) {   
//           if(productsArray[j].price > productsArray[j + 1].price) {
//             const temp = productsArray[j + 1]
//             productsArray[j + 1] = productsArray[j]
//             productsArray[j] = temp
//           }
//         }
//       }
//    return productsArray
// }
 
// function FilterProducts(productsArray) {
//   const filteredProducts = [];
//   let j = 0;

//   for (let i = 0; i < productsArray.length; i++) {
//     if (productsArray[i].onSale === true) {
//       filteredProducts[j] = productsArray[i];
//       j++;
//     }
//   }

//   return filteredProducts;
// }


// const productsArray = SortProducts(products)
// const filteredProducts = FilterProducts(productsArray)

// Filtrar productos en venta y ordenar de más barato a más caro con AI Claude

function filterAndSortProducts(products) {
  return products
      .filter(product => product.onSale)
      .sort((a, b) => a.price - b.price);
}

const result = filterAndSortProducts(products);
console.log(result);
