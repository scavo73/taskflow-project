const tituloTarea = document.getElementById('tituloTarea');
const listContainer = document.getElementById('listContainer');
const categoriaTarea = document.getElementById('categoria-tarea');
const prioridadTarea = document.getElementById('prioridad-tarea');

const contadorTareas = document.querySelectorAll('.contador-tareas');


const LS_KEY = 'taskflow_tasks';

const demoTasks = [
  { id: 1, title: 'Comprar pan', category: 'Personal', priority: 'Media', done: false },
  { id: 2, title: 'Estudiar JavaScript', category: 'Estudio', priority: 'Alta', done: true },
  { id: 3, title: 'Ir al gimnasio', category: 'Salud', priority: 'Baja', done: false }
];

try {
  tasks = JSON.parse(localStorage.getItem(LS_KEY)) || [];
} catch {
  tasks = [];
}

if (tasks.length === 0) {
  tasks = demoTasks;
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  console.log("debug mode, cuando se borran todas las tareas se crean demo")
}

let nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

function saveTasks() {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

function updateTaskCounter() {
  const tareas = tasks.length;
  contadorTareas.forEach(contador => {
    contador.textContent = tareas;
  });
}

function doneTasksCount() {
  const tareasHechas = tasks.filter(task => task.done).length;
  const contadorHechos = document.querySelector('.progreso__hechos');
  contadorHechos.textContent = tareasHechas;

  const porcentaje = tasks.length === 0 ? 0 : Math.round((tareasHechas / tasks.length) * 100);
  const porcentajeBarra = document.querySelector('.progreso__relleno');
  porcentajeBarra.style.width = porcentaje + '%';
}

function obtenerCategoriasSeleccionadas() {
  const inputs = document.querySelectorAll('input[name="cat"]:checked');
  return [...inputs].map(input => input.value.toLowerCase());
}

function filtrarPorCategorias() {
  const categoriasSeleccionadas = obtenerCategoriasSeleccionadas();

  const tareasFiltradas = categoriasSeleccionadas.length === 0
    ? tasks
    : tasks.filter(task =>
      categoriasSeleccionadas.includes((task.category || '').toLowerCase())
    );

  listContainer.innerHTML = '';
  tareasFiltradas.forEach(renderTask);

  if (window.lucide) lucide.createIcons();
}

function clickCategoria() {
  const categoryInputs = document.querySelectorAll('input[name="cat"]');

  categoryInputs.forEach(input => {
    input.addEventListener('change', filtrarPorCategorias);
  });
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = 'lista-tareas__item';

  const prioClass = (task.priority || 'media').toLowerCase(); // alta|media|baja

  li.innerHTML = `
    <div class="tarea-item">
      <input class="tarea-item__toggle" type="checkbox" id="${task.id}" ${task.done ? 'checked' : ''}/>
      <label class="tarea tarea--content" for="${task.id}">
        <div class="tarea__up">
          <div class="tarea__check">
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
  li.querySelector('.tarea__categoria').textContent = task.category || 'personal';
  li.querySelector('.badge-prioridad').textContent = task.priority || 'media';

  listContainer.prepend(li);
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
    category: categoriaTarea ? categoriaTarea.value : 'personal',
    priority: prioridadTarea ? prioridadTarea.value : 'media',
    done: false
  };

  tasks.push(task);
  saveTasks();
  renderTask(task);
  updateTaskCounter();
  doneTasksCount()
  tituloTarea.value = '';
  if (window.lucide) lucide.createIcons();
}

/* BORRAR + MARCAR */
function activarPersistenciaYBorrado() {
  // borrar
  listContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.tarea__borrar');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const li = btn.closest('.lista-tareas__item');
    const input = li?.querySelector('.tarea-item__toggle');
    const id = Number(input?.id);

    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    updateTaskCounter();
    doneTasksCount()
    li?.remove();
  });

  // marcar/desmarcar
  listContainer.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.tarea-item__toggle');
    if (!checkbox) return;

    const taskId = Number(checkbox.id);
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    // task.done = checkbox.checked;
    saveTasks();
    doneTasksCount()
    updateTaskCounter();
  });
}

/* CARGA INICIAL */
document.addEventListener('DOMContentLoaded', () => {
  renderAll();                 // pinta lo guardado en LocalStorage
  activarPersistenciaYBorrado();
  updateTaskCounter();
  doneTasksCount();
  clickCategoria();
});