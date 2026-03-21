

// Problema 1: filtrar y ordenar productos
// recibir un array de productos
// devolver solo los que están en venta
// ordenarlos de más barato a más caro

// he creado con claude el array de prodcutos

// const products = [
//     {
//       id: 1,
//       name: "Teclado mecánico TKL",
//       price: 89.99,
//       category: "periféricos",
//       onSale: true
//     },
//     {
//       id: 2,
//       name: "Monitor 27\" 144Hz",
//       price: 299.99,
//       category: "monitores",
//       onSale: false
//     },
//     {
//       id: 3,
//       name: "Silla ergonómica Pro",
//       price: 459.00,
//       category: "mobiliario",
//       onSale: true
//     },
//     {
//       id: 4,
//       name: "Webcam 1080p",
//       price: 74.50,
//       category: "periféricos",
//       onSale: false
//     }
//   ]

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

// function filterAndSortProducts(products) {
//   return products
//       .filter(product => product.onSale)
//       .sort((a, b) => a.price - b.price);
// }

// const result = filterAndSortProducts(products);
// console.log(result);



// Problema 2: encontrar duplicados en un array
// recibir una lista de números
// devolver cuáles están repetidos


// const numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];

// function findDuplicates(numbers) {
//   const duplicates = [];
//   for (let i = 0; i < numbers.length; i++) {
//     for (let j = i + 1; j < numbers.length; j++) {
//       if (numbers[i] === numbers[j]) {
//         duplicates.push(numbers[i]);
//       }
//     }
//   }
//   return duplicates;
// }

// // funcion para encontrar duplicados con AI Claude
// function findDuplicates(numbers) {
//   return [...new Set(numbers.filter((num, i) => numbers.indexOf(num) !== i))];
// }

// console.log(findDuplicates(numbers));


// Problema 3: validar un formulario simple

// validar titulo/contenido/
// no vacío
// longitud mínima y máxima
// devolver errores claros

// const form = {
//   title: "Hello World",
//   description: "This is a description"
// }


// function validateForm(form) {
//   if (form.title === "") {
//     return "El titulo no puede estar vacío"
//   }
//   if (form.description === "") {
//     return "El contenido no puede estar vacío"
//   }
//   if (form.title.length < 3) {
//     return "El titulo debe tener al menos 3 caracteres"
//   }
//   if (form.description.length < 3) {
//     return "El contenido debe tener al menos 3 caracteres"
//   }
//   return "Formulario validado correctamente"
// }

// funcion para validar el formulario con AI Claude
const form = {
  title: "Hola",
  content: ""
};

function validateForm(form) {
  const errors = [];

  if (!form.title) {
    errors.push("El título no puede estar vacío");
  } else if (form.title.length < 3) {
    errors.push("El título debe tener al menos 3 caracteres");
  } else if (form.title.length > 50) {
    errors.push("El título no puede superar los 50 caracteres");
  }

  if (!form.content) {
    errors.push("El contenido no puede estar vacío");
  } else if (form.content.length < 10) {
    errors.push("El contenido debe tener al menos 10 caracteres");
  } else if (form.content.length > 500) {
    errors.push("El contenido no puede superar los 500 caracteres");
  }

  return errors.length > 0 ? errors : "Formulario válido ✓";
}


console.log(validateForm(form));