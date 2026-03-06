const tituloTarea = document.getElementById('tituloTarea');
const listContainer = document.getElementById('listContainer');

let nextId = listContainer.querySelectorAll('.tarea-item__toggle').length + 1;

function addTask() {
    const taskTitle = tituloTarea.value.trim();

    if (taskTitle === '') {
        alert('Por favor, ingresa un título para la tarea.');
        return;
    }

    const newTask = document.createElement('li');
    newTask.classList.add('lista-tareas__item');

    newTask.innerHTML = `
    <div class="tarea-item">
      <input class="tarea-item__toggle" type="checkbox" id="tarea-${nextId}" />
      <label class="tarea tarea--content" for="tarea-${nextId}">
        <div class="tarea__up">
          <div class="tarea__check">
            <span class="tarea__cuadro" aria-hidden="true">
              <i data-lucide="check"></i>
            </span>
            <span class="tarea__titulo"></span>
          </div>
          <span class="badge-prioridad badge-prioridad--media">Media</span>
        </div>
        <div class="tarea__down">
          <div class="tarea__categorias">
            <span class="tarea__categoria">Personal</span>
          </div>
          <button class="badge tarea__borrar" type="button">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </div>
      </label>
    </div>
  `;

    newTask.querySelector('.tarea__titulo').textContent = taskTitle;

    listContainer.appendChild(newTask);
    tituloTarea.value = '';
    nextId++;

    if (window.lucide) lucide.createIcons();
}