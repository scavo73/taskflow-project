// app.js

// =====================================================
// CAPA 1: REFERENCIAS DEL DOM
// =====================================================
const tituloTarea = document.getElementById('tituloTarea');
const listContainer = document.getElementById('listContainer');
const categoriaTarea = document.getElementById('categoria-tarea');
const prioridadTarea = document.getElementById('prioridad-tarea');
const listaFiltrosSelecionados = document.getElementById('lista-filtros-selecionados');
const buscarTareas = document.getElementById('buscarTareas');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

const contadorTareas = document.querySelectorAll('.contador-tareas');
const nombresCategorias = document.querySelectorAll('input[name="cat"]');
const inputsPrioridad = document.querySelectorAll('input[name="prioridad"]');
const inputsEstado = document.querySelectorAll('input[name="estado"]');

// =====================================================
// CAPA 2: CONFIGURACIÓN Y CONSTANTES
// =====================================================

// Claves Local Storage
const LS_KEY = 'taskflow_tasks';
const LS_FILTERS_KEY = 'taskflow_selected_categories';
const LS_PRIORITY_KEY = 'taskflow_selected_priority';
const LS_STATUS_KEY = 'taskflow_selected_status';
const LS_SEARCH_KEY = 'taskflow_search_text';

// Demo
const demoTasks = [
  { id: 1, title: 'Comprar pan', category: 'Personal', priority: 'Media', done: false },
  { id: 2, title: 'Estudiar JavaScript', category: 'Estudio', priority: 'Alta', done: false },
  { id: 3, title: 'Ir al gimnasio', category: 'Salud', priority: 'Baja', done: true },
  { id: 4, title: 'Enviar propuesta al cliente', category: 'Trabajo', priority: 'Alta', done: false },
  { id: 5, title: 'Preparar apuntes de CSS', category: 'Estudio', priority: 'Media', done: true },
  { id: 6, title: 'Pedir cita médica', category: 'Salud', priority: 'Alta', done: false }
];

// =====================================================
// CAPA 3: ESTADO
// =====================================================

// Inicilizar variables, serviran para crear areglo de tareas y el ID
let tasks = [];
let nextId = 1;

function syncGlobalTasks() {
  window.tasks = tasks;
}

// =====================================================
// CAPA 4: UTILIDADES
// =====================================================

// Limpiar el texto, pone en minuscula, quitan espacios, separan letras y tildes, elimina tildes.
function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// convertir prioridades en formato facil de usar
function normalizePriority(value) {
  const v = String(value || '').toLowerCase().trim();

  if (v === 'alta' || v === 'high') return 'high';
  if (v === 'media' || v === 'med' || v === 'medium') return 'med';
  if (v === 'baja' || v === 'low') return 'low';

  return 'med';
}

// devolver etiqueta con priridad
function setPriorityLabel(value) {
  const normalized = normalizePriority(value);

  if (normalized === 'high') return 'Alta';
  if (normalized === 'low') return 'Baja';
  return 'Media';
}

// devolver etiqueta de estado
function setStatusLabel(value) {
  if (value === 'pending') return 'Pendientes';
  if (value === 'done') return 'Completadas';
  return 'Todos';
}

// devolver etiqueta con priridad
function setCategoryLabel(value) {
  if (value === 'trabajo') return 'Trabajo';
  if (value === 'estudio') return 'Estudio';
  if (value === 'personal') return 'Personal';
  return 'Salud';
}


function hasActiveFilters() {
  return (
    getSelectedStatus() !== 'all' ||
    getSelectedPriorities().length > 0 ||
    getSelectedCategories().length > 0
  );
}

function clearAllFilters() {
  inputsEstado.forEach(input => {
    input.checked = input.value === 'all';
  });

  inputsPrioridad.forEach(input => {
    input.checked = false;
  });

  nombresCategorias.forEach(input => {
    input.checked = false;
  });

  saveSelectedStatus();
  saveSelectedPriority();
  saveSelectedFilters();
  refreshUI();
}

// =====================================================
// CAPA 5: PERSISTENCIA
// =====================================================

// Cargar tareas desde localStorage
function loadTasks() {

  // lee el string guardado, convierte en array en contrario usa []
  try {
    tasks = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    tasks = [];
  }

  // carga demo is no hay nada
  if (tasks.length === 0) {
    tasks = [...demoTasks];
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
    console.log('debug mode, cuando se borran todas las tareas se crean demo');
  }

  // mapea todas las tares, saca con el id mas alto, y a aprtir de ahi le suma una para nueva tarea
  nextId = tasks.length ? Math.max(...tasks.map(task => task.id)) + 1 : 1;
  syncGlobalTasks();
}

// encadena la tarea y lo guarda
function saveTasks() {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  syncGlobalTasks();
}

// carga categorias selcionadas
function loadSelectedFilters() {
  let savedCategories = [];

  try {
    savedCategories = JSON.parse(localStorage.getItem(LS_FILTERS_KEY)) || [];
  } catch {
    savedCategories = [];
  }

  nombresCategorias.forEach(input => {
    input.checked = savedCategories.includes(input.value.toLowerCase());
  });
}

// guarda categorias en local storage
function saveSelectedFilters() {
  localStorage.setItem(LS_FILTERS_KEY, JSON.stringify(getSelectedCategories()));
}

// guarda prioridades selcionadas
function saveSelectedPriority() {
  localStorage.setItem(LS_PRIORITY_KEY, JSON.stringify(getSelectedPriorities()));
}

// carga prioridades selecionadas
function loadSelectedPriority() {
  let savedPriorities = [];

  try {
    savedPriorities = JSON.parse(localStorage.getItem(LS_PRIORITY_KEY)) || [];
  } catch {
    savedPriorities = [];
  }

  inputsPrioridad.forEach(input => {
    input.checked = savedPriorities.includes(input.value);
  });
}

// guarda estado selecionado
function saveSelectedStatus() {
  localStorage.setItem(LS_STATUS_KEY, getSelectedStatus());
}

// carga estado selecionado
function loadSelectedStatus() {
  const savedStatus = localStorage.getItem(LS_STATUS_KEY) || 'all';

  inputsEstado.forEach(input => {
    input.checked = input.value === savedStatus;
  });
}

// guarda string de searhcbar
function saveSearchTerm() {
  if (!buscarTareas) return;
  localStorage.setItem(LS_SEARCH_KEY, buscarTareas.value.trim());
}

// carga string de storage
function loadSearchTerm() {
  if (!buscarTareas) return;
  buscarTareas.value = localStorage.getItem(LS_SEARCH_KEY) || '';
}

// =====================================================
// CAPA 6: SELECTORES / LECTURA DE UI
// =====================================================

// extrea categorias selecionadas
function getSelectedCategories() {
  return [...nombresCategorias]
    .filter(input => input.checked)
    .map(input => input.value.toLowerCase());
}

// extrea prioridades selciocionadas
function getSelectedPriorities() {
  return [...inputsPrioridad]
    .filter(input => input.checked)
    .map(input => input.value);
}

// extra estado selecionado
function getSelectedStatus() {
  return document.querySelector('input[name="estado"]:checked')?.value || 'all';
}

// extra texto del searchbar
function getSearchTerm() {
  return buscarTareas ? buscarTareas.value.trim() : '';
}

// =====================================================
// CAPA 7: LÓGICA DE NEGOCIO
// =====================================================

// Filtracion de tareas por estado prioridad categoria y busqueda
function getFilteredTasks() {
  const categoriasSeleccionadas = getSelectedCategories();
  const prioridadesSeleccionadas = getSelectedPriorities();
  const estadoSeleccionado = getSelectedStatus();
  const textoBusqueda = normalizeText(getSearchTerm());

  return tasks.filter(task => {
    const taskCategory = String(task.category || '').toLowerCase().trim();
    const taskPriority = normalizePriority(task.priority);
    const searchableText = normalizeText(`${task.title} ${task.category}`);

    const matchesCategory =
      categoriasSeleccionadas.length === 0 ||
      categoriasSeleccionadas.includes(taskCategory);

    const matchesPriority =
      prioridadesSeleccionadas.length === 0 ||
      prioridadesSeleccionadas.includes(taskPriority);

    const matchesStatus =
      estadoSeleccionado === 'all' ||
      (estadoSeleccionado === 'pending' && !task.done) ||
      (estadoSeleccionado === 'done' && task.done);

    const matchesSearch =
      textoBusqueda === '' ||
      searchableText.includes(textoBusqueda);

    return matchesCategory && matchesPriority && matchesStatus && matchesSearch;
  });
}

// Crear objeto tarea
function createTaskData({ title, category, priority }) {
  return {
    id: nextId++,
    title: title.trim(),
    category: category || 'Personal',
    priority: priority || 'Media',
    done: false
  };
}

// Get inputs de tarea desde campo de formualrio
function addTaskFromData({ title, category, priority }) {
  const cleanTitle = String(title || '').trim();

  if (!cleanTitle) {
    return { ok: false, error: 'Título vacío' };
  }

  const task = createTaskData({
    title: cleanTitle,
    category,
    priority
  });

  tasks.push(task);
  saveTasks();
  refreshUI();

  return { ok: true, task };
}

// Crea nueva tarea de Formulario
function addTaskFromDesktopForm() {
  if (!tituloTarea) return;

  const result = addTaskFromData({
    title: tituloTarea.value,
    category: categoriaTarea ? categoriaTarea.value : 'Personal',
    priority: prioridadTarea ? prioridadTarea.value : 'Media'
  });

  if (!result.ok) {
    alert('Por favor, ingresa un título para la tarea.');
    tituloTarea.focus();
    return;
  }

  tituloTarea.value = '';
}

// Borra tarea, crea nueva lista sin el ID selecionado.
function removeTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  refreshUI();
}

// Marcar tarea como hecha o no hecha
function toggleTask(taskId, isDone) {
  const task = tasks.find(task => task.id === taskId);
  if (!task) return;

  task.done = isDone;
  saveTasks();
  refreshUI();
}

// =====================================================
// CAPA 8: RENDER / UI
// =====================================================

// Crear una trea en UI o pintar tarea
function renderTask(task) {
  const li = document.createElement('li');
  li.className = 'lista-tareas__item';
  const normalizedPriority = normalizePriority(task.priority);
  li.innerHTML = `
      <div class="tarea-item">
        <input
          class="tarea-item__toggle"
          type="checkbox"
          id="task-${task.id}"
          ${task.done ? 'checked' : ''}
        />

        <label class="tarea tarea--content" for="task-${task.id}">
          <div class="tarea__up">
            <div class="tarea__check">
              <span class="tarea__titulo"></span>
            </div>

            <span class="badge-prioridad badge-prioridad--${normalizedPriority}"></span>
          </div>

          <div class="tarea__down">
            <div class="tarea__categorias">
              <span class="tarea__categoria"></span>
            </div>

            <button
              class="badge tarea__borrar"
              type="button"
              data-task-id="${task.id}"
              aria-label="Borrar tarea ${task.title}"
            >
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </label>
      </div>
    `;

  li.querySelector('.tarea__titulo').textContent = task.title;
  li.querySelector('.tarea__categoria').textContent = task.category || 'Personal';
  li.querySelector('.badge-prioridad').textContent = setPriorityLabel(task.priority);

  return li;
}

// Crear filtros UI abajo de barra de searchbar
function renderSelectedFilters() {
  if (!listaFiltrosSelecionados) return;

  listaFiltrosSelecionados.innerHTML = '';

  const categoriasSeleccionadas = getSelectedCategories();
  const prioridadesSeleccionadas = getSelectedPriorities();
  const estadoSeleccionado = getSelectedStatus();

  if (estadoSeleccionado !== 'all') {
    const li = document.createElement('li');
    li.className = 'filtro__elegido-item';

    li.innerHTML = `
        <button
          type="button"
          class="badge filtro__badge cerrar__filtro"
          data-estado="${estadoSeleccionado}"
          aria-label="Quitar filtro de estado ${setStatusLabel(estadoSeleccionado)}"
        >
          <span>${setStatusLabel(estadoSeleccionado)}</span>
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      `;

    listaFiltrosSelecionados.appendChild(li);
  }

  prioridadesSeleccionadas.forEach(prioridad => {
    const li = document.createElement('li');
    li.className = 'filtro__elegido-item';

    li.innerHTML = `
        <button
          type="button"
          class="badge filtro__badge cerrar__filtro"
          data-prioridad="${prioridad}"
          aria-label="Quitar filtro de prioridad ${setPriorityLabel(prioridad)}"
        >
          <span>${setPriorityLabel(prioridad)}</span>
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      `;

    listaFiltrosSelecionados.appendChild(li);
  });

  categoriasSeleccionadas.forEach(categoria => {
    const li = document.createElement('li');
    li.className = 'filtro__elegido-item';

    li.innerHTML = `
        <button
          type="button"
          class="badge filtro__badge cerrar__filtro"
          data-categoria="${categoria}"
          aria-label="Quitar filtro ${categoria}"
        >
          <span>${setCategoryLabel(categoria)}</span>
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      `;

    listaFiltrosSelecionados.appendChild(li);
  });

  if (hasActiveFilters()) {
    const liClearAll = document.createElement('li');
    liClearAll.className = 'filtro__elegido-item filtro__elegido-item--clear-all';

    liClearAll.innerHTML = `
    <button
      type="button"
      class="badge filtro__badge filtro__badge--clear-all limpiar-todos-filtros"
      aria-label="Limpiar todos los filtros"
    >
      <span>Limpiar filtros</span>
    </button>
  `;

    listaFiltrosSelecionados.appendChild(liClearAll);
  }
}

// pinta visibilidad del boton limpiar filtros
function renderClearFiltersButton() {
  if (!btnLimpiarFiltros) return;
  btnLimpiarFiltros.hidden = !hasActiveFilters();
}

// crea lista de treas filtradas
function renderTasksList() {
  if (!listContainer) return;

  const filteredTasks = getFilteredTasks();
  listContainer.innerHTML = '';

  [...filteredTasks].reverse().forEach(task => {
    listContainer.appendChild(renderTask(task));
  });

  renderSelectedFilters();
  renderClearFiltersButton();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// cuenta todas las tareas
function updateTaskCounter() {
  const total = tasks.length;

  contadorTareas.forEach(contador => {
    contador.textContent = total;
  });
}

// cuenta tareas completadas, actuliza campos num y barra de progreso
function doneTasksCount() {
  const tareasHechas = tasks.filter(task => task.done).length;
  const contadorHechos = document.querySelector('.progreso__hechos');
  const porcentajeBarra = document.querySelector('.progreso__relleno');

  if (contadorHechos) {
    contadorHechos.textContent = tareasHechas;
  }

  if (porcentajeBarra) {
    const porcentaje = tasks.length === 0 ? 0 : Math.round((tareasHechas / tasks.length) * 100);
    porcentajeBarra.style.width = `${porcentaje}%`;
  }
}

// Refresa la ui cuando se hacen cambio sea aniadir un tarea borrar o cabiar busqueda
function refreshUI() {
  renderTasksList();
  updateTaskCounter();
  doneTasksCount();
}

// =====================================================
// CAPA 9: EVENTOS
// =====================================================

// Cuando se envia el formulario preveiene que la pagina se actulice
function bindDesktopForm() {
  const desktopForm = document.querySelector('.tarea.tarea-nueva');
  if (!desktopForm) return;

  desktopForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTaskFromDesktopForm();
  });
}

// Cuando se hace algun cabio relacionado con borrar o completar, previene a que la apgina se recargue
function bindListEvents() {
  if (!listContainer) return;

  listContainer.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('.tarea__borrar');
    if (!deleteBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const taskId = Number(deleteBtn.dataset.taskId);
    if (!taskId) return;

    removeTask(taskId);
  });

  listContainer.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.tarea-item__toggle');
    if (!checkbox) return;

    const rawId = checkbox.id.replace('task-', '');
    const taskId = Number(rawId);

    if (!taskId) return;
    toggleTask(taskId, checkbox.checked);
  });
}

// Caundo se escribe en searchbar se actuliza la UI
function bindSearchEvents() {
  if (!buscarTareas) return;

  buscarTareas.addEventListener('input', () => {
    saveSearchTerm();
    refreshUI();
  });

  buscarTareas.addEventListener('search', () => {
    saveSearchTerm();
    refreshUI();
  });
}

// Cuando se cambian los filtros repinta
function bindFilterEvents() {
  nombresCategorias.forEach(input => {
    input.addEventListener('change', () => {
      saveSelectedFilters();
      refreshUI();
    });
  });

  inputsPrioridad.forEach(input => {
    input.addEventListener('change', () => {
      saveSelectedPriority();
      refreshUI();
    });
  });

  inputsEstado.forEach(input => {
    input.addEventListener('change', () => {
      saveSelectedStatus();
      refreshUI();
    });
  });

  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener('click', () => {
      clearAllFilters();
    });
  }

  if (!listaFiltrosSelecionados) return;

  listaFiltrosSelecionados.addEventListener('click', (event) => {
    const btnLimpiarTodoLista = event.target.closest('.limpiar-todos-filtros');

    if (btnLimpiarTodoLista) {
      clearAllFilters();
      return;
    }

    const btnCerrar = event.target.closest('.cerrar__filtro');
    if (!btnCerrar) return;

    const categoria = btnCerrar.dataset.categoria;
    const prioridad = btnCerrar.dataset.prioridad;
    const estado = btnCerrar.dataset.estado;
    const busqueda = btnCerrar.dataset.busqueda;

    if (categoria) {
      const inputCategoria = [...nombresCategorias].find(input =>
        input.value.toLowerCase() === categoria.toLowerCase()
      );

      if (inputCategoria) {
        inputCategoria.checked = false;
      }

      saveSelectedFilters();
    }

    if (prioridad) {
      const inputPrioridad = [...inputsPrioridad].find(input => input.value === prioridad);

      if (inputPrioridad) {
        inputPrioridad.checked = false;
      }

      saveSelectedPriority();
    }

    if (estado) {
      const radioTodos = document.querySelector('input[name="estado"][value="all"]');

      if (radioTodos) {
        radioTodos.checked = true;
      }

      saveSelectedStatus();
    }

    if (busqueda && buscarTareas) {
      buscarTareas.value = '';
      saveSearchTerm();
    }

    refreshUI();
  });
}

// =====================================================
// CAPA 10: INICIALIZACIÓN
// =====================================================

// Se carga en orden corrrecto, estado guardado, luego se conecta eventos y luego se pintan en UI
function init() {
  loadTasks();
  loadSelectedFilters();
  loadSelectedPriority();
  loadSelectedStatus();
  loadSearchTerm();
  bindDesktopForm();
  bindListEvents();
  bindSearchEvents();
  bindFilterEvents();
  refreshUI();

  if (typeof window.inicializarDrawerFiltrosMovil === 'function') {
    window.inicializarDrawerFiltrosMovil();
  }
}

// =====================================================
// CAPA 11: API PÚBLICA
// =====================================================

// API publica
window.TaskFlowApp = {
  addTaskFromData,
  getDesktopDefaults() {
    return {
      category: categoriaTarea ? categoriaTarea.value : 'Personal',
      priority: prioridadTarea ? prioridadTarea.value : 'Media'
    };
  },

  getFilteredCountByState({ estado = 'all', prioridades = [], categorias = [], busqueda = '' } = {}) {
    const textoBusqueda = normalizeText(busqueda);

    return tasks.filter(task => {
      const taskPriority = normalizePriority(task.priority);
      const taskCategory = String(task.category || '').toLowerCase().trim();
      const searchableText = normalizeText(`${task.title} ${task.category}`);

      const matchesStatus =
        estado === 'all' ||
        (estado === 'pending' && !task.done) ||
        (estado === 'done' && task.done);

      const matchesPriority =
        prioridades.length === 0 || prioridades.includes(taskPriority);

      const matchesCategory =
        categorias.length === 0 || categorias.includes(taskCategory);

      const matchesSearch =
        textoBusqueda === '' || searchableText.includes(textoBusqueda);

      return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
    }).length;
  },
  refreshUI
};

// =====================================================
// CAPA 12: ARRANQUE
// =====================================================

// window.addTask = addTaskFromDesktopForm;
// window.filtrarPorCategorias = refreshUI;
// window.filtrarPorPrioridad = refreshUI;
// window.anadirFiltros = renderSelectedFilters;
// window.actualizarResumenTareas = refreshUI;

document.addEventListener('DOMContentLoaded', init);