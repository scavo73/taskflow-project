const tituloTarea = document.getElementById('tituloTarea');
const listContainer = document.getElementById('listContainer');
const categoriaTarea = document.getElementById('categoriaTarea') || document.getElementById('categoria-tarea');
const prioridadTarea = document.getElementById('prioridadTarea') || document.getElementById('prioridad-tarea');

const LS_KEY = 'taskflow_tasks';
let tasks = JSON.parse(localStorage.getItem(LS_KEY)) || [];
let nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

function saveTasks() {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'lista-tareas__item';

    const prioClass = (task.priority || 'Media').toLowerCase(); // alta|media|baja

    li.innerHTML = `
    <div class="tarea-item">
      <input class="tarea-item__toggle" type="checkbox" id="tarea-${task.id}" ${task.done ? 'checked' : ''}/>
      <label class="tarea tarea--content" for="tarea-${task.id}">
        <div class="tarea__up">
          <div class="tarea__check">
            <span class="tarea__cuadro" aria-hidden="true"><i data-lucide="check"></i></span>
            <span class="tarea__titulo"></span>
          </div>
          <span class="badge-prioridad badge-prioridad--${prioClass}"></span>
        </div>
        <div class="tarea__down">
          <div class="tarea__categorias">
            <span class="tarea__categoria"></span>
          </div>
          <button class="badge tarea__borrar" type="button">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </div>
      </label>
    </div>
  `;

    li.querySelector('.tarea__titulo').textContent = task.title;
    li.querySelector('.tarea__categoria').textContent = task.category || 'Personal';
    li.querySelector('.badge-prioridad').textContent = task.priority || 'Media';

    listContainer.appendChild(li);
}

function renderAll() {
    listContainer.innerHTML = '';            // evita duplicados
    tasks.forEach(renderTask);
    if (window.lucide) lucide.createIcons();
}

function addTask() {
    const taskTitle = tituloTarea.value.trim();
    if (taskTitle === '') {
        alert('Por favor, ingresa un título para la tarea.');
        return;
    }

    const task = {
        id: nextId++,
        title: taskTitle,
        category: categoriaTarea ? categoriaTarea.value : 'Personal',
        priority: prioridadTarea ? prioridadTarea.value : 'Media',
        done: false
    };

    tasks.push(task);
    saveTasks();
    renderTask(task);

    tituloTarea.value = '';
    if (window.lucide) lucide.createIcons();
}

/* BORRAR + MARCAR (cualquier tarea, incluso las nuevas) */
function activarPersistenciaYBorrado() {
    // borrar
    listContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.tarea__borrar');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const li = btn.closest('.lista-tareas__item');
        const input = li?.querySelector('.tarea-item__toggle');
        const id = Number(input?.id?.replace('tarea-', ''));

        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        li?.remove();
    });

    // marcar/desmarcar
    listContainer.addEventListener('change', (e) => {
        const input = e.target.closest('.tarea-item__toggle');
        if (!input) return;

        const id = Number(input.id.replace('tarea-', ''));
        const t = tasks.find(x => x.id === id);
        if (!t) return;

        t.done = input.checked;
        saveTasks();
    });
}

/* CARGA INICIAL */
document.addEventListener('DOMContentLoaded', () => {
    renderAll();                 // pinta lo guardado en LocalStorage
    activarPersistenciaYBorrado();
});