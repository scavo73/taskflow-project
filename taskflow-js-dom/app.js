const tituloTarea = document.getElementById('tituloTarea');
const listContainer = document.getElementById('listContainer');

function addTask() {
    const taskTitle = tituloTarea.value.trim();
    if (tituloTarea.value === '') {
        alert('Por favor, ingresa un título para la tarea.');
        return;
    } else {
        const newTask = document.createElement('li');
        newTask.classList.add('lista-tareas__item');
        newTask.textContent = taskTitle;
        listContainer.appendChild(newTask);
        tituloTarea.value = '';
    }
}